'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Mail } from 'lucide-react';

export default function AwaitingApprovalPage() {
  return (
    <div className="min-h-screen py-10 px-4 bg-gradient-to-b from-blue-50/60 via-white to-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block mb-3">
            <img
              src="/images/forsil99apps.png"
              alt="Forsil 99"
              className="h-14 w-auto object-contain mx-auto"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-bold text-amber-700 mb-2">
            <Clock size={13} />
            <span>Pemeriksaan Data Alumni SMAN 59</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Pendaftaran Terkirim!</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Permohonan verifikasi akun Anda sedang menunggu konfirmasi dari rekan referral alumni Anda.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-600">STATUS VERIFIKASI:</span>
            <span className="px-2.5 py-1 bg-amber-100/80 text-amber-800 text-[10px] font-black rounded-lg uppercase tracking-wider">
              PENDING REVIEW
            </span>
          </div>

          {/* Timeline Step */}
          <div className="py-2">
            <div className="flex items-center justify-between relative">
              <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center z-10">
                <CheckCircle2 size={16} />
              </div>
              <div className="flex-1 h-1 bg-amber-400 mx-2" />
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center z-10 animate-pulse">
                <Clock size={16} />
              </div>
              <div className="flex-1 h-1 bg-slate-200 mx-2" />
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center z-10">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mt-2 px-1">
              <span>Formulir Dikirim</span>
              <span className="text-amber-600 font-bold">Review Referral</span>
              <span>Akun Aktif</span>
            </div>
          </div>

          {/* Email Notice Box */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 text-brand-primary rounded-xl shrink-0 mt-0.5">
              <Mail size={18} />
            </div>
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <p className="font-bold text-slate-900">Email Konfirmasi Dikirim</p>
              <p className="text-slate-600">
                Sistem telah mengirimkan email permohonan konfirmasi kepada <strong>rekan referral (teman seangkatan)</strong> yang Anda pilih saat mendaftar.
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                💡 Setelah rekan Anda mengklik tombol <strong>Setujui</strong> di email atau aplikasi, akun Anda akan otomatis aktif dan dapat login.
              </p>
            </div>
          </div>

          {/* Access Limitations */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800 block mb-1">🔒 Akses Akun:</span>
            <p>• Selama status <em>Pending</em>, akun belum dapat digunakan untuk login ke timeline.</p>
            <p>• Hubungi rekan sekelas Anda agar segera membuka email verifikasi.</p>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <span>Coba Masuk ke Akun</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
