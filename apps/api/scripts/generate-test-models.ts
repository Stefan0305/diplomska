/**
 * Generates simple, licence-free GLB test models into assets/models/ and writes the manifest
 * the seed script reads. Run with `npm run models:generate -w @app/api`; the output is
 * committed, so this only needs re-running when the models change.
 *
 * The models deliberately exercise the editor's normalization:
 * - the table is modelled off-centre and partly below the origin,
 * - the tree is Draco-compressed (must load offline with the local decoder).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { Document, NodeIO, type Material, type Node } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import type { ModelCategory } from '@app/shared';

const OUT_DIR = path.resolve(import.meta.dirname, '../assets/models');

interface Geometry {
  positions: number[];
  normals: number[];
  indices: number[];
}

type Vec3 = [number, number, number];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];

/** Axis-aligned box centred on the origin; faces wound counter-clockwise seen from outside. */
function box(width: number, height: number, depth: number): Geometry {
  const half: Vec3 = [width / 2, height / 2, depth / 2];
  const X: Vec3 = [1, 0, 0];
  const Y: Vec3 = [0, 1, 0];
  const Z: Vec3 = [0, 0, 1];
  // [normal, u, v] with u × v = normal, so (-u,-v) (+u,-v) (+u,+v) (-u,+v) is CCW.
  const faces: [Vec3, Vec3, Vec3][] = [
    [X, Y, Z],
    [mul(X, -1), Z, Y],
    [Y, Z, X],
    [mul(Y, -1), X, Z],
    [Z, X, Y],
    [mul(Z, -1), Y, X],
  ];
  const g: Geometry = { positions: [], normals: [], indices: [] };
  const extent = (axis: Vec3) => axis[0] * half[0] + axis[1] * half[1] + axis[2] * half[2];
  for (const [n, u, v] of faces) {
    const base = g.positions.length / 3;
    const centre = mul(n, Math.abs(extent(n)));
    const hu = Math.abs(extent(u));
    const hv = Math.abs(extent(v));
    for (const [su, sv] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      g.positions.push(...add(add(centre, mul(u, su * hu)), mul(v, sv * hv)));
      g.normals.push(...n);
    }
    g.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return g;
}

/** Vertical cylinder or cone (topRadius 0) centred on the origin. */
function cylinder(
  topRadius: number,
  bottomRadius: number,
  height: number,
  segments = 24,
): Geometry {
  const g: Geometry = { positions: [], normals: [], indices: [] };
  const h = height / 2;
  // Side: two vertices per segment edge, normals tilted for cones.
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const n: Vec3 = [c * height, bottomRadius - topRadius, s * height];
    const len = Math.hypot(...n);
    const normal = mul(n, 1 / len);
    g.positions.push(bottomRadius * c, -h, bottomRadius * s, topRadius * c, h, topRadius * s);
    g.normals.push(...normal, ...normal);
  }
  for (let i = 0; i < segments; i++) {
    const [b0, t0, b1, t1] = [i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 3];
    g.indices.push(b0, t0, t1, b0, t1, b1);
  }
  // Caps as triangle fans.
  const cap = (radius: number, y: number, up: boolean) => {
    if (radius <= 0) return;
    const centre = g.positions.length / 3;
    g.positions.push(0, y, 0);
    g.normals.push(0, up ? 1 : -1, 0);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      g.positions.push(radius * Math.cos(a), y, radius * Math.sin(a));
      g.normals.push(0, up ? 1 : -1, 0);
    }
    for (let i = 0; i < segments; i++) {
      const [p0, p1] = [centre + 1 + i, centre + 2 + i];
      if (up) g.indices.push(centre, p1, p0);
      else g.indices.push(centre, p0, p1);
    }
  };
  cap(topRadius, h, true);
  cap(bottomRadius, -h, false);
  return g;
}

class ModelBuilder {
  readonly doc = new Document();
  private readonly buffer = this.doc.createBuffer();
  readonly root: Node;

  constructor(name: string) {
    this.root = this.doc.createNode(name);
    this.doc.getRoot().setDefaultScene(this.doc.createScene(name).addChild(this.root));
  }

  material(name: string, rgb: Vec3, roughness = 0.8): Material {
    return this.doc
      .createMaterial(name)
      .setBaseColorFactor([...rgb, 1])
      .setRoughnessFactor(roughness)
      .setMetallicFactor(0);
  }

