import path from 'node:path';
import { z } from 'zod';

/** Root of the api package (apps/api); relative paths in env vars are resolved from here. */
export const apiRoot = path.resolve(import.meta.dirname, '..');

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().startsWith('file:'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  UPLOAD_DIR: z.string().default('uploads'),
});

export interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  uploadDir: string;
  modelsAssetDir: string;
  webDistDir: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  }
  const { PORT, DATABASE_URL, JWT_SECRET, UPLOAD_DIR } = parsed.data;
  const dbFile = path.resolve(apiRoot, DATABASE_URL.slice('file:'.length));

  return {
    port: PORT,
    databaseUrl: `file:${dbFile}`,
    jwtSecret: JWT_SECRET,
    uploadDir: path.resolve(apiRoot, UPLOAD_DIR),
    modelsAssetDir: path.resolve(apiRoot, 'assets/models'),
    webDistDir: path.resolve(apiRoot, '../web/dist'),
  };
}
