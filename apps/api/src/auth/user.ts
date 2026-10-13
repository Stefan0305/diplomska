import type { PublicUser } from '@app/shared';
import type { User } from '../generated/prisma/client';

/** The only user shape that leaves the API: never includes the password hash. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}
