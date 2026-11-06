'use client';

import React, { useState } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { formatRupiah } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  Store,
  FileText,
  Save,
  RotateCcw,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  User,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { profile, updateProfile, categories, categoryDefinitions, addCategory, addSubcategory, resetToMockData } = useKasra();

  const [storeName, setStoreName] = useState(profile.storeName);
  const [businessCategory, setBusinessCategory] = useState(profile.businessCategory);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [bankAccount, setBankAccount] = useState(profile.bankAccount);
  const [monthlyTarget, setMonthlyTarget] = useState(profile.monthlyTarget.toString());

  const [newCatInput, setNewCatInput] = useState('');
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      storeName: storeName.trim(),
      businessCategory: businessCategory.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bankAccount: bankAccount.trim(),
      monthlyTarget: Math.max(0, parseInt(monthlyTarget) || 0),
    });

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan Usaha & Profil Toko
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Identitas bisnis otomatis digunakan untuk kop surat laporan resmi perbankan dan studio promosi
        </p>
      </div>

      {/* Success Alert */}
      {isSavedAlert && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profil toko berhasil disimpan dan diperbarui!</span>
        </div>
      )}

      {/* 2. Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-slate-600" />
          <span>Data Pokok Usaha</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Nama Toko / Usaha</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Bidang / Kategori Bisnis</label>
            <input
              type="text"
              required
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Nama Pemilik / Penanggung Jawab</label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Nomor WhatsApp Toko</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-600 font-semibold">Alamat Lengkap Toko</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Rekening Bank Usaha</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="BCA 8720194829 a.n Toko"
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Target Pendapatan Bulanan (Rp)</label>
            <input
              type="number"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold font-mono focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Profil</span>
          </button>
        </div>
      </form>

      {/* 3. Kop Surat Preview */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" />
          <span>Pratinjau Kop Surat Resmi Bank</span>
        </h2>
        <p className="text-xs text-slate-500">
          Format berikut otomatis tercetak di lembar atas laporan keuangan PDF perbankan:
        </p>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
          <div className="font-extrabold text-base text-slate-900 tracking-wide">{storeName.toUpperCase()}</div>
          <div className="text-slate-600">Bidang Usaha: {businessCategory}</div>
          <div className="text-slate-600">Alamat: {address}</div>
          <div className="text-slate-600">
            Kontak: {phone} | Rekening: {bankAccount}
          </div>
          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 font-medium">
            Penanggung Jawab: {ownerName}
          </div>
        </div>
      </div>

      {/* 4. Dynamic Categories Master Manager */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-600" />
            <span>Struktur Kategori & Sub-Kategori Usaha</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kategori universal untuk pengelompokan gudang, laporan kas, dan pencarian cepat
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categoryDefinitions.map((cat) => (
            <div key={cat.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{cat.subcategories.length} Sub</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {cat.subcategories.map((sub, sidx) => (
                  <span
                    key={sidx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 font-medium shadow-2xs"
                  >
                    {sub}
                  </span>
                ))}
                {cat.subcategories.length === 0 && (
                  <span className="text-[10px] text-slate-400 italic">Belum ada sub-kategori</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-sm pt-2">
          <input
            type="text"
            placeholder="Tambah kategori utama baru..."
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            className="flex-1 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-full px-3.5 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              if (newCatInput.trim()) {
                addCategory(newCatInput);
                setNewCatInput('');
              }
            }}
            disabled={!newCatInput.trim()}
            className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* 5. Persistent Session Status & System Reset */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Sesi Login Persisten Aktif</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sistem otomatis menyimpan sesi Anda di perangkat ini.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Data Awal Demo</span>
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetToMockData();
          setIsResetConfirmOpen(false);
        }}
        title="Reset Data Toko KASRA"
        message="Apakah Anda yakin ingin mengembalikan seluruh data transaksi dan inventaris ke data demo awal KASRA? Semua perubahan data yang Anda simpan di perangkat ini akan diatur ulang."
        confirmText="Ya, Reset Seluruh Data"
        isDanger={true}
      />
    </div>
  );
};
