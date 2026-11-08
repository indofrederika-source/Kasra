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

/**
 * Format string or number with dot thousand separators: e.g. "18000" -> "18.000"
 */
export function formatThousands(val: string | number | null | undefined): string {
  if (val === '' || val === null || val === undefined) return '';
  const clean = val.toString().replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse a dot-formatted string into integer: e.g. "18.000" -> 18000
 */
export function parseThousands(val: string | number | null | undefined): number {
  if (!val) return 0;
  const clean = val.toString().replace(/\./g, '').replace(/\D/g, '');
  return parseInt(clean, 10) || 0;
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

  const today = referenceDateStr ? new Date(referenceDateStr) : new Date();
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

/**
 * Determine if a warehouse category represents raw materials / packaging / internal operational stock
 * rather than customer-facing finished goods ("Produk Jadi").
 */
export function isRawMaterialCategory(category?: string, subcategory?: string): boolean {
  const combined = `${category || ''} ${subcategory || ''}`.toLowerCase();
  const rawKeywords = [
    'bahan baku',
    'bahan mentah',
    'bahan dapur',
    'bumbu mentah',
    'kemasan',
    'packaging',
    'perlengkapan',
    'operasional',
    'alat dapur',
    'atk',
  ];
  return rawKeywords.some((kw) => combined.includes(kw));
}

export function toStoreHandle(storeName: string, fallback = 'tokokasra'): string {
  const cleaned = (storeName || '')
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24);
  return cleaned || fallback;
}

export function extractHashtags(text: string): string[] {
  const matches = (text || '').match(/#[a-zA-Z0-9_]+/g) || [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
}

export function formatRelativeTimeIndo(isoOrReadable: string): string {
  try {
    const d = new Date(isoOrReadable);
    if (isNaN(d.getTime())) return isoOrReadable;
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} jam lalu`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return formatDateIndo(isoOrReadable);
  } catch {
    return isoOrReadable;
  }
}

export function formatWhatsAppUrl(phone: string, text?: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const normalized = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('62')
    ? digits
    : `62${digits}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalized}${query}`;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

