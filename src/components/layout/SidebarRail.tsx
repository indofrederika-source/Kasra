'use client';

import React from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { TabType } from '@/types';
import {
  LayoutDashboard,
  Wallet,
  Package,
  Activity,
  Megaphone,
  Settings,
  HelpCircle,
  Plus,
} from 'lucide-react';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const SidebarRail: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    criticalStockCount,
    nearExpiryCount,
    profile,
  } = useKasra();

  const navItems: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'cash',
      label: 'Buku Kas',
      icon: Wallet,
    },
    {
      id: 'storage',
      label: 'Storage & Gudang',
      icon: Package,
      badge: criticalStockCount + nearExpiryCount > 0 ? criticalStockCount + nearExpiryCount : undefined,
    },
    {
      id: 'analytics',
      label: 'Analisis & Laporan',
      icon: Activity,
    },
    {
      id: 'promo',
      label: 'Promosi Studio',
      icon: Megaphone,
    },
    {
      id: 'settings',
      label: 'Pengaturan & Toko',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Desktop Left Icon Rail (Haulix Style - Slim Dark Graphite) */}
      <aside className="hidden md:flex flex-col w-[76px] bg-[#171719] border-r border-[#262629] py-6 px-3 shrink-0 justify-between items-center select-none z-30">
        <div className="flex flex-col items-center gap-7 w-full">
          {/* Brand Mark (Haulix Pale-Lime Plus Glyph) */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="w-11 h-11 rounded-2xl bg-[#202024] border border-[#2c2c32] hover:border-white/20 flex items-center justify-center cursor-pointer transition-all shadow-sm group"
            title={`${profile.storeName} — KASRA Workspace`}
          >
            <div className="w-5 h-5 rounded flex items-center justify-center text-[#f4feae] group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
          </div>

          {/* Navigation Icon List */}
          <nav className="flex flex-col items-center gap-2.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 group ${
                    isActive
                      ? 'bg-white text-black shadow-lg shadow-black/50 scale-100'
                      : 'text-[#71717a] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2]" />

                  {/* Notification Dot */}
                  {item.badge && !isActive && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f2aa4b] ring-2 ring-[#171719]" />
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute left-[84px] px-3 py-1.5 rounded-lg bg-[#222226] text-white text-xs font-medium border border-[#303036] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#71717a] hover:text-white hover:bg-white/[0.05] transition-colors"
            title="Pengaturan & Sesi Toko"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Dock Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#171719]/95 backdrop-blur-xl border-t border-[#262629] flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-2 rounded-full flex flex-col items-center justify-center transition-all relative ${
                isActive
                  ? 'bg-white text-black shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              {item.badge && !isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
