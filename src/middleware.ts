import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseFlexibleDate } from '@/utils/dateParser';

import { isJwtExpired } from '@/utils/jwt';

// Cache in-memory di sisi server (5 detik) untuk performa optimal & hemat kuota RTDB
let cachedDateStr: string | null = null;
let lastCheckTime = 0;
const CACHE_LIFETIME = 5000;

const RTDB_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://ruang59-e9dde-default-rtdb.asia-southeast1.firebasedatabase.app';

async function checkIsServerReleased(): Promise<boolean> {
  // 1. Jika countdown dimatikan secara eksplisit di env
  if (process.env.NEXT_PUBLIC_ENABLE_COUNTDOWN === 'false') {
    return true;
  }

  const isExplicitlyEnabled = process.env.NEXT_PUBLIC_ENABLE_COUNTDOWN === 'true';

  const now = Date.now();
  let dateStr = cachedDateStr;

  if (!dateStr || now - lastCheckTime > CACHE_LIFETIME) {
    try {
      // Periksa apakah countdown dimatikan via RTDB (hanya jika TIDAK dipaksa 'true' di env)
      if (!isExplicitlyEnabled) {
        const enableRes = await fetch(`${RTDB_URL}/enablecountdown.json`, {
          cache: 'no-store',
        });
        if (enableRes.ok) {
          const enableVal = await enableRes.json();
          if (enableVal === false || enableVal === 'false') {
            return true;
          }
        }
      }

      const res = await fetch(`${RTDB_URL}/releasedate.json`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const val = await res.json();
        if (val && typeof val === 'string') {
          dateStr = val;
          cachedDateStr = val;
          lastCheckTime = now;
        }
      }
    } catch {
      // Fallback diam
    }
  }

  const effectiveDateStr =
    dateStr || process.env.NEXT_PUBLIC_RELEASE_DATE || '2026-09-09T19:09:00+07:00';
  const targetDate = parseFlexibleDate(effectiveDateStr);

  if (!targetDate) return true;
  return now >= targetDate.getTime();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis Next.js, API, gambar, aset publik
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.png' ||
    pathname === '/icon.png' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Halaman /countdown selalu diizinkan terbuka
  if (pathname === '/countdown') {
    return NextResponse.next();
  }

  // Cek token autentikasi di cookie (dan validasi masa aktifnya)
  const rawToken = request.cookies.get('ruang59_web_token')?.value;
  const hasExpiredToken = Boolean(rawToken && isJwtExpired(rawToken));
  const token = rawToken && !hasExpiredToken ? rawToken : null;

  // Jika user membuka halaman login / register dengan token kadaluwarsa atau query expired, bersihkan cookie
  if ((pathname === '/login' || pathname === '/register') && (hasExpiredToken || request.nextUrl.searchParams.has('expired'))) {
    const response = NextResponse.next();
    response.cookies.delete('ruang59_web_token');
    return response;
  }

  // Cek status rilis langsung di sisi server dari Firebase Realtime Database
  const isReleased = await checkIsServerReleased();

  // PROTEKSI TOTAL SISI SERVER:
  // 1. Jika countdown aktif (belum rilis):
  if (!isReleased) {
    if (!token) {
      if (pathname === '/login' || pathname === '/register' || pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/countdown';
        const redirectResponse = NextResponse.redirect(url);
        if (hasExpiredToken) {
          redirectResponse.cookies.delete('ruang59_web_token');
        }
        return redirectResponse;
      }
    }
  }

  const response = NextResponse.next();
  if (hasExpiredToken) {
    response.cookies.delete('ruang59_web_token');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
