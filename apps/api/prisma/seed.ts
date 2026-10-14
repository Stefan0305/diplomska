import fs from 'node:fs/promises';
import path from 'node:path';
import { modelCategories } from '@app/shared';
import { z } from 'zod';
import { loadConfig } from '../src/config';
import { createPrismaClient } from '../src/db';

/**
 * Idempotent seed: safe to run any number of times.
 * - Built-in models: synced with assets/models/models.json (added, updated, stale ones removed).
 * Grows with later sprints (demo user and example projects in Sprint 8).
 */

const manifestSchema = z.array(
  z.object({
    file: z.string().regex(/^[\w.-]+\.glb$/, 'must be a plain .glb file name'),
    name: z.string().min(1),
    category: z.enum(modelCategories),
  }),
);

async function seedBuiltInModels(prisma: ReturnType<typeof createPrismaClient>, assetsDir: string) {
  const manifest = manifestSchema.parse(
    JSON.parse(await fs.readFile(path.join(assetsDir, 'models.json'), 'utf8')),
  );

  for (const entry of manifest) {
    const { size } = await fs.stat(path.join(assetsDir, entry.file)); // fails loudly if missing
    await prisma.model.upsert({
      where: { filePath: entry.file },
      create: {
        ownerId: null,
        filePath: entry.file,
        name: entry.name,
        category: entry.category,
        fileSize: size,
      },
      update: { name: entry.name, category: entry.category, fileSize: size },
    });
  }

  const removed = await prisma.model.deleteMany({
    where: { ownerId: null, filePath: { notIn: manifest.map((entry) => entry.file) } },
  });
  console.log(`Seed: ${manifest.length} built-in models (${removed.count} stale removed).`);
}

async function main() {
  const config = loadConfig();
  const prisma = createPrismaClient(config.databaseUrl);
  try {
    await seedBuiltInModels(prisma, config.modelsAssetDir);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
