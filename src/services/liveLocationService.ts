import { apiClient } from './apiClient';
import { LiveLocation } from '@/types';
import { ref, set as setRtdb, remove as removeRtdb, onValue, off } from 'firebase/database';
import { rtdb } from './firebaseConfig';

const geocodeCache = new Map<string, { cityName: string; areaName: string }>();

/**
 * Calculate distance between two coordinates in kilometers (Haversine Formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance to human-readable string (e.g. '450 m' or '3.5 km')
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Fetch all active alumni live locations from Node.js REST API
 */
export async function fetchLiveLocations(): Promise<LiveLocation[]> {
  try {
    const res = await apiClient.get('/live-locations');
    if (res && res.success && Array.isArray(res.locations)) {
      return res.locations as LiveLocation[];
    }
    return [];
  } catch (err) {
    console.warn('Fetch live locations warning:', err);
    return [];
  }
}

/**
 * Real-time Firebase RTDB listener for alumni locations with REST fallback
 */
export function subscribeLiveLocations(
  onUpdate: (locations: LiveLocation[]) => void
): () => void {
  try {
    const locationsRef = ref(rtdb, 'liveLocations');
    const unsubscribe = onValue(
      locationsRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          fetchLiveLocations().then(onUpdate).catch(() => onUpdate([]));
          return;
        }

        const items: LiveLocation[] = Object.entries(val)
          .map(([key, data]: [string, any]) => ({
            userId: data.uid || key,
            fullName: data.fullName || 'Alumni 59',
            nickname: data.nickname || undefined,
            photoUrl: data.photoUrl || undefined,
            className: data.className || 'Alumni 99',
            isSharing: data.isSharing !== false,
            lat: Number(data.lat) || 0,
            lng: Number(data.lng) || 0,
            cityName: data.cityName || 'Jakarta',
            areaName: data.areaName || '',
            updatedAt: data.updatedAt
              ? new Date(data.updatedAt).toISOString()
              : new Date().toISOString(),
          }))
          .filter((loc) => loc.isSharing && loc.lat !== 0 && loc.lng !== 0);

        onUpdate(items);
      },
      (error) => {
        console.warn('RTDB liveLocations listener warning:', error);
        fetchLiveLocations().then(onUpdate).catch(() => {});
      }
    );

    return () => {
      off(locationsRef);
    };
  } catch (err) {
    console.warn('Error setting up RTDB subscriber:', err);
    fetchLiveLocations().then(onUpdate).catch(() => {});
    return () => {};
  }
}

/**
 * Reverse Geocode via browser Nominatim / Google API with local memory cache
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ cityName: string; areaName: string }> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    // If Google Maps API is loaded in window
    if (typeof window !== 'undefined' && (window as any).google?.maps?.Geocoder) {
      const geocoder = new (window as any).google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results.length > 0) {
        let city = 'Jakarta';
        let area = 'Jabodetabek';
        for (const comp of response.results[0].address_components) {
          if (comp.types.includes('administrative_area_level_2') || comp.types.includes('locality')) {
            city = comp.long_name;
          }
          if (comp.types.includes('sublocality') || comp.types.includes('administrative_area_level_3')) {
            area = comp.long_name;
          }
        }
        const result = { cityName: city, areaName: area };
        geocodeCache.set(cacheKey, result);
        return result;
      }
    }

    // OpenStreetMap Fallback
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'id' } }
    );
    const data = await res.json();
    const city =
      data.address?.city ||
      data.address?.municipality ||
      data.address?.county ||
      data.address?.state ||
      'Jakarta';
    const area =
      data.address?.suburb ||
      data.address?.village ||
      data.address?.neighbourhood ||
      data.address?.quarter ||
      'Jabodetabek';

    const result = { cityName: city, areaName: area };
    geocodeCache.set(cacheKey, result);
    return result;
  } catch {
    return { cityName: 'Jakarta Timur', areaName: 'Duren Sawit' };
  }
}

/**
 * Publish / update current user's live location
 */
export async function updateLiveLocation(payload: {
  userId?: string;
  fullName?: string;
  nickname?: string;
  photoUrl?: string;
  className?: string;
  lat: number;
  lng: number;
  cityName: string;
  areaName: string;
  isSharing: boolean;
}): Promise<LiveLocation> {
  // 1. Post to PostgreSQL
  const res = await apiClient.post('/live-locations', {
    isSharing: payload.isSharing,
    lat: payload.lat,
    lng: payload.lng,
    cityName: payload.cityName,
    areaName: payload.areaName,
  });

  // 2. Sync to Firebase RTDB for real-time app sync
  if (payload.userId) {
    try {
      const locationRef = ref(rtdb, `liveLocations/${payload.userId}`);
      if (payload.isSharing && payload.lat !== 0) {
        await setRtdb(locationRef, {
          uid: payload.userId,
          fullName: payload.fullName || 'Alumni 59',
          nickname: payload.nickname || null,
          photoUrl: payload.photoUrl || null,
          className: payload.className || 'Alumni 99',
          isSharing: true,
          lat: payload.lat,
          lng: payload.lng,
          cityName: payload.cityName,
          areaName: payload.areaName,
          updatedAt: Date.now(),
        });
      } else {
        await removeRtdb(locationRef);
      }
    } catch (e) {
      console.warn('Firebase RTDB sync warning:', e);
    }
  }

  return res.location;
}
