import { apiClient } from './apiClient';
import { LiveLocation } from '@/types';

export async function fetchLiveLocations(): Promise<LiveLocation[]> {
  try {
    const res = await apiClient.get('/live-locations');
    return res.locations || [];
  } catch (err) {
    console.warn('Fetch live locations error:', err);
    return [];
  }
}

export async function updateLiveLocation(payload: {
  lat: number;
  lng: number;
  cityName: string;
  areaName: string;
  isSharing: boolean;
}): Promise<LiveLocation> {
  const res = await apiClient.post('/live-locations', payload);
  return res.location;
}
