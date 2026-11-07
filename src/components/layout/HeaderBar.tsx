'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatRupiah } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { KasraLogo } from '@/components/ui/KasraLogo';
import {
  Mic,
  ScanLine,
  Calculator,
  RotateCcw,
  AlertTriangle,
  Clock,
  ChevronDown,
  LogOut,
  Settings,
  Sun,
  Moon,
  Bell,
  Plus,
} from 'lucide-react';

interface HeaderBarProps {
  onOpenVoice: () => void;
  onOpenScan: () => void;
  onOpenQuickAdd?: () => void;
  isCalculatorOpen?: boolean;
  onToggleCalculator: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenVoice,
  onOpenScan,
  onOpenQuickAdd,
  isCalculatorOpen = false,
  onToggleCalculator,
}) => {
  const {
    profile,
    todayProfit,
    criticalStockCount,
    nearExpiryCount,
    resetToMockData,
    setActiveTab,
    theme,
    setTheme,
  } = useKasra();

  const { user, logout } = useAuth();
  const isDark = theme === 'dark';

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const storeDisplayName = user?.storeName || profile.storeName || 'Toko Saya';
  const userDisplayName = user?.name || profile.ownerName || 'Pemilik Toko';
  const userEmail = user?.email || '-';
  const totalAlerts = criticalStockCount + nearExpiryCount;

  return (
    <header
      className={`sticky top-0 z-20 backdrop-blur-xl border-b px-4 sm:px-6 lg:px-8 py-3 transition-colors ${
        isDark
          ? 'bg-[#0D1C42]/90 border-[#345294]'
          : 'bg-[#F3F4F8]/85 border-slate-200/80'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Notification Bell + Store Status Capsules */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {/* Mobile Brand Mark */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`md:hidden w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#22396F] border border-[#345294] text-[#FCF1D0]'
                : 'bg-gradient-to-br from-[#1E1B4B] to-[#4C1D95] text-white'
            }`}
            title="KASRA Workspace"
          >
            <KasraLogo className={`w-5 h-5 ${isDark ? 'text-[#FCF1D0]' : 'text-white'}`} />
          </button>

          {/* Circular Notification Bell Button */}
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            title="Peringatan Stok & Kadaluarsa"
            className={`relative w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0] hover:bg-[#2B4684]'
                : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span
                className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-extrabold flex items-center justify-center ${
                  isDark ? 'bg-[#FCF1D0] text-[#0D1C42]' : 'bg-rose-500 text-white'
                }`}
              >
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Toko Aktif Pill */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isDark ? 'bg-[#6EE7B7]' : 'bg-emerald-500'
              }`}
            />
            <span>Toko Buka</span>
          </div>

          {/* Laba Hari Ini */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border shrink-0 ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-white border-slate-200/80 text-slate-700 shadow-2xs'
            }`}
          >
            <span className="opacity-75">Laba Hari Ini:</span>
            <span
              className={`font-bold font-mono ${
                todayProfit >= 0
                  ? isDark
                    ? 'text-[#6EE7B7]'
                    : 'text-emerald-600'
                  : 'text-rose-500'
              }`}
            >
              {formatRupiah(todayProfit)}
            </span>
          </div>

          {/* Alert Stok Kritis */}
          {criticalStockCount > 0 && (
            <div
              onClick={() => setActiveTab('storage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>{criticalStockCount} Stok Kritis</span>
            </div>
          )}

          {/* Alert Mendekati Expired */}
          {nearExpiryCount > 0 && (
            <div
              onClick={() => setActiveTab('storage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{nearExpiryCount} Expired</span>
            </div>
          )}
        </div>

        {/* Right: Dual UI Theme Switcher (Dark Option 1 / Light Option 2) + Quick Actions */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0 flex-wrap">
          {/* ================================================================
              DUAL UI THEME TOGGLE (Option 1: Dark #0D1C42/#22396F/#FCF1D0 | Option 2: Light)
             ================================================================ */}
          <div
            className={`inline-flex items-center p-1 rounded-full border text-xs font-bold transition-colors ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
            title="Switch between Dark UI (Option 1) and Light UI (Option 2)"
          >
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                !isDark
                  ? 'bg-[#311068] text-white shadow-xs font-extrabold'
                  : 'text-[#FCF1D0]/75 hover:text-[#FCF1D0]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>

          {/* Quick Add Transaction Button */}
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
                  : 'bg-[#18181B] hover:bg-slate-800 text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          )}

          {/* Quick Calculator Button */}
          <button
            type="button"
            onClick={onToggleCalculator}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-2xs group active:scale-95 cursor-pointer ${
              isCalculatorOpen
                ? isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42] border-[#FCF1D0]'
                  : 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Buka Kalkulator"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Kalkulator</span>
          </button>

          {/* Quick Voice Mic Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs group active:scale-95 cursor-pointer"
            title="Bicara transaksi / stok"
          >
            <Mic className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span className="hidden sm:inline">Bicara</span>
          </button>

          {/* Scan Nota Button */}
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs group active:scale-95 cursor-pointer"
            title="Scan foto struk belanja"
          >
            <ScanLine className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          {/* Reset Store Data to Zero Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            title="Kosongkan seluruh data toko ke 0"
            className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Capsule with Avatar */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-800 cursor-pointer transition-colors shadow-2xs active:scale-95"
            >
              <div
                className={`w-6 h-6 rounded-full font-extrabold text-[11px] flex items-center justify-center ${
                  isDark
                    ? 'bg-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                    : 'bg-gradient-to-br from-[#311068] to-[#7C3AED] text-white'
                }`}
              >
                {storeDisplayName.charAt(0).toUpperCase()}
              </div>
              <span className="font-bold max-w-[110px] truncate">{storeDisplayName}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isProfileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-slate-200/90 shadow-2xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center ${
                        isDark
                          ? 'bg-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                          : 'bg-gradient-to-br from-[#311068] to-[#4C1D95] text-white'
                      }`}
                    >
                      {userDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{userDisplayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pengaturan Toko & Profil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsLogoutConfirmOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          logout();
        }}
        title="Keluar dari Akun"
        message={`Apakah Anda yakin ingin keluar dari akun "${storeDisplayName}"? Anda dapat masuk kembali kapan saja dengan email dan kata sandi Anda.`}
        confirmText="Ya, Keluar Akun"
        isDanger={true}
      />

      {/* Reset Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetToMockData();
          setIsResetConfirmOpen(false);
        }}
        title="Kosongkan Data Toko"
        message="Apakah Anda yakin ingin mengosongkan seluruh transaksi kas, barang gudang, buku mutasi, dan kategori toko kembali ke 0? Akun login Anda tetap tersimpan."
        confirmText="Ya, Kosongkan ke 0"
        isDanger={true}
      />
    </header>
  );
};
