import { describe, expect, it } from 'vitest';
import { createProjectInputSchema } from './project';
import { createDefaultScene } from './environment';
import { OBJECT_ELEVATION_MAX, SCENE_VERSION, sceneSchema } from './scene';

describe('createDefaultScene', () => {
  it('produces a valid scene: an empty 6 x 5 m room with four walls', () => {
    const scene = createDefaultScene();
    expect(sceneSchema.parse(scene)).toEqual(scene);
    expect(scene.version).toBe(SCENE_VERSION);
    expect(scene.objects).toEqual([]);
    expect(scene.environment).toMatchObject({ type: 'interior', width: 6, depth: 5 });
    expect(scene.environment.walls).toHaveLength(4);
  });

  it('returns a fresh object every time (no shared mutable state)', () => {
    const a = createDefaultScene();
    const b = createDefaultScene();
    a.objects.push({ id: 'o1', modelId: 'm1', position: [0, 0, 0], rotationY: 0, scale: 1 });
    expect(b.objects).toEqual([]);
  });
});

describe('sceneSchema', () => {
  const valid = createDefaultScene();

  it('accepts objects with a position, Y rotation and uniform scale', () => {
    const scene = {
      ...valid,
      objects: [{ id: 'o1', modelId: 'm1', position: [1, 0, -2], rotationY: 1.57, scale: 0.5 }],
    };
    expect(sceneSchema.safeParse(scene).success).toBe(true);
  });

  it('rejects an unknown version', () => {
    expect(sceneSchema.safeParse({ ...valid, version: 99 }).success).toBe(false);
  });

  it('rejects non-finite numbers and a zero scale', () => {
    const object = { id: 'o1', modelId: 'm1', position: [0, 0, 0], rotationY: 0, scale: 1 };
    const withObject = (o: object) => ({ ...valid, objects: [{ ...object, ...o }] });
    expect(sceneSchema.safeParse(withObject({ position: [Infinity, 0, 0] })).success).toBe(false);
    expect(sceneSchema.safeParse(withObject({ scale: 0 })).success).toBe(false);
  });

  it('accepts a raised object (wall-mounted) but not one below the floor or too high', () => {
    const object = { id: 'o1', modelId: 'm1', position: [0, 0, 0], rotationY: 0, scale: 1 };
    const withY = (y: number) => ({ ...valid, objects: [{ ...object, position: [0, y, 0] }] });
    expect(sceneSchema.safeParse(withY(1.5)).success).toBe(true);
    expect(sceneSchema.safeParse(withY(-0.1)).success).toBe(false);
    expect(sceneSchema.safeParse(withY(OBJECT_ELEVATION_MAX + 1)).success).toBe(false);
  });

  it('rejects an environment larger than 200 m', () => {
    const scene = { ...valid, environment: { ...valid.environment, width: 500 } };
    expect(sceneSchema.safeParse(scene).success).toBe(false);
  });

  it('rejects an unknown floor material', () => {
    const scene = { ...valid, environment: { ...valid.environment, floorMaterial: 'lava' } };
    expect(sceneSchema.safeParse(scene).success).toBe(false);
  });
});

describe('createProjectInputSchema', () => {
  it('trims the name', () => {
    expect(createProjectInputSchema.parse({ name: '  Living room  ' }).name).toBe('Living room');
  });

  it('rejects a blank or too long name', () => {
    expect(createProjectInputSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(createProjectInputSchema.safeParse({ name: 'x'.repeat(81) }).success).toBe(false);
  });
});
