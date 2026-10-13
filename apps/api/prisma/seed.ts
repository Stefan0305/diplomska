import { loadConfig } from '../src/config';
import { createPrismaClient } from '../src/db';

// Grows sprint by sprint: built-in models (Sprint 4/7), demo user and example projects (Sprint 8).
async function main() {
  const prisma = createPrismaClient(loadConfig().databaseUrl);
  try {
    console.log('Seed: nothing to seed yet.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
