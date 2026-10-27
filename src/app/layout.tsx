import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KASRA — Smart UMKM Workspace & Editable AI Copilot',
  description: 'Kinetic AI System for Retail Analytics & Accounting - Clean SaaS & Human-In-The-Loop AI for Indonesian UMKM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-[#121214] text-[#f4f4f6] antialiased selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
