import { describe, expect, it } from 'vitest';
import { formatFileSize } from './categories';

describe('formatFileSize', () => {
  it('formats kilobytes and megabytes', () => {
    expect(formatFileSize(100)).toBe('1 KB');
    expect(formatFileSize(350 * 1024)).toBe('350 KB');
    expect(formatFileSize(1.25 * 1024 * 1024)).toBe('1.3 MB');
    expect(formatFileSize(20 * 1024 * 1024)).toBe('20 MB');
  });
});
