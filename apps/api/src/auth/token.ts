import { jwtVerify, SignJWT } from 'jose';

export const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60; // 7 days
const ALGORITHM = 'HS256';

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Sign a session token whose subject is the user id. */
export function signToken(userId: string, secret: string, now = new Date()): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT()
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TOKEN_LIFETIME_SECONDS)
    .sign(key(secret));
}

/** Return the user id from a valid token, or null if it is missing, tampered with or expired. */
export async function verifyToken(
  token: string | undefined,
  secret: string,
  now = new Date(),
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: [ALGORITHM],
      currentDate: now,
    });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
