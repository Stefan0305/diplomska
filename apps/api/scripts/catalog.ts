/**
 * The built-in low-poly model set: furniture, decor, plants and outdoor items, modelled at
 * real-world size (metres) with their base on y = 0. Project-owned, so no licence questions.
 */
import type { ModelCategory } from '@app/shared';
import type { Material } from '@gltf-transform/core';
import { box, cylinder, ModelBuilder, sphere, type Vec3 } from './model-kit';

export interface CatalogEntry {
  file: string;
  name: string;
  category: ModelCategory;
  build: () => ModelBuilder;
}

const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

const COLORS = {
  oak: [0.62, 0.43, 0.26],
  walnut: [0.4, 0.26, 0.16],
  white: [0.92, 0.91, 0.88],
  fabric: [0.42, 0.5, 0.6],
  linen: [0.85, 0.82, 0.76],
  charcoal: [0.22, 0.23, 0.25],
  steel: [0.55, 0.56, 0.58],
  leaves: [0.24, 0.52, 0.24],
  darkLeaves: [0.15, 0.38, 0.2],
  bark: [0.38, 0.26, 0.16],
  soil: [0.3, 0.21, 0.14],
  terracotta: [0.72, 0.38, 0.24],
  stone: [0.62, 0.6, 0.56],
} satisfies Record<string, Vec3>;

/** Four square legs under a rectangular top of size w × d, inset from the corners. */
function legs(m: ModelBuilder, mat: Material, w: number, d: number, height: number, size = 0.05) {
  for (const [sx, sz] of CORNERS) {
    m.part('Leg', box(size, height, size), mat, [
      sx * (w / 2 - size),
      height / 2,
      sz * (d / 2 - size),
    ]);
  }
}

function sofa() {
  // 2.0 × 0.85 × 0.9 m three-seater.
  const m = new ModelBuilder('Sofa');
  const fabric = m.material('Fabric', COLORS.fabric, 0.95);
  const cushion = m.material('Cushion', [0.5, 0.58, 0.68], 0.95);
  const wood = m.material('Legs', COLORS.walnut);
  const [w, d] = [2, 0.9];
  legs(m, wood, w, d, 0.1, 0.06);
  m.part('Base', box(w, 0.3, d), fabric, [0, 0.25, 0]);
  m.part('Back', box(w, 0.45, 0.2), fabric, [0, 0.625, -d / 2 + 0.1]);
  for (const side of [-1, 1]) {
    m.part('Arm', box(0.18, 0.25, d), fabric, [side * (w / 2 - 0.09), 0.525, 0]);
  }
  for (const x of [-0.55, 0, 0.55]) {
    m.part('Seat', box(0.54, 0.12, 0.62), cushion, [x, 0.46, 0.08]);
  }
  return m;
}

function armchair() {
  // 0.85 × 0.85 × 0.85 m.
  const m = new ModelBuilder('Armchair');
  const fabric = m.material('Fabric', [0.66, 0.45, 0.32], 0.95);
  const wood = m.material('Legs', COLORS.walnut);
  const s = 0.85;
  legs(m, wood, s, s, 0.12, 0.05);
  m.part('Base', box(s, 0.3, s), fabric, [0, 0.27, 0]);
  m.part('Back', box(s, 0.43, 0.18), fabric, [0, 0.635, -s / 2 + 0.09]);
  for (const side of [-1, 1]) {
    m.part('Arm', box(0.15, 0.22, s), fabric, [side * (s / 2 - 0.075), 0.53, 0]);
  }
  return m;
}

function diningChair() {
  // 0.45 × 0.9 × 0.5 m, seat at 0.46 m.
  const m = new ModelBuilder('Dining chair');
  const wood = m.material('Wood', COLORS.oak);
  const [w, d] = [0.45, 0.5];
  legs(m, wood, w, d, 0.44, 0.04);
  m.part('Seat', box(w, 0.04, d), wood, [0, 0.46, 0]);
  for (const side of [-1, 1]) {
    m.part('Post', box(0.04, 0.44, 0.04), wood, [side * (w / 2 - 0.04), 0.7, -d / 2 + 0.04]);
  }
  m.part('Backrest', box(w, 0.18, 0.03), wood, [0, 0.8, -d / 2 + 0.04]);
  return m;
}

