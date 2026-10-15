import { sceneSchema, type ProjectDetail, type ProjectSummary, type Scene } from '@app/shared';
import type { Project } from '../generated/prisma/client';
import { HttpError } from '../http';

/**
 * Returns the project only if it exists and belongs to the user. A project owned by someone
 * else is reported as 404, not 403, so other users' project ids cannot be probed.
 */
export function assertOwnedProject<T extends Pick<Project, 'ownerId'>>(
  project: T | null,
  userId: string,
): T {
  if (!project || project.ownerId !== userId) throw new HttpError(404, 'Project not found');
  return project;
}

export function serializeScene(scene: Scene): string {
  return JSON.stringify(sceneSchema.parse(scene));
}

/** Parse a scene stored in the database; corrupt data is a server error, never sent as-is. */
export function parseStoredScene(stored: string): Scene {
  let json: unknown;
  try {
    json = JSON.parse(stored);
  } catch {
    throw new Error('Stored scene is not valid JSON');
  }
  return sceneSchema.parse(json);
}

export function toProjectSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    thumbnailUrl: project.thumbnail ? `/files/uploads/${project.thumbnail}` : null,
    shareToken: project.shareToken,
  };
}

export function toProjectDetail(project: Project): ProjectDetail {
  return { ...toProjectSummary(project), scene: parseStoredScene(project.scene) };
}

/** "Garden" -> "Garden (copy)", truncated so it still fits the name limit. */
export function copyName(name: string, maxLength: number): string {
  const suffix = ' (copy)';
  return name.slice(0, maxLength - suffix.length).trimEnd() + suffix;
}
