import { BriefcaseBusiness, Check, UserRound } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/auth/AuthContext';
import { registerFormSchema } from '@/auth/schemas';
import { AuthButton, AuthError, AuthField, AuthInput, AuthShell } from '@/components/auth/AuthUI';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = registerFormSchema.safeParse({ email, password, role });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Tjek dine oplysninger.');
      return;
    }
    setError(null);
    clearError();
    setLoading(true);
    try {
      await signUp(parsed.data);
      router.replace('/');
    } catch {
      // AuthContext exposes server error.
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="OPRET KONTO" title="Lokal hjælp til hverdagens opgaver." subtitle="Vælg, om du søger hjælp eller vil tilbyde dine kompetencer på HelpDK.">
      <AuthField label="E-mail" error={error?.toLowerCase().includes('mail') ? error : null}>
        <AuthInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="dig@eksempel.dk" value={email} />
      </AuthField>
      <AuthField label="Adgangskode" error={error?.toLowerCase().includes('tegn') || error?.toLowerCase().includes('kode') ? error : null}>
        <AuthInput autoCapitalize="none" autoComplete="new-password" onChangeText={setPassword} placeholder="Mindst 8 tegn" secureTextEntry value={password} />
      </AuthField>
      <View className="gap-2">
        <Text className="font-semibold">Hvordan vil du bruge HelpDK?</Text>
        <View className="gap-3">
          <RoleOption selected={role === 'customer'} icon={UserRound} title="Jeg søger hjælp" description="Find hjælp til mine opgaver" onPress={() => { void Haptics.selectionAsync(); setRole('customer'); }} />
          <RoleOption selected={role === 'provider'} icon={BriefcaseBusiness} title="Jeg tilbyder hjælp" description="Find lokale opgaver, der passer til mig" onPress={() => { void Haptics.selectionAsync(); setRole('provider'); }} />
        </View>
      </View>
      <AuthError message={error && !error.toLowerCase().includes('mail') && !error.toLowerCase().includes('tegn') && !error.toLowerCase().includes('kode') ? error : authError} />
      <AuthButton label="Opret konto" loading={loading} onPress={() => void submit()} />
      <Link href="/login" asChild>
        <Pressable accessibilityRole="link" className="min-h-11 items-center justify-center">
          <Text className="font-semibold text-brand">Jeg har allerede en konto</Text>
        </Pressable>
      </Link>
    </AuthShell>
  );
}

function RoleOption({ selected, icon: IconComponent, title, description, onPress }: { selected: boolean; icon: typeof UserRound; title: string; description: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} className={`min-h-[76px] flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80 ${selected ? 'border-2 border-brand bg-accent-soft' : 'border-border bg-surface'}`}>
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface"><Icon as={IconComponent} size={20} className="text-brand" /></View>
      <View className="flex-1 gap-0.5"><Text className="font-bold">{title}</Text><Text className="text-sm text-text-secondary">{description}</Text></View>
      <View className={`h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-brand bg-brand' : 'border-border bg-surface'}`}>{selected ? <Icon as={Check} size={14} color="#FFFFFF" strokeWidth={3} /> : null}</View>
    </Pressable>
  );
}
