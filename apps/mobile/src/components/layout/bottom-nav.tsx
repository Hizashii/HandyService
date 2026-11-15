import { CalendarDays, Home, Plus, Search, UserRound } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from '@/components/layout/safe-area';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

const items = [
  { key: 'home', label: 'Hjem', icon: Home, path: '/' },
  { key: 'explore', label: 'Udforsk', icon: Search, path: '/search' },
  { key: 'tasks', label: 'Opgaver', icon: CalendarDays, path: '/saved' },
  { key: 'profile', label: 'Profil', icon: UserRound, path: '/profile' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const activeKey = pathname === '/' ? 'home' : pathname.startsWith('/search') ? 'explore' : pathname.startsWith('/profile') ? 'profile' : 'tasks';

  return (
    <SafeAreaView edges={[]} className="border-t border-border bg-surface">
      <View className="min-h-[64px] flex-row items-center justify-around px-2 py-2">
        {items.slice(0, 2).map((item) => <NavItem key={item.key} icon={item.icon} label={item.label} path={item.path} active={activeKey === item.key} />)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post a task"
          className="min-h-12 min-w-[58px] items-center justify-center gap-1"
          onPress={() => router.push('/create-task')}>
          <Icon as={Plus} size={21} className="text-foreground" strokeWidth={1.7} />
          <Text className="text-[10px] leading-4 font-medium text-text-secondary">Opret</Text>
        </Pressable>
        {items.slice(2).map((item) => <NavItem key={item.key} icon={item.icon} label={item.label} path={item.path} active={activeKey === item.key} />)}
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon: IconComponent, label, path, active }: { icon: typeof Home; label: string; path: string; active: boolean }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className="min-h-12 min-w-[56px] items-center justify-center gap-1"
      onPress={() => router.replace(path as never)}>
      <Icon as={IconComponent} size={21} className={active ? 'text-brand-dark' : 'text-foreground'} strokeWidth={active ? 2.3 : 1.7} />
      <Text className={active ? 'text-[10px] leading-4 font-bold text-brand-dark' : 'text-[10px] leading-4 font-medium text-text-secondary'}>{label}</Text>
    </Pressable>
  );
}
