import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { marketplace, type Task } from '@/lib/api/marketplace';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setTasks((await marketplace.tasks()).tasks); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Kunne ikke hente opgaver.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  return { tasks, loading, error, reload };
}
