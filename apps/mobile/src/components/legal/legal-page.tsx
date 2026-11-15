import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { UtilityHeader } from '@/components/layout/app-header';
import { LegalLinks } from '@/components/legal/legal-links';
import { Text } from '@/components/ui/text';
import { LEGAL } from '@/legal/company';
import type { LegalDoc } from '@/legal/content';

/** One legal document (privacy, cookies or terms). Readable before login, so it has no auth requirement. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const router = useRouter();
  // A visitor can land here from a direct link, with nothing to go back to.
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View className="flex-1 bg-background">
      <UtilityHeader title={doc.title} onBack={back} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>
        <View className="mx-auto w-full max-w-[720px] gap-7">
          <View className="gap-2">
            <Text variant="display">{doc.title}</Text>
            <Text className="text-[15px] leading-6 text-text-secondary">{doc.summary}</Text>
            <Text className="text-xs text-text-secondary">Senest opdateret: {LEGAL.updated}</Text>
          </View>

          {doc.blocks.map((block) => (
            <View key={block.heading} className="gap-2">
              <Text variant="h3" accessibilityRole="header">
                {block.heading}
              </Text>
              {block.paragraphs?.map((p) => (
                <Text key={p} className="text-[15px] leading-6 text-text-secondary">
                  {p}
                </Text>
              ))}
              {block.bullets?.map((b) => (
                <View key={b} className="flex-row gap-2 pr-2">
                  <Text className="text-[15px] leading-6 text-brand">•</Text>
                  <Text className="flex-1 text-[15px] leading-6 text-text-secondary">{b}</Text>
                </View>
              ))}
            </View>
          ))}

          <View className="border-t border-border pt-5">
            <LegalLinks />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
