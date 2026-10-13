import { describe, expect, it } from 'vitest';
import { toErrorResponse } from './errors';
import { HttpError } from './http';

describe('toErrorResponse', () => {
  it('uses the status, message and fields of an HttpError', () => {
    expect(toErrorResponse(new HttpError(409, 'Taken', { email: 'Taken' }))).toEqual({
      status: 409,
      body: { error: 'Taken', fields: { email: 'Taken' } },
    });
  });

  it('maps malformed JSON and oversized bodies to 4xx', () => {
    expect(toErrorResponse({ type: 'entity.parse.failed' }).status).toBe(400);
    expect(toErrorResponse({ type: 'entity.too.large' }).status).toBe(413);
  });

  it('hides the details of unexpected errors', () => {
    const mapped = toErrorResponse(new Error('SQLITE_CANTOPEN: /secret/path/dev.db'));
    expect(mapped).toEqual({ status: 500, body: { error: 'Internal server error' } });
  });
});
