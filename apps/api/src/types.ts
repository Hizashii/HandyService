import type { D1Database } from '@cloudflare/workers-types';

export type UserRole = 'customer' | 'provider';

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: number;
  updated_at: number;
};

export type PublicUser = Omit<UserRow, 'password_hash'>;

export type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  created_at: number;
  last_seen_at: number;
};

export type AuthenticatedSession = {
  session: SessionRow;
  user: UserRow;
};

export type AppEnv = {
  Bindings: {
    DB: D1Database;
    /** Comma-separated ISO country codes the /api/geocode endpoint is limited to (e.g. "dk"). */
    GEOCODE_COUNTRIES?: string;
  };
  Variables: {
    user: PublicUser;
    session: SessionRow;
  };
};

export function toPublicUser(user: UserRow): PublicUser {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
