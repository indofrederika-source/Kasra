'use client';

import React, { useState } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { formatRupiah } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  Mic,
  ScanLine,
  Search,
  RotateCcw,
  AlertTriangle,
  Clock,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface HeaderBarProps {
  onOpenVoice: () => void;
  onOpenScan: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenVoice, onOpenScan }) => {
  const {
    profile,
    todayProfit,
    criticalStockCount,
    nearExpiryCount,
    resetToMockData,
    setActiveTab,
  } = useKasra();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-5 lg:px-8 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Store Status Capsule Pills (ACRU Top Pills Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
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

        {/* Right: Search Pill & Action Controls */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
          {/* Quick Voice Mic Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm group active:scale-95"
            title="Bicara transaksi / stok"
          >
            <Mic className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span>Bicara</span>
          </button>

          {/* Scan Nota Button */}
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-sm group active:scale-95"
            title="Scan foto struk belanja"
          >
            <ScanLine className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-colors" />
            <span>Scan Nota</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            title="Reset data contoh"
            className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Capsule (ACRU Profile Style) */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-800 cursor-pointer transition-colors shadow-sm"
          >
            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center border border-amber-200">
              {profile.storeName.charAt(0)}
            </div>
            <span className="font-semibold max-w-[110px] truncate">{profile.storeName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetToMockData();
          setIsResetConfirmOpen(false);
        }}
        title="Reset Data Toko KASRA"
        message="Apakah Anda yakin ingin mengembalikan seluruh data transaksi dan inventaris ke data demo awal KASRA? Semua perubahan data yang telah Anda buat akan diatur ulang."
        confirmText="Ya, Reset Data Toko"
        isDanger={true}
      />
    </header>
  );
};
