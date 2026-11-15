import { Hono } from 'hono';

import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './crypto';
import { createSession, createUser, deleteSessionByToken, findUserByEmail } from './db';
import {
  LOGIN_RATE_LIMIT,
  REGISTER_RATE_LIMIT,
  allowAttempts,
  clearAttempts,
  rateLimitKeys,
} from './rate-limit';
import { loginSchema, normalizeEmail, registerSchema } from './schemas';
import { requireAuth } from './middleware';
import { getBearerToken } from '../http';
import { toPublicUser, type AppEnv } from '../types';

export const authRoutes = new Hono<AppEnv>();

authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid registration details' }, 400);

  const email = normalizeEmail(parsed.data.email);
  const limits = rateLimitKeys(c, 'register', email, REGISTER_RATE_LIMIT);
  if (!(await allowAttempts(c.env.DB, limits))) {
    return c.json({ error: 'Too many attempts. Try again later.' }, 429);
  }

  // Hash before checking for an existing email so registration timing is less revealing.
  const passwordHash = await hashPassword(parsed.data.password);
  const existing = await findUserByEmail(c.env.DB, email);
  if (existing) return c.json({ error: 'Unable to create account' }, 400);

  try {
    const user = await createUser(c.env.DB, email, passwordHash, parsed.data.role);
    const session = await createSession(c.env.DB, user.id);
    await clearAttempts(c.env.DB, limits);
    return c.json(
      { user: toPublicUser(user), sessionToken: session.token, expiresAt: session.expiresAt },
      201,
    );
  } catch {
    return c.json({ error: 'Unable to create account' }, 400);
  }
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid email or password' }, 400);

  const email = normalizeEmail(parsed.data.email);
  const limits = rateLimitKeys(c, 'login', email, LOGIN_RATE_LIMIT);
  if (!(await allowAttempts(c.env.DB, limits))) {
    return c.json({ error: 'Too many attempts. Try again later.' }, 429);
  }

  const user = await findUserByEmail(c.env.DB, email);
  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user?.password_hash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user || !passwordMatches) return c.json({ error: 'Invalid email or password' }, 401);

  const session = await createSession(c.env.DB, user.id);
  await clearAttempts(c.env.DB, limits);
  return c.json({ user: toPublicUser(user), sessionToken: session.token, expiresAt: session.expiresAt });
});

authRoutes.post('/logout', async (c) => {
  const token = getBearerToken(c.req.header('Authorization'));
  if (token) await deleteSessionByToken(c.env.DB, token);
  return c.body(null, 204);
});

authRoutes.get('/me', requireAuth, (c) => c.json({ user: c.var.user }));
