import { describe, expect, it } from 'vitest';
import { signToken, TOKEN_LIFETIME_SECONDS, verifyToken } from './token';

const SECRET = 'a-test-secret-that-is-long-enough';

describe('session tokens', () => {
  it('round-trips the user id', async () => {
    const token = await signToken('user-1', SECRET);
    await expect(verifyToken(token, SECRET)).resolves.toBe('user-1');
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signToken('user-1', 'another-secret-that-is-long-enough');
    await expect(verifyToken(token, SECRET)).resolves.toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = await signToken('user-1', SECRET);
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'admin' })).toString('base64url');
    await expect(
      verifyToken(`${header}.${forgedPayload}.${signature}`, SECRET),
    ).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const issued = new Date('2026-01-01T00:00:00Z');
    const token = await signToken('user-1', SECRET, issued);
    const afterExpiry = new Date(issued.getTime() + (TOKEN_LIFETIME_SECONDS + 1) * 1000);
    await expect(verifyToken(token, SECRET, afterExpiry)).resolves.toBeNull();
  });

  it('returns null for a missing or garbage token', async () => {
    await expect(verifyToken(undefined, SECRET)).resolves.toBeNull();
    await expect(verifyToken('not.a.jwt', SECRET)).resolves.toBeNull();
  });
});
