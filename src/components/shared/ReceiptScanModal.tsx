'use client';

import React, { useState } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { parseReceiptImage } from '@/lib/ai/parser';
import {
  ScanLine,
  X,
  Upload,
  FileText,
} from 'lucide-react';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({ isOpen, onClose }) => {
  const { products, setActiveDraft } = useKasra();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('Nota_Grosir_Sembako_Agen_Berkah.jpg');

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const draft = parseReceiptImage(receiptName, products);
      setActiveDraft(draft);
      onClose();
    }, 1200);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#171719] border-b border-[#28282e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#242428] border border-[#303036] flex items-center justify-center text-stone-200">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Scan Foto Nota Belanja Grosir</h2>
              <p className="text-[11px] text-[#8a8a92]">
                AI otomatis membaca baris nota untuk update Kas Keluar & Stok Masuk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload & Preview Area */}
        <div className="p-6 space-y-4">
          <label className="border-2 border-dashed border-[#2c2c32] hover:border-white/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#171719] group">
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
                  alt="Preview Nota"
                  className="max-h-48 rounded-lg object-contain mx-auto border border-[#2c2c32]"
                />
                <p className="text-xs text-stone-300 font-medium">{receiptName}</p>
                <p className="text-[11px] text-[#71717a]">Klik untuk mengganti gambar</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#202024] border border-[#2c2c32] flex items-center justify-center mx-auto text-stone-400 group-hover:text-white transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-stone-200">
                  Ambil Foto Nota atau Unggah Berkas
                </div>
                <p className="text-[11px] text-[#71717a]">Mendukung format JPG, PNG, atau HEIC dari ponsel</p>
              </div>
            )}
          </label>

          {/* 1-Click Sample Nota Button */}
          <div className="p-3.5 rounded-xl bg-[#171719] border border-[#2c2c32] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-stone-300 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-stone-200">
                  Gunakan Contoh Nota Grosir Agen Berkah
                </div>
                <div className="text-[11px] text-[#8a8a92]">
                  (Susu Diamond 12L, Gula Aren 6L, Cup 100 pcs)
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedImage(
                  'https://images.unsplash.com/photo-1554415707-9e49fe83320c?w=500&auto=format&fit=crop&q=80'
                );
                setReceiptName('Nota_Grosir_Agen_Berkah_26Okt.jpg');
              }}
              className="px-3 py-1.5 rounded-full bg-[#202024] hover:bg-[#28282e] text-white border border-[#2c2c32] text-[11px] font-medium transition-colors"
            >
              Pilih Contoh
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#171719] border-t border-[#28282e] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-stone-400 hover:text-white"
          >
            Batal
          </button>

          <button
            onClick={handleSimulateScan}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-stone-200 disabled:opacity-40 text-black text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <span>{isProcessing ? 'Memproses Nota...' : 'Pindai Nota'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