function diningTable() {
  // 1.6 × 0.75 × 0.9 m.
  const m = new ModelBuilder('Dining table');
  const wood = m.material('Wood', COLORS.oak);
  const [w, d] = [1.6, 0.9];
  legs(m, wood, w, d, 0.71, 0.07);
  m.part('Top', box(w, 0.04, d), wood, [0, 0.73, 0]);
  return m;
}

function coffeeTable() {
  // 1.0 × 0.45 × 0.6 m, with a lower shelf.
  const m = new ModelBuilder('Coffee table');
  const wood = m.material('Wood', COLORS.walnut);
  const [w, d] = [1, 0.6];
  legs(m, wood, w, d, 0.41, 0.05);
  m.part('Top', box(w, 0.04, d), wood, [0, 0.43, 0]);
  m.part('Shelf', box(w - 0.1, 0.02, d - 0.1), wood, [0, 0.12, 0]);
  return m;
}

function bed() {
  // Double bed 1.6 × 1.0 × 2.1 m (headboard 1.0 m high).
  const m = new ModelBuilder('Double bed');
  const wood = m.material('Frame', COLORS.walnut);
  const mattress = m.material('Mattress', COLORS.white, 0.95);
  const blanket = m.material('Blanket', [0.36, 0.45, 0.58], 0.95);
  const [w, d] = [1.6, 2.1];
  m.part('Frame', box(w, 0.3, d), wood, [0, 0.15, 0]);
  m.part('Mattress', box(w - 0.06, 0.22, d - 0.1), mattress, [0, 0.41, 0.02]);
  m.part('Blanket', box(w - 0.02, 0.04, 1.3), blanket, [0, 0.54, 0.35]);
  m.part('Headboard', box(w, 1, 0.08), wood, [0, 0.5, -d / 2 + 0.04]);
  for (const side of [-1, 1]) {
    m.part('Pillow', box(0.6, 0.12, 0.4), mattress, [side * 0.37, 0.58, -d / 2 + 0.35]);
  }
  return m;
}

function wardrobe() {
  // 1.2 × 2.0 × 0.6 m, two doors.
  const m = new ModelBuilder('Wardrobe');
  const body = m.material('Body', COLORS.white, 0.6);
  const metal = m.material('Handles', COLORS.steel, 0.4);
  const [w, h, d] = [1.2, 2, 0.6];
  m.part('Body', box(w, h - 0.05, d), body, [0, (h + 0.05) / 2, 0]);
  m.part(
    'Plinth',
    box(w - 0.04, 0.05, d - 0.04),
    m.material('Plinth', COLORS.charcoal),
    [0, 0.025, 0],
  );
  m.part('Gap', box(0.01, h - 0.15, 0.005), m.material('Gap', COLORS.charcoal), [0, 1.05, d / 2]);
  for (const side of [-1, 1]) {
    m.part('Handle', box(0.02, 0.3, 0.03), metal, [side * 0.06, 1.1, d / 2 + 0.015]);
  }
  return m;
}

function bookshelf() {
  // 0.8 × 1.8 × 0.3 m, five shelves with books.
  const m = new ModelBuilder('Bookshelf');
  const wood = m.material('Wood', COLORS.oak);
  const bookColors: Vec3[] = [
    [0.7, 0.25, 0.22],
    [0.22, 0.4, 0.62],
    [0.85, 0.7, 0.3],
    [0.3, 0.5, 0.35],
  ];
  const books = bookColors.map((c, i) => m.material(`Book ${i + 1}`, c, 0.9));
  const [w, h, d, t] = [0.8, 1.8, 0.3, 0.025];
  for (const side of [-1, 1])
    m.part('Side', box(t, h, d), wood, [side * (w / 2 - t / 2), h / 2, 0]);
  m.part('Back', box(w, h, 0.01), wood, [0, h / 2, -d / 2 + 0.005]);
  const levels = 5;
  for (let i = 0; i <= levels; i++) {
    const y = t / 2 + (i * (h - t)) / levels;
    m.part('Shelf', box(w - 2 * t, t, d - 0.01), wood, [0, y, 0.005]);
    if (i === levels) continue;
    // A row of books on every shelf except a gap at a different place per level.
    for (let b = 0; b < 8; b++) {
      if (b === (i * 3) % 8) continue;
      const bh = 0.2 + ((b * 7 + i * 3) % 5) * 0.02;
      m.part('Book', box(0.07, bh, 0.2), books[(b + i) % books.length]!, [
        -w / 2 + t + 0.05 + b * 0.085,
        y + t / 2 + bh / 2,
        0.02,
      ]);
    }
  }
  return m;
}

