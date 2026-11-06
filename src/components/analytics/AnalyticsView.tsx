'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { exportToExcel, exportToOfficialPdf } from '@/lib/export/exportEngine';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import {
  Activity,
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
  ArrowUpRight,
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
  Legend,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { profile, transactions, products, stockMovements, monthIncome, monthExpense, totalAssetValue } = useKasra();

  // Segmented Mode Switch (Foto 2 Style: Chart | Report | Table)
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

  // Dynamic Datasets computed from real transactions
  const chartDatasets = useMemo(() => {
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const now = new Date();

    // 1. Day dataset (last 7 days)
    const dayList: ChartItem[] = [];
    let runningSaldoDay = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
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
    const currentMonthPrefix = now.toISOString().slice(0, 7);
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

  // 3. Operational & Expense Category Allocation (Donut / Pie) computed dynamically
  const categoryDonutData = useMemo(() => {
    const catMap: Record<string, number> = {};
    const colors = ['#84cc16', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b'];

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category || 'Lainnya';
        catMap[cat] = (catMap[cat] || 0) + t.amount;
      });

    const entries = Object.entries(catMap);
    if (entries.length === 0) {
      return [
        { name: 'Bahan Baku & Dapur', value: 1, color: '#84cc16' },
        { name: 'Operasional', value: 1, color: '#f59e0b' },
      ];
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
  const [reportNarrative, setReportNarrative] = useState(
    `Berdasarkan pencatatan kasra, usaha ${profile.storeName} mencatat arus pendapatan positif pada bulan ini. Efisiensi margin HPP bahan baku terjaga pada level sehat ~35%. Disarankan untuk segera melakukan promo bundling pada produk deadstock guna mencairkan modal yang mengendap.`
  );

  // In-App Editable Spreadsheet Rows (TanStack / Table in-app Excel)
  const [spreadsheetRows, setSpreadsheetRows] = useState([
    {
      id: 'row-1',
      item: 'Kopi Susu Gula Aren 250ml',
      kategori: 'Penjualan',
      qty: 120,
      unit: 'cup',
      hargaSatuan: 18000,
      subtotal: 2160000,
      keterangan: 'Item best-seller kafe',
    },
    {
      id: 'row-2',
      item: 'Biji Kopi Arabika Gayo 1kg',
      kategori: 'Bahan Baku',
      qty: 5,
      unit: 'pack',
      hargaSatuan: 145000,
      subtotal: 725000,
      keterangan: 'Kulakan bahan baku utama',
    },
    {
      id: 'row-3',
      item: 'Susu UHT Full Cream 1 Liter',
      kategori: 'Bahan Baku',
      qty: 24,
      unit: 'kotak',
      hargaSatuan: 17500,
      subtotal: 420000,
      keterangan: 'Suplai 2 dus',
    },
    {
      id: 'row-4',
      item: 'Paper Cup Dingin + Tutup Strawless',
      kategori: 'Bahan Baku',
      qty: 150,
      unit: 'pcs',
      hargaSatuan: 650,
      subtotal: 97500,
      keterangan: 'Kemasan takeaway ramah lingkungan',
    },
    {
      id: 'row-5',
      item: 'Token Listrik Operasional Barista',
      kategori: 'Operasional',
      qty: 1,
      unit: 'bulan',
      hargaSatuan: 250000,
      subtotal: 250000,
      keterangan: 'Beban tetap operasional',
    },
  ]);

  // Handle cell edit
  const handleUpdateRow = (id: string, field: string, value: any) => {
    setSpreadsheetRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'qty' || field === 'hargaSatuan') {
          updated.subtotal = (Number(updated.qty) || 0) * (Number(updated.hargaSatuan) || 0);
        }
        return updated;
      })
    );
  };

  // Add row to spreadsheet
  const handleAddSpreadsheetRow = () => {
    const newRow = {
      id: `row-${Date.now()}`,
      item: 'Item Baru',
      kategori: 'Penjualan',
      qty: 1,
      unit: 'pcs',
      hargaSatuan: 10000,
      subtotal: 10000,
      keterangan: 'Keterangan tambahan',
    };
    setSpreadsheetRows((prev) => [...prev, newRow]);
  };

  // Delete row from spreadsheet
  const handleDeleteSpreadsheetRow = (id: string) => {
    setSpreadsheetRows((prev) => prev.filter((r) => r.id !== id));
  };

  const spreadsheetTotal = spreadsheetRows.reduce((acc, r) => acc + r.subtotal, 0);

  // Fast-Moving: Products with highest out_sale quantity in stock movements
  const fastMoving = useMemo(() => {
    const saleCountMap: Record<string, number> = {};
    (stockMovements || []).forEach((m) => {
      if (m.type === 'out_sale') {
        saleCountMap[m.productId] = (saleCountMap[m.productId] || 0) + Math.abs(m.quantityDelta);
      }
    });
    return [...products]
      .sort((a, b) => (saleCountMap[b.id] || 0) - (saleCountMap[a.id] || 0))
      .slice(0, 3);
  }, [products, stockMovements]);

  // Deadstock: Products with currentStock > 0 but lowest or 0 sales
  const deadstockItems = useMemo(() => {
    const saleCountMap: Record<string, number> = {};
    (stockMovements || []).forEach((m) => {
      if (m.type === 'out_sale') {
        saleCountMap[m.productId] = (saleCountMap[m.productId] || 0) + Math.abs(m.quantityDelta);
      }
    });
    const lowOrNoSales = products.filter((p) => p.currentStock > 0 && (saleCountMap[p.id] || 0) === 0);
    return (lowOrNoSales.length > 0 ? lowOrNoSales : products.filter((p) => p.currentStock > 10)).slice(0, 3);
  }, [products, stockMovements]);

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
      const pct = ((data.value / totalDonut) * 100).toFixed(1);
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
            Visualisasi keuangan, identifikasi perputaran barang, dan lembar kerja perbankan
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportToExcel(profile, transactions, products)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportToOfficialPdf(profile, transactions, products)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak PDF Resmi Bank (KUR)</span>
          </button>
        </div>
      </div>

      {/* 2. Segmented Switch Bar */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200/80 rounded-full shadow-inner">
          <button
            onClick={() => setViewSegment('chart')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              viewSegment === 'chart'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Grafik & Analitik</span>
          </button>

          <button
            onClick={() => setViewSegment('report')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              viewSegment === 'report'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Laporan Evaluasi</span>
          </button>

          <button
            onClick={() => setViewSegment('table')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              viewSegment === 'table'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Spreadsheet Interaktif</span>
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
                <BarChart2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Model Diagram:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    chartType === 'bar'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Batang (Arus Kas)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    chartType === 'area'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Tren Area (Saldo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('donut')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    chartType === 'donut'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5" />
                  <span>Donat (Beban)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartType('composed')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    chartType === 'composed'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Terpadu (Margin)</span>
                </button>
              </div>
            </div>

            {/* Timeframe Selector (Hari | Minggu | Bulan | Tahun) */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/70 p-1 rounded-xl self-start lg:self-auto">
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
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      chartTimeframe === tf
                        ? 'bg-lime-500 text-slate-950 font-bold shadow-xs'
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
                    Komparasi kas masuk vs pengeluaran kulakan & operasional ({chartTimeframe === 'day' ? 'Senin - Minggu' : chartTimeframe === 'week' ? '4 Minggu Terakhir' : chartTimeframe === 'month' ? '12 Bulan' : 'Tren Multi-Tahun'})
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                    <span className="text-slate-600">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
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
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000} Jt` : `${v / 1000} Rb`)}
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
                      fill="#84cc16"
                      radius={[8, 8, 0, 0]}
                      barSize={24}
                      background={{ fill: '#f8fafc', radius: 8 }}
                    />
                    <Bar
                      dataKey="keluar"
                      fill="#cbd5e1"
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
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000} Jt` : `${v / 1000} Rb`)}
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
                  <p className="text-xs text-slate-500">Proporsi modal belanja per kategori utama untuk efisiensi toko</p>
                </div>
              </div>

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
                    const pct = Math.round((cat.value / totalDonut) * 100);
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
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000} Jt` : `${v / 1000} Rb`)}
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
                  <h3 className="text-sm font-bold text-slate-900">Barang Terlaris (Fast-Moving)</h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold font-mono">
                  Penyumbang Laba Utama
                </span>
              </div>

              <div className="divide-y divide-slate-100 pt-1">
                {fastMoving.map((p, idx) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-xs font-bold text-slate-900 font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {formatRupiah(p.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400">Margin: ~35%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barang Mengendap (Deadstock) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Barang Mengendap (Slow-Moving)</h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold font-mono">
                  Tertahan: {formatRupiah(totalLockedCapital)}
                </span>
              </div>

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
            </div>
          </div>
        </div>
      )}

      {/* 4. SEGMENT 2: LAPORAN EVALUASI (100% Editable Document) */}
      {viewSegment === 'report' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
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
              onClick={() => exportToOfficialPdf(profile, transactions, products)}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>

          {/* Letterhead Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-slate-900 text-sm">{profile.storeName.toUpperCase()}</div>
            <div>{profile.address} | Telp: {profile.phone}</div>
            <div>Penanggung Jawab: {profile.ownerName} | Rekening: {profile.bankAccount}</div>
          </div>

          {/* Narrative Textarea (Fully Editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Narasi Ringkasan Analisis (Bebas Diedit):
              </label>
              <span className="text-[10px] text-slate-400">Dapat diedit langsung sebelum dicetak</span>
            </div>

            <textarea
              rows={5}
              value={reportNarrative}
              onChange={(e) => setReportNarrative(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl p-4 text-xs text-slate-800 leading-relaxed focus:outline-none focus:bg-white"
            />
          </div>

          {/* Financial Summary Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500">Total Pemasukan</div>
              <div className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(monthIncome)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500">Total Pengeluaran</div>
              <div className="text-lg font-bold text-rose-600 font-mono">{formatRupiah(monthExpense)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500">Total Nilai Aset Stok</div>
              <div className="text-lg font-bold text-slate-900 font-mono">{formatRupiah(totalAssetValue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SEGMENT 3: IN-APP SPREADSHEET (Editable Cells & Add/Delete Rows) */}
      {viewSegment === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                <span>Lembar Kerja Spreadsheet Interaktif</span>
              </h3>
              <p className="text-xs text-slate-500">
                Klik sel mana pun untuk mengubah angka atau teks secara langsung sebelum ekspor Excel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSpreadsheetRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>

              <button
                onClick={() => exportToExcel(profile, transactions, products)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-3 w-8">#</th>
                  <th className="py-2.5 px-3">Nama Item / Transaksi</th>
                  <th className="py-2.5 px-3 w-32">Kategori</th>
                  <th className="py-2.5 px-3 w-20 text-center">Jumlah</th>
                  <th className="py-2.5 px-3 w-20 text-center">Satuan</th>
                  <th className="py-2.5 px-3 w-32 text-right">Harga Satuan (Rp)</th>
                  <th className="py-2.5 px-3 w-36 text-right">Subtotal (Rp)</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 w-10 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spreadsheetRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 text-center font-mono">{idx + 1}</td>

                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) => handleUpdateRow(row.id, 'item', e.target.value)}
                        className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded px-2 py-1 text-slate-900 font-medium focus:outline-none"
                      />
                    </td>

                    <td className="py-1 px-2 w-44">
                      <CustomDropdown
                        value={row.kategori}
                        onChange={(val) => handleUpdateRow(row.id, 'kategori', val)}
                        options={[
                          { value: 'Penjualan', label: 'Penjualan' },
                          { value: 'Pengeluaran', label: 'Pengeluaran' },
                          { value: 'Bahan Baku', label: 'Bahan Baku' },
                          { value: 'Operasional', label: 'Operasional' },
                        ]}
                        buttonClassName="bg-white border-slate-200 text-slate-800"
                      />
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'qty', parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded px-2 py-1 text-slate-900 text-center focus:outline-none font-bold font-mono"
                      />
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => handleUpdateRow(row.id, 'unit', e.target.value)}
                        className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded px-2 py-1 text-slate-600 text-center focus:outline-none"
                      />
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="number"
                        value={row.hargaSatuan}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'hargaSatuan', parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded px-2 py-1 text-slate-900 text-right focus:outline-none font-semibold font-mono"
                      />
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatRupiah(row.subtotal)}
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.keterangan}
                        onChange={(e) => handleUpdateRow(row.id, 'keterangan', e.target.value)}
                        className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-slate-300 rounded px-2 py-1 text-slate-600 focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDeleteSpreadsheetRow(row.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Total {spreadsheetRows.length} baris lembar kerja
            </span>
            <div className="text-sm font-bold text-slate-900 font-mono">
              Total: <span>{formatRupiah(spreadsheetTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
