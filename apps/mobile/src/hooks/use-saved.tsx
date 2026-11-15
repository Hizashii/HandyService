import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type SavedContextValue = {
  savedIds: string[];
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

/** In-memory for now; swap for the API/local storage once accounts land. */
export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const toggle = useCallback(
    (id: string) =>
      setSavedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id])),
    []
  );

  const value = useMemo(
    () => ({ savedIds, toggle, isSaved: (id: string) => savedIds.includes(id) }),
    [savedIds, toggle]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used inside <SavedProvider>');
  return ctx;
}
