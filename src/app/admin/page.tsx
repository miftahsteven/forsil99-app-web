'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import {
  fetchPendingReferrals,
  approveRegistration,
  rejectRegistration,
} from '@/services/authService';
import { apiClient } from '@/services/apiClient';
import { AlumniRegistration } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  fetchAdminShopQueue,
  reviewShopRegistration,
} from '@/services/shopService';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Clock,
  Search,
  ExternalLink,
  X,
  Sparkles,
  Phone,
  Mail,
  User,
  GraduationCap,
  Calendar,
  Check,
  Store,
  ShoppingBag,
  Building,
  Heart,
  MapPin,
  Crown,
  BadgeCheck,
  FileCheck,
  Tag,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

const BUSINESS_CATEGORIES: Record<string, string> = {
  kuliner: '🍲 Kuliner, Makanan & Minuman',
  fashion: '👕 Fashion, Kaos & Busana',
  jasa_profesional: '💼 Jasa Profesional, Konsultan & Legal',
  gadget: '📱 Gadget, IT, Software & Elektronik',
  otomotif: '🚗 Otomotif, Bengkel & Sparepart',
  properti: '🏠 Properti, Arsitektur & Desain Interior',
  kesehatan: '💊 Kesehatan, Herbal & Perawatan',
  kerajinan: '🎨 Kerajinan, Souvenir & Percetakan',
  lainnya: '📦 Aneka Kebutuhan Lainnya',
};

