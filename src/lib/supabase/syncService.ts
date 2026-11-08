import { supabase, isSupabaseConfigured } from './client';
import {
  Product,
  Transaction,
  StockMovement,
  StoreProfile,
  CategoryDefinition,
} from '@/types';

/**
 * Maps database row to Product
 */
export function mapRowToProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku || '',
    name: row.name,
    category: row.category || 'Produk Siap Jual',
    subcategory: row.subcategory || undefined,
    location: row.location || undefined,
    imageUrl: row.image_url || '',
    currentStock: Number(row.current_stock) || 0,
    minStockAlert: Number(row.min_stock_alert) || 5,
    unit: row.unit || 'pcs',
    purchaseDate: row.purchase_date || undefined,
    expiryDate: row.expiry_date || null,
    batches: Array.isArray(row.batches) ? row.batches : [],
    hppAmount: Number(row.hpp_amount) || 0,
    hppMethod: row.hpp_method || 'wholesale',
    hppBreakdown: Array.isArray(row.hpp_breakdown) ? row.hpp_breakdown : [],
    sellingPrice: Number(row.selling_price) || 0,
    lastSoldAt: row.last_sold_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps Product to database row
 */
export function mapProductToRow(userId: string, p: Product): any {
  return {
    id: p.id,
    user_id: userId,
    sku: p.sku || '',
    name: p.name,
    category: p.category || 'Produk Siap Jual',
    subcategory: p.subcategory || null,
    location: p.location || null,
    image_url: p.imageUrl || '',
    current_stock: p.currentStock,
    min_stock_alert: p.minStockAlert,
    unit: p.unit || 'pcs',
    purchase_date: p.purchaseDate || null,
    expiry_date: p.expiryDate || null,
    batches: p.batches || [],
    hpp_amount: p.hppAmount,
    hpp_method: p.hppMethod || 'wholesale',
    hpp_breakdown: p.hppBreakdown || [],
    selling_price: p.sellingPrice,
    last_sold_at: p.lastSoldAt || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Maps database row to Transaction
 */
export function mapRowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount) || 0,
    category: row.category || 'Penjualan',
    description: row.description || '',
    date: row.date,
    inputMethod: row.input_method || 'manual',
    account: row.account || undefined,
    receiptUrl: row.receipt_url || undefined,
    relatedProductId: row.related_product_id || undefined,
    relatedQuantity: row.related_quantity ? Number(row.related_quantity) : undefined,
    relatedMovementId: row.related_movement_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Maps Transaction to database row
 */
export function mapTransactionToRow(userId: string, t: Transaction): any {
  return {
    id: t.id,
    user_id: userId,
    type: t.type,
    amount: t.amount,
    category: t.category,
    description: t.description,
    date: t.date,
    input_method: t.inputMethod || 'manual',
    account: t.account || null,
    receipt_url: t.receiptUrl || null,
    related_product_id: t.relatedProductId || null,
    related_quantity: t.relatedQuantity || null,
    related_movement_id: t.relatedMovementId || null,
  };
}

/**
 * Maps database row to StockMovement
 */
export function mapRowToStockMovement(row: any): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku || undefined,
    category: row.category || undefined,
    location: row.location || undefined,
    type: row.type,
    quantityDelta: Number(row.quantity_delta) || 0,
    unit: row.unit || 'pcs',
    stockBefore: Number(row.stock_before) || 0,
    stockAfter: Number(row.stock_after) || 0,
    batchCode: row.batch_code || undefined,
    batchExpiry: row.batch_expiry || null,
    financialAmount: row.financial_amount ? Number(row.financial_amount) : undefined,
    relatedTransactionId: row.related_transaction_id || undefined,
    source: row.source || 'Manual',
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Maps StockMovement to database row
 */
export function mapStockMovementToRow(userId: string, m: StockMovement): any {
  return {
    id: m.id,
    user_id: userId,
    product_id: m.productId,
    product_name: m.productName,
    sku: m.sku || null,
    category: m.category || null,
    location: m.location || null,
    type: m.type,
    quantity_delta: m.quantityDelta,
    unit: m.unit || 'pcs',
    stock_before: m.stockBefore,
    stock_after: m.stockAfter,
    batch_code: m.batchCode || null,
    batch_expiry: m.batchExpiry || null,
    financial_amount: m.financialAmount || null,
    related_transaction_id: m.relatedTransactionId || null,
    source: m.source || 'Manual',
    notes: m.notes || '',
  };
}

/**
 * Fetch all cloud store data for the active user
 */
export async function fetchCloudStoreData(userId: string) {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const [pRes, tRes, mRes, cRes, profRes] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('stock_movements').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('category_definitions').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    ]);

    const products: Product[] = (pRes.data || []).map(mapRowToProduct);
    const transactions: Transaction[] = (tRes.data || []).map(mapRowToTransaction);
    const stockMovements: StockMovement[] = (mRes.data || []).map(mapRowToStockMovement);
    const categoryDefinitions: CategoryDefinition[] = (cRes.data || []).map((row) => ({
      id: row.id,
      name: row.name,
      subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
    }));

    let profile: StoreProfile | null = null;
    if (profRes.data) {
      profile = {
        storeName: profRes.data.store_name || '',
        businessCategory: profRes.data.business_category || '',
        logoUrl: profRes.data.logo_url || profRes.data.avatar_url || '',
        ownerName: profRes.data.owner_name || '',
        phone: profRes.data.phone || '',
        address: profRes.data.address || '',
        bankAccount: profRes.data.bank_account || '',
        monthlyTarget: Number(profRes.data.monthly_target) || 0,
      };
    }

    return {
      products,
      transactions,
      stockMovements,
      categoryDefinitions,
      profile,
    };
  } catch (err) {
    console.warn('[Supabase] Failed to fetch cloud data, falling back to local storage:', err);
    return null;
  }
}

