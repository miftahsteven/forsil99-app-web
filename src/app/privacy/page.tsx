'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Scale,
  Database,
  Eye,
  Lock,
  Users,
  FileCheck,
  CheckCircle2,
  ChevronLeft,
  Mail,
  ExternalLink,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
      {/* Back button & Title Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
          title="Kembali"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
            <span>Kebijakan Privasi & Ketentuan Data</span>
            <ShieldCheck size={22} className="text-emerald-600" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Forum Silaturahmi Alumni SMAN 59 Jakarta Angkatan 1999 (Forsil 99)
          </p>
        </div>
      </div>

      {/* Compliance Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-brand-primaryDeep rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-bold border border-white/20">
            <Scale size={13} />
            <span>Kepatuhan Penuh UU No. 27 Tahun 2022 (UU PDP)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold leading-snug">
            Transparansi, Keamanan, dan Kedaulatan Data Alumni
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
            Platform Forsil 99 dibangun dengan standar privasi ketat. Kami memastikan seluruh data alumni disimpan dengan aman, tidak diperjualbelikan, dan pengguna memiliki kendali penuh atas tingkat keterbukaan profil masing-masing.
          </p>
        </div>
        <div className="absolute right-4 -bottom-6 opacity-10 text-white pointer-events-none">
          <ShieldCheck size={180} />
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
        {/* Poin 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
              <Database size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              1. Pengumpulan & Penyimpanan Data dalam Database Forsil 99
            </h3>
          </div>
          <p>
            Alumni yang mendaftar dan melengkapi profil di platform Forsil 99 memberikan persetujuan eksplisit (*consent*) kepada pengelola untuk menyimpan data berikut ke dalam basis data resmi Forsil 99:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl text-[11px]">
            <div>
              <strong className="text-slate-900 block mb-1">A. Data Identitas & Keluarga:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Nama Lengkap & Nama Panggilan</li>
                <li>Kelas di SMAN 59 (Angkatan 1999)</li>
                <li>Nomor Induk Alumni (NIA)</li>
                <li>Tanggal Lahir & Jenis Kelamin</li>
                <li>Status Pernikahan</li>
              </ul>
            </div>
            <div>
              <strong className="text-slate-900 block mb-1">B. Kontak & Domisili:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Nomor WhatsApp / Ponsel</li>
                <li>Alamat Email Terverifikasi</li>
                <li>Alamat Lengkap Domisili Saat Ini</li>
                <li>Kota / Provinsi Tempat Tinggal</li>
              </ul>
            </div>
            <div>
              <strong className="text-slate-900 block mb-1">C. Karir & Minat:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Profesi / Pekerjaan Saat Ini</li>
                <li>Nama Instansi / Perusahaan</li>
                <li>Hobi & Minat Komunitas</li>
                <li>Keahlian & Media Sosial</li>
              </ul>
            </div>
            <div>
              <strong className="text-slate-900 block mb-1">D. Keamanan & Log Sesi:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Foto Profil & Foto Selfie Verifikasi</li>
                <li>Alamat IP & Lokasi Akses Login</li>
                <li>Log Riwayat Kunjungan Profil</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            <strong>Tujuan Penggunaan:</strong> Pemeliharaan direktori resmi alumni SMAN 59 '99, koordinasi silaturahmi, verifikasi akun baru, penyebaran kabar duka cita/sosial, serta kemaslahatan bersama keluarga besar alumni. Data tidak akan disewakan atau dialihkan kepada pihak ketiga komersial.
          </p>
        </div>

        {/* Poin 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              2. Sistem Klasifikasi Profil Alumni (Tiers) & Keterbukaan Data
            </h3>
          </div>
          <p>
            Alumni menyetujui sistem klasifikasi keterbukaan profil yang diterapkan pada web Forsil 99:
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <span className="font-extrabold text-amber-900">👑 Kategori Open Alumni:</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Diberikan kepada alumni yang melengkapi 100% data profil dan secara sukarela membuka seluruh informasi profilnya untuk seluruh rekan alumni terverifikasi. Terbuka untuk semua alumni, dan alumni dapat mengatur akses buka/tutup secara manual maupun berbasis batas waktu sementara (1 hari, 3 hari, atau 7 hari).
              </p>
            </div>
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
              <span className="font-extrabold text-blue-900">🔷 Kategori Khusus Pengikut Saja (Connected Alumni) (Centang Biru):</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Diberikan kepada alumni yang melengkapi 100% data profil, dengan detail informasi profil khusus dapat diakses oleh rekan alumni yang menjadi koneksi atau telah saling mengikuti (followers).
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-extrabold text-slate-800">⚪ Kategori Private Alumni (Centang Abu-abu):</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Diberikan kepada alumni yang melengkapi 100% data profil, namun mengunci profilnya menjadi privat (seluruh rincian kontak dan domisili disembunyikan). Data tetap aman dan tidak dapat diakses pihak luar.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-extrabold text-slate-800">⚪ Kategori New Alumni (Centang Abu-abu):</span>
              <p className="text-slate-700 mt-1 leading-relaxed">
                Diberikan kepada alumni yang baru bergabung atau belum melengkapi data profil wajib (&lt; 100%). Alumni mendapatkan panduan serta pengingat berkala untuk melengkapi data agar profil menjadi lengkap.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-600">
            <strong>Transparansi Notifikasi Kunjungan:</strong> Alumni pada kategori Open Alumni dan Khusus Pengikut Saja (Connected Alumni) menyetujui bahwa sistem mencatat dan mengirimkan pemberitahuan (inbox dan push notif) setiap kali profilnya dikunjungi oleh rekan alumni lain (termasuk informasi identitas pengunjung dan waktu kunjungan).
          </p>
        </div>

        {/* Poin 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              3. Kewajiban Menjaga Keamanan Akun & Larangan Sharing Kredensial
            </h3>
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-600">
            <li>
              Alumni bertanggung jawab mutlak terhadap keamanan kata sandi (*password*), email login, dan kode OTP validasi yang digunakan pada sistem Forsil 99.
            </li>
            <li>
              <strong className="text-slate-900">Larangan Berbagi Akun:</strong> Alumni dilarang keras membagikan (*account sharing*), meminjamkan, menyewakan, atau memberikan hak akses akun kepada orang lain atau pihak ketiga manapun.
            </li>
            <li>
              Platform telah mengimplementasikan langkah keamanan berstandar tinggi:
              <ul className="list-circle pl-4 mt-1 space-y-0.5 text-slate-500">
                <li>• Proteksi brute-force (pembatasan 3x salah login dengan cooldown 1 menit).</li>
                <li>• Kedaluwarsa sesi login otomatis setelah 7 hari.</li>
                <li>• Notifikasi email deteksi akses login baru dengan koordinat lokasi & IP address.</li>
                <li>• Fitur *Revoke Access* seketika untuk melogout seluruh sesi aktif akun jika ada indikasi peretasan.</li>
              </ul>
            </li>
          </ul>
        </div>

        {/* Poin 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              4. Kepatuhan Regulasi Hukum Indonesia (UU PDP No. 27/2022 & UU ITE)
            </h3>
          </div>
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2 text-[11px] text-emerald-950">
            <p className="font-bold text-emerald-900">
              Landasan Hukum Penyelenggaraan Sistem Elektronik Forsil 99:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-emerald-900">
              <li>
                <strong>UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP):</strong> Forsil 99 mematuhi prinsip pemrosesan data pribadi berdasarkan dasar hukum yang sah, pembatasan tujuan spesifik, akurasi pemutakhiran data, serta hak subjek data untuk menarik persetujuan.
              </li>
              <li>
                <strong>UU No. 11 Tahun 2008 jo. UU No. 1 Tahun 2024 (UU ITE):</strong> Pengelolaan dokumen elektronik, keabsahan tanda persetujuan digital, dan sanksi tegas atas setiap tindakan ilegal penyadapan atau perusakan data elektronik.
              </li>
            </ul>
          </div>
        </div>

        {/* Poin 5 & 6 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users size={16} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              5. Etika Komunitas & Larangan Penyalahgunaan Data
            </h3>
          </div>
          <p className="text-[11px] text-slate-600">
            Setiap alumni wajib menjunjung tinggi etika kekeluargaan sesama alumni SMAN 59 Jakarta. Dilarang keras:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
            <li>Menyebarkan atau mendistribusikan data kontak rekan alumni kepada pihak luar untuk keperluan telemarketing, penawaran produk ilegal, atau penipuan.</li>
            <li>Melakukan tindakan pelecehan (*harassment*), pencemaran nama baik, atau *doxing* terhadap sesama alumni.</li>
            <li>Pengurus Forsil 99 berhak menolak pendaftaran, mencabut verifikasi, atau memproses tindakan hukum terhadap oknum yang melanggar.</li>
          </ul>
        </div>

        {/* Kontak Pengaduan */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 text-center space-y-2">
          <p className="font-bold text-slate-800 text-xs">Punya Pertanyaan Mengenai Privasi & Data Anda?</p>
          <p className="text-[11px] text-slate-500 max-w-md mx-auto">
            Tim Pengelola Forsil 99 siap membantu perlindungan akun dan privasi Anda. Hubungi kami melalui saluran resmi:
          </p>
          <a
            href="mailto:admin@forsil99.us"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-brand-primary font-bold text-xs hover:bg-slate-100 shadow-xs transition-colors"
          >
            <Mail size={14} />
            <span>admin@forsil99.us</span>
          </a>
        </div>
      </div>
    </div>
  );
}
