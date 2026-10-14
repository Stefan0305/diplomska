import { describe, expect, it } from 'vitest';
import { coverCrop } from './capture';

describe('coverCrop', () => {
  it('crops the sides of a wide canvas to fit a narrower image', () => {
    expect(coverCrop(1600, 600, 480, 300)).toEqual({ x: 320, y: 0, width: 960, height: 600 });
  });

  it('crops top and bottom of a tall canvas', () => {
    expect(coverCrop(800, 1000, 480, 300)).toEqual({ x: 0, y: 250, width: 800, height: 500 });
  });

  it('keeps the whole canvas when the aspect ratios match', () => {
    expect(coverCrop(960, 600, 480, 300)).toEqual({ x: 0, y: 0, width: 960, height: 600 });
  });
});
