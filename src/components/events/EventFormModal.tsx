'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Upload,
  Image as ImageIcon,
  Users,
  ShieldCheck,
  Check,
  Loader2,
  Trash2,
  FileText,
} from 'lucide-react';
import { AlumniEvent } from '@/types';
import { createEvent, updateEvent } from '@/services/eventService';
import { toast } from 'sonner';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: AlumniEvent | null;
}

export function EventFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: EventFormModalProps) {
  const isEdit = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [organizerName, setOrganizerName] = useState('Panitia Reuni Alumni 59');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatForInput = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      return localISOTime;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCoverUrl(initialData.coverUrl || '');
      setStartAt(formatForInput(initialData.startAt));
      setEndAt(formatForInput(initialData.endAt));
      setLocationName(initialData.locationName || '');
      setAddress(initialData.address || '');
      setOrganizerName(initialData.organizerName || 'Panitia Reuni Alumni 59');
    } else {
      // Default: next Saturday at 09:00
      const nextSat = new Date();
      nextSat.setDate(nextSat.getDate() + ((6 - nextSat.getDay() + 7) % 7 || 7));
      nextSat.setHours(9, 0, 0, 0);

      const nextSatEnd = new Date(nextSat);
      nextSatEnd.setHours(15, 0, 0, 0);

      setTitle('');
      setDescription('');
      setCoverUrl('');
      setStartAt(formatForInput(nextSat.toISOString()));
      setEndAt(formatForInput(nextSatEnd.toISOString()));
      setLocationName('SMAN 59 Jakarta');
      setAddress('Jl. Bulak Timur I No.109, RT.10/RW.16, Klender, Duren Sawit, Jakarta Timur');
      setOrganizerName('Panitia Reuni Alumni 59');
    }
  }, [initialData, isOpen]);

  // Handle Cover Photo Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File yang dipilih harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverUrl(reader.result as string);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      toast.error('Gagal membaca gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Judul agenda acara wajib diisi.');
      return;
    }
    if (!startAt) {
      toast.error('Tanggal dan waktu mulai acara wajib ditentukan.');
      return;
    }
    if (!locationName.trim()) {
      toast.error('Nama lokasi / tempat acara wajib diisi.');
      return;
    }
    if (!description.trim()) {
      toast.error('Deskripsi acara wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(isEdit ? 'Memperbarui agenda...' : 'Mempublikasikan agenda acara...');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        coverUrl: coverUrl || undefined,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
        locationName: locationName.trim(),
        address: address.trim() || undefined,
        organizerName: organizerName.trim() || 'Panitia Reuni Alumni 59',
      };

      if (isEdit && initialData) {
        await updateEvent(initialData.id, payload);
        toast.success('Agenda acara berhasil diperbarui!', { id: toastId });
      } else {
        await createEvent(payload);
        toast.success('Agenda acara baru berhasil dipublikasikan!', { id: toastId });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit event error:', err);
      toast.error(err?.response?.data?.message || 'Gagal menyimpan agenda acara.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-indigo-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                  {isEdit ? 'Ubah Agenda' : 'Buat Agenda'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-0.5">
                  <ShieldCheck size={11} />
                  <span>Admin</span>
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                Publikasikan jadwal agenda acara atau pertemuan dengan alumni
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Batal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Cover Photo Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Foto Sampul / Banner Acara (Opsional)
            </label>
            {coverUrl ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold shadow hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Ganti Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-slate-300 hover:border-brand-primary rounded-2xl flex flex-col items-center justify-center gap-1.5 bg-slate-50/70 hover:bg-blue-50/40 text-slate-500 hover:text-brand-primary transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-200">
                  <ImageIcon size={20} className="text-brand-primary" />
                </div>
                <span className="text-xs font-semibold">Klik untuk mengunggah foto / banner acara</span>
                <span className="text-[10px] text-slate-400">Rekomendasi rasio 16:9 atau 2.5:1 (Maks. 10MB)</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>

          {/* Judul Acara */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Judul Agenda / Acara <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Temu Kangen Perak 25 Tahun Alumni SMAN 59 Jakarta"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>

          {/* Waktu Mulai & Waktu Selesai Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-brand-primary" />
                <span>Waktu Mulai <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                <span>Waktu Selesai (Opsional)</span>
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Lokasi & Alamat */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <MapPin size={13} className="text-emerald-600" />
                <span>Nama Lokasi / Tempat <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Contoh: Gedung Serbaguna SMAN 59 Jakarta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Alamat Lengkap (Opsional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Bulak Timur I No.109, Klender, Duren Sawit, Jakarta Timur"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
            </div>
          </div>

          {/* Penyelenggara */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <Users size={13} className="text-blue-600" />
              <span>Nama Penyelenggara</span>
            </label>
            <input
              type="text"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              placeholder="Contoh: Pengurus Forsil 99 / Panitia Reuni Perak"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>

          {/* Deskripsi Acara */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <FileText size={13} className="text-indigo-600" />
              <span>Deskripsi Acara & Susunan Kegiatan <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan tujuan acara, dress code, informasi kontribusi/HTM (jika ada), susunan rundown, dan ajakan reuni hangat untuk rekan alumni..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-brand-primary hover:from-blue-800 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isEdit ? 'Simpan Perubahan' : 'Publikasikan Agenda'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
