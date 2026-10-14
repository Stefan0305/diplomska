import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { compareModels, modelUrl, resolveUploadPath, toModelInfo } from './files';

const base = {
  id: 'm1',
  name: 'Sofa',
  category: 'furniture',
  fileSize: 1234,
  createdAt: new Date('2026-10-14T10:00:00Z'),
};

describe('modelUrl', () => {
  it('serves built-ins from the committed assets folder', () => {
    expect(modelUrl({ ownerId: null, filePath: 'test-table.glb' })).toBe(
      '/files/models/test-table.glb',
    );
  });

  it('serves uploads from the uploads folder', () => {
    expect(modelUrl({ ownerId: 'u1', filePath: 'models/abc.glb' })).toBe(
      '/files/uploads/models/abc.glb',
    );
  });
});

describe('toModelInfo', () => {
  it('maps a built-in model', () => {
    expect(toModelInfo({ ...base, ownerId: null, filePath: 'sofa.glb' })).toEqual({
      id: 'm1',
      name: 'Sofa',
      category: 'furniture',
      url: '/files/models/sofa.glb',
      builtIn: true,
      fileSize: 1234,
      createdAt: '2026-10-14T10:00:00.000Z',
    });
  });

  it('falls back to "other" for an unknown stored category', () => {
    const info = toModelInfo({ ...base, ownerId: 'u1', filePath: 'models/x.glb', category: '??' });
    expect(info.category).toBe('other');
    expect(info.builtIn).toBe(false);
  });
});

describe('compareModels', () => {
  it('sorts built-ins first, then by name', () => {
    const mk = (name: string, builtIn: boolean) =>
      toModelInfo({ ...base, name, ownerId: builtIn ? null : 'u1', filePath: name });
    const sorted = [mk('b', false), mk('z', true), mk('a', false), mk('c', true)].sort(
      compareModels,
    );
    expect(sorted.map((m) => m.name)).toEqual(['c', 'z', 'a', 'b']);
  });
});

describe('resolveUploadPath', () => {
  const uploads = path.resolve('/srv/uploads');

  it('resolves a file inside the uploads folder', () => {
    expect(resolveUploadPath(uploads, 'models/abc.glb')).toBe(
      path.join(uploads, 'models', 'abc.glb'),
    );
  });

  it('refuses paths that escape the uploads folder', () => {
    expect(() => resolveUploadPath(uploads, '../secrets.txt')).toThrow(/outside/);
    expect(() => resolveUploadPath(uploads, 'models/../../x')).toThrow(/outside/);
    expect(() => resolveUploadPath(uploads, path.resolve('/etc/passwd'))).toThrow(/outside/);
    expect(() => resolveUploadPath(uploads, '')).toThrow(/outside/);
  });
});
