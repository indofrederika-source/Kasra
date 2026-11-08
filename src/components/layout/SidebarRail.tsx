'use client';

import React from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { TabType } from '@/types';
import { KasraLogo } from '@/components/ui/KasraLogo';
import {
  Home,
  BarChart2,
  Wallet,
  Package,
  Users,
  Store,
  Settings,
  Plus,
} from 'lucide-react';

interface TabItem {
  id: TabType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: number;
}

interface SidebarRailProps {
  onOpenQuickAdd?: () => void;
  onOpenScan?: () => void;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  onOpenQuickAdd,
}) => {
  const {
    activeTab,
    setActiveTab,
    criticalStockCount,
    nearExpiryCount,
    profile,
    theme,
  } = useKasra();

  const isDark = theme === 'dark';

  const navItems: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Beranda & Ringkasan',
      shortLabel: 'Beranda',
      icon: Home,
    },
    {
      id: 'analytics',
      label: 'Statistik & Laporan',
      shortLabel: 'Statistik',
      icon: BarChart2,
    },
    {
      id: 'cash',
      label: 'Kas & Buku Transaksi',
      shortLabel: 'Kas',
      icon: Wallet,
    },
    {
      id: 'storage',
      label: 'Gudang & Stok FEFO',
      shortLabel: 'Gudang',
      icon: Package,
      badge:
        criticalStockCount + nearExpiryCount > 0
          ? criticalStockCount + nearExpiryCount
          : undefined,
    },
    {
      id: 'community',
      label: 'Komunitas Usaha & UMKM',
      shortLabel: 'Komunitas',
      icon: Users,
    },
    {
      id: 'profile',
      label: 'Profil Publik & Etalase Toko',
      shortLabel: 'Profil',
      icon: Store,
    },
  ];

  // Mobile Dock: Beranda, Kas | [+] | Gudang, Komunitas
  const mobileLeftItems = [navItems[0], navItems[2]];
  const mobileRightItems = [navItems[3], navItems[4]];

  return (
    <>
      {/* ======================================================================
          1. DESKTOP LEFT ICON RAIL
         ====================================================================== */}
      <aside
        className={`hidden md:flex flex-col w-[84px] border-r py-5 px-3 shrink-0 justify-between items-center select-none z-30 transition-colors ${
          isDark
            ? 'bg-[#22396F] border-[#345294] shadow-[1px_0_20px_rgba(7,16,38,0.4)]'
            : 'bg-white border-slate-200/80 shadow-[1px_0_12px_rgba(0,0,0,0.02)]'
        }`}
      >
        <div className="flex flex-col items-center gap-5 w-full">
          {/* Brand Mark */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all shadow-md group ${
              isDark
                ? 'bg-[#0D1C42] border border-[#345294] text-[#FCF1D0]'
                : 'bg-gradient-to-br from-[#234720] to-[#152E14] border border-[#2F572D] text-[#F8FAF6]'
            }`}
            title={`${profile.storeName || 'Toko'} — Ruang Kerja KASRA`}
          >
            <KasraLogo
              className={`w-6 h-6 group-hover:scale-110 transition-transform select-none ${
                isDark ? 'text-[#FCF1D0]' : 'text-white'
              }`}
            />
          </div>

          {/* Navigation Icon List */}
          <nav className="flex flex-col items-center gap-1.5 w-full pt-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`relative w-14 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                        : 'bg-[#E4EFE0] text-[#1E3D1C]'
                      : isDark
                      ? 'text-[#B8C4E0] hover:text-[#FCF1D0] hover:bg-[#172A57]'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.1]" />
                  <span className="text-[9px] font-bold tracking-tight whitespace-nowrap">
                    {item.shortLabel}
                  </span>

                  {/* Active Dot Indicator */}
                  {isActive && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-[#FCF1D0]' : 'bg-[#1E3D1C]'
                      }`}
                    />
                  )}

                  {/* Notification Dot */}
                  {item.badge && !isActive && (
                    <span className="absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}

                  {/* Tooltip on hover */}
                  <div
                    className={`absolute left-[88px] px-3 py-1.5 rounded-xl text-xs font-medium border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 ${
                      isDark
                        ? 'bg-[#0D1C42] text-[#FCF1D0] border-[#345294]'
                        : 'bg-slate-900 text-white border-slate-800'
                    }`}
                  >
                    {item.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Dedicated Account & Store Settings Button */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            onClick={() => setActiveTab('settings')}
            title="Pengaturan Akun & Toko"
            className={`relative w-14 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group cursor-pointer ${
              activeTab === 'settings'
                ? isDark
                  ? 'bg-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                  : 'bg-[#E4EFE0] text-[#1E3D1C]'
                : isDark
                ? 'text-[#B8C4E0] hover:text-[#FCF1D0] hover:bg-[#172A57]'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80'
            }`}
          >
            <Settings className="w-5 h-5 stroke-[2.1]" />
            <span className="text-[9px] font-bold tracking-tight whitespace-nowrap">
              Setelan
            </span>
            {activeTab === 'settings' && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-[#FCF1D0]' : 'bg-[#1E3D1C]'
                }`}
              />
            )}

            <div
              className={`absolute left-[88px] px-3 py-1.5 rounded-xl text-xs font-medium border opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 ${
                isDark
                  ? 'bg-[#0D1C42] text-[#FCF1D0] border-[#345294]'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              Pengaturan Akun & Lokasi Toko
            </div>
          </button>
        </div>
      </aside>

      {/* ======================================================================
          2. MOBILE FLOATING DOCK BAR WITH ELEVATED CENTER BUTTON
         ====================================================================== */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-4 py-2 flex items-center justify-between transition-colors ${
          isDark
            ? 'bg-[#22396F]/95 backdrop-blur-xl border-[#345294] shadow-[0_-10px_30px_rgba(7,16,38,0.5)]'
            : 'bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-[0_-8px_25px_rgba(0,0,0,0.06)]'
        }`}
      >
        {/* Left 2 Icons */}
        <div className="flex items-center justify-around flex-1">
          {mobileLeftItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 relative cursor-pointer"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? isDark
                        ? 'text-[#FCF1D0] stroke-[2.4]'
                        : 'text-slate-950 stroke-[2.4]'
                      : isDark
                      ? 'text-[#B8C4E0] stroke-[1.8]'
                      : 'text-slate-400 stroke-[1.8]'
                  }`}
                />
                <span
                  className={`text-[10px] font-semibold ${
                    isActive
                      ? isDark
                        ? 'text-[#FCF1D0] font-bold'
                        : 'text-slate-950 font-bold'
                      : isDark
                      ? 'text-[#B8C4E0]'
                      : 'text-slate-400'
                  }`}
                >
                  {item.shortLabel}
                </span>
                {isActive && isDark && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FCF1D0] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center Floating Action Button */}
        <div className="relative -top-4 px-2">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-[0_8px_25px_rgba(7,16,38,0.5)] ring-4 ring-[#22396F]'
                : 'bg-[#1E3D1C] text-[#F8FAF6] shadow-[0_10px_24px_rgba(30,61,28,0.35)] ring-4 ring-[#F8FAF6]'
            }`}
            title="Catat Transaksi Cepat"
          >
            <Plus className="w-6 h-6 stroke-[2.6]" />
          </button>
        </div>

        {/* Right 2 Icons */}
        <div className="flex items-center justify-around flex-1">
          {mobileRightItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 relative cursor-pointer"
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? isDark
                        ? 'text-[#FCF1D0] stroke-[2.4]'
                        : 'text-slate-950 stroke-[2.4]'
                      : isDark
                      ? 'text-[#B8C4E0] stroke-[1.8]'
                      : 'text-slate-400 stroke-[1.8]'
                  }`}
                />
                <span
                  className={`text-[10px] font-semibold ${
                    isActive
                      ? isDark
                        ? 'text-[#FCF1D0] font-bold'
                        : 'text-slate-950 font-bold'
                      : isDark
                      ? 'text-[#B8C4E0]'
                      : 'text-slate-400'
                  }`}
                >
                  {item.shortLabel}
                </span>
                {item.badge && (
                  <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500" />
                )}
                {isActive && isDark && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FCF1D0] mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
