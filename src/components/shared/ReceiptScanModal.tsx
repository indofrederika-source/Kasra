'use client';

import React, { useState } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { parseReceiptImage } from '@/lib/ai/parser';
import {
  ScanLine,
  X,
  Upload,
} from 'lucide-react';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({ isOpen, onClose }) => {
  const { products, setActiveDraft } = useKasra();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setIsProcessing(false);
    setSelectedImage(null);
    setReceiptName('');
    onClose();
  };

  const handleSimulateScan = () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const draft = parseReceiptImage(receiptName || 'Nota_Belanja.jpg', products);
      setActiveDraft(draft);
      setSelectedImage(null);
      setReceiptName('');
      onClose();
    }, 900);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pindai Foto Nota Belanja</h2>
              <p className="text-[11px] text-slate-500">
                Membaca baris nota untuk menyiapkan draf Kas Keluar & Stok Masuk
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload & Preview Area */}
        <div className="p-6 space-y-4">
          <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 hover:bg-slate-50/80 group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedImage ? (
              <div className="space-y-3">
                <img
                  src={selectedImage}
                  alt="Pratinjau Nota"
                  className="max-h-52 rounded-lg object-contain mx-auto border border-slate-200 shadow-xs"
                />
                <p className="text-xs text-slate-800 font-medium">{receiptName}</p>
                <p className="text-[11px] text-slate-400">Klik untuk mengganti gambar nota</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-600 group-hover:text-slate-900 shadow-2xs transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Ambil Foto Nota atau Unggah Berkas Gambar
                </div>
                <p className="text-[11px] text-slate-400">
                  Mendukung format JPG, PNG, atau WEBP. Rincian draf dapat diedit kembali sebelum disimpan.
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleCloseModal}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <button
            onClick={handleSimulateScan}
            disabled={!selectedImage || isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <span>{isProcessing ? 'Memproses Nota...' : 'Pindai Nota'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
