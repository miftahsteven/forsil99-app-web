import {
  apiClient,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  setCachedUserProfile,
  getCachedUserProfile,
  setCachedUserData,
  getCachedUserData,
  getPlatformIdentifier,
} from './apiClient';
import { UserAccount, AlumniProfile, AlumniRegistration } from '@/types';

export function normalizeProfile(profile: any): AlumniProfile | null {
  if (!profile) return null;
  const userIdentifier = profile.userId || profile.accountId || profile.uid || profile.id;
  return {
    ...profile,
    uid: userIdentifier,
    accountId: userIdentifier,
    userId: userIdentifier,
    isFollowing: typeof profile.isFollowing === 'boolean' ? profile.isFollowing : undefined,
  };
}

/**
 * Login with Phone/Email and Password
 */
export async function loginWithEmailOrPhone(
  identifier: string,
  pass: string,
  recaptchaToken?: string,
  coords?: { latitude?: number; longitude?: number }
) {
  const platform = getPlatformIdentifier();
  const res = await apiClient.post('/auth/login', {
    identifier: identifier.trim(),
    password: pass,
    recaptchaToken,
    platform,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
  });

  if (res.token) {
    setAccessToken(res.token);
  }

  if (res.user) {
    setCachedUserData(res.user);
  }

  if (res.profile) {
    const norm = normalizeProfile(res.profile);
    setCachedUserProfile(norm);
    res.profile = norm;
  }
  return res;
}

/**
 * Register Alumni user directly
 */
export async function registerAlumniUser(payload: {
  fullName: string;
  nickname?: string;
  className: string;
  phone?: string;
  email?: string;
  password: string;
  graduationYear?: number;
  referralAccountId?: string;
  referralName?: string;
  selfieBase64?: string;
  recaptchaToken?: string;
}) {
  const platform = getPlatformIdentifier();
  const res = await apiClient.post('/auth/register', {
    fullName: payload.fullName,
    nickname: payload.nickname,
    className: payload.className,
    phoneNumber: payload.phone,
    email: payload.email,
    password: payload.password,
    graduationYear: payload.graduationYear || 1999,
    referralAccountId: payload.referralAccountId,
    referralName: payload.referralName,
    selfieBase64: payload.selfieBase64,
    recaptchaToken: payload.recaptchaToken,
    platform,
  });

  if (res.token && res.user?.verificationStatus === 'approved') {
    setAccessToken(res.token);
  }
  if (res.user) {
    setCachedUserData(res.user);
  }
  if (res.profile) {
    const norm = normalizeProfile(res.profile);
    setCachedUserProfile(norm);
    res.profile = norm;
  }
  return res;
}

/**
 * Fetch Current Logged-in User Account & Profile
 */
