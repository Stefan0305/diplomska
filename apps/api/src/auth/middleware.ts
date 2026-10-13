import type { Request, RequestHandler } from 'express';
import { HttpError } from '../http';
import { AUTH_COOKIE } from './cookie';
import { verifyToken } from './token';

/** Rejects the request with 401 unless it carries a valid session cookie; sets req.userId. */
export function requireAuth(jwtSecret: string): RequestHandler {
  return async (req, _res, next) => {
    const userId = await verifyToken(req.cookies?.[AUTH_COOKIE], jwtSecret);
    if (!userId) throw new HttpError(401, 'Not authenticated');
    req.userId = userId;
    next();
  };
}

/** The authenticated user id; only call in handlers behind requireAuth. */
export function currentUserId(req: Request): string {
  if (!req.userId) throw new HttpError(401, 'Not authenticated');
  return req.userId;
}
