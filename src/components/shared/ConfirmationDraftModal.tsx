'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { ConfirmationDraft, CashChangeDraft, StockChangeDraft, CategoryChangeDraft } from '@/types';
import { formatRupiah, formatThousands, parseThousands } from '@/lib/utils';
import { parseOmniboxInput } from '@/lib/ai/parser';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { AccessibleDatePicker } from '@/components/ui/AccessibleDatePicker';
import {
  CheckCircle2,
  X,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Package,
  Trash2,
  FileText,
  Tag,
  MapPin,
  Pencil,
  Mic,
  MicOff,
  RotateCcw,
} from 'lucide-react';

interface ConfirmationDraftModalProps {
  draft: ConfirmationDraft;
}

export const ConfirmationDraftModal: React.FC<ConfirmationDraftModalProps> = ({ draft }) => {
  const { applyConfirmationDraft, cancelConfirmationDraft, products, categoryDefinitions } =
    useKasra();

  const cashCategoryOptions = useMemo(() => {
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
    set.add('Lainnya');
    return Array.from(set).map((c) => ({ value: c, label: c }));
  }, [categoryDefinitions]);

  const mainCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    categoryDefinitions.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    ['Bahan Baku', 'Produk Siap Jual', 'Kemasan & Cup', 'Operasional & Perlengkapan'].forEach((d) =>
      set.add(d)
    );
    return Array.from(set).map((c) => ({ value: c, label: c }));
  }, [categoryDefinitions]);

  const [editableCash, setEditableCash] = useState<CashChangeDraft[]>(draft.cashChanges);
  const [editableStock, setEditableStock] = useState<StockChangeDraft[]>(draft.stockChanges);
  const [editableCategories, setEditableCategories] = useState<CategoryChangeDraft[]>(
    draft.categoryChanges || []
  );

  // Editable Ringkasan & Re-parse states
  const [currentOriginalInput, setCurrentOriginalInput] = useState<string>(draft.originalInput);
  const [editedInput, setEditedInput] = useState<string>(draft.originalInput);
  const [baseExplanation, setBaseExplanation] = useState<string>(draft.explanation);
  const [manualRowEdited, setManualRowEdited] = useState<boolean>(false);
  const [isEditingRingkasan, setIsEditingRingkasan] = useState<boolean>(false);

  // Optional inline voice re-record inside Ringkasan editor
  const [isReRecording, setIsReRecording] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const isReRecordingRef = useRef<boolean>(false);
  const ringkasanInputRef = useRef<HTMLInputElement | null>(null);

  // Sync if draft prop changes
  useEffect(() => {
    setEditableCash(draft.cashChanges);
    setEditableStock(draft.stockChanges);
    setEditableCategories(draft.categoryChanges || []);
    setCurrentOriginalInput(draft.originalInput);
    setEditedInput(draft.originalInput);
    setBaseExplanation(draft.explanation);
    setManualRowEdited(false);
    setIsEditingRingkasan(false);
  }, [draft.id]);

  // Focus input when opening Ringkasan editor
  useEffect(() => {
    if (isEditingRingkasan && ringkasanInputRef.current) {
      ringkasanInputRef.current.focus();
      ringkasanInputRef.current.select();
    }
    if (!isEditingRingkasan && isReRecordingRef.current) {
      stopReRecording();
    }
  }, [isEditingRingkasan]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      isReRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const stopReRecording = () => {
    isReRecordingRef.current = false;
    setIsReRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const toggleReRecording = () => {
    if (isReRecording) {
      stopReRecording();
      return;
    }

    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID';

    recognition.onresult = (event: any) => {
      let spoken = '';
      for (let i = 0; i < event.results.length; i++) {
        spoken += event.results[i][0].transcript;
      }
      setEditedInput(spoken);
    };

    recognition.onerror = () => {
      stopReRecording();
    };

    recognition.onend = () => {
      if (isReRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          stopReRecording();
        }
      }
    };

    recognitionRef.current = recognition;
    setEditedInput('');
    isReRecordingRef.current = true;
    setIsReRecording(true);
    try {
      recognition.start();
    } catch {
      stopReRecording();
    }
  };

  const handleReparseRingkasan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    stopReRecording();

    const cleaned = editedInput.trim();
    if (!cleaned) return;

    const reparsed = parseOmniboxInput(cleaned, products, categoryDefinitions);
    setEditableCash(reparsed.cashChanges);
    setEditableStock(reparsed.stockChanges);
    setEditableCategories(reparsed.categoryChanges || []);
    setCurrentOriginalInput(reparsed.originalInput);
    setEditedInput(reparsed.originalInput);
    setBaseExplanation(reparsed.explanation);
    setManualRowEdited(false);
    setIsEditingRingkasan(false);
  };

  // Recompute insufficient stock warning helper when stock delta changes
  const computeStockWarning = (
    stockItem: StockChangeDraft,
    nextDelta: number
  ): StockChangeDraft['insufficientStockWarning'] => {
    if (nextDelta >= 0 || !stockItem.productId) return undefined;
    const matched = products.find((p) => p.id === stockItem.productId);
    if (!matched) return undefined;
    const requested = Math.abs(nextDelta);
    if (requested > matched.currentStock) {
      return {
        currentStock: matched.currentStock,
        requestedQty: requested,
        shortage: requested - matched.currentStock,
      };
    }
    return undefined;
  };

  const handleCashChange = (index: number, field: keyof CashChangeDraft, value: any) => {
    setManualRowEdited(true);
    setEditableCash((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleCashType = (index: number) => {
    setManualRowEdited(true);
    setEditableCash((prev) => {
      const copy = [...prev];
      const curr = copy[index];
      const nextType = curr.type === 'income' ? 'expense' : 'income';
      let nextDesc = curr.description;
      if (nextType === 'income' && /^Kulakan\s+/i.test(nextDesc)) {
        nextDesc = nextDesc.replace(/^Kulakan\s+/i, 'Penjualan ');
      } else if (nextType === 'expense' && /^Penjualan\s+/i.test(nextDesc)) {
        nextDesc = nextDesc.replace(/^Penjualan\s+/i, 'Kulakan ');
      }
      copy[index] = {
        ...curr,
        type: nextType,
        description: nextDesc,
        category:
          nextType === 'income' && curr.category.toLowerCase() === 'bahan baku'
            ? 'Penjualan'
            : curr.category,
      };
      return copy;
    });
  };

  const removeCashItem = (index: number) => {
    setManualRowEdited(true);
    setEditableCash((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStockChange = (index: number, field: keyof StockChangeDraft, value: any) => {
    setManualRowEdited(true);
    setEditableStock((prev) => {
      const copy = [...prev];
      const updated = { ...copy[index], [field]: value };
      if (field === 'quantityDelta') {
        updated.insufficientStockWarning = computeStockWarning(updated, Number(value) || 0);
      }
      copy[index] = updated;
      return copy;
    });
  };

  const toggleStockDirection = (index: number) => {
    setManualRowEdited(true);
    setEditableStock((prev) => {
      const copy = [...prev];
      const curr = copy[index];
      const flipped = -(curr.quantityDelta || 0);
      copy[index] = {
        ...curr,
        quantityDelta: flipped,
        insufficientStockWarning: computeStockWarning(curr, flipped),
      };
      return copy;
    });
  };

  const removeStockItem = (index: number) => {
    setManualRowEdited(true);
    setEditableStock((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, field: keyof CategoryChangeDraft, value: any) => {
    setManualRowEdited(true);
    setEditableCategories((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeCategoryItem = (index: number) => {
    setManualRowEdited(true);
    setEditableCategories((prev) => prev.filter((_, i) => i !== index));
  };

  // Live dynamic Ringkasan text so manual edits below also update Ringkasan immediately
  const liveRingkasanText = useMemo(() => {
    if (!manualRowEdited && baseExplanation) {
      return baseExplanation;
    }

    const parts: string[] = [];
    editableStock.forEach((s) => {
      if (s.quantityDelta > 0) {
        parts.push(`Stok ${s.productName} bertambah (+${s.quantityDelta} ${s.unit})`);
      } else if (s.quantityDelta < 0) {
        parts.push(`Stok ${s.productName} berkurang (${s.quantityDelta} ${s.unit})`);
      }
    });
    editableCash.forEach((c) => {
      if (c.type === 'income') {
        parts.push(`Kas Masuk (+${formatRupiah(c.amount)})`);
      } else {
        parts.push(`Kas Keluar (-${formatRupiah(c.amount)})`);
      }
    });
    editableCategories.forEach((cat) => {
      if (cat.action === 'add_sub') {
        parts.push(`Sub-kategori baru "${cat.subcategory}" di "${cat.mainCategory}"`);
      } else {
        parts.push(`Kategori baru "${cat.mainCategory}"`);
      }
    });

    return parts.length > 0 ? parts.join(' • ') : 'Tidak ada perubahan aktif.';
  }, [manualRowEdited, baseExplanation, editableStock, editableCash, editableCategories]);

  const handleConfirm = () => {
    stopReRecording();
    applyConfirmationDraft({
      ...draft,
      originalInput: currentOriginalInput,
      explanation: liveRingkasanText,
      cashChanges: editableCash,
      stockChanges: editableStock,
      categoryChanges: editableCategories,
    });
  };

  const totalCashEffect = editableCash.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{draft.title}</span>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                  Draf Dapat Diedit
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tinjau dan sesuaikan perubahan di bawah ini sebelum disimpan ke Buku Kas & Gudang.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopReRecording();
              cancelConfirmationDraft();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Clickable & Editable Ringkasan Card */}
          {!isEditingRingkasan ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setEditedInput(currentOriginalInput);
                setIsEditingRingkasan(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditedInput(currentOriginalInput);
                  setIsEditingRingkasan(true);
                }
              }}
              title="Klik untuk mengedit ucapan atau kalimat perintah"
              className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 flex items-start gap-3 transition-all cursor-pointer group"
            >
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">Ringkasan</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-slate-900 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 group-hover:border-slate-300 transition-colors">
                    <Pencil className="w-3 h-3" />
                    <span>Klik untuk edit</span>
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{liveRingkasanText}</p>
                <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-200/80 mt-1 font-mono truncate">
                  Kalimat: &quot;{currentOriginalInput}&quot;
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleReparseRingkasan}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-sm space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5 text-slate-900" />
                  <span className="text-xs font-bold text-slate-900">Ringkasan</span>
                  <span className="text-[11px] text-slate-500">
                    — Ubah kalimat atau ucapkan ulang jika tadi salah terdengar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopReRecording();
                    setEditedInput(currentOriginalInput);
                    setIsEditingRingkasan(false);
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 px-2 py-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={ringkasanInputRef}
                    type="text"
                    value={editedInput}
                    onChange={(e) => setEditedInput(e.target.value)}
                    placeholder="Contoh: Tadi ada yang beli leci 10..."
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleReRecording}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isReRecording
                        ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                    title="Ucapkan ulang dengan suara"
                  >
                    {isReRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Berhenti</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span>Bicara</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={!editedInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Perbarui</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Section 0: Penambahan Kategori & Sub-Kategori */}
          {editableCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-700 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span>Penambahan Kategori Baru ({editableCategories.length})</span>
                </h3>
              </div>

              <div className="space-y-2">
                {editableCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap flex-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-100 text-purple-700 border border-purple-200">
                        {cat.action === 'add_sub' ? 'SUB-KATEGORI' : 'KATEGORI UTAMA'}
                      </span>

                      {cat.action === 'add_sub' ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <span>Sub:</span>
                            <input
                              type="text"
                              value={cat.subcategory || ''}
                              onChange={(e) => handleCategoryChange(idx, 'subcategory', e.target.value)}
                              placeholder="Nama Sub-Kategori"
                              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-400 w-36"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <span>di Kategori Utama:</span>
                            <div className="w-44">
                              <CustomDropdown
                                value={cat.mainCategory}
                                onChange={(val) => handleCategoryChange(idx, 'mainCategory', val)}
                                options={mainCategoryOptions}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <span>Nama Kategori:</span>
                          <input
                            type="text"
                            value={cat.mainCategory}
                            onChange={(e) => handleCategoryChange(idx, 'mainCategory', e.target.value)}
                            placeholder="Nama Kategori Utama"
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-400 w-52"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCategoryItem(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-600" />
                  <span>1. Perubahan Buku Kas ({editableCash.length})</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Efek Kas:{' '}
                  <span
                    className={`font-bold font-mono ${
                      totalCashEffect > 0
                        ? 'text-emerald-600'
                        : totalCashEffect < 0
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {totalCashEffect > 0
                      ? `+${formatRupiah(totalCashEffect)}`
                      : formatRupiah(totalCashEffect)}
                  </span>
                </span>
              </div>

              <div className="space-y-2">
                {editableCash.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => toggleCashType(idx)}
                        title="Klik untuk ubah Masuk / Keluar"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition-colors cursor-pointer shrink-0 ${
                          item.type === 'income'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.type === 'income' ? 'MASUK' : 'KELUAR'}
                      </button>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleCashChange(idx, 'description', e.target.value)}
                        placeholder="Deskripsi Transaksi"
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-slate-400 flex-1 min-w-[180px]"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="w-36">
                        <CustomDropdown
                          value={item.category}
                          onChange={(val) => handleCashChange(idx, 'category', val)}
                          options={cashCategoryOptions}
                        />
                      </div>

                      <div className="relative">
                        <span className="absolute left-2.5 top-1 text-xs text-slate-400 font-mono">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatThousands(item.amount)}
                          onChange={(e) =>
                            handleCashChange(idx, 'amount', Math.max(0, parseThousands(e.target.value)))
                          }
                          className="bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 font-semibold font-mono focus:outline-none focus:border-slate-400 w-32 text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCashItem(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-600" />
                <span>2. Perubahan Stok Gudang ({editableStock.length} Item)</span>
              </h3>

              <div className="space-y-3">
                {editableStock.map((stock, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                        <button
                          type="button"
                          onClick={() => toggleStockDirection(idx)}
                          title="Klik untuk ubah Tambah (+) / Kurang (-) stok"
                          className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                            stock.quantityDelta > 0
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {stock.quantityDelta > 0 ? `+${stock.quantityDelta}` : stock.quantityDelta}{' '}
                          {stock.unit}
                        </button>
                        <input
                          type="text"
                          value={stock.productName}
                          onChange={(e) => handleStockChange(idx, 'productName', e.target.value)}
                          placeholder="Nama Barang"
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400 flex-1 sm:w-60"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <span>Qty:</span>
                          <input
                            type="number"
                            value={stock.quantityDelta}
                            onChange={(e) =>
                              handleStockChange(idx, 'quantityDelta', parseInt(e.target.value) || 0)
                            }
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 font-semibold font-mono w-16 text-center"
                          />
                          <input
                            type="text"
                            value={stock.unit}
                            onChange={(e) => handleStockChange(idx, 'unit', e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 w-16 text-center"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeStockItem(idx)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus item stok ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Insufficient Stock Warning Alert */}
                    {stock.insufficientStockWarning && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900">Stok Gudang Tidak Cukup! </span>
                            <span>
                              Sisa stok hanya{' '}
                              <strong>
                                {stock.insufficientStockWarning.currentStock} {stock.unit}
                              </strong>
                              , tetapi penjualan meminta{' '}
                              <strong>
                                {stock.insufficientStockWarning.requestedQty} {stock.unit}
                              </strong>{' '}
                              (Kurang {stock.insufficientStockWarning.shortage} {stock.unit}).
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
                                  Math.round(
                                    editableCash[idx].amount /
                                      stock.insufficientStockWarning!.requestedQty
                                  );
                                handleCashChange(idx, 'amount', unitPrice * avail);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-xs cursor-pointer"
                          >
                            Sesuaikan ke {stock.insufficientStockWarning.currentStock} {stock.unit}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Expiry Date with AccessibleDatePicker */}
                    {(stock.quantityDelta > 0 || Boolean(stock.expiryDate)) && (
                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 font-medium">
                              Tanggal Kedaluwarsa:
                            </span>
                            {stock.location && (
                              <span className="text-[10px] text-amber-700 font-mono flex items-center gap-1 font-semibold">
                                <MapPin className="w-3 h-3 text-amber-600" />
                                <span>{stock.location}</span>
                              </span>
                            )}
                          </div>
                          {stock.isNewProduct && (
                            <span className="text-[10px] bg-slate-900 text-white font-semibold px-2 py-0.5 rounded-full">
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
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              stopReRecording();
              cancelConfirmationDraft();
            }}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Konfirmasi & Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
