import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  checkGlbHeader,
  checkModelFile,
  MODEL_MAX_BYTES,
  uploadModelFieldsSchema,
  type ModelInfo,
} from '@app/shared';
import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { currentUserId, requireAuth } from '../auth/middleware';
import type { PrismaClient } from '../generated/prisma/client';
import { HttpError, parseInput } from '../http';
import { compareModels, resolveUploadPath, toModelInfo, UPLOADED_MODELS_DIR } from './files';

const TOO_LARGE = `The file is too large (max ${MODEL_MAX_BYTES / 1024 / 1024} MB)`;

/** Multer keeps the upload in memory (max 20 MB) so it can be validated before saving. */
function singleFileUpload(): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MODEL_MAX_BYTES, files: 1, fields: 10 },
  }).single('file');

  return (req, res, next) => {
    upload(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE')
          return next(new HttpError(413, TOO_LARGE, { file: TOO_LARGE }));
        return next(new HttpError(400, 'Invalid upload', { file: err.message }));
      }
      next(err);
    });
  };
}

export function createModelsRouter(
  prisma: PrismaClient,
  jwtSecret: string,
  uploadDir: string,
): Router {
  const router = Router();
  router.use(requireAuth(jwtSecret));

  router.get('/', async (req, res) => {
    const models = await prisma.model.findMany({
      where: { OR: [{ ownerId: null }, { ownerId: currentUserId(req) }] },
    });
    const body: { models: ModelInfo[] } = { models: models.map(toModelInfo).sort(compareModels) };
    res.json(body);
  });

  router.post('/', singleFileUpload(), async (req, res) => {
    const fields = parseInput(uploadModelFieldsSchema, req.body);
    const file = req.file;
    if (!file)
      throw new HttpError(400, 'Choose a .glb file to upload', { file: 'Choose a .glb file' });

    const problem =
      checkModelFile({ name: file.originalname, size: file.size }) ??
      checkGlbHeader(
        new Uint8Array(file.buffer.buffer, file.buffer.byteOffset, file.buffer.byteLength),
      );
    if (problem) throw new HttpError(400, problem, { file: problem });

    // The server picks the file name; the user's file name is never used as a path.
    const filePath = `${UPLOADED_MODELS_DIR}/${randomUUID()}.glb`;
    const absolute = resolveUploadPath(uploadDir, filePath);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, file.buffer);

    try {
      const model = await prisma.model.create({
        data: {
          ownerId: currentUserId(req),
          name: fields.name,
          category: fields.category,
          filePath,
          fileSize: file.size,
        },
      });
      const body: { model: ModelInfo } = { model: toModelInfo(model) };
      res.status(201).json(body);
    } catch (err) {
      await fs.rm(absolute, { force: true }); // don't leave an orphaned file behind
      throw err;
    }
  });

  router.delete('/:id', async (req, res) => {
    const model = await prisma.model.findUnique({ where: { id: req.params.id } });
    if (!model) throw new HttpError(404, 'Model not found');
    if (model.ownerId === null) throw new HttpError(403, 'Built-in models cannot be deleted');
    // Someone else's upload: 404, so ids of other users' models cannot be probed.
    if (model.ownerId !== currentUserId(req)) throw new HttpError(404, 'Model not found');

    await prisma.model.delete({ where: { id: model.id } });
    await fs.rm(resolveUploadPath(uploadDir, model.filePath), { force: true });
    res.status(204).end();
  });

  return router;
}
