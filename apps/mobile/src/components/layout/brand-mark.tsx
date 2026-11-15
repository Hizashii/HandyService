import { Leaf, Wrench } from 'lucide-react-native';
import { Text as RNText, View } from 'react-native';

import { colors } from '@/lib/theme';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View className="flex-row items-center gap-2" accessibilityLabel="HelpDK">
      <View className="relative items-center justify-center">
        <Wrench color={colors.light.brand} size={compact ? 22 : 28} strokeWidth={2.7} />
        <Leaf
          color={colors.light.brand}
          size={compact ? 11 : 14}
          strokeWidth={2.5}
          style={{ position: 'absolute', bottom: compact ? -2 : -3, right: compact ? -4 : -5 }}
        />
      </View>
      <BrandWordmark compact={compact} />
    </View>
  );
}

function TextWordmark({ compact }: { compact: boolean }) {
  return (
    <RNText className={compact ? 'font-extrabold text-lg text-foreground' : 'font-extrabold text-2xl text-foreground'}>
      HelpDK
    </RNText>
  );
}

const BrandWordmark = TextWordmark;
