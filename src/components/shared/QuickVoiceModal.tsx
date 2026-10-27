'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { parseOmniboxInput, autocorrectIndonesianVoice } from '@/lib/ai/parser';
import {
  Mic,
  MicOff,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Tag,
  PackagePlus,
  ShoppingCart,
  Receipt,
  AlertOctagon,
} from 'lucide-react';

interface QuickVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrompt?: string;
  contextType?: 'omni' | 'storage';
}

export const QuickVoiceModal: React.FC<QuickVoiceModalProps> = ({
  isOpen,
  onClose,
  defaultPrompt,
  contextType = 'omni',
}) => {
  const { products, categoryDefinitions, setActiveDraft } = useKasra();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Real-time live context and intent detection with autocorrect
  const liveFeedback = useMemo(() => {
    return autocorrectIndonesianVoice(transcript);
  }, [transcript]);

  const samplePhrases = [
    {
      text: 'Tambahkan kategori baru Susu UHT',
      intent: 'category',
      tag: 'Kategori Baru',
    },
    {
      text: 'Tambahkan sub-kategori ayam di bahan baku',
      intent: 'category',
      tag: 'Sub-Kategori',
    },
    {
      text: 'Tambahkan stok ayam 10 ekor',
      intent: 'restock',
      tag: 'Tambah Stok',
    },
    {
      text: 'Tambahkan stok paper cup dingin 50 pcs',
      intent: 'restock',
      tag: 'Restok Gudang',
    },
    {
      text: 'Laku 3 es kopi susu aren dan 2 roti bakar',
      intent: 'sale',
      tag: 'Penjualan',
    },
    {
      text: 'Kulakan susu diamond 2 karton seharga 360 ribu',
      intent: 'restock',
      tag: 'Kulakan Grosir',
    },
    {
      text: 'Beli 2 balok es batu kristal 20 ribu',
      intent: 'expense',
      tag: 'Biaya Toko',
    },
    {
      text: 'Susu diamond basi 1 kotak dibuang',
      intent: 'loss',
      tag: 'Barang Basi',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsRecording(false);
      setTranscript('');
      return;
    }

    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };

        recognition.onerror = (e: any) => {
          if (e.error === 'no-speech') {
            // User paused speaking momentarily, do not cancel
            return;
          }
          console.warn('Speech recognition warning:', e.error || e);
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [isOpen]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecording(false);
    } else {
      setTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
      setIsRecording(true);
    }
  };

  const handleProcessInput = (inputText: string) => {
    const textToProcess = inputText.trim();
    if (!textToProcess) return;

    const draft = parseOmniboxInput(textToProcess, products, categoryDefinitions);
    setActiveDraft(draft);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#171719] border-b border-[#28282e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#242428] border border-[#303036] flex items-center justify-center text-stone-200">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {contextType === 'omni' ? 'Voice Copilot Kasra' : 'Voice Input Gudang'}
              </h2>
              <p className="text-[11px] text-[#8a8a92]">
                Paham slang Indo, tambah kategori, restok, & sinkron kas-stok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Input Body */}
        <div className="p-6 space-y-5 flex flex-col items-center text-center">
          {/* Big Recording Button */}
          <div className="relative my-1">
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            )}
            <button
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl relative z-10 ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                  : 'bg-white hover:bg-stone-200 text-black shadow-lg active:scale-95'
              }`}
            >
              {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
          </div>

          <p className="text-xs text-[#8a8a92] font-medium">
            {isRecording
              ? 'Mendengarkan ucapan Anda... Klik tombol untuk berhenti.'
              : 'Klik tombol mikrofon di atas untuk mulai merekam, atau pilih contoh di bawah:'}
          </p>

          {/* Transcript Area */}
          <div className="w-full space-y-2">
            <div className="relative">
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Bicara atau ketik... Contoh: 'Tambahkan stok ayam 10 ekor' atau 'Tambahkan kategori baru Susu UHT'..."
                className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl p-3 text-xs text-white placeholder-[#71717a] focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Live Autocorrect & Context Pill */}
            {transcript.trim() && (
              <div className="p-2.5 rounded-xl bg-[#121214] border border-[#2c2c32] text-left space-y-1.5 animate-in fade-in duration-150">
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
                  <span className="text-[11px] text-[#8a8a92]">
                    {liveFeedback.suggestedAction}
                  </span>
                </div>
                {liveFeedback.cleanedText.toLowerCase() !== transcript.toLowerCase().trim() && (
                  <div className="text-[11px] text-stone-300 flex items-center gap-1.5 pt-1 border-t border-[#26262b]">
                    <span className="text-[#8a8a92]">Terkoreksi:</span>
                    <span className="font-medium text-white italic">"{liveFeedback.cleanedText}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preset Sample Buttons for 1-Click Testing */}
          <div className="w-full text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#8a8a92]">
                Contoh Perintah Suara Cepat (Klik untuk coba):
              </span>
              <span className="text-[10px] text-[#71717a]">8 skenario siap pakai</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {samplePhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(phrase.text);
                    handleProcessInput(phrase.text);
                  }}
                  className="p-2 rounded-xl bg-[#171719] hover:bg-[#222226] text-stone-300 hover:text-white border border-[#2c2c32] text-[11px] text-left transition-colors flex items-center justify-between group"
                >
                  <div className="truncate pr-2">
                    <span className="block truncate text-white">"{phrase.text}"</span>
                    <span className="text-[9px] uppercase font-mono text-[#8a8a92] font-semibold">
                      {phrase.tag}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#71717a] group-hover:text-white shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#171719] border-t border-[#28282e] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-stone-400 hover:text-white"
          >
            Tutup
          </button>

          <button
            onClick={() => handleProcessInput(transcript)}
            disabled={!transcript.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-stone-200 disabled:opacity-40 text-black text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>Tinjau Draf Konfirmasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
