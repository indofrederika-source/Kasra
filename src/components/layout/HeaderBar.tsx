'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatRupiah } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { KasraLogo } from '@/components/ui/KasraLogo';
import { NotificationCenterPopover } from '@/components/shared/NotificationCenterPopover';
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
  Plus,
  Store,
  Users,
  BarChart2,
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

  const storeDisplayName = profile.storeName || user?.storeName || 'Toko Saya';
  const userDisplayName = profile.ownerName || user?.name || 'Pemilik Toko';
  const userEmail = user?.email || '-';

  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-xl border-b px-3 sm:px-5 lg:px-8 py-2.5 transition-colors ${
        isDark
          ? 'bg-[#0D1C42]/90 border-[#345294]'
          : 'bg-[#F3F4F8]/85 border-slate-200/80'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Notification Bell + Responsive Store Status Capsules */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Mobile Brand Mark */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`md:hidden w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#22396F] border border-[#345294] text-[#FCF1D0]'
                : 'bg-gradient-to-br from-[#234720] to-[#152E14] text-[#F8FAF6]'
            }`}
            title="Ruang Kerja KASRA"
          >
            <KasraLogo className={`w-5 h-5 ${isDark ? 'text-[#FCF1D0]' : 'text-white'}`} />
          </button>

          {/* Connected Notification Center Bell */}
          <NotificationCenterPopover />

          {/* Toko Buka Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 whitespace-nowrap border ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
                isDark ? 'bg-[#6EE7B7]' : 'bg-emerald-500'
              }`}
            />
            <span className="hidden sm:inline">Toko Buka</span>
            <span className="sm:hidden">Buka</span>
          </div>

          {/* Laba Hari Ini */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border shrink-0 whitespace-nowrap ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-white border-slate-200/80 text-slate-700 shadow-2xs'
            }`}
          >
            <span className="opacity-75 hidden xl:inline">Laba Hari Ini:</span>
            <span className="opacity-75 xl:hidden">Laba:</span>
            <span
              className={`font-bold font-mono ${
                todayProfit >= 0
                  ? isDark
                    ? 'text-[#6EE7B7]'
                    : 'text-emerald-600'
                  : isDark
                  ? 'text-[#FDA4AF]'
                  : 'text-rose-500'
              }`}
            >
              {formatRupiah(todayProfit)}
            </span>
          </div>

          {/* Alert Stok Kritis */}
          {criticalStockCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold border cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isDark
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/45'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{criticalStockCount} Stok Kritis</span>
            </button>
          )}

          {/* Alert Mendekati Kedaluwarsa */}
          {nearExpiryCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold border cursor-pointer transition-colors shrink-0 whitespace-nowrap ${
                isDark
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/45'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{nearExpiryCount} Kedaluwarsa</span>
            </button>
          )}
        </div>

        {/* Right: Compact Icon-Only Theme Switcher + Responsive Quick Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ml-auto">
          {/* COMPACT ICON-ONLY THEME TOGGLE */}
          <div
            className={`inline-flex items-center p-0.5 rounded-full border transition-colors shrink-0 ${
              isDark
                ? 'bg-[#22396F] border-[#345294]'
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
            title="Ganti Tema Gelap / Terang"
          >
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Tema Gelap"
              title="Tema Gelap"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Tema Terang"
              title="Tema Terang"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                !isDark
                  ? 'bg-[#1E3D1C] text-[#F8FAF6] shadow-xs'
                  : 'text-[#FCF1D0]/75 hover:text-[#FCF1D0]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Add Transaction Button */}
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              title="Catat Transaksi Cepat"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                isDark
                  ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
                  : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6]'
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="hidden md:inline">Catat Transaksi</span>
              <span className="hidden sm:inline md:hidden">Catat</span>
            </button>
          )}

          {/* Quick Calculator Button */}
          <button
            type="button"
            onClick={onToggleCalculator}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-[11px] sm:text-xs font-semibold transition-all shadow-2xs group active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
              isCalculatorOpen
                ? isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42] border-[#FCF1D0]'
                  : 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Buka Kalkulator"
          >
            <Calculator className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden 2xl:inline">Kalkulator</span>
          </button>

          {/* Quick Voice Mic Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] sm:text-xs font-semibold transition-all shadow-2xs group active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Bicara transaksi atau stok"
          >
            <Mic className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors shrink-0" />
            <span className="hidden lg:inline">Bicara</span>
          </button>

          {/* Pindai Nota Button */}
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] sm:text-xs font-semibold transition-all shadow-2xs group active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Pindai foto nota belanja"
          >
            <ScanLine className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors shrink-0" />
            <span className="hidden lg:inline">Pindai</span>
          </button>

          {/* Reset Store Data to Zero Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            title="Kosongkan seluruh data toko ke 0"
            className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Capsule with Avatar */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-800 cursor-pointer transition-colors shadow-2xs active:scale-95"
            >
              <div
                className={`w-6 h-6 rounded-full font-extrabold text-[11px] flex items-center justify-center shrink-0 overflow-hidden ${
                  isDark
                    ? 'bg-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                    : 'bg-gradient-to-br from-[#234720] to-[#152E14] text-[#F8FAF6]'
                }`}
              >
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={storeDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  storeDisplayName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="font-bold max-w-[110px] truncate">{storeDisplayName}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isProfileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu (Separated Public Profile vs Account Settings) */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl border border-slate-200/90 shadow-2xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 ${
                        isDark
                          ? 'bg-[#0D1C42] text-[#FCF1D0] border border-[#345294]'
                          : 'bg-gradient-to-br from-[#234720] to-[#152E14] text-[#F8FAF6]'
                      }`}
                    >
                      {profile.logoUrl ? (
                        <img
                          src={profile.logoUrl}
                          alt={storeDisplayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userDisplayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {storeDisplayName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('profile');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Profil Publik & Etalase Toko</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('community');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Komunitas Usaha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('analytics');
                      setIsProfileMenuOpen(false);
                    }}
                    className="md:hidden w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Statistik & Laporan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pengaturan Akun & Lokasi</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

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
