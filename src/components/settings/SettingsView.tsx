'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatThousands, parseThousands, toStoreHandle } from '@/lib/utils';
import { compressImageFile } from '@/lib/imageUtils';
import {
  BUSINESS_CATEGORY_PRESETS,
  INDONESIA_CITY_PRESETS,
  STORE_BANNER_PRESETS,
  isPresetBusinessCategory,
} from '@/lib/constants/businessCategories';
import { StoreLocationPicker } from '@/components/settings/StoreLocationPicker';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { NOTIFICATION_CATEGORY_META } from '@/components/shared/NotificationCenterPopover';
import {
  FileText,
  Save,
  RotateCcw,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Store,
  KeyRound,
  LogOut,
  AlertCircle,
  X,
  BellRing,
  Send,
  MapPin,
  Upload,
  Eye,
  Clock,
  AtSign,
  Briefcase,
  Globe,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

type SettingsSectionTab = 'store_location' | 'operations' | 'security_notif';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    setActiveTab,
    categoryDefinitions,
    addCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    resetToMockData,
    notificationPreferences,
    browserNotificationPermission,
    updateNotificationPreferences,
    requestBrowserNotificationPermission,
    sendTestBrowserNotification,
    theme,
  } = useKasra();
  const { user, logout, changePassword } = useAuth();
  const isDark = theme === 'dark';

  const [activeSection, setActiveSection] = useState<SettingsSectionTab>('store_location');
  const [notifTestMsg, setNotifTestMsg] = useState<string | null>(null);

  // Store Identity & Public Profile Form States
  const [storeName, setStoreName] = useState(profile.storeName || '');
  const [handle, setHandle] = useState(
    profile.handle || toStoreHandle(profile.storeName || user?.storeName || 'tokokasra')
  );
  const [bio, setBio] = useState(profile.bio || '');
  const [operatingHours, setOperatingHours] = useState(profile.operatingHours || '08.00 - 21.00 WIB');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl || '');

  // Business Category Selector (Preset OR Custom Manual Input)
  const [businessCategoryMode, setBusinessCategoryMode] = useState<'preset' | 'custom'>(() => {
    if (!profile.businessCategory) return 'preset';
    return isPresetBusinessCategory(profile.businessCategory) ? 'preset' : 'custom';
  });
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>(() => {
    if (isPresetBusinessCategory(profile.businessCategory)) {
      const found = BUSINESS_CATEGORY_PRESETS.find(
        (p) => p.value.toLowerCase() === (profile.businessCategory || '').trim().toLowerCase()
      );
      return found ? found.value : BUSINESS_CATEGORY_PRESETS[0].value;
    }
    return BUSINESS_CATEGORY_PRESETS[0].value;
  });
  const [customBusinessCategory, setCustomBusinessCategory] = useState<string>(() =>
    !isPresetBusinessCategory(profile.businessCategory) ? profile.businessCategory || '' : ''
  );

  // Contact & Location States
  const [ownerName, setOwnerName] = useState(profile.ownerName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [cityMode, setCityMode] = useState<'preset' | 'custom'>(() => {
    if (!profile.city) return 'preset';
    const exists = INDONESIA_CITY_PRESETS.some(
      (c) => c.city.toLowerCase() === (profile.city || '').trim().toLowerCase()
    );
    return exists ? 'preset' : 'custom';
  });
  const [city, setCity] = useState(profile.city || '');
  const [province, setProvince] = useState(profile.province || '');
  const [address, setAddress] = useState(profile.address || '');
  const [latitude, setLatitude] = useState<number | null>(
    typeof profile.latitude === 'number' ? profile.latitude : null
  );
  const [longitude, setLongitude] = useState<number | null>(
    typeof profile.longitude === 'number' ? profile.longitude : null
  );

  // Public Privacy Toggles
  const [showPublicCatalog, setShowPublicCatalog] = useState(profile.showPublicCatalog !== false);
  const [showWhatsappPublic, setShowWhatsappPublic] = useState(profile.showWhatsappPublic !== false);
  const [showMapPublic, setShowMapPublic] = useState(profile.showMapPublic !== false);

  // Operations & Finance States
  const [bankAccount, setBankAccount] = useState(profile.bankAccount || '');
  const [monthlyTarget, setMonthlyTarget] = useState(
    profile.monthlyTarget ? formatThousands(profile.monthlyTarget) : '0'
  );

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Sync local form state when profile updates (e.g. cloud hydrate or reset)
  useEffect(() => {
    setStoreName(profile.storeName || '');
    setHandle(profile.handle || toStoreHandle(profile.storeName || user?.storeName || 'tokokasra'));
    setBio(profile.bio || '');
    setOperatingHours(profile.operatingHours || '08.00 - 21.00 WIB');
    setLogoUrl(profile.logoUrl || '');
    setBannerUrl(profile.bannerUrl || '');

    if (!profile.businessCategory) {
      setBusinessCategoryMode('preset');
    } else if (isPresetBusinessCategory(profile.businessCategory)) {
      setBusinessCategoryMode('preset');
      const found = BUSINESS_CATEGORY_PRESETS.find(
        (p) => p.value.toLowerCase() === profile.businessCategory.trim().toLowerCase()
      );
      if (found) setSelectedPresetCategory(found.value);
    } else {
      setBusinessCategoryMode('custom');
      setCustomBusinessCategory(profile.businessCategory);
    }

    setOwnerName(profile.ownerName || '');
    setPhone(profile.phone || '');

    const hasPresetCity = INDONESIA_CITY_PRESETS.some(
      (c) => c.city.toLowerCase() === (profile.city || '').trim().toLowerCase()
    );
    setCityMode(!profile.city || hasPresetCity ? 'preset' : 'custom');
    setCity(profile.city || '');
    setProvince(profile.province || '');
    setAddress(profile.address || '');
    setLatitude(typeof profile.latitude === 'number' ? profile.latitude : null);
    setLongitude(typeof profile.longitude === 'number' ? profile.longitude : null);

    setShowPublicCatalog(profile.showPublicCatalog !== false);
    setShowWhatsappPublic(profile.showWhatsappPublic !== false);
    setShowMapPublic(profile.showMapPublic !== false);

    setBankAccount(profile.bankAccount || '');
    setMonthlyTarget(profile.monthlyTarget ? formatThousands(profile.monthlyTarget) : '0');
  }, [profile, user?.storeName]);

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

  const effectiveBusinessCategory =
    businessCategoryMode === 'custom'
      ? customBusinessCategory.trim() || 'Usaha Mandiri'
      : selectedPresetCategory;

  const handleSaveProfile = (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedHandle = toStoreHandle(handle || storeName || 'tokokasra');
    setHandle(normalizedHandle);

    updateProfile({
      storeName: storeName.trim(),
      handle: normalizedHandle,
      bio: bio.trim(),
      operatingHours: operatingHours.trim(),
      logoUrl: logoUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      businessCategory: effectiveBusinessCategory,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      province: province.trim(),
      address: address.trim(),
      latitude,
      longitude,
      showPublicCatalog,
      showWhatsappPublic,
      showMapPublic,
      bankAccount: bankAccount.trim(),
      monthlyTarget: Math.max(0, parseThousands(monthlyTarget) || 0),
    });

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 480, 0.85);
      setLogoUrl(compressed);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 1280, 0.82);
      setBannerUrl(compressed);
    } catch {
      // ignore
    }
    e.target.value = '';
  };

  const handleSelectCityPreset = (selectedValue: string) => {
    if (selectedValue === '__custom__') {
      setCityMode('custom');
      setCity('');
      return;
    }
    setCityMode('preset');
    setCity(selectedValue);
    const matched = INDONESIA_CITY_PRESETS.find(
      (c) => c.city.toLowerCase() === selectedValue.toLowerCase()
    );
    if (matched) {
      setProvince(matched.province);
      // Center map to chosen city if coordinates were unset
      if (latitude === null || longitude === null) {
        setLatitude(matched.lat);
        setLongitude(matched.lng);
      }
    }
  };

  const handleCenterMapToSelectedCity = () => {
    const matched = INDONESIA_CITY_PRESETS.find(
      (c) => c.city.toLowerCase() === city.trim().toLowerCase()
    );
    if (matched) {
      setLatitude(matched.lat);
      setLongitude(matched.lng);
    }
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

  const primaryBtnClass = isDark
    ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
    : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6]';

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* 1. Top Header & Quick Jump to Public Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pengaturan Akun & Toko
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola identitas usaha, bidang bisnis, titik lokasi peta, privasi etalase, dan keamanan akun pribadi Anda
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lihat Profil Publik & Etalase</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveProfile()}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${primaryBtnClass}`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Semua</span>
          </button>
        </div>
      </div>

      {/* Saved Toast Banner */}
      {isSavedAlert && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Pengaturan toko, bidang usaha, dan titik lokasi berhasil diperbarui & disinkronkan ke profil publik!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="text-[11px] font-bold underline shrink-0 cursor-pointer"
          >
            Cek Profil Toko
          </button>
        </div>
      )}

      {/* 2. Segmented Settings Navigation Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs w-full sm:w-auto">
        {[
          {
            id: 'store_location' as const,
            label: 'Identitas, Bidang & Lokasi Peta',
            icon: Store,
          },
          {
            id: 'operations' as const,
            label: 'Kop Surat & Kategori Gudang',
            icon: SlidersHorizontal,
          },
          {
            id: 'security_notif' as const,
            label: 'Notifikasi & Keamanan Akun',
            icon: ShieldCheck,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                active
                  ? primaryBtnClass + ' shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: IDENTITAS TOKO, BIDANG USAHA & LOKASI PETA INTERAKTIF
         ===================================================================== */}
      {activeSection === 'store_location' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* A. Visual Branding (Banner & Logo) + Basic Store Info */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            {/* Cover Banner Preview */}
            <div className="relative h-36 sm:h-44 bg-slate-100 border-b border-slate-200 overflow-hidden">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt="Sampul Toko"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center ${
                    isDark
                      ? 'bg-gradient-to-r from-[#0D1C42] via-[#1B3166] to-[#22396F]'
                      : 'bg-gradient-to-r from-[#1E3D1C] via-[#2B5428] to-[#3E6B3A]'
                  }`}
                >
                  <span className="text-xs font-medium text-white/75">
                    Sampul Profil Toko ({storeName || 'Toko KASRA'})
                  </span>
                </div>
              )}

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBanner}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-slate-800 border border-slate-200 text-[11px] font-bold shadow-sm cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Unggah Sampul</span>
                </button>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="p-1.5 rounded-full bg-white/95 hover:bg-white text-rose-600 border border-slate-200 shadow-sm cursor-pointer"
                    title="Hapus foto sampul"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Avatar Row + Preset Banner Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-12 sm:-mt-14 relative z-10">
                <div className="flex items-end gap-3.5">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={storeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center text-2xl font-extrabold ${
                          isDark
                            ? 'bg-[#0D1C42] text-[#FCF1D0]'
                            : 'bg-[#1E3D1C] text-[#F8FAF6]'
                        }`}
                      >
                        {(storeName || 'K').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="pb-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Ganti Logo Toko</span>
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          Hapus Logo
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Logo & sampul tampil di profil toko dan komunitas usaha
                    </p>
                  </div>
                </div>

                {/* Quick Banner Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Pilihan Sampul Cepat:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STORE_BANNER_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setBannerUrl(preset.url)}
                        title={preset.label}
                        className={`w-9 h-6 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          bannerUrl === preset.url
                            ? 'border-emerald-600 scale-105 shadow-xs'
                            : 'border-slate-200 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core Identity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">
                    Nama Toko / Brand Usaha
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Contoh: Kopi Senja Braga"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Username Komunitas (@handle)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) =>
                        setHandle(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, '')
                            .slice(0, 24)
                        )
                      }
                      placeholder="namatokomu"
                      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-slate-900 font-mono font-semibold placeholder:text-slate-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">
                    Nama Pemilik / Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Nama lengkap pemilik usaha"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-700 font-semibold">
                    Nomor WhatsApp Bisnis
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-700 font-semibold">
                    Bio & Cerita Singkat Toko
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ceritakan keunggulan produk jadi toko Anda, pesanan grosir/eceran, atau kolaborasi yang dicari..."
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jam Operasional Toko</span>
                  </label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="Contoh: Senin - Sabtu, 08.00 - 21.00 WIB"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* B. Bidang Usaha Selector (Curated Options + Custom Manual Input) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Bidang Usaha Toko</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Digunakan sebagai filter bidang toko di halaman Komunitas & Direktori Usaha. Pilih dari daftar atau ketik bidang sendiri.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
                <span>Aktif: {effectiveBusinessCategory}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BUSINESS_CATEGORY_PRESETS.map((opt) => {
                const isSelected =
                  businessCategoryMode === 'preset' && selectedPresetCategory === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setBusinessCategoryMode('preset');
                      setSelectedPresetCategory(opt.value);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#0D1C42] border-[#FCF1D0] text-[#FCF1D0] shadow-xs'
                          : 'bg-[#E4EFE0] border-[#1E3D1C] text-[#142413] shadow-xs'
                        : 'bg-slate-50/80 hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {opt.description}
                    </p>
                  </button>
                );
              })}

              {/* Custom Input Option Card */}
              <button
                type="button"
                onClick={() => setBusinessCategoryMode('custom')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  businessCategoryMode === 'custom'
                    ? isDark
                      ? 'bg-[#0D1C42] border-[#FCF1D0] text-[#FCF1D0] shadow-xs'
                      : 'bg-[#E4EFE0] border-[#1E3D1C] text-[#142413] shadow-xs'
                    : 'bg-slate-50/80 hover:bg-slate-50 border-dashed border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Lainnya — Ketik Sendiri</span>
                  </span>
                  {businessCategoryMode === 'custom' && (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tulis bidang usaha spesifik jika belum ada di pilihan
                </p>
              </button>
            </div>

            {businessCategoryMode === 'custom' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-slate-800 block">
                  Tulis Bidang Usaha Anda Sendiri
                </label>
                <input
                  type="text"
                  required
                  value={customBusinessCategory}
                  onChange={(e) => setCustomBusinessCategory(e.target.value)}
                  placeholder="Contoh: Roastery & Mesin Kopi, Florist & Dekorasi, Percetakan Kemasan, dll..."
                  className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">
                  Bidang yang Anda ketik otomatis muncul juga di filter bidang halaman Komunitas.
                </p>
              </div>
            )}
          </div>

          {/* C. Lokasi Toko: Manual Input + Interactive Draggable Map Picker */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Lokasi Daerah & Titik Peta Toko</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ketik alamat & kota secara manual, atau cari/geser pin langsung pada peta interaktif di bawah ini
                </p>
              </div>

              {cityMode === 'preset' && city && (
                <button
                  type="button"
                  onClick={handleCenterMapToSelectedCity}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Arahkan Peta ke {city}</span>
                </button>
              )}
            </div>

            {/* Daerah / Kota & Provinsi + Alamat Manual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">
                  Kota / Kabupaten (Filter Daerah Komunitas)
                </label>
                <select
                  value={cityMode === 'custom' ? '__custom__' : city}
                  onChange={(e) => handleSelectCityPreset(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none transition-colors"
                >
                  <option value="">-- Pilih Kota / Daerah --</option>
                  {INDONESIA_CITY_PRESETS.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city} ({c.province})
                    </option>
                  ))}
                  <option value="__custom__">+ Lainnya (Ketik Kota / Daerah Sendiri)</option>
                </select>

                {cityMode === 'custom' && (
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ketik nama Kota / Kabupaten (misal: Garut, Kediri, Bukittinggi)..."
                    className="mt-2 w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">Provinsi</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Contoh: Jawa Barat, DKI Jakarta, Jawa Timur..."
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs text-slate-700 font-semibold">
                  Alamat Lengkap Toko (Ketik Manual atau Isi Otomatis dari Pin Peta)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Braga No. 48, Kec. Sumur Bandung, Kota Bandung"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Interactive Map Pin Picker */}
            <div className="pt-1">
              <StoreLocationPicker
                latitude={latitude}
                longitude={longitude}
                storeName={storeName || 'Lokasi Toko Saya'}
                isDark={isDark}
                onChangeCoordinates={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                onDetectedLocationMeta={(meta) => {
                  if (meta.address) setAddress(meta.address);
                  if (meta.city) {
                    const matchedPreset = INDONESIA_CITY_PRESETS.find((c) =>
                      meta.city!.toLowerCase().includes(c.city.toLowerCase())
                    );
                    if (matchedPreset) {
                      setCityMode('preset');
                      setCity(matchedPreset.city);
                      setProvince(matchedPreset.province);
                    } else {
                      setCityMode('custom');
                      setCity(meta.city);
                      if (meta.province) setProvince(meta.province);
                    }
                  } else if (meta.province) {
                    setProvince(meta.province);
                  }
                }}
              />
            </div>
          </div>

          {/* D. Pengaturan Privasi Tampilan Publik */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Privasi Profil Publik & Etalase Toko</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Atur informasi apa saja yang boleh dilihat pengunjung lain di halaman Komunitas. Data HPP, sisa stok gudang, bahan baku, dan rekening bank selalu dirahasiakan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Tampilkan Etalase Produk Jadi
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tampilkan produk siap jual pilihan Anda di halaman profil toko (bahan baku otomatis dikecualikan)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showPublicCatalog}
                  onChange={(e) => setShowPublicCatalog(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer shrink-0"
                />
              </label>

              <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Tombol Hubungi WhatsApp
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Izinkan pelanggan & mitra usaha menghubungi WhatsApp bisnis Anda dari profil publik
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showWhatsappPublic}
                  onChange={(e) => setShowWhatsappPublic(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer shrink-0"
                />
              </label>

              <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Tampilkan Titik Peta Toko
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tampilkan pratinjau peta lokasi & tautan arah Google Maps di profil toko publik
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showMapPublic}
                  onChange={(e) => setShowMapPublic(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer shrink-0"
                />
              </label>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${primaryBtnClass}`}
              >
                <Save className="w-4 h-4" />
                <span>Simpan Identitas & Lokasi Toko</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          TAB 2: OPERASIONAL, KOP SURAT BANK & KATEGORI GUDANG
         ===================================================================== */}
      {activeSection === 'operations' && (
        <div className="space-y-6">
          {/* Finance & Target Settings */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-xs"
          >
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Data Finansial Internal & Kop Surat Laporan</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Informasi ini bersifat privat (hanya Anda yang melihat) dan digunakan untuk target bulanan serta kop laporan PDF perbankan
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">
                  Rekening Bank Usaha (Privat — Hanya untuk Kop Laporan)
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Contoh: BCA 0149821004 a.n Toko"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">
                  Target Pendapatan Bulanan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={monthlyTarget}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setMonthlyTarget(raw === '' ? '0' : formatThousands(raw));
                    }}
                    placeholder="0"
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-bold font-mono focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Official Bank Letterhead Preview */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                Pratinjau Kop Surat Resmi Laporan PDF Bank:
              </div>
              <div className="font-extrabold text-base text-slate-900 tracking-wide">
                {(storeName.trim() || 'NAMA TOKO BELUM DIISI').toUpperCase()}
              </div>
              <div className="text-slate-600">Bidang Usaha: {effectiveBusinessCategory || '-'}</div>
              <div className="text-slate-600">
                Alamat: {address.trim() || '-'}
                {city.trim() ? `, ${city.trim()}` : ''}
                {province.trim() ? `, ${province.trim()}` : ''}
              </div>
              <div className="text-slate-600">
                Kontak: {phone.trim() || '-'} | Rekening: {bankAccount.trim() || '-'}
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                Penanggung Jawab: {ownerName.trim() || '-'}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${primaryBtnClass}`}
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Operasional</span>
              </button>
            </div>
          </form>

          {/* Dynamic Categories Master Manager */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Struktur Kategori & Sub-Kategori Gudang ({categoryDefinitions.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kategori bertanda &ldquo;Bahan Baku&rdquo; atau &ldquo;Kemasan&rdquo; otomatis dikecualikan dari Etalase Profil Publik sehingga hanya produk jadi yang tampil
              </p>
            </div>

            {categoryDefinitions.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600">
                  Belum Ada Kategori Utama (0 Kategori)
                </p>
                <p className="text-[11px] text-slate-400">
                  Tambahkan kategori seperti &ldquo;Produk Siap Jual&rdquo; atau &ldquo;Bahan Baku&rdquo; di bawah ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryDefinitions.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                  >
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
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title={`Hapus sub-kategori ${sub}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      {cat.subcategories.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">
                          Belum ada sub-kategori
                        </span>
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
                        className={`px-2.5 py-1 rounded-lg disabled:opacity-40 text-[10px] font-bold transition-colors cursor-pointer ${primaryBtnClass}`}
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
                className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-full px-3.5 py-2 text-xs text-slate-900 focus:outline-none transition-colors"
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
                className={`px-4 py-2 rounded-full disabled:opacity-40 text-xs font-bold transition-colors shadow-xs cursor-pointer ${primaryBtnClass}`}
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: NOTIFIKASI & KEAMANAN AKUN
         ===================================================================== */}
      {activeSection === 'security_notif' && (
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-500" />
                  <span>Pengaturan Notifikasi & Persetujuan Browser</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Atur peringatan uang masuk/keluar, stok habis, batas kedaluwarsa, serta izin pop-up browser perangkat Anda
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {browserNotificationPermission !== 'granted' &&
                  browserNotificationPermission !== 'unsupported' && (
                    <button
                      type="button"
                      onClick={() => requestBrowserNotificationPermission()}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${primaryBtnClass}`}
                    >
                      Izinkan Notifikasi Browser
                    </button>
                  )}
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await sendTestBrowserNotification();
                    setNotifTestMsg(
                      ok
                        ? 'Tes notifikasi berhasil dikirim ke browser & lonceng aplikasi!'
                        : browserNotificationPermission === 'denied'
                        ? 'Izin notifikasi diblokir di browser. Ubah izin situs di ikon gembok alamat browser.'
                        : 'Notifikasi masuk ke lonceng aplikasi. Klik "Izinkan Notifikasi Browser" untuk pop-up layar.'
                    );
                    setTimeout(() => setNotifTestMsg(null), 4000);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Tes Notifikasi</span>
                </button>
              </div>
            </div>

            {notifTestMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                {notifTestMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Notifikasi Pop-up Browser (Status:{' '}
                    {browserNotificationPermission === 'granted'
                      ? 'Diizinkan'
                      : browserNotificationPermission === 'denied'
                      ? 'Diblokir'
                      : browserNotificationPermission === 'unsupported'
                      ? 'Tidak Didukung'
                      : 'Belum Diizinkan'}
                    )
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tampilkan pemberitahuan langsung dari browser perangkat
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={
                    notificationPreferences.browserPushEnabled &&
                    browserNotificationPermission === 'granted'
                  }
                  onChange={async () => {
                    const nextVal = !notificationPreferences.browserPushEnabled;
                    if (nextVal && browserNotificationPermission === 'default') {
                      const perm = await requestBrowserNotificationPermission();
                      updateNotificationPreferences({ browserPushEnabled: perm === 'granted' });
                    } else {
                      updateNotificationPreferences({ browserPushEnabled: nextVal });
                    }
                  }}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                />
              </label>

              <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Riwayat Lonceng di Aplikasi
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Catat semua peringatan pada pusat notifikasi di bilah atas
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationPreferences.inAppEnabled}
                  onChange={(e) =>
                    updateNotificationPreferences({ inAppEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              {NOTIFICATION_CATEGORY_META.map((item) => (
                <label
                  key={item.key}
                  className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPreferences[item.key]}
                    onChange={(e) =>
                      updateNotificationPreferences({ [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Account Security */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Keamanan Akun & Sesi Login
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Kelola akses akun dan kata sandi ruang kerja KASRA Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Email Akun</span>
                <span className="text-xs font-bold text-slate-800 font-mono truncate block mt-0.5">
                  {user?.email || '-'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">
                  Pemilik Terdaftar
                </span>
                <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
                  {user?.name || profile.ownerName || '-'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Status Sesi</span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Aktif & Tersinkron</span>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              {!isChangePwdOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePwdOpen(true);
                    setPwdError(null);
                    setPwdSuccess(null);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ganti Kata Sandi Akun</span>
                </button>
              ) : (
                <form
                  onSubmit={handleChangePassword}
                  className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                      <span>Perbarui Kata Sandi</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsChangePwdOpen(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
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
                      <label className="text-[11px] text-slate-600 font-medium block mb-1">
                        Kata Sandi Saat Ini
                      </label>
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
                      <label className="text-[11px] text-slate-600 font-medium block mb-1">
                        Kata Sandi Baru
                      </label>
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
                      <label className="text-[11px] text-slate-600 font-medium block mb-1">
                        Ulangi Sandi Baru
                      </label>
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
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer ${primaryBtnClass}`}
                    >
                      {isSubmittingPwd ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* System Reset */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Kosongkan Data Transaksi & Gudang
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Menghapus seluruh catatan transaksi kas, stok gudang, dan kategori kembali ke 0 tanpa menghapus akun login Anda.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kosongkan Seluruh Data Toko</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          logout();
        }}
        title="Keluar dari Akun KASRA"
        message="Apakah Anda yakin ingin keluar dari sesi akun toko Anda? Anda perlu memasukkan kata sandi kembali untuk mengakses ruang kerja toko."
        confirmText="Ya, Keluar Akun"
        isDanger={true}
      />

      {/* Reset Confirmation Modal */}
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
