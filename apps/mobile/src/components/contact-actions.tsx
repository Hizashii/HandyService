import { Globe, Mail, Phone } from 'lucide-react-native';
import { Alert, Linking, Pressable, View, type GestureResponderEvent } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Provider } from '@/data/types';
import { emailUrl, phoneUrl, websiteUrl } from '@/lib/contact';
import { cn } from '@/lib/utils';

async function open(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open', 'No app on this device can handle that action.');
  }
}

/**
 * Call / Email / Website buttons for a provider. A button only shows when the provider has a usable
 * value for it. `compact` is a row of small pills for list cards; `full` is the stacked buttons for
 * the detail screen.
 */
export function ContactActions({ provider, variant }: { provider: Provider; variant: 'compact' | 'full' }) {
  const tel = phoneUrl(provider.phone);
  const mail = emailUrl(provider.email, 'Enquiry about your services');
  const site = websiteUrl(provider.website);
  if (!tel && !mail && !site) return null;

  if (variant === 'full') {
    return (
      <View className="gap-3">
        {tel ? (
          <Button onPress={() => void open(tel)}>
            <Icon as={Phone} size={16} className="text-primary-foreground" />
            <Text className="font-medium text-primary-foreground">Call</Text>
          </Button>
        ) : null}
        {mail ? (
          <Button variant="secondary" onPress={() => void open(mail)}>
            <Icon as={Mail} size={16} className="text-secondary-foreground" />
            <Text className="font-medium text-secondary-foreground">Email</Text>
          </Button>
        ) : null}
        {site ? (
          <Button variant="outline" onPress={() => void open(site)}>
            <Icon as={Globe} size={16} />
            <Text className="font-medium">Visit website</Text>
          </Button>
        ) : null}
      </View>
    );
  }

  // Cards are tappable as a whole, so a press on a pill must not also open the provider.
  const press = (url: string) => (e: GestureResponderEvent) => {
    e.stopPropagation?.();
    void open(url);
  };
  const pill = 'h-9 flex-row items-center gap-1.5 rounded-full px-3.5 active:opacity-80';

  return (
    <View className="flex-row flex-wrap gap-2">
      {tel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call ${provider.name}`}
          onPress={press(tel)}
          className={cn(pill, 'bg-primary')}>
          <Icon as={Phone} size={14} className="text-primary-foreground" />
          <Text className="text-sm font-medium text-primary-foreground">Call</Text>
        </Pressable>
      ) : null}
      {mail ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Email ${provider.name}`}
          onPress={press(mail)}
          className={cn(pill, 'bg-secondary')}>
          <Icon as={Mail} size={14} className="text-secondary-foreground" />
          <Text className="text-sm font-medium text-secondary-foreground">Email</Text>
        </Pressable>
      ) : null}
      {site ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${provider.name} website`}
          onPress={press(site)}
          className={cn(pill, 'border border-border')}>
          <Icon as={Globe} size={14} />
          <Text className="text-sm font-medium">Website</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
