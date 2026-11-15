import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SavedProvider } from '@/hooks/use-saved';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SavedProvider>
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="provider/[id]" options={{ headerBackTitle: 'Back' }} />
        </Stack>
        <PortalHost />
      </SavedProvider>
    </ThemeProvider>
  );
}
