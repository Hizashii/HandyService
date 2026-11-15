import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth, requireRole } from '../auth/middleware';
import { readJson } from '../http';
import type { AppEnv, UserRole } from '../types';

const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).optional(),
});

const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((value) => value.title !== undefined || value.description !== undefined);

const offerInputSchema = z.object({
  amount: z.number().int().nonnegative().max(100_000_000),
  message: z.string().trim().max(2000).optional(),
});

const offerUpdateSchema = offerInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0);

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

export const taskRoutes = new Hono<AppEnv>();
export const offerRoutes = new Hono<AppEnv>();

taskRoutes.use('*', requireAuth);

taskRoutes.get('/', async (c) => {
  const user = c.var.user;
  const rows =
    user.role === 'customer'
      ? await c.env.DB
          .prepare('SELECT * FROM tasks WHERE owner_id = ? ORDER BY created_at DESC')
          .bind(user.id)
          .all<TaskRow>()
      : await c.env.DB
          .prepare("SELECT * FROM tasks WHERE status = 'open' ORDER BY created_at DESC")
          .all<TaskRow>();
  return c.json({ tasks: rows.results });
});

taskRoutes.post('/', requireRole('customer'), async (c) => {
  const parsed = taskInputSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: 'Invalid task details' }, 400);

  const id = crypto.randomUUID();
  const now = Date.now();
  const task: TaskRow = {
    id,
    owner_id: c.var.user.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    status: 'open',
    created_at: now,
    updated_at: now,
  };
  await c.env.DB
    .prepare(
      `INSERT INTO tasks (id, owner_id, title, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(task.id, task.owner_id, task.title, task.description, task.status, now, now)
    .run();
  return c.json({ task }, 201);
});

taskRoutes.get('/:id', async (c) => {
  const task = await getVisibleTask(c.env.DB, c.req.param('id'), c.var.user.id, c.var.user.role);
  if (!task) return c.json({ error: 'Task not found' }, 404);
  return c.json({ task });
});

taskRoutes.patch('/:id', requireRole('customer'), async (c) => {
  const parsed = taskUpdateSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: 'Invalid task details' }, 400);

  const existing = await c.env.DB
    .prepare('SELECT * FROM tasks WHERE id = ? AND owner_id = ? LIMIT 1')
    .bind(c.req.param('id'), c.var.user.id)
    .first<TaskRow>();
  if (!existing) return c.json({ error: 'Task not found' }, 404);

  const updated = {
    title: parsed.data.title ?? existing.title,
    description: parsed.data.description === undefined ? existing.description : parsed.data.description,
    updatedAt: Date.now(),
  };
  await c.env.DB
    .prepare('UPDATE tasks SET title = ?, description = ?, updated_at = ? WHERE id = ? AND owner_id = ?')
    .bind(updated.title, updated.description, updated.updatedAt, existing.id, c.var.user.id)
    .run();
  return c.json({ task: { ...existing, ...updated, updated_at: updated.updatedAt } });
});

taskRoutes.delete('/:id', requireRole('customer'), async (c) => {
  const result = await c.env.DB
    .prepare('DELETE FROM tasks WHERE id = ? AND owner_id = ?')
    .bind(c.req.param('id'), c.var.user.id)
    .run();
  if (!result.meta.changes) return c.json({ error: 'Task not found' }, 404);
  return c.body(null, 204);
});

taskRoutes.get('/:id/offers', requireRole('customer'), async (c) => {
  const task = await c.env.DB
    .prepare('SELECT id FROM tasks WHERE id = ? AND owner_id = ? LIMIT 1')
    .bind(c.req.param('id'), c.var.user.id)
    .first<{ id: string }>();
  if (!task) return c.json({ error: 'Task not found' }, 404);

  const offers = await c.env.DB
    .prepare('SELECT * FROM offers WHERE task_id = ? ORDER BY created_at DESC')
    .bind(task.id)
    .all<OfferRow>();
  return c.json({ offers: offers.results });
});

taskRoutes.post('/:id/offers', requireRole('provider'), async (c) => {
  const parsed = offerInputSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: 'Invalid offer details' }, 400);

  const task = await c.env.DB
    .prepare("SELECT id FROM tasks WHERE id = ? AND status = 'open' LIMIT 1")
    .bind(c.req.param('id'))
    .first<{ id: string }>();
  if (!task) return c.json({ error: 'Task not found' }, 404);

  const now = Date.now();
  const offer: OfferRow = {
    id: crypto.randomUUID(),
    task_id: task.id,
    provider_id: c.var.user.id,
    amount: parsed.data.amount,
    message: parsed.data.message ?? null,
    status: 'pending',
    created_at: now,
    updated_at: now,
  };
  try {
    await c.env.DB
      .prepare(
        `INSERT INTO offers
         (id, task_id, provider_id, amount, message, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        offer.id,
        offer.task_id,
        offer.provider_id,
        offer.amount,
        offer.message,
        offer.status,
        now,
        now,
      )
      .run();
  } catch {
    return c.json({ error: 'Unable to create offer' }, 400);
  }
  return c.json({ offer }, 201);
});

