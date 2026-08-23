import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Forsil99 — Rumah Digital Alumni SMAN 59 Jakarta',
  description: 'Satu Sekolah. Semua Angkatan. Tetap Terhubung. Media sosial dan rumah digital alumni SMA Negeri 59 Jakarta Angkatan 1999.',
  icons: {
    icon: '/images/forsil99apps.png',
    apple: '/images/forsil99apps.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Forsil99',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-100 font-sans">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
