import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip } from 'heroui-native/chip';
import { BriefcaseBusiness, Settings2 } from 'lucide-react-native';
import { useAuth } from '@/auth/AuthContext';
import { UtilityHeader } from '@/components/layout/app-header';
import { EmptyState } from '@/components/marketplace/empty-state';
import { TaskList } from '@/components/marketplace/task-list';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';

export default function ProviderDashboardScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('tasks');
  return <View className="flex-1 bg-background"><UtilityHeader title="Hjælperportal" /><ScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 48 }}>
    {user?.role !== 'provider' ? <EmptyState icon={BriefcaseBusiness} title="Kun for hjælpere" body="Din kundekonto kan oprette opgaver og modtage tilbud. Hjælperkonti kan afgive tilbud." /> : <>
      <Card className="gap-3 bg-accent-soft"><Text className="text-xs font-bold tracking-widest text-brand">DIN HVERDAG SOM HJÆLPER</Text><Text variant="h1">Find din næste opgave.</Text><Text className="leading-6 text-text-secondary">Se ledige opgaver og fortæl kunden, hvordan du kan hjælpe.</Text></Card>
      <View className="flex-row flex-wrap gap-2">{[['tasks', 'Ledige opgaver'], ['offers', 'Mine tilbud'], ['settings', 'Præferencer']].map(([id, label]) => <Chip key={id} onPress={() => setTab(id)} variant={tab === id ? 'primary' : 'soft'}><Chip.Label>{label}</Chip.Label></Chip>)}</View>
      {tab === 'tasks' ? <TaskList /> : null}
      {tab === 'offers' ? <EmptyState icon={BriefcaseBusiness} title="Samlet tilbudsoversigt kommer snart" body="Du kan sende tilbud fra en åben opgave. En samlet historik over dine tilbud er endnu ikke tilgængelig." /> : null}
      {tab === 'settings' ? <EmptyState icon={Settings2} title="Servicepræferencer kommer snart" body="Din konto er registreret som hjælper. Serviceområder, kategorier og tilgængelighed kan endnu ikke gemmes." /> : null}
    </>}
  </ScrollView></View>;
}
