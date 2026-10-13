import { z } from 'zod';

/** bcrypt only uses the first 72 bytes of a password; cap the length so nothing is silently ignored. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address').max(254, 'Email is too long'));

export const registerInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  email: emailSchema,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`),
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(PASSWORD_MAX_LENGTH),
});

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  createdAt: z.iso.datetime(),
});

export const authResponseSchema = z.object({
  user: publicUserSchema,
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
