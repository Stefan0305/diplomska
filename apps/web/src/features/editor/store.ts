import {
  clampScale,
  createEnvironmentPreset,
  normalizeAngle,
  createWall,
  resizeEnvironment,
  WALL_HEIGHT_MAX,
  WALL_HEIGHT_MIN,
  WALL_THICKNESS_MAX,
  WALL_THICKNESS_MIN,
  type Environment,
  type EnvironmentType,
  type FloorMaterial,
  type ProjectDetail,
  type Scene,
  type SceneObject,
  type Wall,
} from '@app/shared';
import { create } from 'zustand';

export type WallPatch = Partial<Omit<Wall, 'id'>>;
export type ObjectPatch = Partial<Pick<SceneObject, 'position' | 'rotationY' | 'scale'>>;
export type TransformMode = 'translate' | 'rotate';

/** Offset of a duplicate from its original, so the copy is visible next to it. */
export const DUPLICATE_OFFSET = 0.5;

/** Undo keeps at most this many steps (a scene is a few KB, so this stays small). */
export const HISTORY_LIMIT = 100;

/**
 * Live editor state. React Three Fiber components render from it and editing actions write to
 * it; saving serializes `scene`. Every edit sets `isDirty` and bumps `revision`, so a save can
 * tell whether more edits happened while its request was in flight.
 *
 * Undo history is a list of whole-scene snapshots (scenes are immutable, so a snapshot is just
 * a reference). It lives only in this tab and is cleared when another project is loaded.
 */
export interface EditorState {
  projectId: string | null;
  projectName: string;
  scene: Scene | null;
  isDirty: boolean;
  /** Counts edits since the project was loaded. */
  revision: number;
  selectedObjectId: string | null;
  selectedWallId: string | null;
  /** Scenes before (oldest first) and after the current one, for undo and redo. */
  past: Scene[];
  future: Scene[];
  /** True during a gizmo drag: its many small updates become one undo step. */
  inGesture: boolean;
  /** Gizmo settings: kept across projects, not saved. */
  transformMode: TransformMode;
  snapEnabled: boolean;

  loadProject: (project: ProjectDetail) => void;
  reset: () => void;
  /** A save of the scene at `revision` succeeded; clears `isDirty` unless newer edits exist. */
  markSaved: (revision: number) => void;
  selectObject: (id: string | null) => void;
  selectWall: (id: string | null) => void;
  clearSelection: () => void;

  setFloorSize: (width: number, depth: number) => void;
  setFloorMaterial: (material: FloorMaterial) => void;
  /** Switch interior/exterior and replace walls and floor material with that type's preset. */
  applyEnvironmentPreset: (type: EnvironmentType) => void;
  /** Adds a wall, selects it and returns its id. */
  addWall: () => string | null;
  updateWall: (id: string, patch: WallPatch) => void;
  removeWall: (id: string) => void;

  /** Place a model at the centre of the floor and select it; returns the new object id. */
  addObject: (modelId: string) => string | null;
  /** Remove every object that uses a model (after the model is deleted); returns the count. */
  removeObjectsByModel: (modelId: string) => number;
  /** Move, rotate or rescale an object; values are kept valid (on the floor, angle wrapped). */
  updateObject: (id: string, patch: ObjectPatch) => void;
  removeObject: (id: string) => void;
  /** Copy an object next to the original and select the copy; returns its id. */
  duplicateObject: (id: string) => string | null;
  /** Remove objects whose model no longer exists (deleted since saving); returns the count. */
  removeMissingObjects: (existingModelIds: ReadonlySet<string>) => number;

  undo: () => void;
  redo: () => void;
  /** Start a continuous edit (gizmo drag); the edits until endGesture form one undo step. */
  beginGesture: () => void;
  endGesture: () => void;

  setTransformMode: (mode: TransformMode) => void;
  setSnapEnabled: (enabled: boolean) => void;
}

/** The scene schema allows at most this many objects. */
export const MAX_OBJECTS = 500;

const initialState = {
  projectId: null,
  projectName: '',
  scene: null,
  isDirty: false,
  revision: 0,
  selectedObjectId: null,
  selectedWallId: null,
  past: [],
  future: [],
  inGesture: false,
} satisfies Partial<EditorState>;

