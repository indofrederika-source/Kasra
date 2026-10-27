'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { Product, ProductUnit, HppMethod, HppComponent, StockBatch, StockMovement, StockMovementType } from '@/types';
import { formatRupiah, formatDateIndo, getExpiryStatus, getStockStatus, formatBatchName, getActiveProductExpiry } from '@/lib/utils';
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
  const [movDate, setMovDate] = useState(new Date().toISOString().split('T')[0]);

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
  const [targetMainForSub, setTargetMainForSub] = useState(
    categoryDefinitions[0]?.name || 'Bahan Baku & Dapur'
  );

  // Quick Change Image Modal
  const [quickImageTarget, setQuickImageTarget] = useState<Product | null>(null);

  // Add / Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Custom Delete Confirm Modal State
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);

  // Product Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState(categoryDefinitions[0]?.name || 'Bahan Baku & Dapur');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formLocation, setFormLocation] = useState('Gudang Utama');
  const [formUnit, setFormUnit] = useState<ProductUnit | string>('pcs');
  const [formImageUrl, setFormImageUrl] = useState(UMKM_IMAGE_PRESETS[0].url);
  const [formCurrentStock, setFormCurrentStock] = useState('10');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formPurchaseDate, setFormPurchaseDate] = useState('2026-10-26');
  const [formExpiryDate, setFormExpiryDate] = useState<string | null>(null);
  const [formSellingPrice, setFormSellingPrice] = useState('20000');

  // Profit Margin Slider State
  const [profitMarginPercent, setProfitMarginPercent] = useState(30);

  // Batches State (FEFO Multi-Batch tracking per input)
  const [formBatches, setFormBatches] = useState<StockBatch[]>([]);
  const [newBatchQty, setNewBatchQty] = useState('10');
  const [newBatchExpiry, setNewBatchExpiry] = useState<string | null>(null);
  const [newBatchCode, setNewBatchCode] = useState('');
  const [showAddBatchRow, setShowAddBatchRow] = useState(false);

  // HPP Calculator States
  const [hppMethod, setHppMethod] = useState<HppMethod>('wholesale');
  const [wholesaleTotalCost, setWholesaleTotalCost] = useState('180000');
  const [wholesaleUnitsCount, setWholesaleUnitsCount] = useState('12');
  const [wholesaleShipping, setWholesaleShipping] = useState('12000');
  const [wholesaleWastePercent, setWholesaleWastePercent] = useState('2');

  const [recipeComponents, setRecipeComponents] = useState<HppComponent[]>([
    { id: '1', name: 'Bahan Baku Utama', cost: 4000 },
    { id: '2', name: 'Bahan Tambahan', cost: 2500 },
    { id: '3', name: 'Kemasan & Plastik', cost: 1200 },
  ]);
  const [recipeOverhead, setRecipeOverhead] = useState('500');
  const [newCompName, setNewCompName] = useState('');
  const [newCompCost, setNewCompCost] = useState('');

  const [manualHpp, setManualHpp] = useState('10000');
  const [supplierName, setSupplierName] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Calculate HPP dynamically
  const computedHpp = useMemo(() => {
    if (hppMethod === 'wholesale') {
      const rawCost = parseFloat(wholesaleTotalCost) || 0;
      const shipping = parseFloat(wholesaleShipping) || 0;
      const count = parseFloat(wholesaleUnitsCount) || 1;
      const wastePercent = parseFloat(wholesaleWastePercent) || 0;
      const basePerUnit = (rawCost + shipping) / (count > 0 ? count : 1);
      const withWaste = basePerUnit * (1 + wastePercent / 100);
      return Math.round(withWaste);
    } else if (hppMethod === 'recipe') {
      const componentsSum = recipeComponents.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const overhead = parseFloat(recipeOverhead) || 0;
      return Math.round(componentsSum + overhead);
    } else {
      return parseFloat(manualHpp) || 0;
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
    const calculatedPrice = Math.round(computedHpp * (1 + newMargin / 100));
    setFormSellingPrice(calculatedPrice.toString());
  };

  // Synchronize Margin Slider when Selling Price input changes
  const handleSellingPriceInputChange = (newPriceStr: string) => {
    setFormSellingPrice(newPriceStr);
    const priceNum = parseFloat(newPriceStr) || 0;
    if (computedHpp > 0) {
      const margin = Math.round(((priceNum - computedHpp) / computedHpp) * 100);
      setProfitMarginPercent(Math.max(-100, Math.min(300, margin)));
    }
  };

  // Sub-categories available for current form category
  const availableSubcategoriesForForm = useMemo(() => {
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
    setFormName('');
    const skuCode = `KSR-${Math.floor(100 + Math.random() * 900)}`;
    setFormSku(skuCode);
    const defaultCat = categoryDefinitions[0]?.name || 'Bahan Baku & Dapur';
    setFormCategory(defaultCat);
    setFormSubcategory(categoryDefinitions[0]?.subcategories[0] || '');
    setFormLocation('Gudang Utama');
    setFormUnit('pcs');
    setFormImageUrl(UMKM_IMAGE_PRESETS[0].url);
    setFormCurrentStock('10');
    setFormMinStock('5');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormExpiryDate(null);
    setFormBatches([]);
    setShowAddBatchRow(false);
    setHppMethod('wholesale');
    setWholesaleTotalCost('180000');
    setWholesaleUnitsCount('12');
    setWholesaleShipping('10000');
    setWholesaleWastePercent('2');
    setRecipeComponents([
      { id: '1', name: 'Bahan Baku Utama', cost: 4000 },
      { id: '2', name: 'Bahan Tambahan', cost: 2500 },
      { id: '3', name: 'Kemasan & Plastik', cost: 1200 },
    ]);
    setRecipeOverhead('500');
    setManualHpp('10000');
    setSupplierName('');
    setSupplierNotes('');
    setProfitMarginPercent(30);
    setFormSellingPrice('19500');
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setFormName(prod.name);
    setFormSku(prod.sku);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory || '');
    setFormLocation(prod.location || 'Gudang Utama');
    setFormUnit(prod.unit);
    setFormImageUrl(prod.imageUrl);
    setFormCurrentStock(prod.currentStock.toString());
    setFormMinStock(prod.minStockAlert.toString());
    setFormPurchaseDate(prod.purchaseDate || new Date().toISOString().split('T')[0]);
    setFormExpiryDate(prod.expiryDate || null);
    setShowAddBatchRow(false);

    if (prod.batches && prod.batches.length > 0) {
      setFormBatches([...prod.batches]);
    } else {
      setFormBatches([
        {
          id: `batch-${prod.id}-01`,
          quantity: prod.currentStock,
          expiryDate: prod.expiryDate || null,
          receivedDate: prod.purchaseDate || new Date().toISOString().split('T')[0],
          costPerUnit: prod.hppAmount,
          batchCode: formatBatchName(prod.purchaseDate || new Date().toISOString().split('T')[0]),
        },
      ]);
    }

    setFormSellingPrice(prod.sellingPrice.toString());
    setHppMethod(prod.hppMethod);
    setManualHpp(prod.hppAmount.toString());
    if (prod.hppBreakdown && prod.hppBreakdown.length > 0) {
      setRecipeComponents(prod.hppBreakdown);
    }
    if (prod.hppAmount > 0) {
      const margin = Math.round(((prod.sellingPrice - prod.hppAmount) / prod.hppAmount) * 100);
      setProfitMarginPercent(margin);
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
      category: formCategory,
      subcategory: formSubcategory || undefined,
      location: formLocation.trim() || 'Gudang Utama',
      unit: formUnit as ProductUnit,
      imageUrl: formImageUrl.trim() || UMKM_IMAGE_PRESETS[0].url,
      currentStock: finalStock,
      minStockAlert: Math.max(0, parseInt(formMinStock) || 0),
      purchaseDate: formPurchaseDate,
      expiryDate: earliestBatchExpiry || undefined,
      batches: formBatches.length > 0 ? formBatches : undefined,
      hppAmount: computedHpp,
      hppMethod,
      hppBreakdown: hppMethod === 'recipe' ? recipeComponents : undefined,
      sellingPrice: Math.max(0, parseInt(formSellingPrice) || 0),
    };

    if (editingProductId) {
      updateProduct(editingProductId, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsProductModalOpen(false);
  };

  // Mutasi Gudang Handlers
  const handleOpenAddMovement = (presetProd?: Product) => {
    setEditingMovement(null);
    const target = presetProd || products[0];
    const todayStr = new Date().toISOString().split('T')[0];
    setMovProductId(target?.id || '');
    setMovType('in_purchase');
    setMovQty('1');
    setMovBatchCode(formatBatchName(todayStr));
    setMovBatchExpiry(null);
    setMovFinancialAmount(target?.hppAmount ? target.hppAmount.toString() : '0');
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
    setMovFinancialAmount(mov.financialAmount ? mov.financialAmount.toString() : '0');
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
        financialAmount: parseFloat(movFinancialAmount) || 0,
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
        financialAmount: parseFloat(movFinancialAmount) || 0,
        source: movSource,
        notes: movNotes || (movType === 'in_purchase' ? 'Kulakan stok baru' : movType === 'out_sale' ? 'Penjualan ke pelanggan' : movType === 'waste' ? 'Barang basi / rusak' : 'Koreksi stok opname'),
      });

      // Update physical product inventory in context
      if (matchedProduct) {
        if (movType === 'in_purchase') {
          const newBatch: StockBatch = {
            id: `batch-${Date.now()}`,
            quantity: qtyNum,
            expiryDate: movBatchExpiry || null,
            receivedDate: movDate,
            costPerUnit: matchedProduct.hppAmount,
            batchCode: movBatchCode || formatBatchName(movDate),
          };
          const existingBatches = matchedProduct.batches ? [...matchedProduct.batches] : [];
          existingBatches.push(newBatch);
          const earliestExp = getActiveProductExpiry(existingBatches, matchedProduct.expiryDate);
          updateProduct(matchedProduct.id, {
            currentStock: stockAfter,
            batches: existingBatches,
            expiryDate: earliestExp || undefined,
          });
        } else if (movType === 'out_sale' || movType === 'waste') {
          // FEFO deduction from batches
          let remainingToDeduct = qtyNum;
          const updatedBatches = matchedProduct.batches ? matchedProduct.batches.map((b) => ({ ...b })) : [];
          if (updatedBatches.length > 0) {
            updatedBatches.sort((a, b) => {
              if (!a.expiryDate) return 1;
              if (!b.expiryDate) return -1;
              return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
            });
            for (const b of updatedBatches) {
              if (remainingToDeduct <= 0) break;
              if (b.quantity > 0) {
                const deduct = Math.min(b.quantity, remainingToDeduct);
                b.quantity -= deduct;
                remainingToDeduct -= deduct;
              }
            }
          }
          const earliestExp = getActiveProductExpiry(updatedBatches, matchedProduct.expiryDate);
          updateProduct(matchedProduct.id, {
            currentStock: stockAfter,
            batches: updatedBatches.length > 0 ? updatedBatches : undefined,
            expiryDate: earliestExp || undefined,
          });
        } else {
          updateProduct(matchedProduct.id, { currentStock: stockAfter });
        }
      }
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
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Manajemen Gudang & Stok</span>
          </h1>
          <p className="text-xs text-[#8a8a92] mt-1">
            Katalog stok fisik, pelacak FEFO kedaluwarsa, dan buku mutasi keluar-masuk gudang
          </p>
        </div>

        {/* Input Methods / Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeStorageTab === 'catalog' ? (
            <>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-semibold transition-all shadow active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Tambah Barang</span>
              </button>

              <button
                onClick={onOpenScan}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202024] hover:bg-[#28282e] text-stone-200 border border-[#2c2c32] text-xs font-medium transition-all shadow-sm"
              >
                <ScanLine className="w-3.5 h-3.5 text-stone-300" />
                <span>Scan Nota Kulakan</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleOpenAddMovement()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Catat Mutasi Manual</span>
            </button>
          )}

          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#202024] hover:bg-[#28282e] text-stone-200 border border-[#2c2c32] text-xs font-medium transition-all shadow-sm"
          >
            <Mic className="w-3.5 h-3.5 text-stone-300" />
            <span>Bicara Stok</span>
          </button>
        </div>
      </div>

      {/* 2. Top Segmented Mode Switcher (Katalog & Stok Fisik vs Buku Mutasi Gudang) */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex items-center p-1 bg-[#171719] border border-[#2c2c32] rounded-full shadow-inner">
          <button
            type="button"
            onClick={() => setActiveStorageTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              activeStorageTab === 'catalog'
                ? 'bg-white text-black shadow-md'
                : 'text-stone-400 hover:text-white'
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
                ? 'bg-white text-black shadow-md'
                : 'text-stone-400 hover:text-white'
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
        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-4 space-y-1 transition-colors">
          <div className="text-[11px] text-[#8a8a92]">Total Jenis Barang</div>
          <div className="text-xl font-bold text-white font-mono">{products.length} SKU</div>
          <div className="text-[10px] text-[#71717a]">Terdaftar di gudang</div>
        </div>

        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-4 space-y-1 transition-colors">
          <div className="text-[11px] text-[#8a8a92]">Nilai Aset Stok (HPP)</div>
          <div className="text-xl font-bold text-white font-mono">{formatRupiah(totalAssetValue)}</div>
          <div className="text-[10px] text-[#71717a]">Modal tertanam di gudang</div>
        </div>

        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-4 space-y-1 transition-colors">
          <div className="text-[11px] text-[#8a8a92]">Stok Kritis / Menipis</div>
          <div className="text-xl font-bold text-white font-mono">{criticalStockCount} Barang</div>
          <div className="text-[10px] text-[#71717a]">Perlu restock segera</div>
        </div>

        <div className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl p-4 space-y-1 transition-colors">
          <div className="text-[11px] text-[#8a8a92]">Mendekati Kadaluarsa</div>
          <div className="text-xl font-bold text-white font-mono">{nearExpiryCount} Barang</div>
          <div className="text-[10px] text-[#71717a]">Dalam 7 hari ke depan</div>
        </div>
      </div>

      {/* 3. Search & 2-Tier Category Filter Bar */}
      <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang, SKU, kategori utama, atau sub-kategori (ayam, sayur)..."
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#171719] p-1 rounded-full border border-[#2c2c32]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-full text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#202024] hover:bg-[#28282e] text-stone-200 border border-[#2c2c32] text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kelola Kategori</span>
            </button>
          </div>
        </div>

        {/* TIER 1: Kategori Utama Universal */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8a8a92] uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>Kategori Utama:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setCatModalType('main');
                setNewCatName('');
                setIsCatModalOpen(true);
              }}
              className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Kategori Utama</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setSelectedMainCategory('Semua');
                setSelectedSubcategory('Semua');
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                selectedMainCategory === 'Semua'
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-[#171719] text-stone-400 hover:text-white border border-[#2c2c32]'
              }`}
            >
              Semua Kategori ({products.length})
            </button>

            {categoryDefinitions.map((cat) => {
              const count = products.filter((p) => p.category === cat.name).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedMainCategory(cat.name);
                    setSelectedSubcategory('Semua');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    selectedMainCategory === cat.name
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-[#171719] text-stone-400 hover:text-white border border-[#2c2c32]'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* TIER 2: Sub-Kategori Chips (Dynamically based on Main Category) */}
        {availableSubcategoriesForFilter.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#28282e]">
            <div className="flex items-center justify-between text-[11px] text-[#8a8a92]">
              <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                <Tag className="w-3 h-3 text-[#f2aa4b]" />
                <span>
                  Sub-Kategori {selectedMainCategory !== 'Semua' ? `(${selectedMainCategory})` : ''}:
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCatModalType('sub');
                  setTargetMainForSub(
                    selectedMainCategory !== 'Semua'
                      ? selectedMainCategory
                      : categoryDefinitions[0]?.name || 'Bahan Baku'
                  );
                  setNewCatName('');
                  setIsCatModalOpen(true);
                }}
                className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Sub-Kategori</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedSubcategory('Semua')}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 transition-colors ${
                  selectedSubcategory === 'Semua'
                    ? 'bg-[#f2aa4b] text-black font-bold'
                    : 'bg-[#171719] text-stone-400 hover:text-white border border-[#2c2c32]'
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

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 transition-colors ${
                      selectedSubcategory === sub
                        ? 'bg-[#f2aa4b] text-black font-bold'
                        : 'bg-[#171719] text-stone-300 hover:text-white border border-[#2c2c32]'
                    }`}
                  >
                    {sub} {subCount > 0 ? `(${subCount})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Secondary Filter Row: Condition, Expiry, & Location */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#28282e] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#8a8a92] text-[11px]">Kondisi Stok:</span>
            <CustomDropdown
              options={stockOptions}
              value={stockFilter}
              onChange={(val) => setStockFilter(val)}
              buttonClassName="bg-[#171719]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8a8a92] text-[11px]">Batas Kadaluarsa:</span>
            <CustomDropdown
              options={expiryOptions}
              value={expiryFilter}
              onChange={(val) => setExpiryFilter(val)}
              buttonClassName="bg-[#171719]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8a8a92] text-[11px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#f2aa4b]" />
              <span>Lokasi Gudang:</span>
            </span>
            <CustomDropdown
              options={locationFilterOptions}
              value={selectedLocation}
              onChange={(val) => setSelectedLocation(val)}
              buttonClassName="bg-[#171719]"
            />
          </div>
        </div>
      </div>

      {/* 4. Display Products: Grid View OR Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const stockStatus = getStockStatus(p.currentStock, p.minStockAlert);
            const expStatus = getExpiryStatus(p.expiryDate);

            return (
              <div
                key={p.id}
                onClick={() => handleOpenEditModal(p)}
                className="bg-[#1c1c1f] border border-[#2c2c32] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-150 flex flex-col justify-between group shadow-md cursor-pointer"
              >
                <div>
                  {/* Image with Direct Quick Change Overlay */}
                  <div className="relative h-44 w-full bg-[#171719] overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Quick Change Photo Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickImageTarget(p);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/70 hover:bg-black text-stone-300 hover:text-white backdrop-blur-md border border-[#3b3b40] transition-colors"
                      title="Ganti Foto Barang"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start max-w-[85%]">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#171719]/90 text-white backdrop-blur-sm border border-[#2c2c32]">
                          {p.category}
                        </span>
                        {p.subcategory && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#282015]/90 text-[#f2aa4b] backdrop-blur-sm border border-[#44331e]">
                            {p.subcategory}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm border ${
                            stockStatus.status === 'danger'
                              ? 'bg-[#2a171c]/90 text-rose-300 border-[#48202a]'
                              : stockStatus.status === 'warning'
                              ? 'bg-[#282015]/90 text-[#f2aa4b] border-[#44331e]'
                              : 'bg-[#171719]/90 text-stone-300 border-[#2c2c32]'
                          }`}
                        >
                          {stockStatus.label}: {p.currentStock} {p.unit}
                        </span>

                        {p.batches && p.batches.length > 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#282015]/90 text-[#f2aa4b] backdrop-blur-sm border border-[#44331e] flex items-center gap-1">
                            <Boxes className="w-2.5 h-2.5" />
                            <span>{p.batches.length} Batch FEFO</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    {p.expiryDate && (
                      <div className="absolute bottom-2 left-2.5 right-2.5">
                        <span
                          className={`w-full text-center block px-2.5 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-md border ${
                            expStatus.status === 'expired'
                              ? 'bg-[#2a171c]/90 text-rose-300 border-[#48202a]'
                              : expStatus.status === 'warning'
                              ? 'bg-[#282015]/90 text-[#f2aa4b] border-[#44331e]'
                              : 'bg-[#171719]/90 text-stone-300 border-[#2c2c32]'
                          }`}
                        >
                          {expStatus.label} {p.batches && p.batches.length > 1 ? '(Batch Terdekat)' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 transition-colors">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#71717a] shrink-0">
                        {p.sku}
                      </span>
                    </div>

                    {/* Storage Location Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8a8a92]">
                      <MapPin className="w-3 h-3 text-[#f2aa4b] shrink-0" />
                      <span className="truncate">{p.location || 'Gudang Utama'}</span>
                    </div>

                    {/* Prices */}
                    <div className="pt-2 border-t border-[#28282e] flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-[#8a8a92]">Modal (HPP):</div>
                        <div className="text-stone-300 font-semibold font-mono">
                          {formatRupiah(p.hppAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#8a8a92]">Harga Jual:</div>
                        <div className="text-white font-bold font-mono">
                          {formatRupiah(p.sellingPrice)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div
                  className="px-4 py-3 bg-[#171719] border-t border-[#28282e] flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-[#71717a]">Klik kartu untuk rincian</span>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetProduct(p)}
                    className="p-1 rounded text-[#71717a] hover:text-rose-400 transition-colors"
                    title="Hapus barang"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#171719] border-b border-[#28282e] text-[#8a8a92] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Barang & SKU</th>
                  <th className="py-3 px-4">Kategori & Sub</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4">Batas Kadaluarsa</th>
                  <th className="py-3 px-4 text-right">Modal (HPP)</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242428]">
                {filteredProducts.map((p) => {
                  const stockStatus = getStockStatus(p.currentStock, p.minStockAlert);
                  const expStatus = getExpiryStatus(p.expiryDate);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleOpenEditModal(p)}
                      className="hover:bg-[#222226] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-[#2c2c32]"
                          />
                          <div>
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-[10px] font-mono text-[#71717a] flex items-center gap-1.5 mt-0.5">
                              <span>{p.sku}</span>
                              <span>•</span>
                              <span className="text-stone-300 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5 text-[#f2aa4b]" />
                                {p.location || 'Gudang Utama'}
                              </span>
                              {p.batches && p.batches.length > 1 && (
                                <span className="text-[#f2aa4b] font-medium">({p.batches.length} batch FEFO)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-stone-300">{p.category}</div>
                        {p.subcategory && (
                          <div className="text-[10px] text-[#f2aa4b]">{p.subcategory}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            stockStatus.status === 'danger'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                              : stockStatus.status === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'text-stone-300'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {p.expiryDate ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              expStatus.status === 'expired'
                                ? 'bg-rose-500/10 text-rose-300'
                                : expStatus.status === 'warning'
                                ? 'bg-amber-500/10 text-amber-300'
                                : 'text-stone-400'
                            }`}
                          >
                            {formatDateIndo(p.expiryDate)}
                          </span>
                        ) : (
                          <span className="text-[#71717a]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-stone-300">
                        {formatRupiah(p.hppAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatRupiah(p.sellingPrice)}
                      </td>

                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetProduct(p)}
                          className="p-1 rounded text-[#71717a] hover:text-rose-400 transition-colors"
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
            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-4 space-y-1">
              <div className="text-[11px] text-[#8a8a92] flex items-center justify-between">
                <span>Total Stok Masuk</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">+{movementSummary.totalInUnits} Unit</div>
              <div className="text-[10px] text-emerald-400 font-mono">Kulakan: {formatRupiah(movementSummary.totalInAmount)}</div>
            </div>

            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-4 space-y-1">
              <div className="text-[11px] text-[#8a8a92] flex items-center justify-between">
                <span>Total Stok Keluar</span>
                <span className="w-2 h-2 rounded-full bg-[#f2aa4b]" />
              </div>
              <div className="text-xl font-bold text-white font-mono">-{movementSummary.totalOutUnits} Unit</div>
              <div className="text-[10px] text-[#8a8a92]">Penjualan kasir & pesanan</div>
            </div>

            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-4 space-y-1">
              <div className="text-[11px] text-[#8a8a92] flex items-center justify-between">
                <span>Susut & Basi</span>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
              </div>
              <div className="text-xl font-bold text-rose-300 font-mono">-{movementSummary.totalWasteUnits} Unit</div>
              <div className="text-[10px] text-rose-400 font-mono">Kerugian: {formatRupiah(movementSummary.totalWasteAmount)}</div>
            </div>

            <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-4 space-y-1">
              <div className="text-[11px] text-[#8a8a92] flex items-center justify-between">
                <span>Total Aktivitas</span>
                <Clock className="w-3.5 h-3.5 text-stone-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{movementSummary.totalLogs} Log</div>
              <div className="text-[10px] text-[#71717a]">Audit kronologis gudang</div>
            </div>
          </div>

          {/* Controls: Search, Type Filter, Category Filter, Location Filter, Add Button */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={movementSearchQuery}
                  onChange={(e) => setMovementSearchQuery(e.target.value)}
                  placeholder="Cari barang, SKU, kode batch (e.g. Batch 24 Okt), sumber, atau catatan..."
                  className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none"
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
                  buttonClassName="bg-[#171719] py-2"
                />

                <CustomDropdown
                  options={locationFilterOptions}
                  value={movementLocationFilter}
                  onChange={(val) => setMovementLocationFilter(val)}
                  buttonClassName="bg-[#171719] py-2"
                />

                <button
                  type="button"
                  onClick={() => handleOpenAddMovement()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
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
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'bg-[#171719] text-stone-400 hover:text-white border border-[#2c2c32]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mutasi Ledger Table */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#171719] border-b border-[#28282e] text-[#8a8a92] font-semibold uppercase tracking-wider text-[10px]">
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
                <tbody className="divide-y divide-[#28282e]">
                  {filteredStockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-stone-500">
                        Tidak ada catatan mutasi stok yang sesuai kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStockMovements.map((mov) => {
                      const isPositive = mov.quantityDelta > 0;
                      return (
                        <tr
                          key={mov.id}
                          className="hover:bg-[#202024]/60 transition-colors group cursor-pointer"
                          onClick={() => handleOpenEditMovement(mov)}
                        >
                          {/* Waktu & Sumber */}
                          <td className="py-3 px-4">
                            <div className="font-mono text-white text-[11px] font-semibold">{mov.createdAt}</div>
                            <span className="text-[10px] text-[#8a8a92]">{mov.source || 'Manual'}</span>
                          </td>

                          {/* Tipe Mutasi */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block border ${
                                mov.type === 'in_purchase'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : mov.type === 'out_sale'
                                  ? 'bg-amber-500/10 text-[#f2aa4b] border-amber-500/30'
                                  : mov.type === 'waste'
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                  : 'bg-stone-500/10 text-stone-300 border-stone-500/30'
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
                            <div className="font-semibold text-white text-xs">{mov.productName}</div>
                            <div className="text-[10px] text-[#71717a] font-mono">
                              {mov.sku} • {mov.category}
                            </div>
                          </td>

                          {/* Lokasi Gudang */}
                          <td className="py-3 px-4">
                            <span className="text-stone-300 text-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#f2aa4b]" />
                              <span>{mov.location || 'Gudang Utama'}</span>
                            </span>
                          </td>

                          {/* Perubahan Stok */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isPositive
                                  ? 'text-emerald-400'
                                  : mov.type === 'waste'
                                  ? 'text-rose-400'
                                  : 'text-[#f2aa4b]'
                              }`}
                            >
                              {isPositive ? `+${mov.quantityDelta}` : mov.quantityDelta} {mov.unit || 'pcs'}
                            </span>
                            <div className="text-[10px] text-stone-500 font-mono">
                              {mov.stockBefore} → {mov.stockAfter}
                            </div>
                          </td>

                          {/* Batch & Expiry */}
                          <td className="py-3 px-4">
                            <div className="font-mono text-stone-200 text-[11px] font-semibold">
                              {mov.batchCode || '-'}
                            </div>
                            {mov.batchExpiry && (
                              <div className="text-[10px] text-amber-300/80">
                                Exp: {formatDateIndo(mov.batchExpiry)}
                              </div>
                            )}
                          </td>

                          {/* Nilai Finansial */}
                          <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-white">
                            {mov.financialAmount && mov.financialAmount > 0 ? formatRupiah(mov.financialAmount) : '-'}
                          </td>

                          {/* Catatan */}
                          <td className="py-3 px-4 max-w-[200px]">
                            <span className="text-stone-400 text-xs line-clamp-2">{mov.notes}</span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditMovement(mov)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#28282e] transition-colors"
                                title="Ubah Catatan Mutasi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetMovement(mov)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-[#28282e] transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#28282e] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-stone-300" />
                <span>
                  {catModalType === 'main'
                    ? 'Tambah Kategori Utama'
                    : 'Tambah Sub-Kategori Baru'}
                </span>
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 p-1 bg-[#171719] rounded-xl border border-[#2c2c32] text-xs">
                <button
                  type="button"
                  onClick={() => setCatModalType('main')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                    catModalType === 'main' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Kategori Utama Universal
                </button>
                <button
                  type="button"
                  onClick={() => setCatModalType('sub')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                    catModalType === 'sub' ? 'bg-white text-black' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Sub-Kategori
                </button>
              </div>

              {catModalType === 'sub' && (
                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Pilih Kategori Utama Induk</label>
                  <CustomDropdown
                    options={categoryDefinitions.map((c) => ({ value: c.name, label: c.name }))}
                    value={targetMainForSub}
                    onChange={(val) => setTargetMainForSub(val)}
                    buttonClassName="w-full bg-[#171719]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-[#8a8a92]">
                  {catModalType === 'main' ? 'Nama Kategori Utama' : 'Nama Sub-Kategori'}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={
                    catModalType === 'main'
                      ? 'Contoh: Frozen Food, Sayuran, Pakaian...'
                      : 'Contoh: Daging Ayam, Bumbu Rempah, Cup Kopi...'
                  }
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="px-3 py-1.5 rounded-full text-xs text-stone-400 hover:text-white"
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
                      addSubcategory(targetMainForSub, newCatName.trim());
                      setSelectedMainCategory(targetMainForSub);
                      setSelectedSubcategory(newCatName.trim());
                    }
                    setNewCatName('');
                    setIsCatModalOpen(false);
                  }
                }}
                disabled={!newCatName.trim()}
                className="px-4 py-1.5 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Ganti Foto Cepat Barang */}
      {quickImageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#28282e] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-stone-300" />
                  <span>Ganti Foto: {quickImageTarget.name}</span>
                </h3>
                <p className="text-[11px] text-[#8a8a92]">Upload dari perangkat atau pilih foto katalog UMKM</p>
              </div>
              <button onClick={() => setQuickImageTarget(null)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Preview */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-[#171719] border border-[#2c2c32]">
              <img
                src={quickImageTarget.imageUrl}
                alt="Current Preview"
                className="w-16 h-16 rounded-lg object-cover border border-[#2c2c32]"
              />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-white">Foto Saat Ini</span>
                <p className="text-[11px] text-[#8a8a92]">Pilih metode ganti foto di bawah ini:</p>
              </div>
            </div>

            {/* File Upload Button */}
            <label className="border-2 border-dashed border-[#2c2c32] hover:border-white/30 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer bg-[#171719] transition-colors group">
              <Upload className="w-4 h-4 text-stone-400 group-hover:text-white" />
              <span className="text-xs font-semibold text-stone-200">
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
              <span className="text-xs font-semibold text-[#8a8a92]">Atau Masukkan Tautan URL Foto:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  defaultValue={quickImageTarget.imageUrl}
                  id="direct-quick-image-url"
                  className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                  className="px-3 py-2 rounded-xl bg-white text-black text-xs font-bold shrink-0"
                >
                  Terapkan
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#28282e]">
              <button
                type="button"
                onClick={() => setQuickImageTarget(null)}
                className="px-4 py-1.5 rounded-full text-xs text-stone-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Tambah / Edit Barang & Kalkulator HPP Persen Lengkap */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-[#171719] border-b border-[#28282e] flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-stone-300" />
                <span>{editingProductId ? 'Ubah Rincian Barang' : 'Tambah Barang Baru & Kalkulator HPP'}</span>
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 overflow-y-auto">
              {/* Photo Ingestion at the VERY TOP of the Product Form */}
              <div className="p-4 rounded-xl bg-[#171719] border border-[#2c2c32] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#f2aa4b]" />
                    <span>Foto Barang Dagangan</span>
                  </label>
                  <label className="cursor-pointer text-[11px] text-[#f2aa4b] hover:text-white flex items-center gap-1 font-semibold transition-colors">
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

                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#3b3b42] shrink-0 bg-[#121214]">
                    <img
                      src={formImageUrl}
                      alt="Preview Foto Barang"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] text-[#8a8a92]">Atau tautan URL foto gambar:</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full bg-[#121214] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-stone-300 font-semibold">Nama Barang Dagangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Daging Ayam Segar / Es Kopi Susu Aren"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Main Category */}
                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Kategori Utama Universal</label>
                  <CustomDropdown
                    options={categoryDefinitions.map((c) => ({ value: c.name, label: c.name }))}
                    value={formCategory}
                    onChange={(val) => {
                      setFormCategory(val);
                      const matched = categoryDefinitions.find(
                        (c) => c.name.toLowerCase() === val.toLowerCase()
                      );
                      setFormSubcategory(matched?.subcategories[0] || '');
                    }}
                    className="w-full"
                    buttonClassName="w-full bg-[#171719] py-2"
                  />
                </div>

                {/* Sub-Category */}
                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Sub-Kategori Spesifik</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ayam & Daging, Sayur, Kopi..."
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Unit */}
                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Satuan Unit</label>
                  <input
                    type="text"
                    placeholder="pcs, ekor, kg, liter, cup, porsi, bal"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Current Stock */}
                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Jumlah Stok Sekarang</label>
                  <input
                    type="number"
                    value={formCurrentStock}
                    onChange={(e) => setFormCurrentStock(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white font-semibold font-mono focus:outline-none"
                  />
                </div>

                {/* Min Stock Alert */}
                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Batas Alarm Stok Menipis</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                {/* Storage Location */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#8a8a92] flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#f2aa4b]" />
                      <span>Lokasi Penyimpanan Gudang</span>
                    </label>
                    <span className="text-[10px] text-[#71717a]">Pilih preset atau ketik manual</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Freezer Daging #1, Chiller Depan, Rak Kering A1..."
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                    {LOCATION_PRESETS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setFormLocation(loc)}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] transition-colors shrink-0 ${
                          formLocation === loc
                            ? 'bg-white text-black font-bold'
                            : 'bg-[#171719] text-stone-300 hover:text-white border border-[#2c2c32]'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purchase Date with Full Clickability AccessibleDatePicker */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-[#8a8a92] font-semibold">
                    Tanggal Beli / Kulakan (Klik di mana saja pada tombol untuk ubah tanggal)
                  </label>
                  <AccessibleDatePicker
                    value={formPurchaseDate}
                    onChange={(val) => setFormPurchaseDate(val || new Date().toISOString().split('T')[0])}
                    presetMode="purchase"
                    label="Pilih Tanggal Beli..."
                  />
                </div>

                {/* Batches & Expiry (FEFO) */}
                <div className="space-y-2 sm:col-span-2 p-3.5 rounded-xl bg-[#171719] border border-[#2c2c32]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-[#f2aa4b]" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Batas Kedaluwarsa Terpisah per Inputan (FEFO)</h4>
                        <p className="text-[10px] text-[#8a8a92]">Tiap batch input stok baru bisa punya tanggal kadaluarsa dan sisa stok berbeda</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddBatchRow(!showAddBatchRow)}
                      className="px-2.5 py-1 rounded-lg bg-[#242428] hover:bg-[#2c2c32] text-[11px] text-stone-200 border border-[#3b3b42] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddBatchRow ? 'Batal' : 'Input Batch Baru'}</span>
                    </button>
                  </div>

                  {/* Active Batches List */}
                  {formBatches.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {formBatches.map((batch, idx) => {
                        const batchExpStatus = getExpiryStatus(batch.expiryDate);
                        return (
                          <div
                            key={batch.id || idx}
                            className="p-2.5 rounded-lg bg-[#1c1c1f] border border-[#2c2c32] flex items-center justify-between text-xs gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-stone-400 bg-[#121214] px-1.5 py-0.5 rounded border border-[#28282e]">
                                {batch.batchCode || `BATCH-${idx + 1}`}
                              </span>
                              <div>
                                <span className="font-bold text-white font-mono">{batch.quantity} {formUnit}</span>
                                <span className="text-[10px] text-[#71717a] ml-2">Masuk: {formatDateIndo(batch.receivedDate)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  batchExpStatus.status === 'expired'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : batchExpStatus.status === 'warning'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-stone-800 text-stone-300'
                                }`}
                              >
                                Exp: {batch.expiryDate ? formatDateIndo(batch.expiryDate) : 'Tidak ada'}
                              </span>

                              {formBatches.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setFormBatches(formBatches.filter((_, bIdx) => bIdx !== idx))}
                                  className="text-[#71717a] hover:text-rose-400 p-0.5"
                                  title="Hapus batch ini"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pt-1">
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
                    <div className="p-3 rounded-lg bg-[#121214] border border-[#3b3b42] space-y-2 mt-2">
                      <div className="text-[11px] font-bold text-white flex items-center gap-1">
                        <Plus className="w-3 h-3 text-[#f2aa4b]" />
                        <span>Tambah Stok Batch Input Baru:</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-[#8a8a92]">Jumlah Stok Tambahan ({formUnit})</label>
                          <input
                            type="number"
                            value={newBatchQty}
                            onChange={(e) => setNewBatchQty(e.target.value)}
                            className="w-full bg-[#1c1c1f] border border-[#2c2c32] rounded px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#8a8a92]">Kode Batch (Opsional)</label>
                          <input
                            type="text"
                            placeholder={`Contoh: ${formatBatchName(new Date().toISOString().split('T')[0])}`}
                            value={newBatchCode}
                            onChange={(e) => setNewBatchCode(e.target.value)}
                            className="w-full bg-[#1c1c1f] border border-[#2c2c32] rounded px-2 py-1 text-xs text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#8a8a92] block mb-1">Tanggal Kedaluwarsa Batch Ini:</label>
                        <AccessibleDatePicker
                          value={newBatchExpiry}
                          onChange={(val) => setNewBatchExpiry(val)}
                          presetMode="expiry"
                          label="Pilih Tanggal Exp Batch Baru..."
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const qty = Math.max(1, parseInt(newBatchQty) || 0);
                            const todayStr = new Date().toISOString().split('T')[0];
                            const newBatch: StockBatch = {
                              id: `batch-${Date.now()}`,
                              quantity: qty,
                              expiryDate: newBatchExpiry || null,
                              receivedDate: todayStr,
                              costPerUnit: computedHpp,
                              batchCode: newBatchCode.trim() || formatBatchName(todayStr),
                            };
                            setFormBatches([...formBatches, newBatch]);
                            setFormCurrentStock((parseInt(formCurrentStock) + qty).toString());
                            setShowAddBatchRow(false);
                            setNewBatchQty('10');
                            setNewBatchExpiry(null);
                            setNewBatchCode('');
                          }}
                          className="px-3 py-1 rounded bg-white text-black font-bold text-xs"
                        >
                          Simpan Batch Ini
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* HPP Calculator & Margin Slider Section */}
              <div className="p-4 rounded-xl bg-[#171719] border border-[#2c2c32] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-stone-300" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Kalkulator HPP & Penetapan Margin Keuntungan
                    </h3>
                  </div>
                  <span className="text-xs text-[#8a8a92] font-semibold">
                    HPP Bersih: <span className="text-white font-bold font-mono">{formatRupiah(computedHpp)}</span>
                  </span>
                </div>

                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#1c1c1f] rounded-xl border border-[#2c2c32] text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setHppMethod('wholesale')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      hppMethod === 'wholesale'
                        ? 'bg-white text-black font-bold shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Bagi Grosir/Dus
                  </button>
                  <button
                    type="button"
                    onClick={() => setHppMethod('recipe')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      hppMethod === 'recipe'
                        ? 'bg-white text-black font-bold shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Resep & Kemasan
                  </button>
                  <button
                    type="button"
                    onClick={() => setHppMethod('manual')}
                    className={`py-1.5 rounded-lg transition-colors ${
                      hppMethod === 'manual'
                        ? 'bg-white text-black font-bold shadow'
                        : 'text-stone-400 hover:text-white'
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
                        <label className="text-[11px] text-[#8a8a92]">Harga Beli 1 Dus / Karton (Rp)</label>
                        <input
                          type="number"
                          value={wholesaleTotalCost}
                          onChange={(e) => setWholesaleTotalCost(e.target.value)}
                          placeholder="Contoh: 180000"
                          className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#8a8a92]">Jumlah Isi Satuan per Dus ({formUnit})</label>
                        <input
                          type="number"
                          value={wholesaleUnitsCount}
                          onChange={(e) => setWholesaleUnitsCount(e.target.value)}
                          placeholder="Contoh: 12"
                          className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#8a8a92] flex items-center gap-1">
                          <Truck className="w-3 h-3 text-[#f2aa4b]" />
                          <span>Ongkir / Ekspedisi per Dus (Rp)</span>
                        </label>
                        <input
                          type="number"
                          value={wholesaleShipping}
                          onChange={(e) => setWholesaleShipping(e.target.value)}
                          placeholder="Contoh: 10000"
                          className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#8a8a92]">Estimasi Susut / Kerusakan (%)</label>
                        <input
                          type="number"
                          value={wholesaleWastePercent}
                          onChange={(e) => setWholesaleWastePercent(e.target.value)}
                          placeholder="Contoh: 2"
                          className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Transparent Formula Breakdown Card */}
                    <div className="p-3 rounded-lg bg-[#141416] border border-[#28282e] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-300 font-semibold">Rumus Transparan: (Harga Dus + Ongkir) ÷ Isi × (1 + Susut%)</span>
                        <span className="text-[#f2aa4b] font-bold font-mono">= {formatRupiah(computedHpp)}/{formUnit}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-[#8a8a92] pt-1 border-t border-[#222226]">
                        <div>Modal Dasar: <span className="text-white font-mono">{formatRupiah(Math.round((parseFloat(wholesaleTotalCost) || 0) / (parseFloat(wholesaleUnitsCount) || 1)))}</span></div>
                        <div>Beban Ongkir: <span className="text-white font-mono">+{formatRupiah(Math.round((parseFloat(wholesaleShipping) || 0) / (parseFloat(wholesaleUnitsCount) || 1)))}</span></div>
                        <div>Cadangan Susut: <span className="text-white font-mono">+{wholesaleWastePercent}%</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Resep & Kemasan (F&B / Produksi) */}
                {hppMethod === 'recipe' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#8a8a92] block">
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
                              onChange={(e) => {
                                const copy = [...recipeComponents];
                                copy[idx].name = e.target.value;
                                setRecipeComponents(copy);
                              }}
                              className="flex-1 bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                            <div className="relative w-28">
                              <span className="absolute left-2 top-1.5 text-[10px] text-[#71717a] font-mono">Rp</span>
                              <input
                                type="number"
                                value={item.cost}
                                onChange={(e) => {
                                  const copy = [...recipeComponents];
                                  copy[idx].cost = Number(e.target.value) || 0;
                                  setRecipeComponents(copy);
                                }}
                                className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded pl-7 pr-2 py-1.5 text-xs text-white text-right font-semibold font-mono"
                              />
                            </div>
                            <span className="w-12 text-right font-mono text-[10px] text-stone-400">
                              {percentage}%
                            </span>
                            {recipeComponents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setRecipeComponents(recipeComponents.filter((_, cIdx) => cIdx !== idx))}
                                className="text-[#71717a] hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
                        className="flex-1 bg-[#141416] border border-[#2c2c32] rounded px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Biaya (Rp)"
                        value={newCompCost}
                        onChange={(e) => setNewCompCost(e.target.value)}
                        className="w-28 bg-[#141416] border border-[#2c2c32] rounded px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCompName.trim() && parseFloat(newCompCost) > 0) {
                            setRecipeComponents([
                              ...recipeComponents,
                              {
                                id: `comp-${Date.now()}`,
                                name: newCompName.trim(),
                                cost: parseFloat(newCompCost) || 0,
                              },
                            ]);
                            setNewCompName('');
                            setNewCompCost('');
                          }
                        }}
                        className="px-3 py-1.5 rounded bg-[#242428] hover:bg-white hover:text-black text-stone-200 text-xs font-semibold border border-[#3b3b42] transition-colors shrink-0"
                      >
                        Tambah Komponen
                      </button>
                    </div>

                    {/* Overhead per Portion */}
                    <div className="pt-2 border-t border-[#28282e] flex items-center justify-between">
                      <span className="text-[11px] text-[#8a8a92]">Biaya Tenaga Kerja / Listrik / Overhead per Porsi:</span>
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1.5 text-[10px] text-[#71717a] font-mono">Rp</span>
                        <input
                          type="number"
                          value={recipeOverhead}
                          onChange={(e) => setRecipeOverhead(e.target.value)}
                          className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded pl-7 pr-2 py-1 text-xs text-white text-right font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Input Bebas & Catatan Supplier */}
                {hppMethod === 'manual' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[11px] text-[#8a8a92]">Nominal HPP per Satuan ({formUnit})</label>
                      <input
                        type="number"
                        value={manualHpp}
                        onChange={(e) => setManualHpp(e.target.value)}
                        placeholder="Contoh: 15000"
                        className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[#8a8a92]">Nama Supplier / Toko Kulakan</label>
                        <input
                          type="text"
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          placeholder="Contoh: Agen Pasar Induk, Toko Jaya Abadi"
                          className="w-full bg-[#1c1c1f] border border-[#2c2c32] rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#8a8a92]">Termin & Catatan Pembelian</label>
                        <input
                          type="text"
                          value={supplierNotes}
                          onChange={(e) => setSupplierNotes(e.target.value)}
                          placeholder="Contoh: Tunai diskon 2%, Tempo 7 hari"
                          className="w-full bg-[#1c1c1f] border border-[#2c2c32] rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Profit Margin Slider (%) */}
                <div className="p-3.5 rounded-xl bg-[#121214] border border-[#2c2c32] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className="w-3.5 h-3.5 text-[#f2aa4b]" />
                      <span className="text-xs font-bold text-white">
                        Slider Margin Untung (%):
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-white">
                        {profitMarginPercent}%
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          profitMarginPercent >= 35
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : profitMarginPercent >= 20
                            ? 'bg-[#f2aa4b]/20 text-[#f2aa4b]'
                            : 'bg-rose-500/20 text-rose-300'
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
                    className="w-full accent-[#f2aa4b] cursor-pointer"
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
                            ? 'bg-white text-black font-bold'
                            : 'bg-[#1c1c1f] text-stone-300 hover:text-white border border-[#2c2c32]'
                        }`}
                      >
                        +{preset}%
                      </button>
                    ))}
                  </div>

                  {/* Untung Bersih Nominal Preview */}
                  <div className="pt-2 border-t border-[#242428] flex items-center justify-between text-xs">
                    <span className="text-stone-400">Rekomendasi Laba Bersih per {formUnit}:</span>
                    <span className="font-mono font-bold text-white">
                      +{formatRupiah(Math.max(0, (parseInt(formSellingPrice) || 0) - computedHpp))}
                    </span>
                  </div>
                </div>

                {/* Final Selling Price Input */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs text-white font-semibold">Harga Jual Akhir</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-[#71717a] font-mono">Rp</span>
                    <input
                      type="number"
                      required
                      value={formSellingPrice}
                      onChange={(e) => handleSellingPriceInputChange(e.target.value)}
                      className="w-full bg-[#1c1c1f] border border-[#2c2c32] focus:border-white/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white font-bold font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-stone-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-[#171719] border-b border-[#28282e] flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f2aa4b]" />
                <span>{editingMovement ? 'Ubah Catatan Mutasi Gudang' : 'Catat Mutasi Stok Gudang (Kasir Gudang)'}</span>
              </h2>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4 overflow-y-auto">
              {/* Product Selection */}
              <div className="space-y-1">
                <label className="text-xs text-stone-300 font-semibold">Pilih Barang yang Mengalami Mutasi</label>
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
                      setMovFinancialAmount(matched.hppAmount ? matched.hppAmount.toString() : '0');
                    }
                  }}
                  className="w-full"
                  buttonClassName="w-full bg-[#171719] py-2"
                />
              </div>

              {/* Mutation Type */}
              <div className="space-y-1">
                <label className="text-xs text-stone-300 font-semibold">Tipe Mutasi Stok</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#171719] rounded-xl border border-[#2c2c32]">
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
                          ? 'bg-white text-black font-bold shadow'
                          : 'text-stone-400 hover:text-white'
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
                  <label className="text-xs text-[#8a8a92]">Jumlah Mutasi Unit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movQty}
                    onChange={(e) => setMovQty(e.target.value)}
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Tanggal Mutasi</label>
                  <AccessibleDatePicker
                    value={movDate}
                    onChange={(val) => setMovDate(val || new Date().toISOString().split('T')[0])}
                    presetMode="purchase"
                    label="Pilih Tanggal Mutasi..."
                  />
                </div>
              </div>

              {/* Batch Code & Batch Expiry (FEFO tracking) */}
              <div className="p-3.5 rounded-xl bg-[#171719] border border-[#2c2c32] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Boxes className="w-3.5 h-3.5 text-[#f2aa4b]" />
                  <span>Pelacak Batch & Masa Simpan (FEFO)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8a8a92]">Format Batch (Misal: Batch 24 Oktober 2026)</label>
                    <input
                      type="text"
                      placeholder={`Contoh: ${formatBatchName(movDate)}`}
                      value={movBatchCode}
                      onChange={(e) => setMovBatchCode(e.target.value)}
                      className="w-full bg-[#1c1c1f] border border-[#2c2c32] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#8a8a92]">Batas Kadaluarsa Batch (Opsional)</label>
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
                  <label className="text-xs text-[#8a8a92]">Nilai Finansial (Opsional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-[#71717a] font-mono">Rp</span>
                    <input
                      type="number"
                      value={movFinancialAmount}
                      onChange={(e) => setMovFinancialAmount(e.target.value)}
                      className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Lokasi Rak / Penyimpanan Gudang</label>
                  <input
                    type="text"
                    value={movLocation}
                    onChange={(e) => setMovLocation(e.target.value)}
                    placeholder="Contoh: Freezer Daging #1, Chiller Depan"
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Source & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Sumber / Saluran Input</label>
                  <input
                    type="text"
                    value={movSource}
                    onChange={(e) => setMovSource(e.target.value)}
                    placeholder="Contoh: Input Manual Gudang, Kasir POS, Voice Mic..."
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#8a8a92]">Catatan / Alasan Mutasi</label>
                  <input
                    type="text"
                    value={movNotes}
                    onChange={(e) => setMovNotes(e.target.value)}
                    placeholder="Contoh: Beli di pasar induk, Basi saat mati lampu..."
                    className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#28282e]">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-stone-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95"
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
