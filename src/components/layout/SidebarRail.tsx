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
      {/* Desktop Left Icon Rail (ACRU Style - Clean Light Minimalist) */}
      <aside className="hidden md:flex flex-col w-[76px] bg-white border-r border-slate-200/80 py-6 px-3 shrink-0 justify-between items-center select-none z-30 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col items-center gap-7 w-full">
          {/* Brand Mark (ACRU Style - Clean Slate Square with Lime Monogram) */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-all shadow-sm group"
            title={`${profile.storeName} — KASRA Workspace`}
          >
            <span className="text-lime-400 font-black text-lg tracking-tight font-sans group-hover:scale-110 transition-transform select-none">
              K
            </span>
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
                      ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-100'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2]" />

                  {/* Notification Dot */}
                  {item.badge && !isActive && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute left-[84px] px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium border border-slate-800 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
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
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Pengaturan & Sesi Toko"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Dock Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-lg flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-2 rounded-full flex flex-col items-center justify-center transition-all relative ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              {item.badge && !isActive && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
