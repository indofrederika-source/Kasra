'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { formatRupiah } from '@/lib/utils';
import {
  Calculator,
  X,
  Delete,
  History,
  Copy,
  Check,
  Trash2,
  GripHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalcHistoryItem {
  id: string;
  expression: string;
  resultRaw: string;
}

function cleanFloat(n: number): number {
  if (!Number.isFinite(n)) return NaN;
  return parseFloat(n.toPrecision(12));
}

function formatCalcNumber(raw: string): string {
  if (raw === 'Error') return 'Error';
  if (!raw) return '';
  if (raw === '-') return '-';

  const isNeg = raw.startsWith('-');
  const clean = isNeg ? raw.slice(1) : raw;
  const [intPart, decPart] = clean.split('.');
  const formattedInt = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = isNeg ? '-' : '';
  return decPart !== undefined ? `${sign}${formattedInt},${decPart}` : `${sign}${formattedInt}`;
}

function evaluateTokens(exprTokens: string[]): number | null {
  if (exprTokens.length === 0) return null;
  const tokens = [...exprTokens];
  // Drop trailing operator if incomplete
  if (['+', '-', '×', '÷'].includes(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  if (tokens.length === 0) return null;

  // Pass 1: × and ÷
  const pass1: (number | string)[] = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === '×' || tok === '÷') {
      const prev = Number(pass1.pop() ?? 0);
      const next = Number(tokens[i + 1] ?? 1);
      if (tok === '÷' && next === 0) {
        return NaN; // Division by zero
      }
      const computed = tok === '×' ? cleanFloat(prev * next) : cleanFloat(prev / next);
      pass1.push(computed);
      i += 2;
    } else if (tok === '+' || tok === '-') {
      pass1.push(tok);
      i += 1;
    } else {
      const parsed = parseFloat(tok);
      if (Number.isNaN(parsed)) return null;
      pass1.push(parsed);
      i += 1;
    }
  }

  // Pass 2: + and -
  let acc = Number(pass1[0] ?? 0);
  let j = 1;
  while (j < pass1.length) {
    const op = pass1[j];
    const nextVal = Number(pass1[j + 1] ?? 0);
    if (op === '+') acc = cleanFloat(acc + nextVal);
    else if (op === '-') acc = cleanFloat(acc - nextVal);
    j += 2;
  }

  return acc;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({ isOpen, onClose }) => {
  const { setActiveDraft } = useKasra();

  const [tokens, setTokens] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('0');
  const [justEvaluated, setJustEvaluated] = useState<boolean>(false);
  const [lastCompletedExpr, setLastCompletedExpr] = useState<string>('');
  const [history, setHistory] = useState<CalcHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Draggable floating position
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  // Reset drag offset if window resizes significantly
  useEffect(() => {
    const handleResize = () => setOffset({ x: 0, y: 0 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on header buttons
    if ((e.target as HTMLElement).closest('button')) return;
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.dragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    setOffset({
      x: dragStateRef.current.originX + dx,
      y: dragStateRef.current.originY + dy,
    });
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.dragging) return;
    dragStateRef.current.dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Calculator Actions
  const handleClear = useCallback(() => {
    setTokens([]);
    setCurrentInput('0');
    setJustEvaluated(false);
    setLastCompletedExpr('');
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      setLastCompletedExpr('');
      if (justEvaluated) {
        setTokens([]);
        setCurrentInput(digit);
        setJustEvaluated(false);
        return;
      }
      setCurrentInput((prev) => {
        if (prev === 'Error' || prev === '0') return digit;
        if (prev === '') return digit;
        const digitCount = prev.replace('.', '').replace('-', '').length;
        if (digitCount >= 14) return prev;
        return prev + digit;
      });
    },
    [justEvaluated]
  );

  const handleTripleZero = useCallback(() => {
    setLastCompletedExpr('');
    if (justEvaluated) {
      setTokens([]);
      setCurrentInput('0');
      setJustEvaluated(false);
      return;
    }
    setCurrentInput((prev) => {
      if (prev === 'Error' || prev === '0' || prev === '') return '0';
      const digitCount = prev.replace('.', '').replace('-', '').length;
      if (digitCount > 11) return prev;
      return prev + '000';
    });
  }, [justEvaluated]);

  const handleDecimal = useCallback(() => {
    setLastCompletedExpr('');
    if (justEvaluated) {
      setTokens([]);
      setCurrentInput('0.');
      setJustEvaluated(false);
      return;
    }
    setCurrentInput((prev) => {
      if (prev === 'Error' || prev === '') return '0.';
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  }, [justEvaluated]);

  const handleOperator = useCallback(
    (op: '+' | '-' | '×' | '÷') => {
      setLastCompletedExpr('');
      if (currentInput === 'Error') {
        setTokens(['0', op]);
        setCurrentInput('');
        setJustEvaluated(false);
        return;
      }

      if (justEvaluated) {
        setTokens([currentInput || '0', op]);
        setCurrentInput('');
        setJustEvaluated(false);
        return;
      }

      if (currentInput === '') {
        setTokens((prev) => {
          if (prev.length >= 2) {
            return [...prev.slice(0, -1), op];
          }
          return ['0', op];
        });
        return;
      }

      const cleanedCurrent = currentInput.endsWith('.')
        ? currentInput.slice(0, -1)
        : currentInput;
      setTokens((prev) => [...prev, cleanedCurrent, op]);
      setCurrentInput('');
    },
    [currentInput, justEvaluated]
  );

  const handlePercent = useCallback(() => {
    if (currentInput === '' || currentInput === 'Error') return;
    const val = parseFloat(currentInput);
    if (Number.isNaN(val)) return;

    if (tokens.length >= 2) {
      const lastOp = tokens[tokens.length - 1];
      const baseVal = evaluateTokens(tokens.slice(0, -1));
      if (baseVal !== null && !Number.isNaN(baseVal) && (lastOp === '+' || lastOp === '-')) {
        const pctAmount = cleanFloat((baseVal * val) / 100);
        setCurrentInput(String(pctAmount));
        setJustEvaluated(false);
        return;
      }
    }

    const simplePct = cleanFloat(val / 100);
    setCurrentInput(String(simplePct));
    setJustEvaluated(false);
  }, [currentInput, tokens]);

  const handleBackspace = useCallback(() => {
    if (currentInput === 'Error') {
      setCurrentInput('0');
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated) {
      setJustEvaluated(false);
      setLastCompletedExpr('');
    }
    if (currentInput.length > 1) {
      const next = currentInput.slice(0, -1);
      setCurrentInput(next === '-' ? '0' : next);
      return;
    }
    if (currentInput.length === 1) {
      if (tokens.length > 0) {
        setCurrentInput('');
      } else {
        setCurrentInput('0');
      }
      return;
    }
    if (currentInput === '' && tokens.length >= 2) {
      const restoredNum = tokens[tokens.length - 2];
      setTokens((prev) => prev.slice(0, -2));
      setCurrentInput(restoredNum);
    }
  }, [currentInput, justEvaluated, tokens]);

  const handleEquals = useCallback(() => {
    const cleanedCurrent =
      currentInput && currentInput !== 'Error'
        ? currentInput.endsWith('.')
          ? currentInput.slice(0, -1)
          : currentInput
        : '';

    const fullTokens = cleanedCurrent !== '' ? [...tokens, cleanedCurrent] : [...tokens];
    if (['+', '-', '×', '÷'].includes(fullTokens[fullTokens.length - 1])) {
      fullTokens.pop();
    }
    if (fullTokens.length < 3) return;

    const evaluated = evaluateTokens(fullTokens);
    const exprDisplay = fullTokens
      .map((t) => (['+', '-', '×', '÷'].includes(t) ? ` ${t} ` : formatCalcNumber(t)))
      .join('');

    if (evaluated === null || Number.isNaN(evaluated)) {
      setTokens([]);
      setCurrentInput('Error');
      setJustEvaluated(true);
      setLastCompletedExpr(`${exprDisplay} =`);
      return;
    }

    const resultStr = String(evaluated);
    setHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        expression: exprDisplay,
        resultRaw: resultStr,
      },
      ...prev.slice(0, 24),
    ]);
    setLastCompletedExpr(`${exprDisplay} =`);
    setTokens([]);
    setCurrentInput(resultStr);
    setJustEvaluated(true);
  }, [currentInput, tokens]);

  // Physical Keyboard Support while calculator is open
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercent();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isOpen,
    handleDigit,
    handleDecimal,
    handleOperator,
    handlePercent,
    handleEquals,
    handleBackspace,
    handleClear,
    onClose,
  ]);

  // Formatted Expression & Live Preview
  const formattedExpression = useMemo(() => {
    if (lastCompletedExpr) return lastCompletedExpr;
    if (tokens.length === 0) return '';
    return tokens
      .map((t) => (['+', '-', '×', '÷'].includes(t) ? ` ${t} ` : formatCalcNumber(t)))
      .join('');
  }, [tokens, lastCompletedExpr]);

  const livePreviewValue = useMemo(() => {
    if (tokens.length < 2) return null;
    const candidate =
      currentInput && currentInput !== 'Error' && currentInput !== '-'
        ? [...tokens, currentInput.endsWith('.') ? currentInput.slice(0, -1) : currentInput]
        : tokens.slice(0, -1);
    if (candidate.length < 3) return null;
    const val = evaluateTokens(candidate);
    if (val === null || Number.isNaN(val)) return null;
    return val;
  }, [tokens, currentInput]);

  // Active numeric value (either evaluated preview or current displayed value)
  const activeNumericValue = useMemo(() => {
    if (livePreviewValue !== null) return livePreviewValue;
    if (currentInput && currentInput !== 'Error') {
      const parsed = parseFloat(currentInput);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (tokens.length > 0) {
      const parsed = parseFloat(tokens[0]);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, [livePreviewValue, currentInput, tokens]);

  const displayMainText = useMemo(() => {
    if (currentInput !== '') return formatCalcNumber(currentInput);
    if (tokens.length >= 2) return formatCalcNumber(tokens[tokens.length - 2]);
    return '0';
  }, [currentInput, tokens]);

  const handleCopyValue = async () => {
    const valToCopy = String(Math.round(activeNumericValue * 100) / 100);
    try {
      await navigator.clipboard.writeText(valToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleSendToCashDraft = (type: 'income' | 'expense') => {
    const rounded = Math.round(Math.abs(activeNumericValue));
    if (rounded <= 0) return;

    setActiveDraft({
      id: `calc-draft-${Date.now()}`,
      source: 'calculator',
      title: 'Catat Hasil Kalkulator ke Buku Kas',
      originalInput:
        type === 'income'
          ? `Uang masuk ${rounded}`
          : `Uang keluar ${rounded}`,
      explanation:
        type === 'income'
          ? `Uang Masuk dari hasil hitungan kalkulator (+${formatRupiah(rounded)})`
          : `Uang Keluar dari hasil hitungan kalkulator (-${formatRupiah(rounded)})`,
      cashChanges: [
        {
          type,
          amount: rounded,
          category: type === 'income' ? 'Penjualan' : 'Operasional',
          description:
            type === 'income' ? 'Pemasukan (Hasil Kalkulator)' : 'Pengeluaran (Hasil Kalkulator)',
        },
      ],
      stockChanges: [],
      categoryChanges: [],
      timestamp: new Date().toISOString(),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      className="fixed right-4 sm:right-6 top-16 z-40 w-[332px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Draggable Top Bar */}
      <div
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900">Kalkulator</span>
            <GripHorizontal className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            title="Riwayat Hitungan"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              showHistory
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Riwayat{history.length > 0 ? ` (${history.length})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Tutup Kalkulator (Esc)"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsible History Tape */}
      {showHistory && (
        <div className="bg-slate-50/90 border-b border-slate-200 px-4 py-2.5 max-h-36 overflow-y-auto space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
               Klik angka untuk pakai lagi
            </span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                <Trash2 className="w-2.5 h-2.5" />
                <span>Bersihkan</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-2 text-center">Belum ada riwayat hitungan</p>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (currentInput === '' && tokens.length >= 2) {
                    setCurrentInput(item.resultRaw);
                  } else {
                    setTokens([]);
                    setCurrentInput(item.resultRaw);
                    setJustEvaluated(false);
                  }
                }}
                className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer block"
              >
                <div className="text-[10px] font-mono text-slate-400 truncate">{item.expression} =</div>
                <div className="text-xs font-mono font-bold text-slate-900">
                  {formatCalcNumber(item.resultRaw)}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Main Numeric Screen */}
      <div className="px-4 pt-3.5 pb-3 bg-white border-b border-slate-100">
        {/* Expression Line */}
        <div className="min-h-[18px] text-right text-xs font-mono text-slate-400 break-all">
          {formattedExpression || '\u00A0'}
        </div>

        {/* Main Result / Input Line */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <button
            type="button"
            onClick={handleCopyValue}
            title="Salin angka"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <div
            className={`font-mono font-extrabold tracking-tight text-slate-900 text-right truncate flex-1 ${
              displayMainText.length > 12
                ? 'text-xl'
                : displayMainText.length > 9
                ? 'text-2xl'
                : 'text-3xl'
            }`}
          >
            {displayMainText}
          </div>
        </div>

        {/* Live Subtotal Preview */}
        <div className="min-h-[16px] text-right text-[11px] font-mono text-emerald-600 font-semibold mt-0.5">
          {livePreviewValue !== null ? `= ${formatCalcNumber(String(livePreviewValue))}` : '\u00A0'}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="p-3 bg-slate-50/60 grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button
          type="button"
          onClick={handleClear}
          className="h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 font-bold text-sm transition-all active:scale-95 cursor-pointer"
        >
          C
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          title="Hapus 1 angka (Backspace)"
          className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handlePercent}
          className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-bold text-sm font-mono transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => handleOperator('÷')}
          className={`h-11 rounded-2xl font-bold text-base font-mono transition-all active:scale-95 cursor-pointer border ${
            tokens[tokens.length - 1] === '÷' && currentInput === ''
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-900 border-slate-200'
          }`}
        >
          ÷
        </button>

        {/* Row 2 */}
        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/90 font-bold text-sm font-mono transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleOperator('×')}
          className={`h-11 rounded-2xl font-bold text-base font-mono transition-all active:scale-95 cursor-pointer border ${
            tokens[tokens.length - 1] === '×' && currentInput === ''
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-900 border-slate-200'
          }`}
        >
          ×
        </button>

        {/* Row 3 */}
        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/90 font-bold text-sm font-mono transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleOperator('-')}
          className={`h-11 rounded-2xl font-bold text-base font-mono transition-all active:scale-95 cursor-pointer border ${
            tokens[tokens.length - 1] === '-' && currentInput === ''
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-900 border-slate-200'
          }`}
        >
          −
        </button>

        {/* Row 4 */}
        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/90 font-bold text-sm font-mono transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleOperator('+')}
          className={`h-11 rounded-2xl font-bold text-base font-mono transition-all active:scale-95 cursor-pointer border ${
            tokens[tokens.length - 1] === '+' && currentInput === ''
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-900 border-slate-200'
          }`}
        >
          +
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/90 font-bold text-sm font-mono transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleTripleZero}
          className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-bold text-xs font-mono transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          000
        </button>
        <button
          type="button"
          onClick={handleDecimal}
          className="h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/90 font-bold text-base font-mono transition-all active:scale-95 cursor-pointer shadow-2xs"
        >
          ,
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base font-mono transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          =
        </button>
      </div>

      {/* Optional Quick Bridge to Buku Kas */}
      {Math.round(Math.abs(activeNumericValue)) > 0 && (
        <div className="px-3 pb-3 pt-1 bg-slate-50/60 border-t border-slate-200/60 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSendToCashDraft('income')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ Catat Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendToCashDraft('expense')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>- Catat Keluar</span>
          </button>
        </div>
      )}
    </div>
  );
};