/** Drop selections that point at objects or walls missing from a scene (after undo/redo). */
function validSelection(scene: Scene, objectId: string | null, wallId: string | null) {
  return {
    selectedObjectId: objectId && scene.objects.some((o) => o.id === objectId) ? objectId : null,
    selectedWallId: wallId && scene.environment.walls.some((w) => w.id === wallId) ? wallId : null,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Keep a patch inside the scene schema's limits so the scene always stays valid. */
function sanitizeWallPatch(patch: WallPatch): WallPatch {
  const result: WallPatch = {};
  if (patch.start && patch.start.every(Number.isFinite)) result.start = patch.start;
  if (patch.end && patch.end.every(Number.isFinite)) result.end = patch.end;
  if (patch.height !== undefined && Number.isFinite(patch.height)) {
    result.height = clamp(patch.height, WALL_HEIGHT_MIN, WALL_HEIGHT_MAX);
  }
  if (patch.thickness !== undefined && Number.isFinite(patch.thickness)) {
    result.thickness = clamp(patch.thickness, WALL_THICKNESS_MIN, WALL_THICKNESS_MAX);
  }
  return result;
}

/**
 * Keep an object valid: it always stands on the floor (y = 0, a deliberate simplification),
 * its angle is wrapped into (-π, π] and its scale stays within the schema limits.
 */
function sanitizeObjectPatch(patch: ObjectPatch): ObjectPatch {
  const result: ObjectPatch = {};
  if (patch.position && patch.position.every(Number.isFinite)) {
    result.position = [patch.position[0], 0, patch.position[2]];
  }
  if (patch.rotationY !== undefined && Number.isFinite(patch.rotationY)) {
    result.rotationY = normalizeAngle(patch.rotationY);
  }
  if (patch.scale !== undefined && Number.isFinite(patch.scale) && patch.scale > 0) {
    result.scale = clampScale(patch.scale);
  }
  return result;
}

export const useEditorStore = create<EditorState>()((set, get) => {
  /**
   * Every scene edit goes through here: it records the previous scene for undo (once per
   * gesture), clears the redo list, and marks the project dirty.
   */
  function commit(next: Scene) {
    const { scene, past, inGesture, revision } = get();
    if (!scene) return;
    set({
      scene: next,
      ...(!inGesture && { past: [...past, scene].slice(-HISTORY_LIMIT), future: [] }),
      isDirty: true,
      revision: revision + 1,
    });
  }

  /** Apply a change to the environment (no-op before a project is loaded). */
  function editEnvironment(change: (env: Environment) => Environment) {
    const { scene } = get();
    if (scene) commit({ ...scene, environment: change(scene.environment) });
  }

  /** Apply a change to the object list (no-op before a project is loaded). */
  function editObjects(change: (objects: SceneObject[]) => SceneObject[]) {
    const { scene } = get();
    if (scene) commit({ ...scene, objects: change(scene.objects) });
  }

  /** Step back (undo) or forward (redo): the current scene moves to the other list. */
  function travel(direction: 'undo' | 'redo') {
    const { scene, past, future, revision, selectedObjectId, selectedWallId, inGesture } = get();
    const source = direction === 'undo' ? past : future;
    // Not in the middle of a drag: the gizmo would keep writing over the restored scene.
    if (!scene || inGesture || source.length === 0) return;
    const target = direction === 'undo' ? source[source.length - 1]! : source[0]!;
    set({
      scene: target,
      past: direction === 'undo' ? past.slice(0, -1) : [...past, scene],
      future: direction === 'undo' ? [scene, ...future] : future.slice(1),
      isDirty: true,
      revision: revision + 1,
      ...validSelection(target, selectedObjectId, selectedWallId),
    });
  }

  return {
    ...initialState,
    transformMode: 'translate',
    snapEnabled: true,

    loadProject: (project) =>
      set({
        ...initialState,
        projectId: project.id,
        projectName: project.name,
        // A copy, so editing never mutates TanStack Query's cached server data.
        scene: structuredClone(project.scene),
      }),

    reset: () => set(initialState),

    markSaved: (revision) => {
      if (get().revision === revision) set({ isDirty: false });
    },

    selectObject: (id) => set({ selectedObjectId: id, selectedWallId: null }),
    selectWall: (id) => set({ selectedWallId: id, selectedObjectId: null }),
    clearSelection: () => set({ selectedObjectId: null, selectedWallId: null }),

    setFloorSize: (width, depth) => editEnvironment((env) => resizeEnvironment(env, width, depth)),

    setFloorMaterial: (material) => editEnvironment((env) => ({ ...env, floorMaterial: material })),

    applyEnvironmentPreset: (type) => {
      editEnvironment((env) => createEnvironmentPreset(type, env.width, env.depth));
      set({ selectedWallId: null });
    },

    addWall: () => {
      if (!get().scene) return null;
      const wall = createWall();
      editEnvironment((env) => ({ ...env, walls: [...env.walls, wall] }));
      set({ selectedWallId: wall.id, selectedObjectId: null });
      return wall.id;
    },

    updateWall: (id, patch) => {
      const safe = sanitizeWallPatch(patch);
      editEnvironment((env) => ({
        ...env,
        walls: env.walls.map((wall) => (wall.id === id ? { ...wall, ...safe } : wall)),
      }));
    },

    removeWall: (id) => {
      editEnvironment((env) => ({ ...env, walls: env.walls.filter((wall) => wall.id !== id) }));
      if (get().selectedWallId === id) set({ selectedWallId: null });
    },

    addObject: (modelId) => {
      const scene = get().scene;
      if (!scene || scene.objects.length >= MAX_OBJECTS) return null;
      const object: SceneObject = {
        id: crypto.randomUUID(),
        modelId,
        position: [0, 0, 0],
        rotationY: 0,
        scale: 1,
      };
      editObjects((objects) => [...objects, object]);
      set({ selectedObjectId: object.id, selectedWallId: null });
      return object.id;
    },

    removeObjectsByModel: (modelId) => {
      const { scene, past, future, revision } = get();
      if (!scene) return 0;
      // The model is gone for good (its file is deleted), so this is not an undo step, and the
      // history loses those objects too: undo must never bring back an object without a model.
      const strip = (s: Scene): Scene =>
        s.objects.some((o) => o.modelId === modelId)
          ? { ...s, objects: s.objects.filter((o) => o.modelId !== modelId) }
          : s;
      set({ past: past.map(strip), future: future.map(strip) });
      const removed = scene.objects.filter((o) => o.modelId === modelId);
      if (removed.length === 0) return 0;
      set({ scene: strip(scene), isDirty: true, revision: revision + 1 });
      const selected = get().selectedObjectId;
      if (selected && removed.some((o) => o.id === selected)) set({ selectedObjectId: null });
      return removed.length;
    },

    updateObject: (id, patch) => {
      const safe = sanitizeObjectPatch(patch);
      if (Object.keys(safe).length === 0) return;
      editObjects((objects) => objects.map((o) => (o.id === id ? { ...o, ...safe } : o)));
    },

    removeObject: (id) => {
      editObjects((objects) => objects.filter((o) => o.id !== id));
      if (get().selectedObjectId === id) set({ selectedObjectId: null });
    },

    duplicateObject: (id) => {
      const scene = get().scene;
      const original = scene?.objects.find((o) => o.id === id);
      if (!scene || !original || scene.objects.length >= MAX_OBJECTS) return null;
      const [x, , z] = original.position;
      const copy: SceneObject = {
        ...original,
        id: crypto.randomUUID(),
        position: [x + DUPLICATE_OFFSET, 0, z + DUPLICATE_OFFSET],
      };
      editObjects((objects) => [...objects, copy]);
      set({ selectedObjectId: copy.id, selectedWallId: null });
      return copy.id;
    },

    removeMissingObjects: (existingModelIds) => {
      const scene = get().scene;
      if (!scene) return 0;
      const missing = scene.objects.filter((o) => !existingModelIds.has(o.modelId));
      if (missing.length === 0) return 0;
      editObjects((objects) => objects.filter((o) => existingModelIds.has(o.modelId)));
      const selected = get().selectedObjectId;
      if (selected && missing.some((o) => o.id === selected)) set({ selectedObjectId: null });
      return missing.length;
    },

    undo: () => travel('undo'),
    redo: () => travel('redo'),

    beginGesture: () => {
      const { scene, past, inGesture } = get();
      if (!scene || inGesture) return;
      // Record the scene as it was before the drag; the drag's updates then skip history.
      set({ past: [...past, scene].slice(-HISTORY_LIMIT), future: [], inGesture: true });
    },

    endGesture: () => {
      const { scene, past, inGesture } = get();
      if (!inGesture) return;
      // A click on the gizmo without moving changed nothing: drop the empty step.
      const unchanged = past.length > 0 && past[past.length - 1] === scene;
      set({ inGesture: false, ...(unchanged && { past: past.slice(0, -1) }) });
    },

    setTransformMode: (mode) => set({ transformMode: mode }),
    setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  };
});
