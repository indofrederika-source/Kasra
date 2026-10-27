export type ProductUnit = 'pcs' | 'cup' | 'porsi' | 'liter' | 'kg' | 'gram' | 'box' | 'bungkus' | 'lembar' | 'paket' | 'ekor' | 'bal' | 'kotak';

export type HppMethod = 'wholesale' | 'recipe' | 'manual';

export interface HppComponent {
  id: string;
  name: string;
  cost: number;
}

export interface CategoryDefinition {
  id: string;
  name: string; // Kategori Utama (e.g. 'Bahan Baku', 'Produk Siap Jual', 'Kemasan & Cup', 'Operasional')
  subcategories: string[]; // Sub-kategori (e.g. ['Ayam & Daging', 'Sayur & Buah', 'Susu & Dairy'])
}

export interface StockBatch {
  id: string;
  quantity: number;
  expiryDate?: string | null;
  receivedDate: string; // YYYY-MM-DD
  costPerUnit?: number;
  batchCode?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string; // Kategori Utama
  subcategory?: string; // Sub-kategori
  location?: string; // Lokasi penyimpanan gudang (misal: 'Freezer Daging #1', 'Chiller Depan', 'Rak A-02')
  imageUrl: string;
  currentStock: number;
  minStockAlert: number;
  unit: ProductUnit | string;
  purchaseDate: string; // YYYY-MM-DD
  expiryDate?: string | null; // YYYY-MM-DD (earliest expiring batch)
  batches?: StockBatch[]; // Pelacakan batch kadaluarsa berbeda per inputan
  hppAmount: number;
  hppMethod: HppMethod;
  hppBreakdown?: HppComponent[];
  sellingPrice: number;
  lastSoldAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense';
export type InputMethod = 'manual' | 'mic' | 'photo';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  inputMethod: InputMethod;
  receiptUrl?: string;
  relatedProductId?: string;
  relatedQuantity?: number;
  createdAt: string;
}

export type StockMovementType = 'in_purchase' | 'out_sale' | 'adjustment' | 'waste';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  category?: string;
  location?: string;
  type: StockMovementType;
  quantityDelta: number;
  unit?: string;
  stockBefore: number;
  stockAfter: number;
  batchCode?: string; // e.g. "Batch 24 Oktober 2026"
  batchExpiry?: string | null;
  financialAmount?: number;
  source?: string; // "Voice Mic", "Kasir POS", "Input Manual Gudang", etc.
  notes: string;
  createdAt: string;
}

export interface StoreProfile {
  storeName: string;
  businessCategory: string;
  logoUrl: string;
  address: string;
  phone: string;
  monthlyTarget: number;
  ownerName: string;
  bankAccount: string;
}

export interface CashChangeDraft {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
}

export interface StockChangeDraft {
  productId?: string;
  productName: string;
  category: string;
  location?: string;
  unit: string;
  quantityDelta: number; // positive for addition, negative for deduction
  pricePerUnit?: number;
  expiryDate?: string;
  isNewProduct?: boolean;
  insufficientStockWarning?: {
    currentStock: number;
    requestedQty: number;
    shortage: number;
  };
}

export interface CategoryChangeDraft {
  mainCategory: string;
  subcategory?: string;
  action: 'add_main' | 'add_sub';
  description: string;
}

export interface ConfirmationDraft {
  id: string;
  source: 'mic_omni' | 'mic_storage' | 'photo_receipt' | 'photo_product';
  title: string;
  explanation: string;
  cashChanges: CashChangeDraft[];
  stockChanges: StockChangeDraft[];
  categoryChanges?: CategoryChangeDraft[];
  originalInput: string;
  timestamp: string;
}

export type TabType = 'dashboard' | 'cash' | 'storage' | 'analytics' | 'promo' | 'settings';
