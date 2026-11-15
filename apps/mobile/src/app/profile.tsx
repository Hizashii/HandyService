import { Bell, BriefcaseBusiness, ChevronRight, LogOut, Moon, Settings2, Sun, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUniwind, Uniwind } from 'uniwind';
import { Pressable, View } from 'react-native';
import { Avatar } from 'heroui-native/avatar';

import { useAuth } from '@/auth/AuthContext';
import { EmptyState } from '@/components/marketplace/empty-state';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme } = useUniwind();

  if (!user) return null;

  const isProvider = user.role === 'provider';
  return (
    <View className="flex-1"><Screen title="Profil" subtitle="Din konto, dine valg og din Håndmatch-rolle.">
      <Card className="flex-row items-center gap-4 rounded-3xl p-5">
        <Avatar size="lg" color="default" className="border border-border bg-surface-muted"><Avatar.Fallback><Icon as={UserRound} size={24} className="text-brand-dark" strokeWidth={1.6} /></Avatar.Fallback></Avatar>
        <View className="flex-1 gap-1"><Text variant="h2">{isProvider ? 'Hjælperprofil' : 'Kundeprofil'}</Text><Text className="text-text-secondary">{user.email}</Text></View>
      </Card>

      {isProvider ? (
        <Card className="gap-4 rounded-2xl border border-border bg-surface p-5">
          <View className="flex-row items-center gap-3"><View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface"><Icon as={BriefcaseBusiness} size={19} className="text-brand" /></View><View className="flex-1"><Text variant="h3">Din hjælperportal</Text><Text className="text-sm text-text-secondary">Opgaver, tilbud og serviceområder samlet ét sted.</Text></View></View>
          <Button onPress={() => router.push('/provider')}><Button.Label>Åbn hjælperportal</Button.Label><Icon as={ChevronRight} size={18} className="text-accent-foreground" /></Button>
        </Card>
      ) : (
        <EmptyState icon={BriefcaseBusiness} title="Vil du også tilbyde hjælp?" body="Du kan oprette en hjælperkonto, når provider-rollen er tilgængelig for din konto." />
      )}

      <View className="gap-2">
        <Text className="text-xs font-bold uppercase tracking-[2px] text-text-secondary">Indstillinger</Text>
        <SettingsRow icon={theme === 'dark' ? Moon : Sun} title={theme === 'dark' ? 'Mørkt tema' : 'Lyst tema'} description="Skift appens udseende" onPress={() => Uniwind.setTheme(theme === 'dark' ? 'light' : 'dark')} />
        <SettingsRow icon={Bell} title="Notifikationer" description="Ikke tilgængeligt endnu" />
        <SettingsRow icon={Settings2} title="Kontoindstillinger" description="Flere indstillinger kommer snart" />
      </View>

      <Button variant="danger-soft" onPress={() => { void signOut().then(() => router.replace('/login')); }}><Icon as={LogOut} size={18} className="text-danger-soft-foreground" /><Button.Label>Log ud</Button.Label></Button>
    </Screen><BottomNav /></View>
  );
}

function SettingsRow({ icon: IconComponent, title, description, onPress }: { icon: typeof Bell; title: string; description: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={!onPress} accessibilityState={{ disabled: !onPress }} className="min-h-[68px] flex-row items-center gap-3 border-b border-border py-3 active:opacity-70" onPress={onPress}>
      <View className="h-10 w-10 items-center justify-center"><Icon as={IconComponent} size={21} className="text-brand-dark" strokeWidth={1.6} /></View>
      <View className="flex-1 gap-0.5"><Text className="font-semibold">{title}</Text><Text className="text-sm text-text-secondary">{description}</Text></View>
      <Icon as={ChevronRight} size={18} className="text-text-secondary" />
    </Pressable>
  );
}
