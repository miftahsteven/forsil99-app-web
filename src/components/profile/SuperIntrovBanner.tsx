import React from 'react';
import Link from 'next/link';
import { Crown, BadgeCheck, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { AlumniProfile } from '@/types';

interface SuperIntrovBannerProps {
  profile: AlumniProfile;
}

export function SuperIntrovBanner({ profile }: SuperIntrovBannerProps) {
  const percentage = profile.completionPercentage ?? 50;
  const missing = profile.missingFields || [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-white p-5 shadow-sm mb-5">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-amber-100 text-amber-900 border border-amber-300 mb-2">
              <Sparkles size={12} className="text-amber-600" />
              STATUS PROFIL: SUPER INTROV
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Lengkapi Data Anda & Raih Lencana Alumni!
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Profil Anda saat ini belum lengkap. Lengkapi 12 data penting untuk mendapatkan lencana profil alumni terpercaya dan memudahkan rekan angkatan 1999 menemukan Anda.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 bg-white/80 p-3 rounded-xl border border-amber-200/60">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-700">Kelengkapan Profil Alumni</span>
            <span className="text-amber-700 font-bold">{percentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700 rounded-full"
              style={{ width: `${Math.min(Math.max(percentage, 5), 100)}%` }}
            />
          </div>
          {missing.length > 0 && (
            <div className="pt-1.5">
              <div className="text-[11px] font-medium text-slate-500 mb-1">
                Data yang masih perlu dilengkapi:
              </div>
              <div className="flex flex-wrap gap-1">
                {missing.slice(0, 5).map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-medium"
                  >
                    <AlertCircle size={10} className="text-amber-500" />
                    {field}
                  </span>
                ))}
                {missing.length > 5 && (
                  <span className="px-2 py-0.5 text-slate-400 text-[10px]">
                    +{missing.length - 5} data lainnya
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3 Tier Explanation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Super Extrov */}
          <div className="p-3 bg-white/90 rounded-xl border border-amber-200/70 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="p-1 rounded-full bg-amber-100 text-amber-700">
                <Crown size={14} className="fill-amber-400 text-amber-700" />
              </span>
              <span className="text-xs font-bold text-slate-900">Super Extrov</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Profil 100% lengkap & terbuka untuk semua alumni. Dilengkapi fitur buka/tutup akses berbatas waktu.
            </p>
          </div>

          {/* Extrov */}
          <div className="p-3 bg-white/90 rounded-xl border border-blue-200/70 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="p-1 rounded-full bg-blue-100 text-blue-700">
                <BadgeCheck size={14} className="fill-blue-500 text-white" />
              </span>
              <span className="text-xs font-bold text-slate-900">Extrov</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Profil 100% lengkap & hanya dapat dilihat khusus oleh alumni yang mengikuti (followers) Anda.
            </p>
          </div>

          {/* Introv */}
          <div className="p-3 bg-white/90 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="p-1 rounded-full bg-slate-100 text-slate-600">
                <CheckCircle2 size={14} className="fill-slate-400 text-white" />
              </span>
              <span className="text-xs font-bold text-slate-900">Introv</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Profil 100% lengkap namun bersifat privat (hanya Anda yang dapat melihat rincian kontak & alamat).
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/profile/edit"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-blue-700 hover:from-blue-700 hover:to-brand-primary text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01]"
          >
            <span>Lengkapi Profil Sekarang</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
