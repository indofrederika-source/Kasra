'use client';

import React, { useState, useEffect, useRef } from 'react';
import { KasraLogo } from '@/components/ui/KasraLogo';
import {
  Mic,
  ScanLine,
  Calculator,
  FileSpreadsheet,
  FileText,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Clock,
  Wallet,
  Sparkles,
  Sun,
  Moon,
  Layers,
  Store,
  Coffee,
  Utensils,
  ShoppingBag,
  Croissant,
} from 'lucide-react';

interface LandingViewProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

/**
 * Slow, calm typewriter hook for headlines and interactive voice demos.
 */
function useSlowTypewriter(
  phrases: string[],
  typeSpeedMs = 88,
  deleteSpeedMs = 42,
  holdPauseMs = 3400,
  betweenPauseMs = 450
) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex] || '';

    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && charIndex < currentPhrase.length) {
      // Typing forward slowly
      timeout = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, typeSpeedMs);
    } else if (!isDeleting && charIndex === currentPhrase.length) {
      // Hold full phrase calmly before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, holdPauseMs);
    } else if (isDeleting && charIndex > 0) {
      // Deleting smoothly
      timeout = setTimeout(() => {
        setCharIndex((prev) => prev - 1);
      }, deleteSpeedMs);
    } else if (isDeleting && charIndex === 0) {
      // Move to next phrase after brief pause
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, betweenPauseMs);
    }

    return () => clearTimeout(timeout);
  }, [
    phrases,
    phraseIndex,
    charIndex,
    isDeleting,
    typeSpeedMs,
    deleteSpeedMs,
    holdPauseMs,
    betweenPauseMs,
  ]);

  const currentPhrase = phrases[phraseIndex] || '';
  return currentPhrase.slice(0, charIndex);
}

/**
 * Scroll-reveal wrapper that smoothly animates children into view when scrolled to.
 */
