import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { type ErrorRequestHandler } from 'express';
import type { HealthResponse } from '@app/shared';
import { createAuthRouter } from './auth/routes';
import type { Config } from './config';
import { toErrorResponse } from './errors';
import type { PrismaClient } from './generated/prisma/client';

export function createApp(config: Config, prisma: PrismaClient) {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());

  const api = express.Router();

  api.use('/auth', createAuthRouter(prisma, config.jwtSecret));

  api.get('/health', async (_req, res) => {
    let database: HealthResponse['database'] = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }
    const body: HealthResponse = { status: 'ok', uptimeSeconds: process.uptime(), database };
    res.json(body);
  });

  api.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use('/api', api);

  // Static files: user uploads and committed built-in models.
  app.use('/files/uploads', express.static(config.uploadDir));
  app.use('/files/models', express.static(config.modelsAssetDir));

  // Demo mode: serve the built web app (apps/web/dist) with an SPA fallback.
  if (fs.existsSync(config.webDistDir)) {
    const indexHtml = path.join(config.webDistDir, 'index.html');
    app.use(express.static(config.webDistDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/files/')) return next();
      res.sendFile(indexHtml);
    });
  }

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const { status, body } = toErrorResponse(err);
    if (status >= 500) console.error(err);
    res.status(status).json(body);
  };
  app.use(errorHandler);

  return app;
}
