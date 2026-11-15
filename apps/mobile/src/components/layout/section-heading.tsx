import { View } from 'react-native';
import type { ReactNode } from 'react';

import { Text } from '@/components/ui/text';

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View className="flex-row items-end justify-between gap-3">
      <Text variant="h2" className="flex-1">{title}</Text>
      {action}
    </View>
  );
}
