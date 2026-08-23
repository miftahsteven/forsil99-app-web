'use client';

import React from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { Toaster } from 'sonner';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex justify-center antialiased selection:bg-brand-primary/20 selection:text-brand-primary selection:font-semibold">
      {/* Centered Mobile-First Frame */}
      <div className="w-full max-w-2xl min-h-screen bg-surface-bg flex flex-col relative shadow-xl md:border-x md:border-slate-200/80">
        <Header />
        
        {/* Main Content Area with Bottom Nav Padding */}
        <main className="flex-1 pb-20 overflow-x-hidden">
          {children}
        </main>

        <BottomNavigation />
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}
