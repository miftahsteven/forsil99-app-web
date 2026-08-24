'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reportDeceasedAlumni } from '@/services/memorialService';
import { DeceasedAlumni } from '@/types';
import { X, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MemorialReportModalProps {
  deceased: DeceasedAlumni;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_CATEGORIES = [
  { id: 'invalid_data', label: 'Data Tidak Valid / Orang Masih Hidup' },
  { id: 'wrong_info', label: 'Informasi Keliru (Nama / Kelas / Tahun Wafat)' },
  { id: 'spam', label: 'Informasi Palsu / Hoaks / Spam' },
  { id: 'harassment', label: 'Pencemaran Nama Baik / Tidak Pantas' },
  { id: 'other', label: 'Alasan Lainnya' },
];

export function MemorialReportModal({
  deceased,
  isOpen,
  onClose,
}: MemorialReportModalProps) {
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState<string>('invalid_data');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Silakan masuk ke akun Anda terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await reportDeceasedAlumni({
        targetId: deceased.id,
        category,
        description: description.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          'Laporan Anda berhasil dikirim. Admin akan segera memverifikasi dan menghapus data jika terbukti tidak valid.'
        );
        onClose();
      } else {
        toast.error(res.message || 'Gagal mengirimkan laporan.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirimkan laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700/70 animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Flag size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 leading-tight">
                Laporkan Data Memorial
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Alm. {deceased.fullName} ({deceased.className || 'Alumni 99'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Pilih Alasan Laporan:
            </label>
            <div className="space-y-1.5">
              {REPORT_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    category === cat.id
                      ? 'border-rose-500 bg-rose-950/40 font-semibold text-rose-300'
                      : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportCategory"
                    value={cat.id}
                    checked={category === cat.id}
                    onChange={() => setCategory(cat.id)}
                    className="text-rose-500 focus:ring-rose-500"
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Keterangan Tambahan (Opsional):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan alasan mengapa data ini perlu ditinjau/dihapus oleh admin..."
              rows={3}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>Kirim Laporan ke Admin</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
