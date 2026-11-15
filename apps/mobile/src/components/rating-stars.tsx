import { Star } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  if (reviewCount === 0) return <Text variant="muted">No reviews yet</Text>;
  return (
    <View className="flex-row items-center gap-1">
      <Icon as={Star} size={14} className="text-amber-500" fill="#f59e0b" />
      <Text className="font-semibold">{rating.toFixed(1)}</Text>
      <Text variant="muted">({reviewCount})</Text>
    </View>
  );
}
