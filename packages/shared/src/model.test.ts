import { describe, expect, it } from 'vitest';
import {
  checkGlbHeader,
  checkModelFile,
  MODEL_MAX_BYTES,
  modelNameFromFileName,
  uploadModelFieldsSchema,
} from './model';

/** A minimal 12-byte GLB header (+ optional padding) for tests. */
function glbHeader({
  magic = 0x46546c67,
  version = 2,
  length,
  totalBytes = 12,
}: { magic?: number; version?: number; length?: number; totalBytes?: number } = {}) {
  const bytes = new Uint8Array(totalBytes);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, magic, true);
  view.setUint32(4, version, true);
  view.setUint32(8, length ?? totalBytes, true);
  return bytes;
}

describe('checkGlbHeader', () => {
  it('accepts a valid glTF 2.0 binary header', () => {
    expect(checkGlbHeader(glbHeader({ totalBytes: 64 }))).toBeNull();
  });

  it('rejects files that are not GLB (e.g. a renamed PNG)', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(checkGlbHeader(png)).toMatch(/not a valid GLB/);
  });

  it('rejects glTF 1.0', () => {
    expect(checkGlbHeader(glbHeader({ version: 1 }))).toMatch(/glTF 2\.0/);
  });

  it('rejects truncated files whose declared length does not match', () => {
    expect(checkGlbHeader(glbHeader({ totalBytes: 64, length: 128 }))).toMatch(/incomplete/);
  });

  it('rejects files shorter than the header', () => {
    expect(checkGlbHeader(new Uint8Array(4))).toMatch(/not a valid GLB/);
  });

  it('reads the header correctly from a view into a larger buffer', () => {
    const backing = new Uint8Array(100);
    backing.set(glbHeader({ totalBytes: 40 }), 10);
    expect(checkGlbHeader(backing.subarray(10, 50))).toBeNull();
  });
});

describe('checkModelFile', () => {
  it('accepts a .glb file of reasonable size (any letter case)', () => {
    expect(checkModelFile({ name: 'Sofa.GLB', size: 1024 })).toBeNull();
  });

  it('rejects other formats, empty files and files over the limit', () => {
    expect(checkModelFile({ name: 'sofa.gltf', size: 1024 })).toMatch(/\.glb/);
    expect(checkModelFile({ name: 'sofa.obj', size: 1024 })).toMatch(/\.glb/);
    expect(checkModelFile({ name: 'sofa.glb', size: 0 })).toMatch(/empty/);
    expect(checkModelFile({ name: 'sofa.glb', size: MODEL_MAX_BYTES + 1 })).toMatch(/20 MB/);
  });
});

describe('modelNameFromFileName', () => {
  it('turns a file name into a readable model name', () => {
    expect(modelNameFromFileName('modern_sofa-v2.glb')).toBe('modern sofa v2');
    expect(modelNameFromFileName('.glb')).toBe('Model');
  });
});

describe('uploadModelFieldsSchema', () => {
  it('requires a name and a known category', () => {
    expect(
      uploadModelFieldsSchema.safeParse({ name: ' Sofa ', category: 'furniture' }).data,
    ).toEqual({ name: 'Sofa', category: 'furniture' });
    expect(uploadModelFieldsSchema.safeParse({ name: 'Sofa', category: 'cars' }).success).toBe(
      false,
    );
    expect(uploadModelFieldsSchema.safeParse({ name: '', category: 'other' }).success).toBe(false);
  });
});
