import {
  modelListResponseSchema,
  modelResponseSchema,
  type ModelInfo,
  type UploadModelFields,
} from '@app/shared';
import { apiGet, apiSendNoContent, apiUpload } from '@/lib/api';

export async function fetchModels(): Promise<ModelInfo[]> {
  return (await apiGet('/models', modelListResponseSchema)).models;
}

export async function uploadModel(file: File, fields: UploadModelFields): Promise<ModelInfo> {
  const form = new FormData();
  form.set('name', fields.name);
  form.set('category', fields.category);
  form.set('file', file); // last, so text fields are parsed before the file streams in
  return (await apiUpload('/models', form, modelResponseSchema)).model;
}

export function deleteModel(id: string): Promise<void> {
  return apiSendNoContent('DELETE', `/models/${encodeURIComponent(id)}`);
}
