// Copies the Draco decoder shipped with three.js into public/draco/ (runs on npm install), so
// compressed GLB models decode without downloading anything from a CDN and the decoder always
// matches the installed three.js version. The folder is git-ignored.
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

// three's "exports" hide package.json, so resolve its entry file and walk up to the package root.
const require = createRequire(import.meta.url);
let threeRoot = path.dirname(require.resolve('three'));
while (!existsSync(path.join(threeRoot, 'examples'))) {
  const parent = path.dirname(threeRoot);
  if (parent === threeRoot) throw new Error('Could not locate the three package folder');
  threeRoot = parent;
}
const source = path.join(threeRoot, 'examples/jsm/libs/draco/gltf');
const target = path.resolve(import.meta.dirname, '../public/draco');

const files = ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js'];
await fs.mkdir(target, { recursive: true });
for (const file of files) {
  await fs.copyFile(path.join(source, file), path.join(target, file));
}
console.log(`Copied Draco decoder (${files.length} files) to public/draco/`);
