'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { Product } from '@/types';
import {
  formatRupiah,
  formatDateIndo,
  formatThousands,
  parseThousands,
} from '@/lib/utils';
import {
  parseOmniboxInput,
  autocorrectIndonesianVoice,
  parseProductInfoEditVoice,
  ProductVoiceEditPatch,
} from '@/lib/ai/parser';
import { useKasraVoiceRecognition } from '@/lib/ai/voiceRecognition';
import { VoiceMicOrb } from '@/components/ui/VoiceMicVisuals';
import { AccessibleDatePicker } from '@/components/ui/AccessibleDatePicker';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import {
  Mic,
  X,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Trash2,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface QuickVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  defaultPrompt?: string;
  contextType?: 'omni' | 'storage';
}

const FIELD_LABELS: Record<keyof ProductVoiceEditPatch, string> = {
  name: 'Nama Barang',
  sku: 'Kode SKU',
  sellingPrice: 'Harga Jual Satuan',
  hppAmount: 'Harga Modal (HPP)',
  expiryDate: 'Tanggal Kedaluwarsa',
  purchaseDate: 'Tanggal Beli / Kulakan',
  location: 'Lokasi Simpan',
  category: 'Kategori Utama',
  subcategory: 'Sub-Kategori',
  unit: 'Satuan Unit',
  currentStock: 'Jumlah Stok Sekarang',
  minStockAlert: 'Batas Alarm Stok Menipis',
};

