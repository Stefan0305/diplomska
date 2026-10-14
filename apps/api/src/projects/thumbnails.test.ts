import { describe, expect, it } from 'vitest';
import { HttpError } from '../http';
import { decodeThumbnail } from './thumbnails';

const toDataUrl = (type: string, bytes: number[]) =>
  `data:image/${type};base64,${Buffer.from(bytes).toString('base64')}`;

describe('decodeThumbnail', () => {
  it('decodes a PNG and a JPEG by their file signatures', () => {
    const png = decodeThumbnail(
      toDataUrl('png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]),
    );
    expect(png.extension).toBe('png');
    expect(png.data).toHaveLength(9);
    expect(decodeThumbnail(toDataUrl('jpeg', [0xff, 0xd8, 0xff, 0xe0])).extension).toBe('jpg');
  });

  it('rejects bytes that do not match the claimed type', () => {
    expect(() => decodeThumbnail(toDataUrl('png', [0xff, 0xd8, 0xff, 0xe0]))).toThrow(HttpError);
    expect(() => decodeThumbnail(toDataUrl('jpeg', [0x3c, 0x73, 0x76, 0x67]))).toThrow(HttpError);
    expect(() => decodeThumbnail(toDataUrl('jpeg', [0xff, 0xd8, 0xff]))).toThrow(HttpError);
  });
});
