import { isShareToken } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { generateShareToken } from './token';

describe('generateShareToken', () => {
  it('produces valid, URL-safe tokens', () => {
    for (let i = 0; i < 50; i++) expect(isShareToken(generateShareToken())).toBe(true);
  });

  it('never repeats', () => {
    const tokens = new Set(Array.from({ length: 1000 }, generateShareToken));
    expect(tokens.size).toBe(1000);
  });
});
