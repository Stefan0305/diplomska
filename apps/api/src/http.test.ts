import { registerInputSchema } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { HttpError, parseInput } from './http';

describe('parseInput', () => {
  it('returns the parsed (normalized) data for valid input', () => {
    const data = parseInput(registerInputSchema, {
      name: 'Ana',
      email: 'ANA@example.com',
      password: 'secret123',
    });
    expect(data.email).toBe('ana@example.com');
  });

  it('throws a 400 HttpError with one message per invalid field', () => {
    try {
      parseInput(registerInputSchema, { name: '', email: 'nope', password: 'x' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      const httpError = err as HttpError;
      expect(httpError.status).toBe(400);
      expect(Object.keys(httpError.fields ?? {}).sort()).toEqual(['email', 'name', 'password']);
    }
  });

  it('handles a non-object body', () => {
    expect(() => parseInput(registerInputSchema, undefined)).toThrow(HttpError);
  });
});
