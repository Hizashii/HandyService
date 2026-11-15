import { BottomNav } from '@/components/layout/bottom-nav';
import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-background">
      <Slot />
      <BottomNav />
    </View>
  );
}
