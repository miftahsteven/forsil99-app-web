'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  ShoppingBag,
  Calendar,
  Users,
  Quote,
  Award,
  BookOpen,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* 1. Header Bar with Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs active:scale-95"
          title="Kembali"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight flex items-center gap-2">
            <span>Tentang Forsil 99</span>
            <Sparkles size={20} className="text-amber-500 flex-shrink-0" />
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Forum Silaturahmi Alumni SMAN 59 Jakarta Angkatan 1999
          </p>
        </div>
      </div>

      {/* 2. Tagline Sederhana Forsil 99 */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
          Satu Angkatan, Solid, Nyata Terhubung
        </h2>
      </div>

      {/* 3. Sambutan Ketua Forsil 99 */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100/80 bg-gradient-to-r from-amber-50/50 via-white to-blue-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700">
              <Award size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Sambutan Resmi
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Ketua Forsil 99
              </h2>
            </div>
          </div>
          <Quote size={24} className="text-amber-300 opacity-70" />
        </div>

        {/* Content Body: Photo & Speech */}
        <div className="p-5 sm:p-7 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Sized Photo Card: Fluid & Elegant */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-44 sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-md ring-4 ring-amber-200/70 border border-slate-200 bg-slate-100 group">
              <img
                src="/images/ketuaforsil99.jpeg"
                alt="Ketua Forsil 99"
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute bottom-2.5 left-2 right-2 text-center text-white">
                <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wide block drop-shadow-md">
                  Rika Oktavia
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/95 block drop-shadow-sm">
                  Ketua Forsil 99
                </span>
              </div>
            </div>

            <div className="mt-2.5 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Periode Ke-3
              </span>
            </div>
          </div>

          {/* 2 Paragraphs Speech Content */}
          <div className="flex-1 space-y-4 text-slate-700 leading-relaxed text-xs sm:text-sm">
            <p className="text-justify indent-4 text-slate-700">
              <strong className="text-slate-900 font-semibold">Alhamdulillahirabbil&apos;alamin</strong>, segala puji dan rasa syukur kita panjatkan ke hadirat Allah SWT, Tuhan Yang Maha Kuasa, atas limpahan rahmat dan karunia-Nya sehingga aplikasi Database Alumni Forsil 99 SMU Negeri 59 Jakarta Timur ini dapat resmi dirilis dan diluncurkan. Kami mengucapkan selamat atas hadirnya platform kebanggaan kita bersama, sebuah ikhtiar nyata yang lahir dari kerinduan dan komitmen kuat untuk semakin mempererat simpul persaudaraan, menjaga kedekatan, dan merawat tali silaturahmi yang telah terjalin hangat selama lebih dari seperempat abad sejak kelulusan kita pada tahun 1999.
            </p>

            <p className="text-justify indent-4 text-slate-700">
              Besar harapan kami agar aplikasi Database Forsil 99 ini tidak hanya menjadi sarana pendataan administratif semata, melainkan menjadi ruang temu digital yang hidup, inklusif, dan membawa kebermanfaatan nyata bagi seluruh rekan alumni—baik dalam saling bertukar kabar, bernostalgia, mendukung usaha UMKM sesama angkatan, hingga saling mengulurkan tangan dalam kebaikan. Mari kita manfaatkan, ramaikan, dan jaga bersama rumah digital ini dengan semangat guyub dan kekeluargaan yang tulus: <em className="text-brand-primary font-bold not-italic">Satu Angkatan, Solid, Nyata Terhubung</em>.
            </p>

            {/* Official Signature Stamp */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500">
              <div className="text-[11px]">
                <span className="font-bold text-slate-900 block">Salam Hangat & Silaturahmi,</span>
                <span className="text-slate-600 font-medium">Ketua & Seluruh Pengurus Forsil 99</span>
              </div>
              <div className="px-3 py-1 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                Resmi • Forsil 99
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Susunan Pengurus Forsil 99 Periode Ke-3 */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-4 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-brand-primary">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Susunan Pengurus Forsil 99
              </h3>
              <p className="text-[11px] text-slate-500">
                Masa Bakti Kepengurusan Periode Ke-3
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200/80 rounded-full text-amber-800 text-[10px] font-bold">
            Periode Ke-3
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Pembina */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Pembina
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Teguh</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Miftah</p>
          </div>

          {/* Ketua */}
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block mb-1">
              Ketua
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Rika Oktavia</p>
          </div>

          {/* Wakil */}
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block mb-1">
              Wakil Ketua
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Into</p>
          </div>

          {/* Sekretaris */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Sekretaris
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Hendra</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Anton</p>
          </div>

          {/* Bendahara */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Bendahara
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Nurma</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Dani</p>
          </div>

          {/* Humas */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Humas
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Komarul</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Didi</p>
          </div>
        </div>
      </section>

      {/* 5. Nilai-Nilai Utama & Komitmen Forsil 99 */}
      <section className="space-y-3">
        <div className="px-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake size={17} className="text-brand-primary" />
            <span>Pilar & Nilai Utama Forsil 99</span>
          </h3>
          <p className="text-xs text-slate-500">
            Nilai-nilai luhur yang mendasari terwujudnya aplikasi Database Forsil 99
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Pilar 1 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5 hover:border-blue-200 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center font-bold text-xs">
              <Users size={18} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Silaturahmi Tanpa Batas
            </h4>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Menjembatani kembali kawan-kawan alumni angkatan 99 yang kini tersebar di berbagai wilayah dan profesi, memudahkan komunikasi langsung dan temu kangen.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5 hover:border-emerald-200 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Keamanan & Privasi Data
            </h4>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Menerapkan sistem verifikasi referral oleh kawan sekelas serta kepatuhan ketat UU Perlindungan Data Pribadi (UU PDP). Data nomor kontak terlindungi aman.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5 hover:border-amber-200 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              <ShoppingBag size={18} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Sinergi Ekonomi (Seller 99)
            </h4>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Mendukung pertumbuhan usaha, jasa, dan produk kuliner sesama alumni melalui etalase Seller 99 yang dapat diakses mandiri dan gratis.
            </p>
          </div>

          {/* Pilar 4 */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-1.5 hover:border-rose-200 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <HeartHandshake size={18} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Solidaritas & Kepedulian Sosial
            </h4>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Ruang saling mengabarkan kabar suka maupun duka, penggalangan bantuan, serta koordinasi bakti sosial untuk sesama alumni maupun masyarakat sekitar.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Navigasi Pintas Fitur Utama */}
      <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800">
          Jelajahi Fitur Forsil 99
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link
            href="/alumni"
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-brand-primary text-center group transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <Users size={20} className="mx-auto text-brand-primary mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-800 block">Direktori Alumni</span>
            <span className="text-[9.5px] text-slate-500">Filter kelas & nama</span>
          </Link>

          <Link
            href="/events"
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-500 text-center group transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <Calendar size={20} className="mx-auto text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-800 block">Agenda Reuni</span>
            <span className="text-[9.5px] text-slate-500">Acara & kegiatan</span>
          </Link>

          <Link
            href="/shop"
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 text-center group transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <ShoppingBag size={20} className="mx-auto text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-800 block">Pasar Seller 99</span>
            <span className="text-[9.5px] text-slate-500">UMKM kawan ’99</span>
          </Link>

          <Link
            href="/privacy"
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-sky-500 text-center group transition-all shadow-2xs hover:shadow-xs active:scale-95"
          >
            <ShieldCheck size={20} className="mx-auto text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-bold text-slate-800 block">Kebijakan Privasi</span>
            <span className="text-[9.5px] text-slate-500">Kepatuhan UU PDP</span>
          </Link>
        </div>
      </section>

      {/* 6. Footer Information */}
      <footer className="text-center pt-2 text-[11px] text-slate-400 space-y-1">
        <p>© 2026 FORSIL 99 — SMU Negeri 59 Jakarta. Satu Angkatan, Solid, Nyata Terhubung.</p>
        <p className="text-[10px]">Dikelola oleh Tim Forum Silaturahmi Alumni SMAN 59 Jakarta Angkatan 1999.</p>
      </footer>
    </div>
  );
}
