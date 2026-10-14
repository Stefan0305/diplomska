import {
  createDefaultScene,
  createProjectInputSchema,
  PROJECT_NAME_MAX_LENGTH,
  renameProjectInputSchema,
  type ProjectDetail,
  type ProjectSummary,
} from '@app/shared';
import { Router, type Request } from 'express';
import { currentUserId, requireAuth } from '../auth/middleware';
import type { PrismaClient } from '../generated/prisma/client';
import { parseInput } from '../http';
import {
  assertOwnedProject,
  copyName,
  serializeScene,
  toProjectDetail,
  toProjectSummary,
} from './mappers';

export function createProjectsRouter(prisma: PrismaClient, jwtSecret: string): Router {
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
    res.status(204).end();
  });

  return router;
}
