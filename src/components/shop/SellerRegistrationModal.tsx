'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { registerSellerShop, fetchMyShop } from '@/services/shopService';
import { Shop } from '@/types';
import {
  Store,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  MapPin,
  Heart,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  Scale,
  Ban,
  BadgeAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface SellerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (shop: Shop) => void;
  initialShop?: Shop | null;
}

const BUSINESS_CATEGORIES = [
  { id: 'kuliner', label: '🍲 Kuliner, Makanan & Minuman' },
  { id: 'fashion', label: '👕 Fashion, Kaos & Busana' },
  { id: 'jasa_profesional', label: '💼 Jasa Profesional, Konsultan & Legal' },
  { id: 'gadget', label: '📱 Gadget, IT, Software & Elektronik' },
  { id: 'otomotif', label: '🚗 Otomotif, Bengkel & Sparepart' },
  { id: 'properti', label: '🏠 Properti, Arsitektur & Desain Interior' },
  { id: 'kesehatan', label: '💊 Kesehatan, Herbal & Perawatan' },
  { id: 'kerajinan', label: '🎨 Kerajinan, Souvenir & Percetakan' },
  { id: 'lainnya', label: '📦 Aneka Kebutuhan Lainnya' },
];

export function SellerRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  initialShop,
}: SellerRegistrationModalProps) {
  const { user, profile, updateCurrentProfileState } = useAuth();

  const [businessName, setBusinessName] = useState<string>('');
  const [businessCategory, setBusinessCategory] = useState<string>('kuliner');
  const [businessAddress, setBusinessAddress] = useState<string>(
    profile?.currentAddress || ''
  );
  const [isDonator, setIsDonator] = useState<boolean>(true);
  const [donationNote, setDonationNote] = useState<string>('2.5% dari keuntungan penjualan');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasExistingShop, setHasExistingShop] = useState<boolean>(Boolean(initialShop));

  useEffect(() => {
    if (!isOpen) return;

    if (initialShop) {
      setBusinessName(initialShop.name || '');
      setBusinessCategory(initialShop.categoryIds?.[0] || 'kuliner');
      setBusinessAddress(initialShop.address || profile?.currentAddress || '');
      setIsDonator(initialShop.isDonator ?? true);
      setDonationNote(initialShop.donationNote || '2.5% dari keuntungan penjualan');
      setTermsAccepted(true);
      setHasExistingShop(true);
    } else {
      fetchMyShop().then((shop) => {
        if (shop) {
          setBusinessName(shop.name || '');
          setBusinessCategory(shop.categoryIds?.[0] || 'kuliner');
          setBusinessAddress(shop.address || profile?.currentAddress || '');
          setIsDonator(shop.isDonator ?? true);
          setDonationNote(shop.donationNote || '2.5% dari keuntungan penjualan');
          setTermsAccepted(true);
          setHasExistingShop(true);
        } else {
          setBusinessName('');
          setBusinessCategory('kuliner');
          setBusinessAddress(profile?.currentAddress || '');
          setIsDonator(true);
          setDonationNote('2.5% dari keuntungan penjualan');
          setTermsAccepted(false);
          setHasExistingShop(false);
        }
      });
    }
  }, [isOpen, initialShop, profile?.currentAddress]);

  if (!isOpen) return null;

  // Syarat 1: Kelengkapan data profil alumni
  const hasFullName = Boolean(profile?.fullName?.trim());
  const hasClass = Boolean(profile?.className?.trim());
  const hasContact = Boolean(user?.phoneNumber || profile?.whatsappNumber);
  const hasLocation = Boolean(profile?.currentAddress?.trim() || profile?.city?.trim());

  const isProfileComplete = hasFullName && hasClass && hasContact && hasLocation;

  // Syarat 2: Minimal kategori profil Connected Alumni (connected/open atau extrov/super_extrov)
  const isConnectedOrOpen =
    profile?.profileCategory === 'connected' ||
    profile?.profileCategory === 'open' ||
    profile?.profileCategory === 'extrov' ||
    profile?.profileCategory === 'super_extrov';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isProfileComplete) {
      toast.error('Mohon lengkapi data profil alumni Anda terlebih dahulu.');
      return;
    }

    if (!isConnectedOrOpen) {
      toast.error('Minimal kategori profil harus Connected Alumni untuk membuka lapak Seller 99.');
      return;
    }

    if (!businessName.trim()) {
      toast.error('Nama usaha wajib diisi.');
      return;
    }

    if (!businessAddress.trim()) {
      toast.error('Alamat usaha wajib diisi.');
      return;
    }

    if (!termsAccepted) {
      toast.error('Anda wajib menyetujui Syarat & Ketentuan Periklanan Lapak Seller 99.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerSellerShop({
        name: businessName.trim(),
        categoryIds: [businessCategory],
        address: businessAddress.trim(),
        isDonator,
        donationNote: isDonator ? donationNote : undefined,
        termsAccepted: true,
        description: `Lapak resmi ${businessName.trim()} oleh ${profile?.fullName} (Alumni SMAN 59 '99)`,
        city: profile?.city || 'Jakarta',
        contactPhone: profile?.whatsappNumber || user?.phoneNumber,
        businessType: 'product',
      });

      if (res && res.shop) {
        toast.success(res.message || 'Selamat! Akun Seller 99 Anda aktif.');
        updateCurrentProfileState({ sellerStatus: 'approved' });
        if (onSuccess) onSuccess(res.shop);
        onClose();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal mendaftar Seller 99.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-scale-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center shadow-xs">
              <Store size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {hasExistingShop ? 'Edit Data Lapak Seller 99' : 'Pendaftaran Akun Seller 99'}
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                Direktori Usaha & Lapak Alumni SMAN 59 Jakarta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs">
          {/* A. PREREQUISITE CHECK 1: Kelengkapan Data Alumni */}
          {!isProfileComplete && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Lengkapi Profil Alumni Terlebih Dahulu
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Untuk menjamin keaslian dan kepercayaan pembeli sesama rekan alumni, seluruh calon Seller 99 wajib melengkapi data pokok profil alumni sebelum membuka lapak.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-rose-100">
                  {hasFullName ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                  <span className={hasFullName ? 'text-slate-800' : 'text-rose-700 font-semibold'}>
                    Nama Lengkap
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-rose-100">
                  {hasClass ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                  <span className={hasClass ? 'text-slate-800' : 'text-rose-700 font-semibold'}>
                    Kelas SMAN 59
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-rose-100">
                  {hasContact ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                  <span className={hasContact ? 'text-slate-800' : 'text-rose-700 font-semibold'}>
                    No. WhatsApp Aktif
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-rose-100">
                  {hasLocation ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-500" />
                  )}
                  <span className={hasLocation ? 'text-slate-800' : 'text-rose-700 font-semibold'}>
                    Domisili / Kota
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/profile/edit"
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Lengkapi Profil Alumni Sekarang</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* B. PREREQUISITE CHECK 2: Minimal Kategori Profil Connected Alumni */}
          {isProfileComplete && !isConnectedOrOpen && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <BadgeAlert size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Minimal Kategori Profil Connected Alumni Diperlukan
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Kategori profil Anda saat ini adalah{' '}
                    <strong className="text-amber-900 uppercase">
                      {profile?.profileCategory === 'private' || profile?.profileCategory === 'introv'
                        ? 'Private Alumni'
                        : 'New Alumni (Data Belum Lengkap)'}
                    </strong>
                    . Pendaftaran Seller 99 mewajibkan profil minimal kategori{' '}
                    <strong className="text-brand-primary">Connected Alumni</strong> (atau{' '}
                    <strong className="text-amber-600">Open Alumni</strong>) agar kontak WhatsApp dan identitas penjual dapat dihubungi serta diverifikasi oleh calon pembeli rekan alumni.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/profile/edit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Ubah Kategori Profil ke Connected Alumni di Sini</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* C. FORM PENDAFTARAN SELLER 99 */}
          {isProfileComplete && isConnectedOrOpen && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Syarat Memenuhi Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>
                  Profil alumni Anda telah lengkap & berkategori{' '}
                  <strong className="capitalize font-bold">
                    {profile?.profileCategory === 'open' || profile?.profileCategory === 'super_extrov'
                      ? 'Open Alumni (👑)'
                      : 'Connected Alumni (🔷)'}
                  </strong>. Anda memenuhi syarat menjadi Seller 99!
                </span>
              </div>

              {/* a. Nama Usaha */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block text-xs">
                  a. Nama Usaha / Brand / Toko <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Contoh: Kopi Nostalgia 59, Dapur Bu Siti, Jasa Konsultan IT..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
                />
              </div>

              {/* b. Kategori Usaha */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block text-xs">
                  b. Kategori Usaha / Bidang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* c. Alamat Usaha */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block text-xs">
                  c. Alamat Usaha / Workshop / Lokasi Operasional <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Alamat toko, workshop, ruko, atau alamat operasional usaha Anda..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
                />
              </div>

              {/* d. Pilihan Donatur */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-rose-500 flex-shrink-0" />
                  <label className="font-bold text-slate-900 block text-xs">
                    d. Kesediaan Menjadi Donatur Forsil 99 Melalui Penjualan
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Apakah Anda bersedia menyisihkan sebagian keuntungan dari barang/jasa yang terjual untuk kas sosial & santunan alumni Forsil 99?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDonator(true)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isDonator
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Heart size={13} className={isDonator ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'} />
                        <span>Ya, Bersedia</span>
                      </span>
                      {isDonator && <CheckCircle2 size={15} className="text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Menyisihkan sebagian hasil untuk kas sosial & reuni alumni.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDonator(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !isDonator
                        ? 'border-slate-400 bg-slate-100 text-slate-900 ring-1 ring-slate-400'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <X size={13} className="text-slate-500" />
                        <span>Tidak Saat Ini</span>
                      </span>
                      {!isDonator && <CheckCircle2 size={15} className="text-slate-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      User boleh memilih Tidak tanpa mempengaruhi persetujuan akun.
                    </p>
                  </button>
                </div>

                {isDonator && (
                  <div className="pt-2">
                    <label className="text-[11px] font-semibold text-emerald-900 block mb-1">
                      Keterangan / Komitmen Donasi Sukarela:
                    </label>
                    <input
                      type="text"
                      value={donationNote}
                      onChange={(e) => setDonationNote(e.target.value)}
                      placeholder="Contoh: 2.5% dari keuntungan, Rp 5.000 per transaksi, dll."
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                )}
              </div>

              {/* e. Terms and Conditions & Persyaratan Periklanan Seller Standar Komunitas */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-amber-700 flex-shrink-0" />
                  <h4 className="font-bold text-slate-900 text-xs">
                    e. Syarat & Ketentuan Periklanan Lapak Seller 99 (Standar Komunitas)
                  </h4>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 text-[11px] text-slate-600 space-y-2.5 max-h-48 overflow-y-auto leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Sebagai bagian dari ekosistem komunitas Forsil 99 SMAN 59 Jakarta, setiap Seller 99 tunduk pada ketentuan berikut:
                  </p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <span className="font-bold text-amber-800 flex-shrink-0">1.</span>
                      <span>
                        <strong>Validasi Kurasi Tim Lapak 99</strong>: Seluruh barang, produk, atau jasa yang diposting akan divalidasi terlebih dahulu oleh Tim Kurasi Lapak 99 untuk memastikan keaslian data, kepatutan materi, dan kesesuaian kategori.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-amber-800 flex-shrink-0">2.</span>
                      <span>
                        <strong>Kepatuhan Aturan Forsil 99 & Hukum Indonesia</strong>: Seller wajib mengikuti tata tertib komunitas alumni dan mematuhi seluruh hukum serta regulasi yang berlaku di Republik Indonesia.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-amber-800 flex-shrink-0">3.</span>
                      <span>
                        <strong>Larangan Keras Barang Ilegal / Terlarang</strong>: Dilarang menjual barang yang melanggar hukum, seperti narkotika, miras ilegal, senjata, barang tiruan/palsu/bajakan, konten pornografi, perjudian online, skema ponzi, serta obat-obatan tanpa izin edar BPOM.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-amber-800 flex-shrink-0">4.</span>
                      <span>
                        <strong>Sanksi Khusus Akun Seller</strong>: Jika diketahui melanggar aturan, sanksi tegas yang dijatuhkan adalah <strong>penangguhan/pembekuan akun Seller 99</strong> (bukan akun profil alumni). Profil alumni tetap aktif untuk silaturahmi.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-amber-800 flex-shrink-0">5.</span>
                      <span>
                        <strong>Etika Periklanan Komunitas</strong>: Seller wajib memberikan deskripsi produk yang jujur, transparan mengenai harga, menjaga amanah transaksi sesama alumni, dan menyelesaikan komplain pembeli secara kekeluargaan.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkbox Persetujuan Terms */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-700 border-slate-300 focus:ring-amber-500 flex-shrink-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-700 group-hover:text-slate-900 leading-snug">
                    Saya menyetujui seluruh <strong>Syarat & Ketentuan Periklanan Lapak Seller 99</strong>, bersedia produk/jasa saya divalidasi oleh tim Lapak 99, dan memahami ketentuan penangguhan akun seller jika terbukti melanggar hukum.
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                    isSubmitting || !termsAccepted
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  }`}
                >
                  <Store size={15} />
                  <span>{isSubmitting ? 'Menyimpan...' : hasExistingShop ? 'Simpan Perubahan Lapak' : 'Aktifkan Lapak Seller 99'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
