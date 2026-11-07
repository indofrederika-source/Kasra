import { Product, Transaction, StoreProfile, StockMovement, CategoryDefinition } from '@/types';

export const INITIAL_PROFILE: StoreProfile = {
  storeName: 'Toko Baru',
  businessCategory: '',
  logoUrl: '',
  address: '',
  phone: '',
  monthlyTarget: 0,
  ownerName: '',
  bankAccount: '',
};

export const INITIAL_CATEGORY_DEFINITIONS: CategoryDefinition[] = [];

export const INITIAL_CATEGORIES: string[] = ['Semua'];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
