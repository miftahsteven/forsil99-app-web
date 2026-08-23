'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MessageSquare, Bell, Calendar, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AppAvatar } from '@/components/ui/AppAvatar';

export function Header() {
  const pathname = usePathname();
  const { user, profile, isAuthenticated, isAdmin } = useAuth();

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
                title="Notifikasi"
              >
                <Bell size={19} />
              </Link>

              {/* Admin Portal (if role allows) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  prefetch={false}
                  className={`p-2 rounded-full text-amber-700 hover:bg-amber-50 transition-colors ${
                    pathname === '/admin' ? 'bg-amber-100' : ''
                  }`}
                  title="Admin Moderasi & Verifikasi"
                >
                  <ShieldCheck size={19} />
                </Link>
              )}

              {/* Profile Avatar */}
              <Link
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
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primaryDark shadow-sm"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
