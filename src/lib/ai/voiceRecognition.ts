'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * KASRA Hybrid Speech Recognition Engine + Real-Time Voice Visualizer
 *
 * 1. Real-Time Microphone Spectrum & Level Analyzer (`AnalyserNode`)
 *    - Measures live voice amplitude (`audioLevel`: 0..1) and 9-band voice frequencies
 *      (`audioBands`: 9 values in 0..1) so the equalizer UI bar reacts directly to the
 *      user's voice and confirms microphone reception in real time.
 *
 * 2. Primary STT: Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
 *    - Handles transient network/no-speech states silently without `console.warn` spam.
 *    - Prevents 0ms infinite restart loops when `onerror` returns `'network'`.
 *
 * 3. Automatic Fallback STT: Web Audio API (16kHz PCM) + VAD + Peak Normalization + Whisper AI
 *    - Trims leading/trailing silence (VAD), removes DC offset, and peak-normalizes voice audio
 *      to 0.90 amplitude so quiet microphones are clear.
 *    - Uses `Xenova/whisper-base` with `no_repeat_ngram_size: 2` and `repetition_penalty: 1.25`
 *      plus post-processing de-duplication so repetition loops like "-Handur. -Handur." never occur.
 */

let sessionWebSpeechBlocked = false;

let sharedWhisperWorker: Worker | null = null;
let whisperWorkerReady = false;
type WorkerCallback = (result: { text?: string; status?: string; error?: string }) => void;
const workerListeners = new Set<WorkerCallback>();

const EMPTY_BANDS = [0, 0, 0, 0, 0, 0, 0, 0, 0];

function getOrCreateWhisperWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (sharedWhisperWorker) return sharedWhisperWorker;

  const workerCode = `
    import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

    env.allowLocalModels = false;
    env.useBrowserCache = true;

    let transcriberPromise = null;

    async function getTranscriber() {
      if (!transcriberPromise) {
        self.postMessage({ status: 'loading' });
        transcriberPromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
          quantized: true,
        }).then((instance) => {
          self.postMessage({ status: 'ready' });
          return instance;
        }).catch(async () => {
          // Fallback to whisper-tiny if whisper-base fails to fetch
          const fallback = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
            quantized: true,
          });
          self.postMessage({ status: 'ready' });
          return fallback;
        });
      }
      return transcriberPromise;
    }

    self.onmessage = async (event) => {
      const { type, audio } = event.data || {};
      if (type === 'preload') {
        try {
          await getTranscriber();
        } catch (err) {
          self.postMessage({ status: 'error', error: String(err?.message || err) });
        }
        return;
      }

      if (type === 'transcribe' && audio) {
        try {
          const transcriber = await getTranscriber();
          self.postMessage({ status: 'transcribing' });
          const output = await transcriber(audio, {
            language: 'indonesian',
            task: 'transcribe',
            chunk_length_s: 30,
            stride_length_s: 5,
            no_repeat_ngram_size: 2,
            repetition_penalty: 1.25,
            temperature: 0,
            return_timestamps: false,
          });
          const rawText = Array.isArray(output)
            ? output.map((o) => o.text).join(' ')
            : (output?.text || '');
          self.postMessage({ status: 'done', text: rawText.trim() });
        } catch (err) {
          self.postMessage({ status: 'error', error: String(err?.message || err) });
        }
      }
    };
  `;

  try {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl, { type: 'module' });

    worker.onmessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (data.status === 'ready') {
        whisperWorkerReady = true;
      }
      workerListeners.forEach((cb) => cb(data));
    };

    sharedWhisperWorker = worker;
    return worker;
  } catch {
    return null;
  }
}

/**
 * Resample arbitrary Float32Array audio buffer to 16000 Hz mono for Whisper ASR.
 */
function resampleTo16kHz(samples: Float32Array, sourceRate: number): Float32Array {
  if (sourceRate === 16000) return samples;
  const ratio = sourceRate / 16000;
  const targetLength = Math.round(samples.length / ratio);
  const result = new Float32Array(targetLength);
  for (let i = 0; i < targetLength; i++) {
    const srcIdx = i * ratio;
    const low = Math.floor(srcIdx);
    const high = Math.min(samples.length - 1, low + 1);
    const weight = srcIdx - low;
    result[i] = samples[low] * (1 - weight) + samples[high] * weight;
  }
  return result;
}

