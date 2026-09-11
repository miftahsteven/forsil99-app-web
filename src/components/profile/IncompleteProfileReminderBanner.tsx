import React from 'react';
import Link from 'next/link';
import { Crown, BadgeCheck, CheckCircle2, AlertCircle, ArrowRight, Sparkles, ShieldAlert, Check } from 'lucide-react';
import { AlumniProfile } from '@/types';

interface IncompleteProfileReminderBannerProps {
  profile: AlumniProfile;
  className?: string;
}

export function IncompleteProfileReminderBanner({ profile, className = '' }: IncompleteProfileReminderBannerProps) {
  const percentage = profile.completionPercentage ?? 50;
  const completedCount = profile.completedFieldsCount ?? Math.round((percentage / 100) * 12);
  const totalCount = profile.totalFieldsCount ?? 12;
  const missing = profile.missingFields || [];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-50/80 p-5 sm:p-6 shadow-md shadow-amber-500/5 ${className}`}
    >
      {/* Decorative background accents */}
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-tr from-yellow-300/20 to-amber-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header Badges & Title */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide bg-amber-500 text-white shadow-xs">
              <ShieldAlert size={13} className="animate-pulse" />
              STATUS DATA: BELUM LENGKAP
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-slate-800 text-amber-200 border border-slate-700 shadow-xs">
              <CheckCircle2 size={13} className="fill-slate-400 text-white" />
              Kategori: NEW ALUMNI (⚪ Centang Abu-abu)
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pengingat: Lengkapi Data Profil Alumni Anda</span>
            <Sparkles size={18} className="text-amber-500 flex-shrink-0" />
          </h3>

          <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed">
            Sesuai ketentuan Forsil 99, seluruh akun alumni baru yang datanya belum terisi 100% berstatus{' '}
            <strong className="text-slate-800 font-bold">⚪ New Alumni (Centang Abu-abu)</strong>.{' '}
            <span className="text-amber-900 font-semibold bg-amber-100/70 px-1 py-0.5 rounded">
              Anda tetap dapat menyimpan data sewaktu-waktu meskipun belum lengkap.
            </span>{' '}
            Setelah seluruh 12 data lengkap (100%), Anda bebas memilih kategori profil yang Anda inginkan:
            Open Alumni (👑 Crown Emas), Khusus Pengikut Saja (Connected Alumni) (🔷 Centang Biru), atau tetap Private Alumni (⚪ Centang Abu-abu).
          </p>
        </div>

        {/* Progress Bar & Missing Data */}
        <div className="bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-amber-200/80 shadow-xs space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <span>Kelengkapan Data Profil</span>
              <span className="text-slate-500 font-normal">
                ({completedCount} dari {totalCount} data terisi)
              </span>
            </span>
            <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {percentage}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-700 rounded-full shadow-xs"
              style={{ width: `${Math.min(Math.max(percentage, 8), 100)}%` }}
            />
          </div>

          {missing.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <AlertCircle size={12} className="text-amber-600 flex-shrink-0" />
                <span>Data yang belum dilengkapi ({missing.length} data):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((field, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50/80 hover:bg-amber-100/80 text-amber-950 border border-amber-300/80 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3 Categories Options Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Open Alumni */}
          <div className="p-3 bg-white/95 rounded-xl border border-amber-300 shadow-2xs hover:border-amber-400 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="p-1 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-900 shadow-2xs">
                <Crown size={14} className="fill-yellow-300 text-amber-900" />
              </span>
              <span className="text-xs font-bold text-slate-900">Open Alumni (👑)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Profil 100% lengkap & terbuka untuk semua alumni. Bebas atur akses buka permanen atau sementara.
            </p>
          </div>

          {/* Connected Alumni */}
          <div className="p-3 bg-white/95 rounded-xl border border-blue-200 shadow-2xs hover:border-blue-300 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="p-1 rounded-full bg-blue-50 text-blue-600">
                <BadgeCheck size={16} className="fill-blue-500 text-white" />
              </span>
              <span className="text-xs font-bold text-slate-900">Khusus Pengikut Saja (Connected Alumni) (🔷)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Profil 100% lengkap & detail kontak hanya dapat dilihat oleh alumni yang saling mengikuti (followers).
            </p>
          </div>

          {/* Private Alumni */}
          <div className="p-3 bg-white/95 rounded-xl border border-slate-300 shadow-2xs hover:border-slate-400 transition-all">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="p-1 rounded-full bg-slate-100 text-slate-600">
                <CheckCircle2 size={15} className="fill-slate-400 text-white" />
              </span>
              <span className="text-xs font-bold text-slate-900">Private Alumni (⚪)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Profil privat bagi alumni yang ingin menjaga kerahasiaan kontak dan rincian data pribadinya.
            </p>
          </div>
        </div>

        {/* Action Button & Note */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <Link
            href="/profile/edit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Lengkapi Data Sekarang</span>
            <ArrowRight size={16} />
          </Link>

          <span className="text-[11px] text-slate-600 italic text-center sm:text-right">
            💡 Simpan kapan saja — data yang belum lengkap tetap tersimpan dengan aman.
          </span>
        </div>
      </div>
    </div>
  );
}

// Backwards compatibility alias
export const SuperIntrovBanner = IncompleteProfileReminderBanner;
