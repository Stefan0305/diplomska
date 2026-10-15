import {
  createDefaultScene,
  createProjectInputSchema,
  PROJECT_NAME_MAX_LENGTH,
  renameProjectInputSchema,
  saveSceneInputSchema,
  type ProjectDetail,
  type ProjectSummary,
  type Scene,
} from '@app/shared';
import { Router, type Request } from 'express';
import { currentUserId, requireAuth } from '../auth/middleware';
import type { PrismaClient } from '../generated/prisma/client';
import { parseInput } from '../http';
import {
  assertOwnedProject,
  copyName,
  parseStoredScene,
  serializeScene,
  toProjectDetail,
  toProjectSummary,
} from './mappers';
import { generateShareToken } from '../share/token';
import { decodeThumbnail, removeThumbnail, writeThumbnail } from './thumbnails';

export function createProjectsRouter(
  prisma: PrismaClient,
  jwtSecret: string,
  uploadDir: string,
): Router {
  const router = Router();
  router.use(requireAuth(jwtSecret));

  async function findOwnedProject(req: Request<{ id: string }>) {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    return assertOwnedProject(project, currentUserId(req));
  }

  router.get('/', async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { ownerId: currentUserId(req) },
      orderBy: { updatedAt: 'desc' },
    });
    const body: { projects: ProjectSummary[] } = { projects: projects.map(toProjectSummary) };
    res.json(body);
  });

  router.post('/', async (req, res) => {
    const input = parseInput(createProjectInputSchema, req.body);
    const project = await prisma.project.create({
      data: {
        ownerId: currentUserId(req),
        name: input.name,
        scene: serializeScene(createDefaultScene()),
      },
    });
    const body: { project: ProjectSummary } = { project: toProjectSummary(project) };
    res.status(201).json(body);
  });

  router.get('/:id', async (req, res) => {
    const project = await findOwnedProject(req);
    const body: { project: ProjectDetail } = { project: toProjectDetail(project) };
    res.json(body);
  });

  router.patch('/:id', async (req, res) => {
    const input = parseInput(renameProjectInputSchema, req.body);
    const project = await findOwnedProject(req);
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { name: input.name },
    });
    const body: { project: ProjectSummary } = { project: toProjectSummary(updated) };
    res.json(body);
  });

  router.get('/:id/scene', async (req, res) => {
    const project = await findOwnedProject(req);
    const body: { scene: Scene } = { scene: parseStoredScene(project.scene) };
    res.json(body);
  });

  /** Save the workspace: the whole scene (validated by the shared schema) plus a thumbnail. */
  router.put('/:id/scene', async (req, res) => {
    const input = parseInput(saveSceneInputSchema, req.body);
    const project = await findOwnedProject(req);
    // Decode before writing anything, so an invalid image rejects the whole save.
    const thumbnail = input.thumbnail ? decodeThumbnail(input.thumbnail) : null;
    const thumbnailPath = thumbnail ? await writeThumbnail(uploadDir, thumbnail) : undefined;

    try {
      const updated = await prisma.project.update({
        where: { id: project.id },
        data: { scene: serializeScene(input.scene), thumbnail: thumbnailPath },
      });
      if (thumbnailPath) await removeThumbnail(uploadDir, project.thumbnail);
      const body: { project: ProjectSummary } = { project: toProjectSummary(updated) };
      res.json(body);
    } catch (err) {
      if (thumbnailPath) await removeThumbnail(uploadDir, thumbnailPath);
      throw err;
    }
  });

  /** Turn on the read-only share link; an existing link is kept, so re-sharing never breaks it. */
  router.post('/:id/share', async (req, res) => {
    const project = await findOwnedProject(req);
    const updated = project.shareToken
      ? project
      : await prisma.project.update({
          where: { id: project.id },
          data: { shareToken: generateShareToken() },
        });
    const body: { project: ProjectSummary } = { project: toProjectSummary(updated) };
    res.json(body);
  });

  /** Turn sharing off: the old link stops working, and sharing again creates a new one. */
  router.delete('/:id/share', async (req, res) => {
    const project = await findOwnedProject(req);
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { shareToken: null },
    });
    const body: { project: ProjectSummary } = { project: toProjectSummary(updated) };
    res.json(body);
  });

  router.post('/:id/duplicate', async (req, res) => {
    const project = await findOwnedProject(req);
    // Copies the scene only: the thumbnail file and share link belong to the original.
    const copy = await prisma.project.create({
      data: {
        ownerId: project.ownerId,
        name: copyName(project.name, PROJECT_NAME_MAX_LENGTH),
        scene: project.scene,
      },
    });
    const body: { project: ProjectSummary } = { project: toProjectSummary(copy) };
    res.status(201).json(body);
  });

  router.delete('/:id', async (req, res) => {
    const project = await findOwnedProject(req);
    await prisma.project.delete({ where: { id: project.id } });
    await removeThumbnail(uploadDir, project.thumbnail);
    res.status(204).end();
  });

  return router;
}
