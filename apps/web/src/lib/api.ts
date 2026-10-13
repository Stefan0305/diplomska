import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** GET a JSON endpoint under /api and validate the response with a shared Zod schema. */
export async function apiGet<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  const res = await fetch(`/api${path}`, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new ApiError(res.status, `GET /api${path} failed with status ${res.status}`);
  }
  return schema.parse(await res.json());
}
