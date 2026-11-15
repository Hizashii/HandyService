import { BriefcaseBusiness } from 'lucide-react-native';
import { Skeleton } from 'heroui-native/skeleton';
import { View } from 'react-native';
import { useTasks } from '@/features/tasks/use-tasks';
import { EmptyState } from './empty-state';
import { AuthError } from '@/components/auth/AuthUI';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
export { statusLabels } from './task-card';

export function TaskList({ query = '', category = 'all' }: { query?: string; category?: string }) {
  const { tasks, loading, error, reload } = useTasks();
  if (loading) return <View accessibilityLabel="Henter opgaver" className="gap-3"><Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-32 rounded-3xl" /></View>;
  if (error) return <View className="gap-3"><AuthError message={error} /><Button variant="outline" onPress={() => void reload()}>Prøv igen</Button></View>;
  const filtered = tasks.filter((task) => `${task.title} ${task.description ?? ''}`.toLocaleLowerCase('da').includes(query.toLocaleLowerCase('da')) && (category === 'all' || task.description?.includes(`[${category}]`)));
  if (!filtered.length) return <EmptyState icon={BriefcaseBusiness} title="Ingen opgaver fundet" body="Prøv en anden søgning, eller kom tilbage senere." />;
  return <View className="gap-3">{filtered.map((task) => <TaskCard key={task.id} task={task} />)}</View>;
}
