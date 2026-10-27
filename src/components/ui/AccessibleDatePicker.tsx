'use client';

import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

interface AccessibleDatePickerProps {
  value?: string | null;
  onChange: (val: string) => void;
  label?: string;
  presetMode?: 'expiry' | 'purchase';
  className?: string;
}

export const AccessibleDatePicker: React.FC<AccessibleDatePickerProps> = ({
  value,
  onChange,
  label = 'Pilih Tanggal...',
  presetMode = 'expiry',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuickAddDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().split('T')[0];
    onChange(iso);
  };

  const handleQuickAddMonths = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    const iso = d.toISOString().split('T')[0];
    onChange(iso);
  };

  // Calculate days remaining or days ago if value exists
  const daysDiff = value
    ? Math.ceil((new Date(value).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Main Clickable Wrapper: clicking ANYWHERE directly opens the picker */}
        <div className="relative inline-flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              value
                ? 'bg-[#222228] border-white/20 text-white'
                : 'bg-[#171719] border-[#2c2c32] text-stone-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#f2aa4b]" />
            <span className="font-mono text-xs">{value ? formatDateIndo(value) : label}</span>
            {daysDiff !== null && presetMode === 'expiry' && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  daysDiff <= 3
                    ? 'bg-rose-500/20 text-rose-300'
                    : daysDiff <= 7
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {daysDiff < 0 ? 'Lewat Expired' : daysDiff === 0 ? 'Hari ini' : `${daysDiff} hr lagi`}
              </span>
            )}
          </div>

          {/* Native HTML5 date input overlaying the entire button for 100% clickability across all browsers */}
          <input
            ref={inputRef}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ colorScheme: 'dark' }}
            title="Klik untuk memilih tanggal kalender"
          />
        </div>

        {/* Clear Button if value is set */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 rounded text-stone-500 hover:text-rose-400 transition-colors z-20"
            title="Hapus tanggal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Quick 1-Click Preset Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
        <span className="text-[#71717a] font-mono">Pilihan cepat:</span>
        {presetMode === 'purchase' ? (
          <>
            <button
              type="button"
              onClick={() => handleQuickAddDays(0)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(-1)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(-3)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              -3 Hari
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(-7)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              -1 Minggu
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleQuickAddDays(7)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              +7 Hari
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(14)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              +14 Hari
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(1)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              +1 Bulan
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(3)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              +3 Bulan
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(6)}
              className="px-2 py-0.5 rounded bg-[#1f1f24] hover:bg-[#282830] text-stone-300 hover:text-white border border-[#2c2c32] transition-colors"
            >
              +6 Bulan
            </button>
          </>
        )}
      </div>
    </div>
  );
};
