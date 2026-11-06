'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { Transaction, TransactionType } from '@/types';
import { formatRupiah, formatDateIndo, parseThousands, formatThousands } from '@/lib/utils';
import { exportToExcel } from '@/lib/export/exportEngine';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Mic,
  ScanLine,
  Search,
  Filter,
  Trash2,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
  Edit2,
  Save,
} from 'lucide-react';

interface CashViewProps {
  onOpenVoice: () => void;
  onOpenScan: () => void;
}

export const CashView: React.FC<CashViewProps> = ({ onOpenVoice, onOpenScan }) => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    profile,
    products,
    monthIncome,
    monthExpense,
  } = useKasra();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Multi-selection state for Floating Action Dock
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Manual Transaction Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualType, setManualType] = useState<TransactionType>('income');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState('Penjualan');
  const [manualDesc, setManualDesc] = useState('');
  const [manualLinkProduct, setManualLinkProduct] = useState(false);
  const [manualProductId, setManualProductId] = useState('');
  const [manualProductQty, setManualProductQty] = useState('1');

  // Inspect / Edit Transaction Modal State
  const [editingTrx, setEditingTrx] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState<TransactionType>('income');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Penjualan');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');

  // Custom Delete Confirm Modal State (Single & Multi)
  const [deleteTargetTrx, setDeleteTargetTrx] = useState<Transaction | null>(null);
  const [isMultiDeleteOpen, setIsMultiDeleteOpen] = useState(false);

  // Distinct categories from existing transactions
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return ['Semua', ...Array.from(set)];
  }, [transactions]);

  const categoryOptions = useMemo(() => {
    const list = [
      'Penjualan',
      'Bahan Baku',
      'Operasional',
      'Kemasan & Cup',
      'Gaji Karyawan',
      'Listrik & Air',
      'Lainnya',
    ];
    return list.map((c) => ({ value: c, label: c }));
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      // Category filter
      if (selectedCategory !== 'Semua' && t.category !== selectedCategory) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        return matchDesc || matchCat || matchAmount;
      }
      return true;
    });
  }, [transactions, typeFilter, selectedCategory, searchQuery]);

  // Net Profit for this month
  const netMonthProfit = monthIncome - monthExpense;

  // Handle Multi-Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((t) => t.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Inspect Modal for a specific row
  const handleOpenInspect = (trx: Transaction) => {
    setEditingTrx(trx);
    setEditType(trx.type);
    setEditAmount(formatThousands(trx.amount));
    setEditCategory(trx.category);
    setEditDesc(trx.description);
    setEditDate(trx.date);
  };

  // Save changes from Inspect Modal
  const handleSaveInspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx) return;
    const amountNum = Math.max(0, parseThousands(editAmount) || 0);
    if (amountNum <= 0) return;

    updateTransaction(editingTrx.id, {
      type: editType,
      amount: amountNum,
      category: editCategory,
      description: editDesc.trim() || 'Transaksi Toko',
      date: editDate || editingTrx.date,
    });

    setEditingTrx(null);
  };

  // Handle Save Manual Transaction
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Math.max(0, parseThousands(manualAmount) || 0);
    if (amountNum <= 0 || !manualDesc.trim()) return;

    const qtyNum = manualLinkProduct && manualProductId ? Math.max(1, parseInt(manualProductQty) || 1) : undefined;

    addTransaction({
      date: new Date().toISOString().split('T')[0],
      type: manualType,
      amount: amountNum,
      category: manualCategory,
      description: manualDesc.trim(),
      inputMethod: 'manual',
      relatedProductId: manualLinkProduct && manualProductId ? manualProductId : undefined,
      relatedQuantity: qtyNum,
    });

    setManualAmount('');
    setManualDesc('');
    setManualLinkProduct(false);
    setManualProductId('');
    setManualProductQty('1');
    setIsManualModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Page Header with Action Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-slate-700" />
            <span>Buku Kas & Transaksi Keuangan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan uang masuk dan keluar secara rapi dan otomatis tervalidasi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Catat Transaksi</span>
          </button>

          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
          >
            <ScanLine className="w-3.5 h-3.5 text-slate-500" />
            <span>Scan Foto Nota</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
          >
            <Mic className="w-3.5 h-3.5 text-slate-500" />
            <span>Bicara Kasir</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-1 transition-colors shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Pemasukan Bulan Ini</div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{formatRupiah(monthIncome)}</div>
          <div className="text-[11px] text-slate-500">Arus masuk penjualan produk</div>
        </div>

        <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-1 transition-colors shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Pengeluaran Bulan Ini</div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{formatRupiah(monthExpense)}</div>
          <div className="text-[11px] text-rose-600 font-medium">Belanja bahan baku & operasional</div>
        </div>

        <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 space-y-1 transition-colors shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Saldo Kas Bersih Kumulatif</div>
          <div
            className={`text-2xl font-bold font-mono ${
              netMonthProfit >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {formatRupiah(netMonthProfit)}
          </div>
          <div className="text-[11px] text-slate-500">Surplus laba bersih</div>
        </div>
      </div>

      {/* 3. Modern Data Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {/* Top Controls: Search Bar & Capsule Filter Chips */}
        <div className="p-4 border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi, nominal, kategori..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Type Toggle: Semua, Masuk, Keluar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/70 self-start sm:self-auto">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  typeFilter === 'income'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Masuk
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  typeFilter === 'expense'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                - Keluar
              </button>
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span>Kategori:</span>
            </span>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 border border-slate-200/70 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* The Table (Click Row to Inspect) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-slate-900" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Deskripsi Kejadian (Klik untuk Edit)</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Metode Input</th>
                <th className="py-3 px-4 text-center w-12" onClick={(e) => e.stopPropagation()}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isSelected = selectedIds.includes(trx.id);
                  return (
                    <tr
                      key={trx.id}
                      onClick={() => handleOpenInspect(trx)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => toggleSelectOne(trx.id, e)}>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-slate-900" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Tanggal & Jam */}
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatDateIndo(trx.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{trx.createdAt}</div>
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span>{trx.description}</span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        </div>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                          {trx.category}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold font-mono">
                        <span
                          className={
                            trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }
                        >
                          {trx.type === 'income'
                            ? `+${formatRupiah(trx.amount)}`
                            : `-${formatRupiah(trx.amount)}`}
                        </span>
                      </td>

                      {/* Metode Input */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border ${
                            trx.inputMethod === 'mic'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : trx.inputMethod === 'photo'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {trx.inputMethod === 'mic'
                            ? 'Suara'
                            : trx.inputMethod === 'photo'
                            ? 'Nota'
                            : 'Manual'}
                        </span>
                      </td>

                      {/* Delete Action with Custom Confirmation Modal */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetTrx(trx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <span className="text-slate-900 font-semibold">{filteredTransactions.length}</span> transaksi
          </div>

          <div className="flex items-center gap-5 font-mono">
            <div>
              Total Masuk:{' '}
              <span className="text-emerald-600 font-bold">
                {formatRupiah(
                  filteredTransactions
                    .filter((t) => t.type === 'income')
                    .reduce((s, t) => s + t.amount, 0)
                )}
              </span>
            </div>
            <div>
              Total Keluar:{' '}
              <span className="text-rose-600 font-bold">
                {formatRupiah(
                  filteredTransactions
                    .filter((t) => t.type === 'expense')
                    .reduce((s, t) => s + t.amount, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Floating Action Dock */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-slate-200 rounded-full px-5 py-2.5 shadow-2xl shadow-slate-900/10 flex items-center gap-4 animate-in slide-in-from-bottom-3 duration-150">
          <div className="text-xs text-slate-700 font-medium">
            <span className="text-slate-900 font-bold font-mono">{selectedIds.length}</span> transaksi dipilih
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            Batal
          </button>

          <div className="w-[1px] h-4 bg-slate-200" />

          {/* Export Selected to Excel */}
          <button
            onClick={() => {
              const selectedTrx = transactions.filter((t) => selectedIds.includes(t.id));
              exportToExcel(profile, selectedTrx, products);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Excel</span>
          </button>

          {/* Delete Selected */}
          <button
            onClick={() => setIsMultiDeleteOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors shadow-sm shadow-rose-600/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      )}

      {/* Inspect / Edit Transaction Modal */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-slate-700" />
                <span>Inspeksi & Edit Transaksi</span>
              </h2>
              <button
                onClick={() => setEditingTrx(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInspect} className="p-6 space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setEditType('income')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    editType === 'income'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  + Uang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setEditType('expense')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    editType === 'expense'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  - Uang Keluar
                </button>
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(formatThousands(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold font-mono focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Category with Custom Dropdown */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Kategori Transaksi</label>
                <CustomDropdown
                  options={categoryOptions}
                  value={editCategory}
                  onChange={(val) => setEditCategory(val)}
                  className="w-full"
                  buttonClassName="w-full bg-slate-50 py-2.5 border-slate-200 text-slate-900"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Deskripsi Transaksi</label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingTrx;
                    setEditingTrx(null);
                    setDeleteTargetTrx(target);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTrx(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Input Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-slate-700" />
                <span>Catat Transaksi Kas Manual</span>
              </h2>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-6 space-y-4">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setManualType('income')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    manualType === 'income'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  + Uang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('expense')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    manualType === 'expense'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  - Uang Keluar
                </button>
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 50.000"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(formatThousands(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold font-mono focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Optional Link to Storage Inventory */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={manualLinkProduct}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setManualLinkProduct(checked);
                      if (checked && !manualProductId && products.length > 0) {
                        const first = products[0];
                        setManualProductId(first.id);
                        const price = manualType === 'income' ? first.sellingPrice : first.hppAmount;
                        setManualAmount(formatThousands(price));
                        setManualDesc(`${manualType === 'income' ? 'Penjualan' : 'Kulakan'} ${first.name} (1 ${first.unit})`);
                      }
                    }}
                    className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Hubungkan dengan Stok Gudang (Otomatis Tambah/Kurang)
                  </span>
                </label>

                {manualLinkProduct && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-medium">Pilih Barang Gudang</label>
                      <CustomDropdown
                        options={products.map((p) => ({
                          value: p.id,
                          label: `${p.name} (Sisa ${p.currentStock} ${p.unit})`,
                        }))}
                        value={manualProductId}
                        onChange={(val) => {
                          setManualProductId(val);
                          const p = products.find((prod) => prod.id === val);
                          if (p) {
                            const qty = parseInt(manualProductQty) || 1;
                            const price = manualType === 'income' ? p.sellingPrice : p.hppAmount;
                            setManualAmount(formatThousands(price * qty));
                            setManualDesc(`${manualType === 'income' ? 'Penjualan' : 'Kulakan'} ${p.name} (${qty} ${p.unit})`);
                            if (manualType === 'expense' && p.category) {
                              setManualCategory(p.category);
                            } else if (manualType === 'income') {
                              setManualCategory('Penjualan');
                            }
                          }
                        }}
                        className="w-full"
                        buttonClassName="w-full bg-white py-2 text-xs border-slate-200 text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-medium">Jumlah ({products.find(p => p.id === manualProductId)?.unit || 'unit'})</label>
                      <input
                        type="number"
                        min="1"
                        value={manualProductQty}
                        onChange={(e) => {
                          const q = e.target.value;
                          setManualProductQty(q);
                          const p = products.find((prod) => prod.id === manualProductId);
                          if (p) {
                            const qtyNum = parseInt(q) || 1;
                            const price = manualType === 'income' ? p.sellingPrice : p.hppAmount;
                            setManualAmount(formatThousands(price * qtyNum));
                            setManualDesc(`${manualType === 'income' ? 'Penjualan' : 'Kulakan'} ${p.name} (${qtyNum} ${p.unit})`);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Category with Custom Dropdown */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Kategori Transaksi</label>
                <CustomDropdown
                  options={categoryOptions}
                  value={manualCategory}
                  onChange={(val) => setManualCategory(val)}
                  className="w-full"
                  buttonClassName="w-full bg-slate-50 py-2.5 border-slate-200 text-slate-900"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">Deskripsi Kejadian</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penjualan 5 porsi kopi atau Beli gas elpiji"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetTrx}
        itemName={deleteTargetTrx?.description || 'Transaksi ini'}
        title="Hapus Transaksi Buku Kas"
        description={`Nominal: ${formatRupiah(deleteTargetTrx?.amount || 0)} (${deleteTargetTrx?.category}). Transaksi ini akan dihapus permanen.`}
        onConfirm={() => {
          if (deleteTargetTrx) {
            deleteTransaction(deleteTargetTrx.id);
            setDeleteTargetTrx(null);
          }
        }}
        onCancel={() => setDeleteTargetTrx(null)}
      />

      {/* Multi Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isMultiDeleteOpen}
        itemName={`${selectedIds.length} transaksi yang dipilih`}
        title="Hapus Masal Transaksi Buku Kas"
        description="Semua transaksi yang Anda centang akan dihapus secara bersamaan dari catatan kas toko."
        onConfirm={() => {
          deleteMultipleTransactions(selectedIds);
          setSelectedIds([]);
          setIsMultiDeleteOpen(false);
        }}
        onCancel={() => setIsMultiDeleteOpen(false)}
      />
    </div>
  );
};
