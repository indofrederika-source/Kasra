'use client';

import React, { useState } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { ConfirmationDraft, CashChangeDraft, StockChangeDraft, CategoryChangeDraft } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { AccessibleDatePicker } from '@/components/ui/AccessibleDatePicker';
import {
  CheckCircle2,
  X,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  Calendar,
  Trash2,
  FileText,
  Tag,
  MapPin,
} from 'lucide-react';

const CASH_CATEGORIES = [
  { value: 'Penjualan', label: 'Penjualan' },
  { value: 'Bahan Baku', label: 'Bahan Baku' },
  { value: 'Operasional', label: 'Operasional' },
  { value: 'Kemasan & Cup', label: 'Kemasan & Cup' },
  { value: 'Gaji Karyawan', label: 'Gaji Karyawan' },
  { value: 'Listrik & Air', label: 'Listrik & Air' },
  { value: 'Lainnya', label: 'Lainnya' },
];

const MAIN_CATEGORY_OPTIONS = [
  { value: 'Bahan Baku', label: 'Bahan Baku' },
  { value: 'Produk Siap Jual', label: 'Produk Siap Jual' },
  { value: 'Kemasan & Cup', label: 'Kemasan & Cup' },
  { value: 'Operasional & Perlengkapan', label: 'Operasional & Perlengkapan' },
];

interface ConfirmationDraftModalProps {
  draft: ConfirmationDraft;
}