offerRoutes.use('*', requireAuth);

offerRoutes.patch('/:id', requireRole('provider'), async (c) => {
  const parsed = offerUpdateSchema.safeParse(await readJson(c));
  if (!parsed.success) return c.json({ error: 'Invalid offer details' }, 400);

  const existing = await c.env.DB
    .prepare('SELECT * FROM offers WHERE id = ? AND provider_id = ? LIMIT 1')
    .bind(c.req.param('id'), c.var.user.id)
    .first<OfferRow>();
  if (!existing) return c.json({ error: 'Offer not found' }, 404);

  const updated = {
    amount: parsed.data.amount ?? existing.amount,
    message: parsed.data.message === undefined ? existing.message : parsed.data.message,
    updatedAt: Date.now(),
  };
  const result = await c.env.DB
    .prepare(
      "UPDATE offers SET amount = ?, message = ?, updated_at = ? WHERE id = ? AND provider_id = ? AND status = 'pending'",
    )
    .bind(updated.amount, updated.message, updated.updatedAt, existing.id, c.var.user.id)
    .run();
  if (!result.meta.changes) return c.json({ error: 'Offer cannot be changed' }, 409);
  return c.json({ offer: { ...existing, ...updated, updated_at: updated.updatedAt } });
});

offerRoutes.delete('/:id', requireRole('provider'), async (c) => {
  const result = await c.env.DB
    .prepare("DELETE FROM offers WHERE id = ? AND provider_id = ? AND status = 'pending'")
    .bind(c.req.param('id'), c.var.user.id)
    .run();
  if (!result.meta.changes) return c.json({ error: 'Offer not found' }, 404);
  return c.body(null, 204);
});

offerRoutes.post('/:id/accept', requireRole('customer'), async (c) => {
  const offer = await c.env.DB
    .prepare(
      `SELECT o.id, o.task_id, o.status, t.owner_id, t.status AS task_status
       FROM offers o JOIN tasks t ON t.id = o.task_id
       WHERE o.id = ? AND t.owner_id = ? LIMIT 1`,
    )
    .bind(c.req.param('id'), c.var.user.id)
    .first<{
      id: string;
      task_id: string;
      status: OfferRow['status'];
      owner_id: string;
      task_status: TaskRow['status'];
    }>();
  if (!offer || offer.task_status !== 'open' || offer.status !== 'pending') {
    return c.json({ error: 'Offer not found' }, 404);
  }

  const now = Date.now();
  await c.env.DB.batch([
    c.env.DB
      .prepare("UPDATE offers SET status = 'accepted', updated_at = ? WHERE id = ?")
      .bind(now, offer.id),
    c.env.DB
      .prepare("UPDATE offers SET status = 'rejected', updated_at = ? WHERE task_id = ? AND id <> ?")
      .bind(now, offer.task_id, offer.id),
    c.env.DB
      .prepare("UPDATE tasks SET status = 'assigned', updated_at = ? WHERE id = ? AND owner_id = ?")
      .bind(now, offer.task_id, c.var.user.id),
  ]);
  return c.json({ accepted: true, offerId: offer.id, taskId: offer.task_id });
});

async function getVisibleTask(
  db: AppEnv['Bindings']['DB'],
  taskId: string,
  userId: string,
  role: UserRole,
): Promise<TaskRow | null> {
  if (role === 'customer') {
    return db
      .prepare('SELECT * FROM tasks WHERE id = ? AND owner_id = ? LIMIT 1')
      .bind(taskId, userId)
      .first<TaskRow>();
  }
  return db
    .prepare("SELECT * FROM tasks WHERE id = ? AND status = 'open' LIMIT 1")
    .bind(taskId)
    .first<TaskRow>();
}
