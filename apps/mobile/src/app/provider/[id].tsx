import { Stack, useLocalSearchParams } from 'expo-router';
import { Globe, Heart, MapPin, Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';

import { RatingBadge } from '@/components/rating-stars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getCategory, overallRating } from '@/data/categories';
import type { Provider } from '@/data/types';
import { useLocation } from '@/hooks/use-location';
import { useSaved } from '@/hooks/use-saved';
import { getProvider } from '@/lib/api';
import { distanceKm } from '@/lib/geo';

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { place } = useLocation();
  const { saved: savedList, isSaved, toggle } = useSaved();
  const [fetched, setFetched] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lat = place?.lat;
  const lng = place?.lng;

  useEffect(() => {
    const controller = new AbortController();
    getProvider(id, lat !== undefined && lng !== undefined ? { lat, lng } : undefined, controller.signal)
      .then((res) => setFetched(res.provider))
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Something went wrong');
      });
    return () => controller.abort();
  }, [id, lat, lng]);

  // If the server no longer has the provider (not confirmed recently, or offline), still show the copy
  // the user saved so Saved keeps working.
  const provider = fetched ?? (error ? (savedList.find((p) => p.id === id) ?? null) : null);

  if (!provider) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
        <Stack.Screen options={{ title: error ? 'Not found' : 'Loading...' }} />
        {error ? <Text variant="muted">{error}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  const saved = isSaved(provider.id);
  const { rating, reviewCount } = overallRating(provider.ratings);
  const km = place ? distanceKm(place, provider) : undefined;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: provider.name }} />
      <ScrollView contentContainerClassName="gap-5 p-4 pb-10">
        <View className="gap-2">
          <Text variant="h1">{provider.name}</Text>
          <RatingBadge rating={rating} reviewCount={reviewCount} />
          <View className="flex-row flex-wrap gap-2">
            {provider.categories.map((c) => (
              <Badge key={c}>{getCategory(c)?.label ?? c}</Badge>
            ))}
          </View>
          {provider.address || km !== undefined ? (
            <View className="flex-row items-center gap-1">
              <Icon as={MapPin} size={14} className="text-muted-foreground" />
              <Text variant="muted" className="flex-1">
                {[provider.address ?? provider.city, km !== undefined ? `${km.toFixed(1)} km away` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          ) : null}
        </View>

        {provider.ratings.length > 0 ? (
          <View className="gap-3">
            <Text variant="h2">Ratings by source</Text>
            {provider.ratings.map((r) => (
              <Card key={r.source} className="flex-row items-center justify-between">
                <Text variant="h3">{r.source}</Text>
                <RatingBadge rating={r.rating} reviewCount={r.reviewCount} />
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <Text variant="muted">
              No ratings available for this provider yet. Contact details come from OpenStreetMap and may be incomplete.
            </Text>
          </Card>
        )}

        <View className="gap-3">
          {provider.phone ? (
            <Button onPress={() => Linking.openURL(`tel:${provider.phone}`)}>
              <Icon as={Phone} size={16} className="text-primary-foreground" />
              <Text className="font-medium text-primary-foreground">Call</Text>
            </Button>
          ) : null}
          {provider.website ? (
            <Button variant="outline" onPress={() => Linking.openURL(provider.website!)}>
              <Icon as={Globe} size={16} />
              <Text className="font-medium">Visit website</Text>
            </Button>
          ) : null}
          <Button variant="secondary" onPress={() => toggle(provider)}>
            <Icon
              as={Heart}
              size={16}
              className={saved ? 'text-destructive' : 'text-secondary-foreground'}
              fill={saved ? 'currentColor' : 'none'}
            />
            <Text className="font-medium text-secondary-foreground">
              {saved ? 'Saved' : 'Save for later'}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
