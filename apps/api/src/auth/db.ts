import type { D1Database } from '@cloudflare/workers-types';

import { createSessionToken, hashSessionToken } from './crypto';
import type { AuthenticatedSession, SessionRow, UserRow } from '../types';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function findUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, email, password_hash, role, created_at, updated_at
       FROM users WHERE email = ? LIMIT 1`,
    )
    .bind(email)
    .first<UserRow>();
}

export async function findUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db
    .prepare(
      `SELECT id, email, password_hash, role, created_at, updated_at
       FROM users WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<UserRow>();
}

export async function createUser(
  db: D1Database,
  email: string,
  passwordHash: string,
  role: UserRow['role'],
): Promise<UserRow> {
  const id = crypto.randomUUID();
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, email, passwordHash, role, now, now)
    .run();

  const user = await findUserById(db, id);
  if (!user) throw new Error('User was not created');
  return user;
}

export async function createSession(
  db: D1Database,
  userId: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(crypto.randomUUID(), userId, tokenHash, expiresAt, now, now)
    .run();

  return { token, expiresAt };
}

export async function findSessionByToken(
  db: D1Database,
  token: string,
): Promise<AuthenticatedSession | null> {
  const tokenHash = await hashSessionToken(token);
  const row = await db
    .prepare(
      `SELECT
         s.id, s.user_id, s.token_hash, s.expires_at, s.created_at, s.last_seen_at,
         u.email, u.password_hash, u.role, u.created_at AS user_created_at,
         u.updated_at AS user_updated_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? LIMIT 1`,
    )
    .bind(tokenHash)
    .first<
      SessionRow & {
        email: string;
        password_hash: string;
        role: UserRow['role'];
        user_created_at: number;
        user_updated_at: number;
      }
    >();

  if (!row) return null;
  if (row.expires_at <= Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(row.id).run();
    return null;
  }

  await db
    .prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?')
    .bind(Date.now(), row.id)
    .run();

  return {
    session: {
      id: row.id,
      user_id: row.user_id,
      token_hash: row.token_hash,
      expires_at: row.expires_at,
      created_at: row.created_at,
      last_seen_at: row.last_seen_at,
    },
    user: {
      id: row.user_id,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
    },
  };
}

export async function deleteSessionByToken(db: D1Database, token: string): Promise<void> {
  const tokenHash = await hashSessionToken(token);
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}
