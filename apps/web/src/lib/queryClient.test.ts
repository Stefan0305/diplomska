import { describe, expect, it } from 'vitest';
import { currentUserKey } from '@/features/auth/hooks';
import { ApiError } from './api';
import { createQueryClient } from './queryClient';

const user = { id: '1', email: 'a@b.co', name: 'A', createdAt: '2026-10-13T10:00:00.000Z' };

describe('createQueryClient', () => {
  it('logs the user out locally when any query fails with 401', async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(currentUserKey, user);

    await queryClient
      .fetchQuery({
        queryKey: ['projects'],
        queryFn: () => Promise.reject(new ApiError(401, 'Not authenticated')),
        retry: false,
      })
      .catch(() => undefined);

    expect(queryClient.getQueryData(currentUserKey)).toBeNull();
  });

  it('keeps the user for other errors', async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(currentUserKey, user);

    await queryClient
      .fetchQuery({
        queryKey: ['projects'],
        queryFn: () => Promise.reject(new ApiError(500, 'Boom')),
        retry: false,
      })
      .catch(() => undefined);

    expect(queryClient.getQueryData(currentUserKey)).toEqual(user);
  });
});
