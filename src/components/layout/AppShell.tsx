'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { Toaster } from 'sonner';

import { hasSeenWelcome } from '@/config/releaseConfig';
import { useReleaseDate } from '@/hooks/useReleaseDate';

const AUTH_FLOW_ROUTES = ['/login', '/register', '/awaiting-approval', '/countdown', '/change-password'];
const PUBLIC_ROUTES = [...AUTH_FLOW_ROUTES, '/privacy', '/about'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isReleased, isCountdownEnabled, isLoading: releaseLoading, targetDateIso } = useReleaseDate();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthFlow = AUTH_FLOW_ROUTES.includes(pathname);
  const countdownActive = isCountdownEnabled && !isReleased;
  const isOverallLoading = authLoading || releaseLoading;

  useEffect(() => {
    if (isOverallLoading) return;

    if (!isAuthenticated) {
      if (countdownActive) {
        // Sebelum rilis: kunci semua halaman (termasuk /login dan /register), alihkan ke /countdown
        if (pathname !== '/countdown') {
          router.replace('/countdown');
          return;
        }
      } else {
        // Pasca rilis atau countdown dimatikan: arahkan ke login jika membuka halaman terproteksi
        if (!isPublicRoute) {
          router.replace('/login');
          return;
        }
      }
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/register' || pathname === '/countdown')) {
      router.replace('/');
    }
  }, [isAuthenticated, isOverallLoading, isPublicRoute, pathname, router, countdownActive, targetDateIso]);

  // Root Page & History Trap:
  // Ketika user sudah login dan berada di Beranda ('/'), back button browser dicegah agar
  // tidak pernah kembali ke halaman login atau keluar aplikasi, melainkan tetap di Beranda ('/').
  // Begitupun jika user sudah maju 2x page (misal: /events, /alumni) lalu kembali ke beranda,
  // di titik akhir (endpoint back button), user tetap berada di Beranda ('/').
  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated) return;

    // 1. Tandai state di root page ('/') agar ada jangkar (anchor) di history stack
    if (pathname === '/') {
      if (!window.history.state || !window.history.state.ruang59_root) {
        window.history.pushState({ ruang59_root: true }, '', '/');
      }
    }

    // 2. Tangkap event popstate (tombol Back browser atau swipe back)
    const handlePopState = () => {
      // Jika browser mencoba mundur ke /login atau /register
      if (
        window.location.pathname === '/login' ||
        window.location.pathname === '/register'
      ) {
        window.history.pushState({ ruang59_root: true }, '', '/');
        router.replace('/');
        return;
      }

      // Jika user berada di Beranda ('/') dan menekan Back button di titik akhir
      if (window.location.pathname === '/') {
        window.history.pushState({ ruang59_root: true }, '', '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, isAuthenticated, router]);

  // Jika belum rilis dan belum autentikasi, blokir tampilan halaman selain /countdown (termasuk /login & /register)
  if (!isAuthenticated && countdownActive && pathname !== '/countdown') {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <img
            src="/images/forsil99apps.png"
            alt="Forsil 99"
            className="h-16 w-auto object-contain mx-auto"
          />
          <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      </div>
    );
  }

  // Loading state when checking authentication
  if (authLoading && !isPublicRoute) {
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

  // Halaman Countdown ditampilkan Full Screen edge-to-edge
  if (pathname === '/countdown') {
    return (
      <div className="min-h-screen w-full bg-[#050814]">
        {children}
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex justify-center antialiased selection:bg-brand-primary/20 selection:text-brand-primary selection:font-semibold">
      {/* Centered Mobile-First Frame */}
      <div className="w-full max-w-2xl min-h-screen bg-surface-bg flex flex-col relative shadow-xl md:border-x md:border-slate-200/80">
        {!isAuthFlow && <Header />}

        {/* Main Content Area with Bottom Nav Padding */}
        <main className={`flex-1 overflow-x-hidden ${!isAuthFlow && isAuthenticated ? 'pb-20' : !isAuthFlow ? 'pb-8' : ''}`}>
          {children}
        </main>

        {!isAuthFlow && isAuthenticated && <BottomNavigation />}
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}
