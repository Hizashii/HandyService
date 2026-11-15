import { beforeEach, describe, expect, it } from 'vitest';

import { hashSessionToken } from '../src/auth/crypto';
import { allowAttempts, type RateLimitKey } from '../src/auth/rate-limit';
import { app } from '../src';
import type { SessionRow, UserRole, UserRow } from '../src/types';

type TaskRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  created_at: number;
  updated_at: number;
};

type OfferRow = {
  id: string;
  task_id: string;
  provider_id: string;
  amount: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: number;
  updated_at: number;
};

type RateLimitRow = { count: number; resetAt: number };

class TestStatement {
  private values: unknown[] = [];

  constructor(
    private readonly database: TestD1,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]): this {
    this.values = values;
    return this;
  }

  first<T>(): Promise<T | null> {
    return Promise.resolve(this.database.first(this.sql, this.values) as T | null);
  }

  all<T>(): Promise<{ results: T[] }> {
    return Promise.resolve({ results: this.database.all(this.sql, this.values) as T[] });
  }

  run(): Promise<{ success: true; meta: { changes: number } }> {
    return Promise.resolve({ success: true, meta: { changes: this.database.run(this.sql, this.values) } });
  }
}

class TestD1 {
  readonly users = new Map<string, UserRow>();
  readonly sessions = new Map<string, SessionRow>();
  readonly tasks = new Map<string, TaskRow>();
  readonly offers = new Map<string, OfferRow>();
  readonly rateLimits = new Map<string, RateLimitRow>();

  prepare(sql: string): TestStatement {
    return new TestStatement(this, sql);
  }

  async batch(statements: TestStatement[]): Promise<unknown[]> {
    return Promise.all(statements.map((statement) => statement.run()));
  }

  async expireSession(token: string): Promise<void> {
    const tokenHash = await hashSessionToken(token);
    const session = [...this.sessions.values()].find((candidate) => candidate.token_hash === tokenHash);
    if (session) session.expires_at = Date.now() - 1;
  }

  first(sql: string, values: unknown[]): unknown {
    const normalized = this.normalize(sql);

    if (normalized.includes('insert into auth_rate_limits')) {
      const key = String(values[0]);
      const resetAt = Number(values[1]);
      const now = Number(values[2]);
      const current = this.rateLimits.get(key);
      const next = !current || current.resetAt <= now
        ? { count: 1, resetAt }
        : { count: current.count + 1, resetAt: current.resetAt };
      this.rateLimits.set(key, next);
      return { count: next.count };
    }

    if (normalized.includes('from users where email')) {
      return [...this.users.values()].find((user) => user.email === values[0]) ?? null;
    }

    if (normalized.includes('from users where id')) {
      return this.users.get(String(values[0])) ?? null;
    }

    if (normalized.includes('from sessions s')) {
      const session = [...this.sessions.values()].find((candidate) => candidate.token_hash === values[0]);
      if (!session) return null;
      const user = this.users.get(session.user_id);
      if (!user) return null;
      return {
        ...session,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        user_created_at: user.created_at,
        user_updated_at: user.updated_at,
      };
    }

    if (normalized.includes('from tasks where id') && normalized.includes('owner_id')) {
      const task = this.tasks.get(String(values[0]));
      if (!task || task.owner_id !== values[1]) return null;
      return normalized.startsWith('select id') ? { id: task.id } : task;
    }

    if (normalized.includes("from tasks where id") && normalized.includes("status = 'open'")) {
      const task = this.tasks.get(String(values[0]));
      return task?.status === 'open' ? task : null;
    }

    if (normalized.includes('from offers o join tasks t')) {
      const offer = this.offers.get(String(values[0]));
      const task = offer ? this.tasks.get(offer.task_id) : null;
      if (!offer || !task || task.owner_id !== values[1]) return null;
      return {
        id: offer.id,
        task_id: offer.task_id,
        status: offer.status,
        owner_id: task.owner_id,
        task_status: task.status,
      };
    }

    if (normalized.includes('from offers where id') && normalized.includes('provider_id')) {
      const offer = this.offers.get(String(values[0]));
      return offer?.provider_id === values[1] ? offer : null;
    }

    return null;
  }

