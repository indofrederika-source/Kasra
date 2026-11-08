import { supabase, isSupabaseConfigured } from './client';
import {
  Product,
  Transaction,
  StockMovement,
  StoreProfile,
  CategoryDefinition,
  PublicStoreProfile,
  CommunityPost,
} from '@/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id?: string): boolean {
  return Boolean(id && UUID_REGEX.test(id));
}

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
    isPublicShowcase: Boolean(row.is_public_showcase),
    publicDescription: row.public_description || undefined,
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
    is_public_showcase: Boolean(p.isPublicShowcase),
    public_description: p.publicDescription || null,
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
  if (!isSupabaseConfigured || !isValidUuid(userId)) return null;

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
        handle: profRes.data.handle || undefined,
        bio: profRes.data.bio || '',
        businessCategory: profRes.data.business_category || '',
        logoUrl: profRes.data.logo_url || profRes.data.avatar_url || '',
        bannerUrl: profRes.data.banner_url || '',
        operatingHours: profRes.data.operating_hours || '',
        province: profRes.data.province || '',
        city: profRes.data.city || '',
        ownerName: profRes.data.owner_name || '',
        phone: profRes.data.phone || '',
        address: profRes.data.address || '',
        latitude: profRes.data.latitude !== null && profRes.data.latitude !== undefined ? Number(profRes.data.latitude) : null,
        longitude: profRes.data.longitude !== null && profRes.data.longitude !== undefined ? Number(profRes.data.longitude) : null,
        bankAccount: profRes.data.bank_account || '',
        monthlyTarget: Number(profRes.data.monthly_target) || 0,
        showPublicCatalog: profRes.data.show_public_catalog ?? true,
        showWhatsappPublic: profRes.data.show_whatsapp_public ?? true,
        showMapPublic: profRes.data.show_map_public ?? true,
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
 * Cloud mutation helpers
 */
export async function syncUpsertProduct(userId: string, product: Product) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    const row = mapProductToRow(userId, product);
    const { error } = await supabase.from('products').upsert(row);
    if (error && error.message?.includes('is_public_showcase')) {
      // Graceful fallback if user hasn't run latest column migration yet
      const { is_public_showcase, public_description, ...legacyRow } = row;
      await supabase.from('products').upsert(legacyRow);
    }
  } catch (err) {
    console.warn('[Supabase] Sync product error:', err);
  }
}

export async function syncDeleteProduct(userId: string, productId: string) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    await supabase.from('products').delete().eq('id', productId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete product error:', err);
  }
}

export async function syncInsertTransaction(userId: string, transaction: Transaction) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    await supabase.from('transactions').upsert(mapTransactionToRow(userId, transaction));
  } catch (err) {
    console.warn('[Supabase] Sync transaction error:', err);
  }
}

export async function syncDeleteTransaction(userId: string, transactionId: string) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    await supabase.from('transactions').delete().eq('id', transactionId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete transaction error:', err);
  }
}

export async function syncInsertStockMovement(userId: string, movement: StockMovement) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    await supabase.from('stock_movements').upsert(mapStockMovementToRow(userId, movement));
  } catch (err) {
    console.warn('[Supabase] Sync stock movement error:', err);
  }
}

export async function syncDeleteStockMovement(userId: string, movementId: string) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    await supabase.from('stock_movements').delete().eq('id', movementId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete stock movement error:', err);
  }
}

export async function syncUpsertProfile(userId: string, profile: StoreProfile) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    const fullPayload = {
      id: userId,
      store_name: profile.storeName,
      handle: profile.handle || null,
      bio: profile.bio || null,
      business_category: profile.businessCategory,
      owner_name: profile.ownerName,
      logo_url: profile.logoUrl || null,
      banner_url: profile.bannerUrl || null,
      avatar_url: profile.logoUrl || null,
      operating_hours: profile.operatingHours || null,
      province: profile.province || null,
      city: profile.city || null,
      phone: profile.phone,
      address: profile.address,
      latitude: profile.latitude ?? null,
      longitude: profile.longitude ?? null,
      bank_account: profile.bankAccount,
      monthly_target: profile.monthlyTarget,
      show_public_catalog: profile.showPublicCatalog ?? true,
      show_whatsapp_public: profile.showWhatsappPublic ?? true,
      show_map_public: profile.showMapPublic ?? true,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').upsert(fullPayload);
    if (error) {
      // Fallback to base columns if community migration columns aren't added yet
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
    }
  } catch (err) {
    console.warn('[Supabase] Sync profile error:', err);
  }
}

export async function syncUpsertCategory(userId: string, cat: CategoryDefinition) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
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
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    await supabase.from('category_definitions').delete().eq('id', catId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete category error:', err);
  }
}

/**
 * Community & Public Storefront Sync Helpers
 */
