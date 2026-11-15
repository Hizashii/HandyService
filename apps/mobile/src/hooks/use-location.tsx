import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Place } from '@/data/types';

type Status = 'loading' | 'ready' | 'denied' | 'unavailable';

type LocationContextValue = {
  /** The place searches are centred on: device GPS or a place the user typed. */
  place: Place | null;
  status: Status;
  /** Use a manually chosen place (e.g. from the town search). */
  setPlace: (place: Place) => void;
  /** Ask for / re-read the device location. */
  locateDevice: () => Promise<void>;
};

type DeviceResult = { status: 'ready'; place: Place } | { status: 'denied' | 'unavailable' };

const LocationContext = createContext<LocationContextValue | null>(null);

/** Asks for permission and reads the device position. Pure: it never touches React state. */
async function readDevicePlace(): Promise<DeviceResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return { status: 'denied' };
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude: lat, longitude: lng } = position.coords;
    let name = 'Your location';
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      name = address?.city ?? address?.subregion ?? name;
    } catch {
      // The label is cosmetic; coordinates are what matter.
    }
    return { status: 'ready', place: { lat, lng, name } };
  } catch {
    return { status: 'unavailable' };
  }
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [place, setPlaceState] = useState<Place | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const apply = useCallback((result: DeviceResult) => {
    if (result.status === 'ready') setPlaceState(result.place);
    setStatus(result.status);
  }, []);

  // Re-locate on demand (e.g. the "Use my current location" button).
  const locateDevice = useCallback(() => {
    setStatus('loading');
    return readDevicePlace().then(apply);
  }, [apply]);

  // Status already starts as 'loading', so the first read needs no extra state update.
  useEffect(() => {
    void readDevicePlace().then(apply);
  }, [apply]);

  const setPlace = useCallback((next: Place) => {
    setPlaceState(next);
    setStatus('ready');
  }, []);

  const value = useMemo(
    () => ({ place, status, setPlace, locateDevice }),
    [place, status, setPlace, locateDevice]
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside <LocationProvider>');
  return ctx;
}
