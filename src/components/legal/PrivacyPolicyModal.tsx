'use client';

import React from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  Database,
  Eye,
  FileCheck,
  Scale,
  Users,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose, onAccept }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Kebijakan Privasi & Kepatuhan Data
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Forsil 99 SMAN 59 Jakarta</span>
                <span>•</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                  Patuh UU PDP No. 27/2022
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed custom-scrollbar">
          {/* Badge Alert */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
            <Scale size={18} className="text-brand-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-xs">
                Pernyataan Kepatuhan Hukum & Perlindungan Privasi Komunitas
              </p>
              <p className="text-slate-600 text-[11px] leading-normal">
                Dokumen ini merupakan bentuk transparansi dan perjanjian hukum antara Alumni SMAN 59 Angkatan 1999 dengan Pengelola Platform Forum Silaturahmi (Forsil 99) dalam pengelolaan, penyimpanan, dan perlindungan data pribadi.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database size={16} className="text-brand-primary" />
              <span>1. Data Pribadi yang Disimpan & Tujuan Pengelolaan</span>
            </h3>
            <p className="text-slate-600">
              Dengan melengkapi profil dan mencentang persetujuan, alumni menyetujui bahwa data berikut disimpan secara terenkripsi dan aman dalam basis data Forsil 99:
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2 text-[11px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-slate-800 block">• Identitas Personal:</span>
                  <span className="text-slate-600">Nama Lengkap, Nama Panggilan, NIA, Kelas SMAN 59 (1999), Tanggal Lahir, Jenis Kelamin, Status Pernikahan.</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">• Kontak & Domisili:</span>
                  <span className="text-slate-600">Nomor WhatsApp/Telepon, Alamat Email, Alamat Lengkap Domisili Saat Ini, Kota Domisili.</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">• Karir & Minat:</span>
                  <span className="text-slate-600">Pekerjaan/Profesi, Nama Instansi/Perusahaan, Hobi & Minat, Keahlian, Bio Cerita Singkat.</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800 block">• Keamanan & Verifikasi:</span>
                  <span className="text-slate-600">Foto Profil, Foto Selfie Verifikasi, IP Address & Lokasi Sesi Login (deteksi akses ilegal).</span>
                </div>
              </div>
            </div>
            <p className="text-slate-600 text-[11px]">
              <strong className="text-slate-800">Tujuan:</strong> Seluruh data di atas disimpan secara eksklusif untuk kepentingan direktori silaturahmi alumni, verifikasi keanggotaan angkatan 1999, penyelenggaraan kegiatan sosial/reuni, dan pertolongan darurat sesama alumni.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Eye size={16} className="text-indigo-600" />
              <span>2. Sistem Klasifikasi Profil & Keterbukaan Data</span>
            </h3>
            <p className="text-slate-600">
              Alumni memahami dan menyetujui sistem tingkatan (*tiers*) kelengkapan dan keterbukaan profil yang berlaku pada platform Forsil 99:
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40">
                <span className="font-bold text-amber-900">👑 Kategori Super Extrov (Crown Emas):</span>
                <p className="text-slate-700 mt-0.5">
                  Alumni melengkapi 100% data dan membuka akses informasi profil kepada seluruh rekan alumni terverifikasi. Alumni juga dapat memanfaatkan opsi pembukaan profil sementara dengan batas waktu (1, 3, atau 7 hari).
                </p>
              </div>
              <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/40">
                <span className="font-bold text-blue-900">🔷 Kategori Extrov (Centang Biru):</span>
                <p className="text-slate-700 mt-0.5">
                  Alumni melengkapi 100% data, namun membatasi rincian profil hanya dapat diakses oleh rekan alumni yang telah mem-follow akun tersebut.
                </p>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="font-bold text-slate-800">⚪ Kategori Introv (Centang Abu-abu):</span>
                <p className="text-slate-700 mt-0.5">
                  Alumni melengkapi 100% data, namun menutup rincian kontak dan alamat domisili (mode private). Data tetap aman dan tidak dapat diakses pihak luar.
                </p>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                <span className="font-bold text-slate-600">⚪ Kategori Super Introv (Tanpa Icon):</span>
                <p className="text-slate-700 mt-0.5">
                  Alumni belum melengkapi data profil secara penuh (&lt; 100%) dan mendapatkan pengingat berkala untuk melengkapi isian data.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600">
              <strong className="text-slate-800">Notifikasi Kunjungan:</strong> Untuk menjamin keterbukaan timbal-balik, alumni kategori Super Extrov dan Extrov menyetujui bahwa sistem akan mengirimkan notifikasi inbox dan push setiap kali profilnya dibuka oleh rekan alumni lain (mencakup nama pengunjung dan waktu kunjungan).
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Lock size={16} className="text-rose-600" />
              <span>3. Keamanan Akun & Larangan Sharing Kredensial</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-[11px]">
              <li>
                Alumni bertanggung jawab penuh menjaga kerahasiaan kata sandi (*password*), email terdaftar, dan kode OTP validasi yang dikirimkan oleh sistem.
              </li>
              <li>
                <strong className="text-slate-900">Larangan Sharing Akun:</strong> Dilarang keras membagikan, meminjamkan, atau memperjualbelikan akses login akun Forsil 99 kepada orang lain atau pihak ketiga manapun.
              </li>
              <li>
                Platform dilengkapi proteksi keamanan: batas salah login 3x dengan masa jeda (*cooldown*), masa kedaluwarsa sesi login (7 hari), notifikasi deteksi login ke email (mencakup estimasi lokasi & IP address), serta tombol *Revoke Access* darurat untuk melogout seluruh sesi aktif seketika.
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>4. Kepatuhan Hukum Perlindungan Data (UU PDP & UU ITE)</span>
            </h3>
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1 text-[11px] text-emerald-950">
              <p className="font-bold">
                Platform Komunitas Forsil 99 tunduk dan patuh pada seluruh regulasi hukum Republik Indonesia:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-emerald-900">
                <li>
                  <strong>Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP):</strong> Forsil 99 menerapkan prinsip pembatasan tujuan (*purpose limitation*), pemrosesan data secara sah dan transparan, pemutakhiran data, serta perlindungan teknis enkripsi data.
                </li>
                <li>
                  <strong>Undang-Undang Nomor 11 Tahun 2008 jo. UU No. 1 Tahun 2024 tentang Informasi dan Transaksi Elektronik (UU ITE):</strong> Seluruh komunikasi, transaksi, dan interaksi elektronik dalam sistem memiliki kekuatan hukum dan perlindungan hak cipta/informasi elektronik.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users size={16} className="text-amber-600" />
              <span>5. Etika Komunitas & Larangan Penyalahgunaan Data</span>
            </h3>
            <p className="text-slate-600 text-[11px]">
              Data sesama alumni yang diperoleh dari platform Forsil 99 <strong>DILARANG KERAS</strong> digunakan untuk tujuan:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>Spamming, telemarketing komersial tanpa izin rekan yang bersangkutan, atau penawaran pinjaman online/investasi bodong.</li>
              <li>Pelecehan, fitnah, ujaran kebencian, atau penyebaran data pribadi rekan alumni ke media sosial umum tanpa persetujuan tertulis (*doxing*).</li>
              <li>Pengurus Forsil 99 berhak mencabut status verifikasi, membekukan akun, atau memproses ke jalur hukum apabila ditemukan pelanggaran terhadap ketentuan ini.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck size={16} className="text-teal-600" />
              <span>6. Hak Alumni sebagai Subjek Data</span>
            </h3>
            <p className="text-slate-600 text-[11px]">
              Sesuai UU PDP, setiap alumni memiliki hak untuk:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>Mengakses dan memperbarui data pribadi kapan saja melalui menu Edit Profil.</li>
              <li>Mengubah preferensi keterbukaan data (Super Extrov / Extrov / Introv) kapan saja secara mandiri.</li>
              <li>Menghubungi pengurus komunitas melalui email resmi <strong className="text-brand-primary">admin@forsil99.us</strong> untuk konsultasi keamanan atau permintaan penghapusan akun.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Berlaku efektif sejak 2026 untuk seluruh Alumni Forsil 99 SMAN 59 Jakarta</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
            {onAccept && (
              <button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-primaryDark shadow-sm transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Saya Mengerti & Setuju</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
