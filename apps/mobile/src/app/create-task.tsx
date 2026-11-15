import { CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardList, Hammer, Leaf, MapPin, SprayCan, Truck, Wrench } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Alert } from 'heroui-native/alert';
import { FieldError } from 'heroui-native/field-error';
import { Input as HeroInput } from 'heroui-native/input';
import { Label } from 'heroui-native/label';
import { TextField } from 'heroui-native/text-field';
import { TextArea } from 'heroui-native/text-area';

import { UtilityHeader } from '@/components/layout/app-header';
import { ServiceCategoryCard } from '@/components/marketplace/service-category-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useAuth } from '@/auth/AuthContext';
import { marketplace } from '@/lib/api/marketplace';
import { AuthError } from '@/components/auth/AuthUI';
import type { ServiceImage } from '@/lib/theme/photography';

const steps = ['Kategori', 'Beskrivelse', 'Tid & sted', 'Gennemse'];
const categoryOptions = [
  { id: 'cleaning', label: 'Rengøring', icon: SprayCan },
  { id: 'handyman', label: 'Handyman', icon: Wrench },
  { id: 'moving', label: 'Flytning', icon: Truck },
  { id: 'assembly', label: 'Montering', icon: Hammer },
  { id: 'gardening', label: 'Have & ude', icon: Leaf },
  { id: 'other', label: 'Andet', icon: ClipboardList },
] as const;

type Draft = { category: string; title: string; description: string; location: string; date: string };

