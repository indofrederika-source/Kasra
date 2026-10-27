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
    <header className="sticky top-0 z-20 bg-[#171719]/90 backdrop-blur-xl border-b border-[#262629] px-5 lg:px-8 py-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Store Status Capsule Pills (Haulix Top Pills Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {/* Toko Aktif */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#202024] border border-[#2c2c32] text-stone-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#8aef8e] animate-pulse" />
            <span>Toko Buka</span>
          </div>

          {/* Laba Hari Ini */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#202024] border border-[#2c2c32] text-stone-300 shrink-0">
            <span className="text-[#8a8a92]">Laba Hari Ini:</span>
            <span className={`font-semibold font-mono ${todayProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {formatRupiah(todayProfit)}
            </span>
          </div>

          {/* Alert Stok Kritis */}
          {criticalStockCount > 0 && (
            <div
              onClick={() => setActiveTab('storage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#2d2217] text-amber-300 border border-[#48351f] hover:border-amber-400/50 cursor-pointer transition-colors shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{criticalStockCount} Stok Kritis</span>
            </div>
          )}

          {/* Alert Mendekati Expired */}
          {nearExpiryCount > 0 && (
            <div
              onClick={() => setActiveTab('storage')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#2d1b1f] text-rose-300 border border-[#48252b] hover:border-rose-400/50 cursor-pointer transition-colors shrink-0"
            >
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>{nearExpiryCount} Mendekati Expired</span>
            </div>
          )}
        </div>

        {/* Right: Search Pill & Action Controls */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
          {/* Quick Voice Mic Button */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#202024] hover:bg-[#28282e] text-white border border-[#2c2c32] text-xs font-medium transition-all shadow-sm group active:scale-95"
            title="Bicara transaksi / stok"
          >
            <Mic className="w-3.5 h-3.5 text-stone-300 group-hover:text-white transition-colors" />
            <span>Bicara</span>
          </button>

          {/* Scan Nota Button */}
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#202024] hover:bg-[#28282e] text-white border border-[#2c2c32] text-xs font-medium transition-all shadow-sm group active:scale-95"
            title="Scan foto struk belanja"
          >
            <ScanLine className="w-3.5 h-3.5 text-stone-300 group-hover:text-white transition-colors" />
            <span>Scan Nota</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            title="Reset data contoh"
            className="p-2 rounded-full bg-[#202024] hover:bg-[#28282e] border border-[#2c2c32] text-stone-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User Profile Capsule (Haulix LN Avatar Style) */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202024] border border-[#2c2c32] hover:border-white/20 text-xs text-white cursor-pointer transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-[#38332a] text-[#f2aa4b] font-bold text-[10px] flex items-center justify-center border border-[#524430]">
              {profile.storeName.charAt(0)}
            </div>
            <span className="font-medium max-w-[110px] truncate">{profile.storeName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
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
