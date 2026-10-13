import fs from 'node:fs';
import { createApp } from './app';
import { loadConfig } from './config';
import { createPrismaClient } from './db';

const config = loadConfig();
fs.mkdirSync(config.uploadDir, { recursive: true });

const prisma = createPrismaClient(config.databaseUrl);
const app = createApp(config, prisma);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