export async function fetchCurrentUserData(): Promise<{
  user: UserAccount;
  profile: AlumniProfile;
} | null> {
  try {
    const res = await apiClient.get('/auth/me');
    if (res && res.user && res.profile) {
      const norm = normalizeProfile(res.profile);
      setCachedUserData(res.user);
      setCachedUserProfile(norm);
      return {
        user: res.user,
        profile: norm as AlumniProfile,
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch list of verified alumni for Referral selection (with optional search query)
 */
export async function fetchAlumniList(query?: string): Promise<
  {
    accountId: string;
    fullName: string;
    nickname?: string;
    className?: string;
    profilePhotoUrl?: string;
  }[]
> {
  try {
    const endpoint = query && query.trim().length > 0
      ? `/alumni-registration/alumni-list?q=${encodeURIComponent(query.trim())}`
      : '/alumni-registration/alumni-list';
    const res = await apiClient.get(endpoint);
    return res.alumni || [];
  } catch {
    return [];
  }
}

/**
 * Submit Alumni Registration Application with Referral & Selfie
 */
export async function submitAlumniRegistration(payload: {
  googleUid?: string;
  googleEmail: string;
  fullName: string;
  nickname?: string;
  className: string;
  whatsapp: string;
  referralAccountId: string;
  referralName: string;
  selfieBase64?: string;
}) {
  return await apiClient.post('/alumni-registration/submit', payload);
}

/**
 * Check registration approval status
 */
export async function checkRegistrationStatus(googleUid: string) {
  try {
    return await apiClient.get(`/alumni-registration/status/${encodeURIComponent(googleUid)}`);
  } catch {
    return null;
  }
}

/**
 * Fetch registrations awaiting this user's referral approval or history
 */
export async function fetchPendingReferrals(accountId: string, status: string = 'submitted'): Promise<AlumniRegistration[]> {
  try {
    const res = await apiClient.get(`/alumni-registration/pending-for-referrer/${accountId}?status=${status}`);
    return res.registrations || [];
  } catch {
    return [];
  }
}

/**
 * Approve referral request
 */
export async function approveRegistration(registrationId: string) {
  return await apiClient.post(`/alumni-registration/app-approve/${registrationId}`, {});
}

/**
 * Reject referral request
 */
export async function rejectRegistration(registrationId: string) {
  return await apiClient.post(`/alumni-registration/app-reject/${registrationId}`, {});
}

/**
 * Fetch all alumni profiles for Directory
 */
export async function fetchProfiles(): Promise<AlumniProfile[]> {
  try {
    const res = await apiClient.get('/profiles');
    if (res && res.profiles && Array.isArray(res.profiles)) {
      return res.profiles.map(normalizeProfile).filter(Boolean) as AlumniProfile[];
    }
    return [];
  } catch (err) {
    console.warn('Fetch profiles warning:', err);
    return [];
  }
}

/**
 * Fetch single profile by ID
 */
export async function fetchProfileById(id: string): Promise<AlumniProfile | null> {
  try {
    const res = await apiClient.get(`/profiles/${id}`);
    return normalizeProfile(res.profile);
  } catch {
    return null;
  }
}

/**
 * Toggle follow/unfollow on user profile
 */
export async function toggleFollow(targetUserId: string) {
  return await apiClient.post(`/profiles/${targetUserId}/follow`, {});
}

/**
 * Fetch follow status and follower counts
 */
export async function fetchFollowStatus(targetUserId: string) {
  try {
    return await apiClient.get(`/profiles/${targetUserId}/follow-status`);
  } catch {
    return null;
  }
}

/**
 * Fetch list of followers for a user
 */
export async function fetchFollowers(targetUserId: string): Promise<AlumniProfile[]> {
  try {
    const res = await apiClient.get(`/profiles/${targetUserId}/followers`);
    if (res && Array.isArray(res.followers)) {
      return res.followers.map(normalizeProfile).filter(Boolean) as AlumniProfile[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch list of following for a user
 */
export async function fetchFollowing(targetUserId: string): Promise<AlumniProfile[]> {
  try {
    const res = await apiClient.get(`/profiles/${targetUserId}/following`);
    if (res && Array.isArray(res.following)) {
      return res.following.map(normalizeProfile).filter(Boolean) as AlumniProfile[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Update current user profile
 */
export async function updateProfile(payload: {
  fullName?: string;
  nickname?: string;
  bio?: string;
  className?: string;
  gender?: string;
  maritalStatus?: string;
  birthDate?: string;
  whatsappNumber?: string;
  city?: string;
  province?: string;
  currentAddress?: string;
  occupation?: string;
  company?: string;
  hobbies?: string[];
  profileVisibility?: 'public' | 'followers' | 'private';
  profileCategory?: 'super_extrov' | 'extrov' | 'introv';
  tempPublicHours?: number;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
}): Promise<AlumniProfile | null> {
  const res = await apiClient.put('/profiles/me', payload);
  if (res && res.profile) {
    const norm = normalizeProfile(res.profile);
    setCachedUserProfile(norm);
    return norm;
  }
  return null;
}

/**
 * Quick toggle profile visibility or temporary public window
 */
export async function toggleProfileVisibility(visibility: 'public' | 'followers' | 'private', tempHours?: number): Promise<AlumniProfile | null> {
  const res = await apiClient.post('/profiles/me/toggle-visibility', { visibility, tempHours });
  if (res && res.profile) {
    const norm = normalizeProfile(res.profile);
    setCachedUserProfile(norm);
    return norm;
  }
  return null;
}

/**
 * Logout
 */
export function logoutUser(): void {
  clearAccessToken();
}

/**
 * Request OTP verification code for new alumni registration
 */
export async function sendRegistrationOtp(email: string, fullName: string, recaptchaToken?: string) {
  const platform = getPlatformIdentifier();
  return await apiClient.post('/auth/send-registration-otp', {
    email: email.trim(),
    fullName: fullName.trim(),
    recaptchaToken,
    platform,
  });
}

/**
 * Verify OTP and submit registration atomically
 */
export async function verifyRegistrationOtpAndRegister(payload: {
  otpCode: string;
  fullName: string;
  nickname?: string;
  className: string;
  phone?: string;
  email: string;
  password: string;
  graduationYear?: number;
  referralAccountId?: string;
  referralName?: string;
  selfieBase64?: string;
  recaptchaToken?: string;
}) {
  const platform = getPlatformIdentifier();
  const res = await apiClient.post('/auth/verify-registration-otp', {
    otpCode: payload.otpCode.trim(),
    fullName: payload.fullName.trim(),
    nickname: payload.nickname?.trim() || undefined,
    className: payload.className,
    phoneNumber: payload.phone?.trim() || undefined,
    email: payload.email.trim(),
    password: payload.password,
    graduationYear: payload.graduationYear || 1999,
    referralAccountId: payload.referralAccountId,
    referralName: payload.referralName,
    selfieBase64: payload.selfieBase64,
    recaptchaToken: payload.recaptchaToken,
    platform,
  });

  if (res.token && res.user?.verificationStatus === 'approved') {
    setAccessToken(res.token);
  }
  if (res.user) {
    setCachedUserData(res.user);
  }
  if (res.profile) {
    const norm = normalizeProfile(res.profile);
    setCachedUserProfile(norm);
    res.profile = norm;
  }
  return res;
}

/**
 * Change password (authenticated or with security reset token)
 */
export async function changePassword(payload: {
  oldPassword?: string;
  newPassword: string;
  confirmPassword: string;
  securityToken?: string;
}) {
  const res = await apiClient.post('/auth/change-password', payload);
  if (res.token) {
    setAccessToken(res.token);
  }
  return res;
}

/**
 * Request password reset link to registered email
 */
export async function requestPasswordReset(email: string, recaptchaToken?: string) {
  const platform = getPlatformIdentifier();
  return await apiClient.post('/auth/forgot-password', {
    email: email.trim(),
    recaptchaToken,
    platform,
  });
}
