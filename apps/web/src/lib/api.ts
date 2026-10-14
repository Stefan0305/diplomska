import { errorResponseSchema, type ErrorResponse } from '@app/shared';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: ErrorResponse['fields'],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function toApiError(res: Response, method: Method, path: string): Promise<ApiError> {
  const fallback = `${method} /api${path} failed with status ${res.status}`;
  try {
    const parsed = errorResponseSchema.safeParse(await res.json());
    if (parsed.success) return new ApiError(res.status, parsed.data.error, parsed.data.fields);
  } catch {
    // body was not JSON
  }
  return new ApiError(res.status, fallback);
}

async function request(method: Method, path: string, body?: unknown): Promise<Response> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    ...(body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  if (!res.ok) throw await toApiError(res, method, path);
  return res;
}

/** GET a JSON endpoint under /api and validate the response with a shared Zod schema. */
export async function apiGet<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  const res = await request('GET', path);
  return schema.parse(await res.json());
}

/** Send JSON to an endpoint under /api and validate the JSON response. */
export async function apiSend<T extends z.ZodType>(
  method: Exclude<Method, 'GET'>,
  path: string,
  body: unknown,
  schema: T,
): Promise<z.infer<T>> {
  const res = await request(method, path, body);
  return schema.parse(await res.json());
}

/**
 * Upload files as multipart/form-data. The browser sets the Content-Type header itself
 * (including the multipart boundary), so none is set here.
 */
export async function apiUpload<T extends z.ZodType>(
  path: string,
  formData: FormData,
  schema: T,
): Promise<z.infer<T>> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });
  if (!res.ok) throw await toApiError(res, 'POST', path);
  return schema.parse(await res.json());
}

/** Send a request that returns no content (204). */
export async function apiSendNoContent(
  method: Exclude<Method, 'GET'>,
  path: string,
  body?: unknown,
): Promise<void> {
  await request(method, path, body);
}
