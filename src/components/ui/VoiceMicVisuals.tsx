'use client';

import React, { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';

interface VoiceMicOrbProps {
  isRecording: boolean;
  onToggle: () => void;
  transcript?: string;
  accent?: 'emerald' | 'indigo';
  idleHint?: string;
  listeningHint?: string;
}

const BAR_HEIGHTS = [14, 22, 30, 18, 34, 24, 30, 20, 14];
const BAR_DELAYS = ['0ms', '110ms', '220ms', '70ms', '180ms', '290ms', '130ms', '240ms', '60ms'];
const BAR_DURATIONS = ['0.75s', '0.9s', '0.68s', '0.95s', '0.72s', '0.88s', '0.7s', '0.92s', '0.8s'];

export const VoiceMicOrb: React.FC<VoiceMicOrbProps> = ({
  isRecording,
  onToggle,
  transcript = '',
  accent = 'emerald',
  idleHint = 'Klik tombol mikrofon untuk mulai berbicara',
  listeningHint = 'Sedang mendengarkan suara Anda... Klik mikrofon untuk selesai',
}) => {
  const [voiceBoost, setVoiceBoost] = useState(false);

  // Boost wave height dynamically whenever live speech words stream in
  useEffect(() => {
    if (!isRecording || !transcript) return;
    setVoiceBoost(true);
    const t = setTimeout(() => setVoiceBoost(false), 320);
    return () => clearTimeout(t);
  }, [transcript, isRecording]);

  const isIndigo = accent === 'indigo';

  return (
    <div className="flex flex-col items-center gap-3.5 select-none">
      {/* Main Interactive Mic Orb */}
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Dual Concentric Sonar Ripples when actively speaking */}
        {isRecording && (
          <>
            <span
              className={`absolute w-20 h-20 rounded-full animate-kasra-sonar pointer-events-none ${
                isIndigo ? 'bg-indigo-500/25 border border-indigo-400/50' : 'bg-emerald-500/25 border border-emerald-400/50'
              }`}
            />
            <span
              style={{ animationDelay: '0.85s' }}
              className={`absolute w-20 h-20 rounded-full animate-kasra-sonar pointer-events-none ${
                isIndigo ? 'bg-indigo-500/20 border border-indigo-400/40' : 'bg-emerald-500/20 border border-emerald-400/40'
              }`}
            />
            <span
              className={`absolute w-24 h-24 rounded-full transition-transform duration-200 pointer-events-none ${
                voiceBoost ? 'scale-110' : 'scale-100'
              } ${isIndigo ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}
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
          className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-200 relative z-10 cursor-pointer active:scale-95 ${
            isRecording
              ? isIndigo
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/35 ring-4 ring-indigo-500/20'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/35 ring-4 ring-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl ring-4 ring-white'
          }`}
        >
          {/* Always a clean, active Microphone icon — never a muted/crossed-out icon */}
          <Mic
            className={`w-7 h-7 transition-transform duration-150 ${
              isRecording && voiceBoost ? 'scale-110' : 'scale-100'
            }`}
          />
          {isRecording && (
            <span className="mt-1 flex items-center gap-0.5">
              <span className="w-1 h-2.5 rounded-full bg-white/90 animate-kasra-wave" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-3.5 rounded-full bg-white animate-kasra-wave" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2.5 rounded-full bg-white/90 animate-kasra-wave" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </button>
      </div>

      {/* Live 9-Bar Soundwave Equalizer Strip + Status Badge */}
      {isRecording ? (
        <div className="flex flex-col items-center gap-2 animate-in fade-in duration-150">
          <div
            className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full border shadow-2xs ${
              isIndigo
                ? 'bg-indigo-50/90 border-indigo-200 text-indigo-800'
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="flex items-center gap-1 h-5">
              {BAR_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: `${voiceBoost ? Math.min(22, Math.round(h * 0.72)) : Math.round(h * 0.55)}px`,
                    animationDelay: BAR_DELAYS[i],
                    animationDuration: BAR_DURATIONS[i],
                  }}
                  className={`w-1 rounded-full animate-kasra-wave ${
                    isIndigo ? 'bg-indigo-500' : 'bg-emerald-500'
                  }`}
                />
              ))}
            </span>
            <span className="text-[11px] font-bold tracking-tight">Mendengarkan...</span>
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
  idleLabel?: string;
  recordingLabel?: string;
  className?: string;
}

export const VoiceInlineButton: React.FC<VoiceInlineButtonProps> = ({
  isRecording,
  onToggle,
  idleLabel = 'Bicara',
  recordingLabel = 'Mendengarkan',
  className = '',
}) => {
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
          <span>{recordingLabel}</span>
          <span className="inline-flex items-center gap-0.5 h-3.5 ml-0.5">
            <span className="w-0.5 h-2.5 bg-white rounded-full animate-kasra-wave" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-3.5 bg-white rounded-full animate-kasra-wave" style={{ animationDelay: '140ms' }} />
            <span className="w-0.5 h-2 bg-white rounded-full animate-kasra-wave" style={{ animationDelay: '280ms' }} />
          </span>
        </>
      ) : (
        <span>{idleLabel}</span>
      )}
    </button>
  );
};
