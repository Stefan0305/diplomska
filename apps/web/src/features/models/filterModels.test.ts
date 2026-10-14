import type { ModelInfo } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { filterModels } from './filterModels';

const model = (name: string, category: ModelInfo['category']): ModelInfo => ({
  id: name,
  name,
  category,
  url: `/files/models/${name}.glb`,
  builtIn: true,
  fileSize: 1,
  createdAt: '2026-10-14T10:00:00.000Z',
});

const models = [
  model('Oak table', 'furniture'),
  model('Sofa', 'furniture'),
  model('Fern', 'plants'),
];
const names = (list: ModelInfo[]) => list.map((m) => m.name);

describe('filterModels', () => {
  it('shows everything for "all" with no search', () => {
    expect(names(filterModels(models, 'all', ''))).toEqual(['Oak table', 'Sofa', 'Fern']);
  });

  it('filters by category', () => {
    expect(names(filterModels(models, 'plants', ''))).toEqual(['Fern']);
  });

  it('searches names case-insensitively, ignoring surrounding spaces', () => {
    expect(names(filterModels(models, 'all', '  TABLE '))).toEqual(['Oak table']);
  });

  it('combines category and search', () => {
    expect(names(filterModels(models, 'plants', 'sofa'))).toEqual([]);
  });
});
