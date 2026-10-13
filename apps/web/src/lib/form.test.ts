import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { applyServerErrors } from './form';

type Fields = { email: string; password: string };
const fieldNames = ['email', 'password'] as const;

describe('applyServerErrors', () => {
  it('puts known field errors on their fields and returns no form message', () => {
    const setError = vi.fn();
    const message = applyServerErrors<Fields>(
      new ApiError(409, 'Taken', { email: 'Email taken' }),
      setError,
      fieldNames,
    );
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Email taken' });
    expect(message).toBeNull();
  });

  it('returns the server message when there are no field errors', () => {
    const setError = vi.fn();
    const message = applyServerErrors<Fields>(
      new ApiError(401, 'Invalid email or password'),
      setError,
      fieldNames,
    );
    expect(setError).not.toHaveBeenCalled();
    expect(message).toBe('Invalid email or password');
  });

  it('ignores field errors for fields the form does not have', () => {
    const setError = vi.fn();
    const message = applyServerErrors<Fields>(
      new ApiError(400, 'Invalid input', { other: 'x' }),
      setError,
      fieldNames,
    );
    expect(setError).not.toHaveBeenCalled();
    expect(message).toBe('Invalid input');
  });

  it('gives a helpful message for network failures', () => {
    expect(
      applyServerErrors<Fields>(new TypeError('Failed to fetch'), vi.fn(), fieldNames),
    ).toMatch(/API/);
  });
});
