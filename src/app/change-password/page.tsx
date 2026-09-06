'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { changePassword } from '@/services/authService';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

function ChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const securityToken = searchParams.get('token') || '';

  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!securityToken && !oldPassword) {
      toast.error('Kata sandi lama wajib diisi.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await changePassword({
        oldPassword: securityToken ? undefined : oldPassword,
        newPassword,
        confirmPassword,
        securityToken: securityToken || undefined,
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success('Kata sandi berhasil diperbarui! Semua sesi lama telah dicabut.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah kata sandi. Periksa data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

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
            <span>{securityToken ? 'Reset Keamanan Akun' : 'Ubah Kata Sandi'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {securityToken
              ? 'Tautan keamanan dari email terverifikasi. Masukkan kata sandi baru Anda.'
              : 'Perbarui kata sandi akun alumni Anda secara berkala untuk menjaga keamanan.'}
          </p>
        </div>

        {isSuccess ? (
          <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-card text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Kata Sandi Berhasil Diubah!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seluruh sesi login sebelumnya di semua browser telah dicabut demi keamanan. Mengalihkan Anda ke halaman masuk...
            </p>
            <AppButton
              variant="primary"
              size="lg"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Masuk Sekarang
            </AppButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
            {/* Old Password (Only if not using security token from email) */}
            {!securityToken && (
              <AppInput
                label="Kata Sandi Lama"
                type={showOldPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi lama akun"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                leftIcon={<Lock size={17} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showOldPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
                autoComplete="current-password"
                required
              />
            )}

            {/* New Password */}
            <AppInput
              label="Kata Sandi Baru"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={17} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
              autoComplete="new-password"
              required
            />

            {/* Confirm Password */}
            <div>
              <AppInput
                label="Konfirmasi Kata Sandi Baru"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock size={17} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
                autoComplete="new-password"
                required
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  * Konfirmasi kata sandi belum sesuai.
                </p>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Pengamanan Otomatis</span>
              </div>
              <p>Setelah diubah, seluruh sesi aktif di perangkat lain akan otomatis di-logout.</p>
            </div>

            <AppButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
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

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Memuat halaman...
      </div>
    }>
      <ChangePasswordContent />
    </Suspense>
  );
}
