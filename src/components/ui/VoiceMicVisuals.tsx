'use client';

import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceMicOrbProps {
  isRecording: boolean;
  onToggle: () => void;
  transcript?: string;
  audioLevel?: number;
  audioBands?: number[];
  isProcessingSpeech?: boolean;
  accent?: 'emerald' | 'indigo';
  idleHint?: string;
  listeningHint?: string;
}

const DEFAULT_BANDS = [0, 0, 0, 0, 0, 0, 0, 0, 0];
// Subtle symmetric weighting so center bars naturally peak higher on human vowels
const BAND_WEIGHTS = [0.65, 0.82, 0.95, 0.88, 1.0, 0.9, 0.95, 0.8, 0.65];

export const VoiceMicOrb: React.FC<VoiceMicOrbProps> = ({
  isRecording,
  onToggle,
  audioLevel = 0,
  audioBands = DEFAULT_BANDS,
  isProcessingSpeech = false,
  accent = 'emerald',
  idleHint = 'Klik tombol mikrofon untuk mulai berbicara',
  listeningHint = 'Sedang mendengarkan suara Anda... Klik mikrofon untuk selesai',
}) => {
  const isIndigo = accent === 'indigo';
  const isVoiceDetected = isRecording && audioLevel >= 0.04;

  // Dynamic scale for outer reactive voice halo (1.0 when silent -> up to 1.32 when loud)
  const reactiveScale = isRecording ? 1 + Math.min(0.35, audioLevel * 0.38) : 1;

  return (
    <div className="flex flex-col items-center gap-3.5 select-none">
      {/* Main Interactive Mic Orb */}
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Voice-Reactive Concentric Rings when recording */}
        {isRecording && (
          <>
            {/* Outer ripple that only pulses when actual voice is detected */}
            {isVoiceDetected && (
              <span
                className={`absolute w-20 h-20 rounded-full animate-kasra-sonar pointer-events-none ${
                  isIndigo
                    ? 'bg-indigo-500/25 border border-indigo-400/50'
                    : 'bg-emerald-500/25 border border-emerald-400/50'
                }`}
              />
            )}

            {/* Direct real-time volume aura ring */}
            <span
              style={{
                transform: `scale(${reactiveScale.toFixed(3)})`,
                opacity: isVoiceDetected ? Math.min(0.95, 0.35 + audioLevel * 0.65) : 0.2,
              }}
              className={`absolute w-24 h-24 rounded-full transition-transform duration-75 pointer-events-none border-2 ${
                isIndigo
                  ? 'bg-indigo-500/15 border-indigo-400/60'
                  : 'bg-emerald-500/15 border-emerald-400/60'
              }`}
            />
          </>
        )}

        {/* Ambient Soft Ring when idle */}
        {!isRecording && (
          <span className="absolute w-24 h-24 rounded-full bg-slate-100 border border-slate-200/80 pointer-events-none" />
        )}

        <button
          type="button"
          onClick={onToggle}
          aria-label={isRecording ? 'Selesai berbicara' : 'Mulai berbicara'}
          className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-150 relative z-10 cursor-pointer active:scale-95 ${
            isRecording
              ? isIndigo
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/35 ring-4 ring-indigo-500/20'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/35 ring-4 ring-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl ring-4 ring-white'
          }`}
        >
          <Mic
            style={{
              transform: isVoiceDetected
                ? `scale(${(1 + Math.min(0.16, audioLevel * 0.18)).toFixed(3)})`
                : 'scale(1)',
            }}
            className="w-7 h-7 transition-transform duration-75"
          />
          {isRecording && (
            <span className="mt-1 flex items-end gap-0.5 h-3.5">
              {[0.75, 1.0, 0.75].map((w, idx) => {
                const barH = isVoiceDetected
                  ? Math.max(4, Math.min(13, Math.round(4 + audioLevel * 10 * w)))
                  : 3;
                return (
                  <span
                    key={idx}
                    style={{ height: `${barH}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isVoiceDetected ? 'bg-white' : 'bg-white/45'
                    }`}
                  />
                );
              })}
            </span>
          )}
        </button>
      </div>

      {/* Live Voice-Reactive 9-Bar Equalizer Strip + Reception Status Pill */}
      {isRecording || isProcessingSpeech ? (
        <div className="flex flex-col items-center gap-2 animate-in fade-in duration-150">
          <div
            className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border shadow-2xs transition-colors duration-150 ${
              isIndigo
                ? isVoiceDetected
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
                : isVoiceDetected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {/* 9-Bar Real-Time Microphone Spectrum Equalizer */}
            <span className="flex items-center gap-1 h-6" aria-hidden="true">
              {BAND_WEIGHTS.map((weight, i) => {
                const bandVal = audioBands[i] ?? 0;
                const combinedEnergy = Math.max(bandVal, audioLevel * 0.75) * weight;
                // Flat 3px when silent; jumps up to 22px in real time when speaking
                const heightPx = isVoiceDetected
                  ? Math.max(4, Math.min(22, Math.round(3 + combinedEnergy * 20)))
                  : 3;

                return (
                  <span
                    key={i}
                    style={{ height: `${heightPx}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isVoiceDetected
                        ? isIndigo
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  />
                );
              })}
            </span>

            {/* Live Reception Status Indicator */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-150 ${
                  isProcessingSpeech
                    ? 'bg-amber-500 animate-pulse'
                    : isVoiceDetected
                      ? isIndigo
                        ? 'bg-indigo-600 animate-ping'
                        : 'bg-emerald-600 animate-ping'
                      : 'bg-slate-400'
                }`}
              />
              <span className="text-[11px] font-bold tracking-tight">
                {isProcessingSpeech
                  ? 'Menerjemahkan suara...'
                  : isVoiceDetected
                    ? 'Suara diterima'
                    : 'Menunggu suara...'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium">{listeningHint}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 font-medium">{idleHint}</p>
      )}
    </div>
  );
};

interface VoiceInlineButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  audioLevel?: number;
  idleLabel?: string;
  recordingLabel?: string;
  className?: string;
}

export const VoiceInlineButton: React.FC<VoiceInlineButtonProps> = ({
  isRecording,
  onToggle,
  audioLevel = 0,
  idleLabel = 'Bicara',
  recordingLabel = 'Mendengarkan',
  className = '',
}) => {
  const isVoiceDetected = isRecording && audioLevel >= 0.04;

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isRecording ? 'Klik untuk selesai bicara' : 'Ucapkan dengan suara'}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
        isRecording
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
      } ${className}`}
    >
      <Mic className="w-3.5 h-3.5 shrink-0" />
      {isRecording ? (
        <>
          <span>{isVoiceDetected ? 'Suara diterima' : recordingLabel}</span>
          <span className="inline-flex items-center gap-0.5 h-3.5 ml-0.5">
            {[0.7, 1.0, 0.75].map((w, idx) => {
              const h = isVoiceDetected
                ? Math.max(4, Math.min(13, Math.round(3 + audioLevel * 10 * w)))
                : 3;
              return (
                <span
                  key={idx}
                  style={{ height: `${h}px` }}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    isVoiceDetected ? 'bg-white' : 'bg-white/45'
                  }`}
                />
              );
            })}
          </span>
        </>
      ) : (
        <span>{idleLabel}</span>
      )}
    </button>
  );
};
