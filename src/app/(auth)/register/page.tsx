'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { fetchAlumniList, registerAlumniUser } from '@/services/authService';
import { executeRecaptchaV3, loadRecaptchaV3Script } from '@/utils/recaptcha';
import {
  User,
  Phone,
  Mail,
  Lock,
  Camera,
  ImageIcon,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  Loader2,
  ShieldCheck,
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
  
  // Referral Search State
  const [referralQuery, setReferralQuery] = useState<string>('');
  const [referralId, setReferralId] = useState<string>('');
  const [referralName, setReferralName] = useState<string>('');
  const [selectedReferral, setSelectedReferral] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const [selfieBase64, setSelfieBase64] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Preload reCAPTCHA v3
  useEffect(() => {
    loadRecaptchaV3Script();
  }, []);

  // Search referral when query length >= 3
  useEffect(() => {
    const q = referralQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchAlumniList(q);
        setSearchResults(data);
        setHasSearched(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [referralQuery]);

  const handleSelectReferral = (alumni: any) => {
    setReferralId(alumni.accountId);
    setReferralName(alumni.fullName);
    setSelectedReferral(alumni);
    setReferralQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleClearReferral = () => {
    setReferralId('');
    setReferralName('');
    setSelectedReferral(null);
    setReferralQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawData = event.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawData);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        };
        img.onerror = () => resolve(rawData);
        img.src = rawData;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImageFile(file);
      if (compressedBase64) {
        setSelfieBase64(compressedBase64);
        toast.success('Foto berhasil dimuat!');
      }
    } catch {
      toast.error('Gagal memuat foto.');
    }
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
      toast.error('Rekan alumni referral (teman seangkatan) wajib dicari dan dipilih.');
      return;
    }
    if (!selfieBase64) {
      toast.error('Foto selfie verifikasi wajah wajib diunggah.');
      return;
    }

    setIsLoading(true);
    try {
      // Execute reCAPTCHA v3 in background
      const recaptchaToken = await executeRecaptchaV3('register');

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
        recaptchaToken: recaptchaToken || undefined,
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

          {/* Referral Selection (Wajib: Cari Rekan Seangkatan Min 3 Huruf) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">
              Pilih Rekan Alumni Sebagai Referensi Verifikasi: <span className="text-rose-500 font-bold">* (Wajib)</span>
            </label>

            {selectedReferral ? (
              /* Selected Referral Card */
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-emerald-300 flex items-center justify-center overflow-hidden flex-shrink-0 text-emerald-700 font-bold text-xs">
                    {selectedReferral.profilePhotoUrl ? (
                      <img
                        src={selectedReferral.profilePhotoUrl}
                        alt={selectedReferral.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{selectedReferral.fullName?.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{selectedReferral.fullName}</span>
                      <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {selectedReferral.className || 'Alumni 99'} • Referral Terpilih
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearReferral}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Ganti Rekan
                </button>
              </div>
            ) : (
              /* Search Input Combobox */
              <div className="space-y-1.5 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={referralQuery}
                    onChange={(e) => setReferralQuery(e.target.value)}
                    placeholder="Ketik minimal 3 huruf nama rekan seangkatan '99..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 py-2.5 text-xs text-slate-900 focus:border-brand-primary focus:outline-none placeholder:text-slate-400"
                  />
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  {isSearching && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary animate-spin" />
                  )}
                  {referralQuery && !isSearching && (
                    <button
                      type="button"
                      onClick={() => setReferralQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Search Hint when < 3 characters */}
                {referralQuery.trim().length > 0 && referralQuery.trim().length < 3 && (
                  <p className="text-[11px] text-amber-600 italic px-1">
                    ✍️ Masukkan minimal 3 huruf untuk mencari teman seangkatan (misal: "Stev", "Budi", "Rina").
                  </p>
                )}

                {/* Dropdown Results */}
                {referralQuery.trim().length >= 3 && !isSearching && (
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg divide-y divide-slate-100 z-30">
                    {searchResults.length > 0 ? (
                      searchResults.map((a) => (
                        <button
                          key={a.accountId}
                          type="button"
                          onClick={() => handleSelectReferral(a)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/80 active:bg-blue-100 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-600">
                              {a.profilePhotoUrl ? (
                                <img src={a.profilePhotoUrl} alt={a.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{a.fullName?.substring(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                                {a.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {a.className || 'Alumni 1999'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-brand-primary bg-blue-50 group-hover:bg-brand-primary group-hover:text-white px-2 py-1 rounded-md transition-all">
                            Pilih Rekan
                          </span>
                        </button>
                      ))
                    ) : hasSearched ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        Tidak ditemukan alumni dengan nama "<strong>{referralQuery}</strong>". Pastikan ejaan nama teman seangkatan Anda benar.
                      </div>
                    ) : null}
                  </div>
                )}

                <p className="text-[11px] text-slate-400">
                  Rekan alumni terpilih akan menerima notifikasi email untuk memvalidasi keanggotaan Anda.
                </p>
              </div>
            )}
          </div>

          {/* Selfie Photo Upload (Wajib: Galeri / Kamera / Drive) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Foto Selfie Wajah / Profil: <span className="text-rose-500 font-bold">* (Wajib)</span>
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Option 1: Galeri / File HP / Google Drive */}
              <label className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition-all border border-slate-200 shadow-2xs">
                <ImageIcon size={16} className="text-brand-primary" />
                <span>Buka Galeri Foto / File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieUpload}
                  className="hidden"
                />
              </label>

              {/* Option 2: Kamera Langsung */}
              <label className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition-all border border-slate-200 shadow-2xs">
                <Camera size={16} className="text-amber-600" />
                <span>Ambil Kamera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieUpload}
                  className="hidden"
                />
              </label>

              {selfieBase64 ? (
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs">
                    <img src={selfieBase64} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Foto Siap
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-rose-500 italic ml-auto">Belum ada foto</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 Pilih <strong>Buka Galeri Foto</strong> untuk memilih foto dari galeri HP / Google Photos / Google Drive, atau <strong>Ambil Kamera</strong> untuk foto langsung.
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-1">
            <ShieldCheck size={14} className="text-brand-primary" />
            <span>Dilindungi oleh Google reCAPTCHA v3</span>
          </div>

          <AppButton
            type="submit"
            variant="gold"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
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
