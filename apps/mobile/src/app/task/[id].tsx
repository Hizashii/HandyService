import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Skeleton } from 'heroui-native/skeleton';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/auth/AuthContext';
import { UtilityHeader } from '@/components/layout/app-header';
import { AuthError } from '@/components/auth/AuthUI';
import { Button } from '@/components/ui/button';
import { QuoteCard } from '@/components/marketplace/quote-card';
import { Text } from '@/components/ui/text';
import { marketplace, type Task, type Offer } from '@/lib/api/marketplace';
import { statusLabels } from '@/components/marketplace/task-list';
import { OfferForm } from '@/features/tasks/offer-form';
import { taskPresentation } from '@/components/marketplace/task-card';
import { CalendarDays, MapPin, Tag } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTask((await marketplace.task(id)).task);
      if (user?.role === 'customer') setOffers((await marketplace.offers(id)).offers);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Kunne ikke hente opgaven.'); }
    finally { setLoading(false); }
  }, [id, user]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function accept(offer: Offer) {
    if (busy) return;
    setBusy(true);
    try { await marketplace.accept(offer.id); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Tilbuddet kunne ikke accepteres.'); }
    finally { setBusy(false); }
  }
  return <View className="flex-1 bg-background"><UtilityHeader title="Opgavedetaljer" /><ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
    {loading ? <Skeleton className="h-64 rounded-3xl" /> : null}
    <AuthError message={error} />
    {error ? <Button variant="outline" onPress={() => void load()}>Prøv igen</Button> : null}
    {!loading && task ? <>
      <View className="gap-3"><View className="self-start rounded-full bg-accent-soft px-3 py-1"><Text className="text-[11px] leading-5 font-semibold text-brand-dark">{statusLabels[task.status]}</Text></View><Text variant="display">{task.title}</Text><Text className="text-[12px] text-text-secondary">Oprettet {new Date(task.created_at).toLocaleDateString('da-DK')}</Text></View>
      <TaskInformation task={task} />
      {user?.role === 'provider' && task.status === 'open' ? <OfferForm taskId={task.id} /> : null}
      {user?.id === task.owner_id ? <View className="gap-3"><Text variant="h2">Modtagne tilbud · {offers.length}</Text>{offers.length === 0 ? <Text className="leading-6 text-text-secondary">Du har ikke modtaget tilbud endnu. Nye tilbud vises her.</Text> : offers.map((offer, index) => <QuoteCard key={offer.id} offer={offer} number={index + 1} canAccept={task.status === 'open' && offer.status === 'pending'} busy={busy} onAccept={() => void accept(offer)} />)}</View> : null}
    </> : null}
  </ScrollView></View>;
}

function TaskInformation({ task }: { task: Task }) {
  const info = taskPresentation(task);
  return <View className="gap-5">
    <View className="gap-4 rounded-2xl border border-border bg-surface p-4">
      {info.categoryLabel ? <InfoRow icon={Tag} label="Kategori" value={info.categoryLabel} /> : null}
      {info.location ? <InfoRow icon={MapPin} label="Lokation" value={info.location} /> : null}
      {info.date ? <InfoRow icon={CalendarDays} label="Ønsket tidspunkt" value={info.date} /> : null}
      <View className="gap-2"><Text className="font-bold text-[14px]">Beskrivelse</Text><Text className="text-[14px] leading-[23px] text-text-secondary">{info.body || 'Ingen beskrivelse tilføjet.'}</Text></View>
    </View>
  </View>;
}

function InfoRow({ icon: IconComponent, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return <View className="flex-row items-center gap-3"><Icon as={IconComponent} size={21} className="text-brand-dark" strokeWidth={1.6} /><View className="flex-1 gap-0.5"><Text className="font-bold text-[13px] leading-5">{label}</Text><Text className="text-[14px] leading-5 text-text-secondary">{value}</Text></View></View>;
}
