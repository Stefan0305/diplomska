import { describe, expect, it } from 'vitest';
import { healthResponseSchema } from './health';

describe('healthResponseSchema', () => {
  it('accepts a valid health response', () => {
    const result = healthResponseSchema.safeParse({
      status: 'ok',
      uptimeSeconds: 12.5,
      database: 'ok',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative uptime', () => {
    const result = healthResponseSchema.safeParse({
      status: 'ok',
      uptimeSeconds: -1,
      database: 'ok',
    });
    expect(result.success).toBe(false);
  });
});
