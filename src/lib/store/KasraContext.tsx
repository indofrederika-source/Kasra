'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Product,
  Transaction,
  StoreProfile,
  StockMovement,
  StockMovementType,
  ConfirmationDraft,
  TabType,
  CategoryDefinition,
  AppNotification,
  NotificationCategory,
  NotificationSeverity,
  NotificationPreferences,
} from '@/types';
import {
  INITIAL_PROFILE,
  INITIAL_CATEGORIES,
  INITIAL_CATEGORY_DEFINITIONS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_STOCK_MOVEMENTS,
} from '@/lib/mockData';
import { formatBatchName, formatDateIndo, formatRupiah, getActiveProductExpiry } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  fetchCloudStoreData,
  syncUpsertProduct,
  syncDeleteProduct,
  syncInsertTransaction,
  syncDeleteTransaction,
  syncInsertStockMovement,
  syncDeleteStockMovement,
  syncUpsertProfile,
  syncUpsertCategory,
  syncDeleteCategory,
} from '@/lib/supabase/syncService';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inAppEnabled: true,
  browserPushEnabled: true,
  cashIncome: true,
  cashExpense: true,
  stockOut: true,
  stockLow: true,
  expiryExpired: true,
  expiryNear: true,
  stockMutation: true,
  financeAlert: true,
};

