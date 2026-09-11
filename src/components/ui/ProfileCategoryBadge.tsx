import React from 'react';
import { Crown, BadgeCheck, CheckCircle2 } from 'lucide-react';

export interface ProfileCategoryBadgeProps {
  category?: 'open' | 'connected' | 'private' | 'new' | 'super_extrov' | 'extrov' | 'introv' | 'super_introv' | string;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function ProfileCategoryBadge({
  category,
  size = 18,
  showLabel = false,
  className = '',
}: ProfileCategoryBadgeProps) {
  if (!category) {
    return null;
  }

  // 1. Open Alumni (👑 Crown Emas) - Terbuka untuk semua alumni
  if (category === 'open' || category === 'super_extrov') {
    return (
      <span
        className={`inline-flex items-center gap-1 group relative cursor-help ${className}`}
        title="👑 Open Alumni: Terbuka untuk Semua Alumni"
      >
        <span className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-slate-900 shadow-sm transition-transform group-hover:scale-110">
          <Crown size={size} className="fill-yellow-400 text-amber-700 stroke-[2.2]" />
        </span>
        {showLabel && (
          <span className="text-[11px] font-bold tracking-tight text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Open Alumni
          </span>
        )}
      </span>
    );
  }

  // 2. Khusus Pengikut Saja (Connected Alumni) (🔷 Centang Biru) - Detail untuk koneksi/follower
  if (category === 'connected' || category === 'extrov') {
    return (
      <span
        className={`inline-flex items-center gap-1 group relative cursor-help ${className}`}
        title="🔷 Khusus Pengikut Saja (Connected Alumni): Detail untuk Koneksi / Pengikut"
      >
        <BadgeCheck
          size={size + 2}
          className="fill-blue-500 text-white stroke-[2] transition-transform group-hover:scale-110 drop-shadow-sm"
        />
        {showLabel && (
          <span className="text-[11px] font-bold tracking-tight text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Connected Alumni
          </span>
        )}
      </span>
    );
  }

  // 3. Private Alumni (⚪ Centang Abu-abu) - Profil privat
  if (category === 'private' || category === 'introv') {
    return (
      <span
        className={`inline-flex items-center gap-1 group relative cursor-help ${className}`}
        title="⚪ Private Alumni: Profil Privat"
      >
        <CheckCircle2
          size={size}
          className="fill-slate-400 text-white stroke-[2.2] transition-transform group-hover:scale-110"
        />
        {showLabel && (
          <span className="text-[11px] font-bold tracking-tight text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            Private Alumni
          </span>
        )}
      </span>
    );
  }

  // 4. New Alumni / Data Belum Lengkap (⚪ Centang Abu-abu)
  if (category === 'new' || category === 'super_introv' || category === 'incomplete') {
    return (
      <span
        className={`inline-flex items-center gap-1 group relative cursor-help ${className}`}
        title="⚪ New: Data Belum Lengkap"
      >
        <CheckCircle2
          size={size}
          className="fill-slate-400 text-white stroke-[2.2] transition-transform group-hover:scale-110"
        />
        {showLabel && (
          <span className="text-[11px] font-bold tracking-tight text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            New Alumni
          </span>
        )}
      </span>
    );
  }

  return null;
}
