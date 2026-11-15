import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function ServiceCategoryCard({
  label,
  icon: IconComponent,
  className,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  className?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Explore ${label}`}
      onPress={onPress}
      className={`min-h-[116px] flex-1 justify-between rounded-3xl border border-border bg-surface p-4 active:opacity-80 ${className ?? ''}`}>
      <View className="h-9 w-9 items-center justify-center rounded-2xl bg-accent-soft">
        <Icon as={IconComponent} size={20} className="text-brand" strokeWidth={2} />
      </View>
      <Text className="max-w-[120px] font-semibold leading-5">{label}</Text>
    </Pressable>
  );
}
