import { View } from 'react-native';

import { ProviderCard } from '@/components/provider-card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { useSaved } from '@/hooks/use-saved';

export default function SavedScreen() {
  const { saved } = useSaved();

  return (
    <Screen title="Saved" subtitle="Providers you want to compare or come back to.">
      {saved.length === 0 ? (
        <View className="items-center gap-1 py-16">
          <Text variant="h3">Nothing saved yet</Text>
          <Text variant="muted" className="text-center">
            Tap the heart on a provider to keep it here.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {saved.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </View>
      )}
    </Screen>
  );
}