export const QuickVoiceModal: React.FC<QuickVoiceModalProps> = ({
  isOpen,
  onClose,
  initialProduct = null,
  contextType = 'omni',
}) => {
  const { products, categoryDefinitions, setActiveDraft, updateProduct, theme } = useKasra();
  const isDark = theme === 'dark';

  const [transcript, setTranscript] = useState('');
  const [activeMode, setActiveMode] = useState<'omni' | 'item_edit'>(
    initialProduct ? 'item_edit' : 'omni'
  );
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  const [editablePatch, setEditablePatch] = useState<ProductVoiceEditPatch>({});

  const {
    isRecording,
    isProcessingSpeech,
    audioLevel,
    audioBands,
    statusHint,
    toggleRecording,
    stopRecording,
  } = useKasraVoiceRecognition({
    isOpen,
    onTranscriptChange: setTranscript,
  });

  // Selected product object
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  // Sync initial product and reset state when opened / closed
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setEditablePatch({});
      if (initialProduct) {
        setSelectedProductId(initialProduct.id);
        setActiveMode('item_edit');
      } else {
        setSelectedProductId(products[0]?.id || '');
        setActiveMode(contextType === 'storage' ? 'item_edit' : 'omni');
      }
    }
  }, [isOpen, initialProduct, contextType, products]);

  // Real-time live context and intent detection with autocorrect
  const liveFeedback = useMemo(() => {
    return autocorrectIndonesianVoice(transcript);
  }, [transcript]);

  // Live item-info voice parser whenever transcript or selected product changes
  useEffect(() => {
    if (!transcript.trim()) {
      setEditablePatch({});
      return;
    }

    // Auto-detect if user is speaking an item info edit intent (e.g. "ubah harga", "kadaluarsa", "lokasi", etc.)
    const parsed = parseProductInfoEditVoice(
      transcript,
      products,
      initialProduct ? selectedProduct : null
    );

    const hasInfoChanges = Object.keys(parsed.changes).length > 0;

    // If initialProduct is set, OR if spoken text explicitly contains item info edits:
    if (initialProduct || hasInfoChanges) {
      if (activeMode !== 'item_edit' && hasInfoChanges) {
        setActiveMode('item_edit');
      }

      if (!initialProduct && parsed.matchedProduct && parsed.matchedProduct.id !== selectedProductId) {
        setSelectedProductId(parsed.matchedProduct.id);
      }

      const targetForCalc = (!initialProduct && parsed.matchedProduct) || selectedProduct || null;
      const finalParsed = parseProductInfoEditVoice(transcript, products, targetForCalc);
      setEditablePatch(finalParsed.changes);
    } else if (activeMode === 'item_edit' && !initialProduct && !hasInfoChanges) {
      setEditablePatch({});
    }
  }, [transcript, products, initialProduct, selectedProduct?.id, activeMode]);

  const patchEntries = useMemo(() => {
    return (Object.keys(editablePatch) as Array<keyof ProductVoiceEditPatch>).filter(
      (k) => editablePatch[k] !== undefined
    );
  }, [editablePatch]);

  const updatePatchField = (key: keyof ProductVoiceEditPatch, val: any) => {
    setEditablePatch((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const removePatchField = (key: keyof ProductVoiceEditPatch) => {
    setEditablePatch((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const formatCurrentValue = (prod: Product, key: keyof ProductVoiceEditPatch): string => {
    switch (key) {
      case 'sellingPrice':
        return formatRupiah(prod.sellingPrice);
      case 'hppAmount':
        return formatRupiah(prod.hppAmount);
      case 'expiryDate':
        return prod.expiryDate ? formatDateIndo(prod.expiryDate) : 'Bebas Kedaluwarsa';
      case 'purchaseDate':
        return prod.purchaseDate ? formatDateIndo(prod.purchaseDate) : '-';
      case 'currentStock':
        return `${prod.currentStock} ${prod.unit}`;
      case 'minStockAlert':
        return `${prod.minStockAlert} ${prod.unit}`;
      case 'location':
        return prod.location || 'Gudang Utama';
      case 'category':
        return prod.category || '-';
      case 'subcategory':
        return prod.subcategory || '-';
      case 'unit':
        return String(prod.unit || 'pcs');
      case 'name':
        return prod.name;
      case 'sku':
        return prod.sku || '-';
      default:
        return '-';
    }
  };

  const handleProcessOmniInput = (inputText: string) => {
    const textToProcess = inputText.trim();
    if (!textToProcess) return;

    stopRecording();
    const draft = parseOmniboxInput(textToProcess, products, categoryDefinitions);
    setActiveDraft(draft);
    onClose();
  };

  const handleApplyItemChanges = () => {
    if (!selectedProduct || patchEntries.length === 0) return;

    stopRecording();
    updateProduct(selectedProduct.id, editablePatch);
    onClose();
  };

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.currentStock} ${p.unit})`,
      })),
    [products]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] transition-colors ${
          isDark
            ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0]'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#0D1C42] border-[#345294]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isDark
                  ? 'bg-[#22396F] text-[#FCF1D0] border border-[#345294]'
                  : 'bg-gradient-to-br from-[#1E3D1C] to-[#2D5B2A] text-white'
              }`}
            >
              <Mic className="w-4 h-4 stroke-[2.3]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">
                Suara Pintar Kasra
              </h2>
              <p
                className={`text-[11px] truncate ${
                  isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
                }`}
              >
                Transaksi, stok, kas, kategori, & ubah info barang dalam satu mikrofon
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'text-[#B8C4E0] hover:text-[#FCF1D0] hover:bg-[#22396F]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Segmented Switcher */}
        <div
          className={`px-5 pt-3 pb-2 border-b flex items-center justify-center ${
            isDark ? 'bg-[#0D1C42]/60 border-[#345294]' : 'bg-slate-50/70 border-slate-200/80'
          }`}
        >
          <div
            className={`inline-flex items-center p-1 rounded-full border shadow-inner ${
              isDark ? 'bg-[#0D1C42] border-[#345294]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveMode('omni')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'omni'
                  ? isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : isDark
                  ? 'text-[#B8C4E0] hover:text-[#FCF1D0]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Transaksi & Kasir</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('item_edit')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'item_edit'
                  ? isDark
                    ? 'bg-[#FCF1D0] text-[#0D1C42] shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : isDark
                  ? 'text-[#B8C4E0] hover:text-[#FCF1D0]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ubah Info Barang</span>
              {patchEntries.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-0.5 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Voice Input Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Product Selector if in item edit mode */}
          {activeMode === 'item_edit' && (
            <div
              className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150 ${
                isDark
                  ? 'bg-[#0D1C42] border-[#345294]'
                  : 'bg-emerald-50/50 border-emerald-200/80'
              }`}
            >
              <div className="space-y-0.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDark ? 'text-[#FCF1D0]' : 'text-emerald-700'
                  }`}
                >
                  Barang yang Diatur
                </span>
                <span
                  className={`text-[11px] ${
                    isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
                  }`}
                >
                  {initialProduct
                    ? 'Terkunci ke barang ini — langsung ucapkan perubahannya:'
                    : 'Otomatis terdeteksi dari ucapan Anda, atau pilih manual:'}
                </span>
              </div>
              <div className="w-full sm:w-64 shrink-0">
                <CustomDropdown
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  options={productOptions}
                />
              </div>
            </div>
          )}

          {/* Voice Visualizer */}
          <div className="flex flex-col items-center text-center pt-1">
            <VoiceMicOrb
              isRecording={isRecording}
              onToggle={toggleRecording}
              transcript={transcript}
              audioLevel={audioLevel}
              audioBands={audioBands}
              isProcessingSpeech={isProcessingSpeech}
              accent="emerald"
              idleHint={
                statusHint ||
                (activeMode === 'item_edit'
                  ? 'Klik tombol mikrofon lalu ucapkan perubahan harga, kadaluarsa, stok, atau lokasi'
                  : 'Klik tombol mikrofon untuk mulai berbicara atau ketik perintah di bawah:')
              }
              listeningHint={
                statusHint ||
                (activeMode === 'item_edit'
                  ? 'Sedang mendengarkan... Ucapkan: "Ubah harga jual jadi 15 ribu, kadaluarsa 25 November"'
                  : 'Sedang mendengarkan... Ucapkan transaksi penjualan, kulakan, kas, atau kategori baru')
              }
            />
          </div>

          {/* Transcript Area */}
          <div className="w-full space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={
                  activeMode === 'item_edit'
                    ? selectedProduct
                      ? `Contoh: "Ubah harga jual ${selectedProduct.name} jadi 15 ribu, kadaluarsa 25 November, pindah ke kulkas"`
                      : 'Contoh: "Ubah harga jual leci jadi 15 ribu, kadaluarsa 25 November"'
                    : 'Contoh: "Ada yang beli es teh 3", "Kulakan kopi 5 kg 150 ribu", "Bayar listrik 200 ribu"'
                }
                className={`w-full border rounded-2xl p-3.5 text-xs placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed transition-colors shadow-2xs ${
                  isDark
                    ? 'bg-[#0D1C42] border-[#345294] text-[#FCF1D0] focus:border-[#FCF1D0]'
                    : 'bg-slate-50 focus:bg-white border-slate-200 focus:border-slate-400 text-slate-900'
                }`}
              />
            </div>

            {/* Live Autocorrect & Context Pill (Omni Mode) */}
            {activeMode === 'omni' && transcript.trim() && (
              <div
                className={`p-3 rounded-xl border text-left space-y-1.5 animate-in fade-in duration-150 ${
                  isDark ? 'bg-[#0D1C42] border-[#345294]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className="font-bold text-[11px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${liveFeedback.intentColor}20`,
                      color: liveFeedback.intentColor,
                      border: `1px solid ${liveFeedback.intentColor}40`,
                    }}
                  >
                    {liveFeedback.intentLabel}
                  </span>
                  <span
                    className={`text-[11px] ${
                      isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
                    }`}
                  >
                    {liveFeedback.suggestedAction}
                  </span>
                </div>
                {liveFeedback.cleanedText.toLowerCase() !== transcript.toLowerCase().trim() && (
                  <div
                    className={`text-[11px] flex items-center gap-1.5 pt-1 border-t ${
                      isDark ? 'border-[#345294] text-[#B8C4E0]' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="opacity-70">Terkoreksi:</span>
                    <span className="font-medium italic">"{liveFeedback.cleanedText}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Edit Mode: Live Before -> After Preview & Inline Editor */}
          {activeMode === 'item_edit' && selectedProduct && patchEntries.length > 0 && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    Perubahan pada &quot;{selectedProduct.name}&quot; ({patchEntries.length})
                  </span>
                </span>
                <span
                  className={`text-[11px] ${
                    isDark ? 'text-[#B8C4E0]' : 'text-slate-400'
                  }`}
                >
                  Bisa diedit sebelum disimpan
                </span>
              </div>

              <div className="space-y-2">
                {patchEntries.map((key) => {
                  const val = editablePatch[key];
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isDark
                          ? 'bg-[#0D1C42] border-[#345294]'
                          : 'bg-emerald-50/40 border-emerald-200/80'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-[155px]">
                        <span className="text-xs font-bold block">
                          {FIELD_LABELS[key]}
                        </span>
                        <div
                          className={`text-[11px] flex items-center gap-1 font-mono ${
                            isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
                          }`}
                        >
                          <span>Sebelum: {formatCurrentValue(selectedProduct, key)}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-1 sm:justify-end">
                        {key === 'sellingPrice' || key === 'hppAmount' ? (
                          <div className="relative w-40">
                            <span
                              className={`absolute left-2.5 top-1.5 text-xs font-mono ${
                                isDark ? 'text-[#B8C4E0]' : 'text-slate-400'
                              }`}
                            >
                              Rp
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatThousands(Number(val) || 0)}
                              onChange={(e) =>
                                updatePatchField(key, parseThousands(e.target.value))
                              }
                              className={`w-full border rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-bold font-mono focus:outline-none text-right ${
                                isDark
                                  ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0] focus:border-[#FCF1D0]'
                                  : 'bg-white border-emerald-300 text-slate-900 focus:border-emerald-500'
                              }`}
                            />
                          </div>
                        ) : key === 'expiryDate' ? (
                          <div className="flex-1 max-w-xs">
                            {val === null ? (
                              <div className="flex items-center justify-end gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                                    isDark
                                      ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0]'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  Bebas Kedaluwarsa
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePatchField(
                                      'expiryDate',
                                      new Date().toISOString().slice(0, 10)
                                    )
                                  }
                                  className="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer"
                                >
                                  Pilih Tanggal
                                </button>
                              </div>
                            ) : (
                              <AccessibleDatePicker
                                value={typeof val === 'string' ? val : undefined}
                                onChange={(nextDate) =>
                                  updatePatchField('expiryDate', nextDate ?? null)
                                }
                                label="Pilih tanggal kedaluwarsa..."
                              />
                            )}
                          </div>
                        ) : key === 'purchaseDate' ? (
                          <div className="flex-1 max-w-xs">
                            <AccessibleDatePicker
                              value={(val as string) || undefined}
                              onChange={(nextDate) =>
                                updatePatchField('purchaseDate', nextDate || '')
                              }
                              presetMode="purchase"
                              label="Pilih tanggal beli..."
                            />
                          </div>
                        ) : key === 'currentStock' || key === 'minStockAlert' ? (
                          <input
                            type="number"
                            min={0}
                            value={Number(val) || 0}
                            onChange={(e) =>
                              updatePatchField(
                                key,
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            className={`w-28 border rounded-xl px-3 py-1.5 text-xs font-bold font-mono focus:outline-none text-center ${
                              isDark
                                ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0] focus:border-[#FCF1D0]'
                                : 'bg-white border-emerald-300 text-slate-900 focus:border-emerald-500'
                            }`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(val || '')}
                            onChange={(e) => updatePatchField(key, e.target.value)}
                            className={`w-48 border rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none ${
                              isDark
                                ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0] focus:border-[#FCF1D0]'
                                : 'bg-white border-emerald-300 text-slate-900 focus:border-emerald-500'
                            }`}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removePatchField(key)}
                          title="Batalkan perubahan kolom ini"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unified Voice Command Syntax Guide */}
          <div
            className={`p-3.5 rounded-2xl border text-left space-y-1.5 ${
              isDark
                ? 'bg-[#0D1C42]/70 border-[#345294]'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <span
              className={`text-[11px] font-semibold block ${
                isDark ? 'text-[#FCF1D0]' : 'text-slate-700'
              }`}
            >
              Panduan Perintah yang Didukung:
            </span>
            <ul
              className={`text-[11px] space-y-1 list-disc list-inside leading-relaxed ${
                isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
              }`}
            >
              <li>
                Penjualan: <span className="font-medium text-emerald-600">&quot;Ada yang beli [barang] [jumlah]&quot;</span> atau <span className="font-medium text-emerald-600">&quot;Laku [jumlah] [barang]&quot;</span>
              </li>
              <li>
                Kulakan / Stok: <span className="font-medium text-sky-600">&quot;Kulakan [barang] [jumlah] seharga [nominal]&quot;</span>
              </li>
              <li>
                Ubah Info Barang:{' '}
                <span className="font-medium text-amber-600">
                  &quot;Ubah harga jual [barang] jadi 15 ribu, kadaluarsa 25 November, pindah ke kulkas&quot;
                </span>
              </li>
              <li>
                Pengeluaran / Kategori: <span className="font-medium text-rose-500">&quot;Bayar listrik 150 ribu&quot;</span> atau <span className="font-medium text-purple-600">&quot;Tambah kategori [nama]&quot;</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${
            isDark ? 'bg-[#0D1C42] border-[#345294]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'text-[#B8C4E0] hover:text-[#FCF1D0] hover:bg-[#22396F]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Tutup
          </button>

          {activeMode === 'item_edit' ? (
            <button
              type="button"
              onClick={handleApplyItemChanges}
              disabled={!selectedProduct || patchEntries.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 ${
                isDark
                  ? 'bg-[#FCF1D0] hover:bg-[#F5E6B8] text-[#0D1C42]'
                  : 'bg-[#1E3D1C] hover:bg-[#2D5B2A] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan Barang ({patchEntries.length})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleProcessOmniInput(transcript)}
              disabled={!transcript.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 ${
                isDark
                  ? 'bg-[#FCF1D0] hover:bg-[#F5E6B8] text-[#0D1C42]'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tinjau Draf Konfirmasi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
