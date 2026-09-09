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

export async function createEvent(data: {
  title: string;
  description: string;
  coverUrl?: string;
  startAt: string;
  endAt?: string;
  locationName: string;
  address?: string;
  organizerName?: string;
}): Promise<any> {
  return await apiClient.post('/events', data);
}

export async function updateEvent(
  id: string,
  data: Partial<AlumniEvent>
): Promise<any> {
  return await apiClient.put(`/events/${id}`, data);
}

export async function deleteEvent(id: string): Promise<any> {
  return await apiClient.delete(`/events/${id}`);
}

