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
  const { profile, transactions, products, monthIncome, monthExpense, totalAssetValue } = useKasra();

  // Segmented Mode Switch (Foto 2 Style: Chart | Report | Table)
  const [viewSegment, setViewSegment] = useState<'chart' | 'report' | 'table'>('chart');

  // Chart Type Switcher (Bar | Area | Donut | Composed)
  const [chartType, setChartType] = useState<'bar' | 'area' | 'donut' | 'composed'>('bar');

  // Chart Timeframe Switcher (Harian | Mingguan | Bulanan | Tahunan)
  const [chartTimeframe, setChartTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');

  // Multi-Timeframe Chart Datasets
  const chartDatasets = useMemo(() => {
    return {
      day: [
        { period: 'Senin', masuk: 580000, keluar: 160000, laba: 420000, saldoKas: 420000, omset: 580000, marginPercent: 35 },
        { period: 'Selasa', masuk: 690000, keluar: 210000, laba: 480000, saldoKas: 900000, omset: 690000, marginPercent: 36 },
        { period: 'Rabu', masuk: 740000, keluar: 190000, laba: 550000, saldoKas: 1450000, omset: 740000, marginPercent: 37 },
        { period: 'Kamis', masuk: 630000, keluar: 290000, laba: 340000, saldoKas: 1790000, omset: 630000, marginPercent: 34 },
        { period: 'Jumat', masuk: 890000, keluar: 260000, laba: 630000, saldoKas: 2420000, omset: 890000, marginPercent: 38 },
        { period: 'Sabtu', masuk: 1350000, keluar: 420000, laba: 930000, saldoKas: 3350000, omset: 1350000, marginPercent: 41 },
        { period: 'Minggu', masuk: 1520000, keluar: 390000, laba: 1130000, saldoKas: 4480000, omset: 1520000, marginPercent: 42 },
      ],
      week: [
        { period: 'Minggu 1', masuk: 3200000, keluar: 850000, laba: 2350000, saldoKas: 2350000, omset: 3200000, marginPercent: 32 },
        { period: 'Minggu 2', masuk: 4100000, keluar: 1200000, laba: 2900000, saldoKas: 5250000, omset: 4100000, marginPercent: 36 },
        { period: 'Minggu 3', masuk: 3800000, keluar: 950000, laba: 2850000, saldoKas: 8100000, omset: 3800000, marginPercent: 34 },
        { period: 'Minggu 4', masuk: 5200000, keluar: 1400000, laba: 3800000, saldoKas: 11900000, omset: 5200000, marginPercent: 39 },
      ],
      month: [
        { period: 'Jan', masuk: 12500000, keluar: 4200000, laba: 8300000, saldoKas: 8300000, omset: 12500000, marginPercent: 34 },
        { period: 'Feb', masuk: 14200000, keluar: 4600000, laba: 9600000, saldoKas: 17900000, omset: 14200000, marginPercent: 35 },
        { period: 'Mar', masuk: 16800000, keluar: 5200000, laba: 11600000, saldoKas: 29500000, omset: 16800000, marginPercent: 37 },
        { period: 'Apr', masuk: 15400000, keluar: 4900000, laba: 10500000, saldoKas: 40000000, omset: 15400000, marginPercent: 36 },
        { period: 'Mei', masuk: 17900000, keluar: 5800000, laba: 12100000, saldoKas: 52100000, omset: 17900000, marginPercent: 38 },
        { period: 'Jun', masuk: 19500000, keluar: 6200000, laba: 13300000, saldoKas: 65400000, omset: 19500000, marginPercent: 39 },
        { period: 'Jul', masuk: 18200000, keluar: 5900000, laba: 12300000, saldoKas: 77700000, omset: 18200000, marginPercent: 38 },
        { period: 'Agu', masuk: 20100000, keluar: 6500000, laba: 13600000, saldoKas: 91300000, omset: 20100000, marginPercent: 40 },
        { period: 'Sep', masuk: 19800000, keluar: 6300000, laba: 13500000, saldoKas: 104800000, omset: 19800000, marginPercent: 39 },
        { period: 'Okt', masuk: 22400000, keluar: 7100000, laba: 15300000, saldoKas: 120100000, omset: 22400000, marginPercent: 41 },
        { period: 'Nov', masuk: 21500000, keluar: 6800000, laba: 14700000, saldoKas: 134800000, omset: 21500000, marginPercent: 40 },
        { period: 'Des', masuk: 25800000, keluar: 8200000, laba: 17600000, saldoKas: 152400000, omset: 25800000, marginPercent: 42 },
      ],
      year: [
        { period: '2023', masuk: 120000000, keluar: 45000000, laba: 75000000, saldoKas: 75000000, omset: 120000000, marginPercent: 33 },
        { period: '2024', masuk: 168000000, keluar: 58000000, laba: 110000000, saldoKas: 185000000, omset: 168000000, marginPercent: 36 },
        { period: '2025', masuk: 215000000, keluar: 72000000, laba: 143000000, saldoKas: 328000000, omset: 215000000, marginPercent: 38 },
        { period: '2026', masuk: 285000000, keluar: 92000000, laba: 193000000, saldoKas: 521000000, omset: 285000000, marginPercent: 41 },
      ],
    };
  }, []);

  const activeChartData = chartDatasets[chartTimeframe];

  // 3. Operational & Expense Category Allocation (Donut / Pie)
  const categoryDonutData = [
    { name: 'Bahan Baku & Dapur', value: 2450000, color: '#f2aa4b' },
    { name: 'Kemasan & Packaging', value: 780000, color: '#e0892b' },
    { name: 'Operasional & Utilitas', value: 650000, color: '#71717a' },
    { name: 'Peralatan & Aset Toko', value: 520000, color: '#484d5c' },
  ];

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

  // Fast-Moving & Deadstock analysis
  const fastMoving = products.slice(0, 3);
  const deadstockItems = products.filter((p) => p.currentStock > 15 && p.sellingPrice > 15000).slice(0, 3);
  const totalLockedCapital = deadstockItems.reduce((acc, p) => acc + p.currentStock * p.hppAmount, 0);

  // Custom Sleek Dark Tooltips to eliminate white boxes on inspect
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const masuk = payload.find((p: any) => p.dataKey === 'masuk')?.value || 0;
      const keluar = payload.find((p: any) => p.dataKey === 'keluar')?.value || 0;
      const laba = masuk - keluar;
      return (
        <div className="bg-[#171719] border border-[#2c2c32] rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[190px]">
          <p className="font-bold text-white border-b border-[#2c2c32] pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-[#8a8a92] font-normal uppercase">Periode</span>
          </p>
          <div className="flex justify-between items-center text-emerald-400">
            <span>Uang Masuk:</span>
            <span className="font-mono font-semibold">+{formatRupiah(masuk)}</span>
          </div>
          <div className="flex justify-between items-center text-rose-400">
            <span>Uang Keluar:</span>
            <span className="font-mono font-semibold">-{formatRupiah(keluar)}</span>
          </div>
          <div className="flex justify-between items-center text-[#f2aa4b] pt-1.5 border-t border-[#2c2c32]">
            <span className="font-medium">Surplus / Laba:</span>
            <span className="font-mono font-bold">{formatRupiah(laba)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const saldo = payload[0]?.value || 0;
      return (
        <div className="bg-[#171719] border border-[#2c2c32] rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
          <p className="font-bold text-white border-b border-[#2c2c32] pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-[#8a8a92] font-normal uppercase">Periode</span>
          </p>
          <div className="flex justify-between items-center text-[#f2aa4b] pt-1">
            <span className="text-stone-300">Akumulasi Saldo:</span>
            <span className="font-mono font-bold text-white">{formatRupiah(saldo)}</span>
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
        <div className="bg-[#171719] border border-[#2c2c32] rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[210px]">
          <div className="flex items-center gap-2 border-b border-[#2c2c32] pb-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.payload.color || '#f2aa4b' }} />
            <span className="font-bold text-white">{data.name}</span>
          </div>
          <div className="flex justify-between items-center text-stone-300">
            <span>Nominal Beban:</span>
            <span className="font-mono font-bold text-white">{formatRupiah(data.value)}</span>
          </div>
          <div className="flex justify-between items-center text-[#f2aa4b]">
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
        <div className="bg-[#171719] border border-[#2c2c32] rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[190px]">
          <p className="font-bold text-white border-b border-[#2c2c32] pb-1.5 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-[#8a8a92] font-normal uppercase">Periode</span>
          </p>
          <div className="flex justify-between items-center text-[#f2aa4b]">
            <span>Omset Penjualan:</span>
            <span className="font-mono font-bold">{formatRupiah(omset)}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
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
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Analisis & Studio Laporan Resmi
          </h1>
          <p className="text-xs text-[#8a8a92] mt-1">
            Visualisasi keuangan, identifikasi perputaran barang, dan lembar kerja perbankan
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportToExcel(profile, transactions, products)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202024] hover:bg-[#28282e] text-stone-200 border border-[#2c2c32] text-xs font-semibold transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-stone-300" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportToOfficialPdf(profile, transactions, products)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Cetak PDF Resmi Bank (KUR)</span>
          </button>
        </div>
      </div>

      {/* 2. Segmented Switch Bar (Haulix / Apple Pill Switcher) */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex items-center p-1 bg-[#171719] border border-[#2c2c32] rounded-full shadow-inner">
          <button
            onClick={() => setViewSegment('chart')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              viewSegment === 'chart'
                ? 'bg-white text-black shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Grafik & Analitik</span>
          </button>

          <button
            onClick={() => setViewSegment('report')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              viewSegment === 'report'
                ? 'bg-white text-black shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Laporan Evaluasi</span>
          </button>

          <button
            onClick={() => setViewSegment('table')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              viewSegment === 'table'
                ? 'bg-white text-black shadow-md'
                : 'text-stone-400 hover:text-white'
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#171719] border border-[#2c2c32] rounded-2xl p-3 shadow-sm">
            {/* Diagram Model Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2 px-1">
                <BarChart2 className="w-4 h-4 text-[#f2aa4b]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Model Diagram:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    chartType === 'bar'
                      ? 'bg-white text-black shadow-md font-bold'
                      : 'bg-[#1c1c1f] text-stone-400 hover:text-white border border-[#2c2c32]'
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
                      ? 'bg-white text-black shadow-md font-bold'
                      : 'bg-[#1c1c1f] text-stone-400 hover:text-white border border-[#2c2c32]'
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
                      ? 'bg-white text-black shadow-md font-bold'
                      : 'bg-[#1c1c1f] text-stone-400 hover:text-white border border-[#2c2c32]'
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
                      ? 'bg-white text-black shadow-md font-bold'
                      : 'bg-[#1c1c1f] text-stone-400 hover:text-white border border-[#2c2c32]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Terpadu (Margin)</span>
                </button>
              </div>
            </div>

            {/* Timeframe Selector (Hari | Minggu | Bulan | Tahun) */}
            <div className="flex items-center gap-1 bg-[#121214] border border-[#2c2c32] p-1 rounded-xl self-start lg:self-auto">
              <span className="text-[11px] font-semibold text-[#8a8a92] px-2">Rentang:</span>
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
                        ? 'bg-[#f2aa4b] text-black shadow-sm font-bold'
                        : 'text-stone-400 hover:text-white hover:bg-[#202024]'
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
            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Arus Kas {chartTimeframe === 'day' ? 'Harian' : chartTimeframe === 'week' ? 'Mingguan' : chartTimeframe === 'month' ? 'Bulanan' : 'Tahunan'} (Uang Masuk vs Uang Keluar)
                  </h3>
                  <p className="text-xs text-[#8a8a92]">
                    Komparasi kas masuk vs pengeluaran kulakan & operasional ({chartTimeframe === 'day' ? 'Senin - Minggu' : chartTimeframe === 'week' ? '4 Minggu Terakhir' : chartTimeframe === 'month' ? '12 Bulan' : 'Tren Multi-Tahun'})
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f2aa4b]" />
                    <span className="text-stone-300">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#484d5c]" />
                    <span className="text-stone-300">Pengeluaran</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeChartData} barGap={8}>
                    <XAxis dataKey="period" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={10}
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000} Jt` : `${v / 1000} Rb`)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                      content={<CustomBarTooltip />}
                    />
                    <Bar dataKey="masuk" fill="#f2aa4b" radius={[6, 6, 0, 0]} barSize={28} />
                    <Bar dataKey="keluar" fill="#484d5c" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* DIAGRAM 2: Tren Area (Area Chart - Pertumbuhan Akumulasi Saldo Kas) */}
          {chartType === 'area' && (
            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Tren Akumulasi Saldo Kas Bersih ({chartTimeframe === 'day' ? 'Harian' : chartTimeframe === 'week' ? 'Mingguan' : chartTimeframe === 'month' ? 'Bulanan' : 'Tahunan'})
                  </h3>
                  <p className="text-xs text-[#8a8a92]">
                    Pertumbuhan likuiditas kas toko berjalan ({chartTimeframe === 'day' ? 'Per Hari' : chartTimeframe === 'week' ? 'Per Minggu' : chartTimeframe === 'month' ? 'Per Bulan' : 'Per Tahun'})
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f2aa4b]" />
                    <span className="text-stone-300">Akumulasi Saldo</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeChartData}>
                    <defs>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f2aa4b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f2aa4b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#71717a"
                      fontSize={10}
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000} Jt` : `${v / 1000} Rb`)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: '#f2aa4b', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      content={<CustomAreaTooltip />}
                    />
                    <Area
                      type="monotone"
                      dataKey="saldoKas"
                      stroke="#f2aa4b"
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
            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Komposisi Beban Usaha & Kulakan</h3>
                  <p className="text-xs text-[#8a8a92]">Proporsi modal belanja per kategori utama untuk efisiensi toko</p>
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
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#1c1c1f" strokeWidth={2} />
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
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#171719] border border-[#2c2c32]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs font-semibold text-white">{cat.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-white font-mono">{formatRupiah(cat.value)}</span>
                          <span className="text-[10px] text-[#8a8a92] ml-2">({pct}%)</span>
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
            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Omset Penjualan vs Rasio Margin Laba (%) ({chartTimeframe === 'day' ? 'Harian' : chartTimeframe === 'week' ? 'Mingguan' : chartTimeframe === 'month' ? 'Bulanan' : 'Tahunan'})
                  </h3>
                  <p className="text-xs text-[#8a8a92]">Diagram gabungan volume penjualan dengan rasio margin laba UMKM</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f2aa4b]" />
                    <span className="text-stone-300">Omset (Rp)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-stone-300">Margin Laba (%)</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={activeChartData}>
                    <XAxis dataKey="period" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      stroke="#71717a"
                      fontSize={10}
                      tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000} Jt` : `${v / 1000} Rb`)}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#10b981"
                      fontSize={10}
                      tickFormatter={(v) => `${v}%`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                      content={<CustomComposedTooltip />}
                    />
                    <Bar yAxisId="left" dataKey="omset" fill="#f2aa4b" radius={[6, 6, 0, 0]} barSize={26} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="marginPercent"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Fast-Moving vs Slow-Moving Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Barang Terlaris (Fast-Moving) */}
            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-stone-300" />
                  <h3 className="text-sm font-bold text-white">Barang Terlaris (Fast-Moving)</h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#242428] text-stone-300 border border-[#303036] font-semibold font-mono">
                  Penyumbang Laba Utama
                </span>
              </div>

              <div className="divide-y divide-[#28282e] pt-1">
                {fastMoving.map((p, idx) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-xs font-bold text-white font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-white">{p.name}</div>
                        <div className="text-[11px] text-[#8a8a92]">{p.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white font-mono">
                        {formatRupiah(p.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-[#71717a]">Margin: ~35%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barang Mengendap (Deadstock) */}
            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-[#f2aa4b]" />
                  <h3 className="text-sm font-bold text-white">Barang Mengendap (Slow-Moving)</h3>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#282015] text-[#f2aa4b] border border-[#44331e] font-semibold font-mono">
                  Tertahan: {formatRupiah(totalLockedCapital)}
                </span>
              </div>

              <div className="divide-y divide-[#28282e] pt-1">
                {deadstockItems.map((p) => {
                  const lockedAmount = p.currentStock * p.hppAmount;
                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-white">{p.name}</div>
                        <div className="text-[11px] text-[#8a8a92]">
                          Sisa: {p.currentStock} {p.unit} di gudang
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-white font-mono">
                          {formatRupiah(lockedAmount)}
                        </div>
                        <div className="text-[10px] text-[#71717a]">Modal tertahan</div>
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
        <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#28282e]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8a8a92] tracking-wider">
                Dokumen Resmi Laba Rugi UMKM
              </span>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full bg-transparent font-bold text-lg text-white border-b border-dashed border-white/20 focus:border-white/40 focus:outline-none mt-1"
              />
            </div>
            <button
              onClick={() => exportToOfficialPdf(profile, transactions, products)}
              className="px-4 py-2 rounded-full bg-white hover:bg-stone-200 text-black font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
          </div>

          {/* Letterhead Preview */}
          <div className="p-4 rounded-xl bg-[#171719] border border-[#2c2c32] text-xs text-[#8a8a92] space-y-1">
            <div className="font-bold text-white text-sm">{profile.storeName.toUpperCase()}</div>
            <div>{profile.address} | Telp: {profile.phone}</div>
            <div>Penanggung Jawab: {profile.ownerName} | Rekening: {profile.bankAccount}</div>
          </div>

          {/* Narrative Textarea (Fully Editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-300">
                Narasi Ringkasan Analisis (Bebas Diedit):
              </label>
              <span className="text-[10px] text-[#71717a]">Dapat diedit langsung sebelum dicetak</span>
            </div>

            <textarea
              rows={5}
              value={reportNarrative}
              onChange={(e) => setReportNarrative(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl p-4 text-xs text-stone-200 leading-relaxed focus:outline-none"
            />
          </div>

          {/* Financial Summary Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#171719] border border-[#2c2c32]">
              <div className="text-[11px] text-[#8a8a92]">Total Pemasukan</div>
              <div className="text-lg font-bold text-white font-mono">{formatRupiah(monthIncome)}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#171719] border border-[#2c2c32]">
              <div className="text-[11px] text-[#8a8a92]">Total Pengeluaran</div>
              <div className="text-lg font-bold text-rose-400 font-mono">{formatRupiah(monthExpense)}</div>
            </div>
            <div className="p-4 rounded-xl bg-[#171719] border border-[#2c2c32]">
              <div className="text-[11px] text-[#8a8a92]">Total Nilai Aset Stok</div>
              <div className="text-lg font-bold text-white font-mono">{formatRupiah(totalAssetValue)}</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SEGMENT 3: IN-APP SPREADSHEET (Editable Cells & Add/Delete Rows) */}
      {viewSegment === 'table' && (
        <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl overflow-hidden shadow-xl space-y-0">
          <div className="p-4 border-b border-[#28282e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#171719]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-stone-300" />
                <span>Lembar Kerja Spreadsheet Interaktif</span>
              </h3>
              <p className="text-xs text-[#8a8a92]">
                Klik sel mana pun untuk mengubah angka atau teks secara langsung sebelum ekspor Excel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAddSpreadsheetRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#202024] hover:bg-[#28282e] text-white border border-[#2c2c32] text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>

              <button
                onClick={() => exportToExcel(profile, transactions, products)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#171719] border-b border-[#28282e] text-[#8a8a92] font-semibold uppercase text-[11px]">
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
              <tbody className="divide-y divide-[#242428]">
                {spreadsheetRows.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-[#222226]">
                    <td className="py-2 px-3 text-[#71717a] text-center font-mono">{idx + 1}</td>

                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.item}
                        onChange={(e) => handleUpdateRow(row.id, 'item', e.target.value)}
                        className="w-full bg-transparent hover:bg-[#171719] focus:bg-[#171719] border border-transparent focus:border-white/30 rounded px-2 py-1 text-white font-medium focus:outline-none"
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
                      />
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'qty', parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-transparent hover:bg-[#171719] focus:bg-[#171719] border border-transparent focus:border-white/30 rounded px-2 py-1 text-white text-center focus:outline-none font-bold font-mono"
                      />
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.unit}
                        onChange={(e) => handleUpdateRow(row.id, 'unit', e.target.value)}
                        className="w-full bg-transparent hover:bg-[#171719] focus:bg-[#171719] border border-transparent focus:border-white/30 rounded px-2 py-1 text-stone-400 text-center focus:outline-none"
                      />
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="number"
                        value={row.hargaSatuan}
                        onChange={(e) =>
                          handleUpdateRow(row.id, 'hargaSatuan', parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-transparent hover:bg-[#171719] focus:bg-[#171719] border border-transparent focus:border-white/30 rounded px-2 py-1 text-white text-right focus:outline-none font-semibold font-mono"
                      />
                    </td>

                    <td className="py-2 px-3 text-right font-bold text-white font-mono">
                      {formatRupiah(row.subtotal)}
                    </td>

                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={row.keterangan}
                        onChange={(e) => handleUpdateRow(row.id, 'keterangan', e.target.value)}
                        className="w-full bg-transparent hover:bg-[#171719] focus:bg-[#171719] border border-transparent focus:border-white/30 rounded px-2 py-1 text-stone-300 focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDeleteSpreadsheetRow(row.id)}
                        className="p-1 rounded text-stone-500 hover:text-rose-400"
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

          <div className="p-4 bg-[#171719] border-t border-[#28282e] flex items-center justify-between text-xs">
            <span className="text-[#8a8a92]">
              Total {spreadsheetRows.length} baris lembar kerja
            </span>
            <div className="text-sm font-bold text-white font-mono">
              Total: <span>{formatRupiah(spreadsheetTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
