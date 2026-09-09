'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AvengersHUD } from '@/components/countdown/AvengersHUD';
import { FlipCountdown } from '@/components/countdown/FlipCountdown';
import { WelcomePortal } from '@/components/countdown/WelcomePortal';
import { useReleaseDate } from '@/hooks/useReleaseDate';
import {
  RELEASE_CONFIG,
  hasSeenWelcome,
  resetWelcomeSeen,
} from '@/config/releaseConfig';
import { soundFx } from '@/utils/audioFx';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
} from 'lucide-react';

export default function CountdownPage() {
  const router = useRouter();

  // Ambil tanggal target rilis secara realtime dari Firebase RTDB (dengan fallback ke .env)
  const {
    targetDate,
    targetDateIso: rtdbDateIso,
    formattedLabel,
    isReleased: rtdbIsReleased,
    source,
    resetWelcomeCache,
  } = useReleaseDate();

  const effectiveDateIso = rtdbDateIso;
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Setiap kali tanggal rilis dari RTDB berubah:
  useEffect(() => {
    setMounted(true);
    const isPast = Date.now() >= targetDate.getTime();
    setIsCompleted(isPast);
  }, [rtdbDateIso, targetDate]);

  const handleCountdownComplete = () => {
    setIsCompleted(true);
  };

  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFx.setMuted(nextMuted);
    if (!nextMuted) {
      soundFx.playHudBeep();
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050814] text-slate-100 overflow-x-hidden flex flex-col justify-between selection:bg-sky-500/30 selection:text-sky-200">
      {/* 1. Futuristic Avengers & Arc Reactor HUD Background */}
      <AvengersHUD />

      {/* 2. Top Bar: Audio Toggle & Status */}
      <header className="relative z-20 w-full px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between">
        {/* S.H.I.E.L.D. / Avengers Status Badge & RTDB Sync Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-sky-500/30 text-[11px] sm:text-xs font-rajdhani font-bold text-sky-400 uppercase tracking-widest flex items-center gap-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>FORSIL-99 // T-MINUS COUNTDOWN</span>
          </div>

          {source === 'rtdb' && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[10px] font-rajdhani font-bold tracking-wider uppercase">
              <Radio size={12} className="animate-pulse" />
              <span>LIVE CLOUD RTDB SYNC</span>
            </div>
          )}
        </div>

        {/* Audio FX Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            title={isMuted ? 'Aktifkan Suara HUD' : 'Bisukan Suara HUD'}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 border border-sky-500/30 hover:border-sky-400 text-sky-400 text-xs font-rajdhani font-semibold tracking-wider flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 shadow-sm"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">{isMuted ? 'AUDIO: OFF' : 'AUDIO: ON'}</span>
          </button>
        </div>
      </header>

      {/* 3. Main Center Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        {isCompleted ? (
          /* ================= WELCOME SCREEN (Setelah Countdown Selesai) ================= */
          <WelcomePortal
            targetDateIso={effectiveDateIso}
            onProceedToLogin={() => router.push('/login')}
          />
        ) : (
          /* ================= COUNTDOWN SCREEN (Sebelum Rilis) ================= */
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
            {/* Logo Forsil99 & Header */}
            <div className="mb-6 sm:mb-8 flex flex-col items-center animate-fade-in">
              <div className="relative mb-3 group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-sky-400 rounded-2xl blur-sm opacity-50 group-hover:opacity-75 transition" />
                <div className="relative bg-[#0b1424] border border-sky-400/30 p-3 sm:p-3.5 rounded-xl shadow-xl">
                  <img
                    src="/images/forsil99apps.png"
                    alt="Forsil 99 Logo"
                    className="h-12 sm:h-14 w-auto object-contain"
                  />
                </div>
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2 uppercase font-rajdhani">
                <span>DATABASE ALUMNI ANGKATAN 99</span>
              </h1>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <Sparkles size={14} />
                <span>
                  Peluncuran Resmi: <strong>{formattedLabel}</strong>
                </span>
              </div>
            </div>

            {/* Flip Countdown 3D (Persis pada gambar acuan) */}
            <div className="my-2 sm:my-4 w-full">
              <FlipCountdown
                targetDate={effectiveDateIso}
                variant="forsil-blue"
                onComplete={handleCountdownComplete}
              />
            </div>

            {/* Slogan Forsil 99 */}
            <div className="mt-8 sm:mt-10 max-w-lg space-y-2 animate-fade-in">
              <p className="text-xs sm:text-sm text-slate-300/90 font-medium tracking-wide">
                &ldquo;Satu Angkatan, Solid, Nyata Terhubung&rdquo;
              </p>
              <p className="text-[11px] text-slate-400 font-rajdhani tracking-wider uppercase">
                Menghubungkan kembali kenangan, persahabatan, dan kolaborasi alumni SMA Negeri 59 Jakarta.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="relative z-20 w-full px-4 py-4 flex items-center justify-center text-[11px] text-slate-400 border-t border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2 font-rajdhani tracking-wider uppercase">
          <span>© 2026 FORSIL 99</span>
          <span>•</span>
          <span>SMAN 59 JAKARTA</span>
        </div>
      </footer>
    </div>
  );
}
