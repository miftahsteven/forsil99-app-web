'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/services/authService';
import { compressImage } from '@/utils/imageCompressor';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { CoverCropModal } from '@/components/ui/CoverCropModal';
import {
  ChevronLeft,
  Camera,
  User,
  Briefcase,
  Building,
  MapPin,
  FileText,
  Phone,
  Calendar,
  Heart,
  Sparkles,
  Crown,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Shield,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PrivacyPolicyModal } from '@/components/legal/PrivacyPolicyModal';

const STANDARD_PROFESSIONS = [
  'Karyawan Swasta',
  'Wirausaha / Pengusaha',
  'PNS / ASN',
  'BUMN / BUMD',
  'TNI / POLRI',
  'Dokter / Tenaga Medis',
  'Guru / Dosen / Akademisi',
  'Pengacara / Notaris / Konsultan Hukum',
  'Akuntan / Auditor / Konsultan Keuangan',
  'Arsitek / Insinyur / Kontraktor',
  'IT / Software Engineer / Tech',
  'Freelancer / Pekerja Lepas',
  'Seniman / Desainer / Kreator Konten',
  'Ibu Rumah Tangga',
  'Belum Bekerja',
  'Lainnya',
];

const PRESET_HOBBIES = [
  'Olahraga',
  'Sepak Bola / Futsal',
  'Bersepeda',
  'Lari / Marathon',
  'Traveling',
  'Kuliner',
  'Membaca',
  'Musik',
  'Fotografi',
  'Otomotif',
  'Gaming',
  'Berkebun',
  'Memasak',
  'Pecinta Alam / Naik Gunung',
  'Teknologi',
];

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, user, updateCurrentProfileState } = useAuth();

  // Basic Info
  const [fullName, setFullName] = useState<string>(profile?.fullName || '');
  const [nickname, setNickname] = useState<string>(profile?.nickname || '');
  const [className, setClassName] = useState<string>(profile?.className || '3 IPA 1');
  const [gender, setGender] = useState<string>(profile?.gender || 'Pria');
  const [maritalStatus, setMaritalStatus] = useState<string>(profile?.maritalStatus || 'Menikah');
  const [birthDate, setBirthDate] = useState<string>(profile?.birthDate || '');
  const [bio, setBio] = useState<string>(profile?.bio || '');

  // Contact & Location
  const initialWa = profile?.whatsappNumber || user?.phoneNumber || '';
  const [whatsappNumber, setWhatsappNumber] = useState<string>(initialWa);
  const [city, setCity] = useState<string>(profile?.city || '');
  const [province, setProvince] = useState<string>(profile?.province || '');
  const [currentAddress, setCurrentAddress] = useState<string>(profile?.currentAddress || '');

  const inferProvince = (cityName: string): string | null => {
    const lower = cityName.toLowerCase();
    if (
      lower.includes('bogor') ||
      lower.includes('depok') ||
      lower.includes('bekasi') ||
      lower.includes('cibinong') ||
      lower.includes('cikarang') ||
      lower.includes('bandung') ||
      lower.includes('karawang') ||
      lower.includes('sukabumi') ||
      lower.includes('cirebon') ||
      lower.includes('tasikmalaya')
    ) {
      return 'Jawa Barat';
    }
    if (
      lower.includes('jakarta') ||
      lower.includes('jaktim') ||
      lower.includes('jaksel') ||
      lower.includes('jakpus') ||
      lower.includes('jakbar') ||
      lower.includes('jakut')
    ) {
      return 'DKI Jakarta';
    }
    if (
      lower.includes('tangerang') ||
      lower.includes('tangsel') ||
      lower.includes('serang') ||
      lower.includes('cilegon') ||
      lower.includes('bsd') ||
      lower.includes('bintaro')
    ) {
      return 'Banten';
    }
    if (
      lower.includes('semarang') ||
      lower.includes('solo') ||
      lower.includes('surakarta') ||
      lower.includes('magelang') ||
      lower.includes('banyumas') ||
      lower.includes('purwokerto')
    ) {
      return 'Jawa Tengah';
    }
    if (
      lower.includes('jogja') ||
      lower.includes('yogyakarta') ||
      lower.includes('sleman') ||
      lower.includes('bantul')
    ) {
      return 'DI Yogyakarta';
    }
    if (
      lower.includes('surabaya') ||
      lower.includes('malang') ||
      lower.includes('sidoarjo') ||
      lower.includes('gresik')
    ) {
      return 'Jawa Timur';
    }
    return null;
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    const inferred = inferProvince(val);
    if (inferred) {
      setProvince(inferred);
    }
  };

  // Sync profile when loaded
  useEffect(() => {
    if (profile) {
      if (profile.city && !city) setCity(profile.city);
      if (profile.province) {
        setProvince(profile.province);
      } else if (profile.city) {
        const inf = inferProvince(profile.city);
        if (inf) setProvince(inf);
      }
    }
  }, [profile]);

  // Career
  const isKnownProf = STANDARD_PROFESSIONS.includes(profile?.occupation || '');
  const [selectedProfCategory, setSelectedProfCategory] = useState<string>(
    profile?.occupation ? (isKnownProf ? profile.occupation : 'Lainnya') : 'Karyawan Swasta'
  );
  const [customOccupation, setCustomOccupation] = useState<string>(
    profile?.occupation && !isKnownProf ? profile.occupation : ''
  );
  const [company, setCompany] = useState<string>(profile?.company || '');

  // Hobbies
  const [hobbies, setHobbies] = useState<string[]>(
    Array.isArray(profile?.hobbies) ? profile.hobbies : ['Olahraga', 'Traveling']
  );
  const [newHobbyInput, setNewHobbyInput] = useState<string>('');

  // Privacy & Category
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'followers' | 'private'>(
    profile?.profileVisibility || 'public'
  );
  const [tempPublicHours, setTempPublicHours] = useState<string>('0');

  // Photo
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>(profile?.profilePhotoUrl || '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>(profile?.coverPhotoUrl || '');
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Privacy Policy Agreement
  const [hasAgreedPrivacy, setHasAgreedPrivacy] = useState<boolean>(true);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  // Sync WhatsApp from user phoneNumber if empty
  useEffect(() => {
    if (!whatsappNumber && user?.phoneNumber) {
      setWhatsappNumber(user.phoneNumber);
    }
  }, [user?.phoneNumber, whatsappNumber]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('File yang dipilih bukan gambar. Harap pilih gambar (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('File yang dipilih bukan gambar. Harap pilih file gambar (JPG, PNG, WebP).');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran foto terlalu besar. Maksimal 25MB.');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    // Baca file asli untuk dipotong langsung oleh user tanpa mengubah resolusi
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropModalOpen(true);
      if (coverInputRef.current) coverInputRef.current.value = '';
    };
    reader.onerror = () => {
      toast.error('Gagal membaca file foto.');
      if (coverInputRef.current) coverInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setCoverPhotoUrl(croppedDataUrl);
    setCropImageSrc(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
    toast.success('Foto cover berhasil dipotong sesuai ukuran cover! Klik Simpan Perubahan Profil di bawah untuk menyimpan.');
  };

  const handleToggleHobby = (hobbyName: string) => {
    setHobbies((prev) =>
      prev.includes(hobbyName) ? prev.filter((h) => h !== hobbyName) : [...prev, hobbyName]
    );
  };

  const handleAddCustomHobby = () => {
    const trimmed = newHobbyInput.trim();
    if (!trimmed) return;
    if (!hobbies.includes(trimmed)) {
      setHobbies((prev) => [...prev, trimmed]);
    }
    setNewHobbyInput('');
  };

  const handleRemoveHobby = (hobbyName: string) => {
    setHobbies((prev) => prev.filter((h) => h !== hobbyName));
  };

  // Dynamically evaluate current completeness based on form values
  const hasFullName = Boolean(fullName.trim());
  const hasClassName = Boolean(className.trim());
  const hasBirthDate = Boolean(birthDate.trim());
  const hasWhatsapp = Boolean(whatsappNumber.trim());
  const hasCurrentAddress = Boolean(currentAddress.trim());
  const finalOccupation =
    selectedProfCategory === 'Lainnya'
      ? customOccupation.trim() || 'Lainnya'
      : selectedProfCategory;
  const hasOccupation = Boolean(finalOccupation.trim() && finalOccupation !== 'Lainnya');
  const hasGender = Boolean(gender.trim());
  const hasMaritalStatus = Boolean(maritalStatus.trim());
  const hasHobbies = Array.isArray(hobbies) && hobbies.length > 0;
  const hasCity = Boolean(city.trim());
  const hasBio = Boolean(bio.trim());
  const hasPhoto = Boolean(profilePhotoUrl.trim());

  const formFieldsStatus = [
    { name: 'Nama Lengkap', filled: hasFullName },
    { name: 'Kelas (SMAN 59)', filled: hasClassName },
    { name: 'Tanggal Lahir', filled: hasBirthDate },
    { name: 'No. WhatsApp', filled: hasWhatsapp },
    { name: 'Alamat Lengkap Saat Ini', filled: hasCurrentAddress },
    { name: 'Pekerjaan / Profesi', filled: hasOccupation },
    { name: 'Jenis Kelamin', filled: hasGender },
    { name: 'Status Pernikahan', filled: hasMaritalStatus },
    { name: 'Hobi / Minat', filled: hasHobbies },
    { name: 'Kota Domisili', filled: hasCity },
    { name: 'Bio / Cerita Singkat', filled: hasBio },
    { name: 'Foto Profil', filled: hasPhoto },
  ];

  const formFilledCount = formFieldsStatus.filter((f) => f.filled).length;
  const formMissingList = formFieldsStatus.filter((f) => !f.filled).map((f) => f.name);
  const formPercentage = Math.round((formFilledCount / formFieldsStatus.length) * 100);
  const isFormComplete = formFilledCount === formFieldsStatus.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Nama lengkap wajib diisi.');
      return;
    }

    if (!hasAgreedPrivacy) {
      toast.error('Anda wajib mencentang persetujuan Kebijakan Privasi Forsil 99 untuk memperbarui profil.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        className,
        gender,
        maritalStatus,
        birthDate: birthDate || undefined,
        whatsappNumber: whatsappNumber.trim() || undefined,
        city: city.trim() || undefined,
        province: province.trim() || undefined,
        currentAddress: currentAddress.trim() || undefined,
        occupation: finalOccupation,
        company: company.trim() || undefined,
        hobbies,
        bio: bio.trim() || undefined,
        profileVisibility,
        profileCategory: isFormComplete
          ? (profileVisibility === 'public' ? 'super_extrov' : profileVisibility === 'followers' ? 'extrov' : 'introv')
          : 'introv',
        tempPublicHours: tempPublicHours !== '0' ? parseInt(tempPublicHours, 10) : 0,
        profilePhotoUrl: profilePhotoUrl || undefined,
        coverPhotoUrl: coverPhotoUrl || undefined,
      });

      if (updated) {
        updateCurrentProfileState(updated);
        if (updated.isComplete) {
          toast.success('Profil berhasil diperbarui dengan data 100% lengkap!');
        } else {
          toast.success('Perubahan data berhasil disimpan! Status profil: Belum Lengkap (Kategori: Introv).');
        }
        router.push(`/profile/${profile?.uid || 'me'}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-3 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Kelola Profil Alumni</h1>
          <p className="text-xs text-slate-500">Lengkapi data profil Anda untuk memperoleh lencana alumni</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Status Card: Kelengkapan Data & Kategori Profil */}
        <div
          className={`p-5 rounded-2xl border-2 shadow-xs transition-all ${
            isFormComplete
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-300'
              : 'bg-gradient-to-br from-amber-50 via-orange-50/60 to-white border-amber-300'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide ${
                  isFormComplete
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white shadow-xs'
                }`}
              >
                {isFormComplete ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {isFormComplete ? 'STATUS: DATA 100% LENGKAP' : 'STATUS DATA: BELUM LENGKAP'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-slate-800 text-amber-200 border border-slate-700">
                Kategori:{' '}
                {isFormComplete
                  ? profileVisibility === 'public'
                    ? 'Super Extrov (👑)'
                    : profileVisibility === 'followers'
                    ? 'Extrov (🔷)'
                    : 'Introv (⚪)'
                  : 'Introv (⚪ Default Data Belum Lengkap)'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
              {formFilledCount} dari {formFieldsStatus.length} data ({formPercentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200/70 rounded-full overflow-hidden mb-3 p-0.5">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isFormComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${Math.min(Math.max(formPercentage, 8), 100)}%` }}
            />
          </div>

          {!isFormComplete ? (
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong className="text-amber-950 font-bold">Pengingat Forsil 99:</strong> Seluruh pendaftar baru secara default memiliki status kategori <strong className="text-slate-900 font-extrabold">Introv</strong> karena data belum terisi lengkap.{' '}
                <span className="bg-amber-100/80 text-amber-950 font-semibold px-1 py-0.5 rounded">
                  Anda tetap bisa menyimpan perubahan data kapan saja meski belum lengkap.
                </span>{' '}
                Setelah seluruh 12 data terisi lengkap (100%), Anda bebas memilih kategori profil Super Extrov (👑), Extrov (🔷), atau tetap Introv (⚪).
              </p>
              {formMissingList.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Sisa data yang belum diisi ({formMissingList.length} data):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {formMissingList.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-amber-100/90 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
              🎉 Selamat! Seluruh 12 data alumni Anda sudah lengkap. Anda bebas memilih kategori profil di bawah: Super Extrov (👑 Crown Emas), Extrov (🔷 Centang Biru), atau tetap Introv (⚪).
            </p>
          )}
        </div>

        {/* Card 1: Foto Profil & Cover */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Cover Photo Preview & Edit Button */}
          <div className="relative w-full h-36 sm:h-44 bg-gradient-to-r from-brand-primary to-brand-primaryDeep overflow-hidden group">
            {coverPhotoUrl ? (
              <img
                src={coverPhotoUrl}
                alt="Cover Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20 text-white font-black text-3xl select-none">
                SMAN 59 JAKARTA ’99
              </div>
            )}

            {/* Tombol Ubah Cover di Bagian Kanan Bawah Foto Cover */}
            <label className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-md border border-white/20 cursor-pointer transition-all hover:scale-105 active:scale-95">
              <Camera size={14} />
              <span>Ubah Cover</span>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Avatar Section Overlapping Cover */}
          <div className="px-5 pb-5 flex flex-col items-center justify-center -mt-12 relative z-10">
            <div className="relative group p-1 bg-white rounded-full shadow-md">
              <AppAvatar src={profilePhotoUrl} name={fullName || 'Saya'} size="xl" />
              <label className="absolute bottom-0 right-0 p-2 bg-brand-primary text-white rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-transform hover:scale-105" title="Ganti Foto Profil">
                <Camera size={16} />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-slate-500 font-medium block">
                Ketuk ikon kamera untuk mengganti foto profil
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Gunakan tombol di kanan bawah cover untuk mengganti foto cover
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Pengaturan Kategori & Keterbukaan Profil */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield size={18} className="text-brand-primary" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Keterbukaan Akses Profil</h2>
              <p className="text-[11px] text-slate-500">Pilih bagaimana alumni lain dapat melihat profil Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Opsi 1: Super Extrov */}
            <label
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                profileVisibility === 'public'
                  ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="profileVisibility"
                value="public"
                checked={profileVisibility === 'public'}
                onChange={() => setProfileVisibility('public')}
                className="mt-1 text-amber-500 focus:ring-amber-400"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Crown size={16} className="fill-amber-400 text-amber-700" />
                  <span className="text-xs font-bold text-slate-900">Buka untuk Semua Alumni (Super Extrov)</span>
                  {isFormComplete ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      👑 Siap Digunakan
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Aktif setelah 12 data lengkap
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Semua rekan alumni 1999 dapat melihat profil lengkap Anda. Mendapatkan lencana 👑 Crown Emas jika seluruh data profil telah lengkap.
                </p>

                {/* Sub-pilihan batas waktu jika public */}
                {profileVisibility === 'public' && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/70 space-y-1.5">
                    <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                      <Clock size={12} />
                      Batas Waktu Akses Terbuka:
                    </span>
                    <select
                      value={tempPublicHours}
                      onChange={(e) => setTempPublicHours(e.target.value)}
                      className="w-full text-xs font-medium bg-white border border-amber-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      <option value="0">Buka Terbuka Permanen (Sampai diubah manual)</option>
                      <option value="24">Buka Sementara 1 Hari (24 Jam)</option>
                      <option value="72">Buka Sementara 3 Hari</option>
                      <option value="168">Buka Sementara 7 Hari</option>
                    </select>
                    <p className="text-[10px] text-amber-700 italic">
                      Jika waktu sementara habis, profil akan otomatis kembali ke pengaturan followers/privat.
                    </p>
                  </div>
                )}
              </div>
            </label>

            {/* Opsi 2: Extrov */}
            <label
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                profileVisibility === 'followers'
                  ? 'border-blue-400 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="profileVisibility"
                value="followers"
                checked={profileVisibility === 'followers'}
                onChange={() => {
                  setProfileVisibility('followers');
                  setTempPublicHours('0');
                }}
                className="mt-1 text-blue-500 focus:ring-blue-400"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <BadgeCheck size={16} className="fill-blue-500 text-white" />
                  <span className="text-xs font-bold text-slate-900">Khusus Pengikut Saja (Extrov)</span>
                  {isFormComplete ? (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      🔷 Siap Digunakan
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Aktif setelah 12 data lengkap
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Hanya alumni yang mengikuti (followers) yang dapat melihat rincian kontak dan profil lengkap Anda. Mendapatkan lencana 🔷 Centang Biru.
                </p>
              </div>
            </label>

            {/* Opsi 3: Introv */}
            <label
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                profileVisibility === 'private'
                  ? 'border-slate-400 bg-slate-50/80 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="profileVisibility"
                value="private"
                checked={profileVisibility === 'private'}
                onChange={() => {
                  setProfileVisibility('private');
                  setTempPublicHours('0');
                }}
                className="mt-1 text-slate-500 focus:ring-slate-400"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CheckCircle2 size={15} className="fill-slate-400 text-white" />
                  <span className="text-xs font-bold text-slate-900">Privat / Tertutup (Introv)</span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    ⚪ Default Pendaftar Baru
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Menutup informasi profil dari semua alumni (hanya Anda yang dapat melihat rincian). Mendapatkan lencana ⚪ Centang Abu-abu.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Card 3: Data Pribadi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User size={18} className="text-brand-primary" />
            <h2 className="text-sm font-bold text-slate-900">Data Identitas Alumni</h2>
          </div>

          <AppInput
            label="Nama Lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Nama lengkap sesuai ijazah/KTP"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <AppInput
              label="Nama Panggilan"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Contoh: Steve, Miftah"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kelas SMAN 59 (Angkatan 1999)
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
              >
                <option value="3 IPA 1">3 IPA 1</option>
                <option value="3 IPA 2">3 IPA 2</option>
                <option value="3 IPA 3">3 IPA 3</option>
                <option value="3 IPS 1">3 IPS 1</option>
                <option value="3 IPS 2">3 IPS 2</option>
                <option value="3 IPS 3">3 IPS 3</option>
                <option value="3 IPS 4">3 IPS 4</option>
                <option value="3 Bahasa">3 Bahasa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
              >
                <option value="Pria">Pria</option>
                <option value="Wanita">Wanita</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Lahir
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status Pernikahan
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
              >
                <option value="Belum Menikah">Belum Menikah</option>
                <option value="Menikah">Menikah</option>
                <option value="Duda">Duda</option>
                <option value="Janda">Janda</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 4: Kontak & Alamat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Phone size={18} className="text-brand-primary" />
            <h2 className="text-sm font-bold text-slate-900">Kontak & Alamat Domisili</h2>
          </div>

          <div>
            <AppInput
              label="Nomor WhatsApp"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="0812xxxxxxxx"
              leftIcon={<Phone size={16} />}
              helperText="Otomatis dihubungkan ke tombol chat WA profil Anda"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <AppInput
              label="Kota / Kabupaten Domisili"
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="Contoh: Kabupaten Bogor, Jakarta Timur, Bandung"
              leftIcon={<MapPin size={16} />}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Provinsi Domisili
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="province-options"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Contoh: Jawa Barat, DKI Jakarta, Banten"
                  className="w-full p-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
                <datalist id="province-options">
                  <option value="DKI Jakarta" />
                  <option value="Jawa Barat" />
                  <option value="Banten" />
                  <option value="Jawa Tengah" />
                  <option value="DI Yogyakarta" />
                  <option value="Jawa Timur" />
                  <option value="Bali" />
                  <option value="Sumatera Utara" />
                  <option value="Sumatera Barat" />
                  <option value="Riau" />
                  <option value="Kepulauan Riau" />
                  <option value="Lampung" />
                  <option value="Sumatera Selatan" />
                  <option value="Kalimantan Timur" />
                  <option value="Kalimantan Barat" />
                  <option value="Sulawesi Selatan" />
                  <option value="Luar Negeri" />
                </datalist>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Otomatis disesuaikan jika mengetik kota/kabupaten.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alamat Lengkap Saat Ini
            </label>
            <textarea
              rows={2}
              value={currentAddress}
              onChange={(e) => setCurrentAddress(e.target.value)}
              placeholder="Masukkan alamat lengkap tempat tinggal Anda saat ini..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Card 5: Karir & Pekerjaan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Briefcase size={18} className="text-brand-primary" />
            <h2 className="text-sm font-bold text-slate-900">Pekerjaan / Profesi</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kategori Profesi
            </label>
            <select
              value={selectedProfCategory}
              onChange={(e) => setSelectedProfCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
            >
              {STANDARD_PROFESSIONS.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
            </select>
          </div>

          {selectedProfCategory === 'Lainnya' && (
            <AppInput
              label="Tuliskan Profesi / Pekerjaan Anda"
              value={customOccupation}
              onChange={(e) => setCustomOccupation(e.target.value)}
              placeholder="Contoh: Konsultan Branding, Masinis, Pilot"
              leftIcon={<Briefcase size={16} />}
              required
            />
          )}

          {selectedProfCategory !== 'Belum Bekerja' && selectedProfCategory !== 'Ibu Rumah Tangga' && (
            <AppInput
              label="Nama Perusahaan / Institusi / Usaha"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Contoh: PT Telkom Indonesia, Toko Berkah Mandiri, Mandiri Syariah"
              leftIcon={<Building size={16} />}
            />
          )}
        </div>

        {/* Card 6: Hobi & Cerita Singkat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Heart size={18} className="text-brand-primary" />
            <h2 className="text-sm font-bold text-slate-900">Hobi & Bio Alumni</h2>
          </div>

          {/* Hobbies Pill Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilihan Hobi & Minat (Pilih yang sesuai)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PRESET_HOBBIES.map((hobby) => {
                const isSelected = hobbies.includes(hobby);
                return (
                  <button
                    key={hobby}
                    type="button"
                    onClick={() => handleToggleHobby(hobby)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-xs scale-102'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {hobby}
                  </button>
                );
              })}
            </div>

            {/* Custom Hobby Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newHobbyInput}
                onChange={(e) => setNewHobbyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomHobby();
                  }
                }}
                placeholder="Tambahkan hobi kustom lainnya..."
                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomHobby}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus size={14} />
                Tambah
              </button>
            </div>

            {/* Selected Custom Hobbies List */}
            {hobbies.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="text-[11px] font-medium text-slate-500 self-center">Hobi terpilih:</span>
                {hobbies.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => handleRemoveHobby(h)}
                      className="hover:text-red-500 rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bio / Cerita Singkat Alumni
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan sedikit tentang kabar, kenangan masa SMA 59, atau kesibukan Anda..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Card 7: Persetujuan Kebijakan Privasi & Kepatuhan UU PDP */}
        <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Persetujuan Privasi & Perlindungan Data (UU PDP)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Baca Dokumen Hukum</span>
              <ExternalLink size={12} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={hasAgreedPrivacy}
                  onChange={(e) => setHasAgreedPrivacy(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  id="privacy-consent-checkbox"
                />
              </div>
              <div className="text-xs text-slate-700 leading-snug space-y-1">
                <p className="font-semibold text-slate-900">
                  Saya menyatakan bahwa data yang saya masukkan adalah benar, dan saya menyetujui{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPrivacyModalOpen(true);
                    }}
                    className="text-emerald-700 font-bold underline hover:text-emerald-900 inline"
                  >
                    Kebijakan Privasi & Ketentuan Layanan Forsil 99
                  </button>
                  .
                </p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Persetujuan ini mencakup: penyimpanan data profil di basis data resmi Forsil 99, penerapan sistem klasifikasi tingkatan profil (Super Extrov, Extrov, Introv), komitmen tidak membagikan akses login akun ke pihak lain, serta kepatuhan penuh terhadap UU No. 27 Tahun 2022 (UU PDP).
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSaving}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Batal
          </button>
          <AppButton type="submit" isLoading={isSaving} className="flex-2 py-3">
            Simpan Perubahan Profil
          </AppButton>
        </div>
      </form>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onAccept={() => setHasAgreedPrivacy(true)}
      />

      {/* Cover Crop Modal */}
      <CoverCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropImageSrc(null);
          if (coverInputRef.current) coverInputRef.current.value = '';
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={2.5}
        title="Sesuaikan Area Potong Cover Profil"
      />
    </div>
  );
}
