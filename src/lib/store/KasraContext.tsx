'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Product,
  Transaction,
  StoreProfile,
  StockMovement,
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
import { formatBatchName, getActiveProductExpiry, formatDateIndo } from '@/lib/utils';

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
  selectedProductForPromo: Product | null;
  setSelectedProductForPromo: (product: Product | null) => void;
  // Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (mainCategory: string, subcategory?: string) => void;
  addSubcategory: (mainCategory: string, subcategory: string) => void;
  deleteCategory: (categoryId: string) => void;
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
}

const KasraContext = createContext<KasraContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'kasra_products_v1',
  TRANSACTIONS: 'kasra_transactions_v1',
  MOVEMENTS: 'kasra_movements_v1',
  PROFILE: 'kasra_profile_v1',
  CATEGORIES: 'kasra_categories_v1',
  CATEGORY_DEFS: 'kasra_category_defs_v2',
};

export const KasraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [profile, setProfile] = useState<StoreProfile>(INITIAL_PROFILE);
  const [categoryDefinitions, setCategoryDefinitions] = useState<CategoryDefinition[]>(INITIAL_CATEGORY_DEFINITIONS);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [activeDraft, setActiveDraft] = useState<ConfirmationDraft | null>(null);
  const [selectedProductForPromo, setSelectedProductForPromo] = useState<Product | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [todayIso, setTodayIso] = useState('2026-10-26');

  // Hydrate from localStorage on client mount
  useEffect(() => {
    setTodayIso(new Date().toISOString().split('T')[0]);
    try {
      const storedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProds) setProducts(JSON.parse(storedProds));

      const storedTrx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (storedTrx) setTransactions(JSON.parse(storedTrx));

      const storedMov = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (storedMov) setStockMovements(JSON.parse(storedMov));

      const storedProf = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (storedProf) setProfile(JSON.parse(storedProf));

      const storedDefs = localStorage.getItem(STORAGE_KEYS.CATEGORY_DEFS);
      if (storedDefs) {
        const parsed = JSON.parse(storedDefs);
        setCategoryDefinitions(parsed);
        setCategories(['Semua', ...parsed.map((c: CategoryDefinition) => c.name)]);
      } else {
        const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (storedCats) setCategories(JSON.parse(storedCats));
      }
    } catch (e) {
      console.warn('Failed to parse cached local data, using seed defaults', e);
    }
    setIsHydrated(true);
  }, []);

  // Save changes to localStorage after hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEYS.CATEGORY_DEFS, JSON.stringify(categoryDefinitions));
      localStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(['Semua', ...categoryDefinitions.map((c) => c.name)])
      );
    } catch (e) {
      console.warn('Failed to persist to localStorage', e);
    }
  }, [products, transactions, stockMovements, profile, categoryDefinitions, isHydrated]);

  // Product Operations
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Record initial stock movement
    if (newProduct.currentStock > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        type: 'in_purchase',
        quantityDelta: newProduct.currentStock,
        stockBefore: 0,
        stockAfter: newProduct.currentStock,
        notes: 'Stok Awal Produk Baru',
        createdAt: new Date().toLocaleString('id-ID'),
      };
      setStockMovements((prev) => [movement, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0],
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

  const addCategory = (mainCategory: string, subcategory?: string) => {
    const trimmed = mainCategory.trim();
    if (!trimmed) return;

    setCategoryDefinitions((prev) => {
      const existing = prev.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        if (subcategory && subcategory.trim() && !existing.subcategories.includes(subcategory.trim())) {
          return prev.map((c) =>
            c.id === existing.id
              ? { ...c, subcategories: [...c.subcategories, subcategory.trim()] }
              : c
          );
        }
        return prev;
      }
      const newDef: CategoryDefinition = {
        id: `cat-main-${Date.now()}`,
        name: trimmed,
        subcategories: subcategory && subcategory.trim() ? [subcategory.trim()] : [],
      };
      return [...prev, newDef];
    });

    setCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  };

  const addSubcategory = (mainCategory: string, subcategory: string) => {
    const cleanSub = subcategory.trim();
    if (!cleanSub) return;

    setCategoryDefinitions((prev) => {
      const existing = prev.find((c) => c.name.toLowerCase() === mainCategory.toLowerCase());
      if (existing) {
        if (!existing.subcategories.some((s) => s.toLowerCase() === cleanSub.toLowerCase())) {
          return prev.map((c) =>
            c.id === existing.id ? { ...c, subcategories: [...c.subcategories, cleanSub] } : c
          );
        }
        return prev;
      }
      // If main category doesn't exist, create it with this subcategory
      const newDef: CategoryDefinition = {
        id: `cat-main-${Date.now()}`,
        name: mainCategory.trim(),
        subcategories: [cleanSub],
      };
      return [...prev, newDef];
    });

    setCategories((prev) => {
      if (prev.includes(mainCategory.trim())) return prev;
      return [...prev, mainCategory.trim()];
    });
  };

  const deleteCategory = (categoryId: string) => {
    setCategoryDefinitions((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // Transaction Operations
  const addTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTrx: Transaction = {
      ...data,
      id: `trx-${Date.now()}`,
      createdAt: new Date().toLocaleString('id-ID'),
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
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const deleteMultipleTransactions = (ids: string[]) => {
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)));
  };

  // Stock Movement Log Operations (Buku Mutasi / Kasir Gudang)
  const addStockMovement = (movement: Omit<StockMovement, 'id' | 'createdAt'>): StockMovement => {
    const newMov: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toLocaleString('id-ID'),
    };
    setStockMovements((prev) => [newMov, ...prev]);
    return newMov;
  };

  const updateStockMovement = (id: string, updates: Partial<StockMovement>) => {
    setStockMovements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteStockMovement = (id: string) => {
    setStockMovements((prev) => prev.filter((m) => m.id !== id));
  };

  // Quick Stock Adjustment
  const quickAdjustStock = (productId: string, delta: number, reason: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const oldStock = target.currentStock;
    const newStock = Math.max(0, oldStock + delta);
    const nowIso = new Date().toISOString().split('T')[0];

    updateProduct(productId, { currentStock: newStock });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
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
      financialAmount: delta > 0 ? target.hppAmount * delta : target.sellingPrice * Math.abs(delta),
      source: 'Penyesuaian Cepat',
      notes: reason,
      createdAt: new Date().toLocaleString('id-ID'),
    };
    setStockMovements((prev) => [movement, ...prev]);
  };

  // Human-In-The-Loop Draft Execution
  const applyConfirmationDraft = (draft: ConfirmationDraft) => {
    const nowIso = new Date().toISOString().split('T')[0];
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

    if (newTransactionsToAdd.length > 0) {
      setTransactions((prev) => [...newTransactionsToAdd, ...prev]);
    }

    // 2. Process all stock changes
    const newMovements: StockMovement[] = [];
    const updatedProducts = [...products];

    draft.stockChanges.forEach((change) => {
      let matchedIndex = -1;
      if (change.productId) {
        matchedIndex = updatedProducts.findIndex((p) => p.id === change.productId);
      } else {
        matchedIndex = updatedProducts.findIndex(
          (p) => p.name.toLowerCase() === change.productName.toLowerCase()
        );
      }

      if (matchedIndex >= 0) {
        // Existing Product update
        const existing = updatedProducts[matchedIndex];
        const oldStock = existing.currentStock;
        const newStock = Math.max(0, oldStock + change.quantityDelta);

        // Multi-batch expiry tracking (FEFO)
        let updatedBatches = [...(existing.batches || [])];
        if (change.quantityDelta > 0) {
          // New restock batch with user-preferred format: "Batch 27 Oktober 2026"
          updatedBatches.push({
            id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            batchCode: formatBatchName(nowIso),
            quantity: change.quantityDelta,
            expiryDate: change.expiryDate || existing.expiryDate || null,
            receivedDate: nowIso,
            costPerUnit: change.pricePerUnit || existing.hppAmount,
          });
        } else if (change.quantityDelta < 0) {
          // Deplete oldest batches first
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

        // Determine earliest active expiry date strictly from batches with stock remaining (> 0)
        const earliestExpiry = getActiveProductExpiry(updatedBatches, change.expiryDate || existing.expiryDate);

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
          financialAmount: change.quantityDelta > 0
            ? (change.pricePerUnit || existing.hppAmount) * change.quantityDelta
            : existing.sellingPrice * Math.abs(change.quantityDelta),
          source: draft.source.startsWith('mic') ? 'Voice Mic' : 'Pencatatan Draf Pintar',
          notes: draft.title || (change.quantityDelta > 0 ? 'Restok Masuk' : 'Penjualan Kasir'),
          createdAt: nowReadable,
        });
      } else if (change.isNewProduct || change.quantityDelta > 0) {
        // Create new Product with initial batch
        const newProd: Product = {
          id: `prod-${Date.now()}-${Math.random()}`,
          sku: `KSR-GEN-${Math.floor(100 + Math.random() * 900)}`,
          name: change.productName,
          category: change.category || 'Bahan Baku & Dapur',
          location: change.location || 'Gudang Utama',
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80',
          currentStock: Math.max(0, change.quantityDelta),
          minStockAlert: 5,
          unit: change.unit || 'pcs',
          purchaseDate: nowIso,
          expiryDate: change.expiryDate || null,
          batches:
            change.quantityDelta > 0
              ? [
                  {
                    id: `batch-${Date.now()}`,
                    batchCode: formatBatchName(nowIso),
                    quantity: change.quantityDelta,
                    expiryDate: change.expiryDate || null,
                    receivedDate: nowIso,
                    costPerUnit: change.pricePerUnit || 10000,
                  },
                ]
              : [],
          hppAmount: change.pricePerUnit || 10000,
          hppMethod: 'wholesale',
          sellingPrice: Math.round((change.pricePerUnit || 10000) * 1.3),
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        updatedProducts.unshift(newProd);

        newMovements.push({
          id: `mov-${Date.now()}-${Math.random()}`,
          productId: newProd.id,
          productName: newProd.name,
          sku: newProd.sku,
          category: newProd.category,
          location: newProd.location,
          type: 'in_purchase',
          quantityDelta: change.quantityDelta,
          unit: newProd.unit,
          stockBefore: 0,
          stockAfter: newProd.currentStock,
          batchCode: formatBatchName(nowIso),
          batchExpiry: newProd.expiryDate,
          financialAmount: (newProd.hppAmount || 10000) * newProd.currentStock,
          source: draft.source.startsWith('mic') ? 'Voice Mic' : 'Pencatatan Draf Pintar',
          notes: draft.title || 'Barang Baru & Restok',
          createdAt: nowReadable,
        });
      }
    });

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
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const resetToMockData = () => {
    setProducts(INITIAL_PRODUCTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setProfile(INITIAL_PROFILE);
    setCategories(INITIAL_CATEGORIES);
    setActiveDraft(null);
    localStorage.clear();
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

  const monthIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const monthExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const criticalStockCount = useMemo(() => {
    return products.filter((p) => p.currentStock <= p.minStockAlert).length;
  }, [products]);

  const nearExpiryCount = useMemo(() => {
    const today = new Date(todayIso);
    today.setHours(0, 0, 0, 0);
    return products.filter((p) => {
      if (!p.expiryDate) return false;
      const exp = new Date(p.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
        selectedProductForPromo,
        setSelectedProductForPromo,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        addCategory,
        addSubcategory,
        deleteCategory,
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
