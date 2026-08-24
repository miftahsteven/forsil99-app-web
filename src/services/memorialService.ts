import { apiClient } from './apiClient';
import { DeceasedAlumni, MemorialPrayer } from '@/types';

/**
 * Fetch all deceased alumni list with active flower and prayer counts
 */
export async function fetchDeceasedAlumni(): Promise<DeceasedAlumni[]> {
  try {
    const res = await apiClient.get('/memorial');
    if (res && res.success && Array.isArray(res.data)) {
      return res.data as DeceasedAlumni[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching deceased alumni list:', error);
    return [];
  }
}

/**
 * Fetch single deceased alumni detail
 */
export async function fetchDeceasedDetail(id: string): Promise<DeceasedAlumni | null> {
  try {
    const res = await apiClient.get(`/memorial/${id}`);
    if (res && res.success && res.data) {
      return res.data as DeceasedAlumni;
    }
    return null;
  } catch (error) {
    console.error('Error fetching deceased detail:', error);
    return null;
  }
}

/**
 * Create a new deceased alumni entry (open to any verified alumni)
 */
export async function createDeceasedAlumni(data: {
  fullName: string;
  nickname?: string;
  className?: string;
  photoUrl?: string;
  passedAwayYear: number;
  passedAwayDate?: string;
  bio?: string;
}): Promise<{ success: boolean; message: string; data?: DeceasedAlumni }> {
  const res = await apiClient.post('/memorial', data);
  return res;
}

/**
 * Delete a deceased alumni entry (admin, moderator, or creator)
 */
export async function deleteDeceasedAlumni(
  id: string
): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete(`/memorial/${id}`);
  return res;
}

/**
 * Report an invalid or inaccurate memorial entry
 */
export async function reportDeceasedAlumni(data: {
  targetId: string;
  category: string;
  description?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post('/reports', {
    targetId: data.targetId,
    targetType: 'memorial',
    category: data.category,
    description: data.description,
  });
  return res;
}

/**
 * Give flower tribute to a deceased alumni (valid for 30 days)
 */
export async function giveMemorialFlower(
  deceasedId: string
): Promise<{ success: boolean; message: string; flowerCount?: number; flowerExpiresAt?: string }> {
  const res = await apiClient.post(`/memorial/${deceasedId}/flowers`, {});
  return res;
}

/**
 * Fetch prayers list for a deceased alumni
 */
export async function fetchMemorialPrayers(deceasedId: string): Promise<MemorialPrayer[]> {
  try {
    const res = await apiClient.get(`/memorial/${deceasedId}/prayers`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data as MemorialPrayer[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching memorial prayers:', error);
    return [];
  }
}

/**
 * Submit a prayer for a deceased alumni
 */
export async function submitMemorialPrayer(
  deceasedId: string,
  text: string
): Promise<{ success: boolean; message: string; prayerCount?: number; data?: MemorialPrayer }> {
  const res = await apiClient.post(`/memorial/${deceasedId}/prayers`, { text });
  return res;
}

/**
 * Delete a prayer submitted by the current user or admin
 */
export async function deleteMemorialPrayer(
  prayerId: string
): Promise<{ success: boolean; message: string; prayerCount?: number; deceasedId?: string }> {
  const res = await apiClient.delete(`/memorial/prayers/${prayerId}`);
  return res;
}

