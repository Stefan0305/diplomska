import { authResponseSchema, healthResponseSchema } from '@app/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet, apiSend, apiSendNoContent } from './api';

function mockFetch(status: number, body?: unknown) {
  const responseBody = body === undefined ? null : JSON.stringify(body);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(responseBody, { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiGet', () => {
  it('returns parsed data for a valid response', async () => {
    mockFetch(200, { status: 'ok', uptimeSeconds: 3, database: 'ok' });
    await expect(apiGet('/health', healthResponseSchema)).resolves.toEqual({
      status: 'ok',
      uptimeSeconds: 3,
      database: 'ok',
    });
    expect(fetch).toHaveBeenCalledWith('/api/health', {
      method: 'GET',
      credentials: 'same-origin',
    });
  });

  it('throws ApiError with the server message on a non-2xx status', async () => {
    mockFetch(401, { error: 'Not authenticated' });
    const error = await apiGet('/auth/me', authResponseSchema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: 'Not authenticated' });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 502 })));
    await expect(apiGet('/health', healthResponseSchema)).rejects.toMatchObject({ status: 502 });
  });

  it('throws when the response does not match the schema', async () => {
    mockFetch(200, { status: 'broken' });
    await expect(apiGet('/health', healthResponseSchema)).rejects.toThrow();
  });
});

describe('apiSend', () => {
  it('sends a JSON body', async () => {
    const user = { id: '1', email: 'a@b.co', name: 'A', createdAt: '2026-10-13T10:00:00.000Z' };
    mockFetch(201, { user });
    await apiSend('POST', '/auth/register', { name: 'A' }, authResponseSchema);
    expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A' }),
    });
  });

  it('exposes per-field errors from the server', async () => {
    mockFetch(409, { error: 'Taken', fields: { email: 'Taken' } });
    await expect(apiSend('POST', '/auth/register', {}, authResponseSchema)).rejects.toMatchObject({
      status: 409,
      fields: { email: 'Taken' },
    });
  });
});

describe('apiSendNoContent', () => {
  it('resolves on 204', async () => {
    mockFetch(204);
    await expect(apiSendNoContent('POST', '/auth/logout')).resolves.toBeUndefined();
  });
});
