import { Image } from 'expo-image';
import { BriefcaseBusiness, CalendarDays, ChevronRight, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Task } from '@/lib/api/marketplace';
import { photography, type ServiceImage } from '@/lib/theme/photography';

export const statusLabels = { open: 'Åben for tilbud', assigned: 'Aftalt', completed: 'Afsluttet', cancelled: 'Annulleret', pending: 'Afventer svar', accepted: 'Accepteret', rejected: 'Afvist', withdrawn: 'Trukket tilbage' };
const categoryLabels: Record<ServiceImage, string> = { gardening: 'Have & udendørs', cleaning: 'Rengøring', handyman: 'Håndværk', moving: 'Flytning', assembly: 'Montering', other: 'Andre opgaver' };

/** Formats existing description fields for display without changing their stored values. */
export function taskPresentation(task: Task) {
  const raw = task.description ?? '';
  const category = raw.match(/\[(cleaning|handyman|moving|assembly|gardening|other)\]/)?.[1] as ServiceImage | undefined;
  return { category, categoryLabel: category ? categoryLabels[category] : null, body: raw.split('\n\nKategori:')[0], location: raw.match(/^Lokation: (.+)$/m)?.[1], date: raw.match(/^Ønsket dato: (.+)$/m)?.[1] };
}

export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const info = taskPresentation(task);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${task.title}, ${statusLabels[task.status]}`} onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })} className="gap-3 rounded-2xl border border-border bg-surface p-3.5 active:opacity-80">
    <View className="flex-row gap-3">
      <View className="h-[84px] w-[78px] overflow-hidden rounded-xl bg-surface-muted">
        {info.category ? <Image source={photography[info.category]} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={`Kategori: ${info.categoryLabel}`} /> : <View className="flex-1 items-center justify-center"><Icon as={BriefcaseBusiness} size={27} className="text-text-secondary" strokeWidth={1.4} /></View>}
      </View>
      <View className="flex-1 gap-1.5">
        <Text variant="h3" className="text-[15px]">{task.title}</Text>
        {info.location ? <View className="flex-row items-center gap-1"><Icon as={MapPin} size={12} className="text-text-secondary" /><Text className="flex-1 text-[12px] leading-4 text-text-secondary">{info.location}</Text></View> : null}
        <Text numberOfLines={2} className="text-[13px] leading-[19px] text-text-secondary">{info.body || 'Ingen beskrivelse tilføjet.'}</Text>
      </View>
      <View className="justify-center"><Icon as={ChevronRight} size={16} className="text-text-secondary" /></View>
    </View>
    <View className="flex-row flex-wrap items-center gap-2 border-t border-border pt-2.5">
      <View className="rounded-full bg-accent-soft px-2.5 py-1"><Text className="text-[10px] leading-4 font-semibold text-brand-dark">{statusLabels[task.status]}</Text></View>
      {info.date ? <View className="flex-1 flex-row items-center gap-1"><Icon as={CalendarDays} size={12} className="text-text-secondary" /><Text className="text-[11px] leading-4 text-text-secondary">{info.date}</Text></View> : null}
    </View>
  </Pressable>;
}
