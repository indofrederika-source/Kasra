'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal as reactDomCreatePortal } from 'react-dom';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

interface AccessibleDatePickerProps {
  value?: string | null;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  allowClear?: boolean;
  compact?: boolean;
  presetMode?: 'expiry' | 'purchase' | 'transaction';
  showPresets?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_HEADERS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function toLocalIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export const AccessibleDatePicker: React.FC<AccessibleDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder,
  allowClear = true,
  compact = false,
  presetMode = 'expiry',
  showPresets,
  fullWidth = false,
  className = '',
}) => {
  const displayPlaceholder = placeholder || label || 'Pilih Tanggal';
  const effectiveShowPresets = showPresets !== undefined ? showPresets : !compact;
  const effectiveFullWidth = fullWidth || compact;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const parsedValue = parseIsoDate(value);
  const todayDate = new Date();
  const todayIso = toLocalIsoDate(todayDate);

  const [viewYear, setViewYear] = useState<number>(
    parsedValue ? parsedValue.getFullYear() : todayDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    parsedValue ? parsedValue.getMonth() : todayDate.getMonth()
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync calendar month/year view when external value changes
  useEffect(() => {
    const p = parseIsoDate(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = 288;
    const popoverHeight = 330;

    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popoverWidth - 12);
    }

    let top = rect.bottom + 6;
    if (top + popoverHeight > window.innerHeight - 12 && rect.top > popoverHeight + 12) {
      top = rect.top - popoverHeight - 6;
    }

    setPopoverPos({ top, left });
  }, []);

  const handleToggleOpen = () => {
    if (!isOpen) {
      const p = parseIsoDate(value) || new Date();
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, updatePosition]);

  const handleQuickAddDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    onChange(toLocalIsoDate(d));
    setIsOpen(false);
  };

  const handleQuickAddMonths = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    onChange(toLocalIsoDate(d));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells: Array<{ dateIso: string; dayNumber: number; isCurrentMonth: boolean }> = [];

  // Leading days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
    calendarCells.push({
      dateIso: toLocalIsoDate(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear, viewMonth, day);
    calendarCells.push({
      dateIso: toLocalIsoDate(d),
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  // Trailing days to complete 6 rows (42 cells) or 5 rows (35 cells)
  const totalSlots = calendarCells.length <= 35 ? 35 : 42;
  let nextMonthDay = 1;
  while (calendarCells.length < totalSlots) {
    const d = new Date(viewYear, viewMonth + 1, nextMonthDay++);
    calendarCells.push({
      dateIso: toLocalIsoDate(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  // Calculate days remaining if value exists
  const daysDiff = (() => {
    if (!parsedValue) return null;
    const t0 = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
    const t1 = new Date(parsedValue.getFullYear(), parsedValue.getMonth(), parsedValue.getDate()).getTime();
    return Math.round((t1 - t0) / (1000 * 60 * 60 * 24));
  })();

  const baseYear = todayDate.getFullYear();
  const yearOptions: number[] = [];
  for (let y = baseYear - 10; y <= baseYear + 15; y++) {
    yearOptions.push(y);
  }

  const popoverElement = isOpen ? (
    <div
      ref={popoverRef}
      style={{ top: popoverPos.top, left: popoverPos.left }}
      className="fixed z-[10000] w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* Header: Prev / Month & Year Selectors / Next */}
      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Bulan sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          <select
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            {MONTH_NAMES_ID.map((mName, idx) => (
              <option key={mName} value={idx}>
                {mName}
              </option>
            ))}
          </select>

          <select
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold font-mono text-slate-900 focus:outline-none cursor-pointer"
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Bulan berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAY_HEADERS_ID.map((dh, idx) => (
          <div
            key={dh}
            className={`text-[10px] font-bold py-1 ${
              idx === 0 ? 'text-rose-500' : 'text-slate-400'
            }`}
          >
            {dh}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarCells.map((cell) => {
          const isSelected = value === cell.dateIso;
          const isToday = todayIso === cell.dateIso;

          return (
            <button
              key={cell.dateIso}
              type="button"
              onClick={() => {
                onChange(cell.dateIso);
                setIsOpen(false);
              }}
              className={`h-8 w-full rounded-lg text-xs font-mono transition-all flex items-center justify-center cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : isToday
                  ? 'bg-lime-100 text-lime-950 font-bold border border-lime-300 hover:bg-lime-200'
                  : cell.isCurrentMonth
                  ? 'text-slate-800 hover:bg-slate-100 font-medium'
                  : 'text-slate-300 hover:bg-slate-50 hover:text-slate-500'
              }`}
            >
              {cell.dayNumber}
            </button>
          );
        })}
      </div>

      {/* Footer Quick Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        {allowClear ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer"
          >
            Kosongkan
          </button>
        ) : (
          <span className="text-[10px] text-slate-400 px-1">Pilih tanggal</span>
        )}

        <button
          type="button"
          onClick={() => {
            onChange(todayIso);
            setIsOpen(false);
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition-colors cursor-pointer"
        >
          Hari Ini
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className={`${compact ? '' : 'space-y-1.5'} ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Full-Surface Clickable Date Button — Clicking ANYWHERE opens the calendar! */}
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggleOpen}
          className={`${
            effectiveFullWidth ? 'w-full justify-between' : ''
          } flex items-center gap-2.5 bg-white hover:bg-slate-50 border ${
            isOpen ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-300 hover:border-slate-400'
          } rounded-xl ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'} text-xs text-slate-900 shadow-xs transition-all cursor-pointer select-none active:scale-[0.99]`}
        >
          <span className={`font-mono ${value ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
            {value ? formatDateIndo(value) : displayPlaceholder}
          </span>
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </button>

        {/* Clear Button if value is set */}
        {Boolean(value) && allowClear && !effectiveFullWidth && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange('');
            }}
            className="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
            title="Kosongkan tanggal"
          >
            <X className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}

        {daysDiff !== null && presetMode === 'expiry' && !compact && (
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
      {effectiveShowPresets && (
        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
          <span className="text-slate-500 font-mono">Pilihan cepat:</span>
          {presetMode === 'purchase' || presetMode === 'transaction' ? (
            <>
              <button
                type="button"
                onClick={() => handleQuickAddDays(0)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(-1)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(-3)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                -3 Hari
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(-7)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                -1 Minggu
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleQuickAddDays(7)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                +7 Hari
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(14)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                +14 Hari
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddMonths(1)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                +1 Bulan
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddMonths(3)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                +3 Bulan
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddMonths(6)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition-colors cursor-pointer"
              >
                +6 Bulan
              </button>
            </>
          )}
        </div>
      )}

      {mounted && typeof document !== 'undefined' && popoverElement
        ? reactDomCreatePortal(popoverElement, document.body)
        : null}
    </div>
  );
};
