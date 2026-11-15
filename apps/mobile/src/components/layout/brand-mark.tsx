import { Handshake } from 'lucide-react-native';
import { Text as RNText, View } from 'react-native';

import { colors } from '@/lib/theme';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View className="flex-row items-center gap-2" accessibilityLabel="Håndmatch">
      <Handshake color={colors.light.brand} size={compact ? 22 : 28} strokeWidth={2.4} />
      <Wordmark compact={compact} />
    </View>
  );
}

/** "Hånd" in the text colour, "match" in the brand green. */
function Wordmark({ compact }: { compact: boolean }) {
  return (
    <RNText className={compact ? 'font-extrabold text-lg text-foreground' : 'font-extrabold text-2xl text-foreground'}>
      Hånd<RNText className="text-brand">match</RNText>
    </RNText>
  );
}
