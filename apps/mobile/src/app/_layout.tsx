import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LocationProvider } from '@/hooks/use-location';
import { SavedProvider } from '@/hooks/use-saved';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    setColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
  }, [colorScheme, setColorScheme]);

  if (status === 'loading') {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Loading HelpDK...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocationProvider>
        <SavedProvider>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={isAuthenticated} redirectTo="/login">
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="provider/[id]"
                options={{ headerShown: true, headerBackTitle: 'Back' }}
              />
              <Stack.Screen name="profile" />
            </Stack.Protected>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="register" options={{ presentation: 'modal' }} />
            </Stack.Protected>
          </Stack>
          <PortalHost />
        </SavedProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
