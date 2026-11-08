export interface BusinessCategoryOption {
  value: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const BUSINESS_CATEGORY_PRESETS: BusinessCategoryOption[] = [
  {
    value: 'Kafe & Kopi',
    label: 'Kafe & Kopi',
    shortLabel: 'Kafe & Kopi',
    description: 'Coffee shop, roastery, kedai teh & minuman racikan',
  },
  {
    value: 'Kuliner & Rumah Makan',
    label: 'Kuliner & Rumah Makan',
    shortLabel: 'Kuliner',
    description: 'Restoran, warung makan, katering, frozen food & lauk',
  },
  {
    value: 'Roti, Kue & Dessert',
    label: 'Roti, Kue & Dessert',
    shortLabel: 'Roti & Kue',
    description: 'Bakery, pastry, kue kering, hampers & hidangan manis',
  },
  {
    value: 'Minuman Segar & Kekinian',
    label: 'Minuman Segar & Kekinian',
    shortLabel: 'Minuman',
    description: 'Jus buah, boba, susu murni, jamu modern & herbal',
  },
  {
    value: 'Fashion & Pakaian',
    label: 'Fashion & Pakaian',
    shortLabel: 'Fashion',
    description: 'Distro, butik, hijab, sepatu, tas & tekstil lokal',
  },
  {
    value: 'Toko Kelontong & Sembako',
    label: 'Toko Kelontong & Sembako',
    shortLabel: 'Kelontong',
    description: 'Minimarket lokal, agen sembako, kebutuhan harian rumah',
  },
  {
    value: 'Kerajinan & Kreatif',
    label: 'Kerajinan & Kreatif',
    shortLabel: 'Kerajinan',
    description: 'Kriya tangan, keramik, dekorasi rumah, souvenir & seni',
  },
  {
    value: 'Kecantikan & Perawatan',
    label: 'Kecantikan & Perawatan',
    shortLabel: 'Kecantikan',
    description: 'Skincare lokal, parfum, kosmetik, salon & barbershop',
  },
  {
    value: 'Pertanian, Sayur & Buah',
    label: 'Pertanian, Sayur & Buah',
    shortLabel: 'Segar & Tani',
    description: 'Toko buah, hidroponik, hasil bumi, daging & ikan segar',
  },
  {
    value: 'Petshop & Kebutuhan Hewan',
    label: 'Petshop & Kebutuhan Hewan',
    shortLabel: 'Petshop',
    description: 'Pakan hewan, aksesoris peliharaan & grooming',
  },
  {
    value: 'Elektronik & Aksesoris',
    label: 'Elektronik & Aksesoris',
    shortLabel: 'Elektronik',
    description: 'Konter gadget, aksesoris HP, komputer & perlengkapan listrik',
  },
  {
    value: 'Jasa, Bengkel & Layanan',
    label: 'Jasa, Bengkel & Layanan',
    shortLabel: 'Jasa & Servis',
    description: 'Laundry, percetakan, bengkel, servis & studio kreatif',
  },
];

export interface CityRegionPreset {
  city: string;
  province: string;
  lat: number;
  lng: number;
}

export const INDONESIA_CITY_PRESETS: CityRegionPreset[] = [
  { city: 'Jakarta Selatan', province: 'DKI Jakarta', lat: -6.2615, lng: 106.8106 },
  { city: 'Jakarta Pusat', province: 'DKI Jakarta', lat: -6.1805, lng: 106.8284 },
  { city: 'Jakarta Barat', province: 'DKI Jakarta', lat: -6.1674, lng: 106.7637 },
  { city: 'Jakarta Timur', province: 'DKI Jakarta', lat: -6.225, lng: 106.9004 },
  { city: 'Jakarta Utara', province: 'DKI Jakarta', lat: -6.1384, lng: 106.8639 },
  { city: 'Bandung', province: 'Jawa Barat', lat: -6.9175, lng: 107.6191 },
  { city: 'Bekasi', province: 'Jawa Barat', lat: -6.2383, lng: 106.9756 },
  { city: 'Bogor', province: 'Jawa Barat', lat: -6.5971, lng: 106.806 },
  { city: 'Depok', province: 'Jawa Barat', lat: -6.4025, lng: 106.7942 },
  { city: 'Cirebon', province: 'Jawa Barat', lat: -6.732, lng: 108.5523 },
  { city: 'Tangerang', province: 'Banten', lat: -6.1783, lng: 106.6319 },
  { city: 'Tangerang Selatan', province: 'Banten', lat: -6.2886, lng: 106.7179 },
  { city: 'Semarang', province: 'Jawa Tengah', lat: -6.9667, lng: 110.4167 },
  { city: 'Surakarta (Solo)', province: 'Jawa Tengah', lat: -7.5755, lng: 110.8243 },
  { city: 'Yogyakarta', province: 'DI Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { city: 'Sleman', province: 'DI Yogyakarta', lat: -7.7156, lng: 110.3556 },
  { city: 'Surabaya', province: 'Jawa Timur', lat: -7.2575, lng: 112.7521 },
  { city: 'Malang', province: 'Jawa Timur', lat: -7.9666, lng: 112.6326 },
  { city: 'Sidoarjo', province: 'Jawa Timur', lat: -7.4478, lng: 112.7183 },
  { city: 'Denpasar', province: 'Bali', lat: -8.6705, lng: 115.2126 },
  { city: 'Badung (Canggu / Kuta)', province: 'Bali', lat: -8.6478, lng: 115.1385 },
  { city: 'Medan', province: 'Sumatera Utara', lat: 3.5952, lng: 98.6722 },
  { city: 'Palembang', province: 'Sumatera Selatan', lat: -2.9761, lng: 104.7754 },
  { city: 'Padang', province: 'Sumatera Barat', lat: -0.9471, lng: 100.4172 },
  { city: 'Pekanbaru', province: 'Riau', lat: 0.5071, lng: 101.4478 },
  { city: 'Bandar Lampung', province: 'Lampung', lat: -5.3971, lng: 105.2668 },
  { city: 'Batam', province: 'Kepulauan Riau', lat: 1.0456, lng: 104.0305 },
  { city: 'Balikpapan', province: 'Kalimantan Timur', lat: -1.2379, lng: 116.8529 },
  { city: 'Samarinda', province: 'Kalimantan Timur', lat: -0.5022, lng: 117.1536 },
  { city: 'Banjarmasin', province: 'Kalimantan Selatan', lat: -3.3194, lng: 114.5908 },
  { city: 'Pontianak', province: 'Kalimantan Barat', lat: -0.0263, lng: 109.3425 },
  { city: 'Makassar', province: 'Sulawesi Selatan', lat: -5.1477, lng: 119.4327 },
  { city: 'Manado', province: 'Sulawesi Utara', lat: 1.4748, lng: 124.8421 },
  { city: 'Mataram', province: 'Nusa Tenggara Barat', lat: -8.5833, lng: 116.1167 },
];

export const STORE_BANNER_PRESETS = [
  {
    label: 'Kedai Kopi & Kayu Hangat',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Dapur Kuliner & Rempah',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Butik & Tekstil Minimalis',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Bakery & Artisan Pastry',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
  },
  {
    label: 'Studio Kerajinan & Tanaman',
    url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=1200&auto=format&fit=crop&q=80',
  },
];

export function isPresetBusinessCategory(cat?: string): boolean {
  if (!cat) return false;
  return BUSINESS_CATEGORY_PRESETS.some(
    (p) => p.value.toLowerCase() === cat.trim().toLowerCase()
  );
}
