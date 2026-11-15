import { Filter, MapPin, Search as SearchIcon } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip } from 'heroui-native/chip';

import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { TaskList } from '@/components/marketplace/task-list';
import { LocationBar } from '@/components/location-bar';
import { ProviderList } from '@/components/provider-list';
import { useLocation } from '@/hooks/use-location';
import { useProviders } from '@/hooks/use-providers';

const filters = [
  { id: 'all', label: 'Alle' },
  { id: 'cleaning', label: 'Rengøring' },
  { id: 'handyman', label: 'Handyman' },
  { id: 'moving', label: 'Flytning' },
  { id: 'assembly', label: 'Montering' },
  { id: 'gardening', label: 'Have & ude' },
  { id: 'other', label: 'Andet' },
] as const;

export default function ExploreScreen() {
  const { category, mode: initialMode } = useLocalSearchParams<{ category?: string; mode?: string }>();
  const [mode, setMode] = useState(initialMode ?? 'tasks');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(category ?? 'all');
  const selectedFilter = useMemo(() => filters.find((filter) => filter.id === activeFilter), [activeFilter]);
  const { place } = useLocation();
  const providerCategory = activeFilter === 'handyman' ? 'repairs' : activeFilter === 'assembly' ? 'carpentry' : activeFilter === 'all' || activeFilter === 'other' ? undefined : activeFilter;
  const providerResults = useProviders({ category: providerCategory, q: query });

  return (
    <Screen title="Udforsk opgaver" subtitle="Find lokale opgaver og den næste gode aftale.">
      <View className="gap-3">
        <View className="flex-row gap-2 rounded-xl border border-border bg-surface-muted p-1"><Chip color="default" className={mode === 'tasks' ? 'flex-1 rounded-lg bg-surface' : 'flex-1 rounded-lg bg-surface-muted'} onPress={() => setMode('tasks')} variant="secondary"><Chip.Label className="text-foreground">Opgaver</Chip.Label></Chip><Chip color="default" className={mode === 'providers' ? 'flex-1 rounded-lg bg-surface' : 'flex-1 rounded-lg bg-surface-muted'} onPress={() => setMode('providers')} variant="secondary"><Chip.Label className="text-foreground">Find hjælpere</Chip.Label></Chip></View>
        {mode === 'providers' ? <LocationBar /> : null}
        <View className="relative justify-center">
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Søg efter en opgave"
            className="min-h-14 rounded-2xl border border-border bg-surface pl-12 text-base"
            accessibilityLabel="Search tasks"
          />
          <View className="absolute left-4" pointerEvents="none">
            <Icon as={SearchIcon} size={19} className="text-brand" />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              size="md"
              variant={activeFilter === filter.id ? 'primary' : 'soft'}
              color={activeFilter === filter.id ? 'accent' : 'default'}
              onPress={() => setActiveFilter(filter.id)}>
              <Chip.Label>{filter.label}</Chip.Label>
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="h2">{selectedFilter?.label ?? 'Alle'} opgaver</Text>
          <View className="flex-row items-center gap-1">
            <Icon as={Filter} size={15} className="text-text-secondary" />
            <Text variant="small" className="text-text-secondary">Nyeste først</Text>
          </View>
        </View>
        {mode === 'providers' ? <ProviderList {...providerResults} hasLocation={Boolean(place)} /> : <TaskList query={query} category={activeFilter} />}
      </View>

      <View className="flex-row gap-3 rounded-3xl border border-border bg-surface p-4">
        <Icon as={MapPin} size={19} className="mt-0.5 text-brand" />
        <View className="flex-1 gap-1">
          <Text className="font-bold">Lokal søgning</Text>
          <Text className="leading-5 text-text-secondary">Søg efter by eller postnummer for at finde opgaver i dit område. Kundekonti ser egne opgaver.</Text>
        </View>
      </View>
    </Screen>
  );
}
