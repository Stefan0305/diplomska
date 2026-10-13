import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptimeSeconds: z.number().nonnegative(),
  database: z.enum(['ok', 'error']),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