export default function CreateTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ category: '', title: '', description: '', location: '', date: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const progress = useSharedValue(1 / steps.length);
  const selectedCategory = useMemo(() => categoryOptions.find((item) => item.id === draft.category), [draft.category]);
  const progressStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateCurrentStep() {
    const nextErrors: Partial<Record<keyof Draft, string>> = {};
    if (step === 0 && !draft.category) nextErrors.category = 'Vælg den kategori, der passer bedst.';
    if (step === 1) {
      if (!draft.title.trim() || draft.title.trim().length > 120) nextErrors.title = 'Skriv en titel på 1–120 tegn.';
      if (draft.description.trim().length < 10) nextErrors.description = 'Beskriv opgaven med mindst 10 tegn.';
    }
    if (step === 2) {
      if (!draft.location.trim()) nextErrors.location = 'Tilføj by eller postnummer.';
      if (!draft.date.trim()) nextErrors.date = 'Skriv, hvornår du helst vil have hjælp.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    if (!validateCurrentStep()) return;
    void Haptics.selectionAsync();
    const nextStep = Math.min(step + 1, steps.length - 1);
    setStep(nextStep);
    // Reanimated shared values are intentionally mutable outside React state.
    // eslint-disable-next-line react-hooks/immutability
    progress.value = withTiming((nextStep + 1) / steps.length, { duration: reducedMotion ? 0 : 260 });
  }

  function back() {
    if (step === 0) return router.back();
    const previousStep = step - 1;
    setStep(previousStep);
    // eslint-disable-next-line react-hooks/immutability
    progress.value = withTiming((previousStep + 1) / steps.length, { duration: reducedMotion ? 0 : 220 });
  }

  async function submit() {
    if (submitting || user?.role !== 'customer') return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const description = `${draft.description}\n\nKategori: ${selectedCategory?.label} [${draft.category}]\nLokation: ${draft.location}\nØnsket dato: ${draft.date}`;
      const { task } = await marketplace.create({ title: draft.title.trim(), description });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/task/[id]', params: { id: task.id } });
    } catch (caught) { setSubmitError(caught instanceof Error ? caught.message : 'Opgaven kunne ikke oprettes.'); }
    finally { setSubmitting(false); }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <UtilityHeader title="Opret opgave" onBack={back} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 20, paddingHorizontal: 20, paddingBottom: 40 }}>
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-[2px] text-brand">TRIN {step + 1} AF {steps.length}</Text>
            <Text className="text-xs font-semibold text-text-secondary">{steps[step]}</Text>
          </View>
          <View className="h-1 overflow-hidden rounded-full bg-border">
            <Animated.View className="h-full w-full origin-left rounded-full bg-brand" style={progressStyle} />
          </View>
        </View>

        <Animated.View key={step} entering={reducedMotion ? undefined : FadeInRight.duration(240)} className="gap-5">
          {step === 0 ? <CategoryStep value={draft.category} error={errors.category} onChange={(value) => update('category', value)} /> : null}
          {step === 1 ? <DetailsStep draft={draft} errors={errors} onChange={update} /> : null}
          {step === 2 ? <PlaceStep draft={draft} errors={errors} onChange={update} /> : null}
          {step === 3 ? <ReviewStep draft={draft} category={selectedCategory?.label ?? 'Ikke valgt'} /> : null}
        </Animated.View>

        <AuthError message={submitError} />
        {user?.role !== 'customer' ? <Text className="text-text-secondary">Kun kundekonti kan oprette opgaver. Din konto tilbyder hjælp.</Text> : null}
        <View className="flex-row gap-3 pt-1">
          {step > 0 ? <Button variant="outline" size="icon" accessibilityLabel="Previous step" onPress={back}><Icon as={ChevronLeft} size={20} /></Button> : null}
          {step < steps.length - 1 ? (
            <Button className="flex-1" onPress={next}><Button.Label>Fortsæt</Button.Label><Icon as={ChevronRight} size={18} className="text-accent-foreground" /></Button>
          ) : (
            <Button className="flex-1" disabled={user?.role !== 'customer'} loading={submitting} onPress={() => void submit()}><Button.Label>Opret opgave</Button.Label><Icon as={Check} size={18} className="text-accent-foreground" /></Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CategoryStep({ value, error, onChange }: { value: string; error?: string; onChange: (value: string) => void }) {
  const { width, fontScale } = useWindowDimensions();
  const useTwoColumns = width < 360 || fontScale > 1.2;
  return (
    <View className="gap-3">
      <View className="gap-2">
        <Text variant="display">Hvad har du brug for hjælp til?</Text>
        <Text className="leading-6 text-text-secondary">Vælg en kategori. Du kan altid tilføje flere detaljer bagefter.</Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {categoryOptions.map((item) => (
          <View key={item.id} className={useTwoColumns ? 'w-[47%] grow' : 'w-[30.8%] grow'}>
            <ServiceCategoryCard compact label={item.label} icon={item.icon} image={item.id as ServiceImage} selected={value === item.id} onPress={() => onChange(item.id)} />
          </View>
        ))}
      </View>
      {error ? <FieldError>{error}</FieldError> : null}
    </View>
  );
}

function DetailsStep({ draft, errors, onChange }: { draft: Draft; errors: Partial<Record<keyof Draft, string>>; onChange: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) {
  return (
    <View className="gap-5">
      <View className="gap-2"><Text variant="display">Fortæl om opgaven.</Text><Text className="leading-6 text-text-secondary">Giv nok kontekst til, at den rigtige hjælp kan forstå omfanget.</Text></View>
      <TextField isRequired isInvalid={Boolean(errors.title)} className="gap-2"><Label>Titel</Label><HeroInput value={draft.title} onChangeText={(value) => onChange('title', value)} placeholder="Fx. Samle et skab i entréen" className="min-h-13 rounded-2xl border border-border bg-surface px-4 text-base" />{errors.title ? <FieldError>{errors.title}</FieldError> : null}</TextField>
      <TextField isRequired isInvalid={Boolean(errors.description)} className="gap-2"><Label>Beskrivelse</Label><TextArea value={draft.description} onChangeText={(value) => onChange('description', value)} placeholder="Hvad skal gøres? Hvilke detaljer er vigtige?" className="min-h-[150px] rounded-2xl border border-border bg-surface px-4 py-3 text-base" maxLength={500} />{errors.description ? <FieldError>{errors.description}</FieldError> : null}</TextField>
    </View>
  );
}

function PlaceStep({ draft, errors, onChange }: { draft: Draft; errors: Partial<Record<keyof Draft, string>>; onChange: <K extends keyof Draft>(key: K, value: Draft[K]) => void }) {
  return (
    <View className="gap-5">
      <View className="gap-2"><Text variant="display">Hvornår og hvor?</Text><Text className="leading-6 text-text-secondary">Det gør det lettere at matche dig med den rigtige lokale hjælp.</Text></View>
      <TextField isRequired isInvalid={Boolean(errors.location)} className="gap-2"><Label>Lokation</Label><View className="relative justify-center"><HeroInput value={draft.location} onChangeText={(value) => onChange('location', value)} placeholder="Fx. Aarhus, 8000" className="min-h-13 rounded-2xl border border-border bg-surface pl-12 text-base" /><View className="absolute left-4" pointerEvents="none"><Icon as={MapPin} size={18} className="text-brand" /></View></View>{errors.location ? <FieldError>{errors.location}</FieldError> : null}</TextField>
      <TextField isRequired isInvalid={Boolean(errors.date)} className="gap-2"><Label>Ønsket dato</Label><View className="relative justify-center"><HeroInput value={draft.date} onChangeText={(value) => onChange('date', value)} placeholder="Fx. inden for 2 uger" className="min-h-13 rounded-2xl border border-border bg-surface pl-12 text-base" /><View className="absolute left-4" pointerEvents="none"><Icon as={CalendarDays} size={18} className="text-brand" /></View></View>{errors.date ? <FieldError>{errors.date}</FieldError> : null}</TextField>
    </View>
  );
}

function ReviewStep({ draft, category }: { draft: Draft; category: string }) {
  return (
    <View className="gap-5">
      <View className="gap-2"><Text variant="display">Gennemse din opgave.</Text><Text className="leading-6 text-text-secondary">Tjek oplysningerne, før du sender. Du kan stadig gå tilbage og rette.</Text></View>
      <Card className="gap-4 rounded-3xl p-5">
        <View className="flex-row items-center justify-between"><Text variant="small" className="text-text-secondary">Kategori</Text><Text className="font-semibold">{category}</Text></View>
        <View className="h-px bg-border" />
        <View className="gap-1"><Text variant="small" className="text-text-secondary">Titel</Text><Text variant="h3">{draft.title}</Text></View>
        <View className="gap-1"><Text variant="small" className="text-text-secondary">Beskrivelse</Text><Text className="leading-6">{draft.description}</Text></View>
        <View className="h-px bg-border" />
        <View className="flex-row justify-between gap-4"><View className="flex-1 gap-1"><Text variant="small" className="text-text-secondary">Lokation</Text><Text className="font-semibold">{draft.location}</Text></View><View className="flex-1 gap-1"><Text variant="small" className="text-text-secondary">Dato</Text><Text className="font-semibold">{draft.date}</Text></View></View>
      </Card>
      <Alert status="accent" className="rounded-3xl"><Alert.Indicator /><Alert.Content><Alert.Title>Klar til at dele?</Alert.Title><Alert.Description>Opgaven bliver synlig for hjælpere. Del kun de oplysninger, de skal bruge til at give et tilbud.</Alert.Description></Alert.Content></Alert>
    </View>
  );
}
