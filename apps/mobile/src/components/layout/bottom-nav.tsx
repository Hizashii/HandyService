import { CalendarDays, Home, Plus, Search, UserRound } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from '@/components/layout/safe-area';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme';

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
      <View className="h-[68px] flex-row items-center justify-around px-2">
        {items.slice(0, 2).map((item) => <NavItem key={item.key} icon={item.icon} label={item.label} path={item.path} active={activeKey === item.key} />)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post a task"
          className="-mt-7 h-[58px] w-[58px] items-center justify-center rounded-full border-4 border-background bg-brand"
          onPress={() => router.push('/create-task')}>
          <Icon as={Plus} size={24} color={colors.light.onBrand} strokeWidth={2.5} />
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
      className="min-h-12 min-w-[64px] items-center justify-center gap-1"
      onPress={() => router.replace(path as never)}>
      <Icon as={IconComponent} size={20} className={active ? 'text-brand' : 'text-text-secondary'} strokeWidth={active ? 2.5 : 1.8} />
      <Text className={active ? 'text-[11px] font-bold text-brand' : 'text-[11px] font-medium text-text-secondary'}>{label}</Text>
    </Pressable>
  );
}
