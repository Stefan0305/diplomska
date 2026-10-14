import { describe, expect, it } from 'vitest';
import {
  clampFloorSize,
  createEnvironmentPreset,
  createPerimeterWalls,
  createWall,
  resizeEnvironment,
  wallLength,
  wallTransform,
} from './environment';
import { environmentSchema, type Wall } from './scene';

const wall = (start: [number, number], end: [number, number]): Wall => ({
  id: 'w',
  start,
  end,
  height: 2.5,
  thickness: 0.2,
});

describe('createPerimeterWalls', () => {
  it('creates four walls that follow the floor edges and form a closed loop', () => {
    const walls = createPerimeterWalls(6, 4);
    expect(walls.map((w) => [w.start, w.end])).toEqual([
      [
        [-3, -2],
        [3, -2],
      ],
      [
        [3, -2],
        [3, 2],
      ],
      [
        [3, 2],
        [-3, 2],
      ],
      [
        [-3, 2],
        [-3, -2],
      ],
    ]);
  });

  it('gives every wall a unique id', () => {
    const ids = createPerimeterWalls(6, 4).map((w) => w.id);
    expect(new Set(ids).size).toBe(4);
  });
});

describe('createEnvironmentPreset', () => {
  it('interior: keeps the size, adds four walls and a parquet floor', () => {
    const env = createEnvironmentPreset('interior', 8, 5);
    expect(env).toMatchObject({ type: 'interior', width: 8, depth: 5, floorMaterial: 'parquet' });
    expect(env.walls).toHaveLength(4);
    expect(environmentSchema.safeParse(env).success).toBe(true);
  });

  it('exterior: keeps the size, no walls and a grass floor', () => {
    const env = createEnvironmentPreset('exterior', 20, 15);
    expect(env).toEqual({
      type: 'exterior',
      width: 20,
      depth: 15,
      floorMaterial: 'grass',
      walls: [],
    });
  });
});

describe('clampFloorSize', () => {
  it('keeps the size between 1 and 200 m', () => {
    expect(clampFloorSize(0)).toBe(1);
    expect(clampFloorSize(-5)).toBe(1);
    expect(clampFloorSize(500)).toBe(200);
    expect(clampFloorSize(12.5)).toBe(12.5);
    expect(clampFloorSize(Number.NaN)).toBe(1);
  });
});

describe('resizeEnvironment', () => {
  it('moves perimeter walls so they stay on the new floor edges', () => {
    const env = createEnvironmentPreset('interior', 6, 4);
    const resized = resizeEnvironment(env, 12, 2);
    expect(resized.width).toBe(12);
    expect(resized.depth).toBe(2);
    expect(resized.walls.map((w) => w.start)).toEqual([
      [-6, -1],
      [6, -1],
      [6, 1],
      [-6, 1],
    ]);
  });

  it('keeps inner walls at the same relative position and keeps their height', () => {
    const env = { ...createEnvironmentPreset('exterior', 10, 10), walls: [wall([1, 2], [3, 2])] };
    const resized = resizeEnvironment(env, 20, 5);
    expect(resized.walls[0]).toMatchObject({ start: [2, 1], end: [6, 1], height: 2.5 });
  });

  it('clamps the new size', () => {
    const resized = resizeEnvironment(createEnvironmentPreset('exterior', 10, 10), 0, 1000);
    expect([resized.width, resized.depth]).toEqual([1, 200]);
  });

  it('does not mutate the original environment', () => {
    const env = createEnvironmentPreset('interior', 6, 4);
    const before = structuredClone(env);
    resizeEnvironment(env, 12, 8);
    expect(env).toEqual(before);
  });
});

describe('wall geometry', () => {
  it('measures the length between start and end', () => {
    expect(wallLength(wall([0, 0], [3, 4]))).toBe(5);
  });

  it('places a wall along +X: centred, standing on the floor, not rotated', () => {
    const t = wallTransform(wall([-2, 1], [2, 1]));
    expect(t.position).toEqual([0, 1.25, 1]);
    expect(t.rotationY).toBeCloseTo(0);
    // Length is extended by the thickness so corners close without a gap.
    expect(t.size).toEqual([4.2, 2.5, 0.2]);
  });

  it('rotates a wall along +Z by -90 degrees (three.js Y rotation convention)', () => {
    const t = wallTransform(wall([0, 0], [0, 3]));
    expect(t.rotationY).toBeCloseTo(-Math.PI / 2);
    expect(t.position).toEqual([0, 1.25, 1.5]);
  });

  it('rotated box direction matches the wall direction', () => {
    const w = wall([1, 1], [4, 5]);
    const { rotationY } = wallTransform(w);
    // three.js: rotating (1, 0, 0) by θ around Y gives (cos θ, 0, -sin θ).
    const dir = [Math.cos(rotationY), -Math.sin(rotationY)];
    expect(dir[0]).toBeCloseTo(3 / 5);
    expect(dir[1]).toBeCloseTo(4 / 5);
  });
});

describe('createWall', () => {
  it('creates a valid 3 m wall across the middle', () => {
    const w = createWall();
    expect(wallLength(w)).toBe(3);
    expect(createWall().id).not.toBe(w.id);
  });
});
