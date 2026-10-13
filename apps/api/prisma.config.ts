import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env automatically; the file is optional (env vars may be set directly).
try {
  process.loadEnvFile();
} catch {
  // no .env file
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Default lets `prisma generate` (postinstall) run on a fresh clone before .env exists.
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
});
