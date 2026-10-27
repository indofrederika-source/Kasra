import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StockBatch } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatDateIndo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format batch name by arrival date (e.g. "Batch 24 Oktober 2026")
 */
export function formatBatchName(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return `Batch ${dateStr}`;
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return `Batch ${formatted}`;
  } catch {
    return `Batch ${dateStr}`;
  }
}

/**
 * Determine the earliest active expiry date strictly from batches with stock remaining (quantity > 0).
 * If the first batch is depleted (quantity = 0), automatically advance to the next batch with stock.
 * If all batches are depleted or have no expiry, return null (empty).
 */
export function getActiveProductExpiry(batches?: StockBatch[], fallbackExpiry?: string | null): string | null {
  if (batches && batches.length > 0) {
    const activeWithStock = batches.filter((b) => Number(b.quantity) > 0 && Boolean(b.expiryDate));
    if (activeWithStock.length > 0) {
      activeWithStock.sort((a, b) => (a.expiryDate! > b.expiryDate! ? 1 : -1));
      return activeWithStock[0].expiryDate || null;
    }
    // If all batches are depleted or lack expiry, return null (empty)
    return null;
  }
  return fallbackExpiry || null;
}

export interface ExpiryStatus {
  status: 'safe' | 'warning' | 'expired' | 'none';
  label: string;
  daysLeft: number | null;
  colorClass: string;
}

export function getExpiryStatus(expiryDate?: string | null, referenceDateStr?: string): ExpiryStatus {
  if (!expiryDate) {
    return {
      status: 'none',
      label: 'Tanpa Kadaluarsa',
      daysLeft: null,
      colorClass: 'text-slate-400 bg-slate-800/40 border-slate-700/50',
    };
  }

  const today = referenceDateStr ? new Date(referenceDateStr) : new Date('2026-10-26');
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: `Kedaluwarsa (${Math.abs(diffDays)} hari lalu)`,
      daysLeft: diffDays,
      colorClass: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
    };
  } else if (diffDays === 0) {
    return {
      status: 'expired',
      label: 'Kedaluwarsa Hari Ini!',
      daysLeft: 0,
      colorClass: 'text-rose-400 bg-rose-950/40 border-rose-800/60 font-semibold',
    };
  } else if (diffDays <= 7) {
    return {
      status: 'warning',
      label: `Segera Habis (${diffDays} hari lagi)`,
      daysLeft: diffDays,
      colorClass: 'text-amber-300 bg-amber-950/40 border-amber-700/60 font-medium',
    };
  } else {
    return {
      status: 'safe',
      label: `Aman (${diffDays} hari lagi)`,
      daysLeft: diffDays,
      colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
    };
  }
}

export interface StockStatus {
  status: 'safe' | 'warning' | 'danger';
  label: string;
  badgeClass: string;
}

export function getStockStatus(currentStock: number, minStockAlert: number): StockStatus {
  if (currentStock <= 0) {
    return {
      status: 'danger',
      label: 'Habis',
      badgeClass: 'text-rose-400 bg-rose-950/50 border-rose-800/60',
    };
  } else if (currentStock <= minStockAlert) {
    return {
      status: 'warning',
      label: 'Menipis',
      badgeClass: 'text-amber-300 bg-amber-950/50 border-amber-700/60',
    };
  } else {
    return {
      status: 'safe',
      label: 'Aman',
      badgeClass: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60',
    };
  }
}
