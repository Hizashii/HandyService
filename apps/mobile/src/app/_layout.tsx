import '../global.css';

import { HeroUINativeProvider, type HeroUINativeConfig } from 'heroui-native/provider';
import * as SplashScreen from 'expo-splash-screen';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useUniwind } from 'uniwind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { BrandMark } from '@/components/layout/brand-mark';
import { Text } from '@/components/ui/text';
import { SavedProvider } from '@/hooks/use-saved';
import { LocationProvider } from '@/hooks/use-location';

SplashScreen.preventAutoHideAsync();

const heroConfig: HeroUINativeConfig = {
  textProps: { allowFontScaling: true, maxFontSizeMultiplier: 1.5 },
  textInputProps: { allowFontScaling: true, maxFontSizeMultiplier: 1.5 },
  devInfo: { stylingPrinciples: false },
  toast: {
    defaultProps: { variant: 'default', placement: 'top', isSwipeable: true },
    insets: { top: 4, bottom: 8, left: 16, right: 16 },
    maxVisibleToasts: 2,
  },
};

function RootNavigator() {
  const { theme } = useUniwind();
  const reducedMotion = useReducedMotion();
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && status !== 'loading') void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded, status]);

  if ((!fontsLoaded && !fontError) || status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background">
        <BrandMark compact />
        <ActivityIndicator />
        <Text variant="muted">Gør hverdagen lettere.</Text>
      </View>
    );
  }

  return (
    <LocationProvider><SavedProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'fade' }}>
        <Stack.Protected guard={isAuthenticated} redirectTo="/login">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create-task" options={{ presentation: 'card' }} />
          <Stack.Screen name="task/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="provider/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="provider/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </SavedProvider></LocationProvider>
  );
}

export default function RootLayout() {
  const reducedMotion = useReducedMotion();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider config={{ ...heroConfig, animation: reducedMotion ? 'disable-all' : undefined }}>
        <AuthProvider>
          <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background"><RootNavigator /></SafeAreaView>
        </AuthProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
