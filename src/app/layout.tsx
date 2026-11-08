import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EFF2EC' },
    { media: '(prefers-color-scheme: dark)', color: '#0D1C42' },
  ],
};

export const metadata: Metadata = {
  title: 'KASRA — Sistem Kasir, Keuangan & Gudang Pintar UMKM',
  description:
    'Sistem pencatatan buku kas, analitik keuangan, notifikasi pintar, dan inventaris gudang terintegrasi untuk UMKM Indonesia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#EFF2EC] text-[#142413] antialiased selection:bg-[#52B743]/25 selection:text-[#142413]">
        {children}
      </body>
    </html>
  );
}
