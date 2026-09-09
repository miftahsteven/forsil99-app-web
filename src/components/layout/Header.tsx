'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MessageSquare, Bell, Calendar, ShieldCheck, User, UserCheck, Shield, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { AppAvatar } from '@/components/ui/AppAvatar';

export function Header() {
  const pathname = usePathname();
  const { user, profile, isAuthenticated, isAdmin } = useAuth();
  const { unreadCount, pendingReferrals } = useNotification();

  // Hide header on login / register pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/awaiting-approval') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100/80 shadow-sm transition-all">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/images/forsil99apps.png"
            alt="Forsil99"
            className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </Link>

        {/* Action Badges & Icons */}
        <div className="flex items-center gap-1.5">
          {isAuthenticated ? (
            <>
              {/* Event / Reuni Icon */}
              <Link
                href="/events"
                prefetch={false}
                className={`p-2 rounded-full text-slate-600 hover:text-brand-primary hover:bg-slate-100 transition-colors ${
                  pathname === '/events' ? 'text-brand-primary bg-blue-50' : ''
                }`}
                title="Agenda Reuni & Acara"
              >
                <Calendar size={19} />
              </Link>

              {/* Chat Inbox */}
              <Link
                href="/chat"
                prefetch={false}
                className={`relative p-2 rounded-full text-slate-600 hover:text-brand-primary hover:bg-slate-100 transition-colors ${
                  pathname?.startsWith('/chat') ? 'text-brand-primary bg-blue-50' : ''
                }`}
                title="Pesan Langsung (Chat)"
              >
                <MessageSquare size={19} />
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                prefetch={false}
                className={`relative p-2 rounded-full text-slate-600 hover:text-brand-primary hover:bg-slate-100 transition-colors ${
                  pathname === '/notifications' ? 'text-brand-primary bg-blue-50' : ''
                }`}
                title={unreadCount > 0 ? `${unreadCount} Notifikasi Belum Dibaca` : 'Notifikasi'}
                aria-label={unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Notifikasi'}
              >
                <Bell size={19} />

                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-scale-in"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Verification & Admin Portal (Accessible to all alumni) */}
              <Link
                href="/admin"
                prefetch={false}
                className={`relative p-2 rounded-full transition-colors ${
                  pathname === '/admin'
                    ? 'text-brand-primary bg-blue-50'
                    : 'text-slate-600 hover:text-brand-primary hover:bg-slate-100'
                }`}
                title={isAdmin ? 'Portal Pengurus & Admin' : 'Portal Verifikasi Referral Rekan'}
                aria-label={isAdmin ? 'Portal Pengurus & Admin' : 'Portal Verifikasi Referral Rekan'}
              >
                {isAdmin ? (
                  <ShieldCheck size={19} className="text-amber-700" />
                ) : (
                  <UserCheck size={19} />
                )}

                {pendingReferrals.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-amber-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-scale-in"
                  >
                    {pendingReferrals.length > 99 ? '99+' : pendingReferrals.length}
                  </span>
                )}
              </Link>

              {/* Tentang Forsil 99 & Sambutan Ketua */}
              <Link
                href="/about"
                prefetch={false}
                className={`p-2 rounded-full transition-colors ${
                  pathname === '/about'
                    ? 'text-brand-primary bg-blue-50'
                    : 'text-slate-600 hover:text-brand-primary hover:bg-slate-100'
                }`}
                title="Tentang Forsil 99 & Sambutan Ketua"
                aria-label="Tentang Forsil 99 & Sambutan Ketua"
              >
                <Info size={19} className={pathname === '/about' ? 'text-brand-primary' : 'text-slate-600'} />
              </Link>

              {/* Kebijakan Privasi & Kepatuhan UU PDP */}
              <Link
                href="/privacy"
                prefetch={false}
                className={`p-2 rounded-full transition-colors ${
                  pathname === '/privacy'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                }`}
                title="Kebijakan Privasi & Kepatuhan UU PDP Forsil 99"
                aria-label="Kebijakan Privasi & Kepatuhan UU PDP Forsil 99"
              >
                <Shield size={19} className={pathname === '/privacy' ? 'text-emerald-700' : 'text-emerald-600'} />
              </Link>

              {/* Profile Avatar */}
              <Link
                id="header-profile-avatar"
                href={`/profile/${user?.id || profile?.uid || 'me'}`}
                prefetch={false}
                className="ml-1 active:scale-95 transition-transform"
                title="Profil Saya"
              >
                <AppAvatar
                  src={profile?.profilePhotoUrl}
                  name={profile?.fullName || 'Alumni'}
                  size="sm"
                />
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/about"
                prefetch={false}
                className={`p-2 rounded-full transition-colors ${
                  pathname === '/about'
                    ? 'text-brand-primary bg-blue-50'
                    : 'text-slate-600 hover:text-brand-primary hover:bg-slate-100'
                }`}
                title="Tentang Forsil 99 & Sambutan Ketua"
              >
                <Info size={19} className={pathname === '/about' ? 'text-brand-primary' : 'text-slate-600'} />
              </Link>
              <Link
                href="/privacy"
                prefetch={false}
                className="p-2 rounded-full text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70 transition-colors"
                title="Kebijakan Privasi & Kepatuhan UU PDP Forsil 99"
              >
                <Shield size={19} className="text-emerald-600" />
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primaryDark shadow-sm"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
