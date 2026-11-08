import { Product, Transaction, StoreProfile, StockMovement, CategoryDefinition } from '@/types';

export const INITIAL_PROFILE: StoreProfile = {
  storeName: 'Toko Baru',
  handle: '',
  bio: '',
  businessCategory: '',
  logoUrl: '',
  bannerUrl: '',
  operatingHours: 'Setiap Hari, 08.00 - 21.00',
  province: '',
  city: '',
  address: '',
  latitude: null,
  longitude: null,
  phone: '',
  monthlyTarget: 0,
  ownerName: '',
  bankAccount: '',
  showPublicCatalog: true,
  showWhatsappPublic: true,
  showMapPublic: true,
};

export const INITIAL_CATEGORY_DEFINITIONS: CategoryDefinition[] = [];

export const INITIAL_CATEGORIES: string[] = ['Semua'];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
