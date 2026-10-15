import { describe, expect, it } from 'vitest';
import { isShareToken, SHARE_TOKEN_LENGTH, shareViewPath } from './share';

describe('isShareToken', () => {
  it('accepts 32 base64url characters', () => {
    expect(isShareToken('aZ09_-'.padEnd(SHARE_TOKEN_LENGTH, 'x'))).toBe(true);
  });

  it('rejects other lengths and characters (e.g. path tricks)', () => {
    expect(isShareToken('short')).toBe(false);
    expect(isShareToken('x'.repeat(SHARE_TOKEN_LENGTH + 1))).toBe(false);
    expect(isShareToken('../'.padEnd(SHARE_TOKEN_LENGTH, 'x'))).toBe(false);
    expect(isShareToken('a+b/'.padEnd(SHARE_TOKEN_LENGTH, 'x'))).toBe(false);
  });
});

describe('shareViewPath', () => {
  it('points at the public viewer route', () => {
    expect(shareViewPath('abc')).toBe('/view/abc');
  });
});
