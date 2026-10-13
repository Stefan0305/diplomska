import bcrypt from 'bcryptjs';

const BCRYPT_COST = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/**
 * A valid hash of a random string, compared against when a login email does not exist,
 * so that unknown emails take as long as wrong passwords (no user enumeration via timing).
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);
