import { describe, expect, it } from 'vitest';
import { fileNameFor } from './download';

describe('fileNameFor', () => {
  it('turns a project name into a lowercase slug', () => {
    expect(fileNameFor('Living room #2', 'png')).toBe('living-room-2.png');
  });

  it('removes accents and strips separators at the ends', () => {
    expect(fileNameFor('  Čajna kuhinja! ', 'png')).toBe('cajna-kuhinja.png');
  });

  it('falls back to "design" when nothing usable is left', () => {
    expect(fileNameFor('???', 'png')).toBe('design.png');
  });
});