/**
 * Voice Activity Detection (VAD) Trimming + DC Offset Removal + Peak Normalization.
 * Returns null if the buffer contains only silence/background hum so Whisper never hallucinates.
 */
function prepareSpeechAudioForWhisper(samples16k: Float32Array): Float32Array | null {
  const n = samples16k.length;
  if (n < 4800) return null; // Require at least 300ms of audio

  // 1. Remove DC offset
  let mean = 0;
  for (let i = 0; i < n; i++) {
    mean += samples16k[i];
  }
  mean /= n;

  const centered = new Float32Array(n);
  let globalPeak = 0;
  for (let i = 0; i < n; i++) {
    const v = samples16k[i] - mean;
    centered[i] = v;
    const abs = Math.abs(v);
    if (abs > globalPeak) globalPeak = abs;
  }

  // If peak is microscopic, microphone captured only dead air
  if (globalPeak < 0.012) return null;

  // 2. Frame-by-frame RMS analysis (50ms = 800 samples at 16kHz)
  const frameSize = 800;
  const numFrames = Math.floor(n / frameSize);
  if (numFrames < 4) return null;

  const frameRms = new Float32Array(numFrames);
  let minFrameRms = Infinity;
  let maxFrameRms = 0;

  for (let f = 0; f < numFrames; f++) {
    let sumSq = 0;
    const base = f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      const s = centered[base + i];
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / frameSize);
    frameRms[f] = rms;
    if (rms < minFrameRms) minFrameRms = rms;
    if (rms > maxFrameRms) maxFrameRms = rms;
  }

  // Dynamic voice threshold above background noise floor
  const voiceThreshold = Math.max(0.012, minFrameRms * 2.2, maxFrameRms * 0.18);
  let voicedFrames = 0;
  let firstVoicedFrame = -1;
  let lastVoicedFrame = -1;

  for (let f = 0; f < numFrames; f++) {
    if (frameRms[f] >= voiceThreshold) {
      voicedFrames++;
      if (firstVoicedFrame === -1) firstVoicedFrame = f;
      lastVoicedFrame = f;
    }
  }

  // Require at least 200ms (4 frames) of real human voice energy
  if (voicedFrames < 4 || firstVoicedFrame === -1) {
    return null;
  }

  // 3. Trim silence with 150ms (3 frames) lead-in and 200ms (4 frames) trail-out padding
  const startSample = Math.max(0, (firstVoicedFrame - 3) * frameSize);
  const endSample = Math.min(n, (lastVoicedFrame + 5) * frameSize);
  const trimmedLen = endSample - startSample;
  if (trimmedLen < 4000) return null;

  // 4. Peak-normalize to 0.90 so quiet laptop microphones sound loud and clear to Whisper
  const normalized = new Float32Array(trimmedLen);
  let trimmedPeak = 0;
  for (let i = 0; i < trimmedLen; i++) {
    const abs = Math.abs(centered[startSample + i]);
    if (abs > trimmedPeak) trimmedPeak = abs;
  }

  const gain = trimmedPeak > 0.001 ? Math.min(25, 0.9 / trimmedPeak) : 1;
  for (let i = 0; i < trimmedLen; i++) {
    normalized[i] = Math.max(-1, Math.min(1, centered[startSample + i] * gain));
  }

  return normalized;
}

/**
 * Filter Whisper silence hallucinations AND collapse any token repetition loops
 * (e.g., "-Handur. -Handur. -Handur." -> "").
 */
function cleanWhisperOutput(text: string): string {
  let cleaned = text
    .replace(/\[.*?\]|\(.*?\)|♪.*?♪/g, '')
    .replace(/(?:^|\s)-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Collapse repeated words/short phrases (e.g. "Handur. Handur. Handur." -> "Handur")
  cleaned = cleaned.replace(/\b([\w']+(?:\s+[\w']+)?)(?:[\s.,!?;:-]+\1\b){2,}/gi, '$1').trim();
  cleaned = cleaned.replace(/^[.,!?;:\-–—\s]+|[.,!?;:\-–—\s]+$/g, '').trim();

  const lower = cleaned.toLowerCase();
  const hallucinations = new Set([
    'terima kasih',
    'terimakasih',
    'terima kasih telah menonton',
    'sampai jumpa',
    'subtitle oleh',
    'subtitles by',
    'thank you',
    'you',
    'handur',
    'hadir',
    'halo',
    'hmm',
    'eh',
    'ah',
  ]);
  if (hallucinations.has(lower) || cleaned.length < 2) return '';
  return cleaned;
}

