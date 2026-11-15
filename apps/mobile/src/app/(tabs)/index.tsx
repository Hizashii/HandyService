import { ArrowRight, CheckCircle2, Hammer, Leaf, Search, SprayCan, Truck, Wrench, Grid2X2, ClipboardList, MessageSquareText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { Screen } from '@/components/screen';
import { SectionHeading } from '@/components/layout/section-heading';
import { ServiceCategoryCard } from '@/components/marketplace/service-category-card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { photography, type ServiceImage } from '@/lib/theme/photography';

const categories = [
  { id: 'gardening', label: 'Have &\nudendørs', icon: Leaf },
  { id: 'handyman', label: 'Håndværk &\nreparation', icon: Wrench },
  { id: 'cleaning', label: 'Rengøring &\noprydning', icon: SprayCan },
  { id: 'moving', label: 'Flytning &\ntransport', icon: Truck },
  { id: 'assembly', label: 'Møbler &\nmontering', icon: Hammer },
  { id: 'other', label: 'Andre\nopgaver', icon: Grid2X2 },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 360 || fontScale > 1.2 ? 2 : 3;
  return (
    <Screen>
      <View className="gap-2 pt-3">
        <Text className="text-[13px] font-semibold text-text-secondary">Lokal hjælp. Mere tid til dig.</Text>
        <Text variant="display" className="max-w-[360px]">Hvad har du brug for hjælp til i dag?</Text>
      </View>

      <Pressable accessibilityRole="search" accessibilityLabel="Find lokal hjælp" className="min-h-[54px] flex-row items-center gap-3 rounded-xl border border-border bg-surface px-4 active:opacity-80" onPress={() => router.push('/search')}>
        <Icon as={Search} size={21} className="text-foreground" strokeWidth={1.7} />
        <Text className="flex-1 text-[14px] text-text-secondary">Søg efter en service</Text>
      </Pressable>

      <View className="gap-3">
        <SectionHeading title="Find den rette hjælp" action={<Pressable accessibilityRole="link" className="min-h-11 justify-center" onPress={() => router.push('/search')}><Text className="text-[13px] font-semibold text-brand-dark">Se alle</Text></Pressable>} />
        <View className="flex-row gap-2.5">
          {Array.from({ length: columns }, (_, index) => index).map((column) => <View key={column} style={{ flex: column === 0 ? 1.08 : 1, gap: 10 }}>
            {categories.filter((_, index) => index % columns === column).map((category) => <ServiceCategoryCard
              key={category.id} compact label={category.label} icon={category.icon} image={category.id as ServiceImage}
              onPress={() => { void Haptics.selectionAsync(); router.push({ pathname: '/search', params: { category: category.id, mode: 'providers' } }); }}
            />)}
          </View>)}
        </View>
      </View>

      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        <View className="flex-row">
          <View className="flex-1 gap-2 p-4"><Text className="text-[11px] font-bold uppercase tracking-[2px] text-text-secondary">DIN OPGAVE. DIN HVERDAG.</Text><Text variant="h2">Få hjælp til det,{ '\n' }der venter.</Text><Text className="text-[13px] leading-5 text-text-secondary">Beskriv opgaven. Modtag tilbud. Vælg din hjælper.</Text></View>
          <Image source={photography.home} style={{ width: '35%', minHeight: 158 }} contentFit="cover" contentPosition="right" accessible={false} />
        </View>
        <View className="px-4 pb-4"><Button onPress={() => router.push('/create-task')}><Button.Label>Opret en opgave</Button.Label><Icon as={ArrowRight} size={18} className="text-accent-foreground" /></Button></View>
      </View>

      <View className="gap-4 pb-4">
        <SectionHeading title="Fra opgave til overskud" />
        <Step index="01" icon={ClipboardList} title="Beskriv din opgave" copy="Fortæl kort, hvad du har brug for hjælp til." />
        <Step index="02" icon={MessageSquareText} title="Modtag tilbud" copy="Sammenlign hjælpernes pris og forslag." />
        <Step index="03" icon={CheckCircle2} title="Vælg din hjælper" copy="Find det tilbud, der passer til dig." />
      </View>
    </Screen>
  );
}

function Step({ index, icon: IconComponent, title, copy }: { index: string; icon: typeof Search; title: string; copy: string }) {
  return <View className="flex-row items-start gap-4"><View className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface"><Icon as={IconComponent} size={19} className="text-brand-dark" strokeWidth={1.7} /></View><View className="flex-1 gap-0.5"><Text className="font-bold text-[14px]"><Text className="text-[11px] text-text-secondary">{index}   </Text>{title}</Text><Text className="text-[13px] leading-5 text-text-secondary">{copy}</Text></View></View>;
}
