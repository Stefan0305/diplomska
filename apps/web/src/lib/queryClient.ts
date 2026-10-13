import type { PublicUser } from '@app/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { currentUserKey } from '@/features/auth/hooks';
import { ApiError } from './api';

/**
 * Any 401 from the API means the session is gone (expired or logged out elsewhere).
 * Marking the current user as null makes RequireAuth redirect to the login page.
 */
export function createQueryClient(): QueryClient {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
  });

  function handleError(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      queryClient.setQueryData<PublicUser | null>(currentUserKey, null);
    }
  }

  return queryClient;
}
