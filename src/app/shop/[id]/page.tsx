'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchProductById } from '@/services/shopService';
import { Product } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { SellerBadge } from '@/components/ui/VerifiedBadge';
import {
  ChevronLeft,
  MessageCircle,
  Share2,
  MapPin,
  Tag,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (productId) {
      fetchProductById(productId)
        .then((data) => setProduct(data))
        .catch(() => toast.error('Produk tidak ditemukan.'))
        .finally(() => setIsLoading(false));
    }
  }, [productId]);

  const formatRupiah = (val?: number) => {
    if (!val) return 'Hubungi Penjual';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const sellerName = product?.shop?.name || product?.owner?.profile?.fullName || product?.ownerName || 'Alumni SMAN 59';
  const sellerPhoto = product?.owner?.profile?.profilePhotoUrl;
  const sellerClass = product?.owner?.profile?.className || 'Alumni ’99';
  const whatsappNumber = product?.shop?.contactPhone || product?.owner?.profile?.privacy?.phone || '';

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) {
      router.push(`/chat/${product?.ownerId}`);
      return;
    }
    const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const text = encodeURIComponent(
      `Halo ${sellerName}, saya melihat produk "${product?.name}" di Forsil99. Apakah masih tersedia?`
    );
    window.open(`https://wa.me/${intlPhone}?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="w-full h-64 bg-slate-200 rounded-2xl" />
        <div className="w-2/3 h-6 bg-slate-200 rounded" />
        <div className="w-1/3 h-8 bg-slate-200 rounded" />
        <div className="w-full h-24 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500 mb-4">Produk tidak ditemukan.</p>
        <Link href="/shop" className="text-xs text-brand-primary font-bold">
          ← Kembali ke Pasar Alumni
        </Link>
      </div>
    );
  }

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : ['/images/forsil99apps.png'];

  return (
    <div className="w-full pb-6">
      {/* Top Bar Navigation */}
      <div className="px-3 py-2 flex items-center justify-between bg-white border-b border-slate-100 sticky top-14 z-30">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft size={18} />
          <span>Kembali</span>
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: product.name, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Tautan disalin ke clipboard');
            }
          }}
          className="p-1.5 text-slate-500 hover:text-slate-900"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Main Product Image Carousel */}
      <div className="relative w-full h-72 bg-slate-950">
        <img
          src={images[activeImageIndex]}
          alt={product.name}
          className="w-full h-full object-contain mx-auto"
        />
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Details Section */}
      <div className="p-4 bg-white border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <SellerBadge />
          {product.categoryName && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Tag size={12} /> {product.categoryName}
            </span>
          )}
        </div>

        <h1 className="text-lg font-bold text-slate-900 leading-snug">{product.name}</h1>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-brand-primary">
            {formatRupiah(product.price)}
          </span>
          {product.unit && <span className="text-xs text-slate-400">/{product.unit}</span>}
        </div>

        {product.city && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={14} className="text-slate-400" />
            <span>Lokasi: {product.city}</span>
          </div>
        )}
      </div>

      {/* Seller Profile Card */}
      <div className="p-4 bg-white border-b border-slate-100 my-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Informasi Penjual
        </h3>
        <Link
          href={`/profile/${product.ownerId}`}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AppAvatar src={sellerPhoto} name={sellerName} size="md" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">{sellerName}</h4>
              <p className="text-xs text-brand-primary font-medium">{sellerClass}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">Lihat Profil →</span>
        </Link>
      </div>

      {/* Product Description */}
      <div className="p-4 bg-white border-b border-slate-100 space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Deskripsi Lengkap
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {product.description}
        </p>
      </div>

      {/* Fixed WhatsApp Purchase CTA Button */}
      <div className="p-4">
        <button
          onClick={handleWhatsAppClick}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <MessageCircle size={18} />
          <span>Chat Langsung via WhatsApp Penjual</span>
        </button>
      </div>
    </div>
  );
}
