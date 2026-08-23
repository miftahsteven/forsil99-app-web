'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { Lock, Smartphone, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const res = await login(identifier, password);
      if (res.success) {
        toast.success(`Selamat datang kembali, ${res.profile?.fullName || 'Alumni'}!`);
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Nomor HP/Email atau kata sandi tidak cocok.');
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
            Rumah Digital Alumni SMAN 59 Jakarta (Angkatan ’99)
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mt-2">
            <Sparkles size={12} />
            <span>Khusus Angkatan 1999 </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
          <AppInput
            label="Nomor WhatsApp / Email"
            placeholder="Contoh: 08123456789 atau email@domain.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<Smartphone size={17} />}
            autoComplete="username"
            required
          />

          <AppInput
            label="Kata Sandi"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan kata sandi akun"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={17} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
            autoComplete="current-password"
            required
          />

          <AppButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Masuk ke Forsil99
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
