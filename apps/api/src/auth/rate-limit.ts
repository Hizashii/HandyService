import type { Context } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';

import type { AppEnv } from '../types';

export type RateLimitConfig = {
  max: number;
  windowMs: number;
};

export type RateLimitKey = RateLimitConfig & {
  key: string;
};

export const LOGIN_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 } as const;
export const REGISTER_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 } as const;

function getClientAddress(c: Context<AppEnv>): string {
  return (
    c.req.header('CF-Connecting-IP') ??
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export function rateLimitKeys(
  c: Context<AppEnv>,
  action: string,
  email: string,
  config: RateLimitConfig,
): RateLimitKey[] {
  return [
    { key: `${action}:ip:${getClientAddress(c)}`, ...config },
    { key: `${action}:account:${email}`, ...config },
  ];
}

async function allowAttempt(db: D1Database, { key, max, windowMs }: RateLimitKey): Promise<boolean> {
  const now = Date.now();
  const resetAt = now + windowMs;

  // Keep one bounded table by removing every expired key before inserting this attempt.
  await db.prepare('DELETE FROM auth_rate_limits WHERE reset_at <= ?').bind(now).run();

  const row = await db
    .prepare(
      `INSERT INTO auth_rate_limits (key, count, reset_at)
       VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE
           WHEN auth_rate_limits.reset_at <= ? THEN 1
           ELSE auth_rate_limits.count + 1
         END,
         reset_at = CASE
           WHEN auth_rate_limits.reset_at <= ? THEN excluded.reset_at
           ELSE auth_rate_limits.reset_at
         END
       RETURNING count`,
    )
    .bind(key, resetAt, now, now)
    .first<{ count: number }>();

  return row !== null && row.count <= max;
}

export async function allowAttempts(db: D1Database, keys: RateLimitKey[]): Promise<boolean> {
  const results = await Promise.all(keys.map((key) => allowAttempt(db, key)));
  return results.every(Boolean);
}

export async function clearAttempts(db: D1Database, keys: RateLimitKey[]): Promise<void> {
  await db.batch(
    keys.map(({ key }) => db.prepare('DELETE FROM auth_rate_limits WHERE key = ?').bind(key)),
  );
}
