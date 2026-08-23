'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Plus, ShoppingBag, Radio } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function BottomNavigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Hide navigation on auth flows
  if (pathname === '/login' || pathname === '/register' || pathname === '/awaiting-approval') {
    return null;
  }

  const tabs = [
    {
      label: 'Beranda',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Alumni',
      href: '/alumni',
      icon: Users,
      isActive: pathname?.startsWith('/alumni'),
    },
    {
      label: 'Posting',
      href: '/create',
      icon: Plus,
      isCenter: true,
      isActive: pathname === '/create',
    },
    {
      label: 'Seller 99',
      href: '/shop',
      icon: ShoppingBag,
      isActive: pathname?.startsWith('/shop'),
    },
    {
      label: 'Radar',
      href: '/live',
      icon: Radio,
      isActive: pathname === '/live',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-100/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <Link
                key={idx}
                href={tab.href}
                prefetch={false}
                className="relative -top-3 flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    tab.isActive
                      ? 'bg-gradient-to-tr from-brand-gold to-brand-goldLight text-white shadow-goldGlow'
                      : 'bg-gradient-to-tr from-brand-primary to-brand-primaryLight text-white shadow-glow'
                  }`}
                >
                  <Plus size={24} strokeWidth={2.6} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-1">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={idx}
              href={tab.href}
              prefetch={false}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                tab.isActive
                  ? 'text-brand-primary font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon size={21} strokeWidth={tab.isActive ? 2.4 : 1.8} />
                {tab.isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-primary rounded-full"></span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
