'use client';

import React from 'react';
import Link from 'next/link';
import { Image as ImageIcon, History, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AppAvatar } from '@/components/ui/AppAvatar';

export function QuickComposer() {
  const { profile, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const firstName = profile?.fullName?.split(' ')[0] || 'Alumni';

  return (
    <div className="bg-white rounded-2xl p-3.5 mb-3 border border-slate-100 shadow-subtle">
      {/* Top row: Avatar + Clickable Input Box */}
      <div className="flex items-center gap-3">
        <Link href={`/profile/${profile?.uid || 'me'}`}>
          <AppAvatar
            src={profile?.profilePhotoUrl}
            name={profile?.fullName || 'Saya'}
            size="sm"
          />
        </Link>
        <Link
          href="/create"
          prefetch={false}
          className="flex-1 bg-slate-100/80 hover:bg-slate-200/70 text-slate-500 rounded-full px-4 py-2.5 text-xs sm:text-sm font-normal text-left transition-colors truncate"
        >
          Apa cerita kenangan atau aktivitas hari ini, {firstName}?
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 my-2.5" />

      {/* Bottom shortcut buttons */}
      <div className="flex items-center justify-around text-xs font-semibold text-slate-600">
        <Link
          href="/create?type=standard"
          prefetch={false}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 text-emerald-600 active:scale-95 transition-all"
        >
          <ImageIcon size={17} />
          <span className="text-[11px]">Foto / Video</span>
        </Link>

        <Link
          href="/create?type=memory"
          prefetch={false}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 text-brand-gold active:scale-95 transition-all"
        >
          <History size={17} />
          <span className="text-[11px]">Kenangan ’99</span>
        </Link>

        <Link
          href="/create?type=shop_share"
          prefetch={false}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 text-brand-primary active:scale-95 transition-all"
        >
          <ShoppingBag size={17} />
          <span className="text-[11px]">Pasar UMKM</span>
        </Link>
      </div>
    </div>
  );
}
