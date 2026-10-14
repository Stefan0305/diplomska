import { createDefaultScene, sceneSchema, type ProjectDetail } from '@app/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './store';

function makeProject(): ProjectDetail {
  return {
    id: 'p1',
    name: 'Living room',
    createdAt: '2026-10-13T10:00:00.000Z',
    updatedAt: '2026-10-13T11:00:00.000Z',
    thumbnailUrl: null,
    scene: createDefaultScene(),
  };
}

const store = () => useEditorStore.getState();
const env = () => {
  const scene = store().scene;
  if (!scene) throw new Error('no scene loaded');
  return scene.environment;
};

describe('editor store: project lifecycle', () => {
  beforeEach(() => store().reset());

  it('starts empty', () => {
    expect(store().projectId).toBeNull();
    expect(store().scene).toBeNull();
    expect(store().isDirty).toBe(false);
  });

  it('loads a project clean, with no selection', () => {
    store().selectObject('old');
    const project = makeProject();
    store().loadProject(project);
    expect(store()).toMatchObject({
      projectId: 'p1',
      projectName: 'Living room',
      isDirty: false,
      selectedObjectId: null,
      selectedWallId: null,
    });
    expect(store().scene).toEqual(project.scene);
  });

  it('copies the scene, so editing never mutates the cached server data', () => {
    const project = makeProject();
    store().loadProject(project);
    store().setFloorSize(10, 10);
    store().addWall();
    expect(project.scene.environment.width).toBe(6);
    expect(project.scene.environment.walls).toHaveLength(4);
  });

  it('keeps wall and object selection mutually exclusive', () => {
    store().selectObject('o1');
    store().selectWall('w1');
    expect(store()).toMatchObject({ selectedObjectId: null, selectedWallId: 'w1' });
    store().selectObject('o2');
    expect(store()).toMatchObject({ selectedObjectId: 'o2', selectedWallId: null });
  });

  it('ignores edits before a project is loaded', () => {
    store().setFloorSize(10, 10);
    expect(store().addWall()).toBeNull();
    expect(store().scene).toBeNull();
    expect(store().isDirty).toBe(false);
  });

  it('resets to the initial state when leaving the editor', () => {
    store().loadProject(makeProject());
    store().setFloorSize(10, 10);
    store().reset();
    expect(store().projectId).toBeNull();
    expect(store().isDirty).toBe(false);
  });
});

describe('editor store: environment', () => {
  beforeEach(() => {
    store().reset();
    store().loadProject(makeProject());
  });

  it('resizes the floor, moves the perimeter walls with it and marks the scene dirty', () => {
    store().setFloorSize(10, 8);
    expect(env()).toMatchObject({ width: 10, depth: 8 });
    expect(env().walls[0]?.start).toEqual([-5, -4]);
    expect(store().isDirty).toBe(true);
  });

  it('clamps the floor size to 1–200 m', () => {
    store().setFloorSize(0, 999);
    expect(env()).toMatchObject({ width: 1, depth: 200 });
  });

  it('changes the floor material', () => {
    store().setFloorMaterial('tiles');
    expect(env().floorMaterial).toBe('tiles');
  });

  it('applies the exterior preset: no walls, grass, same size', () => {
    store().selectWall(env().walls[0]?.id ?? null);
    store().applyEnvironmentPreset('exterior');
    expect(env()).toMatchObject({ type: 'exterior', width: 6, depth: 5, floorMaterial: 'grass' });
    expect(env().walls).toEqual([]);
    expect(store().selectedWallId).toBeNull();
  });

  it('applies the interior preset: four perimeter walls and parquet', () => {
    store().applyEnvironmentPreset('exterior');
    store().applyEnvironmentPreset('interior');
    expect(env()).toMatchObject({ type: 'interior', floorMaterial: 'parquet' });
    expect(env().walls).toHaveLength(4);
  });

  it('adds a wall and selects it', () => {
    const id = store().addWall();
    expect(env().walls).toHaveLength(5);
    expect(store().selectedWallId).toBe(id);
  });

  it('updates one wall and leaves the others alone', () => {
    const [first, second] = env().walls;
    store().updateWall(first!.id, { height: 3.2, end: [1, 1] });
    expect(env().walls[0]).toMatchObject({ height: 3.2, end: [1, 1] });
    expect(env().walls[1]).toEqual(second);
  });

  it('clamps wall height and thickness and ignores non-finite values', () => {
    const id = env().walls[0]!.id;
    store().updateWall(id, { height: 100, thickness: 0 });
    expect(env().walls[0]).toMatchObject({ height: 20, thickness: 0.01 });
    store().updateWall(id, { height: Number.NaN, start: [Number.POSITIVE_INFINITY, 0] });
    expect(env().walls[0]?.height).toBe(20);
    expect(env().walls[0]?.start.every(Number.isFinite)).toBe(true);
  });

  it('removes a wall and clears its selection', () => {
    const id = env().walls[0]!.id;
    store().selectWall(id);
    store().removeWall(id);
    expect(env().walls.map((w) => w.id)).not.toContain(id);
    expect(store().selectedWallId).toBeNull();
  });

  it('always leaves a scene that passes the shared schema', () => {
    store().setFloorSize(0, 500);
    const id = store().addWall()!;
    store().updateWall(id, { height: -5, thickness: 9 });
    store().applyEnvironmentPreset('exterior');
    store().addWall();
    expect(sceneSchema.safeParse(store().scene).success).toBe(true);
  });
});
