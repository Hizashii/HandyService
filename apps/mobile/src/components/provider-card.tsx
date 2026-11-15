import { Link } from 'expo-router';
import { Heart, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RatingBadge } from '@/components/rating-stars';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getCategory, overallRating } from '@/data/categories';
import type { Provider } from '@/data/types';
import { useLocation } from '@/hooks/use-location';
import { useSaved } from '@/hooks/use-saved';
import { distanceKm } from '@/lib/geo';
import { cn } from '@/lib/utils';

export function ProviderCard({ provider }: { provider: Provider }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(provider.id);
  const { rating, reviewCount } = overallRating(provider.ratings);
  const { place } = useLocation();
  // Always measure from where the user is now: a distance stored when the provider was saved (or
  // returned for an earlier location) would be wrong after the user changes location.
  const km = place ? distanceKm(place, provider) : undefined;
  const where = [provider.city, km !== undefined ? `${km.toFixed(1)} km` : null].filter(Boolean).join(' · ');

  return (
    <Link href={{ pathname: '/provider/[id]', params: { id: provider.id } }} asChild>
      <Pressable className="active:opacity-80">
        <Card className="gap-3 rounded-2xl p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-muted"><Text className="font-bold text-[15px] text-brand-dark">{provider.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('')}</Text></View>
            <View className="flex-1 gap-1">
              <Text variant="h3">{provider.name}</Text>
              {reviewCount > 0 ? <RatingBadge rating={rating} reviewCount={reviewCount} /> : <Text className="text-[12px] leading-4 text-text-secondary">{provider.city ?? 'Lokal serviceudbyder'}</Text>}
            </View>
            <Pressable
              hitSlop={10}
              accessibilityLabel={saved ? 'Remove from saved' : 'Save provider'}
              onPress={() => toggle(provider)}>
              <Icon
                as={Heart}
                size={22}
                className={cn(saved ? 'text-destructive' : 'text-muted-foreground')}
                fill={saved ? 'currentColor' : 'none'}
              />
            </Pressable>
          </View>

          <View className="flex-row flex-wrap items-center gap-1.5 border-t border-border pt-3">
            {provider.categories.map((id) => (
              <Badge key={id}>{getCategory(id)?.label ?? id}</Badge>
            ))}
          </View>

          {where ? (
            <View className="flex-row items-center gap-1">
              <Icon as={MapPin} size={14} className="text-muted-foreground" />
              <Text variant="muted" className="flex-1" numberOfLines={1}>
                {where}
              </Text>
            </View>
          ) : null}
        </Card>
      </Pressable>
    </Link>
  );
}
