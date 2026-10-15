import { isShareToken, type SharedProject } from '@app/shared';
import { Router } from 'express';
import type { PrismaClient } from '../generated/prisma/client';
import { HttpError } from '../http';
import { compareModels, toModelInfo } from '../models/files';
import { parseStoredScene } from '../projects/mappers';

/**
 * Public, read-only access to shared designs. There is no login and no write route: the token
 * is the only credential, and turning sharing off (or a wrong token) gives 404.
 */
export function createShareRouter(prisma: PrismaClient): Router {
  const router = Router();

  router.get('/:token', async (req, res) => {
    const { token } = req.params;
    const project = isShareToken(token)
      ? await prisma.project.findUnique({ where: { shareToken: token } })
      : null;
    if (!project) throw new HttpError(404, 'This share link does not exist or was turned off');

    const scene = parseStoredScene(project.scene);
    // Only the models this design uses (they may be the owner's own uploads).
    const modelIds = [...new Set(scene.objects.map((o) => o.modelId))];
    const models = await prisma.model.findMany({ where: { id: { in: modelIds } } });

    const body: { project: SharedProject } = {
      project: {
        name: project.name,
        updatedAt: project.updatedAt.toISOString(),
        scene,
        models: models.map(toModelInfo).sort(compareModels),
      },
    };
    res.json(body);
  });

  return router;
}
