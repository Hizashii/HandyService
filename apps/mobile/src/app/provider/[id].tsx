import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Alert } from 'heroui-native/alert';

import { UtilityHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function ProviderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-background">
      <UtilityHeader title="Hjælperdetaljer" />
      <View className="gap-4 px-5 pt-4">
        <Text variant="display">Hjælperprofil</Text>
        <Alert status="accent" className="rounded-3xl"><Alert.Indicator /><Alert.Content><Alert.Title>Profilen er ikke tilgængelig endnu</Alert.Title><Alert.Description>Leverandørdata for {id || 'den valgte hjælper'} kommer fra API’et, når provider-feedet er tilsluttet.</Alert.Description></Alert.Content></Alert>
        <Button variant="outline" onPress={() => router.replace('/search')}>Tilbage til udforsk</Button>
      </View>
    </View>
  );
}
