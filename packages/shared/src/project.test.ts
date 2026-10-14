import { describe, expect, it } from 'vitest';
import { createDefaultScene } from './environment';
import { saveSceneInputSchema, THUMBNAIL_MAX_LENGTH, thumbnailDataUrlSchema } from './project';
import { sceneSchema } from './scene';

describe('thumbnailDataUrlSchema', () => {
  it('accepts JPEG and PNG data URLs', () => {
    expect(thumbnailDataUrlSchema.safeParse('data:image/jpeg;base64,/9j/4AAQ').success).toBe(true);
    expect(thumbnailDataUrlSchema.safeParse('data:image/png;base64,iVBORw0KGgo=').success).toBe(
      true,
    );
  });

  it('rejects other types, non-base64 data and oversized images', () => {
    expect(thumbnailDataUrlSchema.safeParse('data:image/svg+xml;base64,PHN2Zz4=').success).toBe(
      false,
    );
    expect(thumbnailDataUrlSchema.safeParse('data:image/png;base64,<script>').success).toBe(false);
    expect(thumbnailDataUrlSchema.safeParse('https://example.com/a.png').success).toBe(false);
    const huge = 'data:image/png;base64,' + 'A'.repeat(THUMBNAIL_MAX_LENGTH);
    expect(thumbnailDataUrlSchema.safeParse(huge).success).toBe(false);
  });
});

describe('saveSceneInputSchema', () => {
  it('accepts a scene with or without a thumbnail', () => {
    const scene = createDefaultScene();
    expect(saveSceneInputSchema.safeParse({ scene }).success).toBe(true);
    expect(
      saveSceneInputSchema.safeParse({ scene, thumbnail: 'data:image/jpeg;base64,/9j/' }).success,
    ).toBe(true);
  });

  it('rejects an invalid scene', () => {
    const scene = { ...createDefaultScene(), objects: [{ id: 'o1' }] };
    expect(saveSceneInputSchema.safeParse({ scene }).success).toBe(false);
    expect(saveSceneInputSchema.safeParse({}).success).toBe(false);
  });

  it('survives a JSON round trip unchanged (store -> request body -> stored string -> store)', () => {
    const scene = {
      ...createDefaultScene(),
      objects: [
        { id: 'o1', modelId: 'm1', position: [1.25, 0, -2.5], rotationY: -1.0472, scale: 0.8333 },
      ],
    };
    const body = JSON.parse(JSON.stringify({ scene }));
    const parsed = saveSceneInputSchema.parse(body);
    const stored = JSON.stringify(sceneSchema.parse(parsed.scene));
    expect(sceneSchema.parse(JSON.parse(stored))).toEqual(scene);
  });
});
