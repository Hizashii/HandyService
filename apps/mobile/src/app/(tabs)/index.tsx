import { ArrowRight, CalendarCheck, CheckCircle2, Hammer, Leaf, Search, SprayCan, Truck, Wrench } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SectionHeading } from '@/components/layout/section-heading';
import { ServiceCategoryCard } from '@/components/marketplace/service-category-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const categories = [
  { id: 'cleaning', label: 'Rengøring', icon: SprayCan },
  { id: 'handyman', label: 'Handyman', icon: Wrench },
  { id: 'moving', label: 'Flytning', icon: Truck },
  { id: 'assembly', label: 'Montering', icon: Hammer },
  { id: 'gardening', label: 'Have & ude', icon: Leaf },
  { id: 'other', label: 'Andre opgaver', icon: CalendarCheck },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const enter = reducedMotion ? undefined : FadeInDown.duration(360);

  return (
    <Screen title="">
      <Animated.View entering={enter} className="gap-3 pt-3">
        <Text className="text-xs font-bold uppercase tracking-[3px] text-brand">LOKAL HJÆLP I NÆRHEDEN</Text>
        <Text variant="display" className="max-w-[360px]">Hjælp til det, du ikke når selv.</Text>
        <Text className="max-w-[390px] text-base leading-6 text-text-secondary">
          Find dygtige mennesker til hverdagens opgaver. Lokalt, trygt og på dine præmisser.
        </Text>
      </Animated.View>

      <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(70).duration(360)}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search for a service"
          className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-4 active:opacity-80"
          onPress={() => router.push('/search')}>
          <Icon as={Search} size={21} className="text-brand" />
          <Text className="flex-1 text-base text-text-secondary">Hvad skal du have hjælp til?</Text>
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand">
            <Icon as={ArrowRight} size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View entering={reducedMotion ? undefined : FadeInDown.delay(120).duration(360)} className="gap-3">
        <SectionHeading
          title="Hvad har du brug for?"
          action={
            <Pressable accessibilityRole="link" onPress={() => router.push('/search')} className="min-h-11 justify-center">
              <Text className="font-semibold text-brand">Se alle</Text>
            </Pressable>
          }
        />
        <View className="flex-row flex-wrap gap-3">
          {categories.map((category, index) => (
            <View key={category.id} className={index === 0 ? 'w-[62%]' : 'min-w-[34%] flex-1'}>
              <ServiceCategoryCard
                label={category.label}
                icon={category.icon}
                onPress={() => {
                  void Haptics.selectionAsync();
                  router.push({ pathname: '/search', params: { category: category.id } });
                }}
              />
            </View>
          ))}
        </View>
      </Animated.View>

      <Card className="gap-5 rounded-3xl border-0 bg-brand p-5">
        <View className="gap-2">
          <Text className="text-xs font-bold uppercase tracking-[2px] text-white/70">HAR DU EN OPGAVE?</Text>
          <Text variant="h2" className="max-w-[270px] text-2xl text-white">Beskriv den. Så hjælper vi dig videre.</Text>
          <Text className="max-w-[310px] leading-6 text-white/80">Det tager få minutter at komme godt fra start.</Text>
        </View>
        <Button
          variant="outline"
          className="self-start border-0 bg-white"
          onPress={() => router.push('/create-task' as never)}>
          <Button.Label className="font-bold text-brand">Opret en opgave</Button.Label>
          <Icon as={ArrowRight} size={18} color="#087F5B" />
        </Button>
      </Card>

      <View className="gap-4 pb-2">
        <SectionHeading title="Sådan fungerer HelpDK" />
        <Step index="01" icon={Search} title="Fortæl, hvad du har brug for" copy="Vælg en kategori og beskriv opgaven med dine egne ord." />
        <Step index="02" icon={Hammer} title="Få overblik over muligheder" copy="Se de næste skridt, når din lokale markedsplads er klar." />
        <Step index="03" icon={CheckCircle2} title="Vælg det, der passer dig" copy="Hold aftaler og forventninger tydelige fra start til slut." />
      </View>
    </Screen>
  );
}

function Step({ index, icon: IconComponent, title, copy }: { index: string; icon: typeof Search; title: string; copy: string }) {
  return (
    <View className="flex-row gap-4 border-b border-border pb-4 pt-1">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft">
        <Icon as={IconComponent} size={20} className="text-brand" />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-xs font-bold tracking-[2px] text-brand">{index}</Text>
        <Text className="font-bold">{title}</Text>
        <Text className="leading-5 text-text-secondary">{copy}</Text>
      </View>
    </View>
  );
}
