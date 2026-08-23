'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { Toaster } from 'sonner';

const PUBLIC_ROUTES = ['/login', '/register', '/awaiting-approval'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, isPublicRoute, pathname, router]);

  // Loading state when checking authentication
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <img
            src="/images/forsil99apps.png"
            alt="Forsil 99"
            className="h-16 w-auto object-contain mx-auto"
          />
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to view protected pages, block rendering
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <img
            src="/images/forsil99apps.png"
            alt="Forsil 99"
            className="h-16 w-auto object-contain mx-auto"
          />
          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex justify-center antialiased selection:bg-brand-primary/20 selection:text-brand-primary selection:font-semibold">
      {/* Centered Mobile-First Frame */}
      <div className="w-full max-w-2xl min-h-screen bg-surface-bg flex flex-col relative shadow-xl md:border-x md:border-slate-200/80">
        {!isPublicRoute && <Header />}

        {/* Main Content Area with Bottom Nav Padding */}
        <main className={`flex-1 overflow-x-hidden ${!isPublicRoute ? 'pb-20' : ''}`}>
          {children}
        </main>

        {!isPublicRoute && <BottomNavigation />}
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}
