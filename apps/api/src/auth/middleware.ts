import { createMiddleware } from 'hono/factory';

import { findSessionByToken } from './db';
import { getBearerToken } from '../http';
import { toPublicUser, type AppEnv, type UserRole } from '../types';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'Authentication required' }, 401);

  const authenticated = await findSessionByToken(c.env.DB, token);
  if (!authenticated) return c.json({ error: 'Session expired or invalid' }, 401);

  c.set('user', toPublicUser(authenticated.user));
  c.set('session', authenticated.session);
  return next();
});

export function requireRole(role: UserRole) {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (c.var.user.role !== role) return c.json({ error: 'Forbidden' }, 403);
    return next();
  });
}
