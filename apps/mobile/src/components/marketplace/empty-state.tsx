import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export function EmptyState({
  icon: IconComponent,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <Card className="items-center gap-3 rounded-3xl border-dashed bg-surface-muted p-6 text-center">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
        <Icon as={IconComponent} size={25} className="text-brand" />
      </View>
      <Text variant="h3" className="text-center">{title}</Text>
      <Text className="max-w-[290px] text-center leading-6 text-text-secondary">{body}</Text>
      {action ? <Button variant="outline" onPress={action.onPress}>{action.label}</Button> : null}
    </Card>
  );
}
