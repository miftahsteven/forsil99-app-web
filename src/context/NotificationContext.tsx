'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';
import { fetchPendingReferrals } from '@/services/authService';
import { AppNotification, AlumniRegistration } from '@/types';
import { soundFx } from '@/utils/audioFx';
import { NotificationToast } from '@/components/notifications/NotificationToast';

interface NotificationContextValue {
  notifications: AppNotification[];
  pendingReferrals: AlumniRegistration[];
  unreadCount: number;
  isLoading: boolean;
  isPushSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  activeToast: AppNotification | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  requestPushPermission: () => Promise<NotificationPermission>;
  showToast: (notification: AppNotification) => void;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingReferrals, setPendingReferrals] = useState<AlumniRegistration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  const [isPushSupported, setIsPushSupported] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>(
    'default'
  );

  // Menyimpan ID yang sudah diketahui agar tidak memicu toast berulang kali saat load pertama
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const knownReferralIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef<boolean>(true);

  // Inisialisasi dukungan Notification API pada browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsPushSupported(true);
      setPushPermission(Notification.permission);
    } else {
      setPushPermission('unsupported');
    }
  }, []);

  const triggerIncomingAlert = useCallback((item: AppNotification) => {
    // 1. Suara Aplikasi Mobile
    soundFx.playNotificationChime();

    // 2. Banner Floating Toast di dalam Web
    setActiveToast(item);

    // 3. Native Browser Web Push Notification (OS Desktop/Mobile)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const sysNotif = new Notification(item.title, {
            body: item.body,
            icon: item.actorPhotoUrl || '/images/forsil99apps.png',
            badge: '/images/forsil99apps.png',
            tag: item.id,
          });

          sysNotif.onclick = () => {
            window.focus();
            if (item.type === 'verification') {
              window.location.href = '/notifications';
            } else if (item.data?.postId) {
              window.location.href = `/?post=${item.data.postId}`;
            } else if (item.data?.userId) {
              window.location.href = `/profile/${item.data.userId}`;
            } else {
              window.location.href = '/notifications';
            }
          };
        } catch {
          // Ignore browser restriction
        }
      }
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const accountId = user?.id || profile?.uid || '';

    try {
      const [notifs, referrals] = await Promise.all([
        fetchNotifications(),
        accountId ? fetchPendingReferrals(accountId) : Promise.resolve([]),
      ]);

      // Periksa apakah ada notifikasi baru sejak polling sebelumnya
      if (!isInitialLoad.current) {
        // Cek notifikasi aktivitas baru (komentar, reaksi, follow, dll)
        for (const notif of notifs) {
          if (!knownNotificationIds.current.has(notif.id) && !notif.isRead) {
            triggerIncomingAlert(notif);
            break; // Tampilkan 1 toast terbaru agar tidak menumpuk
          }
        }

        // Cek referral pendaftaran baru yang butuh approval
        for (const refItem of referrals) {
          if (!knownReferralIds.current.has(refItem.id)) {
            triggerIncomingAlert({
              id: `ref-${refItem.id}`,
              recipientId: accountId,
              actorName: refItem.fullName,
              actorPhotoUrl: refItem.selfieBase64 || refItem.selfieUrl,
              type: 'verification',
              title: 'Permintaan Konfirmasi Teman Angkatan',
              body: `${refItem.fullName} (${refItem.className}) mendaftar dan memilih Anda sebagai referensi alumni 59.`,
              isRead: false,
              data: { registrationId: refItem.id },
              createdAt: refItem.submittedAt,
            });
            break;
          }
        }
      }

      // Perbarui set ID yang telah diketahui
      const nextNotifIds = new Set<string>();
      notifs.forEach((n: AppNotification) => nextNotifIds.add(n.id));
      knownNotificationIds.current = nextNotifIds;

      const nextRefIds = new Set<string>();
      referrals.forEach((r: AlumniRegistration) => nextRefIds.add(r.id));
      knownReferralIds.current = nextRefIds;

      setNotifications(notifs);
      setPendingReferrals(referrals);
      isInitialLoad.current = false;
    } catch {
      // Polling silent fallback
    }
  }, [isAuthenticated, user?.id, profile?.uid, triggerIncomingAlert]);

  // Initial load saat user login
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      isInitialLoad.current = true;
      refreshNotifications().finally(() => setIsLoading(false));
    } else {
      setNotifications([]);
      setPendingReferrals([]);
      knownNotificationIds.current.clear();
      knownReferralIds.current.clear();
      isInitialLoad.current = true;
    }
  }, [isAuthenticated, refreshNotifications]);

  // Realtime Polling (setiap 10 detik saat aktif) + Immediate fetch saat jendela/tab difokuskan
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 10000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [isAuthenticated, refreshNotifications]);

  const markAsRead = async (id: string): Promise<boolean> => {
    const success = await markNotificationRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
    return success;
  };

  const markAllAsRead = async (): Promise<boolean> => {
    const success = await markAllNotificationsRead();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
    return success;
  };

  const requestPushPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      return permission;
    } catch {
      return 'denied';
    }
  };

  const showToast = (notification: AppNotification) => {
    triggerIncomingAlert(notification);
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  // Jumlah unread adalah akumulasi notifikasi yang belum dibaca + pending referral yang menunggu verifikasi
  const unreadCount =
    notifications.filter((n) => !n.isRead).length + pendingReferrals.length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        pendingReferrals,
        unreadCount,
        isLoading,
        isPushSupported,
        pushPermission,
        activeToast,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        requestPushPermission,
        showToast,
        dismissToast,
      }}
    >
      {children}

      {/* Floating In-App App-Like Toast Banner */}
      {activeToast && (
        <div className="fixed top-4 left-0 right-0 z-[9999] px-3 pointer-events-none flex justify-center">
          <NotificationToast notification={activeToast} onDismiss={dismissToast} />
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