export interface UseKasraVoiceOptions {
  isOpen?: boolean;
  onTranscriptChange: (text: string) => void;
}

export interface UseKasraVoiceReturn {
  isRecording: boolean;
  isProcessingSpeech: boolean;
  audioLevel: number;
  audioBands: number[];
  statusHint: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
}

export function useKasraVoiceRecognition({
  isOpen = true,
  onTranscriptChange,
}: UseKasraVoiceOptions): UseKasraVoiceReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBands, setAudioBands] = useState<number[]>(EMPTY_BANDS);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const isRecordingRef = useRef(false);
  const isProcessingSpeechRef = useRef(false);
  const isWorkerBusyRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkRetryCountRef = useRef(0);
  const usingFallbackRef = useRef(false);
  const committedTranscriptRef = useRef('');

  // Web Audio + Visualizer + VAD refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(16000);
  const hadVoiceSinceLastFlushRef = useRef<boolean>(false);
  const lastVoiceTimestampRef = useRef<number>(0);
  const lastFlushTimestampRef = useRef<number>(0);

  const onTranscriptChangeRef = useRef(onTranscriptChange);
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  const cleanupAudioPipeline = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
    setAudioBands(EMPTY_BANDS);
  }, []);

  const cleanupWebSpeech = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {}
    }
  }, []);

  const flushFallbackTranscription = useCallback((isFinalStop = false) => {
    if (isWorkerBusyRef.current && !isFinalStop) return;
    if (!hadVoiceSinceLastFlushRef.current && !isFinalStop) return;

    const chunks = pcmChunksRef.current;
    if (chunks.length === 0) return;

    const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
    if (totalLen < sampleRateRef.current * 0.35) return;

    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const resampled16k = resampleTo16kHz(merged, sampleRateRef.current);
    const prepared = prepareSpeechAudioForWhisper(resampled16k);
    if (!prepared) {
      return;
    }

    const worker = getOrCreateWhisperWorker();
    if (worker) {
      hadVoiceSinceLastFlushRef.current = false;
      lastFlushTimestampRef.current = performance.now();
      isWorkerBusyRef.current = true;
      isProcessingSpeechRef.current = true;
      setIsProcessingSpeech(true);
      worker.postMessage({ type: 'transcribe', audio: prepared });
    }
  }, []);

  // Listen to Whisper worker events
  useEffect(() => {
    const handleWorkerMessage: WorkerCallback = (data) => {
      if (!usingFallbackRef.current && !isProcessingSpeechRef.current) return;

      if (data.status === 'loading') {
        setStatusHint('Menyiapkan mesin suara AI lokal (hanya sekali)...');
      } else if (data.status === 'ready') {
        setStatusHint(isRecordingRef.current ? 'Mendengarkan suara Anda...' : null);
      } else if (data.status === 'transcribing') {
        setStatusHint('Menerjemahkan suara ke teks...');
      } else if (data.status === 'done') {
        isWorkerBusyRef.current = false;
        isProcessingSpeechRef.current = false;
        setIsProcessingSpeech(false);
        setStatusHint(isRecordingRef.current ? 'Mendengarkan suara Anda...' : null);
        if (typeof data.text === 'string') {
          const cleaned = cleanWhisperOutput(data.text);
          if (cleaned) {
            onTranscriptChangeRef.current(cleaned);
          }
        }
      } else if (data.status === 'error') {
        isWorkerBusyRef.current = false;
        isProcessingSpeechRef.current = false;
        setIsProcessingSpeech(false);
        setStatusHint('Layanan suara tidak merespons. Silakan ketik perintah di kolom teks.');
      }
    };

    workerListeners.add(handleWorkerMessage);
    return () => {
      workerListeners.delete(handleWorkerMessage);
    };
  }, []);

  /**
   * Starts real-time microphone audio capture + 9-band frequency visualizer.
   * Also buffers 16kHz PCM chunks so that if Web Speech API fails with 'network'
   * or is blocked, Whisper AI can transcribe the exact spoken audio without losing a word.
   */
  const startAudioMonitorAndCapture = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      return;
    }

    // Avoid opening duplicate streams if already active
    if (mediaStreamRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!isRecordingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx: AudioContext = new AudioCtx();
      audioContextRef.current = audioCtx;
      sampleRateRef.current = audioCtx.sampleRate || 16000;

      const source = audioCtx.createMediaStreamSource(stream);

      // 1. Real-time frequency & amplitude analyser for the 9-bar UI equalizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // 32 frequency bins
      analyser.smoothingTimeConstant = 0.55;
      analyserRef.current = analyser;
      source.connect(analyser);

      // 2. PCM recorder node for local Whisper AI fallback
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      processorRef.current = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!isRecordingRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      let lastUiUpdate = 0;

      const updateVisualizer = (now: number) => {
        if (!isRecordingRef.current || !analyserRef.current) return;

        // Throttle React state updates to ~30fps for smooth, low-CPU animations
        if (now - lastUiUpdate >= 33) {
          lastUiUpdate = now;
          analyserRef.current.getByteTimeDomainData(timeData);
          analyserRef.current.getByteFrequencyData(freqData);

          // Compute real-time RMS voice level from time-domain waveform
          let sumSq = 0;
          for (let i = 0; i < timeData.length; i++) {
            const norm = (timeData[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / timeData.length);
          // Map typical speech RMS (0.015 .. 0.25) to visual 0..1 level
          const normalizedLevel =
            rms < 0.012 ? 0 : Math.min(1, Math.pow((rms - 0.012) / 0.22, 0.7));

          setAudioLevel(normalizedLevel);

          // Map human speech frequency bins (bins 1..14) into 9 expressive equalizer bars
          const binIndices = [1, 2, 3, 4, 5, 6, 8, 10, 12];
          const nextBands = binIndices.map((binIdx) => {
            if (normalizedLevel < 0.03) return 0;
            const rawBin = (freqData[binIdx] || 0) / 255;
            return Math.min(1, Math.max(normalizedLevel * 0.35, Math.pow(rawBin, 0.85)));
          });
          setAudioBands(nextBands);

          // Track voice activity for smart Whisper fallback triggering
          if (normalizedLevel >= 0.08) {
            hadVoiceSinceLastFlushRef.current = true;
            lastVoiceTimestampRef.current = now;
          } else if (
            usingFallbackRef.current &&
            whisperWorkerReady &&
            !isWorkerBusyRef.current &&
            hadVoiceSinceLastFlushRef.current &&
            now - lastVoiceTimestampRef.current > 750 &&
            now - lastFlushTimestampRef.current > 1400
          ) {
            // User finished a phrase and paused for 750ms -> transcribe immediately!
            flushFallbackTranscription(false);
          }
        }

        rafIdRef.current = requestAnimationFrame(updateVisualizer);
      };

      rafIdRef.current = requestAnimationFrame(updateVisualizer);
    } catch {
      isRecordingRef.current = false;
      setIsRecording(false);
      setStatusHint('Izin mikrofon ditolak atau tidak tersedia.');
    }
  }, [flushFallbackTranscription]);

  const activateFallbackMode = useCallback(() => {
    usingFallbackRef.current = true;
    const worker = getOrCreateWhisperWorker();
    if (worker) {
      worker.postMessage({ type: 'preload' });
    }
    setStatusHint(
      whisperWorkerReady
        ? 'Mendengarkan suara Anda...'
        : 'Mendengarkan & menyiapkan AI suara lokal...'
    );
    startAudioMonitorAndCapture();
  }, [startAudioMonitorAndCapture]);

  const startWebSpeechRecognition = useCallback(
    (useContinuous: boolean) => {
      if (typeof window === 'undefined') return;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition || sessionWebSpeechBlocked) {
        activateFallbackMode();
        return;
      }

      cleanupWebSpeech();

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = useContinuous;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event: any) => {
          networkRetryCountRef.current = 0;
          let interimSegment = '';
          let finalSegment = '';
          for (let i = 0; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalSegment += piece + ' ';
            } else {
              interimSegment += piece;
            }
          }
          if (!useContinuous && finalSegment.trim()) {
            committedTranscriptRef.current = (
              committedTranscriptRef.current +
              ' ' +
              finalSegment.trim()
            ).trim();
          }
          const combined = useContinuous
            ? (finalSegment + interimSegment).trim()
            : (committedTranscriptRef.current + ' ' + interimSegment).trim();

          if (combined) {
            onTranscriptChangeRef.current(combined);
          }
        };

        recognition.onerror = (e: any) => {
          const errCode = e?.error || '';

          if (errCode === 'no-speech' || errCode === 'aborted') {
            return;
          }

          if (errCode === 'network') {
            networkRetryCountRef.current += 1;

            if (networkRetryCountRef.current === 1 && useContinuous && isRecordingRef.current) {
              cleanupWebSpeech();
              restartTimerRef.current = setTimeout(() => {
                if (isRecordingRef.current) {
                  startWebSpeechRecognition(false);
                }
              }, 250);
              return;
            }

            sessionWebSpeechBlocked = true;
            cleanupWebSpeech();
            if (isRecordingRef.current) {
              activateFallbackMode();
            }
            return;
          }

          if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
            isRecordingRef.current = false;
            setIsRecording(false);
            setStatusHint('Izin mikrofon diblokir oleh browser.');
            cleanupWebSpeech();
            cleanupAudioPipeline();
            return;
          }

          isRecordingRef.current = false;
          setIsRecording(false);
          cleanupWebSpeech();
          cleanupAudioPipeline();
        };

        recognition.onend = () => {
          if (
            isRecordingRef.current &&
            !sessionWebSpeechBlocked &&
            !usingFallbackRef.current &&
            networkRetryCountRef.current === 0
          ) {
            restartTimerRef.current = setTimeout(() => {
              if (isRecordingRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch {}
              }
            }, 250);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        sessionWebSpeechBlocked = true;
        if (isRecordingRef.current) {
          activateFallbackMode();
        }
      }
    },
    [cleanupWebSpeech, cleanupAudioPipeline, activateFallbackMode]
  );

  const stopRecording = useCallback(() => {
    const wasUsingFallback = usingFallbackRef.current;
    isRecordingRef.current = false;
    setIsRecording(false);
    cleanupWebSpeech();

    if (wasUsingFallback) {
      flushFallbackTranscription(true);
      cleanupAudioPipeline();
      usingFallbackRef.current = false;
    } else {
      cleanupAudioPipeline();
      setStatusHint(null);
    }
  }, [cleanupAudioPipeline, cleanupWebSpeech, flushFallbackTranscription]);

  const startRecording = useCallback(() => {
    committedTranscriptRef.current = '';
    pcmChunksRef.current = [];
    hadVoiceSinceLastFlushRef.current = false;
    lastVoiceTimestampRef.current = performance.now();
    lastFlushTimestampRef.current = performance.now();
    onTranscriptChangeRef.current('');
    setStatusHint(null);
    networkRetryCountRef.current = 0;
    usingFallbackRef.current = false;
    isRecordingRef.current = true;
    setIsRecording(true);

    // Start real-time microphone visualizer & audio capture immediately
    startAudioMonitorAndCapture();
    startWebSpeechRecognition(true);
  }, [startAudioMonitorAndCapture, startWebSpeechRecognition]);

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [startRecording, stopRecording]);

  useEffect(() => {
    if (!isOpen) {
      isRecordingRef.current = false;
      usingFallbackRef.current = false;
      isProcessingSpeechRef.current = false;
      isWorkerBusyRef.current = false;
      setIsRecording(false);
      setIsProcessingSpeech(false);
      setStatusHint(null);
      cleanupWebSpeech();
      cleanupAudioPipeline();
    }
    return () => {
      isRecordingRef.current = false;
      usingFallbackRef.current = false;
      isProcessingSpeechRef.current = false;
      isWorkerBusyRef.current = false;
      cleanupWebSpeech();
      cleanupAudioPipeline();
    };
  }, [isOpen, cleanupWebSpeech, cleanupAudioPipeline]);

  return {
    isRecording,
    isProcessingSpeech,
    audioLevel,
    audioBands,
    statusHint,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
