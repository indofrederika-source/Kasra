'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { Product, ProductUnit, HppMethod, HppComponent, StockBatch, StockMovement, StockMovementType } from '@/types';
import { formatRupiah, formatDateIndo, getExpiryStatus, getStockStatus, formatBatchName, getActiveProductExpiry, formatThousands, parseThousands } from '@/lib/utils';
import { CustomDropdown, DropdownOption } from '@/components/ui/CustomDropdown';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { AccessibleDatePicker } from '@/components/ui/AccessibleDatePicker';
import {
  Package,
  Plus,
  ScanLine,
  Mic,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Layers,
  ArrowRight,
  DollarSign,
  Tag,
  X,
  Check,
  Camera,
  Upload,
  Percent,
  TrendingUp,
  Image as ImageIcon,
  MapPin,
  Truck,
  Info,
  Boxes,
  ShieldAlert,
} from 'lucide-react';

export const UMKM_IMAGE_PRESETS = [
  { label: 'Es Kopi Susu', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
  { label: 'Caramel Macchiato', url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=80' },
  { label: 'Susu UHT Segar', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80' },
  { label: 'Daging Ayam', url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80' },
  { label: 'Sayur & Buah', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80' },
  { label: 'Roti Bakar', url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format&fit=crop&q=80' },
  { label: 'Butter Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80' },
  { label: 'Biji Kopi Arabika', url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&auto=format&fit=crop&q=80' },
  { label: 'Paper Cup Kemasan', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80' },
  { label: 'Matcha Latte', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80' },
  { label: 'Sirup Gula Aren', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80' },
  { label: 'Snack & Camilan', url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format&fit=crop&q=80' },
];

export const LOCATION_PRESETS = [
  'Gudang Utama',
  'Freezer Daging #1',
  'Chiller Depan',
  'Rak Kering A1',
  'Rak Kering B2',
  'Etalase Depan',
  'Gudang Belakang',
  'Dapur Utama',
];

function getLocalTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface StorageViewProps {
  onOpenVoice: () => void;
  onOpenScan: () => void;
}

export const StorageView: React.FC<StorageViewProps> = ({ onOpenVoice, onOpenScan }) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    categoryDefinitions,
    addCategory,
    addSubcategory,
    deleteCategory,
    deleteSubcategory,
    addTransaction,
    totalAssetValue,
    criticalStockCount,
    nearExpiryCount,
    stockMovements,
    addStockMovement,
    updateStockMovement,
    deleteStockMovement,
  } = useKasra();

  // Top-Level Mode: 'catalog' (Katalog & Stok Fisik) vs 'movement' (Buku Mutasi Gudang)
  const [activeStorageTab, setActiveStorageTab] = useState<'catalog' | 'movement'>('catalog');

  // Buku Mutasi Gudang (Log Masuk & Keluar Stok) States
  const [movementSearchQuery, setMovementSearchQuery] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | StockMovementType>('all');
  const [movementCategoryFilter, setMovementCategoryFilter] = useState('Semua');
  const [movementLocationFilter, setMovementLocationFilter] = useState('Semua');

  // Mutasi Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [deleteTargetMovement, setDeleteTargetMovement] = useState<StockMovement | null>(null);

  // Mutasi Form State
  const [movProductId, setMovProductId] = useState('');
  const [movType, setMovType] = useState<StockMovementType>('in_purchase');
  const [movQty, setMovQty] = useState('1');
  const [movBatchCode, setMovBatchCode] = useState('');
  const [movBatchExpiry, setMovBatchExpiry] = useState<string | null>(null);
  const [movFinancialAmount, setMovFinancialAmount] = useState('0');
  const [movLocation, setMovLocation] = useState('Gudang Utama');
  const [movSource, setMovSource] = useState('Input Manual Gudang');
  const [movNotes, setMovNotes] = useState('');
  const [movDate, setMovDate] = useState(() => getLocalTodayStr());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('Semua');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Semua');
  const [selectedLocation, setSelectedLocation] = useState('Semua');
  const [stockFilter, setStockFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Category & Sub-category Creation Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalType, setCatModalType] = useState<'main' | 'sub'>('main');
  const [newCatName, setNewCatName] = useState('');
  const [targetMainForSub, setTargetMainForSub] = useState('');

  // Quick Change Image Modal
  const [quickImageTarget, setQuickImageTarget] = useState<Product | null>(null);

  // Add / Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [recordInitialStockToCash, setRecordInitialStockToCash] = useState(true);

  // Custom Delete Confirm Modal State
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);

  // Product Form Fields - All default to blank/empty so user inputs freely
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formUnit, setFormUnit] = useState<ProductUnit | string>('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formCurrentStock, setFormCurrentStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState<string | null>(null);
  const [formSellingPrice, setFormSellingPrice] = useState('');

  // Profit Margin Slider State
  const [profitMarginPercent, setProfitMarginPercent] = useState(30);

  // Batches State (FEFO Multi-Batch tracking per input)
  const [formBatches, setFormBatches] = useState<StockBatch[]>([]);
  const [newBatchQty, setNewBatchQty] = useState('');
  const [newBatchExpiry, setNewBatchExpiry] = useState<string | null>(null);
  const [newBatchCode, setNewBatchCode] = useState('');
  const [showAddBatchRow, setShowAddBatchRow] = useState(false);

  // HPP Calculator States - All default to blank/empty
  const [hppMethod, setHppMethod] = useState<HppMethod>('wholesale');
  const [wholesaleTotalCost, setWholesaleTotalCost] = useState('');
  const [wholesaleUnitsCount, setWholesaleUnitsCount] = useState('');
  const [wholesaleShipping, setWholesaleShipping] = useState('');
  const [wholesaleWastePercent, setWholesaleWastePercent] = useState('');

  const [recipeComponents, setRecipeComponents] = useState<HppComponent[]>([]);
  const [recipeOverhead, setRecipeOverhead] = useState('');
  const [newCompName, setNewCompName] = useState('');
  const [newCompCost, setNewCompCost] = useState('');

  const [manualHpp, setManualHpp] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Batch management helpers for full user control and real-time total stock synchronization
  const handleUpdateBatch = (index: number, updates: Partial<StockBatch>) => {
    setFormBatches((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      const total = next.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
      setFormCurrentStock(total > 0 ? total.toString() : '');
      return next;
    });
  };

  const handleDeleteBatch = (index: number) => {
    setFormBatches((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const total = next.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
      setFormCurrentStock(total > 0 ? total.toString() : '');
      return next;
    });
  };

  // Calculate HPP dynamically with automatic dot thousand separators
  const computedHpp = useMemo(() => {
    if (hppMethod === 'wholesale') {
      const rawCost = parseThousands(wholesaleTotalCost);
      const shipping = parseThousands(wholesaleShipping);
      const count = parseThousands(wholesaleUnitsCount) || 1;
      const wastePercent = parseFloat(wholesaleWastePercent) || 0;
      if (rawCost === 0 && shipping === 0) return 0;
      const basePerUnit = (rawCost + shipping) / (count > 0 ? count : 1);
      const withWaste = basePerUnit * (1 + wastePercent / 100);
      return Math.round(withWaste);
    } else if (hppMethod === 'recipe') {
      const componentsSum = recipeComponents.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const overhead = parseThousands(recipeOverhead);
      return Math.round(componentsSum + overhead);
    } else {
      return parseThousands(manualHpp);
    }
  }, [
    hppMethod,
    wholesaleTotalCost,
    wholesaleShipping,
    wholesaleUnitsCount,
    wholesaleWastePercent,
    recipeComponents,
    recipeOverhead,
    manualHpp,
  ]);

  // Synchronize Selling Price when Margin Slider changes
  const handleMarginSliderChange = (newMargin: number) => {
    setProfitMarginPercent(newMargin);
    if (computedHpp > 0) {
      const calculatedPrice = Math.round(computedHpp * (1 + newMargin / 100));
      setFormSellingPrice(formatThousands(calculatedPrice));
    }
  };

  // Synchronize Margin Slider when Selling Price input changes
  const handleSellingPriceInputChange = (newPriceStr: string) => {
    const formatted = formatThousands(newPriceStr);
    setFormSellingPrice(formatted);
    const priceNum = parseThousands(newPriceStr);
    if (computedHpp > 0 && priceNum > 0) {
      const margin = Math.round(((priceNum - computedHpp) / computedHpp) * 100);
      setProfitMarginPercent(Math.max(-100, Math.min(300, margin)));
    }
  };

  // Sub-categories available for current form category
  const availableSubcategoriesForForm = useMemo(() => {
    if (!formCategory) return [];
    const matched = categoryDefinitions.find(
      (c) => c.name.toLowerCase() === formCategory.toLowerCase()
    );
    return matched ? matched.subcategories : [];
  }, [categoryDefinitions, formCategory]);

  // Sub-categories available for filter bar
  const availableSubcategoriesForFilter = useMemo(() => {
    if (selectedMainCategory === 'Semua') {
      const allSubs = new Set<string>();
      categoryDefinitions.forEach((c) => c.subcategories.forEach((s) => allSubs.add(s)));
      return Array.from(allSubs);
    }
    const matched = categoryDefinitions.find(
      (c) => c.name.toLowerCase() === selectedMainCategory.toLowerCase()
    );
    return matched ? matched.subcategories : [];
  }, [categoryDefinitions, selectedMainCategory]);

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setRecordInitialStockToCash(true);
    setFormName('');
    const skuCode = `KSR-${Math.floor(100 + Math.random() * 900)}`;
    setFormSku(skuCode);
    setFormCategory(selectedMainCategory !== 'Semua' ? selectedMainCategory : '');
    setFormSubcategory(selectedSubcategory !== 'Semua' ? selectedSubcategory : '');
    setFormLocation('');
    setFormUnit('');
    setFormImageUrl('');
    setFormCurrentStock('');
    setFormMinStock('');
    setFormPurchaseDate(getLocalTodayStr());
    setFormExpiryDate(null);
    setFormBatches([]);
    setShowAddBatchRow(false);
    setHppMethod('wholesale');
    setWholesaleTotalCost('');
    setWholesaleUnitsCount('');
    setWholesaleShipping('');
    setWholesaleWastePercent('');
    setRecipeComponents([]);
    setRecipeOverhead('');
    setManualHpp('');
    setSupplierName('');
    setSupplierNotes('');
    setProfitMarginPercent(30);
    setFormSellingPrice('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory || '');
    setFormLocation(prod.location || '');
    setFormUnit(prod.unit);
    setFormImageUrl(prod.imageUrl);
    setFormCurrentStock(prod.currentStock.toString());
    setFormMinStock(prod.minStockAlert ? prod.minStockAlert.toString() : '');
    setFormPurchaseDate(prod.purchaseDate || '');
    setFormExpiryDate(prod.expiryDate || null);
    setShowAddBatchRow(false);

    if (prod.batches && prod.batches.length > 0) {
      setFormBatches([...prod.batches]);
    } else {
      setFormBatches([]);
    }

    setFormSellingPrice(prod.sellingPrice ? formatThousands(prod.sellingPrice) : '');
    setHppMethod(prod.hppMethod);
    setManualHpp(prod.hppAmount ? formatThousands(prod.hppAmount) : '');
    setWholesaleTotalCost('');
    setWholesaleUnitsCount('');
    setWholesaleShipping('');
    setWholesaleWastePercent('');
    if (prod.hppBreakdown && prod.hppBreakdown.length > 0) {
      setRecipeComponents(prod.hppBreakdown);
    } else {
      setRecipeComponents([]);
    }
    setRecipeOverhead('');
    if (prod.hppAmount > 0 && prod.sellingPrice > 0) {
      const margin = Math.round(((prod.sellingPrice - prod.hppAmount) / prod.hppAmount) * 100);
      setProfitMarginPercent(margin);
    } else {
      setProfitMarginPercent(30);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Earliest expiry from active batches (advances automatically if Batch 1 is depleted)
    const earliestBatchExpiry = getActiveProductExpiry(formBatches, formExpiryDate);

    // Sum of batches stock if batches exist
    const totalBatchesStock = formBatches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const finalStock = formBatches.length > 0 ? totalBatchesStock : Math.max(0, parseInt(formCurrentStock) || 0);

    const productPayload = {
      name: formName.trim(),
      sku: formSku.trim() || `KSR-${Math.floor(100 + Math.random() * 900)}`,
      category: formCategory.trim() || 'Umum',
      subcategory: formSubcategory.trim(),
      location: formLocation.trim() || 'Gudang Utama',
      unit: (formUnit.trim() || 'pcs') as ProductUnit,
      imageUrl: formImageUrl.trim(),
      currentStock: finalStock,
      minStockAlert: Math.max(0, parseInt(formMinStock) || 0),
      purchaseDate: formPurchaseDate || getLocalTodayStr(),
      expiryDate: earliestBatchExpiry || undefined,
      batches: formBatches.length > 0 ? formBatches : undefined,
      hppAmount: computedHpp,
      hppMethod,
      hppBreakdown: hppMethod === 'recipe' ? recipeComponents : undefined,
      sellingPrice: Math.max(0, parseThousands(formSellingPrice)),
    };

    if (editingProductId) {
      updateProduct(editingProductId, productPayload);
    } else {
      addProduct(productPayload);
      if (recordInitialStockToCash && finalStock > 0 && computedHpp > 0) {
        addTransaction({
          date: productPayload.purchaseDate,
          type: 'expense',
          amount: finalStock * computedHpp,
          category: productPayload.category,
          description: `Kulakan Stok Awal: ${productPayload.name} (${finalStock} ${productPayload.unit})`,
          inputMethod: 'manual',
        });
      }
    }

    setIsProductModalOpen(false);
  };

  // Mutasi Gudang Handlers
  const handleOpenAddMovement = (presetProd?: Product) => {
    setEditingMovement(null);
    const target = presetProd || products[0];
    const todayStr = getLocalTodayStr();
    setMovProductId(target?.id || '');
    setMovType('in_purchase');
    setMovQty('1');
    setMovBatchCode(formatBatchName(todayStr));
    setMovBatchExpiry(null);
    setMovFinancialAmount(target?.hppAmount ? formatThousands(target.hppAmount) : '0');
    setMovLocation(target?.location || 'Gudang Utama');
    setMovSource('Input Manual Gudang');
    setMovNotes('');
    setMovDate(todayStr);
    setIsMovementModalOpen(true);
  };

  const handleOpenEditMovement = (mov: StockMovement) => {
    setEditingMovement(mov);
    setMovProductId(mov.productId);
    setMovType(mov.type);
    setMovQty(Math.abs(mov.quantityDelta).toString());
    setMovBatchCode(mov.batchCode || formatBatchName(new Date().toISOString().split('T')[0]));
    setMovBatchExpiry(mov.batchExpiry || null);
    setMovFinancialAmount(mov.financialAmount ? formatThousands(mov.financialAmount) : '0');
    setMovLocation(mov.location || 'Gudang Utama');
    setMovSource(mov.source || 'Input Manual Gudang');
    setMovNotes(mov.notes || '');
    setMovDate(mov.createdAt?.split(' ')[0] || new Date().toISOString().split('T')[0]);
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(movQty) || 0;
    if (qtyNum <= 0) return;

    const matchedProduct = products.find((p) => p.id === movProductId);
    const prodName = matchedProduct?.name || 'Barang Gudang';
    const sku = matchedProduct?.sku || 'KSR-GEN';
    const category = matchedProduct?.category || 'Bahan Baku & Dapur';
    const unit = matchedProduct?.unit || 'pcs';
    const currentStock = matchedProduct ? matchedProduct.currentStock : 0;

    let delta = qtyNum;
    if (movType === 'out_sale' || movType === 'waste') {
      delta = -qtyNum;
    }

    if (editingMovement) {
      updateStockMovement(editingMovement.id, {
        type: movType,
        quantityDelta: delta,
        batchCode: movBatchCode,
        batchExpiry: movBatchExpiry,
        financialAmount: parseThousands(movFinancialAmount) || 0,
        location: movLocation,
        source: movSource,
        notes: movNotes,
      });
    } else {
      const stockAfter = Math.max(0, currentStock + delta);
      addStockMovement({
        productId: movProductId,
        productName: prodName,
        sku,
        category,
        location: movLocation,
        type: movType,
        quantityDelta: delta,
        unit,
        stockBefore: currentStock,
        stockAfter,
        batchCode: movBatchCode,
        batchExpiry: movBatchExpiry,
        financialAmount: parseThousands(movFinancialAmount) || 0,
        source: movSource,
        notes: movNotes || (movType === 'in_purchase' ? 'Kulakan stok baru' : movType === 'out_sale' ? 'Penjualan ke pelanggan' : movType === 'waste' ? 'Barang basi / rusak' : 'Koreksi stok opname'),
      });
    }

    setIsMovementModalOpen(false);
  };

  // Upload Photo from Local Device using FileReader (Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetProductId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (targetProductId) {
          updateProduct(targetProductId, { imageUrl: dataUrl });
          setQuickImageTarget(null);
        } else {
          setFormImageUrl(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Main Category filter
      if (selectedMainCategory !== 'Semua' && p.category !== selectedMainCategory) {
        return false;
      }

      // Sub-category filter
      if (selectedSubcategory !== 'Semua' && p.subcategory !== selectedSubcategory) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'Semua' && (p.location || 'Gudang Utama') !== selectedLocation) {
        return false;
      }

      // Stock condition filter
      if (stockFilter === 'out' && p.currentStock > 0) return false;
      if (stockFilter === 'low' && (p.currentStock === 0 || p.currentStock > p.minStockAlert)) {
        return false;
      }
      if (stockFilter === 'safe' && p.currentStock <= p.minStockAlert) return false;

      // Expiry filter
      if (expiryFilter !== 'all') {
        const activeExp = getActiveProductExpiry(p.batches, p.expiryDate);
        const expStatus = getExpiryStatus(activeExp);
        if (expStatus.status !== expiryFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchSub = (p.subcategory || '').toLowerCase().includes(q);
        const matchLoc = (p.location || '').toLowerCase().includes(q);
        return matchName || matchSku || matchCat || matchSub || matchLoc;
      }

      return true;
    });
  }, [
    products,
    selectedMainCategory,
    selectedSubcategory,
    selectedLocation,
    stockFilter,
    expiryFilter,
    searchQuery,
  ]);

  // Filtered Stock Movements (Buku Mutasi Gudang)
  const filteredStockMovements = useMemo(() => {
    return stockMovements.filter((mov) => {
      if (movementSearchQuery.trim()) {
        const q = movementSearchQuery.toLowerCase();
        const m1 = mov.productName.toLowerCase().includes(q);
        const m2 = mov.sku?.toLowerCase().includes(q) || false;
        const m3 = mov.batchCode?.toLowerCase().includes(q) || false;
        const m4 = mov.notes?.toLowerCase().includes(q) || false;
        const m5 = mov.source?.toLowerCase().includes(q) || false;
        if (!m1 && !m2 && !m3 && !m4 && !m5) return false;
      }
      if (movementTypeFilter !== 'all' && mov.type !== movementTypeFilter) {
        return false;
      }
      if (movementCategoryFilter !== 'Semua' && mov.category !== movementCategoryFilter) {
        return false;
      }
      if (movementLocationFilter !== 'Semua' && (mov.location || 'Gudang Utama') !== movementLocationFilter) {
        return false;
      }
      return true;
    });
  }, [stockMovements, movementSearchQuery, movementTypeFilter, movementCategoryFilter, movementLocationFilter]);

  // Mutasi Gudang Summary
  const movementSummary = useMemo(() => {
    let totalInUnits = 0;
    let totalInAmount = 0;
    let totalOutUnits = 0;
    let totalOutAmount = 0;
    let totalWasteUnits = 0;
    let totalWasteAmount = 0;

    stockMovements.forEach((m) => {
      if (m.type === 'in_purchase') {
        totalInUnits += Math.abs(m.quantityDelta);
        totalInAmount += m.financialAmount || 0;
      } else if (m.type === 'out_sale') {
        totalOutUnits += Math.abs(m.quantityDelta);
        totalOutAmount += m.financialAmount || 0;
      } else if (m.type === 'waste') {
        totalWasteUnits += Math.abs(m.quantityDelta);
        totalWasteAmount += m.financialAmount || 0;
      }
    });

    return {
      totalInUnits,
      totalInAmount,
      totalOutUnits,
      totalOutAmount,
      totalWasteUnits,
      totalWasteAmount,
      totalLogs: stockMovements.length,
    };
  }, [stockMovements]);

  const stockOptions: DropdownOption[] = [
    { value: 'all', label: 'Semua Status Stok' },
    { value: 'safe', label: 'Stok Aman' },
    { value: 'low', label: 'Stok Menipis (Alarm)' },
    { value: 'out', label: 'Stok Habis (0)' },
  ];

  const expiryOptions: DropdownOption[] = [
    { value: 'all', label: 'Semua Status Kadaluarsa' },
    { value: 'safe', label: 'Masa Simpan Masih Aman' },
    { value: 'warning', label: 'Mendekati Kadaluarsa (< 7 Hari)' },
    { value: 'expired', label: 'Telah Kadaluarsa' },
  ];

  const locationFilterOptions: DropdownOption[] = [
    { value: 'Semua', label: 'Semua Lokasi Gudang' },
    ...LOCATION_PRESETS.map((loc) => ({ value: loc, label: loc })),
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Manajemen Gudang & Stok</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Katalog stok fisik, pelacak FEFO kedaluwarsa, dan buku mutasi keluar-masuk gudang
          </p>
        </div>

        {/* Input Methods / Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeStorageTab === 'catalog' ? (
            <>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Tambah Barang</span>
              </button>

              <button
                onClick={onOpenScan}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
              >
                <ScanLine className="w-3.5 h-3.5 text-slate-500" />
                <span>Scan Nota Kulakan</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleOpenAddMovement()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Catat Mutasi Manual</span>
            </button>
          )}

          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
          >
            <Mic className="w-3.5 h-3.5 text-slate-500" />
            <span>Bicara</span>
          </button>
        </div>
      </div>

      {/* 2. Top Segmented Mode Switcher (Katalog & Stok Fisik vs Buku Mutasi Gudang) */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex items-center p-1 bg-slate-100 border border-slate-200/80 rounded-full shadow-inner">
          <button
            type="button"
            onClick={() => setActiveStorageTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeStorageTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Katalog & Stok Fisik ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStorageTab('movement')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeStorageTab === 'movement'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Buku Mutasi Gudang ({stockMovements.length})</span>
          </button>
        </div>
      </div>

      {/* 3. SEGMENT 1: KATALOG & STOK FISIK */}
      {activeStorageTab === 'catalog' && (
        <div className="space-y-6">
          {/* Top Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-1 transition-colors shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Total Jenis Barang</div>
              <div className="text-xl font-bold text-slate-900 font-mono">{products.length} SKU</div>
              <div className="text-[10px] text-slate-400">Terdaftar di gudang</div>
            </div>

            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-1 transition-colors shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Nilai Aset Stok (HPP)</div>
              <div className="text-xl font-bold text-slate-900 font-mono">{formatRupiah(totalAssetValue)}</div>
              <div className="text-[10px] text-slate-400">Modal tertanam di gudang</div>
            </div>

            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-1 transition-colors shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Stok Kritis / Menipis</div>
              <div className="text-xl font-bold text-slate-900 font-mono">{criticalStockCount} Barang</div>
              <div className="text-[10px] text-rose-500 font-medium">Perlu restock segera</div>
            </div>

            <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 space-y-1 transition-colors shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Mendekati Kadaluarsa</div>
              <div className="text-xl font-bold text-slate-900 font-mono">{nearExpiryCount} Barang</div>
              <div className="text-[10px] text-amber-600 font-medium">Dalam 7 hari ke depan</div>
            </div>
          </div>

          {/* 3. Search & 2-Tier Category Filter Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama barang, SKU, kategori utama, atau sub-kategori (ayam, sayur)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/70">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full text-xs transition-colors ${
                      viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Tampilan Kartu"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-full text-xs transition-colors ${
                      viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                    title="Tampilan Tabel"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add Category / Sub-Category Trigger */}
                <button
                  onClick={() => {
                    setCatModalType('main');
                    setNewCatName('');
                    setIsCatModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kelola Kategori</span>
                </button>
              </div>
            </div>

            {/* TIER 1: Kategori Utama Universal */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kategori Utama:</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMainCategory('Semua');
                    setSelectedSubcategory('Semua');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedMainCategory === 'Semua'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  Semua Kategori ({products.length})
                </button>

                {categoryDefinitions.map((cat) => {
                  const count = products.filter((p) => p.category === cat.name).length;
                  const isActive = selectedMainCategory === cat.name;
                  return (
                    <div
                      key={cat.id}
                      className={`inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMainCategory(cat.name);
                          setSelectedSubcategory('Semua');
                        }}
                        className="cursor-pointer"
                      >
                        {cat.name} ({count})
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedMainCategory === cat.name) {
                            setSelectedMainCategory('Semua');
                            setSelectedSubcategory('Semua');
                          }
                          deleteCategory(cat.id);
                        }}
                        className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                          isActive
                            ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
                        }`}
                        title={`Hapus kategori ${cat.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Direct Right-Side Add Category Pill Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCatModalType('main');
                    setNewCatName('');
                    setIsCatModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-semibold shrink-0 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-400 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kategori</span>
                </button>
              </div>
            </div>

            {/* TIER 2: Sub-Kategori Chips (Always visible with Semua Sub + Add Sub-Kategori on the right) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <Tag className="w-3 h-3 text-amber-500" />
                  <span>
                    Sub-Kategori {selectedMainCategory !== 'Semua' ? `(${selectedMainCategory})` : ''}:
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory('Semua')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedSubcategory === 'Semua'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  Semua Sub
                </button>

                {availableSubcategoriesForFilter.map((sub, idx) => {
                  const subCount = products.filter(
                    (p) =>
                      p.subcategory === sub &&
                      (selectedMainCategory === 'Semua' || p.category === selectedMainCategory)
                  ).length;
                  const isActive = selectedSubcategory === sub;

                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-[11px] font-semibold shrink-0 transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedSubcategory(sub)}
                        className="cursor-pointer"
                      >
                        {sub} ({subCount})
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedSubcategory === sub) setSelectedSubcategory('Semua');
                          categoryDefinitions.forEach((c) => {
                            if (c.subcategories.includes(sub)) {
                              deleteSubcategory(c.name, sub);
                            }
                          });
                        }}
                        className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                          isActive
                            ? 'text-slate-800 hover:text-slate-950 hover:bg-amber-400'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
                        }`}
                        title={`Hapus sub-kategori ${sub}`}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Direct Right-Side Add Sub-Category Pill Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCatModalType('sub');
                    setTargetMainForSub(
                      selectedMainCategory !== 'Semua'
                        ? selectedMainCategory
                        : categoryDefinitions[0]?.name || ''
                    );
                    setNewCatName('');
                    setIsCatModalOpen(true);
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 hover:border-slate-400 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Sub-Kategori</span>
                </button>
              </div>
            </div>

            {/* Secondary Filter Row: Condition, Expiry, & Location */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px] font-medium">Kondisi Stok:</span>
                <CustomDropdown
                  options={stockOptions}
                  value={stockFilter}
                  onChange={(val) => setStockFilter(val)}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px] font-medium">Batas Kadaluarsa:</span>
                <CustomDropdown
                  options={expiryOptions}
                  value={expiryFilter}
                  onChange={(val) => setExpiryFilter(val)}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>Lokasi Gudang:</span>
                </span>
                <CustomDropdown
                  options={locationFilterOptions}
                  value={selectedLocation}
                  onChange={(val) => setSelectedLocation(val)}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* 4. Display Products: Empty State OR Grid View OR Table View */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {products.length === 0
                    ? 'Gudang Masih Kosong (0 Barang)'
                    : 'Tidak Ada Barang yang Cocok dengan Filter'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {products.length === 0
                    ? 'Belum ada barang terdaftar di gudang. Klik tombol di bawah untuk menginput barang, kategori, stok, dan harga modal (HPP) pertama Anda.'
                    : 'Coba ubah kata kunci pencarian atau pilih "Semua Kategori" dan "Semua Sub" di atas.'}
                </p>
              </div>
              {products.length === 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Tambah Barang Pertama</span>
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => {
                const stockStatus = getStockStatus(p.currentStock, p.minStockAlert);
                const expStatus = getExpiryStatus(p.expiryDate);

                // 4-Level Indicator (Merah, Oren, Kuning, Hijau)
                let indLevel = 4;
                let indColor = 'hijau';
                let indTitle = 'Stok Aman';
                let indSub = `${p.currentStock} ${p.unit} tersedia`;
                let indBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                let indDot = 'bg-emerald-500';
                let indBadge = 'Level: Aman';

                if (p.currentStock <= 0 || expStatus.status === 'expired') {
                  indLevel = 1;
                  indColor = 'merah';
                  indTitle = p.currentStock <= 0 ? 'Stok Habis' : 'Kedaluwarsa';
                  indSub = p.currentStock <= 0 ? `Sisa 0 ${p.unit}` : expStatus.label;
                  indBg = 'bg-rose-50 border-rose-200 text-rose-700';
                  indDot = 'bg-rose-500';
                  indBadge = 'Level: Kritis';
                } else if (p.currentStock <= p.minStockAlert || expStatus.status === 'warning') {
                  indLevel = 2;
                  indColor = 'oren';
                  indTitle = p.currentStock <= p.minStockAlert ? 'Stok Menipis' : 'Segera Expired';
                  indSub = `Sisa ${p.currentStock} ${p.unit} • Alarm: ${p.minStockAlert}`;
                  indBg = 'bg-amber-50 border-amber-200 text-amber-800';
                  indDot = 'bg-amber-500';
                  indBadge = 'Level: Menipis';
                } else if (expStatus.daysLeft !== null && expStatus.daysLeft <= 30) {
                  indLevel = 3;
                  indColor = 'kuning';
                  indTitle = 'Perhatian Kedaluwarsa';
                  indSub = `Sisa ${p.currentStock} ${p.unit} • Exp ${expStatus.daysLeft} hr lagi`;
                  indBg = 'bg-yellow-50 border-yellow-200 text-yellow-800';
                  indDot = 'bg-yellow-500';
                  indBadge = 'Level: Perhatian';
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenEditModal(p)}
                    className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl overflow-hidden transition-all duration-150 flex flex-col justify-between group shadow-xs hover:shadow-md cursor-pointer"
                  >
                    <div>
                      {/* Image with Direct Quick Change Overlay - Spacious, Larger, and Uncropped */}
                      <div className="relative h-64 sm:h-72 w-full bg-slate-50/70 flex items-center justify-center p-5 overflow-hidden border-b border-slate-100">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 text-slate-300 select-none">
                            <Package className="w-12 h-12 stroke-[1.5]" />
                            <span className="text-[11px] font-medium text-slate-400">Belum ada foto</span>
                          </div>
                        )}

                        {/* Quick Change Photo Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickImageTarget(p);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 backdrop-blur-md border border-slate-200 shadow-sm transition-colors cursor-pointer"
                          title="Ganti Foto Barang"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product Details & Category Info (Moved to Bottom for High Clarity) */}
                      <div className="p-5 space-y-3">
                        {/* Clear Category & Subcategory Badges at the bottom */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs">
                            {p.category}
                          </span>
                          {p.subcategory && (
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                              {p.subcategory}
                            </span>
                          )}
                          {p.batches && p.batches.length > 1 && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900 text-white flex items-center gap-1 font-mono shadow-2xs">
                              <Boxes className="w-2.5 h-2.5" />
                              <span>{p.batches.length} Batch FEFO</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 transition-colors">
                            {p.name}
                          </h3>
                        </div>

                        {/* Storage Location Badge */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{p.location || 'Gudang Utama'}</span>
                        </div>

                        {/* Prices */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Modal (HPP):</div>
                            <div className="text-slate-700 font-bold font-mono text-sm">
                              {formatRupiah(p.hppAmount)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-medium">Harga Jual:</div>
                            <div className="text-slate-900 font-extrabold font-mono text-sm">
                              {formatRupiah(p.sellingPrice)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dedicated Bottom Health & Expiry Level Indicator */}
                      <div className={`mx-5 mb-4 p-3 rounded-2xl border space-y-2 ${indBg}`}>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-1.5 truncate pr-1">
                            <span className={`w-2 h-2 rounded-full ${indDot} shrink-0 animate-pulse`} />
                            <span className="font-bold text-slate-900 truncate">{indTitle}</span>
                            <span className="text-[11px] font-medium opacity-85 truncate">({indSub})</span>
                          </div>
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-white/90 border border-current shrink-0">
                            {indBadge}
                          </span>
                        </div>

                        {/* 4-Segment Visual Meter: Merah, Oren, Kuning, Hijau */}
                        <div className="grid grid-cols-4 gap-1.5 h-2 rounded-full overflow-hidden bg-slate-200/80 p-0.5">
                          <div
                            className={`h-full rounded-full transition-colors ${
                              indLevel >= 1 ? 'bg-rose-500' : 'bg-transparent'
                            }`}
                            title="Level 1: Kritis / Habis (Merah)"
                          />
                          <div
                            className={`h-full rounded-full transition-colors ${
                              indLevel >= 2 ? 'bg-amber-500' : 'bg-transparent'
                            }`}
                            title="Level 2: Menipis (Oren)"
                          />
                          <div
                            className={`h-full rounded-full transition-colors ${
                              indLevel >= 3 ? 'bg-yellow-400' : 'bg-transparent'
                            }`}
                            title="Level 3: Perhatian (Kuning)"
                          />
                          <div
                            className={`h-full rounded-full transition-colors ${
                              indLevel >= 4 ? 'bg-emerald-500' : 'bg-transparent'
                            }`}
                            title="Level 4: Aman (Hijau)"
                          />
                        </div>

                        {/* Date Tracking Info: Expiry Date & Purchase Date */}
                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-black/5 font-mono">
                          <span className="font-semibold text-slate-800">
                            {p.expiryDate ? `Exp: ${formatDateIndo(p.expiryDate)}` : 'Bebas Kedaluwarsa'}
                          </span>
                          {p.purchaseDate && (
                            <span className="text-slate-500 text-[10px]">
                              Beli: {formatDateIndo(p.purchaseDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div
                      className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] text-slate-500 font-medium">Klik kartu untuk rincian & HPP</span>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetProduct(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus barang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Barang & SKU</th>
                      <th className="py-3 px-4">Kategori & Sub</th>
                      <th className="py-3 px-4 text-center">Stok</th>
                      <th className="py-3 px-4">Batas Kadaluarsa</th>
                      <th className="py-3 px-4 text-right">Modal (HPP)</th>
                      <th className="py-3 px-4 text-right">Harga Jual</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const stockStatus = getStockStatus(p.currentStock, p.minStockAlert);
                      const expStatus = getExpiryStatus(p.expiryDate);

                      return (
                        <tr
                          key={p.id}
                          onClick={() => handleOpenEditModal(p)}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{p.name}</div>
                                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{p.sku}</span>
                                  <span>•</span>
                                  <span className="text-slate-600 flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-amber-500" />
                                    {p.location || 'Gudang Utama'}
                                  </span>
                                  {p.batches && p.batches.length > 1 && (
                                    <span className="text-amber-600 font-medium">({p.batches.length} batch FEFO)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-700">{p.category}</div>
                            {p.subcategory && (
                              <div className="text-[10px] text-amber-600 font-medium">{p.subcategory}</div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                stockStatus.status === 'danger'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : stockStatus.status === 'warning'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'text-slate-700'
                              }`}
                            >
                              {p.currentStock} {p.unit}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {p.expiryDate ? (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                                  expStatus.status === 'expired'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : expStatus.status === 'warning'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'text-slate-500'
                                }`}
                              >
                                {formatDateIndo(p.expiryDate)}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatRupiah(p.hppAmount)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(p.sellingPrice)}
                          </td>

                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetProduct(p)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. SEGMENT 2: BUKU MUTASI GUDANG (Kasir Versi Gudang / Log Keluar Masuk) */}
      {activeStorageTab === 'movement' && (
        <div className="space-y-6">
          {/* Summary KPI Cards for Mutasi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Total Stok Masuk</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">+{movementSummary.totalInUnits} Unit</div>
              <div className="text-[10px] text-emerald-600 font-mono">Kulakan: {formatRupiah(movementSummary.totalInAmount)}</div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Total Stok Keluar</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">-{movementSummary.totalOutUnits} Unit</div>
              <div className="text-[10px] text-slate-400">Penjualan kasir & pesanan</div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Susut & Basi</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="text-xl font-bold text-rose-600 font-mono">-{movementSummary.totalWasteUnits} Unit</div>
              <div className="text-[10px] text-rose-600 font-mono">Kerugian: {formatRupiah(movementSummary.totalWasteAmount)}</div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                <span>Total Aktivitas</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">{movementSummary.totalLogs} Log</div>
              <div className="text-[10px] text-slate-400">Audit kronologis gudang</div>
            </div>
          </div>

          {/* Controls: Search, Type Filter, Category Filter, Location Filter, Add Button */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={movementSearchQuery}
                  onChange={(e) => setMovementSearchQuery(e.target.value)}
                  placeholder="Cari barang, SKU, kode batch (e.g. Batch 24 Okt), sumber, atau catatan..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <CustomDropdown
                  options={[
                    { value: 'Semua', label: 'Semua Kategori' },
                    ...categoryDefinitions.map((c) => ({ value: c.name, label: c.name })),
                  ]}
                  value={movementCategoryFilter}
                  onChange={(val) => setMovementCategoryFilter(val)}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900 py-2"
                />

                <CustomDropdown
                  options={locationFilterOptions}
                  value={movementLocationFilter}
                  onChange={(val) => setMovementLocationFilter(val)}
                  buttonClassName="bg-slate-50 border-slate-200 text-slate-900 py-2"
                />

                <button
                  type="button"
                  onClick={() => handleOpenAddMovement()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Catat Mutasi Manual</span>
                </button>
              </div>
            </div>

            {/* Type Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {[
                { id: 'all', label: 'Semua Mutasi' },
                { id: 'in_purchase', label: 'Stok Masuk (Kulakan)' },
                { id: 'out_sale', label: 'Stok Keluar (Penjualan)' },
                { id: 'waste', label: 'Susut / Rusak / Basi' },
                { id: 'adjustment', label: 'Koreksi Opname' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setMovementTypeFilter(chip.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    movementTypeFilter === chip.id
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mutasi Ledger Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Waktu & Sumber</th>
                    <th className="py-3 px-4">Tipe Mutasi</th>
                    <th className="py-3 px-4">Barang & SKU</th>
                    <th className="py-3 px-4">Lokasi Gudang</th>
                    <th className="py-3 px-4 text-center">Perubahan Stok</th>
                    <th className="py-3 px-4">Batch & Expiry</th>
                    <th className="py-3 px-4 text-right">Nilai Finansial</th>
                    <th className="py-3 px-4">Catatan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Tidak ada catatan mutasi stok yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStockMovements.map((mov) => {
                      const isPositive = mov.quantityDelta > 0;
                      return (
                        <tr
                          key={mov.id}
                          className="hover:bg-slate-50 transition-colors group cursor-pointer"
                          onClick={() => handleOpenEditMovement(mov)}
                        >
                          {/* Waktu & Sumber */}
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-900 text-[11px] font-semibold">{mov.createdAt}</div>
                            <span className="text-[10px] text-slate-400">{mov.source || 'Manual'}</span>
                          </td>

                          {/* Tipe Mutasi */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border ${
                                mov.type === 'in_purchase'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : mov.type === 'out_sale'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : mov.type === 'waste'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {mov.type === 'in_purchase'
                                ? 'Masuk (Kulakan)'
                                : mov.type === 'out_sale'
                                ? 'Keluar (Penjualan)'
                                : mov.type === 'waste'
                                ? 'Susut / Rusak'
                                : 'Koreksi Stok'}
                            </span>
                          </td>

                          {/* Barang & SKU */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 text-xs">{mov.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {mov.sku} • {mov.category}
                            </div>
                          </td>

                          {/* Lokasi Gudang */}
                          <td className="py-3 px-4">
                            <span className="text-slate-600 text-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              <span>{mov.location || 'Gudang Utama'}</span>
                            </span>
                          </td>

                          {/* Perubahan Stok */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isPositive
                                  ? 'text-emerald-600'
                                  : mov.type === 'waste'
                                  ? 'text-rose-600'
                                  : 'text-amber-800'
                              }`}
                            >
                              {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta} {mov.unit || 'pcs'}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {mov.stockBefore} → {mov.stockAfter}
                            </div>
                          </td>

                          {/* Batch & Expiry */}
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-800 text-[11px] font-semibold">
                              {mov.batchCode || '-'}
                            </div>
                            {mov.batchExpiry && (
                              <div className="text-[10px] text-amber-700 font-medium">
                                Exp: {formatDateIndo(mov.batchExpiry)}
                              </div>
                            )}
                          </td>

                          {/* Nilai Finansial */}
                          <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-900">
                            {mov.financialAmount && mov.financialAmount > 0 ? formatRupiah(mov.financialAmount) : '-'}
                          </td>

                          {/* Catatan */}
                          <td className="py-3 px-4 max-w-[200px]">
                            <span className="text-slate-500 text-xs line-clamp-2">{mov.notes}</span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMovement(mov)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Ubah Catatan Mutasi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetMovement(mov)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Mutasi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Tambah Kategori / Sub-Kategori */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-700" />
                <span>
                  {catModalType === 'main'
                    ? 'Tambah Kategori Utama'
                    : 'Tambah Sub-Kategori Baru'}
                </span>
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setCatModalType('main')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                    catModalType === 'main' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Kategori Utama Universal
                </button>
                <button
                  type="button"
                  onClick={() => setCatModalType('sub')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                    catModalType === 'sub' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sub-Kategori
                </button>
              </div>

              {catModalType === 'sub' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-semibold">
                    Kategori Utama Induk
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik atau pilih Kategori Utama induk (misal: Bahan Baku)..."
                    value={targetMainForSub}
                    onChange={(e) => setTargetMainForSub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                  {categoryDefinitions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {categoryDefinitions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setTargetMainForSub(c.name)}
                          className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                            targetMainForSub === c.name
                              ? 'bg-slate-900 text-white font-bold border-slate-900'
                              : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-semibold">
                  {catModalType === 'main' ? 'Nama Kategori Utama' : 'Nama Sub-Kategori'}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={
                    catModalType === 'main'
                      ? 'Contoh: Bahan Baku, Produk Siap Jual, Kemasan...'
                      : 'Contoh: Daging Ayam, Bumbu Rempah, Cup Kopi...'
                  }
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (newCatName.trim()) {
                    if (catModalType === 'main') {
                      addCategory(newCatName.trim());
                      setSelectedMainCategory(newCatName.trim());
                    } else {
                      const parentName = targetMainForSub.trim() || 'Umum';
                      addSubcategory(parentName, newCatName.trim());
                      setSelectedMainCategory(parentName);
                      setSelectedSubcategory(newCatName.trim());
                    }
                    setNewCatName('');
                    setIsCatModalOpen(false);
                  }
                }}
                disabled={!newCatName.trim()}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Ganti Foto Cepat Barang */}
      {quickImageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-700" />
                  <span>Ganti Foto: {quickImageTarget.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500">Upload dari perangkat atau pilih foto katalog UMKM</p>
              </div>
              <button onClick={() => setQuickImageTarget(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Preview */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              {quickImageTarget.imageUrl ? (
                <img
                  src={quickImageTarget.imageUrl}
                  alt="Current Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shrink-0">
                  <Package className="w-7 h-7" />
                </div>
              )}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-900">Foto Saat Ini</span>
                <p className="text-[11px] text-slate-500">Pilih berkas dari perangkat atau masukkan tautan gambar:</p>
              </div>
            </div>

            {/* File Upload Button */}
            <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
              <Upload className="w-4 h-4 text-slate-500 group-hover:text-slate-900" />
              <span className="text-xs font-semibold text-slate-700">
                Pilih Berkas Foto dari Komputer / HP
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, quickImageTarget.id)}
              />
            </label>

            {/* Direct URL Input */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-600">Atau Masukkan Tautan URL Foto:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  defaultValue={quickImageTarget.imageUrl}
                  id="direct-quick-image-url"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const inputEl = document.getElementById('direct-quick-image-url') as HTMLInputElement;
                    if (inputEl && inputEl.value.trim()) {
                      updateProduct(quickImageTarget.id, { imageUrl: inputEl.value.trim() });
                      setQuickImageTarget(null);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shrink-0 shadow-sm hover:bg-slate-800"
                >
                  Terapkan
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickImageTarget(null)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tambah / Edit Barang & Kalkulator HPP Persen Lengkap */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl xl:max-w-6xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-700" />
                <span>{editingProductId ? 'Rincian & Pengaturan Barang' : 'Tambah Barang Baru & Kalkulator HPP'}</span>
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Photo Ingestion at the VERY TOP of the Product Form */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-900 font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>Foto Barang Dagangan</span>
                  </label>
                  <label className="cursor-pointer text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1.5 font-bold transition-colors bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Perangkat (HP / Laptop)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e)}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-5">
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-white shadow-xs p-1 flex items-center justify-center">
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Preview Foto Barang"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-slate-300 text-center px-2">
                        <ImageIcon className="w-7 h-7" />
                        <span className="text-[10px] text-slate-400">Opsional</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-slate-500 font-medium">Atau tempel tautan URL foto gambar:</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-slate-700 font-semibold">Nama Barang Dagangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tepung Segitiga Biru / Daging Ayam Segar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Main Category */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-semibold">Kategori Utama Universal</label>
                  <input
                    type="text"
                    placeholder="Pilih dari opsi di bawah atau ketik kategori baru..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {categoryDefinitions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setFormCategory(c.name);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          formCategory === c.name
                            ? 'bg-slate-900 text-white font-bold border-slate-900'
                            : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-Category */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-semibold">Sub-Kategori Spesifik</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tepung, Bumbu, Sayur, Kopi..."
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                  {availableSubcategoriesForForm.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {availableSubcategoriesForForm.map((sub, sidx) => (
                        <button
                          key={sidx}
                          type="button"
                          onClick={() => setFormSubcategory(sub)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                            formSubcategory === sub
                              ? 'bg-amber-100 text-amber-900 font-bold border-amber-300'
                              : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unit */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Satuan Unit</label>
                  <input
                    type="text"
                    placeholder="Contoh: pcs, kg, porsi, ekor, dus, liter"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Current Stock */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Jumlah Stok Sekarang</label>
                  <input
                    type="number"
                    placeholder="Contoh: 10"
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold font-mono focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Min Stock Alert */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Batas Alarm Stok Menipis</label>
                  <input
                    type="number"
                    placeholder="Contoh: 5"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Storage Location */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>Lokasi Penyimpanan Gudang</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Pilih preset atau ketik manual</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Freezer Daging #1, Chiller Depan, Rak Kering A1..."
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                    {LOCATION_PRESETS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFormLocation(loc)}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] transition-colors shrink-0 cursor-pointer ${
                          formLocation === loc
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purchase Date with Full Clickability AccessibleDatePicker */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-600 font-semibold">
                    Tanggal Beli / Kulakan (Klik di mana saja pada tombol untuk ubah tanggal)
                  </label>
                  <AccessibleDatePicker
                    value={formPurchaseDate}
                    onChange={(val) => setFormPurchaseDate(val)}
                    presetMode="purchase"
                    label="Pilih Tanggal Beli..."
                  />
                </div>

                {/* Batches & Expiry (FEFO) */}
                <div className="space-y-2 sm:col-span-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-amber-500" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Batas Kedaluwarsa Terpisah per Inputan (FEFO)</h4>
                        <p className="text-[10px] text-slate-500">Tiap batch input stok baru bisa punya tanggal kadaluarsa dan sisa stok berbeda</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBatchRow(!showAddBatchRow)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[11px] text-slate-700 border border-slate-200 shadow-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddBatchRow ? 'Batal' : 'Input Batch Baru'}</span>
                    </button>
                  </div>

                  {/* Active Batches List */}
                  {formBatches.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {formBatches.map((batch, idx) => {
                        const batchExpStatus = getExpiryStatus(batch.expiryDate);
                        return (
                          <div
                            key={batch.id || idx}
                            className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between text-xs gap-2.5"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={batch.batchCode || ''}
                                onChange={(e) => handleUpdateBatch(idx, { batchCode: e.target.value })}
                                placeholder={`Batch ${formatDateIndo(batch.receivedDate)}`}
                                className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 flex-1 min-w-[140px]"
                                title="Klik untuk ubah nama/tanggal batch"
                              />
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="number"
                                  min="0"
                                  value={batch.quantity}
                                  onChange={(e) => handleUpdateBatch(idx, { quantity: Math.max(0, parseInt(e.target.value) || 0) })}
                                  className="w-16 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold font-mono text-right"
                                  title="Jumlah stok batch ini"
                                />
                                <span className="text-[11px] text-slate-500 font-mono">{formUnit || 'pcs'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="min-w-[160px]">
                                <AccessibleDatePicker
                                  value={batch.expiryDate}
                                  onChange={(val) => handleUpdateBatch(idx, { expiryDate: val || null })}
                                  presetMode="expiry"
                                  label="Tanggal Exp..."
                                />
                              </div>

                              <span
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap border ${
                                  batchExpStatus.status === 'expired'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : batchExpStatus.status === 'warning'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {batchExpStatus.label}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleDeleteBatch(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Hapus batch ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pt-1 space-y-1">
                      <label className="text-[11px] text-slate-500">
                        Tanggal Kedaluwarsa Produk (Atau klik "+ Input Batch Baru" di atas untuk multi-batch):
                      </label>
                      <AccessibleDatePicker
                        value={formExpiryDate}
                        onChange={(val) => setFormExpiryDate(val)}
                        presetMode="expiry"
                        label="Pilih Tanggal Kedaluwarsa Barang..."
                      />
                    </div>
                  )}

                  {/* Add New Batch Form */}
                  {showAddBatchRow && (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3 mt-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-amber-500" />
                          <span>Tambah Stok Batch Input Baru:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddBatchRow(false)}
                          className="text-[11px] text-slate-400 hover:text-slate-600"
                        >
                          Tutup
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium block mb-1">
                            Jumlah Stok Tambahan ({formUnit || 'pcs'})
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Contoh: 10"
                            value={newBatchQty}
                            onChange={(e) => setNewBatchQty(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium block mb-1">
                            Nama / Tanggal Batch (Opsional)
                          </label>
                          <input
                            type="text"
                            placeholder={`Contoh: ${formatBatchName(new Date().toISOString().split('T')[0])}`}
                            value={newBatchCode}
                            onChange={(e) => setNewBatchCode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[11px] text-slate-600 font-medium block mb-1">
                            Tanggal Kedaluwarsa Batch Ini:
                          </label>
                          <AccessibleDatePicker
                            value={newBatchExpiry}
                            onChange={(val) => setNewBatchExpiry(val)}
                            presetMode="expiry"
                            label="Pilih Tanggal Exp Batch Baru..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const qty = parseInt(newBatchQty) || 0;
                            if (qty <= 0) return;
                            const todayStr = new Date().toISOString().split('T')[0];
                            const newBatch: StockBatch = {
                              id: `batch-${Date.now()}`,
                              quantity: qty,
                              expiryDate: newBatchExpiry || null,
                              receivedDate: todayStr,
                              costPerUnit: computedHpp,
                              batchCode: newBatchCode.trim() || formatBatchName(todayStr),
                            };
                            const updated = [...formBatches, newBatch];
                            setFormBatches(updated);
                            const total = updated.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
                            setFormCurrentStock(total.toString());
                            setShowAddBatchRow(false);
                            setNewBatchQty('');
                            setNewBatchExpiry(null);
                            setNewBatchCode('');
                          }}
                          disabled={!newBatchQty || parseInt(newBatchQty) <= 0}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Simpan Batch Ini
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* HPP Calculator & Margin Slider Section */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Kalkulator HPP & Penetapan Margin Keuntungan
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">
                    HPP Bersih: <span className="text-slate-900 font-bold font-mono">{formatRupiah(computedHpp)}</span>
                  </span>
                </div>

                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setHppMethod('wholesale')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      hppMethod === 'wholesale'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Bagi Grosir/Dus
                  </button>
                  <button
                    type="button"
                    onClick={() => setHppMethod('recipe')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      hppMethod === 'recipe'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Resep & Kemasan
                  </button>
                  <button
                    type="button"
                    onClick={() => setHppMethod('manual')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      hppMethod === 'manual'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Input Bebas
                  </button>
                </div>

                {/* TAB 1: Bagi Grosir / Dus / Bal */}
                {hppMethod === 'wholesale' && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-500">Harga Beli 1 Dus / Karton (Rp)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={wholesaleTotalCost}
                          onChange={(e) => setWholesaleTotalCost(formatThousands(e.target.value))}
                          placeholder="Contoh: 180.000"
                          className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Jumlah Isi Satuan per Dus ({formUnit || 'pcs'})</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={wholesaleUnitsCount}
                          onChange={(e) => setWholesaleUnitsCount(formatThousands(e.target.value))}
                          placeholder="Contoh: 12"
                          className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-amber-500" />
                          <span>Ongkir / Ekspedisi per Dus (Rp)</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={wholesaleShipping}
                          onChange={(e) => setWholesaleShipping(formatThousands(e.target.value))}
                          placeholder="Contoh: 10.000"
                          className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Estimasi Susut / Kerusakan (%)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={wholesaleWastePercent}
                          onChange={(e) => setWholesaleWastePercent(e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="Contoh: 2"
                          className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    {/* Transparent Formula Breakdown Card */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700 font-semibold">Rumus Transparan: (Harga Dus + Ongkir) ÷ Isi × (1 + Susut%)</span>
                        <span className="text-amber-600 font-bold font-mono">= {formatRupiah(computedHpp)}/{formUnit || 'pcs'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <div>Modal Dasar: <span className="text-slate-900 font-mono">{formatRupiah(Math.round((parseThousands(wholesaleTotalCost) || 0) / (parseThousands(wholesaleUnitsCount) || 1)))}</span></div>
                        <div>Beban Ongkir: <span className="text-slate-900 font-mono">+{formatRupiah(Math.round((parseThousands(wholesaleShipping) || 0) / (parseThousands(wholesaleUnitsCount) || 1)))}</span></div>
                        <div>Cadangan Susut: <span className="text-slate-900 font-mono">+{wholesaleWastePercent || 0}%</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Resep & Kemasan (F&B / Produksi) */}
                {hppMethod === 'recipe' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 block">
                        Rincian Komponen Bahan & Kemasan per Porsi ({recipeComponents.length} Komponen):
                      </span>
                    </div>

                    <div className="space-y-2">
                      {recipeComponents.map((item, idx) => {
                        const totalCompCost = recipeComponents.reduce((sum, c) => sum + (c.cost || 0), 0) || 1;
                        const percentage = ((item.cost / totalCompCost) * 100).toFixed(0);

                        return (
                          <div key={item.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.name}
                              placeholder="Nama komponen..."
                              onChange={(e) => {
                                const copy = [...recipeComponents];
                                copy[idx].name = e.target.value;
                                setRecipeComponents(copy);
                              }}
                              className="flex-1 bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                            <div className="relative w-32">
                              <span className="absolute left-2 top-1.5 text-[10px] text-slate-400 font-mono">Rp</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatThousands(item.cost)}
                                onChange={(e) => {
                                  const copy = [...recipeComponents];
                                  copy[idx].cost = parseThousands(e.target.value);
                                  setRecipeComponents(copy);
                                }}
                                className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-900 text-right font-semibold font-mono"
                              />
                            </div>
                            <span className="w-12 text-right font-mono text-[10px] text-slate-500">
                              {percentage}%
                            </span>
                            <button
                              type="button"
                              onClick={() => setRecipeComponents(recipeComponents.filter((_, cIdx) => cIdx !== idx))}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hapus komponen ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Add Component Row */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="+ Nama bahan / bumbu / kemasan baru..."
                        value={newCompName}
                        onChange={(e) => setNewCompName(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      />
                      <div className="relative w-32">
                        <span className="absolute left-2 top-1.5 text-[10px] text-slate-400 font-mono">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={newCompCost}
                          onChange={(e) => setNewCompCost(formatThousands(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-900 font-mono text-right"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (newCompName.trim() && parseThousands(newCompCost) > 0) {
                            setRecipeComponents([
                              ...recipeComponents,
                              {
                                id: `comp-${Date.now()}`,
                                name: newCompName.trim(),
                                cost: parseThousands(newCompCost),
                              },
                            ]);
                            setNewCompName('');
                            setNewCompCost('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors shrink-0"
                      >
                        Tambah Komponen
                      </button>
                    </div>

                    {/* Overhead per Portion */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Biaya Tenaga Kerja / Listrik / Overhead per Porsi:</span>
                      <div className="relative w-32">
                        <span className="absolute left-2 top-1.5 text-[10px] text-slate-400 font-mono">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={recipeOverhead}
                          onChange={(e) => setRecipeOverhead(formatThousands(e.target.value))}
                          placeholder="0"
                          className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-900 text-right font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Input Bebas & Catatan Supplier */}
                {hppMethod === 'manual' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-500">Nominal HPP per Satuan ({formUnit || 'pcs'})</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={manualHpp}
                        onChange={(e) => setManualHpp(formatThousands(e.target.value))}
                        placeholder="Contoh: 15.000"
                        className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-500">Nama Supplier / Toko Kulakan</label>
                        <input
                          type="text"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          placeholder="Contoh: Agen Pasar Induk, Toko Jaya Abadi"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500">Termin & Catatan Pembelian</label>
                        <input
                          type="text"
                          value={supplierNotes}
                          onChange={(e) => setSupplierNotes(e.target.value)}
                          placeholder="Contoh: Tunai diskon 2%, Tempo 7 hari"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Profit Margin Slider (%) */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900">
                        Slider Margin Untung (%):
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {profitMarginPercent}%
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          profitMarginPercent >= 35
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : profitMarginPercent >= 20
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {profitMarginPercent >= 35
                          ? 'Sehat / Premium'
                          : profitMarginPercent >= 20
                          ? 'Standar Kafe'
                          : 'Margin Tipis'}
                      </span>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min="0"
                    max="150"
                    step="5"
                    value={profitMarginPercent}
                    onChange={(e) => handleMarginSliderChange(parseInt(e.target.value) || 0)}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    {[15, 25, 35, 50, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleMarginSliderChange(preset)}
                        className={`flex-1 py-1 rounded-lg text-center transition-colors font-mono ${
                          profitMarginPercent === preset
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        +{preset}%
                      </button>
                    ))}
                  </div>

                  {/* Untung Bersih Nominal Preview */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Rekomendasi Laba Bersih per {formUnit || 'pcs'}:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +{formatRupiah(Math.max(0, parseThousands(formSellingPrice) - computedHpp))}
                    </span>
                  </div>
                </div>

                {/* Final Selling Price Input */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs text-slate-900 font-semibold">Harga Jual Akhir</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formSellingPrice}
                      onChange={(e) => handleSellingPriceInputChange(e.target.value)}
                      placeholder="Contoh: 14.000"
                      className="w-full bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-bold font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {!editingProductId && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={recordInitialStockToCash}
                      onChange={(e) => setRecordInitialStockToCash(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Catat pembelian stok awal ini ke Pengeluaran Buku Kas
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Otomatis memperbarui Kas Toko, Alokasi Biaya, dan Laporan Analisis jika stok & HPP terisi
                      </span>
                    </div>
                  </label>
                  {recordInitialStockToCash &&
                    (formBatches.length > 0
                      ? formBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0)
                      : parseInt(formCurrentStock) || 0) > 0 &&
                    computedHpp > 0 && (
                      <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                        -
                        {formatRupiah(
                          (formBatches.length > 0
                            ? formBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0)
                            : parseInt(formCurrentStock) || 0) * computedHpp
                        )}
                      </span>
                    )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  {editingProductId ? 'Simpan Perubahan' : 'Masukkan ke Gudang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Catat / Edit Mutasi Manual (Kasir Versi Gudang) */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{editingMovement ? 'Ubah Catatan Mutasi Gudang' : 'Catat Mutasi Stok Gudang (Kasir Gudang)'}</span>
              </h2>
              <button onClick={() => setIsMovementModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4 overflow-y-auto">
              {/* Product Selection */}
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">Pilih Barang yang Mengalami Mutasi</label>
                {products.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
                    <span>Belum ada barang di Katalog Gudang (0 SKU). Tambahkan barang terlebih dahulu.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMovementModalOpen(false);
                        setActiveStorageTab('catalog');
                        handleOpenAddModal();
                      }}
                      className="px-3 py-1.5 rounded-full bg-slate-900 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      + Tambah Barang
                    </button>
                  </div>
                ) : (
                  <CustomDropdown
                    options={products.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.currentStock} ${p.unit}) — SKU: ${p.sku}`,
                    }))}
                    value={movProductId}
                    onChange={(val) => {
                      setMovProductId(val);
                      const matched = products.find((p) => p.id === val);
                      if (matched) {
                        setMovLocation(matched.location || 'Gudang Utama');
                        setMovFinancialAmount(matched.hppAmount ? formatThousands(matched.hppAmount) : '0');
                      }
                    }}
                    className="w-full"
                    buttonClassName="w-full bg-slate-50 border-slate-200 text-slate-900 py-2"
                  />
                )}
              </div>

              {/* Mutation Type */}
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">Tipe Mutasi Stok</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  {[
                    { id: 'in_purchase', label: 'Masuk (Kulakan)' },
                    { id: 'out_sale', label: 'Keluar (Penjualan)' },
                    { id: 'waste', label: 'Susut / Basi' },
                    { id: 'adjustment', label: 'Koreksi Opname' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMovType(t.id as any)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        movType === t.id
                          ? 'bg-white text-slate-900 font-bold shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Jumlah Mutasi Unit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movQty}
                    onChange={(e) => setMovQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Tanggal Mutasi</label>
                  <AccessibleDatePicker
                    value={movDate}
                    onChange={(val) => setMovDate(val || new Date().toISOString().split('T')[0])}
                    presetMode="purchase"
                    label="Pilih Tanggal Mutasi..."
                  />
                </div>
              </div>

              {/* Batch Code & Batch Expiry (FEFO tracking) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Boxes className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pelacak Batch & Masa Simpan (FEFO)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Format Batch (Misal: Batch 24 Oktober 2026)</label>
                    <input
                      type="text"
                      placeholder={`Contoh: ${formatBatchName(movDate)}`}
                      value={movBatchCode}
                      onChange={(e) => setMovBatchCode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Batas Kadaluarsa Batch (Opsional)</label>
                    <AccessibleDatePicker
                      value={movBatchExpiry}
                      onChange={(val) => setMovBatchExpiry(val)}
                      presetMode="expiry"
                      label="Pilih Tanggal Kedaluwarsa..."
                    />
                  </div>
                </div>
              </div>

              {/* Financial Nominal & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Nilai Finansial (Opsional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatThousands(movFinancialAmount)}
                      onChange={(e) => setMovFinancialAmount(formatThousands(e.target.value))}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Lokasi Rak / Penyimpanan Gudang</label>
                  <input
                    type="text"
                    value={movLocation}
                    onChange={(e) => setMovLocation(e.target.value)}
                    placeholder="Contoh: Freezer Daging #1, Chiller Depan"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Source & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Sumber / Saluran Input</label>
                  <input
                    type="text"
                    value={movSource}
                    onChange={(e) => setMovSource(e.target.value)}
                    placeholder="Contoh: Input Manual Gudang, Kasir POS, Voice Mic..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-600 font-semibold">Catatan / Alasan Mutasi</label>
                  <input
                    type="text"
                    value={movNotes}
                    onChange={(e) => setMovNotes(e.target.value)}
                    placeholder="Contoh: Beli di pasar induk, Basi saat mati lampu..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  {editingMovement ? 'Simpan Perubahan Mutasi' : 'Catat ke Buku Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Movement Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetMovement}
        itemName={deleteTargetMovement ? `${deleteTargetMovement.productName} (${deleteTargetMovement.quantityDelta > 0 ? `+${deleteTargetMovement.quantityDelta}` : deleteTargetMovement.quantityDelta} unit)` : 'Mutasi ini'}
        title="Hapus Catatan Mutasi Gudang"
        description={`Log mutasi ${deleteTargetMovement?.type} pada tanggal ${deleteTargetMovement?.createdAt} akan dihapus secara permanen.`}
        onConfirm={() => {
          if (deleteTargetMovement) {
            deleteStockMovement(deleteTargetMovement.id);
            setDeleteTargetMovement(null);
          }
        }}
        onCancel={() => setDeleteTargetMovement(null)}
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetProduct}
        itemName={deleteTargetProduct?.name || 'Barang ini'}
        title="Hapus Barang dari Gudang"
        description={`SKU: ${deleteTargetProduct?.sku} • Sisa stok: ${deleteTargetProduct?.currentStock} ${deleteTargetProduct?.unit}. Barang ini akan dihapus permanen dari inventaris.`}
        onConfirm={() => {
          if (deleteTargetProduct) {
            deleteProduct(deleteTargetProduct.id);
            setDeleteTargetProduct(null);
          }
        }}
        onCancel={() => setDeleteTargetProduct(null)}
      />
    </div>
  );
};
