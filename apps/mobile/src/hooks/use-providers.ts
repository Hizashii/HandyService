import { useEffect, useState } from 'react';

import type { Provider } from '@/data/types';
import { useLocation } from '@/hooks/use-location';
import { searchProviders } from '@/lib/api';

/**
 * `stale`: the server could not refresh this area and answered from saved data, which may be incomplete.
 * `refreshing`: the server is still fetching the rest of the area in the background.
 */
type Result = { key: string; providers: Provider[]; error: string | null; stale: boolean; refreshing: boolean };

/** While the server is still searching, ask again this often to pick up newly found providers. */
const POLL_MS = 4000;
/** Stop asking after about two minutes; whatever has arrived by then is the final list. */
const MAX_POLLS = 30;

/** Resolves after `ms`, or immediately if the signal aborts. */
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * Providers near the user's current place, optionally filtered by category and name. The first answer
 * arrives quickly with whatever is nearest; while the server keeps searching, the list is refreshed so
 * more providers appear without the user doing anything.
 */
export function useProviders({ category, q }: { category?: string; q?: string } = {}) {
  const { place } = useLocation();
  const [result, setResult] = useState<Result | null>(null);
  const lat = place?.lat;
  const lng = place?.lng;
  const name = q?.trim() || undefined;

  // Identifies the request the UI currently wants; a result for any other key is out of date.
  const key = lat !== undefined && lng !== undefined ? `${lat},${lng}|${category ?? ''}|${name ?? ''}` : null;

  useEffect(() => {
    if (key === null || lat === undefined || lng === undefined) return;
    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      // Debounce typing so we don't query on every keystroke.
      if (name) await wait(400, signal);
      for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
        if (signal.aborted) return;
        try {
          const res = await searchProviders({ lat, lng }, { category, q: name }, signal);
          if (signal.aborted) return;
          setResult({ key, providers: res.providers, error: null, stale: res.stale, refreshing: res.refreshing });
          if (!res.refreshing) return;
        } catch (err) {
          if (signal.aborted) return;
          setResult({
            key,
            providers: [],
            error: err instanceof Error ? err.message : 'Something went wrong',
            stale: false,
            refreshing: false,
          });
          return;
        }
        await wait(POLL_MS, signal);
      }
      // Gave up waiting for the server to finish: treat what we have as final.
      if (!signal.aborted) setResult((prev) => (prev?.key === key ? { ...prev, refreshing: false } : prev));
    };

    void run();
    return () => controller.abort();
  }, [key, lat, lng, category, name]);

  const current = result !== null && result.key === key ? result : null;
  return {
    providers: current?.providers ?? [],
    loading: key !== null && current === null,
    error: current?.error ?? null,
    stale: current?.stale ?? false,
    refreshing: current?.refreshing ?? false,
  };
}
