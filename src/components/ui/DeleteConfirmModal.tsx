'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  description?: string;
  message?: string;
  confirmText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = 'Konfirmasi Tindakan',
  itemName,
  description,
  message,
  confirmText = 'Hapus Permanen',
  isDanger = true,
  onConfirm,
  onCancel,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const promptMessage = message || description || 'Data yang dihapus tidak dapat dipulihkan kembali dari sistem.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDanger
                ? 'bg-rose-50 border border-rose-200 text-rose-600'
                : 'bg-amber-50 border border-amber-200 text-amber-600'
            }`}
          >
            {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {itemName ? (
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin memproses tindakan untuk{' '}
              <span className="text-slate-900 font-semibold underline underline-offset-2">
                "{itemName}"
              </span>
              ?
            </p>
          ) : null}
          <p className="text-xs text-slate-500 pt-1 leading-relaxed">{promptMessage}</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
            }`}
          >
            {isDanger ? <Trash2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
