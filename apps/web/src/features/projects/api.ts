import {
  projectDetailResponseSchema,
  projectListResponseSchema,
  projectResponseSchema,
  type CreateProjectInput,
  type ProjectDetail,
  type ProjectSummary,
  type RenameProjectInput,
  type SaveSceneInput,
} from '@app/shared';
import { apiGet, apiSend, apiSendNoContent } from '@/lib/api';

export async function fetchProjects(): Promise<ProjectSummary[]> {
  return (await apiGet('/projects', projectListResponseSchema)).projects;
}

export async function fetchProject(id: string): Promise<ProjectDetail> {
  return (await apiGet(`/projects/${encodeURIComponent(id)}`, projectDetailResponseSchema)).project;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectSummary> {
  return (await apiSend('POST', '/projects', input, projectResponseSchema)).project;
}

export async function renameProject(
  id: string,
  input: RenameProjectInput,
): Promise<ProjectSummary> {
  return (
    await apiSend('PATCH', `/projects/${encodeURIComponent(id)}`, input, projectResponseSchema)
  ).project;
}

export async function duplicateProject(id: string): Promise<ProjectSummary> {
  return (
    await apiSend(
      'POST',
      `/projects/${encodeURIComponent(id)}/duplicate`,
      undefined,
      projectResponseSchema,
    )
  ).project;
}

export function deleteProject(id: string): Promise<void> {
  return apiSendNoContent('DELETE', `/projects/${encodeURIComponent(id)}`);
}

/** Save the editor's scene (and optionally a new thumbnail); returns the updated summary. */
export async function saveScene(id: string, input: SaveSceneInput): Promise<ProjectSummary> {
  return (
    await apiSend('PUT', `/projects/${encodeURIComponent(id)}/scene`, input, projectResponseSchema)
  ).project;
}
