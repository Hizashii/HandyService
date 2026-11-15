import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Provider } from '@/data/types';

type SavedContextValue = {
  saved: Provider[];
  isSaved: (id: string) => boolean;
  toggle: (provider: Provider) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

/** In-memory for now; swap for the API/local storage once accounts land. Keeps whole providers so Saved works offline of search. */
export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Provider[]>([]);

  const toggle = useCallback(
    (provider: Provider) =>
      setSaved((list) =>
        list.some((p) => p.id === provider.id) ? list.filter((p) => p.id !== provider.id) : [...list, provider]
      ),
    []
  );

  const value = useMemo(
    () => ({ saved, toggle, isSaved: (id: string) => saved.some((p) => p.id === id) }),
    [saved, toggle]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used inside <SavedProvider>');
  return ctx;
}
