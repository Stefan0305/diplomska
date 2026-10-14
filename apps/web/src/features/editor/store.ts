import {
  createEnvironmentPreset,
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
  type Wall,
} from '@app/shared';
import { create } from 'zustand';

export type WallPatch = Partial<Omit<Wall, 'id'>>;

/**
 * Live editor state. React Three Fiber components render from it and editing actions write to
 * it; saving (Sprint 6) serializes `scene`. Every edit sets `isDirty`.
 */
export interface EditorState {
  projectId: string | null;
  projectName: string;
  scene: Scene | null;
  isDirty: boolean;
  selectedObjectId: string | null;
  selectedWallId: string | null;

  loadProject: (project: ProjectDetail) => void;
  reset: () => void;
  selectObject: (id: string | null) => void;
  selectWall: (id: string | null) => void;

  setFloorSize: (width: number, depth: number) => void;
  setFloorMaterial: (material: FloorMaterial) => void;
  /** Switch interior/exterior and replace walls and floor material with that type's preset. */
  applyEnvironmentPreset: (type: EnvironmentType) => void;
  /** Adds a wall, selects it and returns its id. */
  addWall: () => string | null;
  updateWall: (id: string, patch: WallPatch) => void;
  removeWall: (id: string) => void;
}

const initialState = {
  projectId: null,
  projectName: '',
  scene: null,
  isDirty: false,
  selectedObjectId: null,
  selectedWallId: null,
} satisfies Partial<EditorState>;

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

export const useEditorStore = create<EditorState>()((set, get) => {
  /** Apply a change to the environment (no-op before a project is loaded). */
  function editEnvironment(change: (env: Environment) => Environment) {
    const { scene } = get();
    if (!scene) return;
    set({ scene: { ...scene, environment: change(scene.environment) }, isDirty: true });
  }

  return {
    ...initialState,

    loadProject: (project) =>
      set({
        ...initialState,
        projectId: project.id,
        projectName: project.name,
        // A copy, so editing never mutates TanStack Query's cached server data.
        scene: structuredClone(project.scene),
      }),

    reset: () => set(initialState),

    selectObject: (id) => set({ selectedObjectId: id, selectedWallId: null }),
    selectWall: (id) => set({ selectedWallId: id, selectedObjectId: null }),

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
  };
});
