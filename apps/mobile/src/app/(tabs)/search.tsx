import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ProviderCard } from '@/components/provider-card';
import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { categories, overallRating, providers } from '@/data/mock';
import { cn } from '@/lib/utils';

const sorts = [
  { id: 'rating', label: 'Top rated' },
  { id: 'reviews', label: 'Most reviews' },
  { id: 'price', label: 'Lowest price' },
  { id: 'distance', label: 'Nearest' },
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
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('rating');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return providers
      .filter((p) => !category || p.categories.some((c) => c === category))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        switch (sort) {
          case 'reviews':
            return overallRating(b.ratings).reviewCount - overallRating(a.ratings).reviewCount;
          case 'price':
            return a.priceLevel - b.priceLevel;
          case 'distance':
            return a.distanceKm - b.distanceKm;
          default:
            return overallRating(b.ratings).rating - overallRating(a.ratings).rating;
        }
      });
  }, [query, category, sort]);

  return (
    <Screen title="Search">
      <View className="justify-center">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Carpenter, window cleaning..."
          returnKeyType="search"
          className="pl-10"
        />
        <View className="absolute left-3" pointerEvents="none">
          <Icon as={Search} size={18} className="text-muted-foreground" />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
        contentContainerClassName="items-center gap-2">
        <Text variant="muted">Sort by</Text>
        {sorts.map((s) => (
          <Chip key={s.id} label={s.label} active={sort === s.id} onPress={() => setSort(s.id)} />
        ))}
      </ScrollView>

      <View className="gap-3">
        <Text variant="muted">
          {results.length} {results.length === 1 ? 'provider' : 'providers'} found
        </Text>
        {results.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
        {results.length === 0 ? (
          <Text variant="muted" className="py-10 text-center">
            Nothing matched. Try a different search or category.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
