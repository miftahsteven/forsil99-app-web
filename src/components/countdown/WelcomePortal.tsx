'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { markWelcomeSeen } from '@/config/releaseConfig';
import { soundFx } from '@/utils/audioFx';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CelebrationFx } from './CelebrationFx';

interface WelcomePortalProps {
  onProceedToLogin?: () => void;
  targetDateIso?: string;
}

export const WelcomePortal: React.FC<WelcomePortalProps> = ({ onProceedToLogin, targetDateIso }) => {
  const router = useRouter();
  // Waktu baca 15 detik sesuai permintaan
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(15);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Efek audio sambutan perayaan
    soundFx.playReleaseFanfare();

    const interval = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleProceed();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleProceed = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    soundFx.playHudBeep();
    markWelcomeSeen(targetDateIso);

    if (onProceedToLogin) {
      onProceedToLogin();
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in">
      {/* Animasi Sekali (One-Moment): Pita Berterbangan, Kembang Api & Terompet */}
      <CelebrationFx />

      {/* Glow Aura Lembut di Belakang Konten */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] bg-gradient-to-r from-sky-500/15 via-blue-600/20 to-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Badge Perayaan Simple */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-rajdhani font-bold tracking-[0.2em] uppercase mb-6 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
        <Sparkles size={15} className="text-amber-400 animate-pulse" />
        <span>GERBANG RESMI TELAH DIBUKA</span>
      </div>

      {/* Logo Forsil 99 dengan Border Bersih */}
      <div className="relative mb-6 group">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-sky-400 rounded-2xl blur-sm opacity-50 transition" />
        <div className="relative bg-[#070e1c] border border-sky-400/30 p-4 sm:p-5 rounded-2xl shadow-xl">
          <img
            src="/images/forsil99apps.png"
            alt="Forsil 99 Logo"
            className="h-16 sm:h-20 w-auto object-contain mx-auto"
          />
        </div>
      </div>

      {/* Judul Sambutan Simple & Jelas */}
      <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 font-rajdhani">
        Selamat Datang Alumni{' '}
        <span className="bg-gradient-to-r from-sky-400 via-blue-300 to-amber-300 bg-clip-text text-transparent">
          SMAN 59 Jakarta!
        </span>
      </h1>

      {/* Tagline Pill Forsil99 */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-950/60 border border-sky-500/30 text-sky-300 text-xs font-rajdhani font-semibold tracking-wider uppercase mb-8">
        <span>Satu Angkatan, Solid, Nyata Terhubung</span>
      </div>

      {/* Tombol Utama & Progress Bar 15 Detik */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleProceed}
          disabled={isRedirecting}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-rajdhani font-bold text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(56,189,248,0.35)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] transition-all transform active:scale-95 disabled:opacity-75"
        >
          <span>{isRedirecting ? 'Membuka Halaman Login...' : 'Masuk ke Halaman Login'}</span>
          <ArrowRight size={18} />
        </button>

        {/* Progress Bar 15 Detik */}
        <div className="flex flex-col items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 pt-1">
          <span>
            Mengalihkan otomatis dalam{' '}
            <strong className="text-sky-300 font-mono text-sm">{autoRedirectSeconds}</strong> detik...
          </span>
          <div className="w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all duration-1000 ease-linear"
              style={{ width: `${((15 - autoRedirectSeconds) / 15) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
