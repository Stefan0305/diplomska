import type { ErrorResponse } from '@app/shared';
import type { z } from 'zod';

/** An error with an HTTP status that the central error handler turns into a JSON response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: ErrorResponse['fields'],
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Parse untrusted input with a Zod schema, or throw a 400 with a message per invalid field. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  throw new HttpError(400, 'Invalid input', fields);
}
