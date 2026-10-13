import { describe, expect, it } from 'vitest';
import { loginInputSchema, registerInputSchema } from './auth';

const validRegister = { name: 'Ana', email: 'ana@example.com', password: 'secret123' };

describe('registerInputSchema', () => {
  it('accepts valid input', () => {
    expect(registerInputSchema.safeParse(validRegister).success).toBe(true);
  });

  it('trims and lowercases the email and trims the name', () => {
    const parsed = registerInputSchema.parse({
      ...validRegister,
      name: '  Ana  ',
      email: '  Ana@Example.COM ',
    });
    expect(parsed.email).toBe('ana@example.com');
    expect(parsed.name).toBe('Ana');
  });

  it('rejects an invalid email', () => {
    expect(registerInputSchema.safeParse({ ...validRegister, email: 'not-an-email' }).success).toBe(
      false,
    );
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = registerInputSchema.safeParse({ ...validRegister, password: 'short' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['password']);
  });

  it('rejects a password longer than 72 characters (bcrypt limit)', () => {
    const result = registerInputSchema.safeParse({ ...validRegister, password: 'a'.repeat(73) });
    expect(result.success).toBe(false);
  });

  it('rejects a blank name', () => {
    expect(registerInputSchema.safeParse({ ...validRegister, name: '   ' }).success).toBe(false);
  });
});

describe('loginInputSchema', () => {
  it('normalizes the email so login matches registration', () => {
    const parsed = loginInputSchema.parse({ email: 'ANA@example.com', password: 'x' });
    expect(parsed.email).toBe('ana@example.com');
  });

  it('requires a password', () => {
    expect(loginInputSchema.safeParse({ email: 'ana@example.com', password: '' }).success).toBe(
      false,
    );
  });
});
