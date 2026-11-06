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

  const openDatePicker = () => {
    if (inputRef.current) {
      try {
        if (typeof inputRef.current.showPicker === 'function') {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
        }
      } catch {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Direct interactive date input */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white border border-slate-300 hover:border-slate-400 focus:border-slate-900 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none shadow-xs transition-colors cursor-pointer"
            style={{ colorScheme: 'light' }}
          />
        </div>

        {/* Clear Button if value is set */}
        {Boolean(value) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange('');
            }}
            className="px-2 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
            title="Kosongkan tanggal"
          >
            <X className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}

        {daysDiff !== null && presetMode === 'expiry' && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
              daysDiff <= 3
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : daysDiff <= 7
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {daysDiff < 0 ? 'Lewat Expired' : daysDiff === 0 ? 'Hari ini' : `${daysDiff} hr lagi`}
          </span>
        )}
      </div>

      {/* Quick 1-Click Preset Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
        <span className="text-slate-500 font-mono">Pilihan cepat:</span>
        {presetMode === 'purchase' ? (
          <>
            <button
              type="button"
              onClick={() => handleQuickAddDays(0)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(-1)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(-3)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              -3 Hari
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(-7)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              -1 Minggu
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleQuickAddDays(7)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              +7 Hari
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddDays(14)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              +14 Hari
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(1)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              +1 Bulan
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(3)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              +3 Bulan
            </button>
            <button
              type="button"
              onClick={() => handleQuickAddMonths(6)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors"
            >
              +6 Bulan
            </button>
          </>
        )}
      </div>
    </div>
  );
};
