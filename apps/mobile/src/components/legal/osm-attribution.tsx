import { Linking, Pressable } from 'react-native';

import { Text } from '@/components/ui/text';

const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

/** The credit the OpenStreetMap licence (ODbL) asks for wherever its data is shown. */
export function OsmAttribution() {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Kortdata fra OpenStreetMap-bidragydere. Åbn licensoplysninger."
      onPress={() => void Linking.openURL(OSM_COPYRIGHT_URL).catch(() => {})}
      className="min-h-11 items-center justify-center">
      <Text className="text-xs text-text-secondary underline">Kortdata © OpenStreetMap-bidragydere</Text>
    </Pressable>
  );
}
