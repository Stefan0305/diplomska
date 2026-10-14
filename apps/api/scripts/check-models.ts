/** Sanity check for the generated test models: valid header, expected size and placement. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { checkGlbHeader } from '@app/shared';

const dir = path.resolve(import.meta.dirname, '../assets/models');
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
});

for (const file of (await fs.readdir(dir)).filter((f) => f.endsWith('.glb'))) {
  const bytes = new Uint8Array(await fs.readFile(path.join(dir, file)));
  const doc = await io.readBinary(bytes);
  const scene = doc.getRoot().getDefaultScene();
  if (!scene) throw new Error(`${file}: no default scene`);
  const { min, max } = getBounds(scene);
  const size = max.map((v, i) => (v - min[i]!).toFixed(3));
  const draco = doc
    .getRoot()
    .listExtensionsUsed()
    .map((e) => e.extensionName);
  console.log(
    `${file}: header ${checkGlbHeader(bytes) ?? 'ok'} | size ${size.join(' x ')} m | min ${min.map((v) => v.toFixed(2)).join(',')} | ext ${draco.join(',') || '-'}`,
  );
}
