'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { Product } from '@/types';
import { formatRupiah, formatDateIndo, formatThousands, parseThousands } from '@/lib/utils';
import {
  parseProductInfoEditVoice,
  ProductVoiceEditPatch,
} from '@/lib/ai/parser';
import { VoiceMicOrb } from '@/components/ui/VoiceMicVisuals';
import { AccessibleDatePicker } from '@/components/ui/AccessibleDatePicker';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import {
  SlidersHorizontal,
  X,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Package,
} from 'lucide-react';

interface ProductVoiceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  onAppliedPatch?: (productId: string, patch: ProductVoiceEditPatch) => void;
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

export const ProductVoiceEditModal: React.FC<ProductVoiceEditModalProps> = ({
  isOpen,
  onClose,
  initialProduct = null,
  onAppliedPatch,
}) => {
  const { products, updateProduct } = useKasra();

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProduct?.id || '');
  const [editablePatch, setEditablePatch] = useState<ProductVoiceEditPatch>({});

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  // Sync initial product on open
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setEditablePatch({});
      setSelectedProductId(initialProduct?.id || products[0]?.id || '');
    } else {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  }, [isOpen, initialProduct?.id]);

  // Setup Web Speech API
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onresult = (event: any) => {
        let spoken = '';
        for (let i = 0; i < event.results.length; i++) {
          spoken += event.results[i][0].transcript;
        }
        setTranscript(spoken);
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch {
            isRecordingRef.current = false;
            setIsRecording(false);
          }
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'no-speech') return;
        if (e.error !== 'network') {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isOpen]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  // Live voice parsing whenever transcript updates
  useEffect(() => {
    if (!transcript.trim()) {
      setEditablePatch({});
      return;
    }

    // If not locked to initialProduct, allow voice to auto-select whichever product the user named
    const parsed = parseProductInfoEditVoice(
      transcript,
      products,
      initialProduct ? selectedProduct : null
    );

    if (!initialProduct && parsed.matchedProduct && parsed.matchedProduct.id !== selectedProductId) {
      setSelectedProductId(parsed.matchedProduct.id);
    }

    // Re-run against active target product so relative math ("naikin harga jual 2 ribu") uses exact product baseline
    const targetForCalc =
      (!initialProduct && parsed.matchedProduct) || selectedProduct || null;
    const finalParsed = parseProductInfoEditVoice(transcript, products, targetForCalc);
    setEditablePatch(finalParsed.changes);
  }, [transcript, products, initialProduct, selectedProduct?.id]);

  const toggleRecording = () => {
    if (isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    } else {
      setTranscript('');
      isRecordingRef.current = true;
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          isRecordingRef.current = false;
          setIsRecording(false);
        }
      }
    }
  };

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.currentStock} ${p.unit})`,
      })),
    [products]
  );

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

  const handleApplyChanges = () => {
    if (!selectedProduct || patchEntries.length === 0) return;

    isRecordingRef.current = false;
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    updateProduct(selectedProduct.id, editablePatch);
    if (onAppliedPatch) {
      onAppliedPatch(selectedProduct.id, editablePatch);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Suara Pengaturan Informasi Barang
              </h2>
              <p className="text-[11px] text-slate-500">
                Ubah harga jual, modal (HPP), kadaluarsa, lokasi, kategori, satuan, & stok cukup dengan bicara
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {products.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-900">Gudang Masih Kosong</p>
              <p className="text-xs text-slate-500">
                Tambahkan barang ke Gudang terlebih dahulu untuk mengatur informasi barang lewat suara.
              </p>
            </div>
          ) : (
            <>
              {/* Target Product Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Barang yang Diatur
                  </span>
                  <span className="text-xs text-slate-500">
                    {initialProduct
                      ? 'Terkunci ke barang ini — langsung ucapkan perubahannya'
                      : 'Otomatis terdeteksi dari nama barang yang Anda ucapkan, atau pilih manual:'}
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

              {/* Sleek Indigo Voice Orb */}
              <div className="flex flex-col items-center text-center pt-1">
                <VoiceMicOrb
                  isRecording={isRecording}
                  onToggle={toggleRecording}
                  transcript={transcript}
                  accent="indigo"
                  idleHint="Klik mikrofon lalu ucapkan perubahan informasi barang:"
                  listeningHint="Ucapkan perubahan harga, kadaluarsa, lokasi, atau info lainnya..."
                />
              </div>

              {/* Editable Spoken Textarea */}
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={
                    selectedProduct
                      ? `Contoh: "Ubah harga jual ${selectedProduct.name} jadi 15 ribu, kadaluarsa 25 November 2026, pindah ke kulkas"`
                      : 'Contoh: "Ubah harga jual leci jadi 15 ribu dan tanggal kadaluarsanya 25 November 2026"'
                  }
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 rounded-2xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed transition-colors"
                />
              </div>

              {/* Live Before -> After Preview & Inline Editor */}
              {selectedProduct && patchEntries.length > 0 && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Ringkasan Perubahan pada &quot;{selectedProduct.name}&quot; ({patchEntries.length})
                    </span>
                    <span className="text-[11px] text-slate-400">Bisa diedit sebelum disimpan</span>
                  </div>

                  <div className="space-y-2">
                    {patchEntries.map((key) => {
                      const val = editablePatch[key];
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        >
                          <div className="space-y-0.5 min-w-[155px]">
                            <span className="text-xs font-bold text-slate-900 block">
                              {FIELD_LABELS[key]}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <span>Sebelum: {formatCurrentValue(selectedProduct, key)}</span>
                              <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-1 sm:justify-end">
                            {key === 'sellingPrice' || key === 'hppAmount' ? (
                              <div className="relative w-40">
                                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatThousands(Number(val) || 0)}
                                  onChange={(e) =>
                                    updatePatchField(key, parseThousands(e.target.value))
                                  }
                                  className="w-full bg-white border border-indigo-200 rounded-xl pl-8 pr-2.5 py-1.5 text-xs font-bold font-mono text-indigo-950 focus:outline-none focus:border-indigo-500 text-right"
                                />
                              </div>
                            ) : key === 'expiryDate' ? (
                              <div className="flex-1 max-w-xs">
                                {val === null ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-semibold text-slate-700">
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
                                      className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
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
                                className="w-28 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold font-mono text-indigo-950 focus:outline-none focus:border-indigo-500 text-center"
                              />
                            ) : (
                              <input
                                type="text"
                                value={String(val || '')}
                                onChange={(e) => updatePatchField(key, e.target.value)}
                                className="w-48 bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-950 focus:outline-none focus:border-indigo-500"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => removePatchField(key)}
                              title="Batalkan perubahan kolom ini"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
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

              {/* Voice Command Examples */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Contoh Perintah Suara Lengkap (Bisa Sekaligus Banyak):
                </span>
                <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside leading-relaxed">
                  <li>
                    Harga:{' '}
                    <span className="text-slate-700 font-medium">
                      &quot;Ubah harga jual jadi 15 ribu dan harga modal jadi 9 ribu&quot;
                    </span>{' '}
                    atau <span className="text-slate-700 font-medium">&quot;Naikin harga jual 2 ribu&quot;</span>
                  </li>
                  <li>
                    Kedaluwarsa:{' '}
                    <span className="text-slate-700 font-medium">
                      &quot;Ganti tanggal kadaluarsa jadi 25 November 2026&quot;
                    </span>
                    , <span className="text-slate-700 font-medium">&quot;Perpanjang expired 7 hari&quot;</span>, atau{' '}
                    <span className="text-slate-700 font-medium">&quot;Hapus tanggal kadaluarsa&quot;</span>
                  </li>
                  <li>
                    Info Gudang:{' '}
                    <span className="text-slate-700 font-medium">
                      &quot;Pindahin lokasi ke Kulkas, ubah kategori Bahan Baku, subkategori Buah, minimal stok 10, satuan buah&quot;
                    </span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleApplyChanges}
            disabled={!selectedProduct || patchEntries.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Simpan Perubahan Barang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