  part(name: string, geometry: Geometry, material: Material, translation: Vec3): this {
    const accessor = (
      type: 'VEC3' | 'SCALAR',
      array: Float32Array<ArrayBuffer> | Uint16Array<ArrayBuffer>,
    ) => this.doc.createAccessor().setType(type).setArray(array).setBuffer(this.buffer);
    const primitive = this.doc
      .createPrimitive()
      .setAttribute('POSITION', accessor('VEC3', new Float32Array(geometry.positions)))
      .setAttribute('NORMAL', accessor('VEC3', new Float32Array(geometry.normals)))
      .setIndices(accessor('SCALAR', new Uint16Array(geometry.indices)))
      .setMaterial(material);
    const mesh = this.doc.createMesh(name).addPrimitive(primitive);
    this.root.addChild(this.doc.createNode(name).setMesh(mesh).setTranslation(translation));
    return this;
  }
}

interface ManifestEntry {
  file: string;
  name: string;
  category: ModelCategory;
}

function table(): ModelBuilder {
  // 1.2 × 0.75 × 0.8 m, deliberately placed off-centre and partly below y = 0.
  const m = new ModelBuilder('Table');
  const wood = m.material('Wood', [0.55, 0.36, 0.2]);
  const [w, d, top, legH] = [1.2, 0.8, 0.04, 0.71];
  m.part('Top', box(w, top, d), wood, [0, legH + top / 2, 0]);
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const) {
    m.part('Leg', box(0.05, legH, 0.05), wood, [
      sx * (w / 2 - 0.05),
      legH / 2,
      sz * (d / 2 - 0.05),
    ]);
  }
  m.root.setTranslation([3, -0.4, -2]);
  return m;
}

function plantPot(): ModelBuilder {
  // Pot 0.3 m high, plant on top: about 0.85 m in total.
  const m = new ModelBuilder('Plant');
  m.part(
    'Pot',
    cylinder(0.17, 0.13, 0.3),
    m.material('Terracotta', [0.72, 0.38, 0.24]),
    [0, 0.15, 0],
  );
  m.part(
    'Leaves',
    cylinder(0, 0.28, 0.55),
    m.material('Leaves', [0.24, 0.55, 0.25]),
    [0, 0.575, 0],
  );
  return m;
}

function cube(): ModelBuilder {
  // Exactly 1 m on every side: a reference for checking real-world scale.
  const m = new ModelBuilder('Cube');
  m.part('Cube', box(1, 1, 1), m.material('Gray', [0.6, 0.62, 0.66], 0.6), [0, 0.5, 0]);
  return m;
}

function tree(): ModelBuilder {
  // About 5 m tall: 2 m trunk plus a 3 m crown.
  const m = new ModelBuilder('Tree');
  m.part('Trunk', cylinder(0.12, 0.16, 2, 16), m.material('Bark', [0.4, 0.27, 0.16]), [0, 1, 0]);
  m.part('Crown', cylinder(0, 1.2, 3, 24), m.material('Foliage', [0.2, 0.48, 0.22]), [0, 3.5, 0]);
  return m;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  });

  const models: (ManifestEntry & { build: () => ModelBuilder; compress?: boolean })[] = [
    { file: 'test-table.glb', name: 'Test table', category: 'furniture', build: table },
    { file: 'test-plant.glb', name: 'Test plant', category: 'plants', build: plantPot },
    { file: 'test-cube-1m.glb', name: 'Reference cube (1 m)', category: 'other', build: cube },
    {
      file: 'test-tree-draco.glb',
      name: 'Test tree (Draco)',
      category: 'outdoor',
      build: tree,
      compress: true,
    },
  ];

  for (const { file, build, compress } of models) {
    const { doc } = build();
    if (compress) await doc.transform(draco());
    await io.write(path.join(OUT_DIR, file), doc);
    const { size } = await fs.stat(path.join(OUT_DIR, file));
    console.log(`wrote ${file} (${size} bytes${compress ? ', Draco' : ''})`);
  }

  const manifest: ManifestEntry[] = models.map(({ file, name, category }) => ({
    file,
    name,
    category,
  }));
  await fs.writeFile(path.join(OUT_DIR, 'models.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`wrote models.json (${manifest.length} models)`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
