import { ArrowRight, LockKeyhole, Mail } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { loginFormSchema } from '@/auth/schemas';
import { AuthButton, AuthError, AuthField, AuthInput, AuthShell } from '@/components/auth/AuthUI';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, error: authError, restoreError, retryRestore, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Tjek dine oplysninger.');
      return;
    }
    setError(null);
    clearError();
    setLoading(true);
    try {
      await signIn(parsed.data);
      router.replace('/');
    } catch {
      // AuthContext exposes server error.
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell eyebrow="LOG IND" title="Godt at se dig igen." subtitle="Log ind på din Håndmatch-konto, og fortsæt med dine opgaver og aftaler.">
      <AuthField label="E-mail" error={error?.toLowerCase().includes('email') || error?.toLowerCase().includes('mail') ? error : null}>
        <View className="relative justify-center"><AuthInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="dig@eksempel.dk" value={email} className="pl-12" /><View className="absolute left-4" pointerEvents="none"><Icon as={Mail} size={18} className="text-brand" /></View></View>
      </AuthField>
      <AuthField label="Adgangskode" error={error?.toLowerCase().includes('password') || error?.toLowerCase().includes('kode') ? error : null}>
        <View className="relative justify-center"><AuthInput autoCapitalize="none" autoComplete="password" onChangeText={setPassword} placeholder="Din adgangskode" secureTextEntry value={password} className="pl-12" /><View className="absolute left-4" pointerEvents="none"><Icon as={LockKeyhole} size={18} className="text-brand" /></View></View>
      </AuthField>
      <AuthError message={error && !error.toLowerCase().includes('mail') && !error.toLowerCase().includes('password') && !error.toLowerCase().includes('kode') ? error : authError ?? restoreError} />
      {restoreError ? <AuthButton label="Prøv igen" variant="secondary" onPress={() => void retryRestore()} /> : null}
      <AuthButton label="Log ind" loading={loading} onPress={() => void submit()} />
      <Link href="/register" asChild>
        <Pressable accessibilityRole="link" className="min-h-11 flex-row items-center justify-center gap-2">
          <Text className="font-semibold text-brand">Opret ny konto</Text>
          <Icon as={ArrowRight} size={16} className="text-brand" />
        </Pressable>
      </Link>
    </AuthShell>
  );
}
