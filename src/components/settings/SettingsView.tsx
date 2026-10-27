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
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Pengaturan Usaha & Profil Toko
        </h1>
        <p className="text-xs text-[#8a8a92] mt-1">
          Identitas bisnis otomatis digunakan untuk kop surat laporan resmi perbankan dan studio promosi
        </p>
      </div>

      {/* Success Alert */}
      {isSavedAlert && (
        <div className="p-3.5 rounded-xl bg-[#1c241c] border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profil toko berhasil disimpan dan diperbarui!</span>
        </div>
      )}

      {/* 2. Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-6 space-y-5 shadow-xl">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-stone-300" />
          <span>Data Pokok Usaha</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-stone-300 font-semibold">Nama Toko / Usaha</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-300 font-semibold">Bidang / Kategori Bisnis</label>
            <input
              type="text"
              required
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-300 font-semibold">Nama Pemilik / Penanggung Jawab</label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-300 font-semibold">Nomor WhatsApp Toko</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-stone-300 font-semibold">Alamat Lengkap Toko</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-300 font-semibold">Rekening Bank Usaha</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="BCA 8720194829 a.n Toko"
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-300 font-semibold">Target Pendapatan Bulanan (Rp)</label>
            <input
              type="number"
              value={monthlyTarget}
              onChange={(e) => setMonthlyTarget(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white font-bold font-mono focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Profil</span>
          </button>
        </div>
      </form>

      {/* 3. Kop Surat Preview */}
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-6 space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-stone-300" />
          <span>Pratinjau Kop Surat Resmi Bank</span>
        </h2>
        <p className="text-xs text-[#8a8a92]">
          Format berikut otomatis tercetak di lembar atas laporan keuangan PDF perbankan:
        </p>

        <div className="p-5 rounded-xl bg-[#171719] border border-[#2c2c32] space-y-1 text-xs">
          <div className="font-extrabold text-base text-white tracking-wide">{storeName.toUpperCase()}</div>
          <div className="text-stone-400">Bidang Usaha: {businessCategory}</div>
          <div className="text-stone-400">Alamat: {address}</div>
          <div className="text-stone-400">
            Kontak: {phone} | Rekening: {bankAccount}
          </div>
          <div className="pt-2 border-t border-[#28282e] text-[11px] text-stone-300 font-medium">
            Penanggung Jawab: {ownerName}
          </div>
        </div>
      </div>

      {/* 4. Dynamic Categories Master Manager */}
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-stone-300" />
            <span>Struktur Kategori & Sub-Kategori Usaha</span>
          </h2>
          <p className="text-[11px] text-[#8a8a92] mt-0.5">
            Kategori universal untuk pengelompokan gudang, laporan kas, dan pencarian cepat
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categoryDefinitions.map((cat) => (
            <div key={cat.id} className="p-3.5 rounded-xl bg-[#171719] border border-[#2c2c32] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{cat.name}</span>
                <span className="text-[10px] text-[#8a8a92] font-mono">{cat.subcategories.length} Sub</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {cat.subcategories.map((sub, sidx) => (
                  <span
                    key={sidx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#222228] text-stone-300 border border-[#2c2c32]"
                  >
                    {sub}
                  </span>
                ))}
                {cat.subcategories.length === 0 && (
                  <span className="text-[10px] text-[#71717a] italic">Belum ada sub-kategori</span>
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
            className="flex-1 bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-full px-3.5 py-2 text-xs text-white focus:outline-none"
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
            className="px-4 py-2 rounded-full bg-white hover:bg-stone-200 disabled:opacity-40 text-black text-xs font-bold transition-colors"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* 5. Persistent Session Status & System Reset */}
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#202024] text-[#8aef8e] border border-[#2c2c32] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Sesi Login Persisten Aktif</div>
            <p className="text-[11px] text-[#8a8a92] mt-0.5">
              Sistem otomatis menyimpan sesi Anda di perangkat ini.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 rounded-full text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
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
