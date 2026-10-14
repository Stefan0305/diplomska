import type { RenameProjectInput } from '@app/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProject,
  deleteProject,
  duplicateProject,
  fetchProject,
  fetchProjects,
  renameProject,
} from './api';

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

export function useProjects() {
  return useQuery({ queryKey: projectKeys.list(), queryFn: fetchProjects });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    retry: false,
  });
}

/** Every project mutation refreshes all project queries (list ordering depends on updatedAt). */
function useInvalidateProjects() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
}

export function useCreateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({ mutationFn: createProject, onSuccess: invalidate });
}

export function useRenameProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RenameProjectInput }) =>
      renameProject(id, input),
    onSuccess: invalidate,
  });
}

export function useDuplicateProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({ mutationFn: duplicateProject, onSuccess: invalidate });
}

export function useDeleteProject() {
  const invalidate = useInvalidateProjects();
  return useMutation({ mutationFn: deleteProject, onSuccess: invalidate });
}
