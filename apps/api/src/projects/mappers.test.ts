import { createDefaultScene, PROJECT_NAME_MAX_LENGTH } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { HttpError } from '../http';
import {
  assertOwnedProject,
  copyName,
  parseStoredScene,
  serializeScene,
  toProjectDetail,
  toProjectSummary,
} from './mappers';

const storedScene = createDefaultScene();
const project = {
  id: 'p1',
  ownerId: 'user-1',
  name: 'Living room',
  scene: JSON.stringify(storedScene),
  thumbnail: null,
  shareToken: null,
  createdAt: new Date('2026-10-13T10:00:00Z'),
  updatedAt: new Date('2026-10-13T11:00:00Z'),
};

describe('assertOwnedProject', () => {
  it('returns the project for its owner', () => {
    expect(assertOwnedProject(project, 'user-1')).toBe(project);
  });

  it('throws 404 (not 403) for another user, so ids cannot be probed', () => {
    expect(() => assertOwnedProject(project, 'user-2')).toThrow(HttpError);
    try {
      assertOwnedProject(project, 'user-2');
    } catch (err) {
      expect((err as HttpError).status).toBe(404);
    }
  });

  it('throws 404 for a missing project', () => {
    expect(() => assertOwnedProject(null, 'user-1')).toThrow('Project not found');
  });
});

describe('scene storage', () => {
  it('round-trips a scene through its stored string form', () => {
    const scene = createDefaultScene();
    expect(parseStoredScene(serializeScene(scene))).toEqual(scene);
  });

  it('refuses to serialize an invalid scene', () => {
    const scene = { ...createDefaultScene(), version: 2 } as unknown as ReturnType<
      typeof createDefaultScene
    >;
    expect(() => serializeScene(scene)).toThrow();
  });

  it('throws on corrupt stored data instead of returning it', () => {
    expect(() => parseStoredScene('{not json')).toThrow('not valid JSON');
    expect(() => parseStoredScene('{"version":1}')).toThrow();
  });
});

describe('project mappers', () => {
  it('builds a summary without scene contents or owner id', () => {
    const summary = toProjectSummary(project);
    expect(summary).toEqual({
      id: 'p1',
      name: 'Living room',
      createdAt: '2026-10-13T10:00:00.000Z',
      updatedAt: '2026-10-13T11:00:00.000Z',
      thumbnailUrl: null,
    });
  });

  it('turns a stored thumbnail path into a URL', () => {
    expect(toProjectSummary({ ...project, thumbnail: 'thumbnails/p1.png' }).thumbnailUrl).toBe(
      '/files/uploads/thumbnails/p1.png',
    );
  });

  it('includes the parsed scene in the detail', () => {
    expect(toProjectDetail(project).scene).toEqual(storedScene);
  });
});

describe('copyName', () => {
  it('appends (copy)', () => {
    expect(copyName('Garden', PROJECT_NAME_MAX_LENGTH)).toBe('Garden (copy)');
  });

  it('stays within the name limit', () => {
    const copied = copyName('x'.repeat(PROJECT_NAME_MAX_LENGTH), PROJECT_NAME_MAX_LENGTH);
    expect(copied).toHaveLength(PROJECT_NAME_MAX_LENGTH);
    expect(copied.endsWith(' (copy)')).toBe(true);
  });
});