export function mapRowToPublicStoreProfile(row: any): PublicStoreProfile {
  return {
    userId: row.user_id,
    storeName: row.store_name || 'Toko UMKM',
    handle: row.handle || 'tokokasra',
    ownerName: row.owner_name || '',
    businessCategory: row.business_category || '',
    bio: row.bio || '',
    logoUrl: row.logo_url || '',
    bannerUrl: row.banner_url || '',
    operatingHours: row.operating_hours || '',
    province: row.province || '',
    city: row.city || '',
    address: row.address || '',
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
    phone: row.phone || '',
    showPublicCatalog: row.show_public_catalog ?? true,
    showWhatsappPublic: row.show_whatsapp_public ?? true,
    showMapPublic: row.show_map_public ?? true,
    showcaseProducts: Array.isArray(row.showcase_products) ? row.showcase_products : [],
    joinedAt: row.joined_at || undefined,
  };
}

export function mapRowToCommunityPost(row: any): CommunityPost {
  return {
    id: row.id,
    userId: row.user_id,
    storeName: row.store_name || 'Toko UMKM',
    storeHandle: row.store_handle || 'tokokasra',
    storeLogoUrl: row.store_logo_url || '',
    businessCategory: row.business_category || '',
    city: row.city || '',
    province: row.province || '',
    postType: row.post_type || 'general',
    caption: row.caption || '',
    imageUrls: Array.isArray(row.image_urls) ? row.image_urls : [],
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    taggedProducts: Array.isArray(row.tagged_products) ? row.tagged_products : [],
    likedByUserIds: Array.isArray(row.liked_by_user_ids) ? row.liked_by_user_ids : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function fetchCloudCommunityData() {
  if (!isSupabaseConfigured) return null;
  try {
    const [profilesRes, postsRes, followsRes] = await Promise.all([
      supabase.from('public_profiles').select('*').order('updated_at', { ascending: false }),
      supabase.from('community_posts').select('*').order('created_at', { ascending: false }),
      supabase.from('community_follows').select('*'),
    ]);

    if (profilesRes.error && postsRes.error) {
      return null;
    }

    return {
      publicProfiles: (profilesRes.data || []).map(mapRowToPublicStoreProfile),
      posts: (postsRes.data || []).map(mapRowToCommunityPost),
      follows: (followsRes.data || []).map((r: any) => ({
        followerId: r.follower_id as string,
        followingId: r.following_id as string,
      })),
    };
  } catch {
    return null;
  }
}

export async function syncUpsertPublicStoreProfile(pub: PublicStoreProfile) {
  if (!isSupabaseConfigured || !isValidUuid(pub.userId)) return;
  try {
    await supabase.from('public_profiles').upsert({
      user_id: pub.userId,
      store_name: pub.storeName,
      handle: pub.handle,
      owner_name: pub.ownerName || '',
      business_category: pub.businessCategory || '',
      bio: pub.bio || '',
      logo_url: pub.logoUrl || '',
      banner_url: pub.bannerUrl || '',
      operating_hours: pub.operatingHours || '',
      province: pub.province || '',
      city: pub.city || '',
      address: pub.showMapPublic ? pub.address || '' : '',
      latitude: pub.showMapPublic ? pub.latitude ?? null : null,
      longitude: pub.showMapPublic ? pub.longitude ?? null : null,
      phone: pub.showWhatsappPublic ? pub.phone || '' : '',
      show_public_catalog: pub.showPublicCatalog,
      show_whatsapp_public: pub.showWhatsappPublic,
      show_map_public: pub.showMapPublic,
      showcase_products: pub.showPublicCatalog ? pub.showcaseProducts : [],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] Sync public storefront error:', err);
  }
}

export async function syncUpsertCommunityPost(post: CommunityPost) {
  if (!isSupabaseConfigured || !isValidUuid(post.userId)) return;
  try {
    await supabase.from('community_posts').upsert({
      id: post.id,
      user_id: post.userId,
      store_name: post.storeName,
      store_handle: post.storeHandle,
      store_logo_url: post.storeLogoUrl || '',
      business_category: post.businessCategory || '',
      city: post.city || '',
      province: post.province || '',
      post_type: post.postType || 'general',
      caption: post.caption,
      image_urls: post.imageUrls || [],
      hashtags: post.hashtags || [],
      tagged_products: post.taggedProducts || [],
      liked_by_user_ids: post.likedByUserIds || [],
      comments: post.comments || [],
      created_at: post.createdAt,
    });
  } catch (err) {
    console.warn('[Supabase] Sync community post error:', err);
  }
}

export async function syncDeleteCommunityPost(userId: string, postId: string) {
  if (!isSupabaseConfigured || !isValidUuid(userId)) return;
  try {
    await supabase.from('community_posts').delete().eq('id', postId).eq('user_id', userId);
  } catch (err) {
    console.warn('[Supabase] Delete community post error:', err);
  }
}

export async function syncFollowAction(
  followerId: string,
  followingId: string,
  isFollow: boolean
) {
  if (!isSupabaseConfigured || !isValidUuid(followerId)) return;
  try {
    if (isFollow) {
      await supabase.from('community_follows').upsert({
        follower_id: followerId,
        following_id: followingId,
      });
    } else {
      await supabase
        .from('community_follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);
    }
  } catch (err) {
    console.warn('[Supabase] Sync follow error:', err);
  }
}
