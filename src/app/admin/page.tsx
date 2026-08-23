'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/apiClient';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'reports'>('queue');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [queueRes, reportsRes] = await Promise.all([
        apiClient.get('/verification/queue').catch(() => ({ queue: [] })),
        apiClient.get('/reports').catch(() => ({ reports: [] })),
      ]);
      setQueue(queueRes.queue || []);
      setReports(reportsRes.reports || []);
    } catch {
      toast.error('Gagal memuat data antrean admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setIsProcessing(id);
    try {
      await apiClient.post(`/verification/${id}/review`, {
        action,
        adminNotes: `Ditinjau oleh admin pada ${new Date().toLocaleDateString('id-ID')}`,
      });
      toast.success(action === 'approve' ? 'Verifikasi disetujui!' : 'Verifikasi ditolak.');
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses verifikasi.');
    } finally {
      setIsProcessing(null);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title="Akses Dibatasi"
          description="Halaman ini hanya dapat diakses oleh Administrator dan Moderator Forsil 99."
          actionText="Kembali ke Beranda"
          onAction={() => (window.location.href = '/')}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-3 py-3 space-y-4">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-4 text-white shadow-card">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-amber-400" />
          <h1 className="text-lg font-bold">Portal Pengurus & Admin Forsil 99</h1>
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Validasi pendaftaran alumni baru dan pemeliharaan komunitas SMAN 59.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'queue'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Antrean Verifikasi ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          Laporan Konten ({reports.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-10 text-xs text-slate-400">Memuat data admin...</div>
      ) : activeTab === 'queue' ? (
        queue.length === 0 ? (
          <EmptyState
            icon={<UserCheck size={28} />}
            title="Tidak ada antrean verifikasi"
            description="Semua permohonan alumni telah selesai diproses."
          />
        ) : (
          <div className="space-y-3">
            {queue.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <AppAvatar name={req.fullName} size="md" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{req.fullName}</h3>
                    <p className="text-xs text-slate-500">
                      Kelas: <span className="font-semibold text-brand-primary">{req.className}</span> • Status: <span className="text-amber-600 font-medium">{req.status}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview(req.id, 'reject')}
                    disabled={isProcessing === req.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleReview(req.id, 'approve')}
                    disabled={isProcessing === req.id}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  >
                    Setujui Akun
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={28} />}
          title="Tidak ada laporan aktif"
          description="Komunitas alumni dalam keadaan kondusif dan aman."
        />
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div key={rep.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle size={14} /> Laporan {rep.targetType}
                </span>
                <span className="text-[10px] text-slate-400">{rep.status}</span>
              </div>
              <p className="text-xs text-slate-700">{rep.description || rep.category}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
