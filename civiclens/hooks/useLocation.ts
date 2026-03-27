// civiclens/hooks/useLocation.ts
// Always returns Hisar for prototype — ignores actual GPS
// Change FORCE_HISAR to false when going to production

import { useState, useEffect } from 'react';

const FORCE_HISAR = true; // Set false for production

export interface LocationData {
  lat: number;
  lng: number;
  locationName: string;
  block: string;
  isFetching: boolean;
}

const HISAR_LOCATIONS = [
  { lat: 29.1492, lng: 75.7217, name: 'Adampur, Hisar, Haryana', block: 'Adampur' },
  { lat: 29.1492, lng: 75.7217, name: 'Adampur, Hisar, Haryana', block: 'Adampur' },
];

const DEMO = {
  lat: 29.1492, lng: 75.7217,
  locationName: 'Adampur, Hisar, Haryana',
  block: 'Adampur',
};

export const useLocation = (): LocationData => {
  const [data, setData] = useState<LocationData>({
    lat: DEMO.lat, lng: DEMO.lng,
    locationName: 'Fetching location...',
    block: DEMO.block,
    isFetching: true,
  });

  useEffect(() => {
    if (FORCE_HISAR) {
      // Always show Hisar for prototype — no real GPS needed
      setTimeout(() => {
        setData({
          lat: DEMO.lat, lng: DEMO.lng,
          locationName: DEMO.locationName,
          block: DEMO.block,
          isFetching: false,
        });
      }, 800); // Small delay to simulate GPS fetch for UX
      return;
    }

    // Real GPS (for production)
    if (!navigator.geolocation) {
      setData(d => ({ ...d, locationName: DEMO.locationName, isFetching: false }));
      return;
    }

    const timeout = setTimeout(() => {
      // GPS timeout fallback
      setData({ lat: DEMO.lat, lng: DEMO.lng, locationName: DEMO.locationName, block: DEMO.block, isFetching: false });
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(timeout);
        setData({
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          locationName: 'Your Location',
          block: 'Hisar',
          isFetching: false,
        });
      },
      () => {
        clearTimeout(timeout);
        setData({ lat: DEMO.lat, lng: DEMO.lng, locationName: DEMO.locationName, block: DEMO.block, isFetching: false });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  return data;
};