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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDanger
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}
          >
            {isDanger ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">{title}</h3>
          {itemName ? (
            <p className="text-xs text-stone-300">
              Apakah Anda yakin ingin memproses tindakan untuk{' '}
              <span className="text-white font-semibold underline underline-offset-2">
                "{itemName}"
              </span>
              ?
            </p>
          ) : null}
          <p className="text-xs text-stone-400 pt-1 leading-relaxed">{promptMessage}</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-stone-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-full text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 ${
              isDanger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
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
