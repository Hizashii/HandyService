import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Coords, Place, Provider } from '@/data/types';

/**
 * API base URL. Set EXPO_PUBLIC_API_URL for a deployed Worker or a physical device
 * (use your computer's LAN IP, e.g. http://192.168.1.20:8787). The defaults reach a
 * `wrangler dev` server from the Android emulator and the iOS simulator / web.
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'android') return 'http://10.0.2.2:8787';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:8787`;
}

export const API_URL = resolveBaseUrl();

/** A cold area fetch takes ~45s on the free upstream (and can retry on a mirror), so allow plenty of time. */
const TIMEOUT_MS = 120_000;

export class ApiError extends Error {}

async function get<T>(path: string, params: Record<string, string | number | undefined>, signal?: AbortSignal) {
  const url = new URL(API_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  signal?.addEventListener('abort', () => timeout.abort());
  try {
    const res = await fetch(url, { signal: timeout.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(body?.error ?? `Request failed (${res.status})`);
    return body as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (signal?.aborted) throw err;
    throw new ApiError('Could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

export function searchProviders(
  at: Coords,
  opts: { category?: string; q?: string; radius?: number },
  signal?: AbortSignal
) {
  return get<{ providers: Provider[]; radiusKm: number; stale: boolean }>(
    '/api/providers',
    { lat: at.lat, lng: at.lng, category: opts.category, q: opts.q, radius: opts.radius },
    signal
  );
}

export function getProvider(id: string, at?: Coords, signal?: AbortSignal) {
  return get<{ provider: Provider }>(`/api/providers/${encodeURIComponent(id)}`, { lat: at?.lat, lng: at?.lng }, signal);
}

export function geocode(q: string, signal?: AbortSignal) {
  return get<{ places: Place[] }>('/api/geocode', { q }, signal);
}
