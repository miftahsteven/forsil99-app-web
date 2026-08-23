'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/shop/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchProducts } from '@/services/shopService';
import { Product } from '@/types';
import { Search, ShoppingBag, Plus, Tag, Store } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'all', label: 'Semua Produk' },
  { id: 'kuliner', label: '🍲 Kuliner & Catering' },
  { id: 'jasa_profesional', label: '💼 Jasa Profesional' },
  { id: 'fashion', label: '👕 Fashion & Kaos' },
  { id: 'gadget', label: '📱 Gadget & IT' },
  { id: 'kesehatan', label: '💊 Kesehatan' },
  { id: 'properti', label: '🏠 Properti & Desain' },
];

export default function ShopDirectoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadProducts();
  }, [activeCategory, searchQuery]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProducts(activeCategory, searchQuery);
      setProducts(data);
    } catch {
      toast.error('Gagal memuat produk pasar alumni.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full px-3 py-3">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 rounded-2xl p-4 text-white mb-3.5 shadow-card relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={18} className="text-amber-300" />
            <h1 className="text-lg font-bold">Pasar Alumni — Seller 99</h1>
          </div>
          <p className="text-xs text-amber-100 mt-1 max-w-sm">
            Dukung dan gunakan produk, kuliner, dan jasa dari sesama alumni SMAN 59.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari produk, kuliner, atau jasa alumni..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600 shadow-subtle"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              activeCategory === cat.id
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-3 border border-slate-100 shadow-subtle animate-pulse space-y-2.5"
            >
              <div className="w-full h-36 bg-slate-200 rounded-xl" />
              <div className="w-3/4 h-3.5 bg-slate-200 rounded" />
              <div className="w-1/2 h-4 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Store size={28} />}
          title="Belum ada produk di kategori ini"
          description="Punya usaha atau jasa? Pasang produk UMKM Anda agar diketahui oleh seluruh alumni SMAN 59."
          actionText="Lihat Semua Kategori"
          onAction={() => setActiveCategory('all')}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