function tvCabinet() {
  // 1.6 × 0.5 × 0.4 m low cabinet with a 55" TV on top (total height about 1.25 m).
  const m = new ModelBuilder('TV cabinet');
  const body = m.material('Cabinet', COLORS.walnut);
  const screen = m.material('Screen', [0.05, 0.05, 0.06], 0.3);
  m.part('Cabinet', box(1.6, 0.45, 0.4), body, [0, 0.275, 0]);
  legs(m, m.material('Legs', COLORS.charcoal), 1.6, 0.4, 0.05, 0.04);
  m.part('Stand', box(0.3, 0.03, 0.2), screen, [0, 0.515, -0.05]);
  m.part('Neck', box(0.06, 0.08, 0.03), screen, [0, 0.57, -0.08]);
  m.part('TV', box(1.23, 0.71, 0.04), screen, [0, 0.96, -0.08]);
  return m;
}

function desk() {
  // 1.2 × 0.75 × 0.6 m.
  const m = new ModelBuilder('Desk');
  const top = m.material('Top', COLORS.white, 0.6);
  const metal = m.material('Frame', COLORS.charcoal, 0.5);
  const [w, d] = [1.2, 0.6];
  legs(m, metal, w, d, 0.72, 0.04);
  m.part('Top', box(w, 0.03, d), top, [0, 0.735, 0]);
  m.part('Drawer', box(0.4, 0.12, d - 0.06), top, [w / 2 - 0.25, 0.64, 0]);
  return m;
}

function floorLamp() {
  // 0.4 m shade, 1.6 m tall.
  const m = new ModelBuilder('Floor lamp');
  const metal = m.material('Metal', COLORS.charcoal, 0.4);
  m.part('Base', cylinder(0.15, 0.15, 0.03), metal, [0, 0.015, 0]);
  m.part('Pole', cylinder(0.012, 0.012, 1.3, 12), metal, [0, 0.68, 0]);
  m.part('Shade', cylinder(0.14, 0.2, 0.3), m.material('Shade', COLORS.linen, 0.9), [0, 1.45, 0]);
  return m;
}

function rug() {
  // 2.0 × 1.4 m, 1 cm thick, with a border.
  const m = new ModelBuilder('Rug');
  m.part('Border', box(2, 0.008, 1.4), m.material('Border', [0.45, 0.2, 0.18], 1), [0, 0.004, 0]);
  m.part('Field', box(1.8, 0.01, 1.2), m.material('Field', [0.8, 0.7, 0.55], 1), [0, 0.005, 0]);
  return m;
}

function pottedPlant() {
  // Large indoor plant: 0.5 m wide, 1.2 m tall.
  const m = new ModelBuilder('Potted plant');
  m.part('Pot', cylinder(0.2, 0.15, 0.4), m.material('Pot', COLORS.white, 0.5), [0, 0.2, 0]);
  m.part('Soil', cylinder(0.18, 0.18, 0.02), m.material('Soil', COLORS.soil, 1), [0, 0.39, 0]);
  const leaves = m.material('Leaves', COLORS.leaves, 0.9);
  const clumps: [Vec3, number][] = [
    [[0, 0.85, 0], 0.25],
    [[0.12, 0.65, 0.05], 0.18],
    [[-0.1, 0.7, -0.08], 0.2],
    [[0.02, 1.0, -0.05], 0.18],
  ];
  for (const [position, radius] of clumps) m.part('Leaves', sphere(radius), leaves, position);
  return m;
}

function shrub() {
  // Round bush about 1.0 × 0.8 × 1.0 m.
  const m = new ModelBuilder('Shrub');
  const leaves = m.material('Leaves', COLORS.darkLeaves, 0.9);
  m.part('Main', sphere(0.42), leaves, [0, 0.4, 0], [1.1, 0.95, 1.1]);
  m.part('Side', sphere(0.3), leaves, [0.22, 0.3, 0.12]);
  m.part('Side', sphere(0.28), leaves, [-0.2, 0.32, -0.14]);
  return m;
}

