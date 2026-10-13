import { z } from 'zod';

/** Shape of every non-2xx JSON response from the API. `fields` maps input fields to messages. */
export const errorResponseSchema = z.object({
  error: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
