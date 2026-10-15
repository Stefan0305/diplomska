import { createDefaultScene, sceneSchema, type ProjectDetail } from '@app/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { DUPLICATE_OFFSET, MAX_OBJECTS, useEditorStore } from './store';

function makeProject(): ProjectDetail {
  return {
    id: 'p1',
    name: 'Living room',
    createdAt: '2026-10-13T10:00:00.000Z',
    updatedAt: '2026-10-13T11:00:00.000Z',
    thumbnailUrl: null,
    shareToken: null,
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

describe('editor store: objects', () => {
  beforeEach(() => {
    store().reset();
    store().loadProject(makeProject());
  });
  const objects = () => store().scene?.objects ?? [];

  it('places a model at the centre of the floor, unrotated and unscaled, and selects it', () => {
    const id = store().addObject('model-1');
    expect(objects()).toEqual([
      { id, modelId: 'model-1', position: [0, 0, 0], rotationY: 0, scale: 1 },
    ]);
    expect(store().selectedObjectId).toBe(id);
    expect(store().isDirty).toBe(true);
  });

  it('gives each placed object its own id, even for the same model', () => {
    const a = store().addObject('model-1');
    const b = store().addObject('model-1');
    expect(a).not.toBe(b);
    expect(objects()).toHaveLength(2);
  });

  it('refuses to add more objects than the scene schema allows', () => {
    for (let i = 0; i < MAX_OBJECTS; i++) store().addObject('m');
    expect(store().addObject('m')).toBeNull();
    expect(objects()).toHaveLength(MAX_OBJECTS);
    expect(sceneSchema.safeParse(store().scene).success).toBe(true);
  });

  it('removes all objects of a deleted model and clears their selection', () => {
    store().addObject('keep');
    store().addObject('gone');
    const selected = store().addObject('gone');
    expect(store().selectedObjectId).toBe(selected);

    expect(store().removeObjectsByModel('gone')).toBe(2);
    expect(objects().map((o) => o.modelId)).toEqual(['keep']);
    expect(store().selectedObjectId).toBeNull();
  });

  it('returns 0 and changes nothing when the model is not used', () => {
    store().addObject('keep');
    useEditorStore.setState({ isDirty: false });
    expect(store().removeObjectsByModel('other')).toBe(0);
    expect(store().isDirty).toBe(false);
  });

  it('clears any selection', () => {
    store().addObject('m');
    store().clearSelection();
    expect(store()).toMatchObject({ selectedObjectId: null, selectedWallId: null });
  });
});

describe('editor store: transforms', () => {
  let id: string;
  beforeEach(() => {
    store().reset();
    store().loadProject(makeProject());
    id = store().addObject('model-1')!;
  });
  const object = (objectId = id) => store().scene?.objects.find((o) => o.id === objectId);

  it('moves an object and keeps it on the floor (y forced to 0)', () => {
    store().updateObject(id, { position: [1.5, 2, -3] });
    expect(object()?.position).toEqual([1.5, 0, -3]);
  });

  it('rotates around Y and wraps the angle into (-π, π]', () => {
    store().updateObject(id, { rotationY: (3 * Math.PI) / 2 });
    expect(object()?.rotationY).toBeCloseTo(-Math.PI / 2, 12);
  });

  it('rescales uniformly within the schema limits', () => {
    store().updateObject(id, { scale: 0.75 });
    expect(object()?.scale).toBe(0.75);
    store().updateObject(id, { scale: 99999 });
    expect(object()?.scale).toBe(1000);
  });

  it('ignores invalid values instead of corrupting the scene', () => {
    store().updateObject(id, {
      position: [Number.NaN, 0, 0],
      rotationY: Number.POSITIVE_INFINITY,
      scale: -2,
    });
    expect(object()).toMatchObject({ position: [0, 0, 0], rotationY: 0, scale: 1 });
    store().updateObject(id, { scale: 0 });
    expect(object()?.scale).toBe(1);
  });

  it('only changes the targeted object', () => {
    const other = store().addObject('model-2')!;
    store().updateObject(id, { position: [4, 0, 4] });
    expect(object(other)?.position).toEqual([0, 0, 0]);
  });

  it('removes an object and clears its selection', () => {
    store().selectObject(id);
    store().removeObject(id);
    expect(object()).toBeUndefined();
    expect(store().selectedObjectId).toBeNull();
  });

  it('duplicates next to the original with the same rotation and scale, and selects the copy', () => {
    store().updateObject(id, { position: [1, 0, 2], rotationY: 0.5, scale: 2 });
    const copyId = store().duplicateObject(id)!;
    expect(copyId).not.toBe(id);
    expect(object(copyId)).toMatchObject({
      modelId: 'model-1',
      position: [1 + DUPLICATE_OFFSET, 0, 2 + DUPLICATE_OFFSET],
      rotationY: 0.5,
      scale: 2,
    });
    expect(store().selectedObjectId).toBe(copyId);
  });

  it('returns null when duplicating an unknown object', () => {
    expect(store().duplicateObject('nope')).toBeNull();
  });

  it('keeps gizmo settings across projects', () => {
    store().setTransformMode('rotate');
    store().setSnapEnabled(false);
    store().loadProject(makeProject());
    expect(store()).toMatchObject({ transformMode: 'rotate', snapEnabled: false });
  });

  it('always leaves a schema-valid scene', () => {
    store().updateObject(id, { position: [1e6, -5, 3], rotationY: 100, scale: 1e-9 });
    store().duplicateObject(id);
    expect(sceneSchema.safeParse(store().scene).success).toBe(true);
  });
});

describe('editor store: saving', () => {
  beforeEach(() => {
    store().reset();
    store().loadProject(makeProject());
  });

  it('bumps the revision on every edit, starting from 0 after loading', () => {
    expect(store().revision).toBe(0);
    store().setFloorSize(8, 8);
    const id = store().addObject('m1');
    store().updateObject(id ?? '', { scale: 2 });
    expect(store().revision).toBe(3);
  });

  it('clears isDirty when the saved revision is still the latest', () => {
    store().setFloorSize(8, 8);
    store().markSaved(store().revision);
    expect(store().isDirty).toBe(false);
  });

  it('stays dirty when edits happened while the save was in flight', () => {
    store().setFloorSize(8, 8);
    const saving = store().revision;
    store().setFloorMaterial('tiles');
    store().markSaved(saving);
    expect(store().isDirty).toBe(true);
  });

  it('removes objects whose model was deleted and clears their selection', () => {
    store().addObject('kept');
    const gone = store().addObject('deleted') ?? '';
    expect(store().selectedObjectId).toBe(gone);
    expect(store().removeMissingObjects(new Set(['kept']))).toBe(1);
    expect(store().scene?.objects.map((o) => o.modelId)).toEqual(['kept']);
    expect(store().selectedObjectId).toBeNull();
    expect(store().removeMissingObjects(new Set(['kept']))).toBe(0);
  });
});
