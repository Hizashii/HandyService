import type { Context } from 'hono';

import type { AppEnv } from './types';

export async function readJson(c: Context<AppEnv>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

export function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}
