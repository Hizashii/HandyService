import { useState } from 'react';
import { View } from 'react-native';
import { TextField } from 'heroui-native/text-field';
import { Label } from 'heroui-native/label';
import { Input } from 'heroui-native/input';
import { TextArea } from 'heroui-native/text-area';
import { FieldError } from 'heroui-native/field-error';
import * as Haptics from 'expo-haptics';
import { marketplace } from '@/lib/api/marketplace';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AuthError } from '@/components/auth/AuthUI';

export function OfferForm({ taskId }: { taskId: string }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit() {
    const price = Number(amount);
    if (!amount.trim() || !Number.isInteger(price) || price < 0 || price > 100000000) return setInvalid(true);
    if (busy || sent) return;
    setBusy(true); setError(null); setInvalid(false);
    try { await marketplace.quote(taskId, { amount: price, message }); setSent(true); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Kunne ikke sende tilbud.'); }
    finally { setBusy(false); }
  }
  return <Card className="gap-4 border border-border"><Text variant="h2">{sent ? 'Dit tilbud er sendt' : 'Afgiv et tilbud'}</Text>{sent ? <Text className="leading-6 text-text-secondary">Kunden kan nu gennemse dit tilbud. Du har tilbudt {amount} kr.</Text> : <View className="gap-4"><TextField isInvalid={invalid} isRequired><Label>Pris i hele kroner (DKK)</Label><Input value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Fx. 1250" />{invalid ? <FieldError>Angiv en pris i hele kroner.</FieldError> : null}</TextField><TextField><Label>Besked til kunden</Label><TextArea value={message} onChangeText={setMessage} maxLength={2000} placeholder="Fortæl, hvad dit tilbud omfatter." /></TextField><AuthError message={error} /><Button loading={busy} onPress={() => void submit()}>Send tilbud</Button></View>}</Card>;
}
