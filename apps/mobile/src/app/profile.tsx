import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { AuthButton, AuthShell } from '@/components/auth/AuthUI';
import { ThemedText } from '@/components/themed-text';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <AuthShell title="Your profile" subtitle="Your HelpDK account details.">
      <View style={{ gap: 8 }}>
        <ThemedText type="smallBold">Email</ThemedText>
        <ThemedText themeColor="textSecondary">{user.email}</ThemedText>
        <ThemedText type="smallBold">Role</ThemedText>
        <ThemedText themeColor="textSecondary">
          {user.role === 'customer' ? 'Customer' : 'Provider'}
        </ThemedText>
      </View>
      <AuthButton
        label="Sign out"
        variant="secondary"
        onPress={() => {
          void signOut().then(() => router.replace('/login'));
        }}
      />
    </AuthShell>
  );
}
