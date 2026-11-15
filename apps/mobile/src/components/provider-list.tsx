import { ActivityIndicator, View } from 'react-native';

import { ProviderCard } from '@/components/provider-card';
import { Text } from '@/components/ui/text';
import type { Provider } from '@/data/types';

/** Loading / error / empty / results for a list of nearby providers. */
export function ProviderList({
  providers,
  loading,
  error,
  stale = false,
  hasLocation,
}: {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  /** The server answered from saved data because it could not refresh this area. */
  stale?: boolean;
  hasLocation: boolean;
}) {
  if (!hasLocation) return null;

  if (loading) {
    return (
      <View className="items-center gap-2 py-10">
        <ActivityIndicator />
        <Text variant="muted" className="text-center">
          Finding providers near you. The first search in a new area can take a minute or two.
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
      {stale ? (
        <View className="rounded-lg border border-border bg-muted px-3 py-2">
          <Text variant="muted">
            We couldn&apos;t refresh live results just now, so this may not include every kind of service nearby. Try
            again in a few minutes.
          </Text>
        </View>
      ) : null}
      {providers.map((p) => (
        <ProviderCard key={p.id} provider={p} />
      ))}
    </View>
  );
}