function isCategoryEnabled(
  category: NotificationCategory,
  prefs: NotificationPreferences
): boolean {
  switch (category) {
    case 'cash_income':
      return prefs.cashIncome;
    case 'cash_expense':
      return prefs.cashExpense;
    case 'stock_out':
      return prefs.stockOut;
    case 'stock_low':
      return prefs.stockLow;
    case 'expiry_expired':
      return prefs.expiryExpired;
    case 'expiry_near':
      return prefs.expiryNear;
    case 'stock_mutation':
      return prefs.stockMutation;
    case 'finance_alert':
      return prefs.financeAlert;
    default:
      return true;
  }
}

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface KasraContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  products: Product[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
  profile: StoreProfile;
  categories: string[];
  categoryDefinitions: CategoryDefinition[];
  activeDraft: ConfirmationDraft | null;
  // Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (mainCategory: string, subcategory?: string) => void;
  addSubcategory: (mainCategory: string, subcategory: string) => void;
  deleteCategory: (categoryId: string) => void;
  deleteSubcategory: (mainCategory: string, subcategory: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteMultipleTransactions: (ids: string[]) => void;
  deleteMultipleProducts: (ids: string[]) => void;
  // Stock Movement Log Actions (Buku Mutasi / Kasir Gudang)
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => StockMovement;
  updateStockMovement: (id: string, updates: Partial<StockMovement>) => void;
  deleteStockMovement: (id: string) => void;
  // AI Draft Actions
  setActiveDraft: (draft: ConfirmationDraft | null) => void;
  applyConfirmationDraft: (draft: ConfirmationDraft) => void;
  cancelConfirmationDraft: () => void;
  // Profile & System Actions
  updateProfile: (updates: Partial<StoreProfile>) => void;
  resetToMockData: () => void;
  // Quick operations
  quickAdjustStock: (productId: string, delta: number, reason: string) => void;
  // Computed helpers
  todayIncome: number;
  todayExpense: number;
  todayProfit: number;
  monthIncome: number;
  monthExpense: number;
  criticalStockCount: number;
  nearExpiryCount: number;
  totalAssetValue: number;
  // Theme (Option 1: Dark BankSi UI, Option 2: Light Indigo Fintech UI)
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  // Notification System & Browser Push
  notifications: AppNotification[];
  unreadNotificationCount: number;
  notificationPreferences: NotificationPreferences;
  browserNotificationPermission: 'default' | 'granted' | 'denied' | 'unsupported';
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => void;
  requestBrowserNotificationPermission: () => Promise<'default' | 'granted' | 'denied' | 'unsupported'>;
  sendTestBrowserNotification: () => Promise<boolean>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const KasraContext = createContext<KasraContextType | undefined>(undefined);

export const KasraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateAccountProfile } = useAuth();
  const uid = user?.id || 'guest';

  const storageKeys = useMemo(
    () => ({
      PRODUCTS: `kasra_v3_${uid}_products`,
      TRANSACTIONS: `kasra_v3_${uid}_transactions`,
      MOVEMENTS: `kasra_v3_${uid}_movements`,
      PROFILE: `kasra_v3_${uid}_profile`,
      CATEGORY_DEFS: `kasra_v3_${uid}_category_defs`,
      NOTIFICATIONS: `kasra_v3_${uid}_notifications`,
      NOTIF_PREFS: `kasra_v3_${uid}_notif_prefs`,
      NOTIF_KEYS: `kasra_v3_${uid}_notif_keys`,
    }),
    [uid]
  );

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [profile, setProfile] = useState<StoreProfile>(() => ({
    ...INITIAL_PROFILE,
    storeName: user?.storeName || INITIAL_PROFILE.storeName,
    ownerName: user?.name || INITIAL_PROFILE.ownerName,
    businessCategory: user?.businessCategory || INITIAL_PROFILE.businessCategory,
  }));
  const [categoryDefinitions, setCategoryDefinitions] = useState<CategoryDefinition[]>(
    INITIAL_CATEGORY_DEFINITIONS
  );
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [activeDraft, setActiveDraft] = useState<ConfirmationDraft | null>(null);
  const [todayIso, setTodayIso] = useState<string>(() => getLocalTodayIso());
  const [theme, setThemeState] = useState<'dark' | 'light'>('light');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<
    'default' | 'granted' | 'denied' | 'unsupported'
  >('default');

  const prefsRef = useRef<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const notifiedKeysRef = useRef<Set<string>>(new Set());
  const hydratedUidRef = useRef<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    prefsRef.current = notificationPreferences;
  }, [notificationPreferences]);

  // Sync Web Notification API permission on mount & window focus
  useEffect(() => {
    const syncPermission = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setBrowserNotificationPermission('unsupported');
      } else {
        setBrowserNotificationPermission(window.Notification.permission);
      }
    };
    syncPermission();
    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  const pushNotification = useCallback(
    (payload: {
      category: NotificationCategory;
      severity: NotificationSeverity;
      title: string;
      message: string;
      targetTab: TabType;
      dedupKey?: string;
    }) => {
      const prefs = prefsRef.current;
      if (!isCategoryEnabled(payload.category, prefs)) return;

      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nowReadable = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      if (prefs.inAppEnabled) {
        const newNotif: AppNotification = {
          id,
          category: payload.category,
          severity: payload.severity,
          title: payload.title,
          message: payload.message,
          createdAt: nowReadable,
          timestamp: Date.now(),
          read: false,
          targetTab: payload.targetTab,
          dedupKey: payload.dedupKey,
        };
        setNotifications((prev) => [newNotif, ...prev].slice(0, 100));
      }

      if (
        prefs.browserPushEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted'
      ) {
        try {
          const browserNotif = new window.Notification(payload.title, {
            body: payload.message,
            icon: '/icon.svg',
            tag: payload.dedupKey || id,
          });
          browserNotif.onclick = () => {
            window.focus();
            setActiveTab(payload.targetTab);
            browserNotif.close();
          };
        } catch {
          // Ignore environments where ServiceWorker registration is strictly required
        }
      }
    },
    []
  );

  const requestBrowserNotificationPermission = useCallback(async (): Promise<
    'default' | 'granted' | 'denied' | 'unsupported'
  > => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserNotificationPermission('unsupported');
      return 'unsupported';
    }
    try {
      const result = await window.Notification.requestPermission();
      setBrowserNotificationPermission(result);
      if (result === 'granted') {
        setNotificationPreferences((prev) => {
          const next = { ...prev, browserPushEnabled: true };
          prefsRef.current = next;
          return next;
        });
        try {
          const n = new window.Notification('Notifikasi KASRA Aktif!', {
            body: 'Pemberitahuan uang masuk/keluar, stok habis, dan kedaluwarsa siap dikirim ke perangkat Anda.',
            icon: '/icon.svg',
            tag: 'kasra-welcome-notif',
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch {
          // ignore
        }
      }
      return result;
    } catch {
      const fallback = window.Notification.permission;
      setBrowserNotificationPermission(fallback);
      return fallback;
    }
  }, []);

  const sendTestBrowserNotification = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBrowserNotificationPermission('unsupported');
      return false;
    }
    let perm: NotificationPermission | 'unsupported' = window.Notification.permission;
    if (perm === 'default') {
      perm = await requestBrowserNotificationPermission();
    } else {
      setBrowserNotificationPermission(perm);
    }

    const id = `notif-test-${Date.now()}`;
    const nowReadable = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    setNotifications((prev) =>
      [
        {
          id,
          category: 'finance_alert' as NotificationCategory,
          severity: 'info' as NotificationSeverity,
          title: 'Tes Notifikasi KASRA Berhasil',
          message: 'Sistem notifikasi aplikasi & browser telah terhubung dengan kas dan gudang toko Anda.',
          createdAt: nowReadable,
          timestamp: Date.now(),
          read: false,
          targetTab: 'dashboard' as TabType,
        },
        ...prev,
      ].slice(0, 100)
    );

    if (perm === 'granted') {
      try {
        const n = new window.Notification('Tes Notifikasi KASRA Berhasil', {
          body: 'Notifikasi browser aktif dan terhubung dengan arus kas serta stok gudang toko Anda.',
          icon: '/icon.svg',
          tag: id,
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, [requestBrowserNotificationPermission]);

  const updateNotificationPreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setNotificationPreferences((prev) => {
      const next = { ...prev, ...updates };
      prefsRef.current = next;
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Hydrate theme preference from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('kasra_ui_theme') as 'dark' | 'light' | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
        document.documentElement.classList.toggle('dark-theme', savedTheme === 'dark');
      }
    } catch {
      // ignore
    }
  }, []);

  const setTheme = (nextTheme: 'dark' | 'light') => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem('kasra_ui_theme', nextTheme);
      document.documentElement.classList.toggle('dark-theme', nextTheme === 'dark');
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Hydrate per-user clean workspace from localStorage on mount / user change
  useEffect(() => {
    setIsHydrated(false);
    setTodayIso(getLocalTodayIso());

    try {
      const storedProds = localStorage.getItem(storageKeys.PRODUCTS);
      setProducts(storedProds ? JSON.parse(storedProds) : []);

      const storedTrx = localStorage.getItem(storageKeys.TRANSACTIONS);
      setTransactions(storedTrx ? JSON.parse(storedTrx) : []);

      const storedMov = localStorage.getItem(storageKeys.MOVEMENTS);
      setStockMovements(storedMov ? JSON.parse(storedMov) : []);

      const storedProf = localStorage.getItem(storageKeys.PROFILE);
      if (storedProf) {
        setProfile(JSON.parse(storedProf));
      } else {
        setProfile({
          ...INITIAL_PROFILE,
          storeName: user?.storeName || INITIAL_PROFILE.storeName,
          ownerName: user?.name || INITIAL_PROFILE.ownerName,
          businessCategory: user?.businessCategory || '',
          monthlyTarget: 0,
        });
      }

      const storedDefs = localStorage.getItem(storageKeys.CATEGORY_DEFS);
      if (storedDefs) {
        const parsed: CategoryDefinition[] = JSON.parse(storedDefs);
        setCategoryDefinitions(parsed);
        setCategories(['Semua', ...parsed.map((c) => c.name)]);
      } else {
        setCategoryDefinitions([]);
        setCategories(['Semua']);
      }

      const storedNotifs = localStorage.getItem(storageKeys.NOTIFICATIONS);
      setNotifications(storedNotifs ? JSON.parse(storedNotifs) : []);

      const storedPrefs = localStorage.getItem(storageKeys.NOTIF_PREFS);
      if (storedPrefs) {
        const mergedPrefs = {
          ...DEFAULT_NOTIFICATION_PREFERENCES,
          ...JSON.parse(storedPrefs),
        };
        setNotificationPreferences(mergedPrefs);
        prefsRef.current = mergedPrefs;
      } else {
        setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
        prefsRef.current = DEFAULT_NOTIFICATION_PREFERENCES;
      }

      const storedKeys = localStorage.getItem(storageKeys.NOTIF_KEYS);
      notifiedKeysRef.current = new Set(storedKeys ? JSON.parse(storedKeys) : []);

      // If Supabase is configured and user is logged in, sync with cloud data
      if (isSupabaseConfigured && uid && uid !== 'guest') {
        fetchCloudStoreData(uid).then((cloud) => {
          if (cloud) {
            if (cloud.products && cloud.products.length > 0) setProducts(cloud.products);
            if (cloud.transactions && cloud.transactions.length > 0) setTransactions(cloud.transactions);
            if (cloud.stockMovements && cloud.stockMovements.length > 0) setStockMovements(cloud.stockMovements);
            if (cloud.categoryDefinitions && cloud.categoryDefinitions.length > 0) {
              setCategoryDefinitions(cloud.categoryDefinitions);
              setCategories(['Semua', ...cloud.categoryDefinitions.map((c) => c.name)]);
            }
            if (cloud.profile) {
              setProfile((prev) => ({ ...prev, ...cloud.profile }));
            }
          }
        }).catch((err) => {
          console.warn('[Supabase Sync] Background cloud fetch error:', err);
        });
      }
    } catch (e) {
      console.warn('Failed to parse cached local data, using empty defaults', e);
      setProducts([]);
      setTransactions([]);
      setStockMovements([]);
      setCategoryDefinitions([]);
      setCategories(['Semua']);
      setNotifications([]);
      setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      prefsRef.current = DEFAULT_NOTIFICATION_PREFERENCES;
      notifiedKeysRef.current = new Set();
    }

    hydratedUidRef.current = uid;
    setIsHydrated(true);
  }, [storageKeys, uid, user]);

  // Save changes to localStorage after hydration
  useEffect(() => {
    if (!isHydrated || hydratedUidRef.current !== uid) return;
    try {
      localStorage.setItem(storageKeys.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(storageKeys.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(storageKeys.MOVEMENTS, JSON.stringify(stockMovements));
      localStorage.setItem(storageKeys.PROFILE, JSON.stringify(profile));
      localStorage.setItem(storageKeys.CATEGORY_DEFS, JSON.stringify(categoryDefinitions));
      localStorage.setItem(storageKeys.NOTIFICATIONS, JSON.stringify(notifications));
      localStorage.setItem(storageKeys.NOTIF_PREFS, JSON.stringify(notificationPreferences));
    } catch (e) {
      console.warn('Failed to persist to localStorage', e);
    }
  }, [
    products,
    transactions,
    stockMovements,
    profile,
    categoryDefinitions,
    notifications,
    notificationPreferences,
    isHydrated,
    storageKeys,
    uid,
  ]);

  const addCategory = (mainCategory: string, subcategory?: string) => {
    const trimmed = mainCategory.trim();
    if (!trimmed || trimmed.toLowerCase() === 'semua') return;

    const existing = categoryDefinitions.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    const subTrimmed = subcategory?.trim();
    let defToSync: CategoryDefinition;
    if (existing) {
      if (subTrimmed && !existing.subcategories.some((s) => s.toLowerCase() === subTrimmed.toLowerCase())) {
        defToSync = { ...existing, subcategories: [...existing.subcategories, subTrimmed] };
      } else {
        defToSync = existing;
      }
    } else {
      defToSync = {
        id: `cat-main-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        subcategories: subTrimmed ? [subTrimmed] : [],
      };
    }

    setCategoryDefinitions((prev) => {
      const prevExisting = prev.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (prevExisting) {
        if (
          subTrimmed &&
          !prevExisting.subcategories.some((s) => s.toLowerCase() === subTrimmed.toLowerCase())
        ) {
          return prev.map((c) =>
            c.id === prevExisting.id
              ? { ...c, subcategories: [...c.subcategories, subTrimmed] }
              : c
          );
        }
        return prev;
      }
      return [...prev, defToSync];
    });

    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });

    if (uid && uid !== 'guest') {
      syncUpsertCategory(uid, defToSync);
    }
  };

  const addSubcategory = (mainCategory: string, subcategory: string) => {
    const cleanMain = mainCategory.trim();
    const cleanSub = subcategory.trim();
    if (!cleanMain || !cleanSub) return;

    const existing = categoryDefinitions.find((c) => c.name.toLowerCase() === cleanMain.toLowerCase());
    let defToSync: CategoryDefinition;
    if (existing) {
      if (!existing.subcategories.some((s) => s.toLowerCase() === cleanSub.toLowerCase())) {
        defToSync = { ...existing, subcategories: [...existing.subcategories, cleanSub] };
      } else {
        defToSync = existing;
      }
    } else {
      defToSync = {
        id: `cat-main-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanMain,
        subcategories: [cleanSub],
      };
    }

    setCategoryDefinitions((prev) => {
      const prevExisting = prev.find((c) => c.name.toLowerCase() === cleanMain.toLowerCase());
      if (prevExisting) {
        if (!prevExisting.subcategories.some((s) => s.toLowerCase() === cleanSub.toLowerCase())) {
          return prev.map((c) =>
            c.id === prevExisting.id ? { ...c, subcategories: [...c.subcategories, cleanSub] } : c
          );
        }
        return prev;
      }
      return [...prev, defToSync];
    });

    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === cleanMain.toLowerCase())) return prev;
      return [...prev, cleanMain];
    });

    if (uid && uid !== 'guest') {
      syncUpsertCategory(uid, defToSync);
    }
  };

  const deleteCategory = (categoryIdOrName: string) => {
    const target = categoryIdOrName.trim().toLowerCase();
    const existing = categoryDefinitions.find(
      (c) => c.id === categoryIdOrName || c.name.toLowerCase() === target
    );

    setCategoryDefinitions((prev) => {
      const next = prev.filter(
        (c) => c.id !== categoryIdOrName && c.name.toLowerCase() !== target
      );
      setCategories(['Semua', ...next.map((c) => c.name)]);
      return next;
    });

    if (uid && uid !== 'guest' && existing) {
      syncDeleteCategory(uid, existing.id);
    }
  };

  const deleteSubcategory = (mainCategory: string, subcategory: string) => {
    const cleanMain = mainCategory.trim();
    const cleanSub = subcategory.trim();
    const existing = categoryDefinitions.find((c) => c.name.toLowerCase() === cleanMain.toLowerCase());

    setCategoryDefinitions((prev) =>
      prev.map((c) =>
        c.name.toLowerCase() === cleanMain.toLowerCase()
          ? {
              ...c,
              subcategories: c.subcategories.filter(
                (s) => s.toLowerCase() !== cleanSub.toLowerCase()
              ),
            }
          : c
      )
    );

    if (uid && uid !== 'guest' && existing) {
      syncUpsertCategory(uid, {
        ...existing,
        subcategories: existing.subcategories.filter((s) => s.toLowerCase() !== cleanSub.toLowerCase()),
      });
    }
  };

  // Product Operations
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nowIso = getLocalTodayIso();

    if (data.category && data.category.trim()) {
      addCategory(data.category.trim(), data.subcategory?.trim() || undefined);
    }

    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Record initial stock movement if stock > 0
    if (newProduct.currentStock > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        location: newProduct.location || 'Gudang Utama',
        type: 'in_purchase',
        quantityDelta: newProduct.currentStock,
        unit: newProduct.unit,
        stockBefore: 0,
        stockAfter: newProduct.currentStock,
        batchCode: formatBatchName(newProduct.purchaseDate || nowIso),
        batchExpiry: newProduct.expiryDate || null,
        financialAmount: (newProduct.hppAmount || 0) * newProduct.currentStock,
        source: 'Input Barang Baru',
        notes: 'Stok Awal Produk Baru',
        createdAt: new Date().toLocaleString('id-ID'),
      };
      setStockMovements((prev) => [movement, ...prev]);

      if (uid && uid !== 'guest') {
        syncInsertStockMovement(uid, movement);
      }
    }

    pushNotification({
      category: 'stock_mutation',
      severity: 'info',
      title: `Barang Baru: ${newProduct.name}`,
      message: `Ditambahkan ke ${newProduct.location || 'Gudang Utama'} (${newProduct.currentStock} ${newProduct.unit})`,
      targetTab: 'storage',
    });

    if (uid && uid !== 'guest') {
      syncUpsertProduct(uid, newProduct);
    }

    return newProduct;
  };

  const updateProduct = (
    id: string,
    updates: Partial<Product>,
    options?: { silent?: boolean }
  ) => {
    if (updates.category && updates.category.trim()) {
      addCategory(updates.category.trim(), updates.subcategory?.trim() || undefined);
    }

    const existingProd = products.find((p) => p.id === id);
    const nowIso = getLocalTodayIso();
    let updatedProdForSync: Product | null = null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          let syncedBatches = updates.batches !== undefined ? updates.batches : p.batches;
          if (updates.expiryDate !== undefined && updates.batches === undefined && p.batches && p.batches.length > 0) {
            if (updates.expiryDate === null) {
              syncedBatches = p.batches.map((b) => ({ ...b, expiryDate: null }));
            } else {
              let updatedFirstActive = false;
              syncedBatches = p.batches.map((b) => {
                if (!updatedFirstActive && b.quantity > 0) {
                  updatedFirstActive = true;
                  return { ...b, expiryDate: updates.expiryDate };
                }
                return b;
              });
              if (!updatedFirstActive && syncedBatches.length > 0) {
                syncedBatches[0] = { ...syncedBatches[0], expiryDate: updates.expiryDate };
              }
            }
          }

          const nextProd = {
            ...p,
            ...updates,
            batches: syncedBatches,
            updatedAt: nowIso,
          };
          updatedProdForSync = nextProd;
          return nextProd;
        }
        return p;
      })
    );

    if (uid && uid !== 'guest') {
      if (updatedProdForSync) {
        syncUpsertProduct(uid, updatedProdForSync);
      } else if (existingProd) {
        syncUpsertProduct(uid, { ...existingProd, ...updates, updatedAt: nowIso });
      }
    }

    if (!options?.silent && existingProd) {
      const targetName = updates.name || existingProd.name;
      const changedParts: string[] = [];
      if (updates.sellingPrice !== undefined && updates.sellingPrice !== existingProd.sellingPrice) {
        changedParts.push(`Harga jual ${formatRupiah(updates.sellingPrice)}`);
      }
      if (updates.hppAmount !== undefined && updates.hppAmount !== existingProd.hppAmount) {
        changedParts.push(`Modal ${formatRupiah(updates.hppAmount)}`);
      }
      if (updates.expiryDate !== undefined && updates.expiryDate !== existingProd.expiryDate) {
        changedParts.push(
          updates.expiryDate ? `Kedaluwarsa ${formatDateIndo(updates.expiryDate)}` : 'Bebas kedaluwarsa'
        );
      }
      if (updates.currentStock !== undefined && updates.currentStock !== existingProd.currentStock) {
        changedParts.push(`Stok ${updates.currentStock} ${updates.unit || existingProd.unit}`);
      }
      if (updates.location !== undefined && updates.location !== existingProd.location) {
        changedParts.push(`Lokasi ${updates.location}`);
      }

      if (changedParts.length > 0 || updates.name !== undefined || updates.imageUrl !== undefined) {
        pushNotification({
          category: 'stock_mutation',
          severity: 'info',
          title: `Info Barang Diperbarui: ${targetName}`,
          message:
            changedParts.length > 0
              ? changedParts.join(' • ')
              : `Data barang ${targetName} berhasil diperbarui.`,
          targetTab: 'storage',
        });
      }
    }
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (uid && uid !== 'guest') {
      syncDeleteProduct(uid, id);
    }
  };

  const deleteMultipleProducts = (ids: string[]) => {
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    if (uid && uid !== 'guest') {
      ids.forEach((id) => syncDeleteProduct(uid, id));
    }
  };

  // Transaction Operations
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const trxId = `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowReadable = new Date().toLocaleString('id-ID');
    const nowIso = data.date || getLocalTodayIso();
    let createdMovementId: string | undefined = data.relatedMovementId;

    // Check if linked to an inventory product
    if (data.relatedProductId && data.relatedQuantity && data.relatedQuantity > 0) {
      const targetProd = products.find((p) => p.id === data.relatedProductId);
      if (targetProd) {
        const qty = Number(data.relatedQuantity);
        const oldStock = targetProd.currentStock;
        const movType: StockMovementType = data.type === 'income' ? 'out_sale' : 'in_purchase';
        const delta = data.type === 'income' ? -qty : qty;
        const newStock = Math.max(0, oldStock + delta);

        const updatedBatches = targetProd.batches ? targetProd.batches.map((b) => ({ ...b })) : [];
        if (movType === 'in_purchase') {
          updatedBatches.push({
            id: `batch-${Date.now()}`,
            quantity: qty,
            receivedDate: nowIso,
            batchCode: formatBatchName(nowIso),
            costPerUnit: targetProd.hppAmount,
            expiryDate: targetProd.expiryDate || null,
          });
        } else {
          let toDeduct = qty;
          if (updatedBatches.length > 0) {
            updatedBatches.sort((a, b) => {
              if (!a.expiryDate) return 1;
              if (!b.expiryDate) return -1;
              return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
            });
            for (const b of updatedBatches) {
              if (toDeduct <= 0) break;
              if (b.quantity > 0) {
                const dec = Math.min(b.quantity, toDeduct);
                b.quantity -= dec;
                toDeduct -= dec;
              }
            }
          }
        }

        const earliestExp = getActiveProductExpiry(updatedBatches, targetProd.expiryDate);
        updateProduct(
          targetProd.id,
          {
            currentStock: newStock,
            batches: updatedBatches,
            expiryDate: earliestExp || undefined,
            lastSoldAt: movType === 'out_sale' ? nowReadable : targetProd.lastSoldAt,
            purchaseDate: movType === 'in_purchase' ? nowIso : targetProd.purchaseDate,
          },
          { silent: true }
        );

        if (!createdMovementId) {
          const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          createdMovementId = movId;
          const newMovement: StockMovement = {
            id: movId,
            productId: targetProd.id,
            productName: targetProd.name,
            sku: targetProd.sku,
            category: targetProd.category,
            location: targetProd.location || 'Gudang Utama',
            type: movType,
            quantityDelta: delta,
            unit: targetProd.unit,
            stockBefore: oldStock,
            stockAfter: newStock,
            batchCode: movType === 'in_purchase' ? formatBatchName(nowIso) : undefined,
            batchExpiry: earliestExp,
            financialAmount: data.amount,
            relatedTransactionId: trxId,
            source: data.inputMethod === 'mic' ? 'Suara' : 'Buku Kas',
            notes: data.description,
            createdAt: nowReadable,
          };
          setStockMovements((prev) => [newMovement, ...prev]);

          if (uid && uid !== 'guest') {
            syncInsertStockMovement(uid, newMovement);
          }
        }
      }
    }

    const newTrx: Transaction = {
      ...data,
      date: nowIso,
      id: trxId,
      relatedMovementId: createdMovementId,
      createdAt: nowReadable,
    };
    setTransactions((prev) => [newTrx, ...prev]);

    if (uid && uid !== 'guest') {
      syncInsertTransaction(uid, newTrx);
    }

    pushNotification({
      category: data.type === 'income' ? 'cash_income' : 'cash_expense',
      severity: data.type === 'income' ? 'success' : 'danger',
      title:
        data.type === 'income'
          ? `Uang Masuk +${formatRupiah(data.amount)}`
          : `Uang Keluar -${formatRupiah(data.amount)}`,
      message: `${data.description} (${data.category})`,
      targetTab: 'cash',
    });

    return newTrx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const existing = transactions.find((t) => t.id === id);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    if (uid && uid !== 'guest' && existing) {
      syncInsertTransaction(uid, { ...existing, ...updates });
    }
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (target && target.relatedMovementId) {
      setStockMovements((prev) => prev.filter((m) => m.id !== target.relatedMovementId));
      if (uid && uid !== 'guest') {
        syncDeleteStockMovement(uid, target.relatedMovementId);
      }
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (uid && uid !== 'guest') {
      syncDeleteTransaction(uid, id);
    }
  };

  const deleteMultipleTransactions = (ids: string[]) => {
    const targetMovements = transactions
      .filter((t) => ids.includes(t.id) && t.relatedMovementId)
      .map((t) => t.relatedMovementId!);
    if (targetMovements.length > 0) {
      setStockMovements((prev) => prev.filter((m) => !targetMovements.includes(m.id)));
      if (uid && uid !== 'guest') {
        targetMovements.forEach((movId) => syncDeleteStockMovement(uid, movId));
      }
    }
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
    if (uid && uid !== 'guest') {
      ids.forEach((id) => syncDeleteTransaction(uid, id));
    }
  };

  // Stock Movement Log Operations (Buku Mutasi / Kasir Gudang)
  const addStockMovement = (movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement => {
    const movId = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowReadable = new Date().toLocaleString('id-ID');
    const nowIso = getLocalTodayIso();

    let linkedTrxId: string | undefined = movement.relatedTransactionId;

    const matchedProduct = products.find((p) => p.id === movement.productId);
    if (matchedProduct) {
      const delta = movement.quantityDelta;
      const oldStock = matchedProduct.currentStock;
      const newStock = Math.max(0, oldStock + delta);
      const isRestock = movement.type === 'in_purchase';

      const updatedBatches = matchedProduct.batches ? matchedProduct.batches.map((b) => ({ ...b })) : [];
      if (isRestock) {
        updatedBatches.push({
          id: `batch-${Date.now()}`,
          quantity: Math.abs(delta),
          expiryDate: movement.batchExpiry || null,
          receivedDate: nowIso,
          costPerUnit: matchedProduct.hppAmount,
          batchCode: movement.batchCode || formatBatchName(nowIso),
        });
      } else {
        let remainingToDeduct = Math.abs(delta);
        if (updatedBatches.length > 0) {
          updatedBatches.sort((a, b) => {
            if (!a.expiryDate) return 1;
            if (!b.expiryDate) return -1;
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          });
          for (const b of updatedBatches) {
            if (remainingToDeduct <= 0) break;
            if (b.quantity > 0) {
              const dec = Math.min(b.quantity, remainingToDeduct);
              b.quantity -= dec;
              remainingToDeduct -= dec;
            }
          }
        }
      }

      const earliestExp = getActiveProductExpiry(
        updatedBatches,
        movement.batchExpiry || matchedProduct.expiryDate
      );
      updateProduct(
        matchedProduct.id,
        {
          currentStock: newStock,
          batches: updatedBatches,
          expiryDate: earliestExp || undefined,
          lastSoldAt: !isRestock ? nowReadable : matchedProduct.lastSoldAt,
          purchaseDate: isRestock ? nowIso : matchedProduct.purchaseDate,
        },
        { silent: true }
      );

      // Sync with Buku Kas if financialAmount > 0 and no transaction already linked
      if (movement.financialAmount && movement.financialAmount > 0 && !linkedTrxId) {
        const trxId = `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        linkedTrxId = trxId;

        const isExpense = movement.type === 'in_purchase' || movement.type === 'waste';
        const trxDesc =
          movement.notes ||
          (isExpense
            ? `Kulakan ${matchedProduct.name} (${Math.abs(delta)} ${matchedProduct.unit})`
            : `Penjualan ${matchedProduct.name} (${Math.abs(delta)} ${matchedProduct.unit})`);
        const trxCat = isExpense ? matchedProduct.category || 'Bahan Baku' : 'Penjualan';

        const newTrx: Transaction = {
          id: trxId,
          type: isExpense ? 'expense' : 'income',
          amount: movement.financialAmount,
          category: trxCat,
          description: trxDesc,
          date: nowIso,
          inputMethod: 'manual',
          relatedProductId: matchedProduct.id,
          relatedQuantity: Math.abs(delta),
          relatedMovementId: movId,
          createdAt: nowReadable,
        };
        setTransactions((prev) => [newTrx, ...prev]);

        if (uid && uid !== 'guest') {
          syncInsertTransaction(uid, newTrx);
        }

        pushNotification({
          category: isExpense ? 'cash_expense' : 'cash_income',
          severity: isExpense ? 'danger' : 'success',
          title: isExpense
            ? `Uang Keluar -${formatRupiah(movement.financialAmount)}`
            : `Uang Masuk +${formatRupiah(movement.financialAmount)}`,
          message: `${trxDesc} (${trxCat})`,
          targetTab: 'cash',
        });
      }

      if (movement.type === 'waste') {
        pushNotification({
          category: 'stock_mutation',
          severity: 'warning',
          title: `Barang Rusak / Susut: ${matchedProduct.name}`,
          message: `Stok berkurang ${Math.abs(delta)} ${matchedProduct.unit} (${movement.notes || 'Penyusutan Gudang'})`,
          targetTab: 'storage',
        });
      } else if (!linkedTrxId) {
        pushNotification({
          category: 'stock_mutation',
          severity: 'info',
          title:
            delta >= 0
              ? `Stok Masuk: ${matchedProduct.name}`
              : `Stok Keluar: ${matchedProduct.name}`,
          message: `${delta >= 0 ? '+' : ''}${delta} ${matchedProduct.unit} • Sisa sekarang: ${newStock} ${matchedProduct.unit}`,
          targetTab: 'storage',
        });
      }
    }

    const newMov: StockMovement = {
      ...movement,
      id: movId,
      relatedTransactionId: linkedTrxId,
      createdAt: nowReadable,
    };
    setStockMovements((prev) => [newMov, ...prev]);

    if (uid && uid !== 'guest') {
      syncInsertStockMovement(uid, newMov);
    }

    return newMov;
  };

  const updateStockMovement = (id: string, updates: Partial<StockMovement>) => {
    const existing = stockMovements.find((m) => m.id === id);
    setStockMovements((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          if (m.relatedTransactionId && updates.financialAmount !== undefined) {
            updateTransaction(m.relatedTransactionId, { amount: updates.financialAmount });
          }
          return { ...m, ...updates };
        }
        return m;
      })
    );

    if (uid && uid !== 'guest' && existing) {
      syncInsertStockMovement(uid, { ...existing, ...updates });
    }
  };

  const deleteStockMovement = (id: string) => {
    const target = stockMovements.find((m) => m.id === id);
    if (target && target.relatedTransactionId) {
      setTransactions((prev) => prev.filter((t) => t.id !== target.relatedTransactionId));
      if (uid && uid !== 'guest') {
        syncDeleteTransaction(uid, target.relatedTransactionId);
      }
    }
    setStockMovements((prev) => prev.filter((m) => m.id !== id));
    if (uid && uid !== 'guest') {
      syncDeleteStockMovement(uid, id);
    }
  };

  // Quick Stock Adjustment
  const quickAdjustStock = (productId: string, delta: number, reason: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const oldStock = target.currentStock;
    const newStock = Math.max(0, oldStock + delta);
    const nowIso = getLocalTodayIso();
    const financialVal = delta > 0 ? target.hppAmount * delta : target.sellingPrice * Math.abs(delta);

    addStockMovement({
      productId,
      productName: target.name,
      sku: target.sku,
      category: target.category,
      location: target.location,
      type: delta > 0 ? 'in_purchase' : 'out_sale',
      quantityDelta: delta,
      unit: target.unit,
      stockBefore: oldStock,
      stockAfter: newStock,
      batchCode: delta > 0 ? formatBatchName(nowIso) : undefined,
      batchExpiry: target.expiryDate,
      financialAmount: financialVal,
      source: 'Penyesuaian Cepat',
      notes: reason,
    });
  };

  // Human-In-The-Loop Draft Execution
  const applyConfirmationDraft = (draft: ConfirmationDraft) => {
    const nowIso = getLocalTodayIso();
    const nowReadable = new Date().toLocaleString('id-ID');

    // 0. Process Category & Subcategory Changes
    if (draft.categoryChanges && draft.categoryChanges.length > 0) {
      draft.categoryChanges.forEach((catChange) => {
        if (catChange.action === 'add_sub' && catChange.subcategory) {
          addSubcategory(catChange.mainCategory, catChange.subcategory);
        } else {
          addCategory(catChange.mainCategory, catChange.subcategory);
        }
      });
    }

    // 1. Process all cash changes
    const newTransactionsToAdd: Transaction[] = draft.cashChanges.map((cash, idx) => ({
      id: `trx-${Date.now()}-${idx}`,
      type: cash.type,
      amount: cash.amount,
      category: cash.category,
      description: cash.description,
      date: nowIso,
      inputMethod: draft.source.startsWith('mic') ? 'mic' : 'photo',
      createdAt: nowReadable,
    }));

    // 2. Process all stock changes
    const newMovements: StockMovement[] = [];
    const updatedProducts = [...products];
    const newlyCreatedProducts: Product[] = [];

    draft.stockChanges.forEach((change) => {
      if (change.category && change.category.trim()) {
        addCategory(change.category.trim());
      }

      let matchedIndex = -1;
      if (change.productId) {
        matchedIndex = updatedProducts.findIndex((p) => p.id === change.productId);
      } else {
        matchedIndex = updatedProducts.findIndex(
          (p) => p.name.toLowerCase() === change.productName.toLowerCase()
        );
      }

      if (matchedIndex >= 0) {
        const existing = updatedProducts[matchedIndex];
        const oldStock = existing.currentStock;
        const newStock = Math.max(0, oldStock + change.quantityDelta);

        let updatedBatches = [...(existing.batches || [])];
        if (change.quantityDelta > 0) {
          updatedBatches.push({
            id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            batchCode: formatBatchName(nowIso),
            quantity: change.quantityDelta,
            expiryDate: change.expiryDate || existing.expiryDate || null,
            receivedDate: nowIso,
            costPerUnit: change.pricePerUnit || existing.hppAmount,
          });
        } else if (change.quantityDelta < 0) {
          let toDeduct = Math.abs(change.quantityDelta);
          updatedBatches = updatedBatches
            .map((b) => {
              if (toDeduct <= 0) return b;
              if (b.quantity <= toDeduct) {
                toDeduct -= b.quantity;
                return { ...b, quantity: 0 };
              } else {
                const rem = b.quantity - toDeduct;
                toDeduct = 0;
                return { ...b, quantity: rem };
              }
            })
            .filter((b) => b.quantity > 0);
        }

        const earliestExpiry = getActiveProductExpiry(
          updatedBatches,
          change.expiryDate || existing.expiryDate
        );

        updatedProducts[matchedIndex] = {
          ...existing,
          currentStock: newStock,
          location: change.location || existing.location,
          batches: updatedBatches,
          purchaseDate: change.quantityDelta > 0 ? nowIso : existing.purchaseDate,
          expiryDate: earliestExpiry,
          lastSoldAt: change.quantityDelta < 0 ? nowReadable : existing.lastSoldAt,
          updatedAt: nowIso,
        };

        newMovements.push({
          id: `mov-${Date.now()}-${Math.random()}`,
          productId: existing.id,
          productName: existing.name,
          sku: existing.sku,
          category: existing.category,
          location: change.location || existing.location,
          type: change.quantityDelta > 0 ? 'in_purchase' : 'out_sale',
          quantityDelta: change.quantityDelta,
          unit: existing.unit,
          stockBefore: oldStock,
          stockAfter: newStock,
          batchCode: change.quantityDelta > 0 ? formatBatchName(nowIso) : undefined,
          batchExpiry: earliestExpiry,
          financialAmount:
            change.quantityDelta > 0
              ? (change.pricePerUnit || existing.hppAmount) * change.quantityDelta
              : existing.sellingPrice * Math.abs(change.quantityDelta),
          source: draft.source.startsWith('mic') ? 'Suara' : 'Pencatatan Draf Pintar',
          notes: draft.title || (change.quantityDelta > 0 ? 'Stok Masuk' : 'Penjualan Kasir'),
          createdAt: nowReadable,
        });
      } else if (change.confirmedNewProduct) {
        const unitCost = change.hppAmount ?? change.pricePerUnit ?? 0;
        const unitSelling =
          change.sellingPrice !== undefined && change.sellingPrice > 0
            ? change.sellingPrice
            : unitCost > 0
            ? Math.round(unitCost * 1.3)
            : 0;
        const computedStock =
          change.quantityDelta >= 0
            ? change.initialStock !== undefined
              ? Math.max(0, change.initialStock)
              : Math.max(0, change.quantityDelta)
            : Math.max(
                0,
                (change.initialStock !== undefined
                  ? change.initialStock
                  : Math.abs(change.quantityDelta)) + change.quantityDelta
              );

        const newProd: Product = {
          id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sku: `KSR-${Math.floor(100 + Math.random() * 900)}`,
          name: change.productName,
          category: change.category || 'Produk Siap Jual',
          subcategory: change.subcategory || undefined,
          location: change.location || 'Gudang Utama',
          imageUrl: '',
          currentStock: computedStock,
          minStockAlert: change.minStockAlert ?? 5,
          unit: change.unit || 'pcs',
          purchaseDate: nowIso,
          expiryDate: change.expiryDate || null,
          batches:
            computedStock > 0
              ? [
                  {
                    id: `batch-${Date.now()}`,
                    batchCode: formatBatchName(nowIso),
                    quantity: computedStock,
                    expiryDate: change.expiryDate || null,
                    receivedDate: nowIso,
                    costPerUnit: unitCost,
                  },
                ]
              : [],
          hppAmount: unitCost,
          hppMethod: 'wholesale',
          sellingPrice: unitSelling,
          lastSoldAt: change.quantityDelta < 0 ? nowReadable : undefined,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        if (newProd.category && newProd.category.trim()) {
          addCategory(newProd.category.trim(), newProd.subcategory?.trim() || undefined);
        }

        updatedProducts.unshift(newProd);
        newlyCreatedProducts.push(newProd);

        newMovements.push({
          id: `mov-${Date.now()}-${Math.random()}`,
          productId: newProd.id,
          productName: newProd.name,
          sku: newProd.sku,
          category: newProd.category,
          location: newProd.location,
          type: change.quantityDelta >= 0 ? 'in_purchase' : 'out_sale',
          quantityDelta: change.quantityDelta,
          unit: newProd.unit,
          stockBefore: change.quantityDelta < 0 ? (change.initialStock ?? Math.abs(change.quantityDelta)) : 0,
          stockAfter: newProd.currentStock,
          batchCode: change.quantityDelta >= 0 ? formatBatchName(nowIso) : undefined,
          batchExpiry: newProd.expiryDate,
          financialAmount:
            change.quantityDelta >= 0
              ? unitCost * Math.max(1, change.quantityDelta)
              : unitSelling * Math.abs(change.quantityDelta),
          source: draft.source.startsWith('mic') ? 'Suara' : 'Pencatatan Draf Pintar',
          notes: draft.title || 'Barang Baru Ditambahkan ke Gudang',
          createdAt: nowReadable,
        });
      }
    });

    // Cross-link transactions and movements
    if (newTransactionsToAdd.length === 1 && newMovements.length === 1) {
      newTransactionsToAdd[0].relatedMovementId = newMovements[0].id;
      newMovements[0].relatedTransactionId = newTransactionsToAdd[0].id;
    } else {
      newTransactionsToAdd.forEach((trx) => {
        const movMatch = newMovements.find(
          (m) =>
            trx.description.toLowerCase().includes(m.productName.toLowerCase()) ||
            m.productName.toLowerCase().includes(trx.category.toLowerCase())
        );
        if (movMatch) {
          trx.relatedMovementId = movMatch.id;
          movMatch.relatedTransactionId = trx.id;
        }
      });
    }

    if (newTransactionsToAdd.length > 0) {
      setTransactions((prev) => [...newTransactionsToAdd, ...prev]);
      newTransactionsToAdd.forEach((trx) => {
        pushNotification({
          category: trx.type === 'income' ? 'cash_income' : 'cash_expense',
          severity: trx.type === 'income' ? 'success' : 'danger',
          title:
            trx.type === 'income'
              ? `Uang Masuk +${formatRupiah(trx.amount)}`
              : `Uang Keluar -${formatRupiah(trx.amount)}`,
          message: `${trx.description} (${trx.category})`,
          targetTab: 'cash',
        });
      });
    }

    newlyCreatedProducts.forEach((np) => {
      pushNotification({
        category: 'stock_mutation',
        severity: 'info',
        title: `Barang Baru: ${np.name}`,
        message: `Ditambahkan ke ${np.location || 'Gudang Utama'} (${np.currentStock} ${np.unit})`,
        targetTab: 'storage',
      });
    });

    if (newTransactionsToAdd.length === 0 && newMovements.length > 0) {
      newMovements.forEach((mov) => {
        pushNotification({
          category: 'stock_mutation',
          severity: 'info',
          title:
            mov.quantityDelta >= 0
              ? `Stok Masuk: ${mov.productName}`
              : `Stok Keluar: ${mov.productName}`,
          message: `${mov.quantityDelta >= 0 ? '+' : ''}${mov.quantityDelta} ${mov.unit || 'pcs'} • Sisa: ${mov.stockAfter} ${mov.unit || 'pcs'}`,
          targetTab: 'storage',
        });
      });
    }

    setProducts(updatedProducts);
    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    if (uid && uid !== 'guest') {
      if (newTransactionsToAdd.length > 0) {
        newTransactionsToAdd.forEach((t) => syncInsertTransaction(uid, t));
      }
      if (newMovements.length > 0) {
        newMovements.forEach((m) => syncInsertStockMovement(uid, m));
      }
      updatedProducts.forEach((p) => {
        const wasCreated = newlyCreatedProducts.some((np) => np.id === p.id);
        const wasChanged = draft.stockChanges.some(
          (sc) => (sc.productId && sc.productId === p.id) || sc.productName.toLowerCase() === p.name.toLowerCase()
        );
        if (wasCreated || wasChanged) {
          syncUpsertProduct(uid, p);
        }
      });
    }

    setActiveDraft(null);
  };

  const cancelConfirmationDraft = () => {
    setActiveDraft(null);
  };

  const updateProfile = (updates: Partial<StoreProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      if (
        user &&
        (updates.storeName !== undefined ||
          updates.ownerName !== undefined ||
          updates.businessCategory !== undefined)
      ) {
        updateAccountProfile({
          storeName: updates.storeName ?? user.storeName,
          name: updates.ownerName ?? user.name,
          businessCategory: updates.businessCategory ?? user.businessCategory,
        });
      }
      if (uid && uid !== 'guest') {
        syncUpsertProfile(uid, next);
      }
      return next;
    });
  };

  const resetToMockData = () => {
    const cleanProfile: StoreProfile = {
      ...INITIAL_PROFILE,
      storeName: user?.storeName || INITIAL_PROFILE.storeName,
      ownerName: user?.name || INITIAL_PROFILE.ownerName,
      businessCategory: user?.businessCategory || '',
      monthlyTarget: 0,
    };
    setProducts([]);
    setTransactions([]);
    setStockMovements([]);
    setProfile(cleanProfile);
    setCategoryDefinitions([]);
    setCategories(['Semua']);
    setActiveDraft(null);
    setNotifications([]);
    notifiedKeysRef.current = new Set();

    try {
      localStorage.removeItem(storageKeys.PRODUCTS);
      localStorage.removeItem(storageKeys.TRANSACTIONS);
      localStorage.removeItem(storageKeys.MOVEMENTS);
      localStorage.removeItem(storageKeys.PROFILE);
      localStorage.removeItem(storageKeys.CATEGORY_DEFS);
      localStorage.removeItem(storageKeys.NOTIFICATIONS);
      localStorage.removeItem(storageKeys.NOTIF_KEYS);
    } catch {
      // ignore
    }
  };

  // Computations
  const todayIncome = useMemo(() => {
    return transactions
      .filter((t) => t.date === todayIso && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, todayIso]);

  const todayExpense = useMemo(() => {
    return transactions
      .filter((t) => t.date === todayIso && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, todayIso]);

  const todayProfit = todayIncome - todayExpense;

  const currentMonthPrefix = todayIso.slice(0, 7);

  const monthIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && (t.date ? t.date.startsWith(currentMonthPrefix) : true))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthPrefix]);

  const monthExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && (t.date ? t.date.startsWith(currentMonthPrefix) : true))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthPrefix]);

  const criticalStockCount = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStockAlert).length;
  }, [products]);

  const nearExpiryCount = useMemo(() => {
    const parts = todayIso.split('-').map(Number);
    const today = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    today.setHours(0, 0, 0, 0);
    return products.filter((p) => {
      if (!p.expiryDate) return false;
      const ep = p.expiryDate.split('-').map(Number);
      if (ep.length !== 3) return false;
      const exp = new Date(ep[0], ep[1] - 1, ep[2]);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length;
  }, [products, todayIso]);

  const totalAssetValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.currentStock * p.hppAmount, 0);
  }, [products]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Reactive Condition Watcher: Stock Out, Stock Low, Expired, Near Expiry, Cash Deficit & Monthly Target
  useEffect(() => {
    if (!isHydrated || hydratedUidRef.current !== uid) return;

    const activeKeys = new Set<string>();
    const knownKeys = notifiedKeysRef.current;

    const parts = todayIso.split('-').map(Number);
    const todayZero = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1).getTime();

    products.forEach((p) => {
      if (p.currentStock <= 0) {
        const key = `stock_out:${p.id}`;
        activeKeys.add(key);
        if (!knownKeys.has(key)) {
          knownKeys.add(key);
          pushNotification({
            category: 'stock_out',
            severity: 'danger',
            title: `Stok Habis: ${p.name}`,
            message: `Sisa 0 ${p.unit} di ${p.location || 'Gudang Utama'}. Segera isi ulang stok!`,
            targetTab: 'storage',
            dedupKey: key,
          });
        }
      } else if (p.currentStock <= p.minStockAlert) {
        const key = `stock_low:${p.id}`;
        activeKeys.add(key);
        if (!knownKeys.has(key)) {
          knownKeys.add(key);
          pushNotification({
            category: 'stock_low',
            severity: 'warning',
            title: `Stok Menipis: ${p.name}`,
            message: `Tersisa ${p.currentStock} ${p.unit} (batas aman: ${p.minStockAlert} ${p.unit}).`,
            targetTab: 'storage',
            dedupKey: key,
          });
        }
      }

      if (p.expiryDate) {
        const ep = p.expiryDate.split('-').map(Number);
        if (ep.length === 3) {
          const expTime = new Date(ep[0], ep[1] - 1, ep[2]).getTime();
          const diffDays = Math.round((expTime - todayZero) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            const key = `exp_past:${p.id}:${p.expiryDate}`;
            activeKeys.add(key);
            if (!knownKeys.has(key)) {
              knownKeys.add(key);
              pushNotification({
                category: 'expiry_expired',
                severity: 'danger',
                title: `Barang Kedaluwarsa: ${p.name}`,
                message: `Telah melewati tanggal kedaluwarsa (${formatDateIndo(p.expiryDate)}).`,
                targetTab: 'storage',
                dedupKey: key,
              });
            }
          } else if (diffDays <= 7) {
            const key = `exp_near:${p.id}:${p.expiryDate}`;
            activeKeys.add(key);
            if (!knownKeys.has(key)) {
              knownKeys.add(key);
              pushNotification({
                category: 'expiry_near',
                severity: 'warning',
                title: `Mendekati Kedaluwarsa: ${p.name}`,
                message:
                  diffDays === 0
                    ? `Kedaluwarsa HARI INI (${formatDateIndo(p.expiryDate)}). Prioritaskan FEFO!`
                    : `Kedaluwarsa dalam ${diffDays} hari (${formatDateIndo(p.expiryDate)}).`,
                targetTab: 'storage',
                dedupKey: key,
              });
            }
          }
        }
      }
    });

    if (transactions.length > 0) {
      const totalBalance = transactions.reduce(
        (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
        0
      );
      if (totalBalance < 0) {
        const key = `finance_deficit:${todayIso}`;
        activeKeys.add(key);
        if (!knownKeys.has(key)) {
          knownKeys.add(key);
          pushNotification({
            category: 'finance_alert',
            severity: 'danger',
            title: 'Peringatan Saldo Kas Defisit',
            message: `Total saldo kas toko saat ini minus (${formatRupiah(totalBalance)}).`,
            targetTab: 'cash',
            dedupKey: key,
          });
        }
      }
    }

    if (profile.monthlyTarget > 0) {
      if (monthIncome >= profile.monthlyTarget) {
        const key = `target_100:${currentMonthPrefix}:${profile.monthlyTarget}`;
        activeKeys.add(key);
        if (!knownKeys.has(key)) {
          knownKeys.add(key);
          pushNotification({
            category: 'finance_alert',
            severity: 'success',
            title: 'Target Pendapatan Bulanan Tercapai!',
            message: `Pemasukan bulan ini (${formatRupiah(monthIncome)}) melampaui target ${formatRupiah(profile.monthlyTarget)}.`,
            targetTab: 'analytics',
            dedupKey: key,
          });
        }
      } else if (monthIncome >= profile.monthlyTarget * 0.8) {
        const key = `target_80:${currentMonthPrefix}:${profile.monthlyTarget}`;
        activeKeys.add(key);
        if (!knownKeys.has(key)) {
          knownKeys.add(key);
          pushNotification({
            category: 'finance_alert',
            severity: 'info',
            title: 'Target Bulanan Mencapai 80%',
            message: `Pemasukan bulan ini sudah mencapai ${formatRupiah(monthIncome)} dari target ${formatRupiah(profile.monthlyTarget)}.`,
            targetTab: 'analytics',
            dedupKey: key,
          });
        }
      }
    }

    // Prune resolved condition keys so re-occurring alerts can trigger again in the future
    Array.from(knownKeys).forEach((k) => {
      if (!activeKeys.has(k)) {
        knownKeys.delete(k);
      }
    });

    try {
      localStorage.setItem(storageKeys.NOTIF_KEYS, JSON.stringify(Array.from(knownKeys)));
    } catch {
      // ignore
    }
  }, [
    products,
    transactions,
    profile.monthlyTarget,
    monthIncome,
    currentMonthPrefix,
    todayIso,
    isHydrated,
    uid,
    storageKeys.NOTIF_KEYS,
    pushNotification,
  ]);

  return (
    <KasraContext.Provider
      value={{
        activeTab,
        setActiveTab,
        products,
        transactions,
        stockMovements,
        profile,
        categories,
        categoryDefinitions,
        activeDraft,
        setActiveDraft,
        applyConfirmationDraft,
        cancelConfirmationDraft,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        addCategory,
        addSubcategory,
        deleteCategory,
        deleteSubcategory,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteMultipleTransactions,
        addStockMovement,
        updateStockMovement,
        deleteStockMovement,
        updateProfile,
        resetToMockData,
        quickAdjustStock,
        todayIncome,
        todayExpense,
        todayProfit,
        monthIncome,
        monthExpense,
        criticalStockCount,
        nearExpiryCount,
        totalAssetValue,
        theme,
        toggleTheme,
        setTheme,
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
      }}
    >
      {children}
    </KasraContext.Provider>
  );
};

export const useKasra = () => {
  const context = useContext(KasraContext);
  if (!context) {
    throw new Error('useKasra must be used within a KasraProvider');
  }
  return context;
};
