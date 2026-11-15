import '../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LocationProvider } from '@/hooks/use-location';
import { SavedProvider } from '@/hooks/use-saved';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  // Tailwind uses class-based dark mode, so mirror the system scheme onto NativeWind
  // (sets the `dark` class on web) for `bg-background`/`text-foreground` to follow it.
  useEffect(() => {
    setColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
  }, [colorScheme, setColorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocationProvider>
        <SavedProvider>
          <AnimatedSplashOverlay />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="provider/[id]" options={{ headerBackTitle: 'Back' }} />
          </Stack>
          <PortalHost />
        </SavedProvider>
      </LocationProvider>
    </ThemeProvider>
  );
}
