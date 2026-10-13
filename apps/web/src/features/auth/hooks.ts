import type { PublicUser } from '@app/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, login, logout, register } from './api';

export const currentUserKey = ['auth', 'me'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => queryClient.setQueryData<PublicUser | null>(currentUserKey, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: register,
    onSuccess: (user) => queryClient.setQueryData<PublicUser | null>(currentUserKey, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Drop everything cached for the previous user, then mark the session as gone.
      queryClient.clear();
      queryClient.setQueryData<PublicUser | null>(currentUserKey, null);
    },
  });
}
