import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './time';

const now = new Date('2026-10-13T12:00:00Z');
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

describe('formatRelativeTime', () => {
  it('says "just now" for the last minute', () => {
    expect(formatRelativeTime(ago(30), now)).toBe('just now');
  });

  it('uses the largest fitting unit', () => {
    expect(formatRelativeTime(ago(5 * 60), now)).toBe('5 minutes ago');
    expect(formatRelativeTime(ago(3 * 60 * 60), now)).toBe('3 hours ago');
    expect(formatRelativeTime(ago(24 * 60 * 60), now)).toBe('yesterday');
    expect(formatRelativeTime(ago(14 * 24 * 60 * 60), now)).toBe('2 weeks ago');
  });
});
