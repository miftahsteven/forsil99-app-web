import React from 'react';
import { Crown, BadgeCheck, CheckCircle2 } from 'lucide-react';

export interface ProfileCategoryBadgeProps {
  category?: 'super_extrov' | 'extrov' | 'introv' | 'super_introv' | string;
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
  if (!category || category === 'super_introv') {
    return null;
  }

  if (category === 'super_extrov') {
    return (
      <span
        className={`inline-flex items-center gap-1 group relative cursor-help ${className}`}
        title="👑 Super Extrov: Profil Lengkap & Terbuka untuk Semua Alumni"
      >
        <span className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-slate-900 shadow-sm transition-transform group-hover:scale-110">
          <Crown size={size} className="fill-yellow-400 text-amber-700 stroke-[2.2]" />
        </span>
        {showLabel && (
          <span className="text-[11px] font-bold tracking-tight text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Super Extrov
          </span>
        )}
      </span>
    );
  }

  if (category === 'extrov') {
    return (
      <span
        className={`inline-flex items-center gap-1 group relative cursor-help ${className}`}
        title="🔷 Extrov: Profil Lengkap & Terbuka Khusus Pengikut (Followers)"
      >
        <BadgeCheck
          size={size + 2}
          className="fill-blue-500 text-white stroke-[2] transition-transform group-hover:scale-110 drop-shadow-sm"
        />
        {showLabel && (
          <span className="text-[11px] font-bold tracking-tight text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Extrov
          </span>
        )}
      </span>
    );
  }

  if (category === 'introv') {
    return (
      <span
        className={`inline-flex items-center gap-1 group relative cursor-help ${className}`}
        title="⚪ Introv: Profil Lengkap (Private Profile)"
      >
        <CheckCircle2
          size={size}
          className="fill-slate-400 text-white stroke-[2.2] transition-transform group-hover:scale-110"
        />
        {showLabel && (
          <span className="text-[11px] font-bold tracking-tight text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            Introv
          </span>
        )}
      </span>
    );
  }

  return null;
}
