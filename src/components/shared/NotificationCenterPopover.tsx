'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { NotificationCategory, NotificationPreferences } from '@/types';
import {
  Bell,
  BellRing,
  Settings,
  CheckCheck,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Package,
  Wallet,
  X,
  Send,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export const NOTIFICATION_CATEGORY_META: Array<{
  key: keyof Pick<
    NotificationPreferences,
    | 'cashIncome'
    | 'cashExpense'
    | 'stockOut'
    | 'stockLow'
    | 'expiryExpired'
    | 'expiryNear'
    | 'stockMutation'
    | 'financeAlert'
  >;
  label: string;
  desc: string;
}> = [
  {
    key: 'cashIncome',
    label: 'Uang Masuk (Pemasukan Kas)',
    desc: 'Saat ada penjualan kasir atau pemasukan tercatat',
  },
  {
    key: 'cashExpense',
    label: 'Uang Keluar (Pengeluaran Kas)',
    desc: 'Saat ada belanja bahan baku atau biaya operasional',
  },
  {
    key: 'stockOut',
    label: 'Stok Barang Habis (0)',
    desc: 'Peringatan darurat saat stok barang di gudang habis',
  },
  {
    key: 'stockLow',
    label: 'Stok Barang Menipis',
    desc: 'Saat sisa stok menyentuh batas aman minimum',
  },
  {
    key: 'expiryExpired',
    label: 'Barang Sudah Kedaluwarsa',
    desc: 'Saat ada stok yang telah melewati tanggal kedaluwarsa',
  },
  {
    key: 'expiryNear',
    label: 'Mendekati Kedaluwarsa (≤ 7 Hari)',
    desc: 'Pengingat FEFO untuk barang yang segera kedaluwarsa',
  },
  {
    key: 'stockMutation',
    label: 'Mutasi & Perubahan Info Barang',
    desc: 'Barang baru, barang rusak/susut, atau perubahan harga & info',
  },
  {
    key: 'financeAlert',
    label: 'Saldo Defisit & Target Bulanan',
    desc: 'Peringatan kas minus dan pencapaian target pendapatan toko',
  },
];

function renderCategoryIcon(category: NotificationCategory) {
  switch (category) {
    case 'cash_income':
      return {
        icon: TrendingUp,
        boxClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      };
    case 'cash_expense':
      return {
        icon: TrendingDown,
        boxClass: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
      };
    case 'stock_out':
      return {
        icon: AlertTriangle,
        boxClass: 'bg-rose-500/20 text-rose-500 border-rose-500/40',
      };
    case 'stock_low':
      return {
        icon: AlertTriangle,
        boxClass: 'bg-amber-500/20 text-amber-500 border-amber-500/40',
      };
    case 'expiry_expired':
      return {
        icon: Clock,
        boxClass: 'bg-rose-500/20 text-rose-500 border-rose-500/40',
      };
    case 'expiry_near':
      return {
        icon: Clock,
        boxClass: 'bg-amber-500/20 text-amber-500 border-amber-500/40',
      };
    case 'stock_mutation':
      return {
        icon: Package,
        boxClass: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
      };
    case 'finance_alert':
    default:
      return {
        icon: Wallet,
        boxClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      };
  }
}

export const NotificationCenterPopover: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    notificationPreferences,
    browserNotificationPermission,
    updateNotificationPreferences,
    requestBrowserNotificationPermission,
    sendTestBrowserNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    setActiveTab,
    theme,
  } = useKasra();

  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'list' | 'prefs'>('list');
  const [listFilter, setListFilter] = useState<'all' | 'unread'>('all');
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const filteredList =
    listFilter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleToggleBrowserPush = async () => {
    const nextVal = !notificationPreferences.browserPushEnabled;
    if (nextVal && browserNotificationPermission === 'default') {
      const res = await requestBrowserNotificationPermission();
      updateNotificationPreferences({ browserPushEnabled: res === 'granted' });
    } else {
      updateNotificationPreferences({ browserPushEnabled: nextVal });
    }
  };

  const handleSendTest = async () => {
    const ok = await sendTestBrowserNotification();
    if (ok) {
      setTestFeedback('Notifikasi browser berhasil dikirim!');
    } else if (browserNotificationPermission === 'denied') {
      setTestFeedback('Izin browser diblokir. Aktifkan izin notifikasi di ikon gembok URL browser.');
    } else {
      setTestFeedback('Notifikasi tercatat di aplikasi (izinkan browser untuk pop-up perangkat).');
    }
    setTimeout(() => setTestFeedback(null), 3500);
  };

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Pusat Notifikasi & Pengaturan Peringatan"
        aria-label="Buka Pusat Notifikasi"
        className={`relative w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
          isDark
            ? isOpen
              ? 'bg-[#FCF1D0] border-[#FCF1D0] text-[#0D1C42]'
              : 'bg-[#22396F] border-[#345294] text-[#FCF1D0] hover:bg-[#2B4684]'
            : isOpen
            ? 'bg-slate-900 border-slate-900 text-white'
            : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 shadow-2xs'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-xs ${
              isDark
                ? 'bg-rose-500 text-white ring-2 ring-[#0D1C42]'
                : 'bg-rose-500 text-white ring-2 ring-white'
            }`}
          >
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-16 sm:top-auto sm:mt-2.5 sm:w-[400px] max-h-[80vh] flex flex-col rounded-3xl border shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
            isDark
              ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0]'
              : 'bg-white border-slate-200/90 text-slate-900'
          }`}
        >
          {/* Top Header */}
          <div
            className={`px-4 py-3.5 border-b flex items-center justify-between gap-2 ${
              isDark ? 'bg-[#22396F] border-[#345294]' : 'bg-slate-50/80 border-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-extrabold tracking-tight truncate">
                Pusat Notifikasi Toko
              </span>
              {unreadNotificationCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                  {unreadNotificationCount} Baru
                </span>
              )}
            </div>

            {/* Mode Switch: Daftar vs Pengaturan */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setPanelTab(panelTab === 'list' ? 'prefs' : 'list')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  panelTab === 'prefs'
                    ? isDark
                      ? 'bg-[#FCF1D0] text-[#0D1C42]'
                      : 'bg-slate-900 text-white'
                    : isDark
                    ? 'bg-[#172A57] text-[#FCF1D0] border border-[#345294] hover:bg-[#2B4684]'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-3 h-3" />
                <span>{panelTab === 'prefs' ? 'Daftar' : 'Atur'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  isDark
                    ? 'text-[#B8C4E0] hover:text-[#FCF1D0] hover:bg-[#172A57]'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                }`}
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ================================================================
              TAB 1: NOTIFICATION LIST
             ================================================================ */}
          {panelTab === 'list' ? (
            <>
              {/* Browser Permission Prompt Banner (if not yet granted) */}
              {browserNotificationPermission === 'default' && (
                <div
                  className={`mx-3.5 mt-3 p-3 rounded-2xl border flex items-center justify-between gap-2.5 ${
                    isDark
                      ? 'bg-[#22396F] border-amber-400/40 text-[#FCF1D0]'
                      : 'bg-amber-50 border-amber-200 text-slate-900'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold">
                      Aktifkan Notifikasi Browser
                    </div>
                    <p
                      className={`text-[10px] leading-snug ${
                        isDark ? 'text-[#E8DEC0]' : 'text-slate-600'
                      }`}
                    >
                      Terima pop-up otomatis saat stok habis, kedaluwarsa, atau kas berubah.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => requestBrowserNotificationPermission()}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold shrink-0 transition-transform active:scale-95 cursor-pointer ${
                      isDark
                        ? 'bg-[#FCF1D0] text-[#0D1C42]'
                        : 'bg-slate-900 text-white'
                    }`}
                  >
                    Izinkan
                  </button>
                </div>
              )}

              {/* Filter Sub-bar */}
              <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'all', label: `Semua (${notifications.length})` },
                    { id: 'unread', label: `Belum Dibaca (${unreadNotificationCount})` },
                  ].map((f) => {
                    const active = listFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setListFilter(f.id as 'all' | 'unread')}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                          active
                            ? isDark
                              ? 'bg-[#FCF1D0] text-[#0D1C42]'
                              : 'bg-slate-900 text-white'
                            : isDark
                            ? 'bg-[#22396F] text-[#B8C4E0] hover:text-[#FCF1D0]'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer ${
                      isDark
                        ? 'text-[#6EE7B7] hover:underline'
                        : 'text-emerald-600 hover:underline'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Baca Semua</span>
                  </button>
                )}
              </div>

              {/* Scrollable Feed */}
              <div className="flex-1 overflow-y-auto px-3.5 pb-3 space-y-2 max-h-[360px]">
                {filteredList.length === 0 ? (
                  <div
                    className={`p-7 rounded-2xl border text-center space-y-1.5 ${
                      isDark
                        ? 'bg-[#22396F]/60 border-[#345294] text-[#B8C4E0]'
                        : 'bg-slate-50 border-slate-100 text-slate-500'
                    }`}
                  >
                    <Bell className="w-6 h-6 mx-auto opacity-50" />
                    <div
                      className={`text-xs font-bold ${
                        isDark ? 'text-[#FCF1D0]' : 'text-slate-800'
                      }`}
                    >
                      {listFilter === 'unread'
                        ? 'Tidak Ada Notifikasi Belum Dibaca'
                        : 'Belum Ada Notifikasi Masuk'}
                    </div>
                    <p className="text-[11px]">
                      Transaksi kas, stok kritis, dan batas kedaluwarsa akan otomatis muncul di sini.
                    </p>
                  </div>
                ) : (
                  filteredList.map((item) => {
                    const meta = renderCategoryIcon(item.category);
                    const IconComp = meta.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          markNotificationRead(item.id);
                          setActiveTab(item.targetTab);
                          setIsOpen(false);
                        }}
                        className={`group relative p-3 rounded-2xl border flex items-start gap-3 transition-colors cursor-pointer ${
                          !item.read
                            ? isDark
                              ? 'bg-[#22396F] border-[#4A6BB5] hover:bg-[#294380]'
                              : 'bg-indigo-50/50 border-indigo-200/80 hover:bg-indigo-50'
                            : isDark
                            ? 'bg-[#172A57]/80 border-[#2B4580] hover:bg-[#22396F]/80 opacity-85'
                            : 'bg-white border-slate-100 hover:bg-slate-50 opacity-85'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${meta.boxClass}`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1 pr-5">
                          <div className="flex items-center gap-1.5">
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            )}
                            <span
                              className={`text-xs font-extrabold truncate ${
                                isDark ? 'text-[#FCF1D0]' : 'text-slate-900'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] leading-snug mt-0.5 line-clamp-2 ${
                              isDark ? 'text-[#E8DEC0]' : 'text-slate-600'
                            }`}
                          >
                            {item.message}
                          </p>
                          <span
                            className={`text-[10px] font-mono mt-1 block ${
                              isDark ? 'text-[#B8C4E0]' : 'text-slate-400'
                            }`}
                          >
                            {item.createdAt}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(item.id);
                          }}
                          className={`absolute top-2.5 right-2.5 p-1 rounded-full opacity-70 hover:opacity-100 transition-colors cursor-pointer ${
                            isDark
                              ? 'text-[#B8C4E0] hover:text-rose-300 hover:bg-[#172A57]'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Hapus notifikasi"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Actions */}
              {notifications.length > 0 && (
                <div
                  className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] ${
                    isDark ? 'bg-[#22396F] border-[#345294]' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setIsOpen(false);
                    }}
                    className={`font-semibold hover:underline cursor-pointer ${
                      isDark ? 'text-[#B8C4E0]' : 'text-slate-600'
                    }`}
                  >
                    Buka Pengaturan Lengkap
                  </button>
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="inline-flex items-center gap-1 font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Bersihkan Semua</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ================================================================
               TAB 2: GRANULAR NOTIFICATION PREFERENCES & BROWSER PERMISSION
               ================================================================ */
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[430px]">
              {/* Browser Permission Status Box */}
              <div
                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDark
                    ? 'bg-[#22396F] border-[#345294]'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold">Izin Notifikasi Browser</div>
                    <div
                      className={`text-[11px] flex items-center gap-1 mt-0.5 font-semibold ${
                        browserNotificationPermission === 'granted'
                          ? 'text-emerald-500'
                          : browserNotificationPermission === 'denied'
                          ? 'text-rose-400'
                          : 'text-amber-500'
                      }`}
                    >
                      {browserNotificationPermission === 'granted' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Diizinkan Browser (Aktif)</span>
                        </>
                      ) : browserNotificationPermission === 'denied' ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Diblokir oleh Pengaturan Browser</span>
                        </>
                      ) : browserNotificationPermission === 'unsupported' ? (
                        <span>Browser Tidak Mendukung Pop-up</span>
                      ) : (
                        <span>Menunggu Persetujuan Browser</span>
                      )}
                    </div>
                  </div>

                  {browserNotificationPermission === 'default' ? (
                    <button
                      type="button"
                      onClick={() => requestBrowserNotificationPermission()}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold cursor-pointer ${
                        isDark
                          ? 'bg-[#FCF1D0] text-[#0D1C42]'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      Minta Izin
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendTest}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
                        isDark
                          ? 'bg-[#172A57] border-[#345294] text-[#FCF1D0] hover:bg-[#2B4684]'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>Tes Notif</span>
                    </button>
                  )}
                </div>

                {browserNotificationPermission === 'denied' && (
                  <p className="text-[10px] text-rose-400 leading-relaxed">
                    Klik ikon gembok di sebelah alamat situs browser Anda lalu ubah{' '}
                    <strong>Notifications / Notifikasi</strong> menjadi <strong>Allow (Izinkan)</strong>.
                  </p>
                )}

                {testFeedback && (
                  <p
                    className={`text-[10px] font-semibold ${
                      isDark ? 'text-[#6EE7B7]' : 'text-emerald-600'
                    }`}
                  >
                    {testFeedback}
                  </p>
                )}
              </div>

              {/* Master Channels */}
              <div className="space-y-2">
                <div
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isDark ? 'text-[#B8C4E0]' : 'text-slate-400'
                  }`}
                >
                  Saluran Pemberitahuan
                </div>

                <label
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer ${
                    isDark
                      ? 'bg-[#22396F]/70 border-[#345294]'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Notifikasi Pop-up Browser</div>
                    <div
                      className={`text-[10px] ${
                        isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
                      }`}
                    >
                      Kirim notifikasi langsung ke layar perangkat
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      notificationPreferences.browserPushEnabled &&
                      browserNotificationPermission === 'granted'
                    }
                    onChange={handleToggleBrowserPush}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>

                <label
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer ${
                    isDark
                      ? 'bg-[#22396F]/70 border-[#345294]'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Kotak Masuk Lonceng Aplikasi</div>
                    <div
                      className={`text-[10px] ${
                        isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
                      }`}
                    >
                      Simpan riwayat peringatan di ikon lonceng atas
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPreferences.inAppEnabled}
                    onChange={(e) =>
                      updateNotificationPreferences({ inAppEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Granular Category Toggles */}
              <div className="space-y-1.5">
                <div
                  className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isDark ? 'text-[#B8C4E0]' : 'text-slate-400'
                  }`}
                >
                  Pilih Hal yang Ingin Dinotifikasi
                </div>

                {NOTIFICATION_CATEGORY_META.map((cat) => (
                  <label
                    key={cat.key}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-[#22396F]/50 hover:bg-[#22396F] border-[#2B4580]'
                        : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/70'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{cat.label}</div>
                      <div
                        className={`text-[10px] leading-snug ${
                          isDark ? 'text-[#B8C4E0]' : 'text-slate-500'
                        }`}
                      >
                        {cat.desc}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationPreferences[cat.key]}
                      onChange={(e) =>
                        updateNotificationPreferences({ [cat.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-emerald-500 shrink-0 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