const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}> = ({ children, delayMs = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: isVisible ? '0ms' : `${delayMs}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-7 scale-[0.985]'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const HERO_TYPING_PHRASES = [
  'Dirancang untuk Bisnis Modern',
  'Otomatisasi Kas & Suara AI',
  'Gudang FEFO Tanpa Risiko Basi',
  'Laporan Resmi Standar KUR Bank',
];

const VOICE_DEMO_PHRASES = [
  '“Jual kopi susu 5 cup sama roti 2”',
  '“Beli ayam 6 ekor 120rb di pasar”',
  '“Bayar token listrik toko 100 ribu”',
];

export const LandingView: React.FC<LandingViewProps> = ({ onOpenAuth }) => {
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState<number>(1);
  const [isControlHovered, setIsControlHovered] = useState(false);
  const [heroMounted, setHeroMounted] = useState(false);

  // Slow typewriter for Hero Headline line 2
  const typedHeadline = useSlowTypewriter(HERO_TYPING_PHRASES, 90, 42, 3400, 450);

  // Slow typewriter for Voice AI Bento Card live simulation
  const typedVoiceCommand = useSlowTypewriter(VOICE_DEMO_PHRASES, 82, 36, 2900, 400);

  useEffect(() => {
    setHeroMounted(true);
    try {
      const saved = localStorage.getItem('kasra_ui_theme');
      const darkActive = saved === 'dark';
      setIsDark(darkActive);
      document.documentElement.classList.toggle('dark-theme', darkActive);
    } catch {
      // ignore
    }
  }, []);

  // Track scroll position across window/document/containers to morph fixed header into floating pill
  useEffect(() => {
    const computeScrollTop = (eventTarget?: EventTarget | null) => {
      const winY =
        typeof window !== 'undefined'
          ? window.scrollY || window.pageYOffset || 0
          : 0;
      const docY =
        typeof document !== 'undefined'
          ? document.documentElement?.scrollTop || document.body?.scrollTop || 0
          : 0;
      const targetY =
        eventTarget &&
        eventTarget !== document &&
        eventTarget !== window &&
        typeof (eventTarget as HTMLElement).scrollTop === 'number'
          ? (eventTarget as HTMLElement).scrollTop
          : 0;
      return Math.max(winY, docY, targetY);
    };

    const handleScroll = (e?: Event) => {
      const top = computeScrollTop(e?.target);
      const scrolled = top > 28;
      setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () =>
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
  }, []);

  // Gentle auto-cycle for the 4-tab Control & Scale section when not hovered
  useEffect(() => {
    if (isControlHovered) return;
    const timer = setInterval(() => {
      setActiveControlTab((prev) => (prev + 1) % 4);
    }, 5500);
    return () => clearInterval(timer);
  }, [isControlHovered]);

  const handleToggleTheme = (nextDark: boolean) => {
    setIsDark(nextDark);
    try {
      localStorage.setItem('kasra_ui_theme', nextDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark-theme', nextDark);
    } catch {
      // ignore
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const controlFeatures = [
    {
      id: 0,
      title: 'Kendali Arus Kas Terpusat',
      badge: 'Real-Time Ledger',
      heading: 'Pantau Saldo Kas & Laba Bersih Setiap Detik',
      description:
        'Lihat posisi kas usaha, pemasukan harian, dan rasio efisiensi belanja bahan baku secara langsung tanpa menunggu rekap akhir bulan.',
      metricLabel: 'Total Saldo Kas Usaha',
      metricValue: 'Rp 34.820.000',
      subText: '+14.5% dibandingkan bulan lalu • Kas Aktif',
    },
    {
      id: 1,
      title: 'Manajemen Batch FEFO Anti-Basi',
      badge: 'First-Expired, First-Out',
      heading: 'Prioritaskan Bahan Baku yang Lebih Dulu Kedaluwarsa',
      description:
        'Setiap kulakan otomatis tercatat dalam batch bertanggal. Saat batch lama habis, status kedaluwarsa otomatis berpindah ke batch berikutnya.',
      metricLabel: 'Prioritas Keluar Gudang (FEFO)',
      metricValue: 'Batch 04 Nov 2026',
      subText: '142 SKU Terlindungi • 0 Bahan Baku Terbuang',
    },
    {
      id: 2,
      title: 'Kalkulator HPP & Margin 3-Metode',
      badge: 'Smart Pricing Engine',
      heading: 'Hitung Modal per Porsi & Rekomendasi Harga Jual Instan',
      description:
        'Pilih metode Bagi Grosir/Dus, Komposisi Resep Dapur, atau Input Retail. Geser slider margin untuk melihat simulasi laba bersih per unit.',
      metricLabel: 'Estimasi Margin Laba Kotor',
      metricValue: '42.8% Margin',
      subText: 'HPP Rp 10.300/cup → Rekomendasi Jual Rp 18.000',
    },
    {
      id: 3,
      title: 'Generator Laporan Bank (KUR) 1-Klik',
      badge: 'Bank-Ready Export',
      heading: 'Cetak Dokumen Laba Rugi Standar Perbankan & Excel',
      description:
        'Ekspor jurnal transaksi dan evaluasi aset gudang ke PDF resmi ber-kop toko atau lembar kerja Excel (.xlsx) untuk pengajuan Kredit Usaha Rakyat.',
      metricLabel: 'Status Kelayakan Dokumen KUR',
      metricValue: '100% Tervalidasi',
      subText: 'PDF Resmi + Kop Usaha & Spreadsheet Sinkron',
    },
  ];

  return (
    <div
      className={`min-h-screen w-full font-sans transition-colors duration-300 ${
        isDark
          ? 'bg-[#0D1C42] text-[#FCF1D0] selection:bg-[#FCF1D0] selection:text-[#0D1C42]'
          : 'bg-[#EFF2EC] text-[#142413] selection:bg-[#1E3D1C] selection:text-[#F8FAF6]'
      }`}
    >
      {/* ====================================================================
          1. MORPHING FIXED HEADER (Follows Top of Viewport at All Times)
             - At top (scrollTop <= 28): Full-width header bar
             - On scroll down (scrollTop > 28): Compact floating pill navbar
         ==================================================================== */}
      <div
        className={`fixed inset-x-0 z-50 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled ? 'top-3.5 px-3 sm:px-6' : 'top-0 px-0'
        }`}
      >
        <header
          className={`pointer-events-auto mx-auto backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled
              ? isDark
                ? 'max-w-4xl rounded-full border border-[#345294] bg-[#0D1C42]/92 px-4 sm:px-6 h-14 shadow-[0_16px_40px_rgba(7,16,38,0.6)]'
                : 'max-w-4xl rounded-full border border-[#CFD9C8] bg-[#F8FAF6]/92 px-4 sm:px-6 h-14 shadow-[0_14px_36px_rgba(20,42,18,0.16)]'
              : isDark
              ? 'w-full max-w-full rounded-none border-b border-[#345294]/70 bg-[#0D1C42]/85 px-4 sm:px-6 lg:px-8 h-18'
              : 'w-full max-w-full rounded-none border-b border-[#DEE5D9] bg-[#EFF2EC]/85 px-4 sm:px-6 lg:px-8 h-18'
          }`}
        >
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3">
            {/* Brand Logo */}
            <div
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            >
              <div
                className={`rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-105 ${
                  isScrolled ? 'w-8 h-8 rounded-xl' : 'w-10 h-10'
                } ${
                  isDark
                    ? 'bg-[#22396F] border border-[#345294] text-[#FCF1D0]'
                    : 'bg-gradient-to-br from-[#234720] to-[#152E14] text-[#F8FAF6]'
                }`}
              >
                <KasraLogo className={isScrolled ? 'w-4 h-4' : 'w-5 h-5'} />
              </div>
              <div className="flex flex-col">
                <span
                  className={`font-extrabold tracking-tight leading-none transition-all ${
                    isScrolled ? 'text-sm' : 'text-base'
                  }`}
                >
                  KASRA
                </span>
                {!isScrolled && (
                  <span
                    className={`text-[10px] font-medium tracking-wider uppercase mt-0.5 ${
                      isDark ? 'text-[#B8C4E0]' : 'text-[#627060]'
                    }`}
                  >
                    Smart UMKM OS
                  </span>
                )}
              </div>
            </div>

            {/* Center Navigation Links */}
            <nav
              className={`hidden md:flex items-center text-xs font-semibold transition-all duration-300 ${
                isScrolled ? 'gap-5' : 'gap-7'
              }`}
            >
              {[
                { label: 'Beranda', id: 'hero' },
                { label: 'Visi & Dampak', id: 'editorial' },
                { label: 'Fitur Terpadu', id: 'bento-features' },
                { label: 'Operasional AI', id: 'omni-reach' },
                { label: 'Keunggulan', id: 'control-scale' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`transition-colors cursor-pointer whitespace-nowrap ${
                    isDark
                      ? 'text-[#B8C4E0] hover:text-[#FCF1D0]'
                      : 'text-[#4E5E4C] hover:text-[#142413]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right Actions: Theme Switcher + Login + Get Started */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Theme Toggle Pill */}
              <div
                className={`inline-flex items-center p-0.5 sm:p-1 rounded-full border text-[11px] font-bold ${
                  isDark
                    ? 'bg-[#22396F] border-[#345294]'
                    : 'bg-[#E5EAE0] border-[#D8E0D2]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleTheme(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#FCF1D0] text-[#0D1C42] font-extrabold shadow-2xs'
                      : 'text-[#627060] hover:text-[#142413]'
                  }`}
                  title="Dark Mode"
                >
                  <Moon className="w-3 h-3" />
                  {!isScrolled && <span className="hidden sm:inline">Dark</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTheme(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    !isDark
                      ? 'bg-[#1E3D1C] text-[#F8FAF6] font-extrabold shadow-2xs'
                      : 'text-[#FCF1D0]/75 hover:text-[#FCF1D0]'
                  }`}
                  title="Light Mode"
                >
                  <Sun className="w-3 h-3" />
                  {!isScrolled && <span className="hidden sm:inline">Light</span>}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className={`hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#FCF1D0] hover:bg-[#22396F]'
                    : 'text-[#1E3D1C] hover:bg-[#E5EAE0]'
                }`}
              >
                Masuk
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className={`rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                  isScrolled ? 'px-3.5 py-1.5' : 'px-4 py-2.5'
                } ${
                  isDark
                    ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
                    : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6] shadow-[#1E3D1C]/15'
                }`}
              >
                Mulai Gratis
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Spacer for initial fixed header height */}
      <div className="h-18" aria-hidden="true" />

      {/* ====================================================================
          2. HERO SECTION (With Slow Typewriter & Floating 3D Bento Widgets)
         ==================================================================== */}
      <section id="hero" className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 overflow-hidden scroll-mt-24">
        {/* Atmospheric Botanical / Horizon Wave Backdrop */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-[62%] transition-colors ${
            isDark
              ? 'bg-gradient-to-b from-transparent via-[#172A57]/80 to-[#091533]'
              : 'bg-gradient-to-b from-transparent via-[#DCE6D6]/75 to-[#20401E]'
          }`}
        />
        {/* Subtle Horizon Wave SVG */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-72 sm:h-96 opacity-35"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill={isDark ? '#22396F' : '#2C5629'}
            d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,154.7C840,149,960,171,1080,181.3C1200,192,1320,192,1380,192L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
          <path
            fill={isDark ? '#142654' : '#1E3D1C'}
            fillOpacity="0.85"
            d="M0,224L80,213.3C160,203,320,181,480,186.7C640,192,800,224,960,229.3C1120,235,1280,213,1360,202.7L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          />
        </svg>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Eyebrow Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs mb-6 transition-all duration-700 ${
              heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-[#F8FAF6] border-[#D8E2D3] text-[#1E3D1C]'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                isDark ? 'bg-[#FCF1D0] text-[#0D1C42]' : 'bg-[#57C446] text-white'
              }`}
            >
              ✓
            </span>
            <span>Enterprise-Grade UMKM Finance & FEFO Platform</span>
          </div>

          {/* Main Display Headline with Smooth Slow Typewriter (Zero Layout Shift) */}
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] max-w-4xl mx-auto transition-all duration-700 delay-100 ${
              heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <span className="block">Kecerdasan Finansial,</span>
            <span className="grid mt-1 place-items-center">
              {/* Invisible placeholder of longest phrase to prevent any vertical layout shift */}
              <span
                aria-hidden="true"
                className="invisible select-none pointer-events-none col-start-1 row-start-1"
              >
                Laporan Resmi Standar KUR Bank
              </span>
              <span
                className={`col-start-1 row-start-1 ${
                  isDark ? 'text-[#FCF1D0]' : 'text-[#1E3D1C]'
                }`}
              >
                {typedHeadline}
                <span
                  className={`inline-block w-[3px] sm:w-[4px] h-[0.82em] ml-1.5 align-middle rounded-full animate-kasra-caret ${
                    isDark ? 'bg-[#6EE7B7]' : 'bg-[#57C446]'
                  }`}
                />
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mt-5 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-medium transition-all duration-700 delay-200 ${
              heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            } ${isDark ? 'text-[#B8C4E0]' : 'text-[#4F604D]'}`}
          >
            Pantau performa keuangan toko secara menyeluruh. Catat kas lewat suara
            multi-klausul atau scan struk belanja, kelola stok gudang FEFO, dan cetak
            laporan resmi KUR Bank dari satu platform terpercaya.
          </p>

          {/* Dual CTA Buttons */}
          <div
            className={`mt-8 flex items-center justify-center gap-3 flex-wrap transition-all duration-700 delay-300 ${
              heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className={`px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42] shadow-[#071026]/40'
                  : 'bg-[#1E3D1C] hover:bg-[#152D14] text-[#F8FAF6] shadow-[#1E3D1C]/25'
              }`}
            >
              Mulai Sekarang
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('bento-features')}
              className={`px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold border backdrop-blur-md transition-all hover:-translate-y-0.5 cursor-pointer ${
                isDark
                  ? 'bg-[#22396F]/70 hover:bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                  : 'bg-[#F8FAF6]/85 hover:bg-[#F8FAF6] border-[#D5DFD0] text-[#142413] shadow-xs'
              }`}
            >
              Pelajari Fitur
            </button>
          </div>

          {/* ================================================================
              HERO FLOATING DASHBOARD SHOWCASE (Mirrors Reference Image 1)
             ================================================================ */}
          <div
            className={`relative mt-12 sm:mt-16 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${
              heroMounted
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-10 scale-95'
            }`}
          >
            {/* Floating Top-Left Circular Wallet / Mic Icon Badge */}
            <div
              className={`hidden sm:flex absolute -top-6 left-12 lg:left-16 z-30 w-14 h-14 rounded-full border items-center justify-center shadow-xl animate-kasra-float-badge ${
                isDark
                  ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                  : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#1E3D1C]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-[#0D1C42] text-[#FCF1D0]' : 'bg-[#1E3D1C] text-[#F8FAF6]'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            {/* Floating Bottom-Left Tilted Card: "Arus Kas Mingguan" Pill Bar Card */}
            <div
              className={`hidden md:block absolute -left-8 lg:-left-16 -bottom-6 z-30 w-56 rounded-[28px] p-4 border shadow-2xl animate-kasra-float-left ${
                isDark
                  ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0]'
                  : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#142413]'
              }`}
            >
              <div className="text-[11px] font-bold text-left mb-3 opacity-85">
                Arus Kas Mingguan
              </div>
              <div className="grid grid-cols-6 gap-2 items-end h-24 pt-2 px-1">
                {[
                  { m: 'Sen', h: '58%', active: false },
                  { m: 'Sel', h: '36%', active: false },
                  { m: 'Rab', h: '86%', active: true },
                  { m: 'Kam', h: '52%', active: false },
                  { m: 'Jum', h: '44%', active: false },
                  { m: 'Sab', h: '76%', active: true },
                ].map((b) => (
                  <div key={b.m} className="flex flex-col items-center gap-1.5 h-full">
                    <div
                      className={`w-full flex-1 rounded-full flex items-end overflow-hidden ${
                        isDark ? 'bg-[#0D1C42]' : 'bg-[#E5EAE0]'
                      }`}
                    >
                      <div
                        className={`w-full rounded-full transition-all duration-1000 ${
                          b.active
                            ? isDark
                              ? 'bg-[#FCF1D0]'
                              : 'bg-[#1E3D1C]'
                            : isDark
                            ? 'bg-[#4A6BB5]'
                            : 'bg-[#57C446]'
                        }`}
                        style={{ height: heroMounted ? b.h : '15%' }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold opacity-65">{b.m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating Top-Right Tilted Folder/Pocket Card: "Nilai Aset Gudang FEFO" */}
            <div
              className={`hidden md:block absolute -right-6 lg:-right-14 -top-8 z-30 w-56 rounded-[28px] p-3.5 border shadow-2xl animate-kasra-float-right ${
                isDark
                  ? 'bg-[#172A57] border-[#345294]'
                  : 'bg-[#F8FAF6] border-[#DEE5D9]'
              }`}
            >
              {/* Layered folder tabs */}
              <div className="space-y-1">
                <div
                  className={`mx-3 h-2.5 rounded-t-xl ${
                    isDark ? 'bg-[#345294]/60' : 'bg-[#CBE2C4]'
                  }`}
                />
                <div
                  className={`mx-1.5 h-2.5 rounded-t-xl ${
                    isDark ? 'bg-[#4A6BB5]/75' : 'bg-[#86C97A]'
                  }`}
                />
                <div
                  className={`rounded-2xl p-4 text-left ${
                    isDark
                      ? 'bg-gradient-to-br from-[#22396F] to-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                      : 'bg-gradient-to-br from-[#234720] to-[#152D14] text-[#F8FAF6]'
                  }`}
                >
                  <div className="text-[10px] opacity-80 font-medium">
                    Nilai Aset Gudang FEFO
                  </div>
                  <div className="text-lg font-extrabold font-mono mt-0.5">
                    Rp 18.450.000
                  </div>
                  <div
                    className={`text-[10px] mt-1 font-semibold ${
                      isDark ? 'text-[#6EE7B7]' : 'text-[#6EE75A]'
                    }`}
                  >
                    ● 142 SKU Aman • 0 Basi
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Bottom-Right Currency / Standar KUR Badge */}
            <div
              className={`hidden sm:flex absolute -bottom-5 right-6 lg:right-10 z-30 items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-xl animate-kasra-float-badge ${
                isDark
                  ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0]'
                  : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#142413]'
              }`}
            >
              <span className="w-7 h-7 rounded-full overflow-hidden flex flex-col border border-black/10 shrink-0">
                <span className="w-full h-1/2 bg-red-600 block" />
                <span className="w-full h-1/2 bg-white block" />
              </span>
              <div className="text-left">
                <span className="text-xs font-extrabold tracking-tight font-mono">
                  IDR
                </span>{' '}
                <span className="text-xs font-medium opacity-70">• Standar KUR</span>
              </div>
            </div>

            {/* MAIN CENTER 3-COLUMN GLASSMORPHIC METRIC BOARD */}
            <div
              className={`rounded-[34px] p-3 sm:p-4 border backdrop-blur-xl shadow-2xl ${
                isDark
                  ? 'bg-[#22396F]/75 border-[#345294]'
                  : 'bg-[#F8FAF6]/80 border-white/90 shadow-[0_24px_60px_rgba(20,42,18,0.22)]'
              }`}
            >
              <div
                className={`rounded-[26px] border grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x overflow-hidden text-left ${
                  isDark
                    ? 'bg-[#172A57] border-[#345294] divide-[#2B4580]'
                    : 'bg-[#F8FAF6] border-[#E2E8DD] divide-[#E6ECE1]'
                }`}
              >
                {/* Metric Col 1: Total Cash */}
                <div className="p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-medium opacity-65">Total Saldo Kas</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-2">
                      Rp 34,8 Jt
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-bold mt-1.5 ${
                        isDark ? 'text-[#6EE7B7]' : 'text-[#21571D]'
                      }`}
                    >
                      <span>▲ 14.5%</span>
                      <span className="font-normal opacity-75">bulan ini</span>
                    </div>
                  </div>
                  <svg className="w-full h-14" viewBox="0 0 200 55" fill="none">
                    <path
                      d="M0 45 C30 42, 45 20, 75 28 C105 36, 125 12, 155 18 C175 22, 185 8, 200 12 L200 55 L0 55 Z"
                      fill={isDark ? 'rgba(110,231,183,0.15)' : 'rgba(87,196,70,0.16)'}
                    />
                    <path
                      d="M0 45 C30 42, 45 20, 75 28 C105 36, 125 12, 155 18 C175 22, 185 8, 200 12"
                      stroke={isDark ? '#6EE7B7' : '#52B743'}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Metric Col 2: Net Expense / Kulakan */}
                <div className="p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-medium opacity-65">
                      Belanja & Kulakan Stok
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-2">
                      -Rp 8,24 Jt
                    </div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 mt-1.5">
                      <span>▼ 4.2%</span>
                      <span className="font-normal opacity-75">hemat susut</span>
                    </div>
                  </div>
                  <svg className="w-full h-14" viewBox="0 0 200 55" fill="none">
                    <path
                      d="M0 38 C35 24, 65 42, 100 30 C135 18, 160 34, 200 22 L200 55 L0 55 Z"
                      fill={isDark ? 'rgba(184,196,224,0.12)' : 'rgba(30,61,28,0.10)'}
                    />
                    <path
                      d="M0 38 C35 24, 65 42, 100 30 C135 18, 160 34, 200 22"
                      stroke={isDark ? '#93A6D1' : '#387B32'}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Metric Col 3: Month Revenue */}
                <div className="p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-medium opacity-65">Omset Bulan Ini</div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-2">
                      Rp 43,0 Jt
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-bold mt-1.5 ${
                        isDark ? 'text-[#6EE7B7]' : 'text-[#21571D]'
                      }`}
                    >
                      <span>▲ 18.1%</span>
                      <span className="font-normal opacity-75">6 Bulan Terakhir</span>
                    </div>
                  </div>
                  <svg className="w-full h-14" viewBox="0 0 200 55" fill="none">
                    <path
                      d="M0 42 Q 35 18, 70 36 T 140 20 T 200 14"
                      stroke={isDark ? '#FCF1D0' : '#1E3D1C'}
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="140"
                      cy="20"
                      r="5"
                      fill={isDark ? '#FCF1D0' : '#57C446'}
                      stroke={isDark ? '#0D1C42' : '#FFFFFF'}
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Hero Trust Strip (UMKM Sectors) */}
          <div className="relative z-20 mt-16 pt-6 text-[#F8FAF6]">
            <p className="text-xs font-medium opacity-80 mb-5">
              Dirancang untuk mendukung ribuan pelaku usaha mikro, kecil, dan menengah di Indonesia
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-95">
              {[
                { icon: Coffee, name: 'Kafe & Coffee Shop' },
                { icon: Utensils, name: 'Kuliner & Resto' },
                { icon: Store, name: 'Toko Kelontong' },
                { icon: Croissant, name: 'Bakery & Pastry' },
                { icon: ShoppingBag, name: 'Grosir & Retail' },
              ].map((sector) => {
                const Icon = sector.icon;
                return (
                  <div
                    key={sector.name}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold tracking-tight transition-transform hover:scale-105"
                  >
                    <span className="w-7 h-7 rounded-full bg-white/15 backdrop-blur-xs flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span>{sector.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. EDITORIAL QUOTE & IMPACT CARDS SECTION (Reference Image 3 - Sec 2)
         ==================================================================== */}
      <section id="editorial" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-20">
        <RevealOnScroll>
          {/* Quote Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-14 border-b border-slate-200/80">
            <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.22] max-w-3xl">
              “Banyak UMKM masih terjebak pembukuan manual yang lambat. Kami membantu
              pelaku usaha melangkah maju{' '}
              <span className={isDark ? 'text-[#B8C4E0]' : 'text-[#6B7B68]'}>
                dengan kejelasan kas, struktur stok FEFO, dan kendali penuh.”
              </span>
            </blockquote>

            <div className="shrink-0 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                  isDark
                    ? 'bg-[#22396F] border border-[#345294] text-[#FCF1D0]'
                    : 'bg-[#1E3D1C] text-[#F8FAF6]'
                }`}
              >
                WL
              </div>
              <div>
                <div className="text-xs font-extrabold">Tim WongLarpers</div>
                <div className="text-[11px] text-slate-500">
                  Inovasi Finansial UMKM • Telkom University
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* Bottom 3-Column Impact Grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: 2 Stacked Value Props */}
          <RevealOnScroll delayMs={80} className="lg:col-span-4 flex flex-col justify-between gap-6 py-2">
            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <ShieldCheck
                  className={`w-4 h-4 ${isDark ? 'text-[#6EE7B7]' : 'text-[#21571D]'}`}
                />
                <span>Anti-Halusinasi (Human-in-the-Loop)</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Setiap instruksi suara atau hasil scan nota ditampilkan sebagai draf
                interaktif yang dapat Anda periksa sebelum masuk ke pembukuan.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Sparkles
                  className={`w-4 h-4 ${isDark ? 'text-[#FCF1D0]' : 'text-[#52B743]'}`}
                />
                <span>Siap Pengajuan Kredit Usaha (KUR)</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hasilkan laporan laba rugi ber-kop resmi dalam format PDF dan Excel hanya
                dengan satu klik kapan pun dibutuhkan bank.
              </p>
            </div>
          </RevealOnScroll>

          {/* Center Card: Giant "10x" Efficiency Metric */}
          <RevealOnScroll
            delayMs={180}
            className={`lg:col-span-4 rounded-[32px] p-7 border flex flex-col justify-between min-h-[230px] shadow-xs transition-transform hover:-translate-y-1 ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-[#F8FAF6] border-[#DEE5D9]'
            }`}
          >
            <div className="text-xs font-medium text-slate-500 leading-relaxed max-w-[220px]">
              Transaksi kas & mutasi stok tercatat otomatis lewat suara per kalimat majemuk
            </div>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono">
                10x
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isDark
                    ? 'bg-[#172A57] text-[#6EE7B7]'
                    : 'bg-[#E4F0E0] text-[#1E3D1C]'
                }`}
              >
                Lebih Cepat
              </span>
            </div>
          </RevealOnScroll>

          {/* Right Card: Readiness-styled Balance & Team Preview */}
          <RevealOnScroll
            delayMs={280}
            className={`lg:col-span-4 rounded-[32px] p-6 border flex flex-col justify-between min-h-[230px] shadow-lg transition-transform hover:-translate-y-1 ${
              isDark
                ? 'bg-gradient-to-br from-[#22396F] to-[#172A57] border-[#345294] text-[#FCF1D0]'
                : 'bg-gradient-to-br from-[#224520] via-[#1C3A1A] to-[#142B13] border-[#2F572D] text-[#F8FAF6]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold opacity-85 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#62CF50] animate-pulse" />
                Total Saldo Kas
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15">
                IDR • Aktif
              </span>
            </div>

            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                Rp 26.550.000
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-[#62CF50]/20 text-[#7CE86B] font-bold">
                  +18%
                </span>
                <span className="opacity-75">Lebih tinggi dari bulan lalu</span>
              </div>
            </div>

            <div
              className={`p-2.5 rounded-2xl flex items-center justify-between text-xs ${
                isDark ? 'bg-[#0D1C42]/70' : 'bg-[#2C5029]/90 border border-[#3C6639]'
              }`}
            >
              <div>
                <div className="font-bold text-[11px]">Catat Transaksi Cepat</div>
                <div className="text-[10px] opacity-75">Suara AI • Scan Struk • Numpad</div>
              </div>
              <div className="flex items-center -space-x-1.5">
                <span className="w-6 h-6 rounded-full bg-[#57C446] text-[#142413] font-bold text-[10px] flex items-center justify-center ring-2 ring-[#1E3D1C]">
                  🎙️
                </span>
                <span className="w-6 h-6 rounded-full bg-[#E5EAE0] text-[#142413] font-bold text-[10px] flex items-center justify-center ring-2 ring-[#1E3D1C]">
                  📸
                </span>
                <span className="w-6 h-6 rounded-full bg-[#FCF1D0] text-[#142413] font-bold text-[10px] flex items-center justify-center ring-2 ring-[#1E3D1C]">
                  +
                </span>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ====================================================================
          4. 5-CARD BENTO GRID: "ALL-IN-ONE PLATFORM" (Adapted from Ref Image 2)
         ==================================================================== */}
      <section
        id="bento-features"
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-20"
      >
        {/* Section Header */}
        <RevealOnScroll className="text-center max-w-2xl mx-auto mb-14">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#6EE7B7]' : 'text-[#21571D]'
            }`}
          >
            Fitur Komprehensif
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Platform Terpadu untuk Efisiensi Keuangan & Gudang
          </h2>
        </RevealOnScroll>

        {/* Top Row: 3 Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BENTO CARD 1: Voice AI Multi-Klausul (With Live Slow Typing Transcript) */}
          <RevealOnScroll
            delayMs={60}
            className={`rounded-[32px] p-6 border flex flex-col justify-between space-y-6 shadow-xs transition-all hover:-translate-y-1 ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-[#F8FAF6] border-[#DEE5D9]'
            }`}
          >
            {/* Visual UI Mock */}
            <div
              className={`rounded-[24px] p-4 border space-y-3 ${
                isDark
                  ? 'bg-[#172A57] border-[#345294]'
                  : 'bg-[#EFF3EC] border-[#E1E7DC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#57C446] animate-ping" />
                  <span>Voice AI Live Input</span>
                </span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-[#22396F]' : 'bg-[#F8FAF6] border border-[#DEE5D9]'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Animated Live Typing Transcript Pill */}
              <div
                className={`h-11 px-3 rounded-2xl border flex items-center justify-between gap-2 text-xs shadow-2xs ${
                  isDark
                    ? 'bg-[#22396F] border-[#345294]'
                    : 'bg-[#F8FAF6] border-[#DEE5D9]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#1E3D1C] text-[#F8FAF6] flex items-center justify-center text-[11px] shrink-0">
                    🎙️
                  </span>
                  <span className="font-bold truncate">
                    {typedVoiceCommand}
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-[#57C446] animate-kasra-caret" />
                  </span>
                </div>
              </div>

              {/* Parsed Output Pill */}
              <div
                className={`px-3 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                  isDark
                    ? 'bg-[#0D1C42]/70 border-[#345294]'
                    : 'bg-[#E5EAE0]/70 border-[#D8E0D2]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#57C446]/20 text-[#21571D] flex items-center justify-center text-[11px] shrink-0 font-bold">
                    ✓
                  </span>
                  <span className="font-bold truncate">Otomatisasi Kas & Stok</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                  <span className="text-emerald-600 font-bold">↑ Kasir</span>
                  <span className="font-extrabold">FEFO</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold">Asisten Suara AI Multi-Klausul</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ucapkan beberapa transaksi sekaligus dalam bahasa sehari-hari; sistem
                otomatis memisahkan kas masuk, belanja, dan mutasi stok.
              </p>
            </div>
          </RevealOnScroll>

          {/* BENTO CARD 2: Human-in-the-Loop Draft & Smart Notes */}
          <RevealOnScroll
            delayMs={160}
            className={`rounded-[32px] p-6 border flex flex-col justify-between space-y-6 shadow-xs transition-all hover:-translate-y-1 ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-[#F8FAF6] border-[#DEE5D9]'
            }`}
          >
            {/* Stacked Card Visual Mock */}
            <div className="pt-2">
              <div
                className={`mx-5 h-3 rounded-t-2xl ${
                  isDark ? 'bg-[#345294]/40' : 'bg-[#DCE6D6]'
                }`}
              />
              <div
                className={`mx-2.5 h-3 rounded-t-2xl ${
                  isDark ? 'bg-[#345294]/70' : 'bg-[#C8D8C0]'
                }`}
              />
              <div
                className={`rounded-[24px] p-4 border space-y-2.5 shadow-sm ${
                  isDark
                    ? 'bg-[#172A57] border-[#345294]'
                    : 'bg-[#EFF3EC] border-[#DEE5D9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDark
                        ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                        : 'bg-[#F8FAF6] border-[#D8E0D2] text-[#1E3D1C]'
                    }`}
                  >
                    <Clock className="w-3 h-3" /> Baru saja
                  </span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-[#22396F]' : 'bg-[#F8FAF6] border border-[#DEE5D9]'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div>
                  <div className="text-xs font-extrabold">
                    Periksa draf konfirmasi AI & FEFO
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tinjau 2 mutasi suara & peringatan stok susu sebelum disimpan.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center -space-x-2">
                    <span className="w-7 h-7 rounded-full bg-[#1E3D1C] text-[#F8FAF6] text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      NR
                    </span>
                    <span className="w-7 h-7 rounded-full bg-[#57C446] text-[#142413] text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      IF
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isDark
                        ? 'bg-[#FCF1D0] text-[#0D1C42]'
                        : 'bg-[#1E3D1C] text-[#F8FAF6]'
                    }`}
                  >
                    Setujui Draf ✓
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold">
                Draf Konfirmasi & Peringatan FEFO
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Jaga akurasi pembukuan dengan persetujuan draf interaktif dan pengingat
                otomatis untuk barang yang mendekati tanggal kedaluwarsa.
              </p>
            </div>
          </RevealOnScroll>

          {/* BENTO CARD 3: Track Bills & Payment Histories */}
          <RevealOnScroll
            delayMs={260}
            className={`rounded-[32px] p-6 border flex flex-col justify-between space-y-6 shadow-xs transition-all hover:-translate-y-1 ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-[#F8FAF6] border-[#DEE5D9]'
            }`}
          >
            <div
              className={`rounded-[24px] p-4 border space-y-2 ${
                isDark
                  ? 'bg-[#172A57] border-[#345294]'
                  : 'bg-[#EFF3EC] border-[#E1E7DC]'
              }`}
            >
              <div className="text-xs font-bold mb-2">Riwayat Kas & Mutasi</div>

              {[
                {
                  emoji: '🍜',
                  title: 'Penjualan Kasir Siang',
                  sub: 'Penjualan • Tunai/QRIS',
                  amount: '+Rp 450rb',
                  date: 'Hari Ini',
                  isIncome: true,
                },
                {
                  emoji: '🛒',
                  title: 'Kulakan Ayam & Sayur',
                  sub: 'Bahan Baku • +6 Ekor',
                  amount: '-Rp 120rb',
                  date: 'Hari Ini',
                  isIncome: false,
                },
                {
                  emoji: '💡',
                  title: 'Token Listrik & Air Toko',
                  sub: 'Operasional Toko',
                  amount: '-Rp 100rb',
                  date: 'Kemarin',
                  isIncome: false,
                },
              ].map((row) => (
                <div
                  key={row.title}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm shrink-0">{row.emoji}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold truncate">{row.title}</div>
                      <div className="text-[9px] text-slate-400 truncate">{row.sub}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-[11px] font-extrabold font-mono ${
                        row.isIncome
                          ? isDark
                            ? 'text-[#6EE7B7]'
                            : 'text-[#21571D]'
                          : 'text-rose-500'
                      }`}
                    >
                      {row.amount}
                    </div>
                    <div className="text-[9px] text-slate-400">{row.date}</div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-base font-extrabold">Buku Kas & Mutasi Terhubung</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Lacak seluruh penjualan kasir, kulakan bahan baku, dan pengeluaran
                operasional dalam satu buku kas yang rapi.
              </p>
            </div>
          </RevealOnScroll>
        </div>

        {/* Bottom Row: 2 Wide Bento Cards */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* BENTO CARD 4: Integrated Ecosystem Brick Grid */}
          <RevealOnScroll
            delayMs={120}
            className={`lg:col-span-6 rounded-[32px] p-6 sm:p-7 border flex flex-col justify-between space-y-6 shadow-xs transition-all hover:-translate-y-1 ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-[#F8FAF6] border-[#DEE5D9]'
            }`}
          >
            {/* Brick Grid Visual */}
            <div
              className={`rounded-[24px] p-4 sm:p-5 border space-y-2.5 ${
                isDark
                  ? 'bg-[#172A57] border-[#345294]'
                  : 'bg-[#EFF3EC] border-[#E1E7DC]'
              }`}
            >
              {/* Brick Row 1 */}
              <div className="grid grid-cols-4 gap-2">
                <div
                  className={`h-11 rounded-xl border ${
                    isDark
                      ? 'bg-[#0D1C42]/40 border-[#2B4580]'
                      : 'bg-[#E5EAE0]/60 border-[#DCE3D6]'
                  }`}
                />
                <div
                  className={`col-span-2 h-11 rounded-xl border flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-2xs ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#1E3D1C]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#57C446]" />
                  <span>QRIS Nusantara</span>
                </div>
                <div
                  className={`h-11 rounded-xl border flex items-center justify-center font-bold text-[11px] ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294] text-[#6EE7B7]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#21571D]'
                  }`}
                >
                  GoPay
                </div>
              </div>

              {/* Brick Row 2 */}
              <div className="grid grid-cols-5 gap-2">
                <div
                  className={`h-11 rounded-xl border flex items-center justify-center font-bold text-[11px] ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9]'
                  }`}
                >
                  💳 EDC
                </div>
                <div
                  className={`h-11 rounded-xl border ${
                    isDark
                      ? 'bg-[#0D1C42]/40 border-[#2B4580]'
                      : 'bg-[#E5EAE0]/60 border-[#DCE3D6]'
                  }`}
                />
                <div
                  className={`col-span-2 h-11 rounded-xl border flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-2xs ${
                    isDark
                      ? 'bg-[#FCF1D0] text-[#0D1C42] border-[#FCF1D0]'
                      : 'bg-[#1E3D1C] text-[#F8FAF6] border-[#1E3D1C]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Standar KUR</span>
                </div>
                <div
                  className={`h-11 rounded-xl border flex items-center justify-center font-bold text-[10px] ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9] text-rose-600'
                  }`}
                >
                  DANA
                </div>
              </div>

              {/* Brick Row 3 */}
              <div className="grid grid-cols-4 gap-2">
                <div
                  className={`col-span-2 h-11 rounded-xl border flex items-center justify-center gap-1.5 font-extrabold text-xs shadow-2xs ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294] text-[#6EE7B7]'
                      : 'bg-[#E4F0E0] border-[#C5DFBE] text-[#1E3D1C]'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </div>
                <div
                  className={`h-11 rounded-xl border flex items-center justify-center font-bold text-[11px] ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9]'
                  }`}
                >
                  OVO
                </div>
                <div
                  className={`h-11 rounded-xl border flex items-center justify-center font-bold text-[11px] ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9]'
                  }`}
                >
                  BRI / BCA
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold">
                Format Laporan & Kanal Pembayaran Terintegrasi
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Catat transaksi dari berbagai metode pembayaran kasir dan ekspor langsung ke
                lembar kerja Excel maupun dokumen PDF standar pengajuan KUR Bank.
              </p>
            </div>
          </RevealOnScroll>

          {/* BENTO CARD 5: Smart Warehouse FEFO & HPP Pockets */}
          <RevealOnScroll
            delayMs={220}
            className={`lg:col-span-6 rounded-[32px] p-6 sm:p-7 border flex flex-col justify-between space-y-6 shadow-xs transition-all hover:-translate-y-1 ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-[#F8FAF6] border-[#DEE5D9]'
            }`}
          >
            {/* 3 Pocket Sub-Cards */}
            <div
              className={`rounded-[24px] p-4 sm:p-5 border space-y-3 ${
                isDark
                  ? 'bg-[#172A57] border-[#345294]'
                  : 'bg-[#EFF3EC] border-[#E1E7DC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Pos Inventaris & Batch FEFO</span>
                <span className="text-[10px] font-mono font-bold text-emerald-600">
                  ● 3 Kategori Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    icon: '🥩',
                    label: 'Bahan Dapur',
                    val: 'Rp 8,4 Jt',
                    sub: 'Batch 04 Nov • 92% Aman',
                  },
                  {
                    icon: '☕',
                    label: 'Kopi & Susu',
                    val: 'Rp 6,2 Jt',
                    sub: 'FEFO Prioritas Aktif',
                  },
                  {
                    icon: '🛍️',
                    label: 'Kemasan Cup',
                    val: 'Rp 3,8 Jt',
                    sub: 'Margin HPP +42%',
                  },
                ].map((pocket) => (
                  <div
                    key={pocket.label}
                    className={`rounded-2xl p-3.5 border space-y-1.5 ${
                      isDark
                        ? 'bg-[#22396F] border-[#345294]'
                        : 'bg-[#F8FAF6] border-[#DEE5D9]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold">
                      <span>{pocket.icon}</span>
                      <span className="truncate">{pocket.label}</span>
                    </div>
                    <div className="text-base font-extrabold font-mono tracking-tight">
                      {pocket.val}
                    </div>
                    <div className="text-[10px] text-slate-400">{pocket.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold">
                Gudang Multi-Batch FEFO & Kalkulator HPP
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kelompokkan stok per tanggal masuk, cegah kerugian bahan baku kedaluwarsa,
                dan hitung HPP otomatis dengan 3 metode fleksibel.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ====================================================================
          5. OMNI-INPUT & NUSANTARA UMKM REACH SECTION (Reference Image 3 - Map)
         ==================================================================== */}
      <section
        id="omni-reach"
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center scroll-mt-20"
      >
        <RevealOnScroll>
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#6EE7B7]' : 'text-[#21571D]'
            }`}
          >
            Operasional Tanpa Hambatan
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight max-w-xl mx-auto leading-tight">
            Catat Transaksi dari Mana Saja, Kapan Saja
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Tidak perlu mengetik satu per satu di tengah antrean pelanggan. Gunakan suara,
            kamera ponsel, atau numpad cepat dengan visibilitas penuh di setiap transaksi.
          </p>

          {/* 3 Feature Pills */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: Mic, label: 'Voice AI Bahasa Indonesia & Gaul' },
              { icon: ScanLine, label: 'Scan Foto Struk Belanja (OCR)' },
              { icon: Calculator, label: 'Kalkulator Kasir & Numpad Cepat' },
            ].map((pill) => {
              const Icon = pill.icon;
              return (
                <div
                  key={pill.label}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold shadow-2xs ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#1E3D1C]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-[#52B743]" />
                  <span>{pill.label}</span>
                </div>
              );
            })}
          </div>
        </RevealOnScroll>

        {/* Dotted Nusantara / Network Canvas with Floating Callout Badges */}
        <RevealOnScroll delayMs={120}>
          <div
            className={`relative mt-10 rounded-[36px] border p-8 sm:p-14 overflow-hidden min-h-[300px] flex items-center justify-center ${
              isDark
                ? 'bg-[#172A57]/70 border-[#345294]'
                : 'bg-[#F8FAF6]/80 border-[#DEE5D9]'
            }`}
            style={{
              backgroundImage: isDark
                ? 'radial-gradient(#345294 1.25px, transparent 1.25px)'
                : 'radial-gradient(#C5D4BE 1.35px, transparent 1.35px)',
              backgroundSize: '18px 18px',
            }}
          >
            {/* Decorative Connecting Arcs SVG */}
            <svg
              className="pointer-events-none absolute inset-0 w-full h-full opacity-40"
              viewBox="0 0 800 300"
              fill="none"
            >
              <path
                d="M140 95 Q 290 30, 410 140 T 670 90"
                stroke={isDark ? '#6EE7B7' : '#52B743'}
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
              <path
                d="M210 215 Q 400 130, 620 210"
                stroke={isDark ? '#FCF1D0' : '#1E3D1C'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Floating UMKM Activity Nodes */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
              {[
                {
                  city: 'Bandung • Kedai Kopi',
                  action: '🎙️ “Laku kopi susu 8 cup”',
                  delta: '+Rp 144.000',
                  color: 'bg-[#57C446]',
                },
                {
                  city: 'Surabaya • Warung Makan',
                  action: '📸 Scan Struk Kulakan Pasar',
                  delta: '+12 SKU Gudang',
                  color: 'bg-[#1E3D1C]',
                },
                {
                  city: 'Jakarta • Toko Kelontong',
                  action: '📄 Ekspor PDF Resmi KUR',
                  delta: 'Siap Ajukan Bank',
                  color: 'bg-amber-500',
                },
                {
                  city: 'Yogyakarta • Bakery & Kue',
                  action: '📦 Prioritas FEFO Tepung & Susu',
                  delta: '0 Kadaluwarsa',
                  color: 'bg-[#57C446]',
                },
                {
                  city: 'Semarang • Grosir Sembako',
                  action: '🧮 Kalkulator HPP Bagi Dus',
                  delta: 'Margin +28%',
                  color: 'bg-[#1E3D1C]',
                },
                {
                  city: 'Medan • Resto Keluarga',
                  action: '🔢 Quick Numpad Kasir',
                  delta: '+Rp 850.000',
                  color: 'bg-[#57C446]',
                },
              ].map((node) => (
                <div
                  key={node.city}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    isDark
                      ? 'bg-[#22396F] border-[#345294]'
                      : 'bg-[#F8FAF6] border-[#DEE5D9]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 animate-pulse ${node.color}`}
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold truncate">{node.city}</div>
                      <div className="text-[10px] text-slate-500 truncate">{node.action}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono shrink-0 ${
                      isDark
                        ? 'bg-[#172A57] text-[#6EE7B7]'
                        : 'bg-[#E4F0E0] text-[#1E3D1C]'
                    }`}
                  >
                    {node.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ====================================================================
          6. INTERACTIVE FEATURE SWITCHER: "BUILT FOR CONTROL & SCALE"
         ==================================================================== */}
      <section
        id="control-scale"
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto scroll-mt-20"
        onMouseEnter={() => setIsControlHovered(true)}
        onMouseLeave={() => setIsControlHovered(false)}
      >
        <RevealOnScroll className="text-center max-w-2xl mx-auto mb-14">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#6EE7B7]' : 'text-[#21571D]'
            }`}
          >
            Mengapa Memilih KASRA
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Dirancang untuk Kendali, Skala Usaha, dan Akurasi Operasional
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delayMs={100}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: 4 Interactive Tab Items */}
            <div className="lg:col-span-4 space-y-2">
              {controlFeatures.map((item) => {
                const isSelected = activeControlTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveControlTab(item.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0] font-extrabold shadow-sm translate-x-1'
                          : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#142413] font-extrabold shadow-xs translate-x-1'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${
                          isDark ? 'text-[#FCF1D0]' : 'text-[#1E3D1C]'
                        }`}
                      />
                    )}
                    <span className="text-xs sm:text-sm">{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Center Column: Interactive Visual Card Showcase */}
            <div className="lg:col-span-4 flex justify-center">
              <div
                key={activeControlTab}
                className={`w-full max-w-sm rounded-[36px] p-5 border shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95 ${
                  isDark
                    ? 'bg-gradient-to-br from-[#22396F] to-[#13234B] border-[#345294]'
                    : 'bg-gradient-to-br from-[#DCE7D6] via-[#C8DAC0] to-[#21431F] border-[#C5D6BE]'
                }`}
              >
                <div
                  className={`rounded-[28px] p-5 border space-y-4 ${
                    isDark
                      ? 'bg-[#0D1C42]/90 border-[#345294] text-[#FCF1D0]'
                      : 'bg-[#F8FAF6]/95 border-white text-[#142413]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">
                      {controlFeatures[activeControlTab].title}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isDark
                          ? 'bg-[#22396F] text-[#6EE7B7]'
                          : 'bg-[#E4F0E0] text-[#1E3D1C]'
                      }`}
                    >
                      {controlFeatures[activeControlTab].badge}
                    </span>
                  </div>

                  {/* Inner Readiness-style Forest Card */}
                  <div
                    className={`rounded-2xl p-5 space-y-3 ${
                      isDark
                        ? 'bg-gradient-to-br from-[#22396F] to-[#172A57] text-[#FCF1D0] border border-[#345294]'
                        : 'bg-gradient-to-br from-[#224520] via-[#1C3A1A] to-[#142B13] text-[#F8FAF6]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] opacity-80">
                      <span>{controlFeatures[activeControlTab].metricLabel}</span>
                      <KasraLogo className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-extrabold font-mono tracking-tight">
                      {controlFeatures[activeControlTab].metricValue}
                    </div>
                    <div className="text-[11px] text-[#7CE86B] font-medium">
                      {controlFeatures[activeControlTab].subText}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="h-1.5 rounded-full bg-[#62CF50]" />
                      <div className="h-1.5 rounded-full bg-[#62CF50]/75" />
                      <div className="h-1.5 rounded-full bg-white/25" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Description & Action Link */}
            <div className="lg:col-span-4 space-y-4">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                  isDark
                    ? 'bg-[#22396F] text-[#FCF1D0]'
                    : 'bg-[#E4F0E0] text-[#1E3D1C]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{controlFeatures[activeControlTab].badge}</span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                {controlFeatures[activeControlTab].heading}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {controlFeatures[activeControlTab].description}
              </p>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className={`inline-flex items-center gap-1.5 text-xs font-extrabold underline underline-offset-4 cursor-pointer ${
                  isDark ? 'text-[#FCF1D0]' : 'text-[#1E3D1C]'
                }`}
              >
                <span>Buka Workspace Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ====================================================================
          7. FINAL CTA & SCENIC WATERMARK FOOTER (Reference Image 3 - Bottom)
         ==================================================================== */}
      <section className="relative pt-16 overflow-hidden">
        {/* Top CTA Block */}
        <RevealOnScroll className="relative z-10 max-w-3xl mx-auto px-4 text-center pb-16">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#6EE7B7]' : 'text-[#21571D]'
            }`}
          >
            Mulai Hari Ini
          </span>
          <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Ambil Kendali Penuh Atas Operasional Keuangan Toko Anda
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Bergabung bersama pelaku UMKM modern yang mengelola kas, stok gudang FEFO,
            dan laporan perbankan dengan tenang dan terstruktur.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className={`px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
                  : 'bg-[#1E3D1C] hover:bg-[#152D14] text-[#F8FAF6]'
              }`}
            >
              Mulai Gunakan Gratis
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className={`px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold border transition-all hover:-translate-y-0.5 cursor-pointer ${
                isDark
                  ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                  : 'bg-[#F8FAF6] border-[#DEE5D9] text-[#142413]'
              }`}
            >
              Masuk Akun
            </button>
          </div>
        </RevealOnScroll>

        {/* Scenic Botanical Wave Banner + Giant "KASRA." Watermark */}
        <div
          className={`relative pt-14 pb-12 px-4 sm:px-6 lg:px-8 transition-colors ${
            isDark
              ? 'bg-gradient-to-b from-transparent via-[#15295B] to-[#08122C] text-[#FCF1D0]'
              : 'bg-gradient-to-b from-transparent via-[#365E33] to-[#173015] text-[#F8FAF6]'
          }`}
        >
          {/* Giant Watermark Wordmark + Center Card Showcase */}
          <div className="max-w-6xl mx-auto relative flex flex-col items-center justify-center py-6 sm:py-10 select-none">
            <div className="text-[68px] sm:text-[130px] lg:text-[175px] font-black tracking-tighter leading-none opacity-25 text-white">
              KASRA.
            </div>

            {/* Center Floating Mini Card Overlapping Watermark */}
            <div
              onClick={() => onOpenAuth('register')}
              className={`sm:absolute rounded-3xl p-4 sm:p-5 border shadow-2xl cursor-pointer transition-transform hover:scale-105 animate-kasra-float-badge ${
                isDark
                  ? 'bg-[#22396F]/95 border-[#345294] text-[#FCF1D0]'
                  : 'bg-[#1E3D1C]/95 border-[#3C6939] text-[#F8FAF6]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#57C446] text-[#112410] flex items-center justify-center">
                  <KasraLogo className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold">KASRA Smart Workspace</div>
                  <div className="text-[10px] opacity-80 font-mono">
                    Voice AI • Gudang FEFO • Laporan KUR
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Glassmorphic Footer Links Box */}
          <footer className="max-w-6xl mx-auto mt-6 rounded-[28px] bg-black/20 backdrop-blur-md border border-white/15 p-6 sm:p-8 text-xs text-white/85">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-2.5">
                <div className="font-bold text-white/50 uppercase text-[10px] tracking-wider">
                  Produk
                </div>
                <ul className="space-y-2 font-medium">
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection('bento-features')}
                      className="hover:text-white cursor-pointer"
                    >
                      Buku Kas Digital
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection('bento-features')}
                      className="hover:text-white cursor-pointer"
                    >
                      Gudang Multi-Batch FEFO
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection('control-scale')}
                      className="hover:text-white cursor-pointer"
                    >
                      Kalkulator HPP 3-Metode
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => scrollToSection('control-scale')}
                      className="hover:text-white cursor-pointer"
                    >
                      Quick Numpad Kasir
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <div className="font-bold text-white/50 uppercase text-[10px] tracking-wider">
                  Solusi UMKM
                </div>
                <ul className="space-y-2 font-medium">
                  <li>Kafe & Coffee Shop</li>
                  <li>Rumah Makan & Kuliner</li>
                  <li>Toko Kelontong & Retail</li>
                  <li>Bakery & Grosir</li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <div className="font-bold text-white/50 uppercase text-[10px] tracking-wider">
                  Kecerdasan AI & Ekspor
                </div>
                <ul className="space-y-2 font-medium">
                  <li>Voice AI Multi-Klausul</li>
                  <li>OCR Scan Struk Grosir</li>
                  <li>Cetak PDF Standar KUR</li>
                  <li>Spreadsheet In-App (.xlsx)</li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <div className="font-bold text-white/50 uppercase text-[10px] tracking-wider">
                  Tim WongLarpers
                </div>
                <ul className="space-y-2 font-medium">
                  <li>Naufal Rama Octantyo</li>
                  <li>Indo Frederika Suherdin</li>
                  <li>Muhammad Arifathul Rahman</li>
                  <li className="text-white/60 text-[11px]">Telkom University</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-white/60">
              <span>
                &copy; {new Date().getFullYear()} KASRA (Kinetic AI System for Retail
                Analytics & Accounting). Hak cipta dilindungi.
              </span>
              <span>Botanical Sage & Midnight Blue Dual-Theme Edition</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};
