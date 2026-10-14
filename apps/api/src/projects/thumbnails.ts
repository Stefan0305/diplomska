import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '../http';
import { resolveUploadPath } from '../models/files';

/** Project thumbnails live in this subfolder of the uploads folder. */
export const THUMBNAILS_DIR = 'thumbnails';

const SIGNATURES = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
} as const;

export interface DecodedThumbnail {
  data: Buffer;
  extension: keyof typeof SIGNATURES;
}

/**
 * Decode a data URL that already passed `thumbnailDataUrlSchema`, and check that the bytes
 * really are the image type it claims (the data URL prefix alone proves nothing).
 */
export function decodeThumbnail(dataUrl: string): DecodedThumbnail {
  const comma = dataUrl.indexOf(',');
  const extension = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
  const data = Buffer.from(dataUrl.slice(comma + 1), 'base64');
  const signature = SIGNATURES[extension];
  if (data.length <= signature.length || !signature.every((byte, i) => data[i] === byte)) {
    throw new HttpError(400, 'Thumbnail is not a valid image', { thumbnail: 'Not a valid image' });
  }
  return { data, extension };
}

/** Write a thumbnail under a new name (so browsers never show a cached old one). */
export async function writeThumbnail(
  uploadDir: string,
  thumbnail: DecodedThumbnail,
): Promise<string> {
  const filePath = `${THUMBNAILS_DIR}/${randomUUID()}.${thumbnail.extension}`;
  const absolute = resolveUploadPath(uploadDir, filePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, thumbnail.data);
  return filePath;
}

export async function removeThumbnail(uploadDir: string, filePath: string | null): Promise<void> {
  if (filePath) await fs.rm(resolveUploadPath(uploadDir, filePath), { force: true });
}
