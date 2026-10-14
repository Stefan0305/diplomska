import type { ModelCategory, ModelInfo } from '@app/shared';

export type CategoryFilter = ModelCategory | 'all';

/** Library filter: category tab plus a case-insensitive search on the model name. */
export function filterModels(
  models: ModelInfo[],
  category: CategoryFilter,
  search: string,
): ModelInfo[] {
  const query = search.trim().toLowerCase();
  return models.filter(
    (model) =>
      (category === 'all' || model.category === category) &&
      (query === '' || model.name.toLowerCase().includes(query)),
  );
}
