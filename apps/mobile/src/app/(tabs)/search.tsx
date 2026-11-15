import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { LocationBar } from '@/components/location-bar';
import { ProviderList } from '@/components/provider-list';
import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { categories, overallRating } from '@/data/categories';
import { useLocation } from '@/hooks/use-location';
import { useProviders } from '@/hooks/use-providers';
import { cn } from '@/lib/utils';

const sorts = [
  { id: 'distance', label: 'Nearest' },
  { id: 'rating', label: 'Top rated' },
] as const;
type SortId = (typeof sorts)[number]['id'];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-3.5 py-1.5',
        active ? 'border-primary bg-primary' : 'border-border bg-background'
      )}>
      <Text className={cn('text-sm font-medium', active && 'text-primary-foreground')}>{label}</Text>
    </Pressable>
  );
}

export default function SearchScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>();
  const router = useRouter();
  const { place } = useLocation();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('distance');
  const { providers, loading, error } = useProviders({ category, q: query });

  // The API returns nearest first; "Top rated" puts rated providers on top and keeps distance order within ties.
  const sorted = useMemo(() => {
    if (sort === 'distance') return providers;
    return [...providers].sort((a, b) => {
      const ra = overallRating(a.ratings);
      const rb = overallRating(b.ratings);
      if (ra.reviewCount === 0 && rb.reviewCount === 0) return 0;
      if (ra.reviewCount === 0) return 1;
      if (rb.reviewCount === 0) return -1;
      return rb.rating - ra.rating;
    });
  }, [providers, sort]);

  return (
    <Screen title="Search">
      <LocationBar />

      <View className="justify-center">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name..."
          returnKeyType="search"
          className="pl-10"
        />
        <View className="absolute bottom-0 left-3 top-0 justify-center" pointerEvents="none">
          <Icon as={Search} size={18} className="text-muted-foreground" />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="grow-0"
        contentContainerClassName="gap-2">
        <Chip
          label="All"
          active={!category}
          onPress={() => router.setParams({ category: undefined })}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            active={category === c.id}
            onPress={() => router.setParams({ category: c.id })}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="grow-0"
        contentContainerClassName="items-center gap-2">
        <Text variant="muted">Sort by</Text>
        {sorts.map((s) => (
          <Chip key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} />
        ))}
      </ScrollView>

      <View className="gap-3">
        {!loading && !error && place ? (
          <Text variant="muted">
            {sorted.length} {sorted.length === 1 ? 'provider' : 'providers'} within 25 km
          </Text>
        ) : null}
        <ProviderList providers={sorted} loading={loading} error={error} hasLocation={place !== null} />
      </View>
    </Screen>
  );
}
