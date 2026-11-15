import type { Context } from 'hono';

import type { AppEnv } from '../types';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const attempts = new Map<string, RateLimitEntry>();

export const LOGIN_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 } as const;
export const REGISTER_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 } as const;

function getClientAddress(c: Context<AppEnv>): string {
  return (
    c.req.header('CF-Connecting-IP') ??
    c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export function rateLimitKey(c: Context<AppEnv>, action: string, email: string): string {
  return `${action}:${getClientAddress(c)}:${email}`;
}

export function allowAttempt(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

export function resetRateLimitsForTests(): void {
  attempts.clear();
}
