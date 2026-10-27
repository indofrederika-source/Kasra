'use client';

import React, { useState } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { parseOmniboxInput } from '@/lib/ai/parser';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  Mic,
  ScanLine,
  Plus,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface DashboardViewProps {
  onOpenVoice: () => void;
  onOpenScan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenVoice, onOpenScan }) => {
  const {
    products,
    transactions,
    profile,
    categoryDefinitions,
    todayIncome,
    todayExpense,
    todayProfit,
    monthIncome,
    criticalStockCount,
    nearExpiryCount,
    setActiveTab,
    setActiveDraft,
  } = useKasra();

  // Omnibox state
  const [omniboxText, setOmniboxText] = useState('');

  // Expand state for Alert Queue (strictly in-place expand)
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  // Handle Omnibox quick NLP submit
  const handleOmniboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!omniboxText.trim()) return;
    const draft = parseOmniboxInput(omniboxText.trim(), products, categoryDefinitions);
    setActiveDraft(draft);
    setOmniboxText('');
  };

  // Target bulanan calculation
  const monthlyTarget = profile.monthlyTarget || 10000000;
  const targetPercent = Math.min(100, Math.round((monthIncome / monthlyTarget) * 100));

  // 7-day cash flow chart data
  const chartData = [
    { day: 'Sen', masuk: 1850000, keluar: 420000 },
    { day: 'Sel', masuk: 2100000, keluar: 650000 },
    { day: 'Rab', masuk: 1980000, keluar: 310000 },
    { day: 'Kam', masuk: 2450000, keluar: 580000 },
    { day: 'Jum', masuk: 3100000, keluar: 820000 },
    { day: 'Sab', masuk: 3800000, keluar: 1100000 },
    { day: 'Hari Ini', masuk: todayIncome, keluar: todayExpense },
  ];

  // Aggregated Alert Priority Queue: low stocks & near expiry
  const allAlerts: Array<{
    id: string;
    productName: string;
    type: 'stock' | 'expiry';
    badgeLabel: string;
    badgeStyle: 'critical' | 'warning';
    detail: string;
  }> = [];

  products.forEach((p) => {
    // Low stock alerts
    if (p.currentStock <= p.minStockAlert) {
      const isCritical = p.currentStock === 0;
      allAlerts.push({
        id: `stock-${p.id}`,
        productName: p.name,
        type: 'stock',
        badgeLabel: isCritical ? 'HABIS' : 'STOK MENIPIS',
        badgeStyle: isCritical ? 'critical' : 'warning',
        detail: `Sisa: ${p.currentStock} ${p.unit} (Batas alarm aman: ${p.minStockAlert} ${p.unit})`,
      });
    }

    // Expiry alerts
    if (p.expiryDate) {
      const exp = new Date(p.expiryDate);
      const now = new Date();
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        const isExpired = diffDays < 0;
        allAlerts.push({
          id: `expiry-${p.id}`,
          productName: p.name,
          type: 'expiry',
          badgeLabel: isExpired ? 'KADALUARSA' : `${diffDays} HARI LAGI`,
          badgeStyle: isExpired ? 'critical' : 'warning',
          detail: isExpired
            ? `Telah lewat kadaluarsa pada ${formatDateIndo(p.expiryDate)}`
            : `Kadaluarsa pada ${formatDateIndo(p.expiryDate)} (segera gunakan atau beri promo diskon)`,
        });
      }
    }
  });

  // Display count based on expanded state
  const displayedAlerts = isAlertsExpanded ? allAlerts : allAlerts.slice(0, 4);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Page Title & Overview Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard Operasional
          </h1>
          <p className="text-xs text-[#8a8a92] mt-1">
            Ringkasan harian arus kas, inventaris stok, dan antrean peringatan barang
          </p>
        </div>

        {/* Quick Omnibox Trigger & Voice Station */}
        <div className="flex items-center gap-2">
          <form
            onSubmit={handleOmniboxSubmit}
            className="relative flex items-center w-full sm:w-80"
          >
            <input
              type="text"
              value={omniboxText}
              onChange={(e) => setOmniboxText(e.target.value)}
              placeholder="Catat cepat kejadian toko (Enter)..."
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-full pl-9 pr-16 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none transition-colors"
            />
            <Mic className="w-3.5 h-3.5 text-[#71717a] absolute left-3.5" />
            <button
              type="submit"
              disabled={!omniboxText.trim()}
              className="absolute right-1.5 px-3 py-1 rounded-full bg-[#242428] hover:bg-[#2c2c32] border border-[#34343b] disabled:opacity-40 text-white text-[11px] font-bold transition-all"
            >
              Kirim
            </button>
          </form>

          <button
            onClick={onOpenVoice}
            className="p-2.5 rounded-full bg-[#202024] hover:bg-[#28282e] border border-[#2c2c32] text-stone-300 hover:text-white transition-colors"
            title="Buka mic suara"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Haulix HUD Style - Clean Neutral Charcoal & Crisp White Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemasukan Hari Ini */}
        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-5 space-y-3 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8a8a92]">
            <span>Pemasukan Hari Ini</span>
            <div className="w-6 h-6 rounded-full bg-[#242428] text-stone-300 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {formatRupiah(todayIncome)}
          </div>
          <div className="text-[11px] text-[#8a8a92] font-medium flex items-center gap-1">
            <span>↑ 14% dari rata-rata toko</span>
          </div>
        </div>

        {/* Card 2: Pengeluaran Hari Ini */}
        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-5 space-y-3 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8a8a92]">
            <span>Pengeluaran Hari Ini</span>
            <div className="w-6 h-6 rounded-full bg-[#242428] text-stone-300 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {formatRupiah(todayExpense)}
          </div>
          <div className="text-[11px] text-[#8a8a92]">
            Belanja bahan baku & operasional
          </div>
        </div>

        {/* Card 3: Estimasi Laba Bersih (WHITE NUMBERS, NOT LIME!) */}
        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-5 space-y-3 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8a8a92]">
            <span>Estimasi Laba Bersih</span>
            <div className="w-6 h-6 rounded-full bg-[#242428] text-stone-300 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold tracking-tight font-mono ${
              todayProfit >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatRupiah(todayProfit)}
          </div>
          <div className="text-[11px] text-[#8a8a92]">
            Margin laba:{' '}
            <span className="text-white font-semibold">
              {todayIncome > 0 ? Math.round((todayProfit / todayIncome) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card 4: Target Bulanan */}
        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-5 space-y-3 transition-colors">
          <div className="flex items-center justify-between text-xs text-[#8a8a92]">
            <span>Target Bulanan</span>
            <div className="w-6 h-6 rounded-full bg-[#242428] text-[#f2aa4b] flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-white tracking-tight">
              {targetPercent}%
            </span>
            <span className="text-xs text-[#8a8a92]">
              {formatRupiah(monthIncome)}
            </span>
          </div>
          <div className="w-full bg-[#28282e] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#f2aa4b] h-full rounded-full transition-all duration-500"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Left (Alerts & Actions) / Right (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 of 12 cols): Quick Actions & Alert Priority Queue */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Actions (Haulix Capsule Buttons) */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a92] flex items-center gap-2">
              <Activity className="w-4 h-4 text-stone-300" />
              <span>Aksi Cepat Kasir & Gudang</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={onOpenVoice}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#222226] hover:bg-[#28282e] border border-[#2c2c32] text-white text-xs font-medium transition-all group active:scale-98"
              >
                <Mic className="w-3.5 h-3.5 text-stone-300 group-hover:text-white transition-colors" />
                <span>Bicara Kasir</span>
              </button>

              <button
                onClick={onOpenScan}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#222226] hover:bg-[#28282e] border border-[#2c2c32] text-white text-xs font-medium transition-all group active:scale-98"
              >
                <ScanLine className="w-3.5 h-3.5 text-stone-300 group-hover:text-white transition-colors" />
                <span>Scan Nota Belanja</span>
              </button>

              <button
                onClick={() => setActiveTab('cash')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#222226] hover:bg-[#28282e] border border-[#2c2c32] text-white text-xs font-medium transition-all group active:scale-98 col-span-2 sm:col-span-1"
              >
                <Plus className="w-3.5 h-3.5 text-stone-300 group-hover:text-white transition-colors" />
                <span>Catat Kas Manual</span>
              </button>
            </div>
          </div>

          {/* Alert Priority Queue (Haulix Image "Required Break" warm amber Style) */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a92] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#f2aa4b]" />
                <span>Antrean Peringatan Prioritas ({allAlerts.length})</span>
              </div>

              {/* Toggle Expand / Collapse right on Dashboard */}
              {allAlerts.length > 4 && (
                <button
                  type="button"
                  onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                  className="text-xs text-stone-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                >
                  <span>{isAlertsExpanded ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${allAlerts.length})`}</span>
                  {isAlertsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    alert.badgeStyle === 'critical'
                      ? 'bg-[#2a171c] border-[#48202a] border-l-4 border-l-rose-500'
                      : 'bg-[#282015] border-[#44331e] border-l-4 border-l-[#f2aa4b]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{alert.productName}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          alert.badgeStyle === 'critical'
                            ? 'bg-[#3f1922] text-rose-300 border border-[#5c2432]'
                            : 'bg-[#3a2c18] text-[#f2aa4b] border border-[#543e20]'
                        }`}
                      >
                        {alert.badgeLabel}
                      </span>
                    </div>
                    <div className={`text-[11px] ${alert.badgeStyle === 'critical' ? 'text-[#e0a4ad]' : 'text-[#c0b098]'}`}>
                      {alert.detail}
                    </div>
                  </div>
                </div>
              ))}

              {allAlerts.length === 0 && (
                <div className="p-4 rounded-xl bg-[#222226] border border-[#2c2c32] text-center text-xs text-[#8a8a92]">
                  Semua kondisi stok aman dan tidak ada barang yang mendekati kadaluarsa.
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Ledger */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a92]">
                Aktivitas Terkini (Recent Activity)
              </div>
              <button
                onClick={() => setActiveTab('cash')}
                className="text-xs text-[#8a8a92] hover:text-white transition-colors"
              >
                Buka Buku Kas
              </button>
            </div>

            <div className="divide-y divide-[#28282e]">
              {transactions.slice(0, 4).map((trx) => (
                <div key={trx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        trx.type === 'income'
                          ? 'bg-[#242428] text-stone-300'
                          : 'bg-[#281a1d] text-rose-400'
                      }`}
                    >
                      {trx.type === 'income' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{trx.description}</div>
                      <div className="text-[11px] text-[#71717a] font-mono">{trx.createdAt} • {trx.category}</div>
                    </div>
                  </div>

                  <div
                    className={`text-xs font-bold font-mono ${
                      trx.type === 'income' ? 'text-white' : 'text-rose-400'
                    }`}
                  >
                    {trx.type === 'income' ? `+${formatRupiah(trx.amount)}` : `-${formatRupiah(trx.amount)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12 cols): Cashflow Chart (Haulix Warm Amber Style) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Tren Arus Kas (7 Hari)</h3>
                <p className="text-xs text-[#8a8a92]">Pemasukan vs Pengeluaran Harian</p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f2aa4b]" />
                  <span className="text-stone-300">Masuk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#484d5c]" />
                  <span className="text-stone-300">Keluar</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={6}>
                  <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={10}
                    tickFormatter={(v) => `${v / 1000}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171719',
                      borderColor: '#2c2c32',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#ffffff',
                    }}
                    formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  />
                  <Bar dataKey="masuk" fill="#f2aa4b" radius={[6, 6, 0, 0]} barSize={20} />
                  <Bar dataKey="keluar" fill="#484d5c" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Perputaran Stok Health Strip */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#8a8a92]">
              Kesehatan Perputaran Stok
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span>Rasio Stok Aman</span>
                <span className="text-white font-bold font-mono">
                  {Math.round(((products.length - criticalStockCount) / (products.length || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-[#28282e] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#f2aa4b] h-full rounded-full"
                  style={{
                    width: `${Math.round(
                      ((products.length - criticalStockCount) / (products.length || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
