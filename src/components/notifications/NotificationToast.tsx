'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppNotification } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import {
  MessageSquare,
  Heart,
  UserCheck,
  UserPlus,
  Bell,
  X,
  ShoppingBag,
  Calendar,
} from 'lucide-react';

interface NotificationToastProps {
  notification: AppNotification;
  onDismiss: () => void;
  durationMs?: number;
}

export function NotificationToast({
  notification,
  onDismiss,
  durationMs = 6000,
}: NotificationToastProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const decrement = (intervalTime / durationMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [durationMs, isPaused, onDismiss]);

  const handleClick = () => {
    onDismiss();
    startTransition(() => {
      // Direct navigation based on notification type and data
      if (notification.type === 'verification') {
        router.push('/notifications');
      } else if (notification.type === 'comment' || notification.type === 'reaction') {
        if (notification.data?.postId) {
          router.push(`/?post=${notification.data.postId}`);
        } else {
          router.push('/notifications');
        }
      } else if (notification.type === 'follow') {
        if (notification.data?.userId) {
          router.push(`/profile/${notification.data.userId}`);
        } else {
          router.push('/notifications');
        }
      } else if (notification.type === 'chat') {
        router.push('/chat');
      } else {
        router.push('/notifications');
      }
    });
  };

  // Category Badge & Accent Color
  const getBadgeDetails = () => {
    switch (notification.type) {
      case 'comment':
        return {
          icon: <MessageSquare size={11} className="text-sky-400" />,
          label: 'Komentar',
          badgeBg: 'bg-sky-500/20 border-sky-400/30 text-sky-300',
          accentBorder: 'border-sky-500/40',
        };
      case 'reaction':
        return {
          icon: <Heart size={11} className="text-rose-400" />,
          label: 'Reaksi',
          badgeBg: 'bg-rose-500/20 border-rose-400/30 text-rose-300',
          accentBorder: 'border-rose-500/40',
        };
      case 'verification':
        return {
          icon: <UserCheck size={11} className="text-amber-400" />,
          label: 'Referral Alumni',
          badgeBg: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
          accentBorder: 'border-amber-500/40',
        };
      case 'follow':
        return {
          icon: <UserPlus size={11} className="text-indigo-400" />,
          label: 'Pengikut Baru',
          badgeBg: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300',
          accentBorder: 'border-indigo-500/40',
        };
      case 'shop':
        return {
          icon: <ShoppingBag size={11} className="text-emerald-400" />,
          label: 'Alumni Shop',
          badgeBg: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300',
          accentBorder: 'border-emerald-500/40',
        };
      case 'event':
        return {
          icon: <Calendar size={11} className="text-purple-400" />,
          label: 'Agenda',
          badgeBg: 'bg-purple-500/20 border-purple-400/30 text-purple-300',
          accentBorder: 'border-purple-500/40',
        };
      default:
        return {
          icon: <Bell size={11} className="text-slate-300" />,
          label: 'Forsil99',
          badgeBg: 'bg-slate-700/50 border-slate-600 text-slate-300',
          accentBorder: 'border-slate-600',
        };
    }
  };

  const badge = getBadgeDetails();

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto w-full max-w-md mx-auto transform transition-all duration-300 ease-out animate-slide-down"
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-[#0e1626]/95 backdrop-blur-xl border ${badge.accentBorder} shadow-2xl shadow-black/40 text-slate-100 flex flex-col`}
      >
        {/* Main Content Row */}
        <div
          onClick={handleClick}
          className="cursor-pointer p-3.5 flex items-start gap-3 select-none hover:bg-white/[0.03] transition-colors"
        >
          {/* Avatar with Action Icon Badge */}
          <div className="relative flex-shrink-0 mt-0.5">
            <AppAvatar
              src={notification.actorPhotoUrl}
              name={notification.actorName || 'Alumni 59'}
              size="md"
              className="border-2 border-slate-700 shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xs">
              {badge.icon}
            </div>
          </div>

          {/* Texts */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badge.badgeBg}`}
              >
                {badge.label}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Baru saja</span>
            </div>

            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-1">
              {notification.title}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mt-0.5">
              {notification.body}
            </p>
          </div>

          {/* Actions: Close Button */}
          <div className="flex items-center gap-1 -mr-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              aria-label="Tutup notifikasi"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Subtle Bottom Auto-dismiss Progress Bar */}
        <div className="w-full h-1 bg-slate-800/80 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-brand-primary transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
