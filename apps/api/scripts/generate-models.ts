/**
 * Generates the built-in GLB models into assets/models/ and writes the manifest the seed script
 * reads. Run with `npm run models:generate -w @app/api`; the output is committed, so this only
 * needs re-running when the models change.
 *
 * Two groups:
 * - the built-in set in catalog.ts (furniture, decor, plants, outdoor), at real-world size;
 * - test models that exercise the editor's normalization: the table is modelled off-centre and
 *   partly below the origin, the tree is Draco-compressed (must load offline with the local
 *   decoder), and the cube is exactly 1 m for checking real-world scale.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import type { ModelCategory } from '@app/shared';
import { catalog } from './catalog';
import { box, cylinder, ModelBuilder } from './model-kit';

const OUT_DIR = path.resolve(import.meta.dirname, '../assets/models');

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
    ...catalog,
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