export const ConfirmationDraftModal: React.FC<ConfirmationDraftModalProps> = ({ draft }) => {
  const { applyConfirmationDraft, cancelConfirmationDraft } = useKasra();

  const [editableCash, setEditableCash] = useState<CashChangeDraft[]>(draft.cashChanges);
  const [editableStock, setEditableStock] = useState<StockChangeDraft[]>(draft.stockChanges);
  const [editableCategories, setEditableCategories] = useState<CategoryChangeDraft[]>(
    draft.categoryChanges || []
  );

  const handleCashChange = (index: number, field: keyof CashChangeDraft, value: any) => {
    setEditableCash((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeCashItem = (index: number) => {
    setEditableCash((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStockChange = (index: number, field: keyof StockChangeDraft, value: any) => {
    setEditableStock((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeStockItem = (index: number) => {
    setEditableStock((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, field: keyof CategoryChangeDraft, value: any) => {
    setEditableCategories((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeCategoryItem = (index: number) => {
    setEditableCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    applyConfirmationDraft({
      ...draft,
      cashChanges: editableCash,
      stockChanges: editableStock,
      categoryChanges: editableCategories,
    });
  };

  const totalCashEffect = editableCash.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#171719] border-b border-[#28282e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#242428] border border-[#303036] flex items-center justify-center text-stone-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{draft.title}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white text-black font-mono">
                  Draf Dapat Diedit
                </span>
              </h2>
              <p className="text-xs text-[#8a8a92] mt-0.5">
                Tinjau dan sesuaikan perubahan di bawah ini sebelum disimpan ke Buku Kas & Gudang.
              </p>
            </div>
          </div>
          <button
            onClick={cancelConfirmationDraft}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Explanation Alert */}
          <div className="p-3.5 rounded-xl bg-[#171719] border border-[#2c2c32] text-xs text-stone-300 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white">Ringkasan Deteksi:</span>
              <p className="text-stone-300 leading-relaxed">{draft.explanation}</p>
              <div className="text-[11px] text-[#71717a] pt-1 border-t border-[#28282e] mt-1 font-mono">
                Sumber Input: "{draft.originalInput}"
              </div>
            </div>
          </div>

          {/* Section 0: Penambahan Kategori & Sub-Kategori */}
          {editableCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#a855f7] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#a855f7]" />
                  <span>Penambahan Kategori Baru ({editableCategories.length})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {editableCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#171719] border border-[#3b2d4a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap flex-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                        {cat.action === 'add_sub' ? 'SUB-KATEGORI' : 'KATEGORI UTAMA'}
                      </span>

                      {cat.action === 'add_sub' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-stone-300">
                            <span>Sub:</span>
                            <input
                              type="text"
                              value={cat.subcategory || ''}
                              onChange={(e) => handleCategoryChange(idx, 'subcategory', e.target.value)}
                              placeholder="Nama Sub-Kategori"
                              className="bg-[#121214] border border-[#2c2c32] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white/30 w-36"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-stone-300">
                            <span>di Kategori Utama:</span>
                            <div className="w-44">
                              <CustomDropdown
                                value={cat.mainCategory}
                                onChange={(val) => handleCategoryChange(idx, 'mainCategory', val)}
                                options={MAIN_CATEGORY_OPTIONS}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-stone-300">
                          <span>Nama Kategori:</span>
                          <input
                            type="text"
                            value={cat.mainCategory}
                            onChange={(e) => handleCategoryChange(idx, 'mainCategory', e.target.value)}
                            placeholder="Nama Kategori Utama"
                            className="bg-[#121214] border border-[#2c2c32] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white/30 w-52"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removeCategoryItem(idx)}
                      className="p-1 rounded text-stone-500 hover:text-rose-400 transition-colors"
                      title="Batalkan penambahan kategori ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Perubahan Buku Kas */}
          {editableCash.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a92] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-stone-300" />
                  <span>1. Perubahan Buku Kas ({editableCash.length})</span>
                </h3>
                <span className="text-xs text-[#8a8a92]">
                  Efek Kas:{' '}
                  <span
                    className={`font-bold font-mono ${
                      totalCashEffect >= 0 ? 'text-white' : 'text-rose-400'
                    }`}
                  >
                    {totalCashEffect >= 0 ? `+${formatRupiah(totalCashEffect)}` : formatRupiah(totalCashEffect)}
                  </span>
                </span>
              </div>

              <div className="space-y-2">
                {editableCash.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#171719] border border-[#2c2c32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          item.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {item.type === 'income' ? 'MASUK' : 'KELUAR'}
                      </span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleCashChange(idx, 'description', e.target.value)}
                        placeholder="Deskripsi Transaksi"
                        className="bg-[#121214] border border-[#2c2c32] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-white/30 flex-1 min-w-[180px]"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="w-36">
                        <CustomDropdown
                          value={item.category}
                          onChange={(val) => handleCashChange(idx, 'category', val)}
                          options={CASH_CATEGORIES}
                        />
                      </div>

                      <div className="relative">
                        <span className="absolute left-2.5 top-1 text-xs text-[#71717a] font-mono">Rp</span>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) =>
                            handleCashChange(idx, 'amount', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="bg-[#121214] border border-[#2c2c32] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white font-semibold font-mono focus:outline-none focus:border-white/30 w-28 text-right"
                        />
                      </div>

                      <button
                        onClick={() => removeCashItem(idx)}
                        className="p-1 rounded text-stone-500 hover:text-rose-400 transition-colors"
                        title="Hapus baris kas ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Perubahan Stok Gudang */}
          {editableStock.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8a8a92] flex items-center gap-2">
                <Package className="w-4 h-4 text-stone-300" />
                <span>2. Perubahan Stok Gudang ({editableStock.length} Item)</span>
              </h3>

              <div className="space-y-3">
                {editableStock.map((stock, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#171719] border border-[#2c2c32] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                        <span
                          className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                            stock.quantityDelta > 0
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {stock.quantityDelta > 0 ? `+${stock.quantityDelta}` : stock.quantityDelta}{' '}
                          {stock.unit}
                        </span>
                        <input
                          type="text"
                          value={stock.productName}
                          onChange={(e) => handleStockChange(idx, 'productName', e.target.value)}
                          placeholder="Nama Barang"
                          className="bg-[#121214] border border-[#2c2c32] rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-white/30 flex-1 sm:w-60"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                          <span>Qty:</span>
                          <input
                            type="number"
                            value={stock.quantityDelta}
                            onChange={(e) =>
                              handleStockChange(idx, 'quantityDelta', parseInt(e.target.value) || 0)
                            }
                            className="bg-[#121214] border border-[#2c2c32] rounded-lg px-2 py-1 text-xs text-white font-semibold font-mono w-16 text-center"
                          />
                          <input
                            type="text"
                            value={stock.unit}
                            onChange={(e) => handleStockChange(idx, 'unit', e.target.value)}
                            className="bg-[#121214] border border-[#2c2c32] rounded-lg px-2 py-1 text-xs text-stone-300 w-16 text-center"
                          />
                        </div>

                        <button
                          onClick={() => removeStockItem(idx)}
                          className="p-1 rounded text-stone-500 hover:text-rose-400 transition-colors"
                          title="Hapus item stok ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Insufficient Stock Warning Alert */}
                    {stock.insufficientStockWarning && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <span className="font-bold text-white">Stok Gudang Tidak Cukup! </span>
                            <span>
                              Sisa stok hanya <strong>{stock.insufficientStockWarning.currentStock} {stock.unit}</strong>,
                              tetapi penjualan meminta <strong>{stock.insufficientStockWarning.requestedQty} {stock.unit}</strong> (Kurang {stock.insufficientStockWarning.shortage} {stock.unit}).
                            </span>
                          </div>
                        </div>

                        {stock.insufficientStockWarning.currentStock > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const avail = stock.insufficientStockWarning!.currentStock;
                              handleStockChange(idx, 'quantityDelta', -avail);
                              if (editableCash[idx]) {
                                const unitPrice =
                                  stock.pricePerUnit ||
                                  Math.round(editableCash[idx].amount / stock.insufficientStockWarning!.requestedQty);
                                handleCashChange(idx, 'amount', unitPrice * avail);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white border border-rose-500/40 font-bold text-[11px] shrink-0 transition-colors"
                          >
                            Sesuaikan ke {stock.insufficientStockWarning.currentStock} {stock.unit}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expiry Date with AccessibleDatePicker */}
                    <div className="pt-2 border-t border-[#28282e] space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#8a8a92] font-medium">
                            Tanggal Kedaluwarsa:
                          </span>
                          {stock.location && (
                            <span className="text-[10px] text-[#f2aa4b] font-mono flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{stock.location}</span>
                            </span>
                          )}
                        </div>
                        {stock.isNewProduct && (
                          <span className="text-[10px] bg-white text-black font-semibold px-2 py-0.5 rounded-full">
                            Produk Baru Otomatis Didaftarkan
                          </span>
                        )}
                      </div>
                      <AccessibleDatePicker
                        value={stock.expiryDate}
                        onChange={(val) => handleStockChange(idx, 'expiryDate', val)}
                        label="Atur Tanggal Kedaluwarsa (Klik untuk pilih)..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#171719] border-t border-[#28282e] flex items-center justify-between">
          <button
            onClick={cancelConfirmationDraft}
            className="px-4 py-2 rounded-full text-xs font-medium text-stone-400 hover:text-white"
          >
            Batal
          </button>

          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>Konfirmasi & Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
