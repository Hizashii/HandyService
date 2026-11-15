import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Skeleton } from 'heroui-native/skeleton';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/auth/AuthContext';
import { UtilityHeader } from '@/components/layout/app-header';
import { AuthError } from '@/components/auth/AuthUI';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { marketplace, type Task, type Offer } from '@/lib/api/marketplace';
import { statusLabels } from '@/components/marketplace/task-list';
import { OfferForm } from '@/features/tasks/offer-form';

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
      <View className="gap-3"><Text className="text-sm font-bold text-brand">{statusLabels[task.status]}</Text><Text variant="display">{task.title}</Text><Text className="text-sm text-text-secondary">Oprettet {new Date(task.created_at).toLocaleDateString('da-DK')}</Text></View>
      <Card className="gap-3 border border-border"><Text variant="h2">Om opgaven</Text><Text className="leading-7">{task.description || 'Ingen beskrivelse tilføjet.'}</Text></Card>
      {user?.role === 'provider' && task.status === 'open' ? <OfferForm taskId={task.id} /> : null}
      {user?.id === task.owner_id ? <View className="gap-3"><Text variant="h2">Modtagne tilbud · {offers.length}</Text>{offers.length === 0 ? <Text className="leading-6 text-text-secondary">Du har ikke modtaget tilbud endnu. Nye tilbud vises her.</Text> : offers.map((offer) => <Card key={offer.id} className="gap-3 border border-border"><View className="flex-row justify-between gap-3"><Text className="font-bold">Tilbud {offers.indexOf(offer) + 1}</Text><Text className="font-bold text-brand">{offer.amount.toLocaleString('da-DK')} kr.</Text></View><Text className="text-sm text-text-secondary">{statusLabels[offer.status]}</Text><Text>{offer.message || 'Ingen besked tilføjet.'}</Text>{task.status === 'open' && offer.status === 'pending' ? <Button loading={busy} onPress={() => void accept(offer)}>Accepter tilbud</Button> : null}</Card>)}</View> : null}
    </> : null}
  </ScrollView></View>;
}
