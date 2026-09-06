/**
 * Konfigurasi Rilis Forsil99 & Countdown
 * Target: 09 September 2026 (Waktu rilis default: 09:19 WIB)
 */

export interface ReleaseConfig {
  /** Target waktu rilis ISO format */
  targetDate: string;
  /** Label rilis untuk ditampilkan di UI */
  releaseLabel: string;
  /** Waktu rilis yang diformat ramah pengguna */
  formattedDateText: string;
  /** Apakah fitur countdown & gatekeeper aktif */
  isCountdownEnabled: boolean;
  /** Mengizinkan mode simulasi/bypass untuk testing pengembang */
  allowDevPreview: boolean;
}

// Target rilis dari .env (default: 09 September 2026 pukul 09:19 WIB)
const DEFAULT_TARGET_DATE = process.env.NEXT_PUBLIC_RELEASE_DATE || '2026-09-09T09:19:00+07:00';
const DEFAULT_RELEASE_LABEL = process.env.NEXT_PUBLIC_RELEASE_LABEL || '09 September • 09:19 WIB';

export const RELEASE_CONFIG: ReleaseConfig = {
  targetDate: DEFAULT_TARGET_DATE,
  releaseLabel: 'FORSIL 99 // INITIATIVE 1999',
  formattedDateText: DEFAULT_RELEASE_LABEL,
  // Jika process.env.NEXT_PUBLIC_ENABLE_COUNTDOWN bernilai 'false', countdown dinonaktifkan
  isCountdownEnabled: process.env.NEXT_PUBLIC_ENABLE_COUNTDOWN !== 'false',
  allowDevPreview: true,
};

export interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
  isCompleted: boolean;
}

/**
 * Menghitung selisih waktu dari sekarang ke targetDate
 */
export function getRemainingTime(targetDateIso = RELEASE_CONFIG.targetDate): RemainingTime {
  const now = new Date().getTime();
  const target = new Date(targetDateIso).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
      isCompleted: true,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds: diff,
    isCompleted: false,
  };
}

/**
 * Memeriksa apakah waktu rilis sudah lewat
 */
export function isReleased(targetDateIso = RELEASE_CONFIG.targetDate): boolean {
  if (!RELEASE_CONFIG.isCountdownEnabled) return true;
  return new Date().getTime() >= new Date(targetDateIso).getTime();
}

/**
 * Mengecek apakah alumni sudah pernah melihat halaman selamat datang untuk tanggal rilis tertentu
 */
export function hasSeenWelcome(targetDateIso?: string): boolean {
  if (typeof window === 'undefined') return false;
  const seen = localStorage.getItem('forsil99_welcome_seen') === 'true';
  if (!seen) return false;

  if (targetDateIso) {
    const seenFor = localStorage.getItem('forsil99_welcome_seen_for');
    if (seenFor && seenFor !== targetDateIso) {
      // Jika tanggal rilis dirubah (misal diundur atau dites ulang), reset status
      return false;
    }
  }
  return true;
}

/**
 * Menandai alumni sudah melihat halaman selamat datang untuk tanggal rilis ini
 */
export function markWelcomeSeen(targetDateIso?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('forsil99_welcome_seen', 'true');
  if (targetDateIso) {
    localStorage.setItem('forsil99_welcome_seen_for', targetDateIso);
  }
}

/**
 * Mereset status welcome untuk keperluan testing
 */
export function resetWelcomeSeen(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('forsil99_welcome_seen');
  localStorage.removeItem('forsil99_welcome_seen_for');
}
