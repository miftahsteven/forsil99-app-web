'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, MapPin, Tag } from 'lucide-react';
import { Product } from '@/types';
import { SellerBadge } from '@/components/ui/VerifiedBadge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatRupiah = (val?: number) => {
    if (!val) return 'Hubungi Penjual';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const sellerName = product.shop?.name || product.owner?.profile?.fullName || product.ownerName || 'Alumni 99';
  const whatsappNumber = product.shop?.contactPhone || product.owner?.profile?.privacy?.phone || '';
  const firstImage = product.imageUrls?.[0] || '/images/forsil99apps.png';

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!whatsappNumber) {
      window.location.href = `/chat/${product.ownerId}`;
      return;
    }
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const text = encodeURIComponent(
      `Halo ${sellerName}, saya melihat produk "${product.name}" di Forsil99. Apakah masih tersedia?`
    );
    window.open(`https://wa.me/${intlPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-subtle flex flex-col justify-between hover:shadow-card hover:border-slate-200 transition-all group">
      <Link href={`/shop/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
          <img
            src={firstImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/forsil99apps.png';
            }}
          />
          <div className="absolute top-2.5 left-2.5">
            <SellerBadge />
          </div>
          {product.categoryName && (
            <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Tag size={10} />
              <span>{product.categoryName}</span>
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="p-3.5 pb-2">
          <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-primary line-clamp-1 transition-colors">
            {product.name}
          </h4>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-extrabold text-brand-primary">
              {formatRupiah(product.price)}
            </span>
            {product.unit && (
              <span className="text-xs text-slate-400">/{product.unit}</span>
            )}
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 truncate max-w-[120px]">
              {sellerName}
            </span>
            {product.city && (
              <span className="flex items-center gap-0.5 text-slate-400">
                <MapPin size={11} />
                <span>{product.city}</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Direct Contact Button */}
      <div className="p-3 pt-0">
        <button
          onClick={handleWhatsAppClick}
          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
        >
          <MessageCircle size={15} />
          <span>Hubungi Penjual</span>
        </button>
      </div>
    </div>
  );
}
