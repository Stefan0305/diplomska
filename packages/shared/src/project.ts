import { z } from 'zod';
import { sceneSchema } from './scene';

export const PROJECT_NAME_MAX_LENGTH = 80;

export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(PROJECT_NAME_MAX_LENGTH, `Name must be at most ${PROJECT_NAME_MAX_LENGTH} characters`);

export const createProjectInputSchema = z.object({ name: projectNameSchema });
export const renameProjectInputSchema = z.object({ name: projectNameSchema });

/** What the dashboard needs: no scene contents. */
export const projectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  /** URL of the saved thumbnail image (Sprint 6), or null. */
  thumbnailUrl: z.string().nullable(),
  /** Set while the project is shared through a read-only link (Sprint 7). */
  shareToken: z.string().nullable(),
});

/** What the editor needs: the summary plus the full scene. */
export const projectDetailSchema = projectSummarySchema.extend({
  scene: sceneSchema,
});

export const projectListResponseSchema = z.object({ projects: z.array(projectSummarySchema) });
export const projectResponseSchema = z.object({ project: projectSummarySchema });
export const projectDetailResponseSchema = z.object({ project: projectDetailSchema });

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type RenameProjectInput = z.infer<typeof renameProjectInputSchema>;
export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;

/** Thumbnails are small previews (about 480 × 300 px), so 1 MB of base64 is plenty. */
export const THUMBNAIL_MAX_LENGTH = 1_000_000;

/** A JPEG or PNG image as a base64 data URL, as produced by `canvas.toDataURL()`. */
export const thumbnailDataUrlSchema = z
  .string()
  .max(THUMBNAIL_MAX_LENGTH, 'Thumbnail is too large')
  .regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/, 'Thumbnail must be a JPEG or PNG');

/** Body of PUT /api/projects/:id/scene. The thumbnail is optional (e.g. saving on page exit). */
export const saveSceneInputSchema = z.object({
  scene: sceneSchema,
  thumbnail: thumbnailDataUrlSchema.optional(),
});

export const sceneResponseSchema = z.object({ scene: sceneSchema });

export type SaveSceneInput = z.infer<typeof saveSceneInputSchema>;
