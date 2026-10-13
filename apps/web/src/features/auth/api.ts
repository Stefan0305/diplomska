import {
  authResponseSchema,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
} from '@app/shared';
import { ApiError, apiGet, apiSend, apiSendNoContent } from '@/lib/api';

/** The logged-in user, or null when there is no valid session. */
export async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    return (await apiGet('/auth/me', authResponseSchema)).user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function login(input: LoginInput): Promise<PublicUser> {
  return (await apiSend('POST', '/auth/login', input, authResponseSchema)).user;
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  return (await apiSend('POST', '/auth/register', input, authResponseSchema)).user;
}

export function logout(): Promise<void> {
  return apiSendNoContent('POST', '/auth/logout');
}