  all(sql: string, values: unknown[]): unknown[] {
    const normalized = this.normalize(sql);
    if (normalized.includes('from tasks where owner_id')) {
      return [...this.tasks.values()].filter((task) => task.owner_id === values[0]);
    }
    if (normalized.includes("from tasks where status = 'open'")) {
      return [...this.tasks.values()].filter((task) => task.status === 'open');
    }
    if (normalized.includes('from offers where task_id')) {
      return [...this.offers.values()].filter((offer) => offer.task_id === values[0]);
    }
    return [];
  }

  run(sql: string, values: unknown[]): number {
    const normalized = this.normalize(sql);

    if (normalized.startsWith('delete from auth_rate_limits where reset_at')) {
      const cutoff = Number(values[0]);
      for (const [key, value] of this.rateLimits) {
        if (value.resetAt <= cutoff) this.rateLimits.delete(key);
      }
      return 0;
    }
    if (normalized.startsWith('delete from auth_rate_limits where key')) {
      return Number(this.rateLimits.delete(String(values[0])));
    }
    if (normalized.startsWith('insert into users')) {
      const [id, email, passwordHash, role, createdAt, updatedAt] = values as [
        string,
        string,
        string,
        UserRole,
        number,
        number,
      ];
      this.users.set(id, { id, email, password_hash: passwordHash, role, created_at: createdAt, updated_at: updatedAt });
      return 1;
    }
    if (normalized.startsWith('insert into sessions')) {
      const [id, userId, tokenHash, expiresAt, createdAt, lastSeenAt] = values as [
        string,
        string,
        string,
        number,
        number,
        number,
      ];
      this.sessions.set(id, {
        id,
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: createdAt,
        last_seen_at: lastSeenAt,
      });
      return 1;
    }
    if (normalized.startsWith('delete from sessions where id')) {
      return Number(this.sessions.delete(String(values[0])));
    }
    if (normalized.startsWith('delete from sessions where token_hash')) {
      const session = [...this.sessions.values()].find((candidate) => candidate.token_hash === values[0]);
      return session ? Number(this.sessions.delete(session.id)) : 0;
    }
    if (normalized.startsWith('update sessions set last_seen_at')) {
      const session = this.sessions.get(String(values[1]));
      if (!session) return 0;
      session.last_seen_at = Number(values[0]);
      return 1;
    }
    if (normalized.startsWith('insert into tasks')) {
      const [id, ownerId, title, description, status, createdAt, updatedAt] = values as [
        string,
        string,
        string,
        string | null,
        TaskRow['status'],
        number,
        number,
      ];
      this.tasks.set(id, { id, owner_id: ownerId, title, description, status, created_at: createdAt, updated_at: updatedAt });
      return 1;
    }
    if (normalized.startsWith('delete from tasks')) {
      const task = this.tasks.get(String(values[0]));
      if (!task || task.owner_id !== values[1]) return 0;
      this.tasks.delete(task.id);
      return 1;
    }
    if (normalized.startsWith('insert into offers')) {
      const [id, taskId, providerId, amount, message, status, createdAt, updatedAt] = values as [
        string,
        string,
        string,
        number,
        string | null,
        OfferRow['status'],
        number,
        number,
      ];
      this.offers.set(id, { id, task_id: taskId, provider_id: providerId, amount, message, status, created_at: createdAt, updated_at: updatedAt });
      return 1;
    }
    if (normalized.startsWith('update offers set status = \'accepted\'')) {
      const offer = this.offers.get(String(values[1]));
      if (!offer) return 0;
      offer.status = 'accepted';
      offer.updated_at = Number(values[0]);
      return 1;
    }
    if (normalized.startsWith('update offers set status = \'rejected\'')) {
      let changes = 0;
      for (const offer of this.offers.values()) {
        if (offer.task_id === values[1] && offer.id !== values[2]) {
          offer.status = 'rejected';
          offer.updated_at = Number(values[0]);
          changes += 1;
        }
      }
      return changes;
    }
    if (normalized.startsWith('update tasks set status = \'assigned\'')) {
      const task = this.tasks.get(String(values[1]));
      if (!task || task.owner_id !== values[2]) return 0;
      task.status = 'assigned';
      task.updated_at = Number(values[0]);
      return 1;
    }

    return 0;
  }

