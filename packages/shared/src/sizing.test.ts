import { describe, expect, it } from 'vitest';
import { OBJECT_SCALE_MAX, OBJECT_SCALE_MIN } from './scene';
import {
  clampScale,
  normalizeAngle,
  scaledSize,
  scaleForTargetSize,
  snapTo,
  toDegrees,
  toRadians,
  type Size3,
} from './sizing';

const sofa: Size3 = [2.4, 0.9, 1.0];

describe('scaleForTargetSize', () => {
  it('resizes a 2.4 m sofa to exactly 2.0 m wide, keeping its proportions', () => {
    const scale = scaleForTargetSize(sofa, 0, 2.0)!;
    expect(scale).toBeCloseTo(2 / 2.4, 12);
    const [w, h, d] = scaledSize(sofa, scale);
    expect(w).toBeCloseTo(2.0, 12);
    expect(h).toBeCloseTo(0.75, 12);
    expect(d).toBeCloseTo(1.0 / 1.2, 12);
  });

  it('works on any axis', () => {
    expect(scaledSize(sofa, scaleForTargetSize(sofa, 1, 1.8)!)[1]).toBeCloseTo(1.8, 12);
    expect(scaledSize(sofa, scaleForTargetSize(sofa, 2, 0.5)!)[2]).toBeCloseTo(0.5, 12);
  });

  it('enlarges as well as shrinks', () => {
    expect(scaleForTargetSize([1, 1, 1], 0, 3)).toBe(3);
  });

  it('rejects zero, negative and non-numeric targets', () => {
    expect(scaleForTargetSize(sofa, 0, 0)).toBeNull();
    expect(scaleForTargetSize(sofa, 0, -2)).toBeNull();
    expect(scaleForTargetSize(sofa, 0, Number.NaN)).toBeNull();
    expect(scaleForTargetSize(sofa, 0, Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('rejects an axis along which the model is flat (native size 0)', () => {
    expect(scaleForTargetSize([2, 0, 1], 1, 1)).toBeNull();
  });

  it('clamps extreme results to the schema limits', () => {
    expect(scaleForTargetSize([0.001, 1, 1], 0, 100)).toBe(OBJECT_SCALE_MAX);
    expect(scaleForTargetSize([100, 1, 1], 0, 0.00001)).toBe(OBJECT_SCALE_MIN);
  });
});

describe('scaledSize / clampScale', () => {
  it('multiplies every axis by the same factor', () => {
    expect(scaledSize([1, 2, 3], 0.5)).toEqual([0.5, 1, 1.5]);
  });

  it('keeps scale within limits', () => {
    expect(clampScale(0)).toBe(OBJECT_SCALE_MIN);
    expect(clampScale(5000)).toBe(OBJECT_SCALE_MAX);
    expect(clampScale(2)).toBe(2);
  });
});

describe('snapTo', () => {
  it('snaps to 0.1 m steps without floating-point noise', () => {
    expect(snapTo(0.34, 0.1)).toBe(0.3);
    expect(snapTo(0.36, 0.1)).toBe(0.4);
    expect(snapTo(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(snapTo(-1.26, 0.1)).toBe(-1.3);
  });

  it('snaps angles to 15 degree steps', () => {
    expect(toDegrees(snapTo(toRadians(52), toRadians(15)))).toBeCloseTo(45, 6);
  });

  it('does nothing when the step is 0', () => {
    expect(snapTo(1.234, 0)).toBe(1.234);
  });
});

describe('angles', () => {
  it('converts between degrees and radians', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI, 12);
    expect(toDegrees(Math.PI / 2)).toBeCloseTo(90, 12);
  });

  it('wraps angles into (-180°, 180°]', () => {
    expect(toDegrees(normalizeAngle(toRadians(270)))).toBeCloseTo(-90, 10);
    expect(toDegrees(normalizeAngle(toRadians(-270)))).toBeCloseTo(90, 10);
    expect(toDegrees(normalizeAngle(toRadians(720 + 30)))).toBeCloseTo(30, 10);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(normalizeAngle(Number.NaN)).toBe(0);
  });
});
