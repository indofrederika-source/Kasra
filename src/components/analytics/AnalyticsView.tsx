'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { formatRupiah, formatThousands, parseThousands } from '@/lib/utils';
import { exportToExcel, exportToOfficialPdf } from '@/lib/export/exportEngine';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { AccessibleDatePicker } from '@/components/ui/AccessibleDatePicker';
import {
  FileSpreadsheet,
  FileText,
  Download,
  TrendingUp,
  AlertOctagon,
  Plus,
  Trash2,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const formatAxisRupiah = (v: number) => {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1000000) {
    return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')} Jt`;
  }
  return `${Math.round(v / 1000)} Rb`;
};

export const AnalyticsView: React.FC = () => {
  const {
    profile,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    products,
    stockMovements,
    categoryDefinitions,
    monthIncome,
    monthExpense,
    totalAssetValue,
    theme,
  } = useKasra();

  const isDark = theme === 'dark';

  // Segmented Mode Switch (Chart | Report | Table)
  const [viewSegment, setViewSegment] = useState<'chart' | 'report' | 'table'>('chart');

  // Chart Type Switcher (Bar | Area | Donut | Composed)
  const [chartType, setChartType] = useState<'bar' | 'area' | 'donut' | 'composed'>('bar');

  // Chart Timeframe Switcher (Harian | Mingguan | Bulanan | Tahunan)
  const [chartTimeframe, setChartTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');

  interface ChartItem {
    period: string;
    masuk: number;
    keluar: number;
    laba: number;
    saldoKas: number;
    omset: number;
    marginPercent: number;
  }

  // Dynamic Datasets computed from real transactions using local timezone dates
  const chartDatasets = useMemo(() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const now = new Date();

    // 1. Day dataset (last 7 days)
    const dayList: ChartItem[] = [];
    let runningSaldoDay = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = toLocalIsoDate(d);
      const isToday = i === 0;
      const label = isToday ? 'Hari Ini' : dayNames[d.getDay()];

      let masuk = 0;
      let keluar = 0;
      transactions.forEach((t) => {
        if (t.date === dStr) {
          if (t.type === 'income') masuk += t.amount;
          else if (t.type === 'expense') keluar += t.amount;
        }
      });
      const laba = masuk - keluar;
      runningSaldoDay += laba;
      const margin = masuk > 0 ? Math.round((laba / masuk) * 100) : 0;
      dayList.push({
        period: label,
        masuk,
        keluar,
        laba,
        saldoKas: runningSaldoDay,
        omset: masuk,
        marginPercent: margin,
      });
    }

    // 2. Week dataset (4 weeks of current month)
    const currentMonthPrefix = toLocalIsoDate(now).slice(0, 7);
    const weekList: ChartItem[] = [];
    let runningSaldoWeek = 0;
    for (let w = 1; w <= 4; w++) {
      let masuk = 0;
      let keluar = 0;
      const startDay = (w - 1) * 7 + 1;
      const endDay = w === 4 ? 31 : w * 7;

      transactions.forEach((t) => {
        if (t.date && t.date.startsWith(currentMonthPrefix)) {
          const dayNum = parseInt(t.date.split('-')[2], 10) || 1;
          if (dayNum >= startDay && dayNum <= endDay) {
            if (t.type === 'income') masuk += t.amount;
            else if (t.type === 'expense') keluar += t.amount;
          }
        }
      });
      const laba = masuk - keluar;
      runningSaldoWeek += laba;
      const margin = masuk > 0 ? Math.round((laba / masuk) * 100) : 0;
      weekList.push({
        period: `Minggu ${w}`,
        masuk,
        keluar,
        laba,
        saldoKas: runningSaldoWeek,
        omset: masuk,
        marginPercent: margin,
      });
    }

    // 3. Month dataset (Jan to Dec of current year)
    const currentYear = now.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthList: ChartItem[] = [];
    let runningSaldoMonth = 0;
    for (let m = 0; m < 12; m++) {
      const mStr = `${currentYear}-${(m + 1).toString().padStart(2, '0')}`;
      let masuk = 0;
      let keluar = 0;
      transactions.forEach((t) => {
        if (t.date && t.date.startsWith(mStr)) {
          if (t.type === 'income') masuk += t.amount;
          else if (t.type === 'expense') keluar += t.amount;
        }
      });
      const laba = masuk - keluar;
      runningSaldoMonth += laba;
      const margin = masuk > 0 ? Math.round((laba / masuk) * 100) : 0;
      monthList.push({
        period: monthNames[m],
        masuk,
        keluar,
        laba,
        saldoKas: runningSaldoMonth,
        omset: masuk,
        marginPercent: margin,
      });
    }

    // 4. Year dataset (last 3 years)
    const yearList: ChartItem[] = [];
    let runningSaldoYear = 0;
    const years = [currentYear - 2, currentYear - 1, currentYear];
    years.forEach((yr) => {
      const yrStr = yr.toString();
      let masuk = 0;
      let keluar = 0;
      transactions.forEach((t) => {
        if (t.date && t.date.startsWith(yrStr)) {
          if (t.type === 'income') masuk += t.amount;
          else if (t.type === 'expense') keluar += t.amount;
        }
      });
      const laba = masuk - keluar;
      runningSaldoYear += laba;
      const margin = masuk > 0 ? Math.round((laba / masuk) * 100) : 0;
      yearList.push({
        period: yrStr,
        masuk,
        keluar,
        laba,
        saldoKas: runningSaldoYear,
        omset: masuk,
        marginPercent: margin,
      });
    });

    return {
      day: dayList,
      week: weekList,
      month: monthList,
      year: yearList,
    };
  }, [transactions]);

  const activeChartData = chartDatasets[chartTimeframe];

  // Operational & Expense Category Allocation (Donut / Pie) — empty when 0 expenses
  const categoryDonutData = useMemo(() => {
    const catMap: Record<string, number> = {};
    const colors = ['#84cc16', '#f59e0b', '#06b6d4', '#2F7D32', '#ec4899', '#64748b'];

    transactions
      .filter((t) => t.type === 'expense' && t.amount > 0)
      .forEach((t) => {
        const cat = t.category || 'Lainnya';
        catMap[cat] = (catMap[cat] || 0) + t.amount;
      });

    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      return [];
    }

    return entries.map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length],
    }));
  }, [transactions]);

  // Report Editable State
  const [reportTitle, setReportTitle] = useState(
    `Laporan Keuangan & Evaluasi Toko — Periode ${new Date().toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    })}`
  );
  const [customNarrative, setCustomNarrative] = useState<string | null>(null);

  const autoNarrative = useMemo(() => {
    const storeLabel = profile.storeName?.trim() || 'Usaha Toko';
    if (transactions.length === 0 && products.length === 0) {
      return `Belum ada transaksi maupun stok barang yang tercatat pada ${storeLabel} untuk periode ini (Rp 0). Ringkasan evaluasi akan otomatis diperbarui mengikuti pencatatan Buku Kas dan Gudang, atau dapat Anda sesuaikan langsung di kolom ini.`;
    }
    const net = monthIncome - monthExpense;
    return `Berdasarkan pencatatan aktual ${storeLabel}, total pemasukan bulan ini tercatat sebesar ${formatRupiah(
      monthIncome
    )} dengan total pengeluaran sebesar ${formatRupiah(monthExpense)}, menghasilkan selisih kas bersih ${formatRupiah(
      net
    )}. Nilai aset stok gudang saat ini berjumlah ${formatRupiah(totalAssetValue)} dari ${products.length} SKU terdaftar.`;
  }, [profile.storeName, transactions.length, products.length, monthIncome, monthExpense, totalAssetValue]);

  const displayedNarrative = customNarrative !== null ? customNarrative : autoNarrative;

  // Category options for Interactive Spreadsheet (connected to master categories + transactions)
  const spreadsheetCategoryOptions = useMemo(() => {
    const set = new Set<string>([
      'Penjualan',
      'Bahan Baku',
      'Operasional',
      'Kemasan & Cup',
      'Gaji Karyawan',
      'Listrik & Air',
    ]);
    categoryDefinitions.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    set.add('Lainnya');
    return Array.from(set).map((c) => ({ value: c, label: c }));
  }, [categoryDefinitions, transactions]);

  const handleAddSpreadsheetRow = () => {
    addTransaction({
      date: toLocalIsoDate(new Date()),
      type: 'income',
      amount: 0,
      category: 'Penjualan',
      description: 'Transaksi Baru',
      inputMethod: 'manual',
    });
  };

  const spreadsheetIncome = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );
  const spreadsheetExpense = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );
  const spreadsheetNet = spreadsheetIncome - spreadsheetExpense;

  // Sale count map per product from real stockMovements
  const saleCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    (stockMovements || []).forEach((m) => {
      if (m.type === 'out_sale') {
        map[m.productId] = (map[m.productId] || 0) + Math.abs(m.quantityDelta);
      }
    });
    return map;
  }, [stockMovements]);

  // Fast-Moving: ONLY products that actually have out_sale > 0
  const fastMoving = useMemo(() => {
    return products
      .filter((p) => (saleCountMap[p.id] || 0) > 0)
      .sort((a, b) => (saleCountMap[b.id] || 0) - (saleCountMap[a.id] || 0))
      .slice(0, 5);
  }, [products, saleCountMap]);

  // Deadstock: Products with currentStock > 0 and 0 sales
  const deadstockItems = useMemo(() => {
    return products
      .filter((p) => p.currentStock > 0 && (saleCountMap[p.id] || 0) === 0)
      .sort((a, b) => b.currentStock * b.hppAmount - a.currentStock * a.hppAmount)
      .slice(0, 5);
  }, [products, saleCountMap]);

  const totalLockedCapital = deadstockItems.reduce((acc, p) => acc + p.currentStock * p.hppAmount, 0);

  // Custom Sleek Non-Obstructive Tooltips
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
            Laba: <span className={laba >= 0 ? 'text-slate-900 font-bold' : 'text-rose-600 font-bold'}>{formatRupiah(laba)}</span>
          </span>
        </div>
      );
    }
    return null;
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const saldo = payload[0]?.value || 0;
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-normal uppercase">Periode</span>
          </p>
          <div className="flex justify-between items-center text-slate-900 pt-1">
            <span className="text-slate-600">Akumulasi Saldo:</span>
            <span className="font-mono font-bold text-slate-900">{formatRupiah(saldo)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalDonut = categoryDonutData.reduce((acc, c) => acc + c.value, 0);
      const pct = totalDonut > 0 ? ((data.value / totalDonut) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 min-w-[210px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.payload.color || '#84cc16' }} />
            <span className="font-bold text-slate-900">{data.name}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Nominal Beban:</span>
            <span className="font-mono font-bold text-slate-900">{formatRupiah(data.value)}</span>
          </div>
          <div className="flex justify-between items-center text-amber-600">
            <span>Proporsi Beban:</span>
            <span className="font-mono font-semibold">{pct}% dari total</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomComposedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const omset = payload.find((p: any) => p.dataKey === 'omset')?.value || 0;
      const margin = payload.find((p: any) => p.dataKey === 'marginPercent')?.value || 0;
      return (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl text-xs space-y-1.5 min-w-[190px]">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-normal uppercase">Periode</span>
          </p>
          <div className="flex justify-between items-center text-slate-900">
            <span>Omset Penjualan:</span>
            <span className="font-mono font-bold">{formatRupiah(omset)}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-600">
            <span>Rasio Margin Laba:</span>
            <span className="font-mono font-bold">{margin}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 1. Header & Official Bank Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Analisis & Studio Laporan Resmi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi keuangan, identifikasi perputaran barang, dan lembar kerja transaksi terhubung
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportToExcel(profile, transactions, products)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-xs whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => exportToOfficialPdf(profile, transactions, products)}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
              isDark
                ? 'bg-[#FCF1D0] hover:opacity-90 text-[#0D1C42] border border-[#e5d5a7]'
                : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6] border border-[#1E3D1C]'
            }`}
          >
            <FileText className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#0D1C42]' : 'text-[#F8FAF6]'}`} />
            <span>Cetak PDF Resmi Bank (KUR)</span>
          </button>
        </div>
      </div>

      {/* 2. Segmented Switch Bar */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex flex-wrap items-center justify-center sm:justify-start gap-1 p-1 bg-slate-100 border border-slate-200/80 rounded-3xl sm:rounded-full shadow-inner max-w-full">
          <button
            type="button"
            onClick={() => setViewSegment('chart')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              viewSegment === 'chart'
                ? isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs font-bold'
                  : 'bg-[#1E3D1C] text-[#F8FAF6] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 shrink-0" />
            <span>Grafik & Analitik</span>
          </button>

          <button
            type="button"
            onClick={() => setViewSegment('report')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              viewSegment === 'report'
                ? isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs font-bold'
                  : 'bg-[#1E3D1C] text-[#F8FAF6] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Laporan Evaluasi</span>
          </button>

          <button
            type="button"
            onClick={() => setViewSegment('table')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              viewSegment === 'table'
                ? isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs font-bold'
                  : 'bg-[#1E3D1C] text-[#F8FAF6] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Tabel Kas Interaktif ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* 3. SEGMENT 1: GRAFIK & ANALITIK (Visual Charts) */}
      {viewSegment === 'chart' && (
        <div className="space-y-6">
          {/* Format Diagram Switcher & Timeframe Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
            {/* Diagram Model Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 px-1">
                <BarChart2 className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-[#1E3D1C]'}`} />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Model Diagram:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    chartType === 'bar'
                      ? isDark
                        ? 'bg-[#FCF1D0] text-[#0D1C42] border border-[#e5d5a7] shadow-xs font-bold'
                        : 'bg-[#1E3D1C] text-[#F8FAF6] border border-[#1E3D1C] shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Batang (Arus Kas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    chartType === 'area'
                      ? isDark
                        ? 'bg-[#FCF1D0] text-[#0D1C42] border border-[#e5d5a7] shadow-xs font-bold'
                        : 'bg-[#1E3D1C] text-[#F8FAF6] border border-[#1E3D1C] shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Tren Area (Saldo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('donut')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    chartType === 'donut'
                      ? isDark
                        ? 'bg-[#FCF1D0] text-[#0D1C42] border border-[#e5d5a7] shadow-xs font-bold'
                        : 'bg-[#1E3D1C] text-[#F8FAF6] border border-[#1E3D1C] shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  <span>Donat (Beban)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('composed')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    chartType === 'composed'
                      ? isDark
                        ? 'bg-[#FCF1D0] text-[#0D1C42] border border-[#e5d5a7] shadow-xs font-bold'
                        : 'bg-[#1E3D1C] text-[#F8FAF6] border border-[#1E3D1C] shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Terpadu (Margin)</span>
                </button>
              </div>
            </div>

            {/* Timeframe Selector (Hari | Minggu | Bulan | Tahun) */}
            <div className="flex items-center flex-wrap gap-1 bg-slate-100 border border-slate-200/70 p-1 rounded-xl self-start lg:self-auto max-w-full">
              <span className="text-[11px] font-semibold text-slate-500 px-2">Rentang:</span>
              {(['day', 'week', 'month', 'year'] as const).map((tf) => {
                const labels = {
                  day: 'Per Hari',
                  week: 'Per Minggu',
                  month: 'Per Bulan',
                  year: 'Per Tahun',
                };
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      chartTimeframe === tf
                        ? isDark
                          ? 'bg-[#FCF1D0] text-[#0D1C42] font-bold shadow-xs'
                          : 'bg-[#1E3D1C] text-[#F8FAF6] font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {labels[tf]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DIAGRAM 1: Batang (Bar Chart - Arus Kas Masuk vs Keluar) */}
          {chartType === 'bar' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Arus Kas {chartTimeframe === 'day' ? 'Harian' : chartTimeframe === 'week' ? 'Mingguan' : chartTimeframe === 'month' ? 'Bulanan' : 'Tahunan'} (Uang Masuk vs Uang Keluar)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Komparasi kas masuk vs pengeluaran kulakan & operasional ({chartTimeframe === 'day' ? '7 Hari Terakhir' : chartTimeframe === 'week' ? '4 Minggu Bulan Ini' : chartTimeframe === 'month' ? '12 Bulan' : 'Tren Multi-Tahun'})
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600">Pengeluaran</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeChartData} barGap={8}>
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickFormatter={formatAxisRupiah}
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
                      barSize={24}
                      background={{ fill: '#f8fafc', radius: 8 }}
                    />
                    <Bar
                      dataKey="keluar"
                      fill="#ef4444"
                      radius={[8, 8, 0, 0]}
                      barSize={24}
                      background={{ fill: '#f8fafc', radius: 8 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* DIAGRAM 2: Tren Area (Area Chart - Pertumbuhan Akumulasi Saldo Kas) */}
          {chartType === 'area' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tren Akumulasi Saldo Kas Bersih ({chartTimeframe === 'day' ? 'Harian' : chartTimeframe === 'week' ? 'Mingguan' : chartTimeframe === 'month' ? 'Bulanan' : 'Tahunan'})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pertumbuhan likuiditas kas toko berjalan ({chartTimeframe === 'day' ? 'Per Hari' : chartTimeframe === 'week' ? 'Per Minggu' : chartTimeframe === 'month' ? 'Per Bulan' : 'Per Tahun'})
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                    <span className="text-slate-600">Akumulasi Saldo</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData}>
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84cc16" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      tickFormatter={formatAxisRupiah}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: '#84cc16', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      content={<CustomAreaTooltip />}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldoKas"
                      stroke="#84cc16"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSaldo)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* DIAGRAM 3: Donat Beban (Pie / Donut Chart - Komposisi Alokasi Beban Toko) */}
          {chartType === 'donut' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Komposisi Beban Usaha & Kulakan</h3>
                  <p className="text-xs text-slate-500">Proporsi pengeluaran kas per kategori dari Buku Kas</p>
                </div>
                <span className="text-xs font-bold font-mono text-slate-900">
                  Total Beban: {formatRupiah(categoryDonutData.reduce((s, c) => s + c.value, 0))}
                </span>
              </div>

              {categoryDonutData.length === 0 ? (
                <div className="py-12 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-600">
                    Belum Ada Pengeluaran Tercatat (Rp 0)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Komposisi beban usaha akan otomatis tampil setelah Anda mencatat pengeluaran di Buku Kas atau kulakan di Gudang.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 pt-2">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDonutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomDonutTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {categoryDonutData.map((cat, idx) => {
                      const totalDonut = categoryDonutData.reduce((acc, c) => acc + c.value, 0);
                      const pct = totalDonut > 0 ? Math.round((cat.value / totalDonut) * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-xs font-semibold text-slate-900">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 font-mono">{formatRupiah(cat.value)}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DIAGRAM 4: Terpadu (Composed Chart - Omset Batang + Margin Line) */}
          {chartType === 'composed' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Omset Penjualan vs Rasio Margin Laba (%) ({chartTimeframe === 'day' ? 'Harian' : chartTimeframe === 'week' ? 'Mingguan' : chartTimeframe === 'month' ? 'Bulanan' : 'Tahunan'})
                  </h3>
                  <p className="text-xs text-slate-500">Diagram gabungan volume penjualan dengan rasio margin laba UMKM</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                    <span className="text-slate-600">Omset (Rp)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    <span className="text-slate-600">Margin Laba (%)</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={activeChartData}>
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickFormatter={formatAxisRupiah}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#0f172a"
                      fontSize={10}
                      tickFormatter={(v) => `${v}%`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0, 0, 0, 0.03)' }}
                      content={<CustomComposedTooltip />}
                    />
                    <Bar yAxisId="left" dataKey="omset" fill="#84cc16" radius={[6, 6, 0, 0]} barSize={26} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="marginPercent"
                      stroke="#0f172a"
                      strokeWidth={3}
                      dot={{ fill: '#0f172a', r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Fast-Moving vs Slow-Moving Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Barang Terlaris (Fast-Moving) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Barang Terlaris (Perputaran Cepat)</h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold font-mono">
                  {fastMoving.length} Barang
                </span>
              </div>

              {fastMoving.length === 0 ? (
                <div className="py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs font-medium text-slate-500">Belum ada penjualan barang tercatat (0)</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 pt-1">
                  {fastMoving.map((p, idx) => {
                    const soldQty = saleCountMap[p.id] || 0;
                    const marginPct =
                      p.sellingPrice > 0
                        ? Math.round(((p.sellingPrice - p.hppAmount) / p.sellingPrice) * 100)
                        : 0;
                    return (
                      <div key={p.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center text-xs font-bold text-slate-900 font-mono">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {p.category || 'Umum'} • Terjual {soldQty} {p.unit}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 font-mono">
                            {formatRupiah(p.sellingPrice)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Margin: {marginPct}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Barang Mengendap (Deadstock) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Barang Mengendap (Perputaran Lambat)</h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                  Tertahan: {formatRupiah(totalLockedCapital)}
                </span>
              </div>

              {deadstockItems.length === 0 ? (
                <div className="py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                  <p className="text-xs font-medium text-slate-500">Belum ada barang mengendap (0)</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 pt-1">
                  {deadstockItems.map((p) => {
                    const lockedAmount = p.currentStock * p.hppAmount;
                    return (
                      <div key={p.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Sisa: {p.currentStock} {p.unit} di gudang
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 font-mono">
                            {formatRupiah(lockedAmount)}
                          </div>
                          <div className="text-[10px] text-slate-400">Modal tertahan</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SEGMENT 2: LAPORAN EVALUASI (100% Editable Document) */}
      {viewSegment === 'report' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Dokumen Resmi Laba Rugi UMKM
              </span>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full bg-transparent font-bold text-lg text-slate-900 border-b border-dashed border-slate-300 focus:border-slate-500 focus:outline-none mt-1"
              />
            </div>
            <button
              type="button"
              onClick={() => exportToOfficialPdf(profile, transactions, products)}
              className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#FCF1D0] hover:opacity-90 text-[#0D1C42] border border-[#e5d5a7]'
                  : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6] border border-[#1E3D1C]'
              }`}
            >
              <Download className={`w-3.5 h-3.5 ${isDark ? 'text-[#0D1C42]' : 'text-[#F8FAF6]'}`} />
              <span>Unduh PDF</span>
            </button>
          </div>

          {/* Letterhead Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {(profile.storeName?.trim() || 'NAMA TOKO BELUM DIISI').toUpperCase()}
            </div>
            <div>
              Alamat: {profile.address?.trim() || '-'} | Telp: {profile.phone?.trim() || '-'}
            </div>
            <div>
              Penanggung Jawab: {profile.ownerName?.trim() || '-'} | Rekening: {profile.bankAccount?.trim() || '-'}
            </div>
          </div>

          {/* Narrative Textarea (Fully Editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Narasi Ringkasan Analisis (Bebas Diedit):
              </label>
              <span className="text-[10px] text-slate-400">Terhubung otomatis & dapat diedit</span>
            </div>

            <textarea
              rows={5}
              value={displayedNarrative}
              onChange={(e) => setCustomNarrative(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl p-4 text-xs text-slate-800 leading-relaxed focus:outline-none focus:bg-white"
            />
          </div>

          {/* Financial Summary Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500">Total Pemasukan Bulan Ini</div>
              <div className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(monthIncome)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500">Total Pengeluaran Bulan Ini</div>
              <div className="text-lg font-bold text-rose-600 font-mono">{formatRupiah(monthExpense)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500">Total Nilai Aset Stok</div>
              <div className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(totalAssetValue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SEGMENT 3: IN-APP SPREADSHEET (100% Connected to Live Transactions) */}
      {viewSegment === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                <span>Tabel Lembar Kerja Kas Interaktif (Sinkron Buku Kas)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Setiap perubahan atau penambahan baris langsung tersinkronisasi dengan Buku Kas, Beranda, dan Excel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddSpreadsheetRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>

              <button
                type="button"
                onClick={() => exportToExcel(profile, transactions, products)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm cursor-pointer transition-all ${
                  isDark
                    ? 'bg-[#FCF1D0] hover:opacity-90 text-[#0D1C42] border border-[#e5d5a7]'
                    : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6] border border-[#1E3D1C]'
                }`}
              >
                <Download className={`w-3.5 h-3.5 ${isDark ? 'text-[#0D1C42]' : 'text-[#F8FAF6]'}`} />
                <span>Simpan Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3 w-44">Tanggal</th>
                  <th className="py-2.5 px-3 w-36">Arus Kas</th>
                  <th className="py-2.5 px-3">Deskripsi Transaksi</th>
                  <th className="py-2.5 px-3 w-44">Kategori</th>
                  <th className="py-2.5 px-3 w-40 text-right">Nominal (Rp)</th>
                  <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-600">
                          Lembar Kerja Masih Kosong (0 Baris)
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Klik "+ Tambah Baris" di kanan atas atau catat transaksi dari Buku Kas / Suara.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((trx, idx) => (
                    <tr key={trx.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-400 text-center font-mono">{idx + 1}</td>

                      <td className="py-1.5 px-2 w-44">
                        <AccessibleDatePicker
                          value={trx.date}
                          onChange={(val) =>
                            updateTransaction(trx.id, { date: val || toLocalIsoDate(new Date()) })
                          }
                          allowClear={false}
                          compact
                        />
                      </td>

                      <td className="py-1.5 px-2 w-36">
                        <CustomDropdown
                          value={trx.type}
                          onChange={(val) =>
                            updateTransaction(trx.id, {
                              type: val as 'income' | 'expense',
                            })
                          }
                          options={[
                            { value: 'income', label: '+ Masuk' },
                            { value: 'expense', label: '- Keluar' },
                          ]}
                          buttonClassName={`bg-white border-slate-200 font-semibold ${
                            trx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        />
                      </td>

                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={trx.description}
                          onChange={(e) =>
                            updateTransaction(trx.id, { description: e.target.value })
                          }
                          placeholder="Deskripsi transaksi..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none"
                        />
                      </td>

                      <td className="py-1.5 px-2 w-44">
                        <CustomDropdown
                          value={trx.category}
                          onChange={(val) => updateTransaction(trx.id, { category: val })}
                          options={spreadsheetCategoryOptions}
                          buttonClassName="bg-white border-slate-200 text-slate-800"
                        />
                      </td>

                      <td className="py-1.5 px-2 w-40">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={trx.amount === 0 ? '0' : formatThousands(trx.amount)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            updateTransaction(trx.id, {
                              amount: raw === '' ? 0 : parseThousands(raw),
                            });
                          }}
                          className={`w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-right focus:outline-none font-bold font-mono ${
                            trx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        />
                      </td>

                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => deleteTransaction(trx.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus baris transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              Total <span className="font-bold text-slate-900">{transactions.length}</span> baris transaksi
            </span>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-emerald-700 font-semibold">
                Masuk: {formatRupiah(spreadsheetIncome)}
              </span>
              <span className="text-rose-600 font-semibold">
                Keluar: {formatRupiah(spreadsheetExpense)}
              </span>
              <span className="text-sm font-bold text-slate-900 border-l border-slate-200 pl-3">
                Saldo Bersih: {formatRupiah(spreadsheetNet)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
