import { MessageSquareText } from 'lucide-react-native';
import { View } from 'react-native';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import type { Offer } from '@/lib/api/marketplace';
import { statusLabels } from './task-card';

export function QuoteCard({ offer, number, canAccept, busy, onAccept }: { offer: Offer; number: number; canAccept: boolean; busy: boolean; onAccept: () => void }) {
  return <Card className="gap-4 rounded-2xl p-4">
    <View className="flex-row items-start justify-between gap-3">
      <View className="gap-1"><Text className="font-bold text-[15px]">Tilbud {number}</Text><Text className="text-[11px] leading-4 text-text-secondary">{statusLabels[offer.status]}</Text></View>
      <Text className="text-[22px] leading-7 font-extrabold tracking-[-0.6px]">{offer.amount.toLocaleString('da-DK')} <Text className="text-[13px] font-medium">kr.</Text></Text>
    </View>
    <View className="flex-row gap-2 border-t border-border pt-3"><Icon as={MessageSquareText} size={17} className="mt-1 text-brand-dark" strokeWidth={1.6} /><Text className="flex-1 text-[14px] leading-[23px] text-text-secondary">{offer.message || 'Ingen besked tilføjet.'}</Text></View>
    {canAccept ? <Button loading={busy} onPress={onAccept}>Accepter tilbud</Button> : null}
  </Card>;
}
