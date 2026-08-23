import React from 'react';
import { CheckCircle2, Award } from 'lucide-react';

export function VerifiedBadge({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center text-brand-primary ${className}`}
      title="Alumni Terverifikasi SMAN 59 Angkatan 1999"
    >
      <CheckCircle2 size={size} className="fill-brand-primary text-white" />
    </span>
  );
}

export function GoldBadge({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center text-brand-gold ${className}`}
      title="Akun Utama / Pengurus Forsil 99"
    >
      <Award size={size} className="fill-brand-gold text-white" />
    </span>
  );
}

export function SellerBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
    >
      <span>🛍️</span>
      <span>Seller 99</span>
    </span>
  );
}
