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
    <Card className="items-center gap-3 rounded-2xl border border-border bg-surface p-7">
      <View className="h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-muted">
        <Icon as={IconComponent} size={24} className="text-brand-dark" strokeWidth={1.5} />
      </View>
      <Text variant="h3" className="text-center">{title}</Text>
      <Text className="max-w-[290px] text-center text-[14px] leading-[22px] text-text-secondary">{body}</Text>
      {action ? <Button variant="outline" onPress={action.onPress}>{action.label}</Button> : null}
    </Card>
  );
}
