import { z } from 'zod';
import { modelSchema } from './model';
import { sceneSchema } from './scene';

/** Share tokens are 24 random bytes in base64url: 32 characters, about 192 bits of entropy. */
export const SHARE_TOKEN_LENGTH = 32;
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

export function isShareToken(value: string): boolean {
  return value.length === SHARE_TOKEN_LENGTH && SHARE_TOKEN_PATTERN.test(value);
}

/** Path of the public, read-only viewer for a share token. */
export function shareViewPath(token: string): string {
  return `/view/${token}`;
}

/**
 * What the public viewer gets for a share link: the design and the models it uses, nothing
 * about the owner or their other projects.
 */
export const sharedProjectSchema = z.object({
  name: z.string(),
  updatedAt: z.iso.datetime(),
  scene: sceneSchema,
  models: z.array(modelSchema),
});

export const sharedProjectResponseSchema = z.object({ project: sharedProjectSchema });

export type SharedProject = z.infer<typeof sharedProjectSchema>;
