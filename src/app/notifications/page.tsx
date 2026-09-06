'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { approveRegistration, rejectRegistration } from '@/services/authService';
import { AppNotification } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Bell,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserPlus,
  Heart,
  MessageCircle,
  Check,
  Radio,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    notifications,
    pendingReferrals,
    isLoading,
    refreshNotifications,
    markAllAsRead,
    markAsRead,
    pushPermission,
    requestPushPermission,
    isPushSupported,
  } = useNotification();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleApprove = async (regId: string, name: string) => {
    setIsProcessing(regId);
    try {
      await approveRegistration(regId);
      toast.success(`Pendaftaran ${name} berhasil disetujui!`);
      await refreshNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses persetujuan.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (regId: string, name: string) => {
    if (!confirm(`Tolak permohonan verifikasi dari ${name}?`)) return;
    setIsProcessing(regId);
    try {
      await rejectRegistration(regId);
      toast.success(`Pendaftaran ${name} telah ditolak.`);
      await refreshNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menolak permohonan.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    toast.success('Semua notifikasi ditandai telah dibaca.');
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    if (notif.type === 'verification') {
      // Stay on notifications page (referrals are at the top)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (notif.type === 'comment' || notif.type === 'reaction') {
      if (notif.data?.postId) {
        router.push(`/?post=${notif.data.postId}`);
      }
    } else if (notif.type === 'follow') {
      if (notif.data?.userId) {
        router.push(`/profile/${notif.data.userId}`);
      }
    } else if (notif.type === 'profile_view') {
      if (notif.data?.viewerId) {
        router.push(`/profile/${notif.data.viewerId}`);
      }
    } else if (notif.type === 'chat') {
      router.push('/chat');
    }
  };

  const handleEnablePush = async () => {
    const result = await requestPushPermission();
    if (result === 'granted') {
      toast.success('Push Notification browser aktif! Anda akan menerima notifikasi otomatis.');
    } else if (result === 'denied') {
      toast.error('Izin notifikasi ditolak di browser. Silakan aktifkan via pengaturan browser Anda.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Bell size={28} />}
          title="Masuk untuk melihat notifikasi"
          description="Akses notifikasi terkini mengenai interaksi rekan alumni."
          actionText="Masuk ke Akun"
          onAction={() => (window.location.href = '/login')}
        />
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle size={14} className="text-sky-500" />;
      case 'reaction':
        return <Heart size={14} className="text-rose-500 fill-rose-500/20" />;
      case 'verification':
        return <UserCheck size={14} className="text-amber-500" />;
      case 'follow':
        return <UserPlus size={14} className="text-indigo-500" />;
      case 'profile_view':
        return <Eye size={14} className="text-amber-500" />;
      default:
        return <Bell size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="w-full px-3 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Notifikasi</h1>
          <p className="text-xs text-slate-500">Pemberitahuan aktivitas & persetujuan alumni</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1 active:scale-95 transition-transform"
          >
            <Check size={14} /> Tandai Dibaca
          </button>
        )}
      </div>

      {/* Push Notification Enable Banner (Prompt when not yet enabled) */}
      {isPushSupported && pushPermission === 'default' && (
        <div className="bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 text-white flex-shrink-0">
              <Radio size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold leading-tight">
                Aktifkan Push Notification
              </h3>
              <p className="text-[11px] text-blue-100 mt-0.5 leading-snug">
                Dapatkan notifikasi instan layaknya apps saat rekan alumni memfollow, mengomentari, atau me-react postingan Anda.
              </p>
            </div>
          </div>
          <button
            onClick={handleEnablePush}
            className="px-3 py-1.5 rounded-xl bg-white text-brand-primary text-xs font-bold whitespace-nowrap hover:bg-blue-50 active:scale-95 transition-all shadow-xs"
          >
            Izinkan
          </button>
        </div>
      )}

      {/* 1. Pending Referral Approvals Box (Highlight) */}
      {pendingReferrals.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900">
            <UserCheck size={18} />
            <h2 className="text-sm font-bold">
              Permohonan Verifikasi Rekan ({pendingReferrals.length})
            </h2>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Rekan alumni berikut memilih Anda sebagai referensi pendaftaran. Harap pastikan Anda mengenalnya sebagai alumni SMAN 59 Angkatan 1999.
          </p>

          <div className="space-y-3 pt-1">
            {pendingReferrals.map((reg) => (
              <div
                key={reg.id}
                className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {reg.selfieBase64 || reg.selfieUrl ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-300 flex-shrink-0">
                      <img
                        src={reg.selfieBase64 || reg.selfieUrl}
                        alt={reg.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <AppAvatar name={reg.fullName} size="md" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{reg.fullName}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-brand-primary bg-blue-50 px-1.5 py-0.2 rounded">
                        {reg.className}
                      </span>
                      <span>WA: {reg.whatsapp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleReject(reg.id, reg.fullName)}
                    disabled={isProcessing === reg.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(reg.id, reg.fullName)}
                    disabled={isProcessing === reg.id}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    Setujui Alumni
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Notification List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-subtle animate-pulse flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-40 h-3.5 bg-slate-200 rounded" />
                  <div className="w-24 h-2.5 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 && pendingReferrals.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} />}
            title="Tidak ada notifikasi baru"
            description="Aktivitas reaksi, komentar, dan pembaruan akan muncul di sini."
          />
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`bg-white rounded-2xl p-3.5 border transition-all flex items-start gap-3 cursor-pointer hover:shadow-xs active:scale-[0.99] ${
                !notif.isRead ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100/90'
              }`}
            >
              <div className="relative flex-shrink-0">
                <AppAvatar
                  src={notif.actorPhotoUrl}
                  name={notif.actorName || 'Sistem'}
                  size="sm"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-xs">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {notif.title}
                  </p>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {notif.body}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {notif.createdAt
                    ? formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                        locale: localeId,
                      })
                    : ''}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
