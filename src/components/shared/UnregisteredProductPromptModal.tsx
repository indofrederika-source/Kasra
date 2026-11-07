'use client';

import React, { useState, useEffect } from 'react';
import { StockChangeDraft, CategoryDefinition } from '@/types';
import { formatThousands, parseThousands } from '@/lib/utils';
import { AccessibleDatePicker } from '@/components/ui/AccessibleDatePicker';
import {
  PackagePlus,
  X,
  CheckCircle2,
  MapPin,
  Tag,
  Layers,
} from 'lucide-react';

interface UnregisteredProductPromptModalProps {
  item: StockChangeDraft;
  itemNumber?: number;
  totalItems?: number;
  categoryDefinitions: CategoryDefinition[];
  onApproveAdd: (approvedItem: StockChangeDraft) => void;
  onDeclineSkip: () => void;
  onClose?: () => void;
}

const LOCATION_SUGGESTIONS = [
  'Gudang Utama',
  'Kulkas',
  'Freezer',
  'Chiller Depan',
  'Rak Utama',
  'Etalase Kasir',
];

export const UnregisteredProductPromptModal: React.FC<UnregisteredProductPromptModalProps> = ({
  item,
  itemNumber = 1,
  totalItems = 1,
  categoryDefinitions,
  onApproveAdd,
  onDeclineSkip,
  onClose,
}) => {
  const isSaleContext = item.quantityDelta < 0;
  const absDelta = Math.abs(item.quantityDelta || 1);

  const [name, setName] = useState(item.productName || '');
  const [category, setCategory] = useState(item.category || 'Produk Siap Jual');
  const [subcategory, setSubcategory] = useState(item.subcategory || '');
  const [unit, setUnit] = useState(item.unit || 'pcs');
  const [initialStock, setInitialStock] = useState<number>(
    item.initialStock !== undefined ? item.initialStock : absDelta
  );
  const [minStockAlert, setMinStockAlert] = useState<number>(item.minStockAlert ?? 5);
  const [hppAmount, setHppAmount] = useState<number>(
    item.hppAmount ?? item.pricePerUnit ?? 0
  );
  const [sellingPrice, setSellingPrice] = useState<number>(
    item.sellingPrice ??
      (item.pricePerUnit ? Math.round(item.pricePerUnit * (isSaleContext ? 1 : 1.3)) : 0)
  );
  const [location, setLocation] = useState<string>(item.location || 'Gudang Utama');
  const [expiryDate, setExpiryDate] = useState<string | undefined>(item.expiryDate || undefined);

  useEffect(() => {
    const nextAbs = Math.abs(item.quantityDelta || 1);
    setName(item.productName || '');
    setCategory(item.category || 'Produk Siap Jual');
    setSubcategory(item.subcategory || '');
    setUnit(item.unit || 'pcs');
    setInitialStock(item.initialStock !== undefined ? item.initialStock : nextAbs);
    setMinStockAlert(item.minStockAlert ?? 5);
    setHppAmount(item.hppAmount ?? item.pricePerUnit ?? 0);
    setSellingPrice(
      item.sellingPrice ??
        (item.pricePerUnit ? Math.round(item.pricePerUnit * (item.quantityDelta < 0 ? 1 : 1.3)) : 0)
    );
    setLocation(item.location || 'Gudang Utama');
    setExpiryDate(item.expiryDate || undefined);
  }, [item]);

  const categorySuggestions = Array.from(
    new Set([
      ...categoryDefinitions.map((c) => c.name).filter(Boolean),
      'Produk Siap Jual',
      'Bahan Baku',
      'Kemasan & Cup',
      'Operasional & Perlengkapan',
    ])
  );

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || item.productName || 'Barang Baru';
    const cleanUnit = unit.trim() || 'pcs';

    onApproveAdd({
      ...item,
      productName: cleanName,
      category: category.trim() || 'Produk Siap Jual',
      subcategory: subcategory.trim() || undefined,
      unit: cleanUnit,
      initialStock: Math.max(0, initialStock),
      quantityDelta: item.quantityDelta >= 0 ? Math.max(0, initialStock) : item.quantityDelta,
      minStockAlert: Math.max(0, minStockAlert),
      hppAmount: Math.max(0, hppAmount),
      sellingPrice: Math.max(0, sellingPrice),
      pricePerUnit: item.quantityDelta < 0 ? Math.max(0, sellingPrice) : Math.max(0, hppAmount),
      location: location.trim() || 'Gudang Utama',
      expiryDate: expiryDate || undefined,
      isNewProduct: true,
      confirmedNewProduct: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50/80 border-b border-amber-200/80 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900">
                  Barang Belum Ada di Gudang
                </h3>
                {totalItems > 1 && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {itemNumber} / {totalItems}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Barang <strong className="text-slate-900">&quot;{item.productName}&quot;</strong> belum terdaftar di Gudang. Mau sekalian ditambahkan ke Gudang sesuai ucapan Anda?
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Body Pre-filled from Voice */}
        <form onSubmit={handleConfirmAdd} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nama Barang */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nama Barang</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama barang..."
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-900 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
              />
            </div>

            {/* Kategori Utama */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Kategori Utama</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Pilih atau ketik kategori..."
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {categorySuggestions.slice(0, 4).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      category === cat
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Kategori */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" />
                <span>Sub-Kategori (Opsional)</span>
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Contoh: Buah, Minuman, Bumbu..."
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            {/* Stok & Satuan */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                {isSaleContext ? `Stok Awal Sebelum Terjual (${absDelta})` : 'Jumlah Stok Masuk'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={initialStock}
                  onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-24 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none text-center"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="buah / pcs / kg"
                  className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              {isSaleContext && (
                <p className="text-[10px] text-slate-500">
                  Setelah dikurangi penjualan {absDelta} {unit}, sisa stok di Gudang menjadi{' '}
                  <strong className="text-slate-900">{Math.max(0, initialStock - absDelta)} {unit}</strong>.
                </p>
              )}
            </div>

            {/* Batas Alarm Stok Menipis */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Batas Alarm Stok Menipis</label>
              <input
                type="number"
                min={0}
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>

            {/* Harga Modal (HPP) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Harga Modal Satuan (HPP)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(hppAmount)}
                  onChange={(e) => setHppAmount(parseThousands(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-8 pr-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Harga Jual Satuan */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Harga Jual Satuan</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatThousands(sellingPrice)}
                  onChange={(e) => setSellingPrice(parseThousands(e.target.value))}
                  placeholder="0"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-8 pr-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Lokasi Simpan */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>Lokasi Penyimpanan di Gudang</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Gudang Utama, Kulkas, Freezer..."
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {LOCATION_SUGGESTIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      location === loc
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal Kedaluwarsa */}
            <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-600">
                Tanggal Kedaluwarsa (Opsional)
              </label>
              <AccessibleDatePicker
                value={expiryDate}
                onChange={(val) => setExpiryDate(val)}
                label="Pilih Tanggal Kedaluwarsa..."
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onDeclineSkip}
              className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              Tidak Usah Tambah ke Gudang
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ya, Tambahkan ke Gudang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
