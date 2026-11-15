import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { registerFormSchema } from '@/auth/schemas';
import { AuthButton, AuthError, AuthInput, AuthShell, authStyles } from '@/components/auth/AuthUI';
import { ThemedText } from '@/components/themed-text';

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
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setError(null);
    clearError();
    setLoading(true);
    try {
      await signUp(parsed.data);
      router.replace('/');
    } catch {
      // The context exposes the server error below.
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Join HelpDK" subtitle="Choose how you want to use the marketplace.">
      <AuthInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email address"
        value={email}
      />
      <AuthInput
        autoCapitalize="none"
        autoComplete="new-password"
        onChangeText={setPassword}
        placeholder="Password (8+ characters)"
        secureTextEntry
        value={password}
      />
      <View style={authStyles.roleRow}>
        {(['customer', 'provider'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setRole(option)}
            style={[authStyles.roleButton, role === option && authStyles.roleButtonSelected]}>
            <ThemedText type="smallBold">
              {option === 'customer' ? 'I need help' : 'I provide help'}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <AuthError message={error ?? authError} />
      <AuthButton label="Create account" loading={loading} onPress={() => void submit()} />
      <Link href="/login" asChild>
        <Pressable style={authStyles.linkRow}>
          <ThemedText type="linkPrimary">Already have an account? Sign in</ThemedText>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
