'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { parseOmniboxInput, autocorrectIndonesianVoice } from '@/lib/ai/parser';
import { useKasraVoiceRecognition } from '@/lib/ai/voiceRecognition';
import { VoiceMicOrb } from '@/components/ui/VoiceMicVisuals';
import {
  Mic,
  X,
  CheckCircle2,
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
  contextType = 'omni',
}) => {
  const { products, categoryDefinitions, setActiveDraft } = useKasra();
  const [transcript, setTranscript] = useState('');

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

  // Real-time live context and intent detection with autocorrect
  const liveFeedback = useMemo(() => {
    return autocorrectIndonesianVoice(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
    }
  }, [isOpen]);

  const handleProcessInput = (inputText: string) => {
    const textToProcess = inputText.trim();
    if (!textToProcess) return;

    stopRecording();
    const draft = parseOmniboxInput(textToProcess, products, categoryDefinitions);
    setActiveDraft(draft);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {contextType === 'omni' ? 'Input Suara Pintar Kasra' : 'Input Suara Gudang'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Otomatis terhubung ke Buku Kas, Gudang, Kategori, & Analisis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Input Body */}
        <div className="p-6 space-y-5 flex flex-col items-center text-center">
          {/* Sleek Live Voice Mic Visualizer (Never Muted Icon) */}
          <VoiceMicOrb
            isRecording={isRecording}
            onToggle={toggleRecording}
            transcript={transcript}
            audioLevel={audioLevel}
            audioBands={audioBands}
            isProcessingSpeech={isProcessingSpeech}
            accent="emerald"
            idleHint={statusHint || 'Klik tombol mikrofon untuk mulai berbicara, atau ketik perintah di kolom bawah:'}
            listeningHint={statusHint || 'Sedang mendengarkan ucapan Anda... Klik mikrofon untuk selesai.'}
          />

          {/* Transcript Area */}
          <div className="w-full space-y-2">
            <div className="relative">
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Ucapkan atau ketik transaksi, stok masuk/keluar, biaya, atau kategori baru..."
                className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-2xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed transition-colors shadow-2xs"
              />
            </div>

            {/* Live Autocorrect & Context Pill */}
            {transcript.trim() && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1.5 animate-in fade-in duration-150">
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
                  <span className="text-[11px] text-slate-500">
                    {liveFeedback.suggestedAction}
                  </span>
                </div>
                {liveFeedback.cleanedText.toLowerCase() !== transcript.toLowerCase().trim() && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-200">
                    <span className="text-slate-400">Terkoreksi:</span>
                    <span className="font-medium text-slate-900 italic">"{liveFeedback.cleanedText}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Neutral Voice Command Syntax Guide */}
          <div className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 block">
              Format Perintah yang Didukung:
            </span>
            <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside leading-relaxed">
              <li>Penjualan: <span className="text-slate-700 font-medium">"Ada yang beli [barang] [jumlah]"</span> atau <span className="text-slate-700 font-medium">"Laku [jumlah] [barang]"</span></li>
              <li>Kulakan / Stok Masuk: <span className="text-slate-700 font-medium">"Kulakan [barang] [jumlah] seharga [nominal]"</span></li>
              <li>Pengeluaran Kas: <span className="text-slate-700 font-medium">"Bayar [keperluan] [nominal]"</span></li>
              <li>Kategori: <span className="text-slate-700 font-medium">"Tambah kategori [nama]"</span> atau <span className="text-slate-700 font-medium">"Tambah sub-kategori [sub] di [kategori]"</span></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={() => handleProcessInput(transcript)}
            disabled={!transcript.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Tinjau Draf Konfirmasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
