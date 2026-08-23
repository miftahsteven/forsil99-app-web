import { apiClient } from './apiClient';
import { AlumniEvent } from '@/types';

export async function fetchEvents(): Promise<AlumniEvent[]> {
  try {
    const res = await apiClient.get('/events');
    return res.events || [];
  } catch (err) {
    console.warn('Fetch events error:', err);
    return [];
  }
}

export async function rsvpEvent(
  eventId: string,
  status: 'hadir' | 'mungkin' | 'tidak'
): Promise<any> {
  return await apiClient.post(`/events/${eventId}/rsvp`, { status });
}
