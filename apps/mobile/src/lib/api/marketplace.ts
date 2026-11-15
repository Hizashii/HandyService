import { ApiError } from '@/auth/api';
import { getStoredSessionToken } from '@/auth/storage';

export type Task = { id: string; owner_id: string; title: string; description: string | null; status: 'open' | 'assigned' | 'completed' | 'cancelled'; created_at: number; updated_at: number };
export type Offer = { id: string; task_id: string; provider_id: string; amount: number; message: string | null; status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'; created_at: number };
const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, '');
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = await getStoredSessionToken();
  if (!token) throw new ApiError('Log ind igen for at fortsætte.', 401);
  let response: Response;
  try {
    response = await fetch(`${base}/api/${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch { throw new ApiError('Ingen forbindelse. Tjek dit netværk og prøv igen.', 0); }
  if (response.status === 204) return undefined as T;
  const payload = await response.json();
  if (!response.ok) throw new ApiError(payload.error ?? 'Handlingen kunne ikke gennemføres.', response.status);
  return payload as T;
}
export const marketplace = {
  tasks: () => request<{ tasks: Task[] }>('tasks'),
  task: (id: string) => request<{ task: Task }>(`tasks/${encodeURIComponent(id)}`),
  create: (input: { title: string; description: string }) => request<{ task: Task }>('tasks', 'POST', input),
  offers: (id: string) => request<{ offers: Offer[] }>(`tasks/${encodeURIComponent(id)}/offers`),
  quote: (id: string, input: { amount: number; message: string }) => request<{ offer: Offer }>(`tasks/${encodeURIComponent(id)}/offers`, 'POST', input),
  accept: (id: string) => request(`offers/${encodeURIComponent(id)}/accept`, 'POST'),
};
