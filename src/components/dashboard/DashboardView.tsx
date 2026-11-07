'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { parseOmniboxInput } from '@/lib/ai/parser';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Mic,
  ScanLine,
  Plus,
  ChevronDown,
  ChevronUp,
  Target,
  ShieldCheck,
  Wallet,
  PieChart,
  Calculator,
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
  onOpenCalculator?: () => void;
}

const COST_COLORS = [
  'bg-lime-500',
  'bg-amber-500',
  'bg-slate-600',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-rose-500',
];

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenVoice,
  onOpenScan,
  onOpenCalculator,
}) => {
  const {
    products,
    transactions,
    profile,
    categoryDefinitions,
    todayIncome,
    todayExpense,
    todayProfit,
    monthIncome,
    setActiveTab,
    setActiveDraft,
  } = useKasra();

  // Omnibox state
  const [omniboxText, setOmniboxText] = useState('');

  // Expand state for Alert Queue (strictly in-place expand)
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  // Timeframe selector for balance chart ('7d' | '30d')
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');

  // Hover state on chart to display values in header without covering the bars
  const [activeHoverData, setActiveHoverData] = useState<{
    day: string;
    masuk: number;
    keluar: number;
    laba: number;
  } | null>(null);

  // Handle Omnibox quick NLP submit
  const handleOmniboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!omniboxText.trim()) return;
    const draft = parseOmniboxInput(omniboxText.trim(), products, categoryDefinitions);
    setActiveDraft(draft);
    setOmniboxText('');
  };

  // Cumulative store cash balance (starts at Rp 0 when empty)
  const totalStoreBalance = useMemo(() => {
    return transactions.reduce((acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount), 0);
  }, [transactions]);

  // Target bulanan calculation (starts at 0 when empty)
  const monthlyTarget = profile.monthlyTarget || 0;
  const targetPercent =
    monthlyTarget > 0 ? Math.min(100, Math.round((monthIncome / monthlyTarget) * 100)) : 0;

  // Dynamic cash flow chart computed from real transactions (7d & 30d)
  const chartData = useMemo(() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const now = new Date();
    const result = [];
    const count = chartRange === '7d' ? 7 : 30;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateStr(d);
      const isToday = i === 0;
      const label =
        chartRange === '7d'
          ? isToday
            ? 'Hari Ini'
            : dayNames[d.getDay()]
          : `${d.getDate()}/${d.getMonth() + 1}`;

      let masuk = 0;
      let keluar = 0;

      transactions.forEach((t) => {
        if (t.date === dateStr) {
          if (t.type === 'income') masuk += t.amount;
          else if (t.type === 'expense') keluar += t.amount;
        }
      });

      result.push({
        day: label,
        masuk,
        keluar,
        laba: masuk - keluar,
        dateStr,
      });
    }

    return result;
  }, [transactions, chartRange]);

  // Aggregated Alert Priority Queue: low stocks & near expiry
  const allAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      productId: string;
      productName: string;
      type: 'stock' | 'expiry';
      badgeLabel: string;
      badgeStyle: 'critical' | 'warning';
      detail: string;
    }> = [];

    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    products.forEach((p) => {
      // Low stock alerts
      if (p.currentStock <= p.minStockAlert) {
        const isCritical = p.currentStock === 0;
        alerts.push({
          id: `stock-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: 'stock',
          badgeLabel: isCritical ? 'HABIS' : 'STOK MENIPIS',
          badgeStyle: isCritical ? 'critical' : 'warning',
          detail: `Sisa: ${p.currentStock} ${p.unit} (Alarm batas aman: ${p.minStockAlert} ${p.unit})`,
        });
      }

      // Expiry alerts
      if (p.expiryDate) {
        const parts = p.expiryDate.split('-').map(Number);
        if (parts.length === 3) {
          const expTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
          const diffDays = Math.round((expTime - todayZero) / (1000 * 60 * 60 * 24));

          if (diffDays <= 7) {
            const isExpired = diffDays < 0;
            alerts.push({
              id: `expiry-${p.id}`,
              productId: p.id,
              productName: p.name,
              type: 'expiry',
              badgeLabel: isExpired ? 'KADALUARSA' : diffDays === 0 ? 'HARI INI' : `${diffDays} HARI LAGI`,
              badgeStyle: isExpired ? 'critical' : 'warning',
              detail: isExpired
                ? `Telah lewat kadaluarsa pada ${formatDateIndo(p.expiryDate)}`
                : `Kadaluarsa pada ${formatDateIndo(p.expiryDate)} (prioritaskan pemakaian FEFO)`,
            });
          }
        }
      }
    });

    return alerts;
  }, [products]);

  const displayedAlerts = isAlertsExpanded ? allAlerts : allAlerts.slice(0, 5);

  // Dynamic Cost Analysis by Real Transaction Categories (0 when empty)
  const costAnalysis = useMemo(() => {
    const catMap: Record<string, number> = {};
    let totalExpenseCalc = 0;

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        totalExpenseCalc += t.amount;
        const catName = t.category?.trim() || 'Lainnya';
        catMap[catName] = (catMap[catName] || 0) + t.amount;
      });

    if (totalExpenseCalc === 0) {
      return { total: 0, items: [] };
    }

    const sortedEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    return {
      total: totalExpenseCalc,
      items: sortedEntries.map(([label, amount], idx) => ({
        label,
        amount,
        percent: Math.round((amount / totalExpenseCalc) * 100),
        color: COST_COLORS[idx % COST_COLORS.length],
      })),
    };
  }, [transactions]);

  // Non-obstructive Tooltip that stays pinned at the very top (y: 0) so it NEVER covers the bars
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const masuk = payload.find((p: any) => p.dataKey === 'masuk')?.value || 0;
      const keluar = payload.find((p: any) => p.dataKey === 'keluar')?.value || 0;
      const laba = masuk - keluar;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-md text-xs flex items-center gap-3 font-mono pointer-events-none select-none">
          <span className="font-bold text-slate-900 font-sans">{label}:</span>
          <span className="text-emerald-700 font-bold">+{formatRupiah(masuk)}</span>
          <span className="text-rose-600 font-bold">-{formatRupiah(keluar)}</span>
          <span className="text-slate-500 font-semibold border-l border-slate-200 pl-2">
            Laba:{' '}
            <span className={laba >= 0 ? 'text-slate-900 font-bold' : 'text-rose-600 font-bold'}>
              {formatRupiah(laba)}
            </span>
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Page Title & Omnibox Quick Record Station */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Operasional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan harian arus kas toko, antrean peringatan barang, dan manajemen gudang
          </p>
        </div>

        {/* Omnibox Input Pill */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleOmniboxSubmit} className="relative flex items-center w-full sm:w-84">
            <input
              type="text"
              value={omniboxText}
              onChange={(e) => setOmniboxText(e.target.value)}
              placeholder="Catat cepat kejadian toko (Enter)..."
              className="w-full bg-white border border-slate-200/90 focus:border-slate-900 rounded-full pl-9 pr-16 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-2xs"
            />
            <Mic className="w-3.5 h-3.5 text-slate-400 absolute left-3.5" />
            <button
              type="submit"
              disabled={!omniboxText.trim()}
              className="absolute right-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
            >
              Kirim
            </button>
          </form>

          <button
            onClick={onOpenVoice}
            className="p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Buka mic suara Kasra"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main 12-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 Cols): Chart, Statistics, and Antrean Peringatan Prioritas right underneath */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Chart Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Tren Arus Kas Toko</span>
                <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono mt-0.5">
                  {activeHoverData ? (
                    <span className="inline-flex items-center gap-2 flex-wrap">
                      <span>{activeHoverData.day}:</span>
                      <span className="text-emerald-600">+{formatRupiah(activeHoverData.masuk)}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-rose-600">-{formatRupiah(activeHoverData.keluar)}</span>
                    </span>
                  ) : (
                    `Arus Kas ${chartRange === '7d' ? '7 Hari Terakhir' : '30 Hari Terakhir'}`
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Timeframe Pill (7 Hari / 30 Hari) */}
                <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200/70 text-xs font-semibold">
                  <button
                    onClick={() => setChartRange('7d')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      chartRange === '7d'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => setChartRange('30d')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      chartRange === '30d'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    30 Hari
                  </button>
                </div>

                {/* Legend Indicators */}
                <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Masuk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Keluar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart: Pinned Tooltip at y: 0 so it NEVER blocks the bars */}
            <div className="h-64 sm:h-72 w-full pt-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  barGap={6}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      setActiveHoverData(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setActiveHoverData(null)}
                >
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#f1f5f9' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(v) =>
                      v === 0
                        ? '0'
                        : v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}jt`
                        : v >= 1000
                        ? `${Math.round(v / 1000)}k`
                        : `${v}`
                    }
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                    position={{ y: 0 }}
                    content={<CustomBarTooltip />}
                  />
                  <Bar
                    dataKey="masuk"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    barSize={chartRange === '7d' ? 22 : 9}
                    background={{ fill: '#f8fafc', radius: 8 }}
                  />
                  <Bar
                    dataKey="keluar"
                    fill="#ef4444"
                    radius={[8, 8, 0, 0]}
                    barSize={chartRange === '7d' ? 22 : 9}
                    background={{ fill: '#f8fafc', radius: 8 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Pemasukan Hari Ini */}
            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-2.5 transition-colors shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Pemasukan Hari Ini</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {formatRupiah(todayIncome)}
              </div>
              <div
                className={`text-[11px] font-medium flex items-center gap-1 ${
                  todayIncome > 0 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                <span>
                  {todayIncome > 0 ? 'Tercatat masuk hari ini' : 'Belum ada pemasukan hari ini'}
                </span>
              </div>
            </div>

            {/* Card 2: Pengeluaran Hari Ini */}
            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-2.5 transition-colors shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Pengeluaran Hari Ini</span>
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {formatRupiah(todayExpense)}
              </div>
              <div className="text-[11px] text-slate-400">
                {todayExpense > 0 ? 'Belanja bahan & operasional' : 'Belum ada pengeluaran'}
              </div>
            </div>

            {/* Card 3: Estimasi Laba Bersih */}
            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-2.5 transition-colors shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Estimasi Laba Bersih</span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              <div
                className={`text-xl font-bold tracking-tight font-mono ${
                  todayProfit >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {formatRupiah(todayProfit)}
              </div>
              <div className="text-[11px] text-slate-500">
                Margin:{' '}
                <span className="text-slate-900 font-semibold">
                  {todayIncome > 0 ? Math.round((todayProfit / todayIncome) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Card 4: Target Bulanan */}
            <div
              onClick={() => setActiveTab('settings')}
              className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-2.5 transition-colors shadow-2xs cursor-pointer"
              title="Klik untuk mengatur target bulanan toko"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Target Bulanan</span>
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between font-mono gap-1">
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {targetPercent}%
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {monthlyTarget > 0 ? `Target: ${formatRupiah(monthlyTarget)}` : 'Target: Rp 0'}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-lime-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${targetPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ANTREAN PERINGATAN PRIORITAS - DIRECTLY UNDERNEATH STATISTICS */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Antrean Peringatan Prioritas ({allAlerts.length})
                </h3>
              </div>

              {allAlerts.length > 5 && (
                <button
                  type="button"
                  onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <span>
                    {isAlertsExpanded ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${allAlerts.length})`}
                  </span>
                  {isAlertsExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setActiveTab('storage')}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    alert.badgeStyle === 'critical'
                      ? 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200 border-l-4 border-l-rose-500'
                      : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">{alert.productName}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          alert.badgeStyle === 'critical'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {alert.badgeLabel}
                      </span>
                    </div>
                    <div
                      className={`text-[11px] ${
                        alert.badgeStyle === 'critical' ? 'text-rose-700' : 'text-amber-800'
                      }`}
                    >
                      {alert.detail}
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 hidden sm:inline-block">
                    Buka di Gudang →
                  </span>
                </div>
              ))}

              {allAlerts.length === 0 && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
                  <div className="font-semibold text-slate-900">Belum Ada Peringatan (0)</div>
                  <p>Tidak ada barang yang kritis atau mendekati tanggal kedaluwarsa.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 Cols): Saldo Tersedia, Quick Actions, and Riwayat Transaksi */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Saldo Tersedia */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-md text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">Kas Usaha Toko</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-xs text-slate-400 font-mono">Saldo Tersedia</span>
              <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
                {formatRupiah(totalStoreBalance)}
              </div>
            </div>
          </div>

          {/* Quick Actions (4 Buttons) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Aksi Cepat Kasir & Gudang
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onOpenVoice}
                className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <span>Bicara</span>
              </button>

              <button
                onClick={onOpenScan}
                className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <ScanLine className="w-3.5 h-3.5" />
                </div>
                <span>Scan Nota</span>
              </button>

              <button
                onClick={() => setActiveTab('cash')}
                className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Catat Kas</span>
              </button>

              <button
                onClick={() => setActiveTab('storage')}
                className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <span>Gudang</span>
              </button>

              {onOpenCalculator && (
                <button
                  onClick={onOpenCalculator}
                  className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 text-slate-800 border border-slate-200 text-xs font-semibold transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <Calculator className="w-3.5 h-3.5" />
                  </div>
                  <span>Buka Kalkulator Cepat</span>
                </button>
              )}
            </div>
          </div>

          {/* Riwayat Kasir Terkini */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Riwayat Kasir Terkini ({transactions.length})
              </span>
              <button
                onClick={() => setActiveTab('cash')}
                className="text-[11px] text-slate-500 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-600">Belum Ada Riwayat Kasir (0)</div>
                <p className="text-[11px]">Transaksi masuk & keluar akan tampil di sini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((trx) => (
                  <div
                    key={trx.id}
                    onClick={() => setActiveTab('cash')}
                    className="p-2.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          trx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {trx.type === 'income' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {trx.description}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {trx.date} • {trx.category}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-bold font-mono shrink-0 ${
                        trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {trx.type === 'income'
                        ? `+${formatRupiah(trx.amount)}`
                        : `-${formatRupiah(trx.amount)}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. FULL-WIDTH EXPANDED CARD: ALOKASI BIAYA TOKO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Alokasi & Struktur Biaya Toko</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian proporsi pengeluaran berdasarkan kategori transaksi keluar toko
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Total Pengeluaran Kasir & Toko</span>
            <span className="text-xl font-extrabold font-mono text-slate-900">
              {formatRupiah(costAnalysis.total)}
            </span>
          </div>
        </div>

        {/* Segmented Multi-Color Bar (0% empty neutral bar when total === 0) */}
        <div className="space-y-2">
          <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-1 shadow-inner">
            {costAnalysis.items.map((item, idx) => (
              <div
                key={idx}
                className={`${item.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(3, item.percent)}%` }}
                title={`${item.label}: ${formatRupiah(item.amount)} (${item.percent}%)`}
              />
            ))}
          </div>
        </div>

        {/* Detailed Breakdown Grid or Clean Zero State */}
        {costAnalysis.items.length === 0 ? (
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-center text-xs text-slate-500">
            Belum ada pengeluaran tercatat (<span className="font-mono font-semibold text-slate-700">Rp 0</span>). Struktur alokasi biaya otomatis terisi saat Anda mencatat transaksi pengeluaran.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {costAnalysis.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900">{item.percent}%</span>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-600">
                  {formatRupiah(item.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
