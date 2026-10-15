import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { demoProjects, performanceTest } from './demo-scenes';

const builtInFiles: string[] = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, '../assets/models/models.json'), 'utf8'),
).map((entry: { file: string }) => entry.file);

/** Fails for files that are not built-in models, like the seed's real lookup. */
const lookup = (file: string) => {
  if (!builtInFiles.includes(file)) throw new Error(`not a built-in model: ${file}`);
  return `id:${file}`;
};

describe('demo scenes', () => {
  it.each(demoProjects)('$name is a valid scene that only uses built-in models', ({ build }) => {
    const scene = build(lookup);
    expect(scene.objects.length).toBeGreaterThan(5);
    expect(new Set(scene.objects.map((o) => o.id)).size).toBe(scene.objects.length);
  });

  it('keeps every object of the demo designs on their floor', () => {
    for (const { build } of demoProjects) {
      const { environment, objects } = build(lookup);
      for (const { position } of objects) {
        expect(Math.abs(position[0])).toBeLessThanOrEqual(environment.width / 2);
        expect(Math.abs(position[2])).toBeLessThanOrEqual(environment.depth / 2);
      }
    }
  });

  it('has exactly 50 objects in the performance test', () => {
    expect(performanceTest(lookup).objects).toHaveLength(50);
  });
});
