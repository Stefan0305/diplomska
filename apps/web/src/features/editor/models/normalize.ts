export type Vec3 = [number, number, number];

export interface Bounds {
  min: Vec3;
  max: Vec3;
}

export interface Normalization {
  /** Translation that centres the model on X/Z and puts its lowest point at y = 0. */
  offset: Vec3;
  /** Native size [width (X), height (Y), depth (Z)] in model units (metres for glTF). */
  size: Vec3;
}

/**
 * Models arrive with arbitrary pivots: off-centre, below the floor, floating. Normalizing
 * from the bounding box makes every model stand centred on its placement point, so moving,
 * rotating and scaling (Sprint 5) all behave the same regardless of how it was modelled.
 */
export function normalizeBounds({ min, max }: Bounds): Normalization {
  const valid = min.every(Number.isFinite) && max.every(Number.isFinite);
  if (!valid) return { offset: [0, 0, 0], size: [0, 0, 0] }; // empty model
  return {
    offset: [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2],
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
  };
}
