import { ChevronDown, MapPin, UserRound } from 'lucide-react-native';
import { Pressable, Text as RNText, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BrandMark } from '@/components/layout/brand-mark';
import { Icon } from '@/components/ui/icon';
import { colors } from '@/lib/theme';
import { useLocation } from '@/hooks/use-location';

export function AppHeader({ showLocation = true }: { showLocation?: boolean }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
      <BrandMark compact />
      <View className="flex-row items-center gap-2">
        {showLocation ? (
          <View
            accessibilityLabel="Location: all Denmark"
            className="min-h-11 flex-row items-center gap-1 rounded-full bg-surface-muted px-3">
            <Icon as={MapPin} size={15} className="text-brand" />
            <View className="max-w-[92px]">
              <AppHeaderLabel />
            </View>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
          onPress={() => router.push('/profile')}>
          <Icon as={UserRound} size={19} color={colors.light.brandDark} />
        </Pressable>
      </View>
    </View>
  );
}

function AppHeaderLabel() {
  const { place } = useLocation();
  return <RNText numberOfLines={1} className="font-semibold text-xs text-foreground">{place?.name ?? 'Danmark'}</RNText>;
}

export function UtilityHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"
        onPress={onBack ?? (() => router.back())}>
        <Icon as={ChevronDown} size={19} className="rotate-90 text-foreground" />
      </Pressable>
      <View className="flex-1 items-center px-3">
        <AppHeaderTitle title={title} />
      </View>
      <View className="h-11 w-11" />
    </View>
  );
}

function AppHeaderTitle({ title }: { title: string }) {
  return <RNText className="font-bold text-base text-foreground">{title}</RNText>;
}
