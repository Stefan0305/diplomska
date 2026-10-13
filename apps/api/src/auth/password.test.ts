import { describe, expect, it } from 'vitest';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('never stores the plain password', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toContain('secret123');
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
  });

  it('verifies the correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('secret123');
    await expect(verifyPassword('secret123', hash)).resolves.toBe(true);
    await expect(verifyPassword('secret124', hash)).resolves.toBe(false);
  });

  it('salts hashes, so the same password hashes differently', async () => {
    expect(await hashPassword('secret123')).not.toBe(await hashPassword('secret123'));
  });

  it('has a dummy hash that no real password matches', async () => {
    await expect(verifyPassword('secret123', DUMMY_PASSWORD_HASH)).resolves.toBe(false);
  });
});
