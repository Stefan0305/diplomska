import type { ModelInfo, UploadModelFields } from '@app/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { deleteModel, fetchModels, uploadModel } from './api';

export const modelKeys = { all: ['models'] as const };

export function useModels() {
  return useQuery({ queryKey: modelKeys.all, queryFn: fetchModels, staleTime: 60_000 });
}

/** Model id -> model, for rendering scene objects. */
export function useModelMap(): Map<string, ModelInfo> | undefined {
  const { data } = useModels();
  return useMemo(
    () => (data ? new Map(data.map((model) => [model.id, model])) : undefined),
    [data],
  );
}

export function useUploadModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, fields }: { file: File; fields: UploadModelFields }) =>
      uploadModel(file, fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: modelKeys.all }),
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: modelKeys.all }),
  });
}
