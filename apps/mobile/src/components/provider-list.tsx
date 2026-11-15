import { ActivityIndicator, View } from 'react-native';

import { ProviderCard } from '@/components/provider-card';
import { Text } from '@/components/ui/text';
import type { Provider } from '@/data/types';

/** Loading / error / empty / results for a list of nearby providers. */
export function ProviderList({
  providers,
  loading,
  error,
  hasLocation,
}: {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  hasLocation: boolean;
}) {
  if (!hasLocation) return null;

  if (loading) {
    return (
      <View className="items-center gap-2 py-10">
        <ActivityIndicator />
        <Text variant="muted" className="text-center">
          Finding providers near you. The first search in a new area can take up to a minute.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <Text variant="muted" className="py-10 text-center">
        {error}
      </Text>
    );
  }

  if (providers.length === 0) {
    return (
      <Text variant="muted" className="py-10 text-center">
        No providers found within 25 km. Try another category or change your location.
      </Text>
    );
  }

  return (
    <View className="gap-3">
      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} />
      ))}
    </View>
  );
}