function hedge() {
  // Trimmed hedge segment 2.0 × 1.2 × 0.6 m.
  const m = new ModelBuilder('Hedge');
  m.part('Hedge', box(2, 1.2, 0.6), m.material('Leaves', COLORS.darkLeaves, 1), [0, 0.6, 0]);
  return m;
}

function deciduousTree() {
  // About 4 m wide and 6 m tall.
  const m = new ModelBuilder('Deciduous tree');
  m.part('Trunk', cylinder(0.15, 0.22, 2.6, 12), m.material('Bark', COLORS.bark), [0, 1.3, 0]);
  const foliage = m.material('Foliage', COLORS.leaves, 0.9);
  m.part('Crown', sphere(1.6), foliage, [0, 4.1, 0], [1.2, 1.1, 1.2]);
  m.part('Crown', sphere(1), foliage, [0.9, 3.5, 0.4]);
  m.part('Crown', sphere(1), foliage, [-0.8, 3.6, -0.5]);
  return m;
}

function pineTree() {
  // About 2.6 m wide and 7 m tall.
  const m = new ModelBuilder('Pine tree');
  m.part('Trunk', cylinder(0.1, 0.16, 1.6, 10), m.material('Bark', COLORS.bark), [0, 0.8, 0]);
  const needles = m.material('Needles', [0.13, 0.34, 0.22], 0.9);
  m.part('Tier', cylinder(0, 1.3, 2.6, 16), needles, [0, 2.4, 0]);
  m.part('Tier', cylinder(0, 1.0, 2.4, 16), needles, [0, 3.9, 0]);
  m.part('Tier', cylinder(0, 0.7, 2.2, 16), needles, [0, 5.9, 0]);
  return m;
}

function gardenBench() {
  // 1.5 × 0.8 × 0.6 m, slatted seat and back.
  const m = new ModelBuilder('Garden bench');
  const wood = m.material('Slats', COLORS.oak);
  const metal = m.material('Frame', COLORS.charcoal, 0.5);
  const w = 1.5;
  for (const side of [-1, 1]) {
    const x = side * (w / 2 - 0.08);
    m.part('Leg', box(0.05, 0.43, 0.05), metal, [x, 0.215, 0.2]);
    m.part('Leg', box(0.05, 0.8, 0.05), metal, [x, 0.4, -0.22]);
    m.part('Rail', box(0.05, 0.05, 0.5), metal, [x, 0.42, 0]);
  }
  for (const z of [-0.15, -0.03, 0.09, 0.21])
    m.part('Seat', box(w, 0.03, 0.09), wood, [0, 0.46, z]);
  for (const y of [0.6, 0.72]) m.part('Back', box(w, 0.08, 0.025), wood, [0, y, -0.24]);
  return m;
}

function raisedBed() {
  // Raised garden bed 1.2 × 0.4 × 0.8 m.
  const m = new ModelBuilder('Raised garden bed');
  const wood = m.material('Planks', COLORS.oak);
  const [w, h, d, t] = [1.2, 0.4, 0.8, 0.04];
  for (const side of [-1, 1]) {
    m.part('Side', box(w, h, t), wood, [0, h / 2, side * (d / 2 - t / 2)]);
    m.part('End', box(t, h, d - 2 * t), wood, [side * (w / 2 - t / 2), h / 2, 0]);
  }
  m.part('Soil', box(w - 2 * t, 0.02, d - 2 * t), m.material('Soil', COLORS.soil, 1), [
    0,
    h - 0.05,
    0,
  ]);
  const plants = m.material('Plants', COLORS.leaves, 0.9);
  for (const x of [-0.35, 0, 0.35]) m.part('Plant', sphere(0.13, 10, 6), plants, [x, h + 0.02, 0]);
  return m;
}

function parasol() {
  // 2.5 m diameter canopy, 2.4 m tall.
  const m = new ModelBuilder('Parasol');
  m.part('Base', cylinder(0.25, 0.25, 0.08), m.material('Base', COLORS.charcoal), [0, 0.04, 0]);
  m.part('Pole', cylinder(0.02, 0.02, 2.2, 10), m.material('Pole', COLORS.white), [0, 1.18, 0]);
  m.part(
    'Canopy',
    cylinder(0, 1.25, 0.45, 8),
    m.material('Canopy', [0.9, 0.86, 0.75], 0.95),
    [0, 2.175, 0],
  );
  return m;
}

