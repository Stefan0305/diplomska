import {
  OBJECT_ELEVATION_MAX,
  OBJECT_ELEVATION_MIN,
  OBJECT_SCALE_MAX,
  OBJECT_SCALE_MIN,
} from './scene';

/**
 * Real-world sizing and transform helpers (pure, unit tested).
 *
 * Every model has a native size [width (X), height (Y), depth (Z)] measured from its bounding
 * box when it loads. An object's real size is `native × scale`, with one uniform scale factor
 * so proportions are always kept. To give an object a target size along one axis:
 *
 *   scale = target / native[axis]
 *
 * Example: a sofa modelled 2.4 m wide should be 2.0 m wide -> scale = 2.0 / 2.4 = 0.8333,
 * so its 0.9 m height becomes 0.9 × 0.8333 = 0.75 m.
 */

export type Size3 = [number, number, number];
/** 0 = width (X), 1 = height (Y), 2 = depth (Z). */
export type SizeAxis = 0 | 1 | 2;

export function clampScale(scale: number): number {
  return Math.min(OBJECT_SCALE_MAX, Math.max(OBJECT_SCALE_MIN, scale));
}

/** Keep an object's base between the floor and the elevation limit. */
export function clampElevation(y: number): number {
  return Math.min(OBJECT_ELEVATION_MAX, Math.max(OBJECT_ELEVATION_MIN, y));
}

/** The object's current real-world size in metres. */
export function scaledSize(native: Size3, scale: number): Size3 {
  return [native[0] * scale, native[1] * scale, native[2] * scale];
}

/**
 * Uniform scale that makes the given axis exactly `target` metres, or null when that is
 * impossible (flat model along that axis, or a non-positive / non-numeric target).
 * The result is clamped to the scene schema's scale limits.
 */
export function scaleForTargetSize(native: Size3, axis: SizeAxis, target: number): number | null {
  const nativeAxis = native[axis];
  if (!Number.isFinite(target) || target <= 0) return null;
  if (!Number.isFinite(nativeAxis) || nativeAxis <= 0) return null;
  return clampScale(target / nativeAxis);
}

/** Round to the nearest multiple of `step` (step <= 0 disables snapping). */
export function snapTo(value: number, step: number): number {
  if (step <= 0) return value;
  // Rounding the quotient first avoids 0.30000000000000004-style results.
  return Number((Math.round(value / step) * step).toFixed(10));
}

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
export const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/** Wrap an angle into (-π, π], so rotations never grow without bound. */
export function normalizeAngle(radians: number): number {
  if (!Number.isFinite(radians)) return 0;
  const wrapped = radians - 2 * Math.PI * Math.floor((radians + Math.PI) / (2 * Math.PI));
  return wrapped === -Math.PI ? Math.PI : wrapped;
}