  private normalize(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim().toLowerCase();
  }
}

let db: TestD1;

async function request(
  path: string,
  options: { method?: string; body?: unknown; token?: string; ip?: string } = {},
): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  if (options.ip) headers.set('CF-Connecting-IP', options.ip);
  return app.request(
    `http://localhost${path}`,
    {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    },
    { DB: db as never },
  );
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function register(email: string, role: UserRole): Promise<{ sessionToken: string; user: { id: string } }> {
  const response = await request('/api/auth/register', {
    method: 'POST',
    body: { email, password: 'correct horse battery staple', role },
  });
  expect(response.status).toBe(201);
  return json(response);
}

beforeEach(() => {
  db = new TestD1();
});

describe('authentication', () => {
  it('registers, logs in, and returns only public user fields', async () => {
    const registration = await register('Person@Example.com', 'customer');
    expect(registration.user).toHaveProperty('id');
    expect(registration).not.toHaveProperty('password_hash');

    const me = await request('/api/auth/me', { token: registration.sessionToken });
    expect(me.status).toBe(200);
    expect((await json<{ user: { email: string; role: UserRole } }>(me)).user).toMatchObject({
      email: 'person@example.com',
      role: 'customer',
    });

    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'person@example.com', password: 'wrong password' },
    });
    expect(badLogin.status).toBe(401);

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'PERSON@example.com', password: 'correct horse battery staple' },
    });
    expect(login.status).toBe(200);
    expect((await json<{ user: { email: string } }>(login)).user.email).toBe('person@example.com');
  });

  it('rejects revoked and expired sessions', async () => {
    const first = await register('revoked@example.com', 'customer');
    expect((await request('/api/auth/logout', { method: 'POST', token: first.sessionToken })).status).toBe(204);
    expect((await request('/api/auth/me', { token: first.sessionToken })).status).toBe(401);

    const second = await register('expired@example.com', 'customer');
    await db.expireSession(second.sessionToken);
    expect((await request('/api/auth/me', { token: second.sessionToken })).status).toBe(401);
    expect(db.sessions.size).toBe(0);
  });
});

describe('role and ownership checks', () => {
  it('rejects wrong roles and hides another customer\'s task', async () => {
    const owner = await register('owner@example.com', 'customer');
    const otherCustomer = await register('other@example.com', 'customer');
    const provider = await register('provider@example.com', 'provider');

    const providerCreate = await request('/api/tasks', {
      method: 'POST',
      token: provider.sessionToken,
      body: { title: 'Not allowed' },
    });
    expect(providerCreate.status).toBe(403);

    const created = await request('/api/tasks', {
      method: 'POST',
      token: owner.sessionToken,
      body: { title: 'Repair kitchen door' },
    });
    expect(created.status).toBe(201);
    const taskId = (await json<{ task: { id: string } }>(created)).task.id;

    const hidden = await request(`/api/tasks/${taskId}`, { token: otherCustomer.sessionToken });
    expect(hidden.status).toBe(404);

    const ownerRead = await request(`/api/tasks/${taskId}`, { token: owner.sessionToken });
    expect(ownerRead.status).toBe(200);

    const offerByCustomer = await request(`/api/tasks/${taskId}/offers`, {
      method: 'POST',
      token: owner.sessionToken,
      body: { amount: 100 },
    });
    expect(offerByCustomer.status).toBe(403);
  });
});

describe('shared rate limits', () => {
  const key = (value: string): RateLimitKey => ({ key: value, max: 2, windowMs: 60_000 });

  it('limits by IP and account independently across requests', async () => {
    const first = [key('login:ip:one'), key('login:account:a@example.com')];
    const sameIpOtherAccount = [key('login:ip:one'), key('login:account:b@example.com')];
    const otherIpSameAccount = [key('login:ip:two'), key('login:account:a@example.com')];

    expect(await allowAttempts(db as never, first)).toBe(true);
    expect(await allowAttempts(db as never, first)).toBe(true);
    expect(await allowAttempts(db as never, sameIpOtherAccount)).toBe(false);
    expect(await allowAttempts(db as never, otherIpSameAccount)).toBe(false);
  });
});
