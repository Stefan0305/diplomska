import { healthResponseSchema } from '@app/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiGet } from './api';

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

describe('apiGet', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed data for a valid response', async () => {
    mockFetch(200, { status: 'ok', uptimeSeconds: 3, database: 'ok' });
    await expect(apiGet('/health', healthResponseSchema)).resolves.toEqual({
      status: 'ok',
      uptimeSeconds: 3,
      database: 'ok',
    });
    expect(fetch).toHaveBeenCalledWith('/api/health', { credentials: 'same-origin' });
  });

  it('throws ApiError on a non-2xx status', async () => {
    mockFetch(500, { error: 'boom' });
    await expect(apiGet('/health', healthResponseSchema)).rejects.toBeInstanceOf(ApiError);
  });

  it('throws when the response does not match the schema', async () => {
    mockFetch(200, { status: 'broken' });
    await expect(apiGet('/health', healthResponseSchema)).rejects.toThrow();
  });
});
