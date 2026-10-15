import { randomBytes } from 'node:crypto';
import { SHARE_TOKEN_LENGTH } from '@app/shared';

/** An unguessable share token: 24 random bytes as base64url (32 URL-safe characters). */
export function generateShareToken(): string {
  const token = randomBytes(24).toString('base64url');
  if (token.length !== SHARE_TOKEN_LENGTH) throw new Error('Unexpected share token length');
  return token;
}
