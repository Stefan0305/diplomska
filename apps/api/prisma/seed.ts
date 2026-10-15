import fs from 'node:fs/promises';
import path from 'node:path';
import { modelCategories } from '@app/shared';
import { z } from 'zod';
import { loadConfig } from '../src/config';
import { hashPassword } from '../src/auth/password';
import { createPrismaClient } from '../src/db';
import { demoProjects } from './demo-scenes';

/**
 * Idempotent seed: safe to run any number of times.
 * - Built-in models: synced with assets/models/models.json (added, updated, stale ones removed).
 * - Demo account (demo@example.com / demo1234) with example projects. Missing projects are
 *   created; existing ones are left alone, so edits made during a rehearsal survive a re-seed.
 */

const DEMO_USER = { email: 'demo@example.com', password: 'demo1234', name: 'Demo Designer' };

type Prisma = ReturnType<typeof createPrismaClient>;

const manifestSchema = z.array(
  z.object({
    file: z.string().regex(/^[\w.-]+\.glb$/, 'must be a plain .glb file name'),
    name: z.string().min(1),
    category: z.enum(modelCategories),
  }),
);

async function seedBuiltInModels(prisma: Prisma, assetsDir: string) {
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

async function seedDemoAccount(prisma: Prisma) {
  // The password is reset on every seed, so the demo login always works.
  const passwordHash = await hashPassword(DEMO_USER.password);
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    create: { email: DEMO_USER.email, name: DEMO_USER.name, passwordHash },
    update: { passwordHash },
  });

  const builtIns = await prisma.model.findMany({ where: { ownerId: null } });
  const idByFile = new Map(builtIns.map((model) => [model.filePath, model.id]));
  const lookup = (file: string) => {
    const id = idByFile.get(file);
    if (!id) throw new Error(`Demo scene uses an unknown built-in model: ${file}`);
    return id;
  };

  let created = 0;
  for (const { name, build } of demoProjects) {
    const existing = await prisma.project.findFirst({ where: { ownerId: user.id, name } });
    if (existing) continue;
    await prisma.project.create({
      data: { ownerId: user.id, name, scene: JSON.stringify(build(lookup)) },
    });
    created++;
  }
  console.log(
    `Seed: demo account ${DEMO_USER.email} / ${DEMO_USER.password} (${created} example projects created).`,
  );
}

async function main() {
  const config = loadConfig();
  const prisma = createPrismaClient(config.databaseUrl);
  try {
    await seedBuiltInModels(prisma, config.modelsAssetDir);
    await seedDemoAccount(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
