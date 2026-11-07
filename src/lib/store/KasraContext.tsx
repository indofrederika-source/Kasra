'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  Product,
  Transaction,
  StoreProfile,
  StockMovement,
  StockMovementType,
  ConfirmationDraft,
  TabType,
  CategoryDefinition,
} from '@/types';
import {
  INITIAL_PROFILE,
  INITIAL_CATEGORIES,
  INITIAL_CATEGORY_DEFINITIONS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_STOCK_MOVEMENTS,
} from '@/lib/mockData';
import { formatBatchName, getActiveProductExpiry } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';

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
  const hydratedUidRef = useRef<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

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
    } catch (e) {
      console.warn('Failed to parse cached local data, using empty defaults', e);
      setProducts([]);
      setTransactions([]);
      setStockMovements([]);
      setCategoryDefinitions([]);
      setCategories(['Semua']);
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
    } catch (e) {
      console.warn('Failed to persist to localStorage', e);
    }
  }, [products, transactions, stockMovements, profile, categoryDefinitions, isHydrated, storageKeys, uid]);

  const addCategory = (mainCategory: string, subcategory?: string) => {
    const trimmed = mainCategory.trim();
    if (!trimmed || trimmed.toLowerCase() === 'semua') return;

    setCategoryDefinitions((prev) => {
      const existing = prev.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        if (
          subcategory &&
          subcategory.trim() &&
          !existing.subcategories.some((s) => s.toLowerCase() === subcategory.trim().toLowerCase())
        ) {
          return prev.map((c) =>
            c.id === existing.id
              ? { ...c, subcategories: [...c.subcategories, subcategory.trim()] }
              : c
          );
        }
        return prev;
      }
      const newDef: CategoryDefinition = {
        id: `cat-main-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        subcategories: subcategory && subcategory.trim() ? [subcategory.trim()] : [],
      };
      return [...prev, newDef];
    });

    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
  };

  const addSubcategory = (mainCategory: string, subcategory: string) => {
    const cleanMain = mainCategory.trim();
    const cleanSub = subcategory.trim();
    if (!cleanMain || !cleanSub) return;

    setCategoryDefinitions((prev) => {
      const existing = prev.find((c) => c.name.toLowerCase() === cleanMain.toLowerCase());
      if (existing) {
        if (!existing.subcategories.some((s) => s.toLowerCase() === cleanSub.toLowerCase())) {
          return prev.map((c) =>
            c.id === existing.id ? { ...c, subcategories: [...c.subcategories, cleanSub] } : c
          );
        }
        return prev;
      }
      const newDef: CategoryDefinition = {
        id: `cat-main-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanMain,
        subcategories: [cleanSub],
      };
      return [...prev, newDef];
    });

    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === cleanMain.toLowerCase())) return prev;
      return [...prev, cleanMain];
    });
  };

  const deleteCategory = (categoryIdOrName: string) => {
    const target = categoryIdOrName.trim().toLowerCase();
    setCategoryDefinitions((prev) => {
      const next = prev.filter(
        (c) => c.id !== categoryIdOrName && c.name.toLowerCase() !== target
      );
      setCategories(['Semua', ...next.map((c) => c.name)]);
      return next;
    });
  };

  const deleteSubcategory = (mainCategory: string, subcategory: string) => {
    setCategoryDefinitions((prev) =>
      prev.map((c) =>
        c.name.toLowerCase() === mainCategory.toLowerCase()
          ? {
              ...c,
              subcategories: c.subcategories.filter(
                (s) => s.toLowerCase() !== subcategory.toLowerCase()
              ),
            }
          : c
      )
    );
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
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    if (updates.category && updates.category.trim()) {
      addCategory(updates.category.trim(), updates.subcategory?.trim() || undefined);
    }

    const nowIso = getLocalTodayIso();
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

          return {
            ...p,
            ...updates,
            batches: syncedBatches,
            updatedAt: nowIso,
          };
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteMultipleProducts = (ids: string[]) => {
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
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
        updateProduct(targetProd.id, {
          currentStock: newStock,
          batches: updatedBatches,
          expiryDate: earliestExp || undefined,
          lastSoldAt: movType === 'out_sale' ? nowReadable : targetProd.lastSoldAt,
          purchaseDate: movType === 'in_purchase' ? nowIso : targetProd.purchaseDate,
        });

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
            source: data.inputMethod === 'mic' ? 'Suara Mic' : 'Buku Kas',
            notes: data.description,
            createdAt: nowReadable,
          };
          setStockMovements((prev) => [newMovement, ...prev]);
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
    return newTrx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (target && target.relatedMovementId) {
      setStockMovements((prev) => prev.filter((m) => m.id !== target.relatedMovementId));
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const deleteMultipleTransactions = (ids: string[]) => {
    const targetMovements = transactions
      .filter((t) => ids.includes(t.id) && t.relatedMovementId)
      .map((t) => t.relatedMovementId!);
    if (targetMovements.length > 0) {
      setStockMovements((prev) => prev.filter((m) => !targetMovements.includes(m.id)));
    }
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
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
      updateProduct(matchedProduct.id, {
        currentStock: newStock,
        batches: updatedBatches,
        expiryDate: earliestExp || undefined,
        lastSoldAt: !isRestock ? nowReadable : matchedProduct.lastSoldAt,
        purchaseDate: isRestock ? nowIso : matchedProduct.purchaseDate,
      });

      // Sync with Buku Kas if financialAmount > 0 and no transaction already linked
      if (movement.financialAmount && movement.financialAmount > 0 && !linkedTrxId) {
        const trxId = `trx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        linkedTrxId = trxId;

        const isExpense = movement.type === 'in_purchase' || movement.type === 'waste';
        const newTrx: Transaction = {
          id: trxId,
          type: isExpense ? 'expense' : 'income',
          amount: movement.financialAmount,
          category: isExpense ? matchedProduct.category || 'Bahan Baku' : 'Penjualan',
          description:
            movement.notes ||
            (isExpense
              ? `Kulakan ${matchedProduct.name} (${Math.abs(delta)} ${matchedProduct.unit})`
              : `Penjualan ${matchedProduct.name} (${Math.abs(delta)} ${matchedProduct.unit})`),
          date: nowIso,
          inputMethod: 'manual',
          relatedProductId: matchedProduct.id,
          relatedQuantity: Math.abs(delta),
          relatedMovementId: movId,
          createdAt: nowReadable,
        };
        setTransactions((prev) => [newTrx, ...prev]);
      }
    }

    const newMov: StockMovement = {
      ...movement,
      id: movId,
      relatedTransactionId: linkedTrxId,
      createdAt: nowReadable,
    };
    setStockMovements((prev) => [newMov, ...prev]);
    return newMov;
  };

  const updateStockMovement = (id: string, updates: Partial<StockMovement>) => {
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
  };

  const deleteStockMovement = (id: string) => {
    const target = stockMovements.find((m) => m.id === id);
    if (target && target.relatedTransactionId) {
      setTransactions((prev) => prev.filter((t) => t.id !== target.relatedTransactionId));
    }
    setStockMovements((prev) => prev.filter((m) => m.id !== id));
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
          source: draft.source.startsWith('mic') ? 'Voice Mic' : 'Pencatatan Draf Pintar',
          notes: draft.title || (change.quantityDelta > 0 ? 'Restok Masuk' : 'Penjualan Kasir'),
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
          source: draft.source.startsWith('mic') ? 'Voice Mic' : 'Pencatatan Draf Pintar',
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
    }
    setProducts(updatedProducts);
    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
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

    try {
      localStorage.removeItem(storageKeys.PRODUCTS);
      localStorage.removeItem(storageKeys.TRANSACTIONS);
      localStorage.removeItem(storageKeys.MOVEMENTS);
      localStorage.removeItem(storageKeys.PROFILE);
      localStorage.removeItem(storageKeys.CATEGORY_DEFS);
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
