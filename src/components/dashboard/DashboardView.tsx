'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { TransactionType } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { parseOmniboxInput } from '@/lib/ai/parser';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Mic,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  PieChart,
  Eye,
  EyeOff,
  BarChart2,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  onOpenVoice: () => void;
  onOpenScan: () => void;
  onOpenCalculator?: () => void;
  onOpenQuickAdd?: (type?: TransactionType) => void;
}

const COST_COLORS = [
  'bg-amber-400',
  'bg-emerald-500',
  'bg-indigo-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-teal-500',
];

function getCategoryEmoji(category: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('penjualan') || c.includes('makan') || c.includes('kopi')) return '🍜';
  if (c.includes('bahan') || c.includes('dapur') || c.includes('sayur')) return '🛒';
  if (c.includes('kemasan') || c.includes('cup')) return '🛍️';
  if (c.includes('listrik') || c.includes('air')) return '💡';
  if (c.includes('gaji') || c.includes('karyawan')) return '💼';
  return '🧾';
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenVoice,
}) => {
  const {
    products,
    transactions,
    profile,
    categoryDefinitions,
    todayIncome,
    todayExpense,
    monthIncome,
    monthExpense,
    setActiveTab,
    setActiveDraft,
    theme,
  } = useKasra();

  const isDark = theme === 'dark';

  // Omnibox state
  const [omniboxText, setOmniboxText] = useState('');

  // Hero Balance visibility (Eye toggle)
  const [showBalance, setShowBalance] = useState(true);

  // Expand state for Alert Queue
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  // Statistic Timeframe (Daily | Weekly | Monthly | Annual)
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'annual'>('daily');

  // Report Data Filter (All | Spent | Income)
  const [reportFilter, setReportFilter] = useState<'all' | 'spent' | 'income'>('all');

  // Visual Chart Mode: 'pill' (Pill Bars) vs 'line' (Smooth Line Report)
  const [chartVisualMode, setChartVisualMode] = useState<'pill' | 'line'>('pill');

  // Recent Transaction Time Filter (All | Today | 1 Month | 2 Month)
  const [trxRangeFilter, setTrxRangeFilter] = useState<'all' | 'today' | '1m' | '2m'>('all');

  // Handle Omnibox quick NLP submit
  const handleOmniboxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!omniboxText.trim()) return;
    const draft = parseOmniboxInput(omniboxText.trim(), products, categoryDefinitions);
    setActiveDraft(draft);
    setOmniboxText('');
  };

  // Cumulative store cash balance
  const totalStoreBalance = useMemo(() => {
    return transactions.reduce(
      (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
      0
    );
  }, [transactions]);

  // Growth percentage this month
  const monthlyGrowthPercent = useMemo(() => {
    if (monthIncome === 0 && monthExpense === 0) return 0;
    if (monthExpense === 0) return 100;
    return Math.round(((monthIncome - monthExpense) / Math.max(1, monthExpense)) * 100);
  }, [monthIncome, monthExpense]);

  // Dynamic Chart Data for Daily (7d), Weekly (4w), Monthly (6m), Annual (4y)
  const chartData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const result: Array<{
      label: string;
      fullDate: string;
      masuk: number;
      keluar: number;
      total: number;
      isHighlight?: boolean;
    }> = [];

    if (timeframe === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = toLocalDateStr(d);
        let masuk = 0;
        let keluar = 0;
        transactions.forEach((t) => {
          if (t.date === dateStr) {
            if (t.type === 'income') masuk += t.amount;
            else keluar += t.amount;
          }
        });
        const val =
          reportFilter === 'income'
            ? masuk
            : reportFilter === 'spent'
            ? keluar
            : masuk + keluar;
        result.push({
          label: dayNames[d.getDay()],
          fullDate: formatDateIndo(dateStr),
          masuk,
          keluar,
          total: val,
          isHighlight: i === 0,
        });
      }
    } else if (timeframe === 'weekly') {
      for (let w = 3; w >= 0; w--) {
        const endD = new Date(now);
        endD.setDate(endD.getDate() - w * 7);
        const startD = new Date(endD);
        startD.setDate(startD.getDate() - 6);
        const startStr = toLocalDateStr(startD);
        const endStr = toLocalDateStr(endD);

        let masuk = 0;
        let keluar = 0;
        transactions.forEach((t) => {
          if (t.date >= startStr && t.date <= endStr) {
            if (t.type === 'income') masuk += t.amount;
            else keluar += t.amount;
          }
        });
        const val =
          reportFilter === 'income'
            ? masuk
            : reportFilter === 'spent'
            ? keluar
            : masuk + keluar;
        result.push({
          label: `W${4 - w}`,
          fullDate: `${startD.getDate()} - ${endD.getDate()} ${monthNames[endD.getMonth()]}`,
          masuk,
          keluar,
          total: val,
          isHighlight: w === 0,
        });
      }
    } else if (timeframe === 'monthly') {
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        let masuk = 0;
        let keluar = 0;
        transactions.forEach((t) => {
          if (t.date.startsWith(prefix)) {
            if (t.type === 'income') masuk += t.amount;
            else keluar += t.amount;
          }
        });
        const val =
          reportFilter === 'income'
            ? masuk
            : reportFilter === 'spent'
            ? keluar
            : masuk + keluar;
        result.push({
          label: monthNames[d.getMonth()],
          fullDate: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
          masuk,
          keluar,
          total: val,
          isHighlight: m === 0,
        });
      }
    } else {
      for (let y = 3; y >= 0; y--) {
        const yr = String(now.getFullYear() - y);
        let masuk = 0;
        let keluar = 0;
        transactions.forEach((t) => {
          if (t.date.startsWith(yr)) {
            if (t.type === 'income') masuk += t.amount;
            else keluar += t.amount;
          }
        });
        const val =
          reportFilter === 'income'
            ? masuk
            : reportFilter === 'spent'
            ? keluar
            : masuk + keluar;
        result.push({
          label: yr,
          fullDate: `Tahun ${yr}`,
          masuk,
          keluar,
          total: val,
          isHighlight: y === 0,
        });
      }
    }

    const maxVal = Math.max(...result.map((r) => r.total));
    if (maxVal > 0) {
      result.forEach((r) => {
        r.isHighlight = r.total === maxVal;
      });
    }

    return result;
  }, [transactions, timeframe, reportFilter]);

  // Filtered Recent Transactions (All | Today | 1 Month | 2 Month)
  const filteredRecentTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = toLocalDateStr(now);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const oneMonthStr = toLocalDateStr(oneMonthAgo);

    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const twoMonthsStr = toLocalDateStr(twoMonthsAgo);

    return transactions
      .filter((t) => {
        if (trxRangeFilter === 'today') return t.date === todayStr;
        if (trxRangeFilter === '1m') return t.date >= oneMonthStr;
        if (trxRangeFilter === '2m') return t.date >= twoMonthsStr;
        return true;
      })
      .slice(0, 6);
  }, [transactions, trxRangeFilter]);

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
      if (p.currentStock <= p.minStockAlert) {
        const isCritical = p.currentStock === 0;
        alerts.push({
          id: `stock-${p.id}`,
          productId: p.id,
          productName: p.name,
          type: 'stock',
          badgeLabel: isCritical ? 'HABIS' : 'STOK MENIPIS',
          badgeStyle: isCritical ? 'critical' : 'warning',
          detail: `Sisa: ${p.currentStock} ${p.unit} (Batas aman: ${p.minStockAlert} ${p.unit})`,
        });
      }

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
              badgeLabel: isExpired
                ? 'KADALUARSA'
                : diffDays === 0
                ? 'HARI INI'
                : `${diffDays} HARI LAGI`,
              badgeStyle: isExpired ? 'critical' : 'warning',
              detail: isExpired
                ? `Telah lewat kadaluarsa pada ${formatDateIndo(p.expiryDate)}`
                : `Kadaluarsa pada ${formatDateIndo(p.expiryDate)} (prioritaskan FEFO)`,
            });
          }
        }
      }
    });

    return alerts;
  }, [products]);

  const displayedAlerts = isAlertsExpanded ? allAlerts : allAlerts.slice(0, 4);

  // Dynamic Cost Analysis
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

  // Floating Tooltip Box
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`rounded-2xl px-3.5 py-2.5 shadow-xl text-xs space-y-1 pointer-events-none select-none border ${
            isDark
              ? 'bg-[#0D1C42] text-[#FCF1D0] border-[#345294]'
              : 'bg-[#18181B] text-white border-slate-800'
          }`}
        >
          <div className="text-[10px] opacity-75 font-medium">{data.fullDate}</div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[11px] opacity-85">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Spent
            </span>
            <span className="font-mono font-bold">{formatRupiah(data.keluar)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[11px] opacity-85">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Income
            </span>
            <span
              className={`font-mono font-bold ${
                isDark ? 'text-[#FCF1D0]' : 'text-emerald-400'
              }`}
            >
              {formatRupiah(data.masuk)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* 1. Top Greeting & Omnibox Quick AI Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {profile.storeName || 'KASRA Workspace'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem Pembukuan Kas Digital, Gudang FEFO & Asisten AI Multi-Klausul
          </p>
        </div>

        {/* Omnibox Input Pill */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleOmniboxSubmit} className="relative flex items-center w-full sm:w-84">
            <input
              type="text"
              value={omniboxText}
              onChange={(e) => setOmniboxText(e.target.value)}
              placeholder="Ketik cepat: 'beli ayam 6 ekor 120rb'..."
              className="w-full bg-white border border-slate-200/90 focus:border-slate-400 rounded-full pl-9 pr-16 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors shadow-2xs"
            />
            <Mic className="w-3.5 h-3.5 text-slate-400 absolute left-3.5" />
            <button
              type="submit"
              disabled={!omniboxText.trim()}
              className={`absolute right-1.5 px-3.5 py-1 rounded-full disabled:opacity-40 text-[11px] font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42]'
                  : 'bg-[#18181B] text-white'
              }`}
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

      {/* ======================================================================
          2. MAIN 12-COLUMN BENTO GRID
         ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================================
            LEFT COLUMN (5 Cols on Desktop):
            - Clean Hero Balance Card (without credit card number / bank chips)
            - Recent Transaction List
           ==================================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* HERO BALANCE CARD */}
          <div
            className={`relative overflow-hidden rounded-[32px] p-6 shadow-xl transition-all ${
              isDark
                ? 'bg-gradient-to-br from-[#22396F] via-[#284482] to-[#1A2E5E] text-[#FCF1D0] border border-[#3858A0] shadow-[#071026]/50'
                : 'bg-gradient-to-br from-[#130924] via-[#2B125A] to-[#4A1D96] text-white shadow-indigo-950/20'
            }`}
          >
            {/* Subtle Ambient Glow */}
            <div
              className={`pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full blur-3xl opacity-25 ${
                isDark ? 'bg-[#FCF1D0]' : 'bg-purple-400'
              }`}
            />

            {/* Top Row: "Total savings / Saldo Kas" + Eye Icon */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowBalance((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity opacity-85 hover:opacity-100 cursor-pointer ${
                  isDark ? 'text-[#FCF1D0]' : 'text-white'
                }`}
              >
                <span>Total Saldo Kas Usaha</span>
                {showBalance ? (
                  <Eye className="w-3.5 h-3.5 opacity-80" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 opacity-80" />
                )}
              </button>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                  isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42]'
                    : 'bg-white/15 text-white border border-white/20'
                }`}
              >
                Kas Aktif
              </span>
            </div>

            {/* Giant Balance Amount */}
            <div className="relative z-10 mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono">
                {showBalance ? formatRupiah(totalStoreBalance) : 'Rp •••••••••'}
              </div>
              <p
                className={`text-xs mt-2 font-medium ${
                  isDark ? 'text-[#FCF1D0]/85' : 'text-white/85'
                }`}
              >
                <span
                  className={`font-bold ${
                    isDark ? 'text-[#6EE7B7]' : 'text-emerald-300'
                  }`}
                >
                  {monthlyGrowthPercent >= 0
                    ? `+${monthlyGrowthPercent}%`
                    : `${monthlyGrowthPercent}%`}
                  .
                </span>{' '}
                Performa arus kas bulan ini tercatat otomatis.
              </p>
            </div>
          </div>

          {/* RECENT TRANSACTION CARD */}
          <div
            className={`border rounded-[32px] p-5 shadow-xs space-y-4 transition-colors ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-white border-slate-200/80 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recent transaction</h3>
              <button
                type="button"
                onClick={() => setActiveTab('cash')}
                className="text-xs text-slate-400 hover:text-slate-900 underline underline-offset-4 font-medium cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* Timeframe Filter Pills: All | Today | 1 Month | 2 Month */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: '1m', label: '1 Month' },
                { id: '2m', label: '2 Month' },
              ].map((pill) => {
                const isActive = trxRangeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setTrxRangeFilter(pill.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-sm'
                          : 'bg-[#18181B] text-white shadow-xs'
                        : isDark
                        ? 'bg-[#172A57] text-[#FCF1D0]/80 hover:text-[#FCF1D0]'
                        : 'bg-slate-100 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Transaction Rows */}
            {filteredRecentTransactions.length === 0 ? (
              <div
                className={`p-6 rounded-3xl border text-center text-xs space-y-1.5 ${
                  isDark
                    ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0]/80'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                <div className="font-bold text-slate-700">Belum Ada Transaksi</div>
                <p className="text-[11px]">
                  Klik tombol <strong>+ Add Transaction</strong> untuk mulai mencatat kas toko.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredRecentTransactions.map((trx) => (
                  <div
                    key={trx.id}
                    onClick={() => setActiveTab('cash')}
                    className={`p-3 rounded-[22px] border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#172A57] hover:bg-[#1E356B] border-[#345294]'
                        : 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg shrink-0 shadow-2xs ${
                          isDark
                            ? 'bg-[#22396F] border-[#345294]'
                            : 'bg-white border-slate-200/70'
                        }`}
                      >
                        {getCategoryEmoji(trx.category)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {trx.description}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {trx.category} • {formatDateIndo(trx.date)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-extrabold font-mono ${
                          trx.type === 'income'
                            ? isDark
                              ? 'text-[#6EE7B7]'
                              : 'text-emerald-600'
                            : isDark
                            ? 'text-[#FDA4AF]'
                            : 'text-rose-500'
                        }`}
                      >
                        {trx.type === 'income'
                          ? `+${formatRupiah(trx.amount)}`
                          : `-${formatRupiah(trx.amount)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full-width "See all transaction" pill button */}
            <button
              type="button"
              onClick={() => setActiveTab('cash')}
              className={`w-full py-3 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#172A57] hover:bg-[#2B4684] text-[#FCF1D0] border border-[#345294]'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800'
              }`}
            >
              See all transaction
            </button>
          </div>

          {/* DAILY INCOME & DAILY EXPENSE SIDE-BY-SIDE CARDS (Moved Below Recent Transaction) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Daily Income Card */}
            <div
              className={`border rounded-[28px] p-5 space-y-2 shadow-2xs transition-colors ${
                isDark
                  ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                  : 'bg-white border-slate-200/80 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Daily Income</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={`text-2xl font-extrabold font-mono tracking-tight ${
                    isDark ? 'text-[#6EE7B7]' : 'text-emerald-600'
                  }`}
                >
                  {formatRupiah(todayIncome)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pemasukan kasir tercatat hari ini
              </p>
            </div>

            {/* Daily Expense Card */}
            <div
              className={`border rounded-[28px] p-5 space-y-2 shadow-2xs transition-colors ${
                isDark
                  ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                  : 'bg-white border-slate-200/80 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Daily Expense</span>
                <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={`text-2xl font-extrabold font-mono tracking-tight ${
                    isDark ? 'text-[#FDA4AF]' : 'text-rose-500'
                  }`}
                >
                  {formatRupiah(todayExpense)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Belanja bahan baku & operasional hari ini
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================================
            RIGHT / ANALYTICS COLUMN (7 Cols on Desktop):
            - Statistic & Report This Month Card
            - Antrean Peringatan Prioritas (FEFO & Stok Kritis)
            - Alokasi & Struktur Biaya Toko
           ==================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* STATISTIC & REPORT THIS MONTH CARD */}
          <div
            className={`border rounded-[32px] p-6 shadow-xs space-y-5 transition-colors ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-white border-slate-200/80 text-slate-900'
            }`}
          >
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Statistic & Report this month
                </h2>
                <p className="text-xs text-slate-400">
                  Visualisasi arus kas masuk dan keluar secara real-time
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch between Pill Bar vs Line Chart */}
                <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setChartVisualMode('pill')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      chartVisualMode === 'pill'
                        ? isDark
                          ? 'bg-[#FCF1D0] text-[#0D1C42]'
                          : 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                    title="Pill Bar Chart"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Pill Bar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartVisualMode('line')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                      chartVisualMode === 'line'
                        ? isDark
                          ? 'bg-[#FCF1D0] text-[#0D1C42]'
                          : 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                    title="Report Trend Line Chart"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Trend Line</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={`text-xs font-bold underline underline-offset-4 cursor-pointer ${
                    isDark
                      ? 'text-[#FCF1D0] hover:opacity-80'
                      : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  See details
                </button>
              </div>
            </div>

            {/* Timeframe Selector Bar: Daily | Weekly | Monthly | Annual */}
            <div className="grid grid-cols-4 p-1.5 rounded-full bg-slate-100 border border-slate-200/70 text-xs font-bold">
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'annual', label: 'Annual' },
              ].map((tf) => {
                const isActive = timeframe === tf.id;
                return (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id as any)}
                    className={`py-2 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#FCF1D0] text-[#0D1C42] font-extrabold shadow-sm'
                          : 'bg-[#18181B] text-white font-extrabold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>

            {/* Report Sub-Filter Tabs: All | Spent | Income */}
            <div className="grid grid-cols-3 p-1 rounded-full bg-slate-100/80 border border-slate-200/50 text-xs font-semibold">
              {[
                { id: 'all', label: 'All' },
                { id: 'spent', label: 'Spent' },
                { id: 'income', label: 'Income' },
              ].map((tab) => {
                const isActive = reportFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReportFilter(tab.id as any)}
                    className={`py-1.5 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? isDark
                          ? 'bg-[#22396F] text-[#FCF1D0] font-bold shadow-2xs border border-[#345294]'
                          : 'bg-white text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Chart Viewport */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {chartVisualMode === 'pill' ? (
                  <BarChart data={chartData} barCategoryGap="22%">
                    <XAxis
                      dataKey="label"
                      stroke={isDark ? '#B8C4E0' : '#94a3b8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      orientation="right"
                      stroke={isDark ? '#B8C4E0' : '#94a3b8'}
                      fontSize={10}
                      tickFormatter={(v) =>
                        v === 0
                          ? '0'
                          : v >= 1000000
                          ? `${(v / 1000000).toFixed(1)}M`
                          : v >= 1000
                          ? `${Math.round(v / 1000)}K`
                          : `${v}`
                      }
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={<CustomChartTooltip />}
                    />
                    <Bar
                      dataKey="total"
                      radius={[999, 999, 999, 999]}
                      barSize={32}
                      background={{
                        fill: isDark ? '#172A57' : '#F1F5F9',
                        radius: 999,
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.isHighlight
                              ? isDark
                                ? '#FCF1D0'
                                : '#311068'
                              : isDark
                              ? '#4A6BB5'
                              : '#6366F1'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDark ? '#345294' : '#F1F5F9'}
                    />
                    <XAxis
                      dataKey="label"
                      stroke={isDark ? '#B8C4E0' : '#94a3b8'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      orientation="right"
                      stroke={isDark ? '#B8C4E0' : '#94a3b8'}
                      fontSize={10}
                      tickFormatter={(v) =>
                        v === 0
                          ? '0'
                          : v >= 1000000
                          ? `${(v / 1000000).toFixed(1)}M`
                          : v >= 1000
                          ? `${Math.round(v / 1000)}K`
                          : `${v}`
                      }
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    {(reportFilter === 'all' || reportFilter === 'income') && (
                      <Area
                        type="monotone"
                        dataKey="masuk"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#incomeGrad)"
                      />
                    )}
                    {(reportFilter === 'all' || reportFilter === 'spent') && (
                      <Area
                        type="monotone"
                        dataKey="keluar"
                        stroke="#EF4444"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#spentGrad)"
                      />
                    )}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* ANTREAN PERINGATAN PRIORITAS (FEFO & STOK KRITIS) */}
          <div
            className={`border rounded-[32px] p-6 shadow-xs space-y-4 transition-colors ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-white border-slate-200/80 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Antrean Peringatan Prioritas ({allAlerts.length})
                </h3>
              </div>

              {allAlerts.length > 4 && (
                <button
                  type="button"
                  onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <span>
                    {isAlertsExpanded
                      ? 'Tampilkan Lebih Sedikit'
                      : `Lihat Semua (${allAlerts.length})`}
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

                  <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline-block">
                    Gudang →
                  </span>
                </div>
              ))}

              {allAlerts.length === 0 && (
                <div
                  className={`p-5 rounded-2xl border text-center text-xs space-y-1 ${
                    isDark
                      ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0]/80'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
                  <div className="font-semibold text-slate-900">Semua Stok Gudang Aman (0 Peringatan)</div>
                  <p>Tidak ada barang yang kritis atau mendekati tanggal kedaluwarsa.</p>
                </div>
              )}
            </div>
          </div>

          {/* ALOKASI & STRUKTUR BIAYA TOKO */}
          <div
            className={`border rounded-[32px] p-6 shadow-xs space-y-4 transition-colors ${
              isDark
                ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
                : 'bg-white border-slate-200/80 text-slate-900'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Alokasi & Struktur Biaya Toko</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rincian proporsi pengeluaran berdasarkan kategori transaksi keluar
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total Pengeluaran</span>
                <span className="text-lg font-extrabold font-mono text-slate-900">
                  {formatRupiah(costAnalysis.total)}
                </span>
              </div>
            </div>

            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-1">
              {costAnalysis.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(3, item.percent)}%` }}
                  title={`${item.label}: ${formatRupiah(item.amount)} (${item.percent}%)`}
                />
              ))}
            </div>

            {costAnalysis.items.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-center text-xs text-slate-500">
                Belum ada pengeluaran tercatat (<span className="font-mono font-semibold">Rp 0</span>).
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {costAnalysis.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
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
      </div>
    </div>
  );
};
