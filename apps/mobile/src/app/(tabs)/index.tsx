import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { categoryIcons } from '@/components/category-icon';
import { LocationBar } from '@/components/location-bar';
import { ProviderList } from '@/components/provider-list';
import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { categories } from '@/data/categories';
import { useLocation } from '@/hooks/use-location';
import { useProviders } from '@/hooks/use-providers';

export default function HomeScreen() {
  const router = useRouter();
  const { place } = useLocation();
  const { providers, loading, error } = useProviders();

  return (
    <Screen
      title="Find a pro"
      subtitle="Service providers near you, gathered in one place.">
      <LocationBar />

      <Pressable
        onPress={() => router.push('/search')}
        className="h-12 flex-row items-center gap-2 rounded-md border border-input bg-background px-3">
        <Icon as={Search} size={18} className="text-muted-foreground" />
        <Text className="text-muted-foreground">What do you need help with?</Text>
      </Pressable>

      <View className="gap-3">
        <Text variant="h2">Categories</Text>
        <View className="flex-row flex-wrap gap-3">
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/search', params: { category: c.id } })}
              className="w-[30%] flex-grow items-center gap-2 rounded-xl border border-border bg-card py-4 active:opacity-80">
              <Icon as={categoryIcons[c.id]} size={26} className="text-primary" />
              <Text variant="small" className="font-medium">
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-3">
        <Text variant="h2">Near you</Text>
        <ProviderList
          providers={providers.slice(0, 5)}
          loading={loading}
          error={error}
          hasLocation={place !== null}
        />
      </View>
    </Screen>
  );
}
