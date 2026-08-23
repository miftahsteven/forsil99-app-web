'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/services/authService';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { AppAvatar } from '@/components/ui/AppAvatar';
import {
  ChevronLeft,
  Camera,
  User,
  Briefcase,
  Building,
  MapPin,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const { profile, updateCurrentProfileState } = useAuth();

  const [fullName, setFullName] = useState<string>(profile?.fullName || '');
  const [nickname, setNickname] = useState<string>(profile?.nickname || '');
  const [bio, setBio] = useState<string>(profile?.bio || '');
  const [className, setClassName] = useState<string>(profile?.className || '3 IPA 1');
  const [occupation, setOccupation] = useState<string>(profile?.occupation || '');
  const [company, setCompany] = useState<string>(profile?.company || '');
  const [city, setCity] = useState<string>(profile?.city || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>(
    profile?.profilePhotoUrl || ''
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Nama lengkap wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        bio: bio.trim() || undefined,
        className,
        occupation: occupation.trim() || undefined,
        company: company.trim() || undefined,
        city: city.trim() || undefined,
        profilePhotoUrl: profilePhotoUrl || undefined,
      });

      if (updated) {
        updateCurrentProfileState(updated);
        toast.success('Profil berhasil diperbarui!');
        router.push(`/profile/${profile?.uid || 'me'}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full px-3 py-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="p-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Edit Profil Alumni</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card space-y-4">
        {/* Profile Avatar Upload */}
        <div className="flex flex-col items-center justify-center pb-2">
          <div className="relative group">
            <AppAvatar
              src={profilePhotoUrl}
              name={fullName || 'Saya'}
              size="xl"
            />
            <label className="absolute bottom-0 right-0 p-2 bg-brand-primary text-white rounded-full cursor-pointer hover:bg-brand-primaryDark shadow-md">
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
          <span className="text-[11px] text-slate-400 mt-2">
            Klik ikon kamera untuk mengganti foto profil
          </span>
        </div>

        <AppInput
          label="Nama Lengkap"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User size={16} />}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <AppInput
            label="Nama Panggilan"
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
              {[
                '3 IPA 1',
                '3 IPA 2',
                '3 IPA 3',
                '3 IPS 1',
                '3 IPS 2',
                '3 IPS 3',
                '3 IPS 4',
                '3 Bahasa',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-slate-700">
            Bio / Tentang Saya
          </label>
          <textarea
            rows={3}
            placeholder="Tuliskan cerita singkat perjalanan atau sapaan untuk rekan alumni..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 focus:border-brand-primary focus:outline-none"
          />
        </div>

        <AppInput
          label="Profesi / Pekerjaan"
          placeholder="Contoh: Dokter, Pengusaha, Software Engineer"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          leftIcon={<Briefcase size={16} />}
        />

        <AppInput
          label="Perusahaan / Instansi / Usaha"
          placeholder="Contoh: PT Maju Bersama / Resto 59"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          leftIcon={<Building size={16} />}
        />

        <AppInput
          label="Kota Domisili Saat Ini"
          placeholder="Contoh: Jakarta Timur, Tangerang Selatan"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          leftIcon={<MapPin size={16} />}
        />

        <AppButton
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          className="w-full mt-4"
        >
          Simpan Perubahan Profil
        </AppButton>
      </form>
    </div>
  );
}
