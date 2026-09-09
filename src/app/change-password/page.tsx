'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { changePassword, requestPasswordReset } from '@/services/authService';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Mail,
  MailCheck,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const securityToken = searchParams.get('token') || '';

  // Mode 1: Request Reset Link (No token in URL)
  const [resetEmail, setResetEmail] = useState<string>('');
  const [isResetRequested, setIsResetRequested] = useState<boolean>(false);
  const [isRequestingReset, setIsRequestingReset] = useState<boolean>(false);

  // Mode 2: Reset Password Form (Token in URL)
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSubmittingNewPassword, setIsSubmittingNewPassword] = useState<boolean>(false);
  const [isPasswordResetSuccess, setIsPasswordResetSuccess] = useState<boolean>(false);

  // Password Strength Evaluation
  const passwordStrength = useMemo(() => {
    if (!newPassword) {
      return {
        score: 0,
        label: 'Belum diisi',
        color: 'bg-slate-200',
        textColor: 'text-slate-400',
        hasMinLength: false,
        hasUpperLower: false,
        hasNumber: false,
        hasSpecial: false,
      };
    }

    const hasMinLength = newPassword.length >= 8;
    const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (hasMinLength) score += 1;
    if (hasUpperLower) score += 1;
    if (hasNumber && hasSpecial) score += 1;

    let label = 'Sangat Lemah';
    let color = 'bg-rose-500';
    let textColor = 'text-rose-600';

    if (score === 2) {
      label = 'Cukup / Sedang';
      color = 'bg-amber-500';
      textColor = 'text-amber-600';
    } else if (score === 3) {
      label = 'Kuat';
      color = 'bg-blue-500';
      textColor = 'text-blue-600';
    } else if (score >= 4) {
      label = 'Sangat Kuat';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-600';
    }

    return {
      score,
      label,
      color,
      textColor,
      hasMinLength,
      hasUpperLower,
      hasNumber,
      hasSpecial,
    };
  }, [newPassword]);

  // Handle Request Password Reset Email (Flow 1)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }

    setIsRequestingReset(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      if (res.success) {
        setIsResetRequested(true);
        toast.success('Tautan reset kata sandi telah dikirim ke email Anda!');
      } else {
        toast.error(res.message || 'Gagal mengirim tautan. Silakan coba beberapa saat lagi.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  // Handle Save New Password (Flow 2)
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSubmittingNewPassword(true);
    try {
      const res = await changePassword({
        newPassword,
        confirmPassword,
        securityToken,
      });

      if (res.success) {
        setIsPasswordResetSuccess(true);
        toast.success('Kata sandi berhasil diperbarui! Mengalihkan ke halaman masuk...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengatur ulang kata sandi. Tautan mungkin telah kedaluwarsa.');
    } finally {
      setIsSubmittingNewPassword(false);
    }
  };

  // ----------------------------------------------------
  // SCENARIO A: User has clicked email link with token (?token=...)
  // ----------------------------------------------------
  if (securityToken) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-5 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <Link href="/login" className="inline-block mb-3">
              <img
                src="/images/forsil99apps.png"
                alt="Forsil 99 Logo"
                className="h-14 w-auto object-contain mx-auto"
              />
            </Link>
            <h1 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <KeyRound size={20} className="text-brand-primary" />
              <span>Buat Kata Sandi Baru</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tautan verifikasi email valid. Silakan buat kata sandi baru untuk akun alumni Forsil 99 Anda.
            </p>
          </div>

          {isPasswordResetSuccess ? (
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-card text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Kata Sandi Berhasil Diperbarui!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kata sandi baru Anda telah aktif. Sistem telah mengirimkan email konfirmasi dan mencabut seluruh sesi login di perangkat lain demi keamanan.
              </p>
              <div className="pt-2">
                <AppButton
                  variant="primary"
                  size="lg"
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Masuk Sekarang
                </AppButton>
              </div>
              <p className="text-[11px] text-slate-400">
                Otomatis dialihkan ke halaman login dalam beberapa detik...
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSaveNewPassword}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4.5"
            >
              {/* Input Kata Sandi Baru */}
              <div className="space-y-1.5">
                <AppInput
                  label="Kata Sandi Baru"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock size={17} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition"
                      tabIndex={-1}
                      title={showNewPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }
                  autoComplete="new-password"
                  required
                />

                {/* Level Strong Password Indicator */}
                {newPassword.length > 0 && (
                  <div className="pt-2 pb-1 space-y-2">
                    {/* Visual Progress Bars */}
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Kekuatan Kata Sandi:</span>
                      <span className={`font-bold ${passwordStrength.textColor}`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                      {[1, 2, 3, 4].map((barIndex) => (
                        <div
                          key={barIndex}
                          className={`h-full rounded-full transition-all duration-300 ${
                            barIndex <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Criteria Checklist */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[10.5px]">
                      <div className="flex items-center gap-1.5">
                        {newPassword.length >= 6 ? (
                          <Check size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <X size={12} className="text-slate-300 shrink-0" />
                        )}
                        <span className={newPassword.length >= 6 ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                          Min. 6 karakter
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {passwordStrength.hasUpperLower ? (
                          <Check size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <X size={12} className="text-slate-300 shrink-0" />
                        )}
                        <span className={passwordStrength.hasUpperLower ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                          Huruf besar & kecil
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {passwordStrength.hasNumber ? (
                          <Check size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <X size={12} className="text-slate-300 shrink-0" />
                        )}
                        <span className={passwordStrength.hasNumber ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                          Mengandung angka
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {passwordStrength.hasSpecial ? (
                          <Check size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <X size={12} className="text-slate-300 shrink-0" />
                        )}
                        <span className={passwordStrength.hasSpecial ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                          Simbol khusus
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Konfirmasi Kata Sandi */}
              <div className="space-y-1">
                <AppInput
                  label="Konfirmasi Kata Sandi Baru"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Ketik ulang kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock size={17} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none transition"
                      tabIndex={-1}
                      title={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  }
                  autoComplete="new-password"
                  required
                />

                {confirmPassword && (
                  <div className="pt-0.5">
                    {newPassword === confirmPassword ? (
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <Check size={13} />
                        <span>Kata sandi cocok.</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle size={13} />
                        <span>Konfirmasi kata sandi belum sama.</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Security info note */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Pengamanan Otomatis</span>
                </div>
                <p className="leading-relaxed">
                  Setelah disimpan, sistem akan mengirim email konfirmasi di latar belakang dan mencabut seluruh sesi login di perangkat lain.
                </p>
              </div>

              <AppButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmittingNewPassword}
                disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full mt-2 shadow-button"
              >
                Simpan Kata Sandi Baru
              </AppButton>
            </form>
          )}

          {/* Back Link */}
          <div className="text-center mt-5">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>

        <footer className="text-center text-[10px] text-slate-400 pt-6">
          © 2026 FORSIL 99 SMAN 59 Jakarta. Sistem Keamanan Akun Terpadu.
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCENARIO B: User requests password reset via Email (No token)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col justify-between p-5 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block mb-3">
            <img
              src="/images/forsil99apps.png"
              alt="Forsil 99 Logo"
              className="h-14 w-auto object-contain mx-auto"
            />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <KeyRound size={20} className="text-brand-primary" />
            <span>Lupa Kata Sandi?</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Masukkan email yang digunakan untuk login di Forsil 99. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
          </p>
        </div>

        {isResetRequested ? (
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-card text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-blue-50 text-brand-primary rounded-full flex items-center justify-center mx-auto shadow-sm">
              <MailCheck size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Tautan Berhasil Dikirim!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kami telah mengirimkan tautan perubahan kata sandi ke:
              </p>
              <div className="inline-block bg-slate-100 text-slate-800 font-semibold px-3 py-1 rounded-full text-xs break-all mt-1">
                {resetEmail}
              </div>
            </div>

            {/* Explanation box matching user instruction */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-left text-xs text-slate-600 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11.5px] leading-relaxed">
                  <p className="font-semibold text-slate-800">Petunjuk Keamanan:</p>
                  <p>
                    Silakan periksa kotak masuk (Inbox) atau folder Spam. Jika memang Anda yang meminta, klik tautan di email untuk mengubah kata sandi.
                  </p>
                  <p className="text-slate-500">
                    Namun jika Anda tidak merasa mengirimkan permintaan ini, email tersebut dapat <strong>diabaikan dengan aman</strong>. Kata sandi Anda tidak akan berubah.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <AppButton
                variant="outline"
                size="md"
                onClick={() => setIsResetRequested(false)}
                className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <RefreshCw size={13} className="mr-1.5" />
                Kirim Ulang ke Email Lain
              </AppButton>

              <AppButton
                variant="primary"
                size="lg"
                onClick={() => router.push('/login')}
                className="w-full shadow-button"
              >
                Kembali ke Halaman Masuk
              </AppButton>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleRequestReset}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4"
          >
            <AppInput
              label="Alamat Email Akun Forsil 99"
              type="email"
              placeholder="contoh: alumni@gmail.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              leftIcon={<Mail size={17} />}
              autoComplete="email"
              autoFocus
              required
              helperText="Pastikan email ini aktif dan terdaftar pada sistem Forsil 99."
            />

            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck size={14} className="text-brand-primary shrink-0" />
                <span>Verifikasi Tautan Aman</span>
              </div>
              <p className="text-blue-700/90 leading-relaxed">
                Tautan yang dikirimkan berlaku selama <strong>1 jam</strong> dan hanya dapat digunakan satu kali untuk keamanan akun Anda.
              </p>
            </div>

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isRequestingReset}
              className="w-full mt-2 shadow-button"
            >
              Kirim Tautan Reset Password
            </AppButton>
          </form>
        )}

        {/* Back Link */}
        <div className="text-center mt-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
        </div>
      </div>

      <footer className="text-center text-[10px] text-slate-400 pt-6">
        © 2026 FORSIL 99 SMAN 59 Jakarta. Sistem Keamanan Akun Terpadu.
      </footer>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
          Memuat halaman keamanan...
        </div>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}
