import { describe, expect, it } from 'vitest';
import { normalizeBounds } from './normalize';

describe('normalizeBounds', () => {
  it('leaves a model that is already centred on the floor unchanged', () => {
    expect(normalizeBounds({ min: [-0.5, 0, -0.5], max: [0.5, 1, 0.5] })).toEqual({
      offset: [-0, -0, -0],
      size: [1, 1, 1],
    });
  });

  it('centres an off-centre model and lifts it onto the floor (like test-table.glb)', () => {
    // The generated table: 1.2 x 0.75 x 0.8 m, modelled at x = 2.4..3.6, y = -0.4..0.35.
    const { offset, size } = normalizeBounds({ min: [2.4, -0.4, -2.4], max: [3.6, 0.35, -1.6] });
    expect(offset[0]).toBeCloseTo(-3);
    expect(offset[1]).toBeCloseTo(0.4);
    expect(offset[2]).toBeCloseTo(2);
    expect(size.map((v) => Number(v.toFixed(6)))).toEqual([1.2, 0.75, 0.8]);
  });

  it('puts a floating model down on the floor', () => {
    expect(normalizeBounds({ min: [-1, 2, -1], max: [1, 3, 1] }).offset[1]).toBe(-2);
  });

  it('applying the offset gives a box centred on X/Z with its base at y = 0', () => {
    const bounds = { min: [5, -3, 7], max: [9, 1, 8] } as const;
    const { offset } = normalizeBounds({ min: [...bounds.min], max: [...bounds.max] });
    const min = bounds.min.map((v, i) => v + offset[i]!);
    const max = bounds.max.map((v, i) => v + offset[i]!);
    expect(min[1]).toBe(0);
    expect(min[0]! + max[0]!).toBe(0);
    expect(min[2]! + max[2]!).toBe(0);
  });

  it('handles an empty model (three.js empty Box3 has infinite bounds)', () => {
    expect(
      normalizeBounds({
        min: [Infinity, Infinity, Infinity],
        max: [-Infinity, -Infinity, -Infinity],
      }),
    ).toEqual({ offset: [0, 0, 0], size: [0, 0, 0] });
  });
});
