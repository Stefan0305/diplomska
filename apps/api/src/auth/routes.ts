import { loginInputSchema, registerInputSchema, type AuthResponse } from '@app/shared';
import { Router, type Response } from 'express';
import type { PrismaClient } from '../generated/prisma/client';
import { HttpError, parseInput } from '../http';
import { AUTH_COOKIE, authCookieOptions, clearAuthCookieOptions } from './cookie';
import { currentUserId, requireAuth } from './middleware';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password';
import { signToken } from './token';
import { toPublicUser } from './user';

const EMAIL_TAKEN = 'An account with this email already exists';
const INVALID_LOGIN = 'Invalid email or password';

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
}

export function createAuthRouter(prisma: PrismaClient, jwtSecret: string): Router {
  const router = Router();

  async function startSession(res: Response, userId: string) {
    res.cookie(AUTH_COOKIE, await signToken(userId, jwtSecret), authCookieOptions);
  }

  router.post('/register', async (req, res) => {
    const input = parseInput(registerInputSchema, req.body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HttpError(409, EMAIL_TAKEN, { email: EMAIL_TAKEN });

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
        },
      });
    } catch (err) {
      // Two simultaneous registrations with the same email: the unique index wins.
      if (isUniqueConstraintError(err))
        throw new HttpError(409, EMAIL_TAKEN, { email: EMAIL_TAKEN });
      throw err;
    }

    await startSession(res, user.id);
    const body: AuthResponse = { user: toPublicUser(user) };
    res.status(201).json(body);
  });

  router.post('/login', async (req, res) => {
    const input = parseInput(loginInputSchema, req.body);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Always run a bcrypt comparison so unknown emails are not faster than wrong passwords.
    const passwordOk = await verifyPassword(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !passwordOk) throw new HttpError(401, INVALID_LOGIN);

    await startSession(res, user.id);
    const body: AuthResponse = { user: toPublicUser(user) };
    res.json(body);
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions);
    res.status(204).end();
  });

  router.get('/me', requireAuth(jwtSecret), async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: currentUserId(req) } });
    if (!user) {
      // Valid token for a user that no longer exists (e.g. after a database reset).
      res.clearCookie(AUTH_COOKIE, clearAuthCookieOptions);
      throw new HttpError(401, 'Not authenticated');
    }
    const body: AuthResponse = { user: toPublicUser(user) };
    res.json(body);
  });

  return router;
}
