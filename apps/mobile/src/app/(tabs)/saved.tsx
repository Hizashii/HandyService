import { ChevronRight, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TaskList } from '@/components/marketplace/task-list';
import { useSaved } from '@/hooks/use-saved';
import { ProviderCard } from '@/components/provider-card';

export default function TasksScreen() {
  const router = useRouter();
  const { saved } = useSaved();
  return (
    <Screen title="Mine opgaver" subtitle="Følg dine opgaver fra første idé til færdig aftale.">
      <Card className="gap-4 rounded-3xl border-0 bg-accent-soft p-5">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface">
          <Icon as={Plus} size={21} className="text-brand" />
        </View>
        <View className="gap-1">
          <Text variant="h2">Start med din første opgave</Text>
          <Text className="leading-6 text-text-secondary">Fortæl, hvad der skal gøres, så har du et klart udgangspunkt.</Text>
        </View>
        <Pressable accessibilityRole="button" className="min-h-12 flex-row items-center justify-between rounded-2xl bg-brand px-4 active:opacity-80" onPress={() => router.push('/create-task')}>
          <Text className="font-bold text-white">Opret opgave</Text>
          <Icon as={ChevronRight} size={19} className="text-accent-foreground" />
        </Pressable>
      </Card>
      <TaskList />
      <Text variant="h2">Gemte hjælpere</Text>
      {saved.length ? saved.map((provider) => <ProviderCard key={provider.id} provider={provider} />) : <Text className="text-text-secondary">Tryk på hjertet ved en hjælper for at gemme profilen her.</Text>}
    </Screen>
  );
}
