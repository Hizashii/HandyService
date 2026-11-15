import { useRouter } from 'expo-router';
import { BriefcaseBusiness, ChevronRight } from 'lucide-react-native';
import { Skeleton } from 'heroui-native/skeleton';
import { Pressable, View } from 'react-native';
import { useTasks } from '@/features/tasks/use-tasks';
import { EmptyState } from './empty-state';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { AuthError } from '@/components/auth/AuthUI';
import { Button } from '@/components/ui/button';

export const statusLabels = { open: 'Åben for tilbud', assigned: 'Aftalt', completed: 'Afsluttet', cancelled: 'Annulleret', pending: 'Afventer svar', accepted: 'Accepteret', rejected: 'Afvist', withdrawn: 'Trukket tilbage' };
export function TaskList({ query = '', category = 'all' }: { query?: string; category?: string }) {
  const router = useRouter();
  const { tasks, loading, error, reload } = useTasks();
  if (loading) return <View accessibilityLabel="Henter opgaver" className="gap-3"><Skeleton className="h-32 rounded-3xl" /><Skeleton className="h-32 rounded-3xl" /></View>;
  if (error) return <View className="gap-3"><AuthError message={error} /><Button variant="outline" onPress={() => void reload()}>Prøv igen</Button></View>;
  const filtered = tasks.filter((task) => `${task.title} ${task.description ?? ''}`.toLocaleLowerCase('da').includes(query.toLocaleLowerCase('da')) && (category === 'all' || task.description?.includes(`[${category}]`)));
  if (!filtered.length) return <EmptyState icon={BriefcaseBusiness} title="Ingen opgaver fundet" body="Prøv en anden søgning, eller kom tilbage senere." />;
  return <View className="gap-3">{filtered.map((task) => <Pressable key={task.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })} className="gap-3 rounded-3xl border border-border bg-surface p-5 active:opacity-80"><View className="flex-row items-center gap-3"><Text variant="h3" className="flex-1">{task.title}</Text><Icon as={ChevronRight} size={20} className="text-brand" /></View><Text numberOfLines={3} className="text-text-secondary">{task.description || 'Ingen beskrivelse tilføjet.'}</Text><Text className="text-sm font-semibold text-brand">{statusLabels[task.status]}</Text></Pressable>)}</View>;
}
