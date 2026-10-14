import {
  ENVIRONMENT_SIZE_MAX,
  ENVIRONMENT_SIZE_MIN,
  SCENE_VERSION,
  type Environment,
  type EnvironmentType,
  type Scene,
  type Wall,
} from './scene';

/**
 * Pure environment helpers shared by the editor (and the API for new projects).
 * Coordinates: the floor is centred on the origin, X = width, Z = depth, metres.
 */

export const DEFAULT_WALL_HEIGHT = 2.7;
export const DEFAULT_WALL_THICKNESS = 0.15;

function newId(): string {
  return crypto.randomUUID();
}

/** Four walls along the floor's edges, corner to corner. */
export function createPerimeterWalls(
  width: number,
  depth: number,
  height = DEFAULT_WALL_HEIGHT,
  thickness = DEFAULT_WALL_THICKNESS,
): Wall[] {
  const x = width / 2;
  const z = depth / 2;
  const corners: [number, number][] = [
    [-x, -z],
    [x, -z],
    [x, z],
    [-x, z],
  ];
  return corners.map((start, i) => ({
    id: newId(),
    start,
    end: corners[(i + 1) % corners.length] as [number, number],
    height,
    thickness,
  }));
}

/**
 * Starting point for each environment type, keeping the current floor size:
 * interior = a room with four walls and parquet; exterior = an open plot of grass.
 */
export function createEnvironmentPreset(
  type: EnvironmentType,
  width: number,
  depth: number,
): Environment {
  if (type === 'interior') {
    return {
      type,
      width,
      depth,
      floorMaterial: 'parquet',
      walls: createPerimeterWalls(width, depth),
    };
  }
  return { type, width, depth, floorMaterial: 'grass', walls: [] };
}

/** A new project's scene: an empty 6 × 5 m room with walls. */
export function createDefaultScene(): Scene {
  return {
    version: SCENE_VERSION,
    environment: createEnvironmentPreset('interior', 6, 5),
    objects: [],
  };
}

export function clampFloorSize(value: number): number {
  if (!Number.isFinite(value)) return ENVIRONMENT_SIZE_MIN;
  return Math.min(ENVIRONMENT_SIZE_MAX, Math.max(ENVIRONMENT_SIZE_MIN, value));
}

/**
 * Resize the floor and move every wall endpoint proportionally, so walls on the edges stay
 * on the edges and inner walls keep their relative position. Heights and thicknesses stay.
 */
export function resizeEnvironment(env: Environment, width: number, depth: number): Environment {
  const newWidth = clampFloorSize(width);
  const newDepth = clampFloorSize(depth);
  const sx = newWidth / env.width;
  const sz = newDepth / env.depth;
  const scalePoint = ([x, z]: [number, number]): [number, number] => [x * sx, z * sz];
  return {
    ...env,
    width: newWidth,
    depth: newDepth,
    walls: env.walls.map((wall) => ({
      ...wall,
      start: scalePoint(wall.start),
      end: scalePoint(wall.end),
    })),
  };
}

/** A new free-standing 3 m wall across the middle of the floor. */
export function createWall(height = DEFAULT_WALL_HEIGHT): Wall {
  return {
    id: newId(),
    start: [-1.5, 0],
    end: [1.5, 0],
    height,
    thickness: DEFAULT_WALL_THICKNESS,
  };
}

export function wallLength(wall: Pick<Wall, 'start' | 'end'>): number {
  return Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
}

export interface WallTransform {
  /** Centre of the wall box in world space. */
  position: [number, number, number];
  /** Rotation around Y that turns the box's X axis from start towards end. */
  rotationY: number;
  /** Box size: [length, height, thickness]. */
  size: [number, number, number];
}

/**
 * Turn a wall into a box. The length is extended by the thickness so the boxes of
 * walls meeting at a corner overlap and leave no gap.
 */
export function wallTransform(wall: Wall): WallTransform {
  const [sx, sz] = wall.start;
  const [ex, ez] = wall.end;
  return {
    position: [(sx + ex) / 2, wall.height / 2, (sz + ez) / 2],
    // three.js rotates counter-clockwise around +Y looking down, and +Z points towards the
    // viewer, so the angle of the (dx, dz) direction is negated.
    rotationY: -Math.atan2(ez - sz, ex - sx),
    size: [wallLength(wall) + wall.thickness, wall.height, wall.thickness],
  };
}
