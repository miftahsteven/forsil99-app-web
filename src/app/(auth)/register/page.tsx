'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { fetchAlumniList, registerAlumniUser } from '@/services/authService';
import { getAccessToken } from '@/services/apiClient';
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
  RotateCcw,
  Timer,
  ArrowLeft,
  MailCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReleaseDate } from '@/hooks/useReleaseDate';
import { WalkthroughTrigger } from '@/components/walkthrough/WalkthroughTrigger';
import { REGISTER_WALKTHROUGH } from '@/config/walkthroughData';
import { PrivacyPolicyModal } from '@/components/legal/PrivacyPolicyModal';

const CLASSES = [
  '3 IPA 1',
  '3 IPA 2',
  '3 IPS 1',
  '3 IPS 2',
  '3 IPS 3',
  '3 IPS 4',
  '3 Bahasa',
];

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isReleased, isCountdownEnabled, isLoading: releaseLoading } = useReleaseDate();

  // Guard 1: Jika belum rilis dan countdown aktif, blokir akses register dan alihkan ke /countdown
  useEffect(() => {
    if (!releaseLoading && isCountdownEnabled && !isReleased) {
      router.replace('/countdown');
    }
  }, [isReleased, isCountdownEnabled, releaseLoading, router]);

  // Guard 2: Jika user SUDAH login, jangan biarkan mengakses halaman register (redirect langsung ke /)
  useEffect(() => {
    if (!authLoading && (isAuthenticated || Boolean(getAccessToken()))) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Guard 3: Tangani Back/Forward cache browser (bfcache) jika user menekan Back button dari halaman utama
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted || Boolean(getAccessToken())) {
        router.replace('/');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router]);

  const [fullName, setFullName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [className, setClassName] = useState<string>('3 IPA 1');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
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

  // OTP Verification Step State
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  // Restore OTP cooldown timer if page refreshed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUntil = sessionStorage.getItem('ruang59_otp_cooldown_until');
    if (storedUntil) {
      const remaining = Math.ceil((parseInt(storedUntil, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setOtpCooldown(remaining);
      } else {
        sessionStorage.removeItem('ruang59_otp_cooldown_until');
      }
    }
  }, []);

  // Tick down OTP cooldown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem('ruang59_otp_cooldown_until');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

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

  // Step 1 Submit: Validate and Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
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
    if (!email.trim() || !email.includes('@')) {
      toast.error('Alamat email aktif wajib diisi untuk verifikasi OTP.');
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

    setIsSendingOtp(true);
    try {
      const recaptchaToken = await executeRecaptchaV3('register_otp');
      const { sendRegistrationOtp } = await import('@/services/authService');
      const res = await sendRegistrationOtp(email.trim(), fullName.trim(), recaptchaToken || undefined);

      if (res.success) {
        setStep('otp');
        setOtpCooldown(60);
        sessionStorage.setItem('ruang59_otp_cooldown_until', (Date.now() + 60 * 1000).toString());
        toast.success(`Kode OTP telah dikirimkan ke ${email.trim()}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirimkan kode OTP ke email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP handler with 1-minute cooldown
  const handleResendOtp = async () => {
    if (otpCooldown > 0) {
      toast.error(`Harap tunggu ${otpCooldown} detik sebelum meminta kirim ulang OTP.`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const recaptchaToken = await executeRecaptchaV3('register_otp');
      const { sendRegistrationOtp } = await import('@/services/authService');
      const res = await sendRegistrationOtp(email.trim(), fullName.trim(), recaptchaToken || undefined);

      if (res.success) {
        setOtpCooldown(60);
        sessionStorage.setItem('ruang59_otp_cooldown_until', (Date.now() + 60 * 1000).toString());
        toast.success(`Kode OTP baru telah dikirimkan ke ${email.trim()}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirimkan ulang kode OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2 Submit: Verify OTP and Register Account
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      toast.error('Masukkan 6 digit kode OTP yang diterima di email.');
      return;
    }

    setIsLoading(true);
    try {
      const recaptchaToken = await executeRecaptchaV3('register');
      const { verifyRegistrationOtpAndRegister } = await import('@/services/authService');

      await verifyRegistrationOtpAndRegister({
        otpCode: cleanOtp,
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        className,
        phone: phone.trim(),
        email: email.trim(),
        password,
        graduationYear: 1999,
        referralAccountId: referralId,
        referralName: referralName || 'Rekan Alumni',
        selfieBase64,
        recaptchaToken: recaptchaToken || undefined,
      });

      sessionStorage.removeItem('ruang59_otp_cooldown_until');
      toast.success('Pendaftaran alumni terkirim & email tervalidasi! Menunggu konfirmasi referral via email.');
      router.replace('/awaiting-approval');
    } catch (err: any) {
      toast.error(err.message || 'Verifikasi OTP gagal. Silakan periksa kembali kode OTP Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  if (
    (isCountdownEnabled && !isReleased) ||
    authLoading ||
    isAuthenticated ||
    Boolean(getAccessToken())
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      <div className="w-full max-w-md mx-auto">
        {/* Top Navigation Bar with Menu Tentang Forsil 99 */}
        <div className="flex items-center justify-between pb-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Ke Halaman Login</span>
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-bold text-brand-primary hover:border-brand-primary hover:bg-blue-50/40 shadow-2xs transition-all active:scale-95"
          >
            <span>Tentang Forsil 99</span>
            <ChevronRight size={13} className="text-brand-primary" />
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-5">
          <Link href="/login" className="inline-block mb-3">
            <img
              src="/images/forsil99apps.png"
              alt="Forsil99"
              className="h-14 w-auto object-contain mx-auto"
            />
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            {step === 'otp' ? 'Verifikasi Email Alumni' : 'Registrasi Alumni Baru'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {step === 'otp'
              ? 'Langkah Terakhir: Masukkan kode OTP untuk memvalidasi keaktifan email Anda'
              : 'Khusus Alumni SMAN 59 Jakarta Angkatan 1999 (Perak)'}
          </p>
        </div>

        {/* Menu Tentang Forsil 99 (Membangun Kepercayaan Alumni Sebelum Mendaftar) */}
        {step !== 'otp' && (
          <Link
            href="/about"
            className="mb-5 block group bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-amber-50/70 hover:from-blue-100/90 hover:to-indigo-100/80 border border-blue-200/80 hover:border-blue-300 rounded-2xl p-3.5 transition-all duration-200 shadow-xs hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-blue-200/70 flex items-center justify-center text-brand-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles size={18} className="text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                      Tentang Forsil 99
                    </span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
                      Sambutan Ketua
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    Kenali wadah silaturahmi & sambutan resmi Ketua sebelum mendaftar
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </Link>
        )}

        {step === 'otp' ? (
          /* STEP 2: OTP Verification Screen */
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-5 text-center">
            <div className="w-16 h-16 bg-blue-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-blue-100">
              <MailCheck size={32} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">Kode OTP Telah Dikirim</h2>
              <p className="text-xs text-slate-500 mt-1">
                Kami telah mengirimkan 6 digit kode OTP verifikasi ke email:
              </p>
              <div className="text-xs font-bold text-slate-800 mt-2 break-all bg-slate-100 py-1.5 px-3 rounded-lg inline-block border border-slate-200/60">
                {email}
              </div>
            </div>

            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                  Masukkan 6 Digit Kode OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center text-3xl font-mono font-extrabold tracking-[0.4em] py-3.5 px-4 rounded-xl border-2 border-slate-200 focus:border-brand-primary focus:outline-none bg-slate-50 focus:bg-white text-slate-900 transition-all shadow-inner"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  ⏱️ Kode OTP berlaku selama 10 menit.
                </p>
              </div>

              {/* 1-Minute Resend OTP Cooldown */}
              <div className="py-2 text-center">
                {otpCooldown > 0 ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200/80">
                    <Timer size={14} className="animate-spin text-brand-primary" />
                    <span>Kirim ulang kode dalam (00:{otpCooldown < 10 ? `0${otpCooldown}` : otpCooldown})</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isSendingOtp}
                    className="text-xs text-brand-primary font-bold hover:underline inline-flex items-center gap-1 transition"
                  >
                    <RotateCcw size={13} />
                    <span>{isSendingOtp ? 'Mengirim...' : 'Kirim Ulang Kode OTP ke Email'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-0.5">
                <ShieldCheck size={14} className="text-brand-primary" />
                <span>Dilindungi oleh Google reCAPTCHA v3</span>
              </div>

              <AppButton
                type="submit"
                variant="gold"
                size="lg"
                isLoading={isLoading}
                disabled={otpCode.length < 4}
                className="w-full"
              >
                Verifikasi & Selesaikan Pendaftaran
              </AppButton>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 transition"
              >
                <ArrowLeft size={13} />
                <span>Ubah Data / Email</span>
              </button>

              <span className="text-slate-400 text-[11px]">
                Cek juga folder Spam
              </span>
            </div>
          </div>
        ) : (
          /* STEP 1: Registration Form */
          <form id="register-form-box" onSubmit={handleRequestOtp} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-card space-y-4">
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

            <div id="register-email-section">
              <AppInput
                label="Alamat Email Aktif (Akun Google / Pribadi)"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                required
              />
              <p className="text-[11px] text-brand-primary mt-1 font-medium">
                * Kode OTP 6 digit akan dikirimkan ke email ini untuk memvalidasi keaktifan akun.
              </p>
            </div>

            <AppInput
              label="Kata Sandi Akun Baru"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            {/* Referral Selection (Wajib: Cari Rekan Seangkatan Min 3 Huruf) */}
            <div id="register-referral-section" className="space-y-2 pt-2 border-t border-slate-100">
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
            <div id="register-photo-section" className="pt-2 border-t border-slate-100 space-y-2">
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

            <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
              Dengan melanjutkan, Anda menyetujui{' '}
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-brand-primary font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Kebijakan Privasi Database Forsil99</span>
              </button>{' '}
              komunitas Forsil 99.
            </p>

            <AppButton
              type="submit"
              variant="gold"
              size="lg"
              isLoading={isSendingOtp}
              className="w-full mt-2"
            >
              Lanjut ke Verifikasi Email (OTP)
            </AppButton>
          </form>
        )}

        <div className="text-center mt-4 space-y-2">
          <Link href="/login" className="text-xs text-slate-600 hover:text-brand-primary font-semibold block">
            Sudah punya akun? Masuk di sini
          </Link>
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1">
            <Link href="/about" className="hover:text-brand-primary hover:underline transition-colors font-medium">
              Tentang Forsil 99
            </Link>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-brand-primary hover:underline transition-colors font-medium cursor-pointer"
            >
              Kebijakan Privasi
            </button>
          </div>
        </div>

        {/* Live Walkthrough & Manual Documentation */}
        <WalkthroughTrigger config={REGISTER_WALKTHROUGH} position="top-right" label="Panduan Daftar" />

        {/* Modal Kebijakan Privasi */}
        <PrivacyPolicyModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
        />
      </div>
    </div>
  );
}
