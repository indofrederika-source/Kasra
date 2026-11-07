'use client';

import React, { useState, useEffect } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatThousands, parseThousands } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  FileText,
  Save,
  RotateCcw,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  User,
  KeyRound,
  LogOut,
  AlertCircle,
  X,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    categoryDefinitions,
    addCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    resetToMockData,
  } = useKasra();
  const { user, logout, changePassword } = useAuth();

  const [storeName, setStoreName] = useState(profile.storeName);
  const [businessCategory, setBusinessCategory] = useState(profile.businessCategory);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [bankAccount, setBankAccount] = useState(profile.bankAccount);
  const [monthlyTarget, setMonthlyTarget] = useState(
    profile.monthlyTarget ? formatThousands(profile.monthlyTarget) : '0'
  );

  // Sync local form state when profile updates (e.g., on user login or workspace reset)
  useEffect(() => {
    setStoreName(profile.storeName || '');
    setBusinessCategory(profile.businessCategory || '');
    setOwnerName(profile.ownerName || '');
    setPhone(profile.phone || '');
    setAddress(profile.address || '');
    setBankAccount(profile.bankAccount || '');
    setMonthlyTarget(profile.monthlyTarget ? formatThousands(profile.monthlyTarget) : '0');
  }, [profile]);

  const [newCatInput, setNewCatInput] = useState('');
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Change password states
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      storeName: storeName.trim(),
      businessCategory: businessCategory.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      bankAccount: bankAccount.trim(),
      monthlyTarget: Math.max(0, parseThousands(monthlyTarget) || 0),
    });

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwdError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSubmittingPwd(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (!res.success) {
        setPwdError(res.error || 'Gagal mengubah kata sandi.');
      } else {
        setPwdSuccess('Kata sandi berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsChangePwdOpen(false);
          setPwdSuccess(null);
        }, 2000);
      }
    } catch {
      setPwdError('Terjadi kesalahan saat memproses ganti kata sandi.');
    } finally {
      setIsSubmittingPwd(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan Usaha & Profil Toko
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Identitas bisnis otomatis digunakan untuk kop surat laporan resmi perbankan dan rekapitulasi usaha
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
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Contoh: Toko Maju Jaya"
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Bidang / Kategori Bisnis (Opsional)</label>
            <input
              type="text"
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              placeholder="Contoh: F&B, Ritel, Sembako, Fashion..."
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Nama Pemilik / Penanggung Jawab</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Nama pemilik usaha"
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Nomor WhatsApp Toko (Opsional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xx-xxxx-xxxx"
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-600 font-semibold">Alamat Lengkap Toko (Opsional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat lengkap usaha"
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Rekening Bank Usaha (Opsional)</label>
            <input
              type="text"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="Contoh: BCA / Mandiri / BRI a.n Toko"
              className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600 font-semibold">Target Pendapatan Bulanan (Rp)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={monthlyTarget}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setMonthlyTarget(raw === '' ? '0' : formatThousands(raw));
                }}
                placeholder="0"
                className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-bold font-mono focus:outline-none transition-colors"
              />
            </div>
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
          <div className="font-extrabold text-base text-slate-900 tracking-wide">
            {(storeName.trim() || 'NAMA TOKO BELUM DIISI').toUpperCase()}
          </div>
          <div className="text-slate-600">Bidang Usaha: {businessCategory.trim() || '-'}</div>
          <div className="text-slate-600">Alamat: {address.trim() || '-'}</div>
          <div className="text-slate-600">
            Kontak: {phone.trim() || '-'} | Rekening: {bankAccount.trim() || '-'}
          </div>
          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 font-medium">
            Penanggung Jawab: {ownerName.trim() || '-'}
          </div>
        </div>
      </div>

      {/* 4. Dynamic Categories Master Manager */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-600" />
            <span>Struktur Kategori & Sub-Kategori Usaha ({categoryDefinitions.length})</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Kategori terhubung otomatis dengan Gudang & Stok, Buku Kas, dan Analisis Laporan
          </p>
        </div>

        {categoryDefinitions.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-600">Belum Ada Kategori Utama (0 Kategori)</p>
            <p className="text-[11px] text-slate-400">
              Tambahkan kategori baru di bawah ini atau otomatis terbentuk saat menginput barang di Gudang & Stok.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryDefinitions.map((cat) => (
              <div key={cat.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({cat.subcategories.length} Sub)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.name)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    title={`Hapus kategori ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {cat.subcategories.map((sub, sidx) => (
                    <span
                      key={sidx}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 font-medium shadow-2xs"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => deleteSubcategory(cat.name, sub)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title={`Hapus sub-kategori ${sub}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {cat.subcategories.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic">Belum ada sub-kategori</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder={`+ Sub di ${cat.name}...`}
                    value={subInputs[cat.id] || ''}
                    onChange={(e) =>
                      setSubInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    className="flex-1 bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1 text-[11px] text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (subInputs[cat.id] || '').trim();
                      if (val) {
                        addSubcategory(cat.name, val);
                        setSubInputs((prev) => ({ ...prev, [cat.id]: '' }));
                      }
                    }}
                    disabled={!(subInputs[cat.id] || '').trim()}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[10px] font-bold transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {/* 5. Akun Pengguna & Keamanan */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Keamanan Akun & Sesi Login
              </h2>
              <p className="text-[11px] text-slate-500">
                Kelola akses akun dan kata sandi toko Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>

        {/* Account Info Pill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block font-medium">Email Akun</span>
            <span className="text-xs font-bold text-slate-800 font-mono truncate block mt-0.5">
              {user?.email || '-'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block font-medium">Pemilik Terdaftar</span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
              {user?.name || profile.ownerName || '-'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 block font-medium">Status Akun</span>
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Aktif</span>
            </span>
          </div>
        </div>

        {/* Change Password Collapsible */}
        <div className="pt-2 border-t border-slate-100">
          {!isChangePwdOpen ? (
            <button
              type="button"
              onClick={() => {
                setIsChangePwdOpen(true);
                setPwdError(null);
                setPwdSuccess(null);
              }}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Ganti Kata Sandi Akun</span>
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  <span>Perbarui Kata Sandi</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsChangePwdOpen(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-700"
                >
                  Batal
                </button>
              </div>

              {pwdError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">Kata Sandi Saat Ini</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Sandi lama"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 karakter"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-medium block mb-1">Ulangi Sandi Baru</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingPwd}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {isSubmittingPwd ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 6. System Reset */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Kosongkan Data Transaksi & Gudang</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Menghapus seluruh catatan transaksi kas, stok gudang, dan kategori kembali ke 0 tanpa menghapus akun login Anda.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kosongkan Seluruh Data Toko</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          logout();
        }}
        title="Keluar dari Akun KASRA"
        message="Apakah Anda yakin ingin keluar dari sesi akun toko Anda? Anda perlu memasukkan kata sandi kembali untuk mengakses workspace."
        confirmText="Ya, Keluar Akun"
        isDanger={true}
      />

      <DeleteConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetToMockData();
          setIsResetConfirmOpen(false);
        }}
        title="Kosongkan Data Toko KASRA"
        message="Apakah Anda yakin ingin mengosongkan seluruh data transaksi, inventaris gudang, kategori, dan target bulanan kembali menjadi 0?"
        confirmText="Ya, Kosongkan Data"
        isDanger={true}
      />
    </div>
  );
};
