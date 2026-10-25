import { z } from 'zod';

/**
 * The saved contents of a project. This is the ONLY definition of the scene shape:
 * the API validates against it before saving and the editor store serializes to it.
 * Units: metres; rotations: radians. Bump SCENE_VERSION on breaking changes.
 */
export const SCENE_VERSION = 1;

const finite = z.number().finite();
/** [x, z] on the floor plane. */
const point2 = z.tuple([finite, finite]);

export const environmentTypes = ['interior', 'exterior'] as const;
export const floorMaterials = ['parquet', 'tiles', 'concrete', 'grass', 'soil', 'gravel'] as const;

export const ENVIRONMENT_SIZE_MIN = 1;
export const ENVIRONMENT_SIZE_MAX = 200;
export const WALL_HEIGHT_MIN = 0.1;
export const WALL_HEIGHT_MAX = 20;
export const WALL_THICKNESS_MIN = 0.01;
export const WALL_THICKNESS_MAX = 2;

export const wallSchema = z.object({
  id: z.string().min(1),
  start: point2,
  end: point2,
  height: z.number().min(WALL_HEIGHT_MIN).max(WALL_HEIGHT_MAX),
  thickness: z.number().min(WALL_THICKNESS_MIN).max(WALL_THICKNESS_MAX),
});

export const environmentSchema = z.object({
  type: z.enum(environmentTypes),
  width: z.number().min(ENVIRONMENT_SIZE_MIN).max(ENVIRONMENT_SIZE_MAX),
  depth: z.number().min(ENVIRONMENT_SIZE_MIN).max(ENVIRONMENT_SIZE_MAX),
  floorMaterial: z.enum(floorMaterials),
  walls: z.array(wallSchema).max(200),
});

/** Uniform scale limits: 1/1000 to 1000 times the model's native size. */
export const OBJECT_SCALE_MIN = 0.001;
export const OBJECT_SCALE_MAX = 1000;
/**
 * Height of an object's base above the floor, in metres: 0 stands on the floor; higher values
 * lift it, e.g. a shelf or picture on a wall, or a lamp on a table. Capped at the wall limit.
 */
export const OBJECT_ELEVATION_MIN = 0;
export const OBJECT_ELEVATION_MAX = WALL_HEIGHT_MAX;

export const sceneObjectSchema = z.object({
  id: z.string().min(1),
  modelId: z.string().min(1),
  /** [x, y, z] in world space; y is the elevation of the object's base. */
  position: z.tuple([
    finite,
    z.number().min(OBJECT_ELEVATION_MIN).max(OBJECT_ELEVATION_MAX),
    finite,
  ]),
  /** Rotation around the vertical axis only, in radians. */
  rotationY: finite,
  /** Uniform scale factor (proportions are always kept). */
  scale: z.number().min(OBJECT_SCALE_MIN).max(OBJECT_SCALE_MAX),
});

export const sceneSchema = z.object({
  version: z.literal(SCENE_VERSION),
  environment: environmentSchema,
  objects: z.array(sceneObjectSchema).max(500),
});

export type EnvironmentType = (typeof environmentTypes)[number];
export type FloorMaterial = (typeof floorMaterials)[number];
export type Wall = z.infer<typeof wallSchema>;
export type Environment = z.infer<typeof environmentSchema>;
export type SceneObject = z.infer<typeof sceneObjectSchema>;
export type Scene = z.infer<typeof sceneSchema>;
