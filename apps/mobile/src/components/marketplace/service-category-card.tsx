import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Check } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { photography, type ServiceImage } from '@/lib/theme/photography';
import { cn } from '@/lib/utils';

export function ServiceCategoryCard({ label, icon: IconComponent, image = 'other', className, selected = false, compact = false, onPress }: {
  label: string;
  icon: LucideIcon;
  image?: ServiceImage;
  className?: string;
  selected?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={cn('overflow-hidden rounded-2xl border border-border bg-surface-muted active:opacity-80', selected && 'border-brand', className)}>
      <View className="gap-2 px-3 pb-3 pt-3">
        <View className="flex-row items-center justify-between">
          <Icon as={IconComponent} size={21} className="text-brand-dark" strokeWidth={1.7} />
          {selected ? <Icon as={Check} size={16} className="text-brand" /> : null}
        </View>
        <Text className={cn('font-bold text-[13px] leading-[17px] tracking-[-0.25px]', !compact && 'text-[14px] leading-[19px]')}>{label}</Text>
      </View>
      <Image source={photography[image]} contentFit="cover" style={{ width: '100%', height: compact ? 76 : 94 }} accessible={false} />
    </Pressable>
  );
}
