import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

const links = [
  { href: '/privatliv', label: 'Privatlivspolitik' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/vilkaar', label: 'Vilkår og betingelser' },
] as const;

/** Small row of links to the legal pages. Used under the login forms and at the end of each legal page. */
export function LegalLinks() {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-x-5 gap-y-1">
      {links.map((l) => (
        <Link key={l.href} href={l.href} asChild>
          <Pressable accessibilityRole="link" className="min-h-11 justify-center">
            <Text className="text-xs font-semibold text-text-secondary underline">{l.label}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
