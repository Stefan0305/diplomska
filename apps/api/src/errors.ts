import type { ErrorResponse } from '@app/shared';
import { HttpError } from './http';

export interface MappedError {
  status: number;
  body: ErrorResponse;
}

/** Map any thrown value to a status and a safe JSON body (internal details are never exposed). */
export function toErrorResponse(err: unknown): MappedError {
  if (err instanceof HttpError) {
    return { status: err.status, body: { error: err.message, fields: err.fields } };
  }
  // Errors raised by express.json() carry a `type` and a 4xx `status`.
  if (typeof err === 'object' && err !== null && 'type' in err) {
    if (err.type === 'entity.parse.failed') {
      return { status: 400, body: { error: 'Malformed JSON body' } };
    }
    if (err.type === 'entity.too.large') {
      return { status: 413, body: { error: 'Request body too large' } };
    }
  }
  return { status: 500, body: { error: 'Internal server error' } };
}