/**
 * Cloud mutation helpers (Fire-and-forget or background with console warning)
 */
export async function syncUpsertProduct(userId: string, product: Product) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('products').upsert(mapProductToRow(userId, product));
  } catch (err) {
    console.warn('[Supabase] Sync product error:', err);
  }
}

export async function syncDeleteProduct(userId: string, productId: string) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('products').delete().eq('id', productId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete product error:', err);
  }
}

export async function syncInsertTransaction(userId: string, transaction: Transaction) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('transactions').upsert(mapTransactionToRow(userId, transaction));
  } catch (err) {
    console.warn('[Supabase] Sync transaction error:', err);
  }
}

export async function syncDeleteTransaction(userId: string, transactionId: string) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('transactions').delete().eq('id', transactionId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete transaction error:', err);
  }
}

export async function syncInsertStockMovement(userId: string, movement: StockMovement) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('stock_movements').upsert(mapStockMovementToRow(userId, movement));
  } catch (err) {
    console.warn('[Supabase] Sync stock movement error:', err);
  }
}

export async function syncDeleteStockMovement(userId: string, movementId: string) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('stock_movements').delete().eq('id', movementId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete stock movement error:', err);
  }
}

export async function syncUpsertProfile(userId: string, profile: StoreProfile) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      store_name: profile.storeName,
      business_category: profile.businessCategory,
      owner_name: profile.ownerName,
      logo_url: profile.logoUrl || null,
      avatar_url: profile.logoUrl || null,
      phone: profile.phone,
      address: profile.address,
      bank_account: profile.bankAccount,
      monthly_target: profile.monthlyTarget,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] Sync profile error:', err);
  }
}

export async function syncUpsertCategory(userId: string, cat: CategoryDefinition) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('category_definitions').upsert({
      id: cat.id,
      user_id: userId,
      name: cat.name,
      subcategories: cat.subcategories || [],
    });
  } catch (err) {
    console.warn('[Supabase] Sync category error:', err);
  }
}

export async function syncDeleteCategory(userId: string, catId: string) {
  if (!isSupabaseConfigured || !userId) return;
  try {
    await supabase.from('category_definitions').delete().eq('id', catId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete category error:', err);
  }
}
