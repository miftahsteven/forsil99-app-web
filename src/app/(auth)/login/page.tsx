'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { executeRecaptchaV3, loadRecaptchaV3Script } from '@/utils/recaptcha';
import { Lock, Smartphone, Eye, EyeOff, Sparkles, ShieldCheck, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useReleaseDate } from '@/hooks/useReleaseDate';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { isReleased, isCountdownEnabled, isLoading: releaseLoading } = useReleaseDate();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});

  // Silent zero-permission client IP geolocation with optional high-precision GPS upgrade
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // 1. Silent client-side IP geolocation (zero permission required)
    fetch('https://ipwhois.app/json/', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setCoords((prev) => {
            // Keep GPS if already set
            if (prev.latitude !== undefined && prev.longitude !== undefined) return prev;
            return {
              latitude: data.latitude,
              longitude: data.longitude,
            };
          });
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeoutId));

    // 2. High-precision GPS if allowed by user / browser
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (isMounted) {
            setCoords({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        },
        () => {
          // Graceful fallback to client IP coordinates
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Restore lockout countdown if page is refreshed while locked
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUntil = sessionStorage.getItem('ruang59_login_lockout_until');
    if (storedUntil) {
      const remaining = Math.ceil((parseInt(storedUntil, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutSeconds(remaining);
      } else {
        sessionStorage.removeItem('ruang59_login_lockout_until');
      }
    }
  }, []);

  // Tick down lockout timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem('ruang59_login_lockout_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Guard: Jika belum rilis dan countdown aktif, langsung lempar ke /countdown
  useEffect(() => {
    if (!releaseLoading && isCountdownEnabled && !isReleased) {
      router.replace('/countdown');
    }
  }, [isReleased, isCountdownEnabled, releaseLoading, router]);

  // Preload reCAPTCHA v3 script
  useEffect(() => {
    loadRecaptchaV3Script();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) {
      toast.error(`Akun sedang terkunci sementara. Harap tunggu ${lockoutSeconds} detik.`);
      return;
    }
    if (!identifier.trim()) {
      toast.error('Nomor HP atau Email wajib diisi.');
      return;
    }
    if (!password) {
      toast.error('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // Execute reCAPTCHA v3 in background
      const recaptchaToken = await executeRecaptchaV3('login');

      const res = await login(identifier, password, recaptchaToken || undefined, coords);
      if (res.success) {
        sessionStorage.removeItem('ruang59_login_lockout_until');
        toast.success(`Selamat datang kembali, ${res.profile?.fullName || 'Alumni'}!`);
        router.push('/');
      }
    } catch (err: any) {
      if (err.isLocked || err.data?.isLocked || err.status === 429) {
        const retrySec = err.retryAfterSeconds || err.data?.retryAfterSeconds || 60;
        setLockoutSeconds(retrySec);
        sessionStorage.setItem('ruang59_login_lockout_until', (Date.now() + retrySec * 1000).toString());
        toast.error(`Percobaan salah 3x. Akun Anda dikunci sementara selama ${retrySec} detik.`);
      } else {
        toast.error(err.message || 'Nomor HP/Email atau kata sandi tidak cocok.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-5 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
        {/* Logo & Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img
              src="/images/forsil99apps.png"
              alt="Forsil 99 Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <p className="text-xs text-slate-500 font-medium mt-1">
            Database Alumni SMAN 59 Jakarta (Angkatan ’99)
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mt-2">
            <Sparkles size={12} />
            <span>Khusus Angkatan 1999 </span>
          </div>
        </div>

        {/* Lockout Countdown Alert Card */}
        {lockoutSeconds > 0 && (
          <div className="mb-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 text-center shadow-sm animate-pulse">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm mb-1">
              <Timer className="animate-spin text-amber-600" size={18} />
              <span>Login Terkunci Sementara</span>
            </div>
            <p className="text-xs text-amber-700 mb-2.5">
              Anda telah 3x salah memasukkan kata sandi. Silakan tunggu sebelum mencoba kembali:
            </p>
            <div className="inline-flex items-center justify-center bg-amber-600 text-white font-mono font-bold text-2xl px-5 py-1.5 rounded-xl shadow-md tracking-widest">
              00:{lockoutSeconds < 10 ? `0${lockoutSeconds}` : lockoutSeconds}
            </div>
            <p className="text-[11px] text-amber-600/90 mt-2">
              Tombol masuk dinonaktifkan hingga waktu habis.
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
          <AppInput
            label="Nomor WhatsApp / Email"
            placeholder="Contoh: 08123456789 atau email@domain.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<Smartphone size={17} />}
            autoComplete="username"
            disabled={lockoutSeconds > 0}
            required
          />

          <div>
            <AppInput
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi akun"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={17} />}
              disabled={lockoutSeconds > 0}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  disabled={lockoutSeconds > 0}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
              autoComplete="current-password"
              required
            />
            <div className="flex justify-end mt-1.5">
              <Link
                href="/change-password"
                className="text-[11px] text-brand-primary hover:underline font-semibold"
              >
                Lupa atau Ingin Ganti Kata Sandi?
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-1">
            <ShieldCheck size={14} className="text-brand-primary" />
            <span>Dilindungi oleh Google reCAPTCHA v3</span>
          </div>

          <AppButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={lockoutSeconds > 0}
            className="w-full mt-2"
          >
            {lockoutSeconds > 0 ? `Tunggu ${lockoutSeconds} Detik...` : 'Masuk ke Forsil99'}
          </AppButton>
        </form>

        {/* Register CTA */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-600">
            Belum memiliki akun alumni terdaftar?{' '}
            <Link
              href="/register"
              className="text-brand-primary font-bold hover:underline block sm:inline mt-1"
            >
              Registrasi Alumni Baru
            </Link>
          </p>
        </div>
      </div>

      {/* Footer info */}
      <footer className="text-center text-[10px] text-slate-400 pt-6">
        © 2026 FORSIL 99 SMAN 59 Jakarta. Satu Sekolah. Semua Angkatan. Tetap Terhubung.
      </footer>
    </div>
  );
}
