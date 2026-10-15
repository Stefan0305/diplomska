import type { ProjectDetail, ProjectSummary, RenameProjectInput } from '@app/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProject,
  deleteProject,
  duplicateProject,
  fetchProject,
  fetchProjects,
  fetchSharedProject,
  renameProject,
  shareProject,
  unshareProject,
} from './api';

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  shared: (token: string) => ['shared', token] as const,
};

export function useProjects() {
  return useQuery({ queryKey: projectKeys.list(), queryFn: fetchProjects });
}

/**
 * The project opened in the editor. It is fetched fresh on every visit and never refetched in
 * the background: the editor store owns the scene from then on, and a refetch would overwrite
 * unsaved edits.
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => fetchProject(id),
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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

/**
 * Turn the share link on or off. The open editor's cached project is patched in place instead
 * of refetched, so the scene being edited is never replaced.
 */
export function useSetSharing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shared }: { id: string; shared: boolean }) =>
      shared ? shareProject(id) : unshareProject(id),
    onSuccess: (summary: ProjectSummary) => {
      queryClient.setQueryData<ProjectDetail>(projectKeys.detail(summary.id), (old) =>
        old ? { ...old, shareToken: summary.shareToken } : old,
      );
      void queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });
}

/** Public: a shared design for the viewer (no login needed). */
export function useSharedProject(token: string) {
  return useQuery({
    queryKey: projectKeys.shared(token),
    queryFn: () => fetchSharedProject(token),
    retry: false,
  });
}
