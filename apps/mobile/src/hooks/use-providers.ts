import { useEffect, useState } from 'react';

import type { Provider } from '@/data/types';
import { useLocation } from '@/hooks/use-location';
import { searchProviders } from '@/lib/api';

type Result = { key: string; providers: Provider[]; error: string | null };

/** Providers near the user's current place, optionally filtered by category and name. */
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
    // Debounce typing so we don't query on every keystroke.
    const timer = setTimeout(
      () => {
        searchProviders({ lat, lng }, { category, q: name }, controller.signal)
          .then((res) => setResult({ key, providers: res.providers, error: null }))
          .catch((err) => {
            if (controller.signal.aborted) return;
            setResult({ key, providers: [], error: err instanceof Error ? err.message : 'Something went wrong' });
          });
      },
      name ? 400 : 0
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, lat, lng, category, name]);

  const current = result !== null && result.key === key ? result : null;
  return {
    providers: current?.providers ?? [],
    loading: key !== null && current === null,
    error: current?.error ?? null,
  };
}
