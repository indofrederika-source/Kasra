'use client';

import React, { useState, useRef } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { TransactionType } from '@/types';
import { formatRupiah, formatThousands } from '@/lib/utils';
import {
  X,
  Camera,
  Delete,
  FileEdit,
  Mic,
  Package,
  Calendar,
} from 'lucide-react';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  onOpenScan?: () => void;
  onOpenVoice?: () => void;
}

interface CategoryTile {
  id: string;
  label: string;
  categoryName: string;
  emoji: string;
  tint: string;
}

const CATEGORY_TILES: CategoryTile[] = [
  { id: 'food', label: 'Makanan', categoryName: 'Penjualan', emoji: '🍜', tint: 'from-amber-100 to-orange-50' },
  { id: 'beverage', label: 'Minuman', categoryName: 'Penjualan', emoji: '🧋', tint: 'from-rose-100 to-amber-50' },
  { id: 'grocery', label: 'Bahan Baku', categoryName: 'Bahan Baku', emoji: '🛒', tint: 'from-emerald-100 to-teal-50' },
  { id: 'packaging', label: 'Kemasan', categoryName: 'Kemasan & Cup', emoji: '🛍️', tint: 'from-sky-100 to-indigo-50' },
  { id: 'transport', label: 'Logistik', categoryName: 'Operasional', emoji: '✈️', tint: 'from-blue-100 to-slate-50' },
  { id: 'internet', label: 'Internet', categoryName: 'Listrik & Air', emoji: '🛜', tint: 'from-indigo-100 to-purple-50' },
  { id: 'electric', label: 'Listrik', categoryName: 'Listrik & Air', emoji: '💡', tint: 'from-yellow-100 to-amber-50' },
  { id: 'water', label: 'Air PDAM', categoryName: 'Listrik & Air', emoji: '💧', tint: 'from-cyan-100 to-sky-50' },
  { id: 'gas', label: 'Gas Elpiji', categoryName: 'Bahan Baku', emoji: '🔥', tint: 'from-orange-100 to-red-50' },
  { id: 'salary', label: 'Gaji Tim', categoryName: 'Gaji Karyawan', emoji: '🏋️', tint: 'from-violet-100 to-fuchsia-50' },
  { id: 'books', label: 'Kasir / POS', categoryName: 'Penjualan', emoji: '📚', tint: 'from-emerald-100 to-lime-50' },
  { id: 'veggie', label: 'Sayur Segar', categoryName: 'Bahan Baku', emoji: '🥦', tint: 'from-green-100 to-emerald-50' },
  { id: 'fruit', label: 'Buah & Susu', categoryName: 'Bahan Baku', emoji: '🍎', tint: 'from-rose-100 to-pink-50' },
  { id: 'coffee', label: 'Kopi & Teh', categoryName: 'Penjualan', emoji: '☕', tint: 'from-stone-200 to-amber-50' },
  { id: 'gift', label: 'Lainnya', categoryName: 'Operasional', emoji: '🎁', tint: 'from-purple-100 to-indigo-50' },
];

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  onOpenScan,
  onOpenVoice,
}) => {
  const { addTransaction, products, theme } = useKasra();
  const isDark = theme === 'dark';

  const [trxType, setTrxType] = useState<TransactionType>(initialType);
  const [selectedTileId, setSelectedTileId] = useState<string>(
    initialType === 'income' ? 'food' : 'grocery'
  );

  // Calculator expression & numeric value
  const [expression, setExpression] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [dateStr, setDateStr] = useState<string>(() => getLocalTodayIso());

  // Optional warehouse product link
  const [linkProduct, setLinkProduct] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productQty, setProductQty] = useState<string>('1');

  const noteInputRef = useRef<HTMLInputElement>(null);

  // Sync initialType when opened
  React.useEffect(() => {
    if (isOpen) {
      setTrxType(initialType);
      setSelectedTileId(initialType === 'income' ? 'food' : 'grocery');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const activeTile = CATEGORY_TILES.find((t) => t.id === selectedTileId) || CATEGORY_TILES[0];

  // Safely evaluate basic math expression (+, -, *, /)
  const evaluateExpression = (expr: string): number => {
    if (!expr.trim()) return 0;
    try {
      const sanitized = expr.replace(/×/g, '*').replace(/:/g, '/').replace(/[^0-9+\-*/.]/g, '');
      if (!sanitized) return 0;
      const trimmedEnd = sanitized.replace(/[+\-*/.]+$/, '');
      if (!trimmedEnd) return 0;
      const result = Function(`"use strict"; return (${trimmedEnd})`)();
      return typeof result === 'number' && isFinite(result) ? Math.max(0, Math.round(result)) : 0;
    } catch {
      return 0;
    }
  };

  const currentAmount = evaluateExpression(expression);

  const handleKeyPress = (key: string) => {
    if (key === 'BACKSPACE') {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '=') {
      const val = evaluateExpression(expression);
      setExpression(val > 0 ? String(val) : '');
      return;
    }
    if (['+', '-', '×', ':'].includes(key)) {
      setExpression((prev) => {
        if (!prev) return '';
        if (/[+\-×:]$/.test(prev)) {
          return prev.slice(0, -1) + key;
        }
        return prev + key;
      });
      return;
    }
    setExpression((prev) => {
      if (prev === '0' && key !== '.') return key;
      if (prev.length >= 15) return prev;
      return prev + key;
    });
  };

  const handleSave = () => {
    const finalAmount = evaluateExpression(expression);
    if (finalAmount <= 0) return;

    const finalDesc =
      note.trim() ||
      `${trxType === 'income' ? 'Penjualan' : 'Pengeluaran'} ${activeTile.label}`;

    const qtyNum =
      linkProduct && selectedProductId ? Math.max(1, parseInt(productQty) || 1) : undefined;

    addTransaction({
      type: trxType,
      amount: finalAmount,
      category: activeTile.categoryName,
      description: finalDesc,
      date: dateStr || getLocalTodayIso(),
      inputMethod: 'manual',
      relatedProductId: linkProduct && selectedProductId ? selectedProductId : undefined,
      relatedQuantity: qtyNum,
    });

    setExpression('');
    setNote('');
    setShowNoteInput(false);
    setLinkProduct(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-[420px] rounded-[36px] overflow-hidden shadow-2xl border transition-colors flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-[#22396F] border-[#345294] text-[#FCF1D0]'
            : 'bg-[#F8F9FC] border-white text-slate-900'
        }`}
      >
        <div className="flex flex-col overflow-y-auto p-5 space-y-4">
          {/* 1. Top Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#172A57] text-[#FCF1D0] hover:bg-[#0D1C42]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold tracking-tight">Add transaction</h2>

            <button
              type="button"
              onClick={() => {
                if (onOpenVoice) {
                  onClose();
                  onOpenVoice();
                }
              }}
              title="Input via Suara AI"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#172A57] text-[#FCF1D0] hover:bg-[#0D1C42]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Segmented Type Switcher (Spent | Income | +Stok) */}
          <div
            className={`grid grid-cols-3 p-1 rounded-full border text-xs font-semibold ${
              isDark
                ? 'bg-[#172A57] border-[#345294]'
                : 'bg-slate-100 border-slate-200/60'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setTrxType('expense');
                if (selectedTileId === 'food') setSelectedTileId('grocery');
              }}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                trxType === 'expense'
                  ? isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42] font-bold shadow-sm'
                    : 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Spent (Keluar)
            </button>
            <button
              type="button"
              onClick={() => {
                setTrxType('income');
                if (selectedTileId === 'grocery') setSelectedTileId('food');
              }}
              className={`py-2 rounded-full transition-all cursor-pointer ${
                trxType === 'income'
                  ? isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42] font-bold shadow-sm'
                    : 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Income (Masuk)
            </button>
            <button
              type="button"
              onClick={() => setLinkProduct((prev) => !prev)}
              className={`py-2 rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
                linkProduct
                  ? isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42] font-bold shadow-sm'
                    : 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>+Stok</span>
            </button>
          </div>

          {/* Optional Warehouse Product Selector when +Stok is toggled */}
          {linkProduct && (
            <div
              className={`p-3 rounded-2xl border space-y-2 text-xs ${
                isDark
                  ? 'bg-[#172A57] border-[#345294]'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              {products.length === 0 ? (
                <p className="text-[11px] text-amber-400">
                  Gudang masih kosong. Tambahkan produk di menu Gudang terlebih dahulu.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] opacity-75 block mb-1">
                      Pilih Produk Gudang
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setSelectedProductId(pid);
                        const p = products.find((prod) => prod.id === pid);
                        if (p) {
                          const q = parseInt(productQty) || 1;
                          const unitPrice = trxType === 'income' ? p.sellingPrice : p.hppAmount;
                          setExpression(String(unitPrice * q));
                          setNote(
                            `${trxType === 'income' ? 'Penjualan' : 'Kulakan'} ${p.name} (${q} ${p.unit})`
                          );
                        }
                      }}
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs border focus:outline-none ${
                        isDark
                          ? 'bg-[#0D1C42] border-[#345294] text-[#FCF1D0]'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="">-- Pilih Barang --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Sisa {p.currentStock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] opacity-75 block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={productQty}
                      onChange={(e) => {
                        const q = e.target.value;
                        setProductQty(q);
                        const p = products.find((prod) => prod.id === selectedProductId);
                        if (p) {
                          const qtyNum = parseInt(q) || 1;
                          const unitPrice = trxType === 'income' ? p.sellingPrice : p.hppAmount;
                          setExpression(String(unitPrice * qtyNum));
                          setNote(
                            `${trxType === 'income' ? 'Penjualan' : 'Kulakan'} ${p.name} (${qtyNum} ${p.unit})`
                          );
                        }
                      }}
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold border focus:outline-none ${
                        isDark
                          ? 'bg-[#0D1C42] border-[#345294] text-[#FCF1D0]'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Visual Category Icon Grid (5 Columns x 3 Rows) */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {CATEGORY_TILES.map((tile) => {
              const isSelected = selectedTileId === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setSelectedTileId(tile.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-[#0D1C42] border-[#FCF1D0] shadow-sm scale-[1.03]'
                        : 'bg-[#F3E8FF]/80 border-[#8B5CF6] shadow-xs scale-[1.03]'
                      : 'border-transparent hover:bg-slate-500/5'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${tile.tint} flex items-center justify-center text-xl shadow-2xs mb-1`}
                  >
                    {tile.emoji}
                  </div>
                  <span
                    className={`text-[10px] font-medium truncate w-full text-center ${
                      isSelected
                        ? isDark
                          ? 'text-[#FCF1D0] font-bold'
                          : 'text-[#6D28D9] font-bold'
                        : isDark
                        ? 'text-[#FCF1D0]/75'
                        : 'text-slate-600'
                    }`}
                  >
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 4. Date Selector Row */}
          <div
            className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border ${
              isDark
                ? 'bg-[#172A57] border-[#345294]'
                : 'bg-white border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className="text-xs font-medium opacity-75">Tanggal Transaksi</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-70 pointer-events-none" />
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="text-xs font-mono font-bold bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Amount Display + Camera Icon + Built-in Calculator Numpad */}
          <div
            className={`rounded-3xl p-3 space-y-2 border ${
              isDark
                ? 'bg-[#172A57] border-[#345294]'
                : 'bg-white border-slate-200/60 shadow-xs'
            }`}
          >
            <div
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl ${
                isDark ? 'bg-[#0D1C42]' : 'bg-[#F3F4F8]'
              }`}
            >
              <div className="flex items-baseline gap-2 min-w-0 flex-1">
                <span className="text-sm font-bold opacity-70 font-mono">Rp</span>
                <div className="text-2xl font-extrabold font-mono tracking-tight truncate">
                  {expression
                    ? /[+\-×:]/.test(expression)
                      ? expression
                      : formatThousands(currentAmount)
                    : '0'}
                </div>
              </div>

              {/[+\-×:]/.test(expression) && currentAmount > 0 && (
                <span className="text-xs font-mono opacity-75 mr-2">
                  = {formatThousands(currentAmount)}
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onOpenScan) {
                    onClose();
                    onOpenScan();
                  }
                }}
                title="Scan Struk / Nota"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark
                    ? 'hover:bg-[#22396F] text-[#FCF1D0]'
                    : 'hover:bg-white text-slate-600'
                }`}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Note / Description Row */}
            {showNoteInput && (
              <input
                ref={noteInputRef}
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`Catatan ${activeTile.label.toLowerCase()} (opsional)...`}
                className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${
                  isDark
                    ? 'bg-[#0D1C42] border-[#345294] text-[#FCF1D0]'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            )}

            {/* Built-in Calculator Numpad */}
            <div className="grid grid-cols-5 gap-1.5 pt-1 select-none">
              {/* Row 1 */}
              {['1', '2', '3'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleKeyPress(n)}
                  className={`h-11 rounded-2xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-[#0D1C42] hover:bg-[#22396F] text-[#FCF1D0]'
                      : 'bg-[#F8F9FC] hover:bg-slate-100 text-slate-900 border border-slate-200/60'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowNoteInput((prev) => !prev);
                  setTimeout(() => noteInputRef.current?.focus(), 60);
                }}
                title="Tambah Catatan Deskripsi"
                className={`col-span-2 h-11 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  showNoteInput || note
                    ? isDark
                      ? 'bg-[#FCF1D0] text-[#0D1C42]'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : isDark
                    ? 'bg-[#22396F] hover:bg-[#2B4684] text-[#FCF1D0]'
                    : 'bg-[#EEF0F6] hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>{note ? 'Catatan ✓' : 'Catatan'}</span>
              </button>

              {/* Row 2 */}
              {['4', '5', '6'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleKeyPress(n)}
                  className={`h-11 rounded-2xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-[#0D1C42] hover:bg-[#22396F] text-[#FCF1D0]'
                      : 'bg-[#F8F9FC] hover:bg-slate-100 text-slate-900 border border-slate-200/60'
                  }`}
                >
                  {n}
                </button>
              ))}
              {['+', '-'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => handleKeyPress(op)}
                  className={`h-11 rounded-2xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-[#22396F] hover:bg-[#2B4684] text-[#FCF1D0]'
                      : 'bg-[#EEF0F6] hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {op}
                </button>
              ))}

              {/* Row 3 */}
              {['7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleKeyPress(n)}
                  className={`h-11 rounded-2xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-[#0D1C42] hover:bg-[#22396F] text-[#FCF1D0]'
                      : 'bg-[#F8F9FC] hover:bg-slate-100 text-slate-900 border border-slate-200/60'
                  }`}
                >
                  {n}
                </button>
              ))}
              {['×', ':'].map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => handleKeyPress(op)}
                  className={`h-11 rounded-2xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-[#22396F] hover:bg-[#2B4684] text-[#FCF1D0]'
                      : 'bg-[#EEF0F6] hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {op}
                </button>
              ))}

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => handleKeyPress('000')}
                className={`h-11 rounded-2xl text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-[#0D1C42] hover:bg-[#22396F] text-[#FCF1D0]'
                    : 'bg-[#F8F9FC] hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                000
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className={`h-11 rounded-2xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-[#0D1C42] hover:bg-[#22396F] text-[#FCF1D0]'
                    : 'bg-[#F8F9FC] hover:bg-slate-100 text-slate-900 border border-slate-200/60'
                }`}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('BACKSPACE')}
                className={`h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-[#0D1C42] hover:bg-rose-500/20 text-[#FCF1D0]'
                    : 'bg-[#F8F9FC] hover:bg-rose-50 text-slate-700 border border-slate-200/60'
                }`}
              >
                <Delete className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('=')}
                className={`col-span-2 h-11 rounded-2xl text-sm font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                  isDark
                    ? 'bg-[#22396F] hover:bg-[#2B4684] text-[#FCF1D0]'
                    : 'bg-[#EEF0F6] hover:bg-slate-200 text-slate-900'
                }`}
              >
                =
              </button>
            </div>
          </div>

          {/* 6. Full-Width Pill "Save" Button */}
          <button
            type="button"
            disabled={currentAmount <= 0}
            onClick={handleSave}
            className={`w-full py-4 rounded-full text-sm font-bold transition-all shadow-lg active:scale-[0.99] disabled:opacity-40 cursor-pointer ${
              isDark
                ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42] shadow-[#071026]/40'
                : 'bg-[#18181B] hover:bg-slate-800 text-white shadow-slate-900/20'
            }`}
          >
            Save {currentAmount > 0 ? `(${formatRupiah(currentAmount)})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
