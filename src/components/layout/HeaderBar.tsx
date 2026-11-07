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
} from 'lucide-react';

interface HeaderBarProps {
  onOpenVoice: () => void;
  onOpenScan: () => void;
  isCalculatorOpen?: boolean;
  onToggleCalculator: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onOpenVoice,
  onOpenScan,
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
  } = useKasra();

  const { user, logout } = useAuth();

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

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-5 lg:px-8 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Store Status Capsule Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {/* Mobile Brand Mark (Top-Left on Mobile) */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="md:hidden w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
            title="KASRA Workspace"
          >
            <KasraLogo className="w-5 h-5 text-white" />
          </button>

          {/* Toko Aktif */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Toko Buka</span>
          </div>

          {/* Laba Hari Ini */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100/90 border border-slate-200/80 text-slate-800 shrink-0 shadow-xs">
            <span className="text-slate-500">Laba Hari Ini:</span>
            <span className={`font-semibold font-mono ${todayProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatRupiah(todayProfit)}
            </span>
          </div>

          {/* Alert Stok Kritis */}
          {criticalStockCount > 0 && (
            <div
              onClick={() => setActiveTab('storage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>{criticalStockCount} Stok Kritis</span>
            </div>
          )}

          {/* Alert Mendekati Expired */}
          {nearExpiryCount > 0 && (
            <div
              onClick={() => setActiveTab('storage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{nearExpiryCount} Mendekati Expired</span>
            </div>
          )}
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
          {/* Quick Calculator Button */}
          <button
            type="button"
            onClick={onToggleCalculator}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-sm group active:scale-95 cursor-pointer ${
              isCalculatorOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Buka Kalkulator"
          >
            <Calculator
              className={`w-3.5 h-3.5 transition-colors ${
                isCalculatorOpen ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'
              }`}
            />
            <span>Kalkulator</span>
          </button>

          {/* Quick Voice Mic Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm group active:scale-95 cursor-pointer"
            title="Bicara transaksi / stok"
          >
            <Mic className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span>Bicara</span>
          </button>

          {/* Scan Nota Button */}
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm group active:scale-95 cursor-pointer"
            title="Scan foto struk belanja"
          >
            <ScanLine className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span>Scan Nota</span>
          </button>

          {/* Reset Store Data to Zero Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            title="Kosongkan seluruh data toko ke 0"
            className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Capsule with Interactive Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-800 cursor-pointer transition-colors shadow-sm active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center border border-amber-200">
                {storeDisplayName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold max-w-[120px] truncate">{storeDisplayName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-200">
                      {userDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{userDisplayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium w-fit border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Akun Aktif</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1 space-y-0.5">
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