export default function AdminVerificationPage() {
  const { user, profile, isAdmin, isAuthenticated } = useAuth();
  const { refreshNotifications } = useNotification();

  // State
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'admin_queue' | 'reports'>('pending');
  const [pendingList, setPendingList] = useState<AlumniRegistration[]>([]);
  const [historyList, setHistoryList] = useState<AlumniRegistration[]>([]);
  const [adminQueue, setAdminQueue] = useState<any[]>([]);
  const [sellerQueue, setSellerQueue] = useState<any[]>([]);
  const [adminQueueCategory, setAdminQueueCategory] = useState<'all' | 'seller' | 'alumni'>('seller');
  const [reports, setReports] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Detail Pendaftar Referral
  const [selectedApplicant, setSelectedApplicant] = useState<AlumniRegistration | null>(null);
  const [isPhotoZoomed, setIsPhotoZoomed] = useState<boolean>(false);

  // Modal Detail Pendaftar Seller 99
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);

  const accountId = user?.id || profile?.uid || '';

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, accountId, isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [
        // 1. Pending referrals for this user
        fetchPendingReferrals(accountId, 'submitted'),
        // 2. History of referrals for this user
        fetchPendingReferrals(accountId, 'all'),
      ];

      // 3. If admin, load full master queue, reports & seller queue
      if (isAdmin) {
        promises.push(apiClient.get('/verification/queue').catch(() => ({ requests: [] })));
        promises.push(apiClient.get('/reports').catch(() => ({ reports: [] })));
        promises.push(fetchAdminShopQueue().catch(() => []));
      }

      const [pendingRes, allRes, queueRes, reportsRes, sellerQueueRes] = await Promise.all(promises);

      setPendingList(pendingRes || []);
      const historyFiltered = (allRes || []).filter(
        (r: AlumniRegistration) => r.status === 'approved' || r.status === 'rejected'
      );
      setHistoryList(historyFiltered);

      if (isAdmin) {
        setAdminQueue(queueRes?.requests || queueRes?.queue || []);
        setReports(reportsRes?.reports || []);
        setSellerQueue(sellerQueueRes || []);
      }
    } catch {
      toast.error('Gagal memuat data verifikasi alumni.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reg: AlumniRegistration) => {
    setIsProcessing(reg.id);
    try {
      await approveRegistration(reg.id);
      toast.success(
        `Pendaftaran ${reg.fullName} berhasil disetujui! Email konfirmasi telah dikirimkan ke ${reg.googleEmail}.`
      );

      // Refresh list & global unread count
      setPendingList((prev) => prev.filter((item) => item.id !== reg.id));
      setHistoryList((prev) => [{ ...reg, status: 'approved' }, ...prev]);
      if (selectedApplicant?.id === reg.id) {
        setSelectedApplicant(null);
      }
      await refreshNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses persetujuan.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (reg: AlumniRegistration) => {
    if (!confirm(`Tolak permohonan verifikasi dari ${reg.fullName}?`)) return;
    setIsProcessing(reg.id);
    try {
      await rejectRegistration(reg.id);
      toast.success(`Pendaftaran ${reg.fullName} telah ditolak.`);

      setPendingList((prev) => prev.filter((item) => item.id !== reg.id));
      setHistoryList((prev) => [{ ...reg, status: 'rejected' }, ...prev]);
      if (selectedApplicant?.id === reg.id) {
        setSelectedApplicant(null);
      }
      await refreshNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menolak permohonan.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAdminQueueReview = async (id: string, action: 'approve' | 'reject') => {
    setIsProcessing(id);
    try {
      await apiClient.post(`/verification/${id}/review`, {
        action,
        reason: action === 'reject' ? 'Data tidak sesuai.' : undefined,
      });
      toast.success(action === 'approve' ? 'Verifikasi disetujui & email dikirim!' : 'Verifikasi ditolak.');
      loadData();
      await refreshNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses verifikasi admin.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSellerReview = async (shopId: string, action: 'approve' | 'reject') => {
    let reason: string | undefined;
    if (action === 'reject') {
      const input = prompt(
        'Masukkan alasan penolakan pendaftaran Seller 99 (opsional):',
        'Kelengkapan berkas lapak belum memenuhi kriteria komunitas.'
      );
      if (input === null) return; // Batal jika tekan cancel
      reason = input || 'Data lapak tidak sesuai ketentuan komunitas.';
    }

    setIsProcessing(shopId);
    try {
      await reviewShopRegistration(shopId, action, reason);
      toast.success(
        action === 'approve'
          ? 'Lapak Seller 99 berhasil divalidasi dan disetujui!'
          : 'Pendaftaran Lapak Seller 99 telah ditolak.'
      );
      const updatedQueue = await fetchAdminShopQueue().catch(() => []);
      setSellerQueue(updatedQueue);
      if (selectedSeller?.id === shopId) {
        setSelectedSeller((prev: any) =>
          prev ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' } : null
        );
      }
      await refreshNotifications();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses validasi pendaftaran seller.');
    } finally {
      setIsProcessing(null);
    }
  };

  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title="Masuk Diperlukan"
          description="Silakan masuk dengan akun alumni Anda untuk mengakses portal verifikasi."
          actionText="Masuk ke Akun"
          onAction={() => (window.location.href = '/login')}
        />
      </div>
    );
  }

  // Filter list by search query
  const filteredPending = pendingList.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nickname && item.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredHistory = historyList.filter(
    (item) =>
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full px-3 py-4 space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0d1c38] via-[#122852] to-[#1a3668] rounded-2xl p-4 sm:p-5 text-white shadow-card border border-sky-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck size={22} className="text-amber-400" />
              ) : (
                <UserCheck size={22} className="text-sky-400" />
              )}
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                {isAdmin ? 'Portal Pengurus & Verifikasi Forsil 99' : 'Portal Verifikasi Rekan Alumni'}
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              {isAdmin
                ? 'Kelola persetujuan referral alumni seangkatan, antrean pendaftaran master, dan pemeliharaan komunitas SMAN 59 Angkatan 1999.'
                : 'Validasi dan konfirmasi pendaftaran rekan alumni yang memilih Anda sebagai referensi pendaftaran Forsil 99.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{pendingList.length} Menunggu Persetujuan</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck size={14} />
          <span>Menunggu Persetujuan</span>
          {pendingList.length > 0 && (
            <span
              className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                activeTab === 'pending' ? 'bg-white text-brand-primary' : 'bg-rose-600 text-white'
              }`}
            >
              {pendingList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock size={14} />
          <span>Riwayat Verifikasi ({historyList.length})</span>
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('admin_queue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'admin_queue'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Antrean Admin ({adminQueue.length + sellerQueue.length})</span>
              {sellerQueue.some((s) => s.status === 'pending') && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle size={14} />
              <span>Laporan Konten ({reports.length})</span>
            </button>
          </>
        )}
      </div>

      {/* 3. Search Bar */}
      {(activeTab === 'pending' || activeTab === 'history') && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama alumni, nama panggilan, atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* 4. Main Tab Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-subtle animate-pulse flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="w-40 h-3.5 bg-slate-200 rounded" />
                <div className="w-24 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'pending' ? (
        /* ================= TAB 1: PENDING REFERRAL APPROVALS ================= */
        filteredPending.length === 0 ? (
          <EmptyState
            icon={<UserCheck size={32} className="text-emerald-500" />}
            title="Tidak ada permohonan referral yang menunggu"
            description="Saat calon alumni mendaftar dan memilih Anda sebagai referensi, profil lengkap mereka akan muncul di sini untuk Anda validasi."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 px-1 font-medium">
              Menampilkan <strong>{filteredPending.length} rekan alumni</strong> yang membutuhkan konfirmasi Anda:
            </p>

            {filteredPending.map((reg) => (
              <div
                key={reg.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-subtle hover:border-brand-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                {/* Left info */}
                <div
                  onClick={() => setSelectedApplicant(reg)}
                  className="flex items-start gap-3 cursor-pointer group flex-1 min-w-0"
                >
                  <div className="relative flex-shrink-0">
                    {reg.selfieBase64 || reg.selfieUrl ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-primary/30 group-hover:scale-105 transition-transform">
                        <img
                          src={reg.selfieBase64 || reg.selfieUrl}
                          alt={reg.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <AppAvatar name={reg.fullName} size="md" />
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      !
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-primary transition-colors">
                        {reg.fullName}
                      </h3>
                      {reg.nickname && (
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          &ldquo;{reg.nickname}&rdquo;
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="font-semibold text-brand-primary bg-blue-50 px-2 py-0.5 rounded-md">
                        {reg.className}
                      </span>
                      <span>WA: {reg.whatsapp}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Diajukan:{' '}
                      {reg.submittedAt
                        ? formatDistanceToNow(new Date(reg.submittedAt), {
                            addSuffix: true,
                            locale: localeId,
                          })
                        : 'Baru saja'}
                    </p>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    onClick={() => setSelectedApplicant(reg)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition active:scale-95"
                  >
                    Detail Profil
                  </button>

                  <button
                    onClick={() => handleReject(reg)}
                    disabled={isProcessing === reg.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition active:scale-95"
                  >
                    Tolak
                  </button>

                  <button
                    onClick={() => handleApprove(reg)}
                    disabled={isProcessing === reg.id}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition active:scale-95 flex items-center gap-1"
                  >
                    <Check size={14} />
                    <span>Setujui</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'history' ? (
        /* ================= TAB 2: VERIFICATION HISTORY ================= */
        filteredHistory.length === 0 ? (
          <EmptyState
            icon={<Clock size={28} />}
            title="Belum ada riwayat verifikasi"
            description="Permohonan yang telah Anda setujui atau tolak akan dicatat di sini."
          />
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((reg) => (
              <div
                key={reg.id}
                onClick={() => setSelectedApplicant(reg)}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-subtle flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AppAvatar
                    src={reg.selfieBase64 || reg.selfieUrl}
                    name={reg.fullName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{reg.fullName}</h4>
                    <p className="text-xs text-slate-500">
                      Kelas: <span className="font-semibold text-slate-700">{reg.className}</span> • {reg.whatsapp}
                    </p>
                  </div>
                </div>

                <div>
                  {reg.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <CheckCircle2 size={13} /> Disetujui
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
                      <XCircle size={13} /> Ditolak
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'admin_queue' ? (
        /* ================= TAB 3: ADMIN MASTER QUEUE (ALUMNI & SELLER 99) ================= */
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-subtle">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setAdminQueueCategory('seller')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  adminQueueCategory === 'seller'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Store size={14} />
                <span>Daftar Seller 99</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                    adminQueueCategory === 'seller' ? 'bg-white text-amber-700' : 'bg-amber-600 text-white'
                  }`}
                >
                  {sellerQueue.length}
                </span>
                {sellerQueue.some((s) => s.status === 'pending') && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setAdminQueueCategory('alumni')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  adminQueueCategory === 'alumni'
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <GraduationCap size={14} />
                <span>Pendaftaran Alumni</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                    adminQueueCategory === 'alumni' ? 'bg-white text-brand-primary' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {adminQueue.length}
                </span>
              </button>

              <button
                onClick={() => setAdminQueueCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  adminQueueCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({sellerQueue.length + adminQueue.length})
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Kategori:{' '}
              <strong className="text-slate-800">
                {adminQueueCategory === 'seller'
                  ? 'Daftar Seller 99'
                  : adminQueueCategory === 'alumni'
                  ? 'Pendaftaran Alumni'
                  : 'Semua Antrean'}
              </strong>
            </div>
          </div>

          {/* Render Seller 99 Queue */}
          {(adminQueueCategory === 'seller' || adminQueueCategory === 'all') && (
            <div className="space-y-3">
              {adminQueueCategory === 'all' && (
                <div className="flex items-center gap-2 pt-2 text-xs font-bold text-amber-900">
                  <Store size={15} className="text-amber-600" />
                  <span>Antrean Daftar Seller 99 ({sellerQueue.length})</span>
                </div>
              )}

              {sellerQueue.length === 0 ? (
                adminQueueCategory === 'seller' && (
                  <EmptyState
                    icon={<Store size={32} className="text-amber-500" />}
                    title="Tidak ada pendaftaran Seller 99"
                    description="Saat ada rekan alumni yang mendaftarkan usaha / lapak 99, data permohonan akan muncul di sini untuk divalidasi secara manual oleh admin."
                  />
                )
              ) : (
                sellerQueue.map((shop) => {
                  const owner = shop.owner;
                  const alumniProfile = owner?.profile;
                  const fullName = alumniProfile?.fullName || shop.ownerName || owner?.name || 'Alumni 59';
                  const nickname = alumniProfile?.nickname || shop.ownerNickname;
                  const nia = alumniProfile?.nia || shop.ownerNia || '-';
                  const className = alumniProfile?.className || shop.ownerClassName || '1999';
                  const photoUrl = alumniProfile?.profilePhotoUrl || alumniProfile?.avatarUrl || shop.ownerPhotoUrl;
                  const email = owner?.email || shop.ownerEmail || '-';
                  const phone = alumniProfile?.whatsappNumber || alumniProfile?.whatsapp || owner?.phoneNumber || owner?.phone || shop.ownerPhone || '';
                  const domicile = alumniProfile?.city || alumniProfile?.currentAddress || shop.ownerCity || shop.ownerAddress || '-';
                  const shopAddress = shop.address || alumniProfile?.currentAddress || shop.ownerAddress || 'Belum mengisi alamat';
                  const profileCat = alumniProfile?.profileCategory || alumniProfile?.profilePrivacyCategory || shop.ownerProfileCategory || 'extrov';
                  const isSuperExtrov = profileCat === 'super_extrov';
                  const isExtrov = profileCat === 'extrov';
                  const profileId = alumniProfile?.id || alumniProfile?.userId || shop.ownerId || owner?.id;
                  const categoryName =
                    BUSINESS_CATEGORIES[shop.categoryIds?.[0]] || shop.categoryIds?.[0] || 'Aneka Usaha';
                  const shopPhone = shop.contactPhone || shop.whatsapp || phone || '';

                  return (
                    <div
                      key={shop.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:border-amber-400/60 transition-all overflow-hidden"
                    >
                      {/* Top Bar: Shop Name + Category + Status */}
                      <div className="p-4 bg-gradient-to-r from-amber-50/50 via-slate-50/50 to-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                            <Store size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-slate-900">{shop.name}</h3>
                              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                                {categoryName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Diajukan:{' '}
                              {shop.createdAt
                                ? formatDistanceToNow(new Date(shop.createdAt), {
                                    addSuffix: true,
                                    locale: localeId,
                                  })
                                : 'Baru saja'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {shop.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>Lapak Terverifikasi & Aktif</span>
                            </span>
                          ) : shop.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 shadow-xs">
                              <XCircle size={13} className="text-rose-600" />
                              <span>Pendaftaran Ditolak</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span>Menunggu Validasi Manual</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content Grid: 2 Columns (Profil Alumni & Profil Lapak Seller 99) */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kolom 1: Profil Alumni Pendaftar */}
                        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2.5">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <GraduationCap size={13} className="text-brand-primary" />
                                <span>Profil Alumni Pendaftar</span>
                              </span>
                              {profileId && (
                                <Link
                                  href={`/profile/${profileId}`}
                                  target="_blank"
                                  className="text-[11px] font-semibold text-brand-primary hover:underline flex items-center gap-1"
                                >
                                  <span>Buka Profil</span>
                                  <ExternalLink size={10} />
                                </Link>
                              )}
                            </div>

                            <div className="flex items-start gap-3">
                              <AppAvatar
                                src={photoUrl}
                                name={fullName}
                                size="md"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                    {fullName}
                                  </h4>
                                  {nickname && (
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      &ldquo;{nickname}&rdquo;
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {isSuperExtrov && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">
                                      <Crown size={10} className="fill-amber-500" />
                                      <span>Super Extrov</span>
                                    </span>
                                  )}
                                  {isExtrov && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.5 rounded">
                                      <BadgeCheck size={11} className="fill-sky-500 text-white" />
                                      <span>Extrov</span>
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded">
                                    NIA: {nia}
                                  </span>
                                  <span className="text-[10px] font-semibold text-brand-primary bg-blue-50 px-1.5 py-0.5 rounded">
                                    {className}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Details List */}
                            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                  <Mail size={12} /> Email:
                                </span>
                                <span className="font-medium text-slate-800 truncate text-[11px]">
                                  {email}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                  <Phone size={12} /> WhatsApp:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-[11px]">
                                    {phone || '-'}
                                  </span>
                                  {phone && (
                                    <a
                                      href={formatWhatsAppLink(phone)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] flex items-center gap-0.5 transition"
                                    >
                                      <MessageSquare size={9} />
                                      <span>WA</span>
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                  <MapPin size={12} /> Domisili:
                                </span>
                                <span className="font-medium text-slate-800 text-right truncate text-[11px]">
                                  {domicile}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Kolom 2: Profil Lapak Seller 99 */}
                        <div className="bg-amber-50/40 rounded-xl p-3.5 border border-amber-200/60 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between pb-2 border-b border-amber-200/50 mb-2.5">
                              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Store size={13} className="text-amber-600" />
                                <span>Profil Lapak Seller 99</span>
                              </span>
                              <span className="text-[10px] font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                ID: {shop.id.slice(0, 8)}...
                              </span>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  Nama Usaha / Brand
                                </span>
                                <p className="font-bold text-slate-900 text-xs sm:text-sm">{shop.name}</p>
                              </div>

                              <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  Kategori Usaha / Bidang
                                </span>
                                <p className="font-medium text-slate-800 text-xs">{categoryName}</p>
                              </div>

                              <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                  Alamat Usaha / Workshop / Lokasi
                                </span>
                                <p className="text-slate-700 text-[11px] bg-white/80 p-2 rounded-lg border border-amber-200/50 mt-0.5 leading-relaxed">
                                  {shopAddress}
                                </p>
                              </div>

                              {/* Donatur Komitmen */}
                              <div className="pt-1">
                                {shop.isDonator ? (
                                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px]">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                                      <Heart size={13} className="text-emerald-600 fill-emerald-500" />
                                      <span>Bersedia Menjadi Donatur Penjualan</span>
                                    </div>
                                    <p className="mt-0.5 text-emerald-700">
                                      Komitmen: <strong>{shop.donationNote || '2.5% dari keuntungan'}</strong>
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-2 bg-slate-100/80 border border-slate-200 rounded-lg text-slate-600 text-[11px]">
                                    ⚪ Tidak bersedia berdonasi saat ini
                                  </div>
                                )}
                              </div>

                              {/* Persetujuan Syarat */}
                              <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 text-[11px] flex items-center gap-1.5">
                                <FileCheck size={14} className="text-sky-600 flex-shrink-0" />
                                <span>Menyetujui SOP Kurasi Lapak 99 & Kepatuhan Hukum Komunitas</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          onClick={() => setSelectedSeller(shop)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-xs w-full sm:w-auto justify-center"
                        >
                          <Eye size={13} />
                          <span>Detail Lengkap Pendaftaran</span>
                        </button>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {shop.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleSellerReview(shop.id, 'reject')}
                                disabled={isProcessing === shop.id}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition active:scale-95 border border-rose-200 flex items-center gap-1"
                              >
                                <X size={14} />
                                <span>Tolak</span>
                              </button>

                              <button
                                onClick={() => handleSellerReview(shop.id, 'approve')}
                                disabled={isProcessing === shop.id}
                                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition active:scale-95 flex items-center gap-1.5"
                              >
                                <Check size={14} />
                                <span>Setujui & Validasi Lapak</span>
                              </button>
                            </>
                          ) : shop.status === 'approved' ? (
                            <button
                              onClick={() => handleSellerReview(shop.id, 'reject')}
                              disabled={isProcessing === shop.id}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition"
                            >
                              Cabut Izin / Nonaktifkan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSellerReview(shop.id, 'approve')}
                              disabled={isProcessing === shop.id}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 transition"
                            >
                              Setujui Ulang Lapak
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Render Alumni Queue */}
          {(adminQueueCategory === 'alumni' || adminQueueCategory === 'all') && (
            <div className="space-y-3">
              {adminQueueCategory === 'all' && (
                <div className="flex items-center gap-2 pt-4 text-xs font-bold text-slate-800">
                  <GraduationCap size={15} className="text-brand-primary" />
                  <span>Antrean Pendaftaran Akun Alumni ({adminQueue.length})</span>
                </div>
              )}

              {adminQueue.length === 0 ? (
                adminQueueCategory === 'alumni' && (
                  <EmptyState
                    icon={<ShieldCheck size={28} />}
                    title="Tidak ada antrean pendaftaran alumni"
                    description="Semua akun alumni telah tervalidasi dengan baik."
                  />
                )
              ) : (
                adminQueue.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <AppAvatar name={req.fullName} size="md" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{req.fullName}</h3>
                        <p className="text-xs text-slate-500">
                          Kelas: <span className="font-semibold text-brand-primary">{req.className}</span> • ID: {req.uid}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdminQueueReview(req.id, 'reject')}
                        disabled={isProcessing === req.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleAdminQueueReview(req.id, 'approve')}
                        disabled={isProcessing === req.id}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      >
                        Setujui Akun
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* ================= TAB 4: MODERATION REPORTS ================= */
        reports.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={28} />}
            title="Tidak ada laporan aktif"
            description="Komunitas alumni dalam keadaan kondusif dan tertib."
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
        )
      )}

      {/* 5. Detail Modal Dialog for Referral Validation */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <UserCheck size={20} className="text-brand-primary" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Validasi Profil Calon Alumni
                </h3>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Photo Preview */}
              <div className="flex flex-col items-center">
                {selectedApplicant.selfieBase64 || selectedApplicant.selfieUrl ? (
                  <div className="relative group">
                    <div
                      className={`overflow-hidden rounded-2xl border-2 border-brand-primary/40 shadow-md bg-slate-100 transition-all ${
                        isPhotoZoomed ? 'w-64 h-64 sm:w-80 sm:h-80' : 'w-36 h-36 sm:w-40 sm:h-40'
                      }`}
                    >
                      <img
                        src={selectedApplicant.selfieBase64 || selectedApplicant.selfieUrl}
                        alt={selectedApplicant.fullName}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 text-center mt-1.5">
                      Klik foto untuk {isPhotoZoomed ? 'memperkecil' : 'memperbesar'}
                    </p>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                    <User size={36} className="text-slate-400" />
                  </div>
                )}

                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-3 text-center">
                  {selectedApplicant.fullName}
                </h2>
                {selectedApplicant.nickname && (
                  <p className="text-xs text-slate-500 font-medium">
                    Nama Panggilan Sekolah: &ldquo;<strong>{selectedApplicant.nickname}</strong>&rdquo;
                  </p>
                )}
              </div>

              {/* Data Grid */}
              <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <GraduationCap size={15} /> Kelas Terakhir (1999)
                  </span>
                  <span className="font-bold text-brand-primary bg-blue-50 px-2 py-0.5 rounded">
                    {selectedApplicant.className}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail size={15} /> Akun Email Google
                  </span>
                  <span className="font-medium text-slate-800 break-all text-right">
                    {selectedApplicant.googleEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone size={15} /> Nomor WhatsApp
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{selectedApplicant.whatsapp}</span>
                    <a
                      href={formatWhatsAppLink(selectedApplicant.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition active:scale-95 shadow-xs"
                      title="Kirim pesan langsung ke calon alumni"
                    >
                      <MessageSquare size={11} />
                      <span>Chat WA</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar size={15} /> Waktu Pendaftaran
                  </span>
                  <span className="text-slate-600">
                    {selectedApplicant.submittedAt
                      ? format(new Date(selectedApplicant.submittedAt), 'dd MMMM yyyy, HH:mm', {
                          locale: localeId,
                        })
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Validation Advice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Tips Verifikasi:</strong> Pastikan Anda benar-benar mengenali foto dan identitas alumni di atas sebagai teman seangkatan Anda di SMAN 59 Angkatan 1999. Anda dapat mengklik tombol <strong>Chat WA</strong> di atas untuk menyapa terlebih dahulu.
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
              >
                Tutup
              </button>

              {selectedApplicant.status === 'submitted' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(selectedApplicant)}
                    disabled={isProcessing === selectedApplicant.id}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition active:scale-95"
                  >
                    Tolak Permohonan
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApplicant)}
                    disabled={isProcessing === selectedApplicant.id}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>Setujui Alumni</span>
                  </button>
                </div>
              ) : (
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    selectedApplicant.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Status: {selectedApplicant.status === 'approved' ? 'Telah Disetujui' : 'Telah Ditolak'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Detail Modal Dialog for Seller 99 Registration Validation */}
      {selectedSeller && (() => {
        const owner = selectedSeller.owner;
        const alumniProfile = owner?.profile;
        const fullName = alumniProfile?.fullName || selectedSeller.ownerName || owner?.name || 'Alumni 59';
        const nickname = alumniProfile?.nickname || selectedSeller.ownerNickname;
        const nia = alumniProfile?.nia || selectedSeller.ownerNia || '-';
        const className = alumniProfile?.className || selectedSeller.ownerClassName || '1999';
        const photoUrl = alumniProfile?.profilePhotoUrl || alumniProfile?.avatarUrl || selectedSeller.ownerPhotoUrl;
        const email = owner?.email || selectedSeller.ownerEmail || '-';
        const phone = alumniProfile?.whatsappNumber || alumniProfile?.whatsapp || owner?.phoneNumber || owner?.phone || selectedSeller.ownerPhone || '';
        const domicile = alumniProfile?.city || alumniProfile?.currentAddress || selectedSeller.ownerCity || selectedSeller.ownerAddress || '-';
        const shopAddress = selectedSeller.address || alumniProfile?.currentAddress || selectedSeller.ownerAddress || 'Belum mengisi alamat';
        const profileCat = alumniProfile?.profileCategory || alumniProfile?.profilePrivacyCategory || selectedSeller.ownerProfileCategory || 'extrov';
        const isSuperExtrov = profileCat === 'super_extrov';
        const isExtrov = profileCat === 'extrov';
        const profileId = alumniProfile?.id || alumniProfile?.userId || selectedSeller.ownerId || owner?.id;
        const shopPhone = selectedSeller.contactPhone || selectedSeller.whatsapp || selectedSeller.ownerPhone || phone || '';
        const categoryName =
          BUSINESS_CATEGORIES[selectedSeller.categoryIds?.[0]] || selectedSeller.categoryIds?.[0] || 'Aneka Usaha';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-slate-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Store size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Validasi Pendaftaran Seller 99
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Verifikasi manual data profil alumni dan identitas lapak usaha
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                {/* Top Banner: Status */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Status Permohonan:</span>
                    {selectedSeller.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Disetujui & Aktif
                      </span>
                    ) : selectedSeller.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full">
                        <XCircle size={12} /> Ditolak
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                        <Clock size={12} /> Menunggu Validasi Manual Admin
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {selectedSeller.createdAt
                      ? format(new Date(selectedSeller.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })
                      : '-'}
                  </span>
                </div>

                {/* SECTION 1: PROFIL ALUMNI */}
                <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-brand-primary" />
                      <span>Profil Alumni Pemilik Lapak</span>
                    </span>
                    {profileId && (
                      <Link
                        href={`/profile/${profileId}`}
                        target="_blank"
                        className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
                      >
                        <span>Buka Profil Alumni</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <AppAvatar
                      src={photoUrl}
                      name={fullName}
                      size="lg"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900">
                          {fullName}
                        </h4>
                        {nickname && (
                          <span className="text-xs text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                            &ldquo;{nickname}&rdquo;
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {isSuperExtrov && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded">
                            <Crown size={12} className="fill-amber-500" />
                            <span>Super Extrov (Memenuhi Syarat)</span>
                          </span>
                        )}
                        {isExtrov && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded">
                            <BadgeCheck size={12} className="fill-sky-500 text-white" />
                            <span>Extrov (Memenuhi Syarat)</span>
                          </span>
                        )}
                        <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          NIA: {nia}
                        </span>
                        <span className="font-semibold text-brand-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Kelas: {className}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-700">
                    <div className="p-2 bg-white rounded-xl border border-slate-200/70 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Mail size={11} /> Email Google
                      </span>
                      <p className="font-medium text-slate-900 break-all">{email}</p>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-slate-200/70 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Phone size={11} /> Nomor WhatsApp
                      </span>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">
                          {phone || '-'}
                        </p>
                        {phone && (
                          <a
                            href={formatWhatsAppLink(phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1"
                          >
                            <MessageSquare size={10} />
                            <span>Chat WA</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-slate-200/70 space-y-0.5 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <MapPin size={11} /> Alamat Domisili Alumni
                      </span>
                      <p className="font-medium text-slate-900">
                        {domicile}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PROFIL LAPAK SELLER 99 */}
                <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/70">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Store size={15} className="text-amber-600" />
                      <span>Profil Lapak Usaha Seller 99</span>
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      ID Lapak: {selectedSeller.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-amber-200/60 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Nama Usaha / Brand / Toko
                      </span>
                      <p className="font-bold text-sm text-slate-900">{selectedSeller.name}</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-amber-200/60 space-y-0.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Kategori Usaha / Bidang
                      </span>
                      <p className="font-semibold text-amber-900">
                        {categoryName}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-amber-200/60 space-y-0.5 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Alamat Usaha / Workshop / Lokasi Operasional
                      </span>
                      <p className="font-medium text-slate-800 leading-relaxed">
                        {shopAddress}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-amber-200/60 space-y-0.5 sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        WhatsApp Bisnis Toko
                      </span>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">
                          {shopPhone || '-'}
                        </p>
                        {shopPhone && (
                          <a
                            href={formatWhatsAppLink(shopPhone)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition"
                          >
                            <MessageSquare size={12} />
                            <span>Chat WA Toko</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Komitmen Donatur */}
                  <div className="pt-1">
                    {selectedSeller.isDonator ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <Heart size={15} className="text-emerald-600 fill-emerald-500" />
                          <span>Bersedia Menjadi Donatur Forsil 99 Melalui Penjualan</span>
                        </div>
                        <p className="mt-1 text-slate-700 text-[11px]">
                          Keterangan / Komitmen Donasi Sukarela:{' '}
                          <strong>{selectedSeller.donationNote || '2.5% dari keuntungan penjualan'}</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-600 text-xs">
                        ⚪ Tidak bersedia menjadi donatur saat ini
                      </div>
                    )}
                  </div>

                  {/* Persetujuan Kurasi */}
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-start gap-2">
                    <FileCheck size={16} className="text-sky-600 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <strong>Persetujuan Syarat & Ketentuan Periklanan Lapak 99:</strong>
                      <p className="text-sky-800 mt-0.5">
                        Pendaftar menyetujui validasi kurasi tim lapak 99, kepatuhan aturan Forsil 99 & hukum
                        Indonesia, serta sanksi penangguhan akun seller jika melanggar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validation Advice */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Panduan Validasi Manual Admin:</strong> Pastikan jenis usaha dan produk yang diajukan
                  rekan alumni di atas aman, bermanfaat, dan sesuai dengan etika komunitas alumni Forsil 99 SMAN 59
                  Jakarta. Klik tombol <strong>Setujui & Validasi Lapak</strong> di bawah untuk mengaktifkan lapak
                  secara resmi.
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedSeller(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
                >
                  Tutup
                </button>

                <div className="flex items-center gap-2">
                  {selectedSeller.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleSellerReview(selectedSeller.id, 'reject')}
                        disabled={isProcessing === selectedSeller.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition active:scale-95 border border-rose-200"
                      >
                        Tolak Pendaftaran
                      </button>
                      <button
                        onClick={() => handleSellerReview(selectedSeller.id, 'approve')}
                        disabled={isProcessing === selectedSeller.id}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Check size={16} />
                        <span>Setujui & Validasi Lapak</span>
                      </button>
                    </>
                  ) : selectedSeller.status === 'approved' ? (
                    <button
                      onClick={() => handleSellerReview(selectedSeller.id, 'reject')}
                      disabled={isProcessing === selectedSeller.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition"
                    >
                      Cabut Izin / Nonaktifkan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSellerReview(selectedSeller.id, 'approve')}
                      disabled={isProcessing === selectedSeller.id}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 transition"
                    >
                      Setujui Ulang Lapak
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
