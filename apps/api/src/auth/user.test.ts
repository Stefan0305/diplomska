import { publicUserSchema } from '@app/shared';
import { describe, expect, it } from 'vitest';
import { toPublicUser } from './user';

describe('toPublicUser', () => {
  const user = {
    id: 'user-1',
    email: 'ana@example.com',
    name: 'Ana',
    passwordHash: '$2b$10$somethingsecret',
    createdAt: new Date('2026-10-13T10:00:00Z'),
  };

  it('strips the password hash', () => {
    const publicUser = toPublicUser(user);
    expect(publicUser).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(publicUser)).not.toContain('somethingsecret');
  });

  it('matches the shared public user schema', () => {
    expect(publicUserSchema.parse(toPublicUser(user))).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      name: 'Ana',
      createdAt: '2026-10-13T10:00:00.000Z',
    });
  });
});
