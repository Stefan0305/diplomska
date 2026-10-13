import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCurrentUser } from './api';

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchCurrentUser', () => {
  it('returns the user when logged in', async () => {
    const user = { id: '1', email: 'a@b.co', name: 'A', createdAt: '2026-10-13T10:00:00.000Z' };
    mockFetch(200, { user });
    await expect(fetchCurrentUser()).resolves.toEqual(user);
  });

  it('returns null (not an error) when not logged in', async () => {
    mockFetch(401, { error: 'Not authenticated' });
    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it('still throws for other failures', async () => {
    mockFetch(500, { error: 'Internal server error' });
    await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 500 });
  });
});
