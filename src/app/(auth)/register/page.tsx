'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { fetchAlumniList, registerAlumniUser, submitAlumniRegistration } from '@/services/authService';
import {
  User,
  Phone,
  Mail,
  Lock,
  Camera,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const CLASSES = [
  '3 IPA 1',
  '3 IPA 2',
  '3 IPA 3',
  '3 IPS 1',
  '3 IPS 2',
  '3 IPS 3',
  '3 IPS 4',
  '3 Bahasa',
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [className, setClassName] = useState<string>('3 IPA 1');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [referralId, setReferralId] = useState<string>('');
  const [referralName, setReferralName] = useState<string>('');
  const [selfieBase64, setSelfieBase64] = useState<string>('');
  
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchAlumniList().then((data) => {
      setAlumniList(data);
    });
  }, []);

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelfieBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReferralChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setReferralId(id);
    const found = alumniList.find((a) => a.accountId === id);
    if (found) setReferralName(found.fullName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Nama lengkap wajib diisi.');
      return;
    }
    if (!className) {
      toast.error('Kelas saat lulus wajib dipilih.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter.');
      return;
    }
    if (!referralId) {
      toast.error('Rekan alumni referral (teman seangkatan) wajib dipilih.');
      return;
    }
    if (!selfieBase64) {
      toast.error('Foto selfie verifikasi wajah wajib diunggah.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Direct register to create account (pending review & referral email dispatch)
      await registerAlumniUser({
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        className,
        phone: phone.trim(),
        email: email.trim() || undefined,
        password,
        graduationYear: 1999,
        referralAccountId: referralId,
        referralName: referralName || 'Rekan Alumni',
        selfieBase64,
      });

      toast.success('Pendaftaran alumni terkirim! Menunggu konfirmasi referral via email.');
      router.push('/awaiting-approval');
    } catch (err: any) {
      toast.error(err.message || 'Pendaftaran gagal. Silakan periksa data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block mb-3">
            <img
              src="/images/forsil99apps.png"
              alt="Forsil99"
              className="h-14 w-auto object-contain mx-auto"
            />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Registrasi Alumni Baru</h1>
          <p className="text-xs text-slate-500 mt-1">
            Khusus Alumni SMAN 59 Jakarta Angkatan 1999 (Perak)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
          <AppInput
            label="Nama Lengkap Sesuai Ijazah / Buku Kenangan"
            placeholder="Contoh: Steven Rahardjo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User size={16} />}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <AppInput
              label="Nama Panggilan"
              placeholder="Contoh: Steve"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700">
                Kelas Terakhir (1999)
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-primary focus:outline-none"
              >
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <AppInput
            label="Nomor WhatsApp Aktif"
            placeholder="Contoh: 081298765432"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone size={16} />}
            required
          />

          <AppInput
            label="Alamat Email (Opsional)"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={16} />}
          />

          <AppInput
            label="Kata Sandi Baru"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={16} />}
            required
          />

          {/* Referral Selection (Wajib) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Pilih Rekan Alumni Sebagai Referensi Verifikasi: <span className="text-rose-500 font-bold">* (Wajib)</span>
            </label>
            <select
              value={referralId}
              onChange={handleReferralChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 focus:border-brand-primary focus:outline-none"
            >
              <option value="">-- Pilih Rekan Teman Angkatan '99 --</option>
              {alumniList.map((a) => (
                <option key={a.accountId} value={a.accountId}>
                  {a.fullName} ({a.className || 'Alumni 99'})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Rekan alumni terpilih akan menerima notifikasi email untuk memvalidasi keanggotaan Anda.
            </p>
          </div>

          {/* Selfie Photo Upload (Wajib) */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Foto Selfie Wajah / Profil: <span className="text-rose-500 font-bold">* (Wajib)</span>
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                <Camera size={16} className="text-brand-primary" />
                <span>Pilih Foto Selfie</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieUpload}
                  className="hidden"
                />
              </label>
              {selfieBase64 ? (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs">
                    <img src={selfieBase64} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Foto siap
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-rose-500 italic">Belum ada foto</span>
              )}
            </div>
          </div>

          <AppButton
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-4"
          >
            Kirim Pendaftaran Alumni
          </AppButton>
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-xs text-slate-600 hover:text-brand-primary font-semibold">
            Sudah punya akun? Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
