import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { loginFormSchema } from '@/auth/schemas';
import { AuthButton, AuthError, AuthInput, AuthShell, authStyles } from '@/components/auth/AuthUI';
import { ThemedText } from '@/components/themed-text';

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
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setError(null);
    clearError();
    setLoading(true);
    try {
      await signIn(parsed.data);
      router.replace('/');
    } catch {
      // The context exposes the server error below.
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your HelpDK account.">
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
        autoComplete="password"
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        value={password}
      />
      <AuthError message={error ?? authError ?? restoreError} />
      {restoreError ? (
        <AuthButton
          label="Retry session restore"
          variant="secondary"
          onPress={() => void retryRestore()}
        />
      ) : null}
      <AuthButton label="Sign in" loading={loading} onPress={() => void submit()} />
      <Link href="/register" asChild>
        <Pressable style={authStyles.linkRow}>
          <ThemedText type="linkPrimary">Create an account</ThemedText>
        </Pressable>
      </Link>
    </AuthShell>
  );
}
