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
  User,
  Plus,
  HelpCircle,
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
      label: 'Home & Ringkasan',
      shortLabel: 'Home',
      icon: Home,
    },
    {
      id: 'analytics',
      label: 'Statistic & Laporan',
      shortLabel: 'Statistic',
      icon: BarChart2,
    },
    {
      id: 'cash',
      label: 'History & Buku Kas',
      shortLabel: 'History',
      icon: Wallet,
    },
    {
      id: 'storage',
      label: 'Gudang & Stok FEFO',
      shortLabel: 'Storage',
      icon: Package,
      badge:
        criticalStockCount + nearExpiryCount > 0
          ? criticalStockCount + nearExpiryCount
          : undefined,
    },
    {
      id: 'settings',
      label: 'Profil & Pengaturan',
      shortLabel: 'Profile',
      icon: User,
    },
  ];

  const mobileLeftItems = [navItems[0], navItems[1]];
  const mobileRightItems = [navItems[3], navItems[2]];

  return (
    <>
      {/* ======================================================================
          1. DESKTOP LEFT ICON RAIL
         ====================================================================== */}
      <aside
        className={`hidden md:flex flex-col w-[82px] border-r py-6 px-3 shrink-0 justify-between items-center select-none z-30 transition-colors ${
          isDark
            ? 'bg-[#22396F] border-[#345294] shadow-[1px_0_20px_rgba(7,16,38,0.4)]'
            : 'bg-white border-slate-200/80 shadow-[1px_0_12px_rgba(0,0,0,0.02)]'
        }`}
      >
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Brand Mark */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all shadow-md group ${
              isDark
                ? 'bg-[#0D1C42] border border-[#345294] text-[#FCF1D0]'
                : 'bg-gradient-to-br from-[#1E1B4B] to-[#4C1D95] border border-indigo-900 text-white'
            }`}
            title={`${profile.storeName || 'Toko'} — KASRA Workspace`}
          >
            <KasraLogo
              className={`w-6 h-6 group-hover:scale-110 transition-transform select-none ${
                isDark ? 'text-[#FCF1D0]' : 'text-white'
              }`}
            />
          </div>

          {/* Center-style Prominent Action Button on Desktop Rail */}
          <button
            type="button"
            onClick={onOpenQuickAdd}
            title="Tambah Transaksi Cepat (Kalkulator & Kategori)"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 group ${
              isDark
                ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-[0_6px_18px_rgba(252,241,208,0.25)] hover:opacity-95'
                : 'bg-[#18181B] text-white shadow-[0_8px_20px_rgba(24,24,27,0.3)] hover:bg-slate-800'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.6]" />
          </button>

          {/* Navigation Icon List */}
          <nav className="flex flex-col items-center gap-2 w-full pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`relative w-12 py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                        : 'bg-indigo-50/90 text-[#311068]'
                      : isDark
                      ? 'text-[#B8C4E0] hover:text-[#FCF1D0] hover:bg-[#172A57]'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.1]" />
                  <span className="text-[9px] font-bold tracking-tight">
                    {item.shortLabel}
                  </span>

                  {/* Active Dot Indicator */}
                  {isActive && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-[#FCF1D0]' : 'bg-[#311068]'
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

        {/* Bottom Rail Utilities */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button
            onClick={() => setActiveTab('settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Pengaturan & Sesi Toko"
          >
            <HelpCircle className="w-4 h-4" />
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
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 relative cursor-pointer"
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
                : 'bg-[#18181B] text-white shadow-[0_10px_24px_rgba(24,24,27,0.35)] ring-4 ring-white'
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
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 relative cursor-pointer"
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
