import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseFlexibleDate } from '@/utils/dateParser';

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

  // Cek token autentikasi di cookie
  const token = request.cookies.get('ruang59_web_token')?.value;

  // Cek status rilis langsung di sisi server dari Firebase Realtime Database
  const isReleased = await checkIsServerReleased();

  // PROTEKSI TOTAL SISI SERVER:
  // 1. Jika countdown aktif (belum rilis):
  if (!isReleased) {
    if (!token) {
      if (pathname === '/login' || pathname === '/register' || pathname === '/') {
        const url = request.nextUrl.clone();
        url.pathname = '/countdown';
        return NextResponse.redirect(url);
      }
    }
  } else {
    // 2. Jika countdown dimatikan (sudah rilis / NEXT_PUBLIC_ENABLE_COUNTDOWN=false):
    // Ketika user belum login membuka root /, langsung arahkan ke /login
    if (!token && pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
