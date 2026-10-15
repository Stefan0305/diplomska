import type { Environment, SceneObject } from '@app/shared';

/** Camera presets for the editor and the viewer; each one frames the whole scene. */
export type CameraPreset = 'perspective' | 'top' | 'front';

export const cameraPresets: { id: CameraPreset; label: string }[] = [
  { id: 'perspective', label: 'Perspective' },
  { id: 'top', label: 'Top' },
  { id: 'front', label: 'Front' },
];

type Vec3 = [number, number, number];

export interface Bounds {
  min: Vec3;
  max: Vec3;
}

/** Rough room for an object around its position, since model sizes are not known here. */
const OBJECT_MARGIN = 0.5;
/** Height used when a scene has no walls, so the view still has some depth. */
const MIN_SCENE_HEIGHT = 1.5;

/** The space to frame: the floor, the walls and every placed object. */
export function sceneBounds(environment: Environment, objects: SceneObject[]): Bounds {
  const min: Vec3 = [-environment.width / 2, 0, -environment.depth / 2];
  const max: Vec3 = [environment.width / 2, MIN_SCENE_HEIGHT, environment.depth / 2];
  const include = (x: number, z: number, margin: number) => {
    min[0] = Math.min(min[0], x - margin);
    max[0] = Math.max(max[0], x + margin);
    min[2] = Math.min(min[2], z - margin);
    max[2] = Math.max(max[2], z + margin);
  };
  for (const wall of environment.walls) {
    include(...wall.start, wall.thickness / 2);
    include(...wall.end, wall.thickness / 2);
    max[1] = Math.max(max[1], wall.height);
  }
  for (const object of objects) include(object.position[0], object.position[2], OBJECT_MARGIN);
  return { min, max };
}

export interface CameraView {
  position: Vec3;
  target: Vec3;
}

/** Leave a little room around the framed scene. */
const PADDING = 1.15;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Where to put the camera so the scene fits the view. `fov` is the vertical field of view in
 * degrees and `aspect` the canvas width / height.
 */
export function cameraForPreset(
  preset: CameraPreset,
  bounds: Bounds,
  fov: number,
  aspect: number,
): CameraView {
  const size = bounds.max.map((v, i) => v - bounds.min[i]!) as Vec3;
  const centre = bounds.max.map((v, i) => (v + bounds.min[i]!) / 2) as Vec3;
  const halfV = toRadians(fov) / 2;
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  // Distance at which a w × h rectangle facing the camera fills the view.
  const fit = (w: number, h: number) =>
    Math.max(h / 2 / Math.tan(halfV), w / 2 / Math.tan(halfH)) * PADDING;

  switch (preset) {
    case 'top': {
      // Straight down onto the floor plan (X right, -Z up on screen). The tiny Z offset keeps
      // OrbitControls away from its singularity at the pole.
      const distance = fit(size[0], size[2]) + size[1];
      return {
        target: [centre[0], 0, centre[2]],
        position: [centre[0], distance, centre[2] + 0.001],
      };
    }
    case 'front': {
      // From the +Z side, slightly raised so the floor is still visible.
      const target: Vec3 = [centre[0], size[1] / 3, centre[2]];
      const distance = fit(size[0], size[1]) + size[2] / 2;
      const elevation = toRadians(12);
      return {
        target,
        position: [
          target[0],
          target[1] + distance * Math.sin(elevation),
          target[2] + distance * Math.cos(elevation),
        ],
      };
    }
    case 'perspective': {
      // A three-quarter view from the front-right corner, framing the bounding sphere.
      const radius = Math.hypot(...size) / 2;
      const distance = (radius / Math.sin(Math.min(halfV, halfH))) * 0.95;
      const [azimuth, elevation] = [toRadians(45), toRadians(35)];
      const target: Vec3 = [centre[0], 0, centre[2]];
      return {
        target,
        position: [
          target[0] + distance * Math.cos(elevation) * Math.sin(azimuth),
          distance * Math.sin(elevation),
          target[2] + distance * Math.cos(elevation) * Math.cos(azimuth),
        ],
      };
    }
  }
}

/** Highest the orbit target may be panned (the camera can always look at a tall tree). */
export const TARGET_MAX_HEIGHT = 30;

/**
 * Vertical panning limit: if panning moved the orbit target outside [0, max] height, shift the
 * target and the camera back together (keeping the view direction). Returns the shift.
 */
export function clampPanHeight(targetY: number, maxHeight = TARGET_MAX_HEIGHT): number {
  if (targetY < 0) return -targetY;
  if (targetY > maxHeight) return maxHeight - targetY;
  return 0;
}
