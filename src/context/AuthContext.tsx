'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserAccount, AlumniProfile } from '@/types';
import {
  fetchCurrentUserData,
  loginWithEmailOrPhone,
  logoutUser,
  normalizeProfile,
} from '@/services/authService';
import {
  getAccessToken,
  getCachedUserData,
  getCachedUserProfile,
  setCachedUserData,
  setCachedUserProfile,
} from '@/services/apiClient';

interface AuthContextType {
  user: UserAccount | null;
  profile: AlumniProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateCurrentProfileState: (updated: Partial<AlumniProfile>) => void;
  isVerified: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Try fast load from cache
    const cachedUser = getCachedUserData();
    const cachedProfile = getCachedUserProfile();
    if (cachedUser) setUser(cachedUser);
    if (cachedProfile) setProfile(cachedProfile);

    // Verify & update with fresh data from backend
    try {
      const fresh = await fetchCurrentUserData();
      if (fresh && fresh.user) {
        setUser(fresh.user);
        setProfile(fresh.profile);
      } else {
        // Token invalid
        logoutUser();
        setUser(null);
        setProfile(null);
      }
    } catch {
      // Offline fallback: keep cached profile if exists
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (identifier: string, pass: string) => {
    const res = await loginWithEmailOrPhone(identifier, pass);
    if (res.user) {
      setUser(res.user);
    }
    if (res.profile) {
      const norm = normalizeProfile(res.profile);
      setProfile(norm);
    }
    return res;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const refreshProfile = async () => {
    const fresh = await fetchCurrentUserData();
    if (fresh) {
      setUser(fresh.user);
      setProfile(fresh.profile);
    }
  };

  const updateCurrentProfileState = (updated: Partial<AlumniProfile>) => {
    if (!profile) return;
    const merged = { ...profile, ...updated };
    setProfile(merged);
    setCachedUserProfile(merged);
  };

  const isVerified =
    user?.verificationStatus === 'approved' ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('super_admin') ||
    false;

  const isAdmin =
    user?.roles?.includes('admin') ||
    user?.roles?.includes('super_admin') ||
    user?.roles?.includes('moderator') ||
    false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user && !!getAccessToken(),
        isLoading,
        login,
        logout,
        refreshProfile,
        updateCurrentProfileState,
        isVerified,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
