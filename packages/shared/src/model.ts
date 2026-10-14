import { z } from 'zod';

/** A 3D model in the library: built-in (shared by everyone) or uploaded by a user. */

export const modelCategories = ['furniture', 'plants', 'outdoor', 'decor', 'other'] as const;
export type ModelCategory = (typeof modelCategories)[number];

export const MODEL_NAME_MAX_LENGTH = 80;
/** Upload limit. Large enough for detailed furniture, small enough for a smooth demo. */
export const MODEL_MAX_BYTES = 20 * 1024 * 1024;
export const MODEL_FILE_EXTENSION = '.glb';

export const uploadModelFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(MODEL_NAME_MAX_LENGTH, `Name must be at most ${MODEL_NAME_MAX_LENGTH} characters`),
  category: z.enum(modelCategories, 'Choose a category'),
});

export const modelSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(modelCategories),
  /** Where the browser loads the GLB from, e.g. /files/models/table.glb. */
  url: z.string(),
  builtIn: z.boolean(),
  /** Size of the file in bytes. */
  fileSize: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
});

export const modelListResponseSchema = z.object({ models: z.array(modelSchema) });
export const modelResponseSchema = z.object({ model: modelSchema });

export type UploadModelFields = z.infer<typeof uploadModelFieldsSchema>;
export type ModelInfo = z.infer<typeof modelSchema>;

/** "My Sofa.GLB" -> true; anything else -> false. */
export function hasGlbExtension(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(MODEL_FILE_EXTENSION);
}

/** "modern_sofa-v2.glb" -> "modern sofa v2": a readable default name for an upload. */
export function modelNameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const readable = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (readable || 'Model').slice(0, MODEL_NAME_MAX_LENGTH);
}

/** Problem with a file chosen for upload, or null if it looks fine (checked in browser and API). */
export function checkModelFile(file: { name: string; size: number }): string | null {
  if (!hasGlbExtension(file.name)) return 'Only .glb files are supported';
  if (file.size === 0) return 'The file is empty';
  if (file.size > MODEL_MAX_BYTES) {
    return `The file is too large (max ${MODEL_MAX_BYTES / 1024 / 1024} MB)`;
  }
  return null;
}

/**
 * A GLB starts with a 12-byte header: magic "glTF", version (2), total length, all
 * little-endian uint32. Checking it rejects renamed files that are not really GLB.
 */
export function checkGlbHeader(bytes: Uint8Array): string | null {
  if (bytes.byteLength < 12) return 'The file is not a valid GLB model';
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint32(0, true);
  const version = view.getUint32(4, true);
  const declaredLength = view.getUint32(8, true);
  if (magic !== 0x46546c67) return 'The file is not a valid GLB model';
  if (version !== 2) return 'Only glTF 2.0 models are supported';
  if (declaredLength !== bytes.byteLength) return 'The GLB file is incomplete or corrupt';
  return null;
}
