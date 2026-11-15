import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { Text } from '@/components/ui/text';

/** Shared page chrome for tab screens: safe area, title, scrollable body. */
export function Screen({
  title,
  subtitle,
  header = true,
  children,
}: {
  title?: string;
  subtitle?: string;
  header?: boolean;
  children: ReactNode;
}) {
  return (
    <View className="flex-1 bg-background">
      {header ? <AppHeader /> : null}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 24, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
        {title ? (
          <View className="gap-2">
            <Text variant="h1">{title}</Text>
            {subtitle ? <Text className="max-w-[420px] text-text-secondary">{subtitle}</Text> : null}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
}
