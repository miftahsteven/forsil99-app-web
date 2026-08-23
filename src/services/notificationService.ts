import { apiClient } from './apiClient';
import { AppNotification } from '@/types';

export async function fetchNotifications(): Promise<AppNotification[]> {
  try {
    const res = await apiClient.get('/notifications');
    return res.notifications || [];
  } catch (err) {
    console.warn('Fetch notifications error:', err);
    return [];
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    await apiClient.put('/notifications/read-all');
    return true;
  } catch {
    return false;
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    await apiClient.put(`/notifications/${id}/read`);
    return true;
  } catch {
    return false;
  }
}