function fencePanel() {
  // Wooden fence panel 2.0 × 1.2 m.
  const m = new ModelBuilder('Fence panel');
  const wood = m.material('Wood', [0.55, 0.4, 0.28]);
  for (const side of [-1, 1]) m.part('Post', box(0.08, 1.2, 0.08), wood, [side * 0.96, 0.6, 0]);
  for (const y of [0.3, 0.9]) m.part('Rail', box(1.84, 0.07, 0.03), wood, [0, y, -0.01]);
  for (let i = 0; i < 12; i++) {
    m.part('Board', box(0.12, 1.1, 0.015), wood, [-0.84 + i * 0.153, 0.6, 0.015]);
  }
  return m;
}

function steppingStone() {
  // Flat natural stone about 0.5 × 0.05 × 0.4 m.
  const m = new ModelBuilder('Stepping stone');
  m.part(
    'Stone',
    cylinder(0.25, 0.25, 0.05, 10),
    m.material('Stone', COLORS.stone, 1),
    [0, 0.025, 0],
    [1, 1, 0.8],
  );
  return m;
}

function planter() {
  // Terracotta planter with a small shrub, 0.6 m wide and 0.9 m tall.
  const m = new ModelBuilder('Terracotta planter');
  m.part('Pot', cylinder(0.3, 0.22, 0.45), m.material('Pot', COLORS.terracotta), [0, 0.225, 0]);
  m.part('Bush', sphere(0.28), m.material('Leaves', COLORS.leaves, 0.9), [0, 0.65, 0], [1, 0.9, 1]);
  return m;
}

export const catalog: CatalogEntry[] = [
  { file: 'sofa.glb', name: 'Sofa', category: 'furniture', build: sofa },
  { file: 'armchair.glb', name: 'Armchair', category: 'furniture', build: armchair },
  { file: 'dining-chair.glb', name: 'Dining chair', category: 'furniture', build: diningChair },
  { file: 'dining-table.glb', name: 'Dining table', category: 'furniture', build: diningTable },
  { file: 'coffee-table.glb', name: 'Coffee table', category: 'furniture', build: coffeeTable },
  { file: 'double-bed.glb', name: 'Double bed', category: 'furniture', build: bed },
  { file: 'wardrobe.glb', name: 'Wardrobe', category: 'furniture', build: wardrobe },
  { file: 'bookshelf.glb', name: 'Bookshelf', category: 'furniture', build: bookshelf },
  { file: 'tv-cabinet.glb', name: 'TV cabinet', category: 'furniture', build: tvCabinet },
  { file: 'desk.glb', name: 'Desk', category: 'furniture', build: desk },
  { file: 'floor-lamp.glb', name: 'Floor lamp', category: 'decor', build: floorLamp },
  { file: 'rug.glb', name: 'Rug', category: 'decor', build: rug },
  { file: 'potted-plant.glb', name: 'Potted plant', category: 'plants', build: pottedPlant },
  { file: 'shrub.glb', name: 'Shrub', category: 'plants', build: shrub },
  { file: 'hedge.glb', name: 'Hedge', category: 'plants', build: hedge },
  { file: 'planter.glb', name: 'Terracotta planter', category: 'plants', build: planter },
  { file: 'deciduous-tree.glb', name: 'Deciduous tree', category: 'plants', build: deciduousTree },
  { file: 'pine-tree.glb', name: 'Pine tree', category: 'plants', build: pineTree },
  { file: 'garden-bench.glb', name: 'Garden bench', category: 'outdoor', build: gardenBench },
  { file: 'raised-bed.glb', name: 'Raised garden bed', category: 'outdoor', build: raisedBed },
  { file: 'parasol.glb', name: 'Parasol', category: 'outdoor', build: parasol },
  { file: 'fence-panel.glb', name: 'Fence panel', category: 'outdoor', build: fencePanel },
  { file: 'stepping-stone.glb', name: 'Stepping stone', category: 'outdoor', build: steppingStone },
];
