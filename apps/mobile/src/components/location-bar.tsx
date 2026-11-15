import { LocateFixed, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { Place } from '@/data/types';
import { useLocation } from '@/hooks/use-location';
import { geocode } from '@/lib/api';

type Found = { q: string; places: Place[]; error: string | null };

/** Shows where results are centred and lets the user switch to GPS or a typed town. */
export function LocationBar() {
  const { place, status, setPlace, locateDevice } = useLocation();
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Found | null>(null);

  // Without a location there is nothing to show, so open the picker straight away.
  const needsPlace = !place && (status === 'denied' || status === 'unavailable');
  const open = editing || needsPlace;
  const q = query.trim();
  const active = open && q.length >= 2;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      geocode(q, controller.signal)
        .then((res) => setFound({ q, places: res.places, error: null }))
        .catch((err) => {
          if (!controller.signal.aborted) {
            setFound({ q, places: [], error: err instanceof Error ? err.message : 'Search failed' });
          }
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active]);

  // Results belong to the query they were fetched for; anything else is stale or not wanted yet.
  const current = active && found?.q === q ? found : null;
  const searching = active && current === null;

  const choose = (p: Place) => {
    setPlace(p);
    setEditing(false);
    setQuery('');
  };

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row items-center gap-1.5">
          <Icon as={MapPin} size={16} className="text-primary" />
          {status === 'loading' && !place ? (
            <Text variant="muted">Finding your location...</Text>
          ) : place ? (
            <Text className="flex-1 font-medium" numberOfLines={1}>
              {place.name}
            </Text>
          ) : (
            <Text variant="muted">Location needed to find providers near you</Text>
          )}
        </View>
        {place ? (
          <Pressable onPress={() => setEditing((v) => !v)} hitSlop={8}>
            <Text className="text-sm font-medium text-primary">{open ? 'Close' : 'Change'}</Text>
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <View className="gap-2 rounded-xl border border-border bg-card p-3">
          <Button variant="secondary" size="sm" onPress={() => void locateDevice().then(() => setEditing(false))}>
            <Icon as={LocateFixed} size={16} className="text-secondary-foreground" />
            <Text className="font-medium text-secondary-foreground">Use my current location</Text>
          </Button>
          <Input value={query} onChangeText={setQuery} placeholder="Or type a town or postcode" autoCorrect={false} />
          {searching ? <ActivityIndicator /> : null}
          {current?.error ? <Text variant="muted">{current.error}</Text> : null}
          {current?.places.map((p) => (
            <Pressable key={`${p.lat},${p.lng}`} onPress={() => choose(p)} className="py-2 active:opacity-70">
              <Text className="font-medium">{p.name}</Text>
              <Text variant="muted" numberOfLines={1}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
