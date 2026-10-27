'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { Transaction, TransactionType } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
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
    setEditAmount(trx.amount.toString());
    setEditCategory(trx.category);
    setEditDesc(trx.description);
    setEditDate(trx.date);
  };

  // Save changes from Inspect Modal
  const handleSaveInspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx) return;
    const amountNum = Math.max(0, parseInt(editAmount) || 0);
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
    const amountNum = Math.max(0, parseInt(manualAmount) || 0);
    if (amountNum <= 0 || !manualDesc.trim()) return;

    addTransaction({
      date: new Date().toISOString().split('T')[0],
      type: manualType,
      amount: amountNum,
      category: manualCategory,
      description: manualDesc.trim(),
      inputMethod: 'manual',
    });

    setManualAmount('');
    setManualDesc('');
    setIsManualModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Page Header with Action Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-stone-300" />
            <span>Buku Kas & Transaksi Keuangan</span>
          </h1>
          <p className="text-xs text-[#8a8a92] mt-1">
            Pencatatan uang masuk dan keluar secara rapi dan otomatis tervalidasi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Catat Transaksi</span>
          </button>

          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202024] hover:bg-[#28282e] text-stone-200 border border-[#2c2c32] text-xs font-medium transition-all shadow-sm"
          >
            <ScanLine className="w-3.5 h-3.5 text-stone-300" />
            <span>Scan Foto Nota</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202024] hover:bg-[#28282e] text-stone-200 border border-[#2c2c32] text-xs font-medium transition-all shadow-sm"
          >
            <Mic className="w-3.5 h-3.5 text-stone-300" />
            <span>Bicara Kasir</span>
          </button>
        </div>
      </div>

      {/* 2. Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-5 space-y-1 transition-colors">
          <div className="text-xs text-[#8a8a92]">Total Pemasukan Bulan Ini</div>
          <div className="text-2xl font-bold text-white font-mono">{formatRupiah(monthIncome)}</div>
          <div className="text-[11px] text-[#8a8a92]">Arus masuk penjualan produk</div>
        </div>

        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-5 space-y-1 transition-colors">
          <div className="text-xs text-[#8a8a92]">Total Pengeluaran Bulan Ini</div>
          <div className="text-2xl font-bold text-white font-mono">{formatRupiah(monthExpense)}</div>
          <div className="text-[11px] text-rose-400">Belanja bahan baku & operasional</div>
        </div>

        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-5 space-y-1 transition-colors">
          <div className="text-xs text-[#8a8a92]">Saldo Kas Bersih Kumulatif</div>
          <div
            className={`text-2xl font-bold font-mono ${
              netMonthProfit >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatRupiah(netMonthProfit)}
          </div>
          <div className="text-[11px] text-[#8a8a92]">Surplus laba bersih</div>
        </div>
      </div>

      {/* 3. Modern Data Ledger Table */}
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl overflow-hidden shadow-xl">
        {/* Top Controls: Search Bar & Capsule Filter Chips */}
        <div className="p-4 border-b border-[#28282e] space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi, nominal, kategori..."
                className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none transition-colors"
              />
            </div>

            {/* Type Toggle: Semua, Masuk, Keluar */}
            <div className="flex items-center gap-1 bg-[#171719] p-1 rounded-full border border-[#2c2c32] self-start sm:self-auto">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-white text-black font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  typeFilter === 'income'
                    ? 'bg-white text-black font-semibold'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                + Masuk
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  typeFilter === 'expense'
                    ? 'bg-white text-black font-semibold'
                    : 'text-stone-400 hover:text-rose-400'
                }`}
              >
                - Keluar
              </button>
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-[#8a8a92] font-medium shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-stone-400" />
              <span>Kategori:</span>
            </span>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#2a2a30] text-white font-semibold border border-white/20'
                    : 'bg-[#202024] text-stone-400 border border-[#2c2c32] hover:text-white'
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
              <tr className="bg-[#171719] border-b border-[#28282e] text-[#8a8a92] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={toggleSelectAll}
                    className="text-stone-400 hover:text-white transition-colors"
                  >
                    {selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-white" />
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
            <tbody className="divide-y divide-[#242428]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#71717a]">
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
                      className={`hover:bg-white/[0.04] cursor-pointer transition-colors ${
                        isSelected ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => toggleSelectOne(trx.id, e)}>
                        <button
                          type="button"
                          className="text-stone-400 hover:text-white transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-white" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Tanggal & Jam */}
                      <td className="py-3.5 px-4 text-stone-300 whitespace-nowrap">
                        <div className="font-medium text-white">{formatDateIndo(trx.date)}</div>
                        <div className="text-[10px] text-[#71717a] font-mono">{trx.createdAt}</div>
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span>{trx.description}</span>
                          <Edit2 className="w-3 h-3 text-[#71717a] opacity-0 group-hover:opacity-100" />
                        </div>
                      </td>

                      {/* Kategori Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#171719] text-stone-300 border border-[#2c2c32] text-[11px] font-medium">
                          {trx.category}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold font-mono">
                        <span
                          className={
                            trx.type === 'income' ? 'text-white' : 'text-rose-400'
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
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : trx.inputMethod === 'photo'
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'bg-[#171719] text-stone-400 border-[#2c2c32]'
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
                          className="p-1 rounded text-stone-500 hover:text-rose-400 transition-colors"
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
        <div className="p-4 bg-[#171719] border-t border-[#28282e] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a8a92]">
          <div>
            Menampilkan <span className="text-white font-semibold">{filteredTransactions.length}</span> transaksi
          </div>

          <div className="flex items-center gap-5 font-mono">
            <div>
              Total Masuk:{' '}
              <span className="text-white font-bold">
                {formatRupiah(
                  filteredTransactions
                    .filter((t) => t.type === 'income')
                    .reduce((s, t) => s + t.amount, 0)
                )}
              </span>
            </div>
            <div>
              Total Keluar:{' '}
              <span className="text-rose-400 font-bold">
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
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1c1c1f] border border-[#34343b] rounded-full px-5 py-2.5 shadow-2xl shadow-black flex items-center gap-4 animate-in slide-in-from-bottom-3 duration-150">
          <div className="text-xs text-stone-200 font-medium">
            <span className="text-white font-bold font-mono">{selectedIds.length}</span> transaksi dipilih
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-stone-400 hover:text-white transition-colors"
          >
            Batal
          </button>

          <div className="w-[1px] h-4 bg-white/20" />

          {/* Export Selected to Excel */}
          <button
            onClick={() => {
              const selectedTrx = transactions.filter((t) => selectedIds.includes(t.id));
              exportToExcel(profile, selectedTrx, products);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242428] hover:bg-[#2c2c32] text-xs font-semibold text-white transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-stone-300" />
            <span>Export Excel</span>
          </button>

          {/* Delete Selected */}
          <button
            onClick={() => setIsMultiDeleteOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      )}

      {/* Inspect / Edit Transaction Modal */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-[#171719] border-b border-[#28282e] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-stone-300" />
                <span>Inspeksi & Edit Transaksi</span>
              </h2>
              <button
                onClick={() => setEditingTrx(null)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInspect} className="p-6 space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#171719] rounded-xl border border-[#2c2c32]">
                <button
                  type="button"
                  onClick={() => setEditType('income')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    editType === 'income'
                      ? 'bg-white text-black shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  + Uang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setEditType('expense')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    editType === 'expense'
                      ? 'bg-white text-black shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  - Uang Keluar
                </button>
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92] font-medium">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#71717a] font-mono">Rp</span>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Category with Custom Dropdown */}
              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92] font-medium">Kategori Transaksi</label>
                <CustomDropdown
                  options={categoryOptions}
                  value={editCategory}
                  onChange={(val) => setEditCategory(val)}
                  className="w-full"
                  buttonClassName="w-full bg-[#171719] py-2.5"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92] font-medium">Deskripsi Transaksi</label>
                <input
                  type="text"
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92] font-medium">Tanggal Transaksi</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTrx(null)}
                    className="px-4 py-2 rounded-full text-xs text-stone-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-[#171719] border-b border-[#28282e] flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-stone-300" />
                <span>Catat Transaksi Kas Manual</span>
              </h2>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-6 space-y-4">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#171719] rounded-xl border border-[#2c2c32]">
                <button
                  type="button"
                  onClick={() => setManualType('income')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    manualType === 'income'
                      ? 'bg-white text-black shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  + Uang Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('expense')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    manualType === 'expense'
                      ? 'bg-white text-black shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  - Uang Keluar
                </button>
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92] font-medium">Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#71717a] font-mono">Rp</span>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 50000"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Category with Custom Dropdown */}
              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92] font-medium">Kategori Transaksi</label>
                <CustomDropdown
                  options={categoryOptions}
                  value={manualCategory}
                  onChange={(val) => setManualCategory(val)}
                  className="w-full"
                  buttonClassName="w-full bg-[#171719] py-2.5"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92] font-medium">Deskripsi Kejadian</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penjualan 5 porsi kopi atau Beli gas elpiji"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-stone-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md"
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
