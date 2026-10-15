import {
  createEnvironmentPreset,
  sceneSchema,
  SCENE_VERSION,
  type FloorMaterial,
  type Scene,
  type SceneObject,
} from '@app/shared';

/**
 * Example designs for the demo account, built from the built-in models. Model ids differ per
 * database, so the scenes are built from a lookup of built-in file name -> model id.
 */
export type ModelLookup = (file: string) => string;

/** [file, x, z, rotation in degrees] */
type Placement = [file: string, x: number, z: number, degrees?: number];

function place(lookup: ModelLookup, placements: Placement[]): SceneObject[] {
  return placements.map(([file, x, z, degrees = 0], i) => ({
    id: `demo-${i + 1}`,
    modelId: lookup(file),
    position: [x, 0, z],
    rotationY: (degrees * Math.PI) / 180,
    scale: 1,
  }));
}

function scene(
  type: 'interior' | 'exterior',
  width: number,
  depth: number,
  floorMaterial: FloorMaterial,
  objects: SceneObject[],
): Scene {
  const environment = { ...createEnvironmentPreset(type, width, depth), floorMaterial };
  // Validated here, so a broken demo scene fails the seed instead of the editor.
  return sceneSchema.parse({ version: SCENE_VERSION, environment, objects });
}

/** A 6 × 5 m living room: seating around a rug facing the TV, a reading corner, a bookshelf. */
export function livingRoom(lookup: ModelLookup): Scene {
  return scene(
    'interior',
    6,
    5,
    'parquet',
    place(lookup, [
      ['rug.glb', 0, 0.3],
      ['tv-cabinet.glb', 0, -2.2],
      ['sofa.glb', 0, 1.7, 180],
      ['coffee-table.glb', 0, 0.35],
      ['armchair.glb', -2, 0.2, 90],
      ['floor-lamp.glb', -2.5, 1.9],
      ['bookshelf.glb', 2.75, -0.6, -90],
      ['potted-plant.glb', 2.5, 1.9],
      ['potted-plant.glb', -2.55, -2],
    ]),
  );
}

/** A 14 × 10 m garden: hedge and trees at the back, a stone path, seating and raised beds. */
export function garden(lookup: ModelLookup): Scene {
  const path: Placement[] = [4.3, 3.6, 2.9, 2.2, 1.5, 0.8, 0.1, -0.6, -1.3, -2].map(
    (z, i): Placement => ['stepping-stone.glb', i % 2 === 0 ? -0.1 : 0.1, z, i * 25],
  );
  return scene(
    'exterior',
    14,
    10,
    'grass',
    place(lookup, [
      ...[-4, -2, 0, 2, 4].map((x): Placement => ['hedge.glb', x, -4.6]),
      ['deciduous-tree.glb', -4.6, -2.4],
      ['pine-tree.glb', 5.2, -2.8],
      ['pine-tree.glb', 6, -0.6],
      ['garden-bench.glb', 0, -3.6],
      ['planter.glb', -1.2, -3.7],
      ['planter.glb', 1.2, -3.7],
      ...path,
      ['dining-table.glb', 3, 1.4],
      ['dining-chair.glb', 3, 0.75],
      ['dining-chair.glb', 3, 2.05, 180],
      ['parasol.glb', 3, 1.4],
      ['raised-bed.glb', -3.5, 1.6],
      ['raised-bed.glb', -3.5, 3],
      ['shrub.glb', -6.2, 0.5],
      ['shrub.glb', 6.2, 3.8],
      ...[-4, -2, 0, 2, 4].map((z): Placement => ['fence-panel.glb', -7, z, 90]),
    ]),
  );
}

/** 50 objects (mixed models) on a 20 × 14 m plot, for the fps check (NFR2). */
export function performanceTest(lookup: ModelLookup): Scene {
  const files = [
    'sofa.glb',
    'armchair.glb',
    'dining-table.glb',
    'bookshelf.glb',
    'potted-plant.glb',
    'shrub.glb',
    'deciduous-tree.glb',
    'pine-tree.glb',
    'garden-bench.glb',
    'parasol.glb',
  ];
  const placements: Placement[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      placements.push([files[(row * 3 + col) % files.length]!, -8.1 + col * 1.8, -5 + row * 2.5]);
    }
  }
  return scene('exterior', 20, 14, 'grass', place(lookup, placements));
}

export const demoProjects = [
  { name: 'Living room', build: livingRoom },
  { name: 'Garden', build: garden },
  { name: 'Performance test (50 objects)', build: performanceTest },
] as const;
