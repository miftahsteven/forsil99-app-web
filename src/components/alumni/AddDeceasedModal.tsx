'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createDeceasedAlumni } from '@/services/memorialService';
import { compressImage } from '@/utils/imageCompressor';
import { DeceasedAlumni } from '@/types';
import {
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Sparkles,
  Heart,
  AlertCircle,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface AddDeceasedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (newItem: DeceasedAlumni) => void;
}

const CLASS_OPTIONS = [
  '3 IPA 1',
  '3 IPA 2',
  '3 IPA 3',
  '3 IPS 1',
  '3 IPS 2',
  '3 IPS 3',
  '3 IPS 4',
  '3 Bahasa',
  'Lainnya / Guru',
];

export function AddDeceasedModal({ isOpen, onClose, onAdded }: AddDeceasedModalProps) {
  const { isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [className, setClassName] = useState<string>('3 IPA 1');
  const [passedAwayYear, setPassedAwayYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [passedAwayDate, setPassedAwayDate] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file, { imageCount: 1 });
      setPhotoUrl(compressed);
      toast.success('Foto kenangan berhasil dipilih.');
    } catch (err: any) {
      toast.error('Gagal memproses foto: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Silakan masuk ke akun Anda terlebih dahulu.');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Nama lengkap sahabat wajib diisi.');
      return;
    }

    const yearNum = parseInt(passedAwayYear, 10);
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear()) {
      toast.error('Masukkan tahun wafat yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createDeceasedAlumni({
        fullName: fullName.trim(),
        nickname: nickname.trim() || undefined,
        className: className || undefined,
        passedAwayYear: yearNum,
        passedAwayDate: passedAwayDate.trim() || undefined,
        bio: bio.trim() || undefined,
        photoUrl: photoUrl || undefined,
      });

      if (res.success && res.data) {
        toast.success('Data sahabat in memoriam berhasil ditambahkan.');
        onAdded(res.data);
        onClose();
      } else {
        toast.error(res.message || 'Gagal menambahkan data.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan data sahabat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-700/70 animate-scaleUp flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/60 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🕊️</span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-amber-200 leading-tight">
                Tambah Data Sahabat (In Memoriam)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mengenang rekan seangkatan yang telah mendahului kita
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
          {/* Notice info */}
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-200/90 leading-relaxed">
            <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <span>
              Siapa saja rekan alumni dapat menambahkan data sahabat yang telah tiada. Jika terdapat data yang keliru atau tidak valid, alumni lain dapat melaporkannya untuk diverifikasi/dihapus oleh admin.
            </span>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Foto Kenangan (Opsional):
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center relative shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover grayscale" />
                ) : (
                  <User size={24} className="text-slate-500" />
                )}
                {isProcessingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin text-amber-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer transition-colors">
                  <Upload size={13} className="text-amber-400" />
                  <span>Pilih Foto dari Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  Format JPG, PNG, atau WEBP. Foto akan ditampilkan dalam nuansa memorial.
                </p>
              </div>
            </div>
          </div>

          {/* Full Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Lengkap <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="cth. Rizky Aditya Pratama"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Panggilan / Akrab:
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="cth. Rizky"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors"
              />
            </div>
          </div>

          {/* Class & Passed Away Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Kelas Semasa SMA:</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-400/70 transition-colors"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-slate-100">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tahun Wafat <span className="text-rose-400">*</span>:
              </label>
              <input
                type="number"
                required
                min={1990}
                max={new Date().getFullYear()}
                value={passedAwayYear}
                onChange={(e) => setPassedAwayYear(e.target.value)}
                placeholder="cth. 2018"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors"
              />
            </div>
          </div>

          {/* Date string */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Tanggal / Bulan Wafat (Opsional):
            </label>
            <input
              type="text"
              value={passedAwayDate}
              onChange={(e) => setPassedAwayDate(e.target.value)}
              placeholder="cth. 14 Juli 2018 / Bulan Ramadan 2018"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors"
            />
          </div>

          {/* Memory Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Untaian Kenangan Singkat (Opsional):
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tuliskan kenangan indah atau kesan mendalam tentang sosok almarhum/almarhumah..."
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 transition-colors resize-none leading-relaxed"
            />
            <div className="text-right text-[10px] text-slate-500 mt-0.5">{bio.length}/300</div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isProcessingPhoto}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span>🕊️ Simpan Data Memorial</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
