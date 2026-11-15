import { Stack, useLocalSearchParams } from 'expo-router';
import { Globe, Heart, MapPin, Phone } from 'lucide-react-native';
import { Linking, ScrollView, View } from 'react-native';

import { RatingBadge } from '@/components/rating-stars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getCategory, getProvider, overallRating } from '@/data/mock';
import { useSaved } from '@/hooks/use-saved';

export default function ProviderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSaved, toggle } = useSaved();
  const provider = getProvider(id);

  if (!provider) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text variant="muted">This provider could not be found.</Text>
      </View>
    );
  }

  const saved = isSaved(provider.id);
  const { rating, reviewCount } = overallRating(provider.ratings);

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
          <View className="flex-row items-center gap-1">
            <Icon as={MapPin} size={14} className="text-muted-foreground" />
            <Text variant="muted">
              {provider.city} · {provider.distanceKm.toFixed(1)} km away
            </Text>
          </View>
        </View>

        <Text>{provider.description}</Text>

        {provider.priceNote ? (
          <Card className="gap-1">
            <Text variant="muted">Pricing</Text>
            <Text variant="h3">{provider.priceNote}</Text>
          </Card>
        ) : null}

        <View className="gap-3">
          <Text variant="h2">Ratings by source</Text>
          {provider.ratings.map((r) => (
            <Card key={r.source} className="flex-row items-center justify-between">
              <Text variant="h3">{r.source}</Text>
              <RatingBadge rating={r.rating} reviewCount={r.reviewCount} />
            </Card>
          ))}
          <Text variant="muted">
            Ratings are collected from public sources and may be out of date.
          </Text>
        </View>

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
          <Button variant="secondary" onPress={() => toggle(provider.id)}>
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
