import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { apiRoot, loadConfig } from './config';

const validEnv = {
  DATABASE_URL: 'file:./prisma/dev.db',
  JWT_SECRET: 'a-test-secret-that-is-long-enough',
};

describe('loadConfig', () => {
  it('applies defaults and resolves paths relative to the api package', () => {
    const config = loadConfig(validEnv);
    expect(config.port).toBe(3001);
    expect(config.databaseUrl).toBe(`file:${path.resolve(apiRoot, 'prisma/dev.db')}`);
    expect(config.uploadDir).toBe(path.resolve(apiRoot, 'uploads'));
  });

  it('rejects a missing database url', () => {
    expect(() => loadConfig({ JWT_SECRET: validEnv.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('rejects a short JWT secret', () => {
    expect(() => loadConfig({ ...validEnv, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
});
