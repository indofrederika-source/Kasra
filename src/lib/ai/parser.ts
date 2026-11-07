import {
  ConfirmationDraft,
  Product,
  CategoryDefinition,
  CategoryChangeDraft,
  StockChangeDraft,
} from '@/types';

/**
 * KASRA Smart On-Device Indonesian UMKM NLP, Autocorrect & Voice Engine
 * Understands natural Indonesian cashier & warehouse speech, regional slang,
 * customer-vs-owner perspective ("ada yang beli" vs "gua beli / kulakan"),
 * spoken numbers, multi-clause sentences, and speech-to-text phonetic glitches.
 */

export interface LiveIntentFeedback {
  cleanedText: string;
  detectedIntent: 'restock' | 'sale' | 'category' | 'expense' | 'income' | 'loss' | 'unknown';
  intentLabel: string;
  intentColor: string;
  matchedEntity?: string;
  suggestedAction?: string;
}

// -------------------------------------------------------------
// Helper: General Indonesian Spoken Word-to-Number Parser (1..999)
// -------------------------------------------------------------
const BASE_WORD_NUMS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  enem: 6,
  tujuh: 7,
  tuju: 7,
  delapan: 8,
  lapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
};

export function parseSpokenNumberPhrase(phrase: string): number | null {
  const tokens = phrase
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === 'seratus') {
      total += 100;
      matchedAny = true;
    } else if (t === 'seribu' || t === 'serebu') {
      total += 1000;
      matchedAny = true;
    } else if (t === 'sejuta') {
      total += 1000000;
      matchedAny = true;
    } else if (t === 'sepuluh') {
      current += 10;
      matchedAny = true;
    } else if (t === 'sebelas') {
      current += 11;
      matchedAny = true;
    } else if (t === 'belas' && current > 0 && current < 10) {
      current += 10;
      matchedAny = true;
    } else if (t === 'puluh') {
      current = (current || 1) * 10;
      matchedAny = true;
    } else if (t === 'ratus') {
      total += (current || 1) * 100;
      current = 0;
      matchedAny = true;
    } else if (BASE_WORD_NUMS[t] !== undefined) {
      current += BASE_WORD_NUMS[t];
      matchedAny = true;
    } else {
      break;
    }
  }

  const result = total + current;
  return matchedAny && result > 0 ? result : null;
}

// -------------------------------------------------------------
// Helper: Detect Customer-Subject Sale vs Store-Owner Restock
// -------------------------------------------------------------
const CUSTOMER_SALE_PATTERNS: RegExp[] = [
  // Customer as subject + buying/ordering/taking verb (even if STT drops "yang" -> "tadi ada beli")
  /\b(?:ada\s+yang|ada\s+yg|ada\s+orang|ada\s+pembeli|ada\s+pelanggan|ada\s+customer|ada\s+konsumen|ada\s+tamu|ada)\s+(?:tadi\s+|barusan\s+|baru\s+|lagi\s+|mau\s+)*(?:beli|membeli|ngebeli|borong|ngeborong|ambil|ngambil|pesan|pesen|memesan|order|ngorder|checkout|bungkus|ngebungkus|cari|minta|tumbas|bayar)\b/i,
  /\b(?:orang|pembeli|pelanggan|customer|konsumen|kastemer|tamu|klien|client|bapak|bapak2|ibu|ibu2|mas|masnya|mbak|mbaknya|kakak|kak|adek|adik|abang|bang|teteh|teh|om|tante|bocil|anak|tetangga|temen|teman|dia|mereka|seseorang|pengunjung)\s+(?:nya\s+|itu\s+|tadi\s+|barusan\s+|baru\s+|lagi\s+|mau\s+|udah\s+|sudah\s+)*(?:beli|membeli|ngebeli|borong|ngeborong|ambil|ngambil|pesan|pesen|memesan|order|ngorder|checkout|bungkus|ngebungkus|tumbas)\b/i,
  // Direct sale & passive purchase verbs (dibeli = bought by customer!)
  /\b(?:laku|lakunya|ngelakuin|kejual|terjual|jual|menjual|ngejual|penjualan|dibeli|kebeli|terbeli|diborong|dipesan|dipesen|diorder|diambil\s+pembeli|sold|sold\s+out|closing|omset|omzet|kasir\s+masuk)\b/i,
  // Incoming order nouns
  /\b(?:ada\s+(?:orderan|pesanan|transaksi\s+masuk|pembelian\s+masuk)|orderan\s+masuk|pesanan\s+masuk)\b/i,
  // Explicit causal hints of a sale ("leci keluar 10 dapat duit", "stok berkurang ... uang masuk")
  /\b(?:stok(?:nya)?\s+(?:ngurang|berkurang|kepotong).*(?:uang|duit|kas)\s+(?:masuk|nambah|bertambah))\b/i,
  /\b(?:(?:uang|duit|kas)\s+(?:masuk|nambah|bertambah).*(?:stok(?:nya)?\s+(?:ngurang|berkurang|kepotong)))\b/i,
];

const EXPLICIT_RESTOCK_PATTERNS: RegExp[] = [
  // Dedicated wholesale / restock vocabulary
  /\b(?:kulakan|kulak|ngulak|nyetok|ngestok|restok|restock|ristok|pasok|pasokan|suplai|supply|isi\s+stok|isi\s+gudang|stok\s+masuk|barang\s+masuk|barang\s+datang|stok\s+datang|drop\s+barang)\b/i,
  // Adding stock explicitly
  /\b(?:tambah|tambahkan|tambahin|nambah|nambahin|masuk|masukkan|masukin)\s+(?:stok|barang|bahan|persediaan|inventori|gudang)\b/i,
  /\b(?:stok(?:nya)?\s+(?:nambah|bertambah|masuk|ditambah))\b/i,
  // Buying specifically FOR stock / raw materials / from supplier
  /\b(?:beli|belanja|pesan|pesen|order|ambil)\s+(?:stok|bahan|bahan\s+baku|barang\s+dagangan|barang\s+gudang|grosir|modal|pasokan)\b/i,
  /\b(?:beli|belanja).*\b(?:buat\s+stok|untuk\s+stok|ke\s+gudang|masuk\s+gudang|dari\s+(?:agen|supplier|suplier|distributor|pasar|grosir|toko\s+sebelah))\b/i,
  // First-person store owner buying ("gua beli", "kita beli", "saya beli", "aku beli", "toko beli")
  /\b(?:gua|gue|gw|aku|saya|kita|kami|toko|warung|admin|kasir)\s+(?:tadi\s+|barusan\s+|baru\s+|lagi\s+|udah\s+|sudah\s+|habis\s+|abis\s+)*(?:beli|membeli|belanja|kulakan|kulak|ngulak|nyetok|restok|order\s+stok|pesan\s+stok)\b/i,
];

const LOSS_WASTE_PATTERNS: RegExp[] = [
  /\b(?:basi|busuk|rusak|pecah|bocor|penyok|expired|kadaluarsa|kedaluwarsa|dibuang|kebuang|tumpah|hilang|ilang|buang|susut|cacat|retur\s+rusak|gak\s+layak|tidak\s+layak|layu|jamuran)\b/i,
];

const PURE_EXPENSE_PATTERNS: RegExp[] = [
  /\b(?:bayar|membayar|dibayar|tagihan|iuran|sewa|kontrakan|ongkir|ongkos|bensin|solar|parkir|tol|listrik|token|air|pdam|pulsa|kuota|wifi|internet|gaji|upah|thr|bonus\s+karyawan|lembur|kebersihan|sampah|keamanan|pajak|retribusi|servis|service|perbaikan|renovasi|sedekah|sumbangan|kas\s+keluar|uang\s+keluar|duit\s+keluar|pengeluaran|keluar\s+duit|ngeluarin\s+duit)\b/i,
];

const PURE_INCOME_PATTERNS: RegExp[] = [
  /\b(?:pemasukan|pendapatan|uang\s+masuk|kas\s+masuk|duit\s+masuk|masuk\s+duit|nambah\s+duit|dapet\s+duit|dapat\s+duit|terima\s+uang|terima\s+pembayaran|terima\s+transfer|transfer\s+masuk|qris\s+masuk|modal\s+masuk|suntik\s+modal|komisi|tip)\b/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((rx) => rx.test(text));
}

// -------------------------------------------------------------
// 1. Voice Autocorrect & Phonetic Normalizer
// -------------------------------------------------------------
export function autocorrectIndonesianVoice(rawInput: string): LiveIntentFeedback {
  if (!rawInput || !rawInput.trim()) {
    return {
      cleanedText: '',
      detectedIntent: 'unknown',
      intentLabel: 'Menunggu Ucapan...',
      intentColor: '#8a8a92',
    };
  }

  // 1. Fix speech-to-text dot glitches while preserving sentence delimiters (. , ;)
  let text = rawInput
    .replace(/([a-zA-Z0-9])\.([a-zA-Z0-9])/g, '$1 . $2')
    .replace(/([0-9])\.([a-zA-Z])/g, '$1 . $2')
    .replace(/[\/#!$%\^&\*{}=_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Common Indonesian STT misheard phrases & UMKM slang normalizations
  const phoneticReplacements: Array<[RegExp, string]> = [
    // STT mishearing "Tadi ada yang beli..." as "Tak ada yang beli..." or "Tadi da yang beli..."
    [/^tak\s+ada\s+(yang|yg|orang)\s+/i, 'tadi ada $1 '],
    [/\btak\s+ada\s+(yang|yg)\s+beli\b/gi, 'tadi ada yang beli'],
    [/\btadi\s+da\s+(yang|yg)\s+/gi, 'tadi ada yang '],
    [/\bada\s+yg\b/gi, 'ada yang'],
    [/\byg\b/gi, 'yang'],
    [/\borg\b/gi, 'orang'],
    [/\bkastemer\b/gi, 'customer'],
    [/\bkostumer\b/gi, 'customer'],
    [/\bpelangan\b/gi, 'pelanggan'],
    [/\btamba\b/gi, 'tambah'],
    [/\btmbah\b/gi, 'tambah'],
    [/\btambahkn\b/gi, 'tambahkan'],
    [/\bsetok\b/gi, 'stok'],
    [/\bngestok\b/gi, 'nyetok'],
    [/\bristok\b/gi, 'restok'],
    [/\bblanja\b/gi, 'belanja'],
    [/\bke\s+jual\b/gi, 'kejual'],
    [/\bter\s+jual\b/gi, 'terjual'],
    [/\bdi\s+beli\b/gi, 'dibeli'],
    [/\bke\s+beli\b/gi, 'kebeli'],
    [/\bdi\s+borong\b/gi, 'diborong'],
    [/\bdi\s+pesan\b/gi, 'dipesan'],
    [/\bdi\s+pesen\b/gi, 'dipesen'],
    [/\bdi\s+order\b/gi, 'diorder'],
    [/\blagu\s+(?=\d|[a-z]+\s+\d)/gi, 'laku '],
    [/\baym\b/gi, 'ayam'],
    [/\bekor aym\b/gi, 'ekor ayam'],
    [/\bkopsus\b/gi, 'kopi susu'],
    [/\bkopsu\b/gi, 'kopi susu'],
    [/\bcroisant\b/gi, 'croissant'],
    [/\bkroisan\b/gi, 'croissant'],
    [/\bsebal\b/gi, '1 bal'],
    [/\bsebiji\b/gi, '1 biji'],
    [/\bsebuah\b/gi, '1 buah'],
    [/\bsecangkir\b/gi, '1 cup'],
    [/\bsegelas\b/gi, '1 gelas'],
    [/\bseporsi\b/gi, '1 porsi'],
    [/\bsebungkus\b/gi, '1 bungkus'],
    [/\bsebotol\b/gi, '1 botol'],
    [/\bsekilo\b/gi, '1 kg'],
    [/\bseliter\b/gi, '1 liter'],
    [/\bsetengah\s+lusin\b/gi, '6'],
    [/\bselusin\b/gi, '1 lusin'],
    [/\bsekodi\b/gi, '1 kodi'],
  ];

  for (const [pattern, replacement] of phoneticReplacements) {
    text = text.replace(pattern, replacement);
  }

  const lower = text.toLowerCase();

  // 3. Classify intent in strict priority order!
  // Priority 1: Category / Sub-category
  if (
    /\b(?:tambah|tambahkan|tambahin|buat|bikin)\s+(?:kategori|subkategori|sub-kategori|sub kategori)\b/i.test(
      lower
    ) ||
    /\b(?:kategori baru|sub-kategori baru|subkategori baru)\b/i.test(lower)
  ) {
    return {
      cleanedText: text,
      detectedIntent: 'category',
      intentLabel: 'Penambahan Kategori / Sub-Kategori',
      intentColor: '#a855f7',
      suggestedAction: 'Menambahkan kategori baru ke sistem',
    };
  }

  // Priority 2: Customer Sale ("ada yang beli", "laku", "terjual", "dibeli", "pelanggan beli", etc.)
  // MUST be checked BEFORE generic "beli" so "ada yang beli leci 10" is ALWAYS Penjualan!
  if (matchesAny(lower, CUSTOMER_SALE_PATTERNS)) {
    return {
      cleanedText: text,
      detectedIntent: 'sale',
      intentLabel: 'Penjualan (+Uang Masuk & -Stok)',
      intentColor: '#10b981',
      suggestedAction: 'Menambah uang masuk & mengurangi stok gudang',
    };
  }

  // Priority 3: Loss / Waste / Damaged / Expired
  if (matchesAny(lower, LOSS_WASTE_PATTERNS)) {
    return {
      cleanedText: text,
      detectedIntent: 'loss',
      intentLabel: 'Barang Rusak / Basi (-Stok)',
      intentColor: '#f59e0b',
      suggestedAction: 'Mengurangi stok barang rusak/basi di gudang',
    };
  }

  // Priority 4: Store Restock / Kulakan
  if (matchesAny(lower, EXPLICIT_RESTOCK_PATTERNS)) {
    return {
      cleanedText: text,
      detectedIntent: 'restock',
      intentLabel: 'Kulakan / Restok (+Stok & -Uang Keluar)',
      intentColor: '#06b6d4',
      suggestedAction: 'Menambah stok gudang & mencatat uang keluar',
    };
  }

  // Priority 5: Pure Income
  if (matchesAny(lower, PURE_INCOME_PATTERNS)) {
    return {
      cleanedText: text,
      detectedIntent: 'income',
      intentLabel: 'Pemasukan Kas (+Uang Masuk)',
      intentColor: '#10b981',
      suggestedAction: 'Mencatat pemasukan uang ke Buku Kas',
    };
  }

  // Priority 6: Expense / Operational
  if (matchesAny(lower, PURE_EXPENSE_PATTERNS) || /\b(?:belanja|beli)\b/i.test(lower)) {
    return {
      cleanedText: text,
      detectedIntent: 'expense',
      intentLabel: 'Pengeluaran (-Uang Keluar)',
      intentColor: '#ef4444',
      suggestedAction: 'Mencatat pengeluaran uang dari Buku Kas',
    };
  }

  return {
    cleanedText: text,
    detectedIntent: 'unknown',
    intentLabel: 'Draf Transaksi',
    intentColor: '#64748b',
    suggestedAction: 'Draf dapat ditinjau & diedit sebelum disimpan',
  };
}

// -------------------------------------------------------------
// 2. Indonesian Slang & Monetary Normalizer
// -------------------------------------------------------------
export function parseIndonesianSpokenAmount(text: string): number {
  const lower = text.toLowerCase().trim();

  // Direct colloquial Indonesian money slang
  if (/\b(?:pekgo|seratus lima puluh ribu|seratus lima puluh rebu)\b/i.test(lower)) return 150000;
  if (/\b(?:cepek\s*ribu|seratus\s*ribu|seratus\s*rebu)\b/i.test(lower)) return 100000;
  if (/\b(?:gocap|goban|lima puluh rebu|lima puluh ribu)\b/i.test(lower)) return 50000;
  if (/\b(?:jigo|dua puluh lima ribu|dua puluh lima rebu|dua lima ribu)\b/i.test(lower)) return 25000;
  if (/\b(?:noban|dua puluh rebu|dua puluh ribu)\b/i.test(lower)) return 20000;
  if (/\b(?:ceban|sepuluh rebu|sepuluh ribu)\b/i.test(lower)) return 10000;
  if (/\b(?:goceng|lima rebu|lima ribu)\b/i.test(lower)) return 5000;
  if (/\b(?:noceng|dua rebu|dua ribu)\b/i.test(lower)) return 2000;
  if (/\b(?:seceng|serebu|seribu)\b/i.test(lower)) return 1000;
  if (/\b(?:gopek\s*ribu|setengah juta|setengah jt|lima ratus ribu)\b/i.test(lower)) return 500000;
  if (/\b(?:satu juta|sejuta)\b/i.test(lower)) return 1000000;
  if (/\b(?:dua juta)\b/i.test(lower)) return 2000000;

  // Patterns like "1.5jt", "2,5 juta", "10 juta"
  const mJt = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  if (mJt) {
    const val = parseFloat(mJt[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  // Patterns like "360 ribu", "25rb", "15k", "140 rebu"
  const mRb = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu|rebu)\b/i);
  if (mRb) {
    const val = parseFloat(mRb[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  // Spoken word numbers followed by "ribu/rebu/juta" (e.g. "seratus dua puluh ribu", "tiga juta")
  const wordMoneyMatch = lower.match(
    /\b((?:(?:seratus|satu|dua|tiga|empat|lima|enam|enem|tujuh|tuju|delapan|lapan|sembilan|sepuluh|sebelas|belas|puluh|ratus)\s*)+)\s*(ribu|rebu|juta|jt)\b/i
  );
  if (wordMoneyMatch) {
    const numVal = parseSpokenNumberPhrase(wordMoneyMatch[1]);
    if (numVal && numVal > 0) {
      const mult = /juta|jt/i.test(wordMoneyMatch[2]) ? 1000000 : 1000;
      return numVal * mult;
    }
  }

  // Colloquial price without "ribu": "harga 20", "seharga 100", "bayar 50", "senilai 75", "jadi 100"
  const mAfterHarga = lower.match(
    /(?:harga|seharga|biaya|bayar|sebesar|total|senilai|jadi\s+duit|dapat\s+duit|dapet\s+duit|nambah\s+duit)\s+(?:rp\.?\s*)?(\d{1,3})\b(?!\s*(?:buah|ekor|pcs|cup|kg|kilo|liter|porsi|bal|kotak|bungkus|butir|botol|pack|dus|karton|x|hari|minggu|bulan|%))/i
  );
  if (mAfterHarga) {
    const num = parseInt(mAfterHarga[1], 10);
    if (num > 0 && num <= 999) return num * 1000;
  }

  // Explicit Rp formatted digits: "Rp 100.000", "Rp15.000", "150000"
  const mFormattedRp = lower.match(/rp\.?\s*(\d{1,3}(?:\.\d{3})+)/i);
  if (mFormattedRp) {
    return parseInt(mFormattedRp[1].replace(/\./g, ''), 10);
  }

  const mPlain = lower.match(/(?:rp\.?\s*)?(\d{4,9})\b/i);
  if (mPlain) {
    return parseInt(mPlain[1], 10);
  }

  return 0;
}

// -------------------------------------------------------------
// 2b. Per-Unit Price Detector ("satuan 10 ribu", "per buah 10rb", "@ 10000")
// -------------------------------------------------------------
function extractPerUnitSpokenPrice(text: string): number {
  const lower = text.toLowerCase();
  const mUnit = lower.match(
    /(?:satuan|per\s*[a-z]+|masing-masing|masing2|@)\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(rb|k|ribu|rebu)?/i
  );
  if (!mUnit) return 0;
  const raw = parseFloat(mUnit[1].replace(',', '.'));
  if (!raw || raw <= 0) return 0;
  if (mUnit[2]) return Math.round(raw * 1000);
  if (raw < 1000) return Math.round(raw * 1000);
  return Math.round(raw);
}

// -------------------------------------------------------------
// 3. Quantity & Package Multiplier Extractor
// -------------------------------------------------------------
const UNIT_KEYWORDS = [
  'buah',
  'biji',
  'pcs',
  'porsi',
  'piring',
  'mangkok',
  'cup',
  'gelas',
  'cangkir',
  'botol',
  'kaleng',
  'bungkus',
  'bks',
  'pack',
  'pak',
  'sachet',
  'renceng',
  'renteng',
  'kotak',
  'box',
  'dus',
  'karton',
  'lusin',
  'kodi',
  'bal',
  'balok',
  'karung',
  'sak',
  'kg',
  'kilo',
  'kilogram',
  'ons',
  'gram',
  'gr',
  'liter',
  'ltr',
  'ml',
  'galon',
  'tabung',
  'ikat',
  'sisir',
  'potong',
  'lembar',
  'pasang',
  'ekor',
  'butir',
  'toples',
  'loyang',
];

export function extractSpokenQuantity(text: string): {
  qty: number;
  unitMultiplier: number;
  detectedUnit: string;
} {
  const lower = text.toLowerCase();

  // Detect Unit
  let detectedUnit = 'pcs';
  if (/\b(?:buah)\b/i.test(lower)) detectedUnit = 'buah';
  else if (/\b(?:biji)\b/i.test(lower)) detectedUnit = 'pcs';
  else if (/\b(?:ekor)\b/i.test(lower)) detectedUnit = 'ekor';
  else if (/\b(?:kg|kilo|kilogram)\b/i.test(lower)) detectedUnit = 'kg';
  else if (/\b(?:gram|gr)\b/i.test(lower)) detectedUnit = 'gram';
  else if (/\b(?:ons)\b/i.test(lower)) detectedUnit = 'ons';
  else if (/\b(?:liter|ltr)\b/i.test(lower)) detectedUnit = 'liter';
  else if (/\b(?:ml)\b/i.test(lower)) detectedUnit = 'ml';
  else if (/\b(?:cup|gelas|cangkir)\b/i.test(lower)) detectedUnit = 'cup';
  else if (/\b(?:porsi|piring|mangkok)\b/i.test(lower)) detectedUnit = 'porsi';
  else if (/\b(?:bal|balok)\b/i.test(lower)) detectedUnit = 'bal';
  else if (/\b(?:kotak|box)\b/i.test(lower)) detectedUnit = 'kotak';
  else if (/\b(?:bungkus|bks|pack|pak|sachet|renceng|renteng)\b/i.test(lower)) detectedUnit = 'bungkus';
  else if (/\b(?:dus|karton)\b/i.test(lower)) detectedUnit = 'karton';
  else if (/\b(?:lusin)\b/i.test(lower)) detectedUnit = 'pcs';
  else if (/\b(?:kodi)\b/i.test(lower)) detectedUnit = 'pcs';
  else if (/\b(?:botol|kaleng|galon|toples)\b/i.test(lower)) detectedUnit = 'botol';
  else if (/\b(?:butir)\b/i.test(lower)) detectedUnit = 'butir';
  else if (/\b(?:ikat|potong|karung|sak|tabung|loyang)\b/i.test(lower)) {
    const mU = lower.match(/\b(ikat|potong|karung|sak|tabung|loyang)\b/i);
    if (mU) detectedUnit = mU[1].toLowerCase();
  }

  let unitMultiplier = 1;
  if (/\b(?:dus|karton|lusin)\b/i.test(lower)) {
    unitMultiplier = 12;
  } else if (/\b(?:kodi)\b/i.test(lower)) {
    unitMultiplier = 20;
  }

  // Remove monetary & date phrases BEFORE extracting item quantity so prices or dates aren't confused with qty!
  const sanitizedForQty = lower
    .replace(/(?:exp|expired|kadaluarsa|kedaluwarsa)\s+\d{1,2}\s+[a-z]+(?:\s+\d{4})?/gi, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|k|ribu|rebu)\b/gi, ' ')
    .replace(
      /(?:harga|seharga|biaya|bayar|sebesar|senilai|total|satuan|@)\s+(?:rp\.?\s*)?\d+(?:[.,]\d+)?/gi,
      ' '
    )
    .replace(/rp\.?\s*\d+(?:\.\d{3})*/gi, ' ');

  const unitRegexGroup = UNIT_KEYWORDS.join('|');
  // Match digits with optional unit e.g. "leci 10", "10 buah leci", "sebanyak 10"
  const mDigit = sanitizedForQty.match(
    new RegExp(`(?:sebanyak\\s+|jumlah\\s+)?(\\d+)\\s*(?:x|${unitRegexGroup})?\\b`, 'i')
  );
  if (mDigit && parseInt(mDigit[1], 10) > 0) {
    const q = parseInt(mDigit[1], 10);
    if (q <= 2000) {
      return { qty: q, unitMultiplier, detectedUnit };
    }
  }

  // Words for single items
  if (
    /\b(?:seporsi|secangkir|segelas|sebotol|sebiji|sebungkus|sebuah|sekotak|seikat|sebal|seekor|sebutir|sepotong|sekaleng|sekarung|setoples)\b/i.test(
      sanitizedForQty
    )
  ) {
    return { qty: 1, unitMultiplier, detectedUnit };
  }
  if (/\b(?:sekarton|sedus|selusin)\b/i.test(sanitizedForQty)) {
    return { qty: 1, unitMultiplier: 12, detectedUnit: /\bselusin\b/i.test(sanitizedForQty) ? 'pcs' : 'karton' };
  }
  if (/\b(?:sekodi)\b/i.test(sanitizedForQty)) {
    return { qty: 1, unitMultiplier: 20, detectedUnit: 'pcs' };
  }

  // General Indonesian spoken word-numbers ("sepuluh", "dua belas", "dua puluh lima", etc.)
  const wordQtyMatch = sanitizedForQty.match(
    /\b((?:(?:seratus|satu|dua|tiga|empat|lima|enam|enem|tujuh|tuju|delapan|lapan|sembilan|sepuluh|sebelas|belas|puluh|ratus)\s*)+)\b/i
  );
  if (wordQtyMatch) {
    const parsedWordQty = parseSpokenNumberPhrase(wordQtyMatch[1]);
    if (parsedWordQty && parsedWordQty > 0 && parsedWordQty <= 2000) {
      return { qty: parsedWordQty, unitMultiplier, detectedUnit };
    }
  }

  return { qty: 1, unitMultiplier, detectedUnit };
}

// -------------------------------------------------------------
// 4. Expiry Date Extractor ("expired 30 november", "kadaluarsa 2026-11-20")
// -------------------------------------------------------------
export function extractSpokenExpiryDate(text: string): string | undefined {
  const lower = text.toLowerCase();
  const dateMatch = lower.match(
    /(?:exp|expired|kadaluarsa|kedaluwarsa)\s+(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/i
  );
  if (!dateMatch) {
    const isoMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    return isoMatch ? isoMatch[1] : undefined;
  }

  const day = parseInt(dateMatch[1], 10);
  const monthName = dateMatch[2];
  const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();

  const months: Record<string, number> = {
    jan: 1, januari: 1,
    feb: 2, februari: 2,
    mar: 3, maret: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6,
    jul: 7, juli: 7,
    agu: 8, agustus: 8,
    sep: 9, september: 9,
    okt: 10, oktober: 10,
    nov: 11, november: 11,
    des: 12, desember: 12,
  };

  const monthNum = months[monthName] || new Date().getMonth() + 1;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${year}-${pad(monthNum)}-${pad(day)}`;
}

// -------------------------------------------------------------
// 5. Fuzzy Product Matcher (Dynamic Store Catalog Injected)
// -------------------------------------------------------------
const STOPWORD_TOKENS = new Set([
  'di', 'ke', 'ya', 'yg', 'dan', 'atau', 'ini', 'itu', 'ada', 'yang', 'tadi', 'beli', 'jual', 'laku', 'stok', 'isi', 'per',
]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBestMatchingProduct(clause: string, catalog: Product[]): Product | null {
  const lowerClause = clause.toLowerCase();
  let bestProduct: Product | null = null;
  let highestScore = 0;

  for (const prod of catalog) {
    const prodNameLower = prod.name.toLowerCase().trim();
    if (!prodNameLower) continue;

    let score = 0;

    // 1. Exact full product name match (word-bounded or substring)
    if (new RegExp(`\\b${escapeRegex(prodNameLower)}\\b`, 'i').test(lowerClause)) {
      score += 60 + prodNameLower.length;
    } else if (lowerClause.includes(prodNameLower)) {
      score += 45;
    }

    // 2. Dynamic token matching (supports 2+ letter product names like "es", "teh", "mie", "gas", "leci", etc.)
    const cleanTokens = prodNameLower
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2 && !STOPWORD_TOKENS.has(t));

    for (const token of cleanTokens) {
      if (new RegExp(`\\b${escapeRegex(token)}\\b`, 'i').test(lowerClause)) {
        score += 18 + token.length * 2;
      }
    }

    // 3. SKU match if user mentions SKU
    if (prod.sku && prod.sku.length >= 3 && lowerClause.includes(prod.sku.toLowerCase())) {
      score += 40;
    }

    if (score > highestScore) {
      highestScore = score;
      bestProduct = prod;
    }
  }

  return highestScore >= 18 ? bestProduct : null;
}

// -------------------------------------------------------------
// 6. Non-Catalog Product Extraction (Extract item name & unit when not yet in catalog)
// -------------------------------------------------------------
function extractUnregisteredItemDetails(clause: string): {
  name: string;
  category: string;
  subcategory?: string;
  suggestedUnit: string;
  defaultPrice: number;
} {
  const lower = clause.toLowerCase();
  const unitRegexGroup = UNIT_KEYWORDS.join('|');

  // Strip conversational filler, subjects, command verbs, units, and prices cleanly
  let clean = lower
    .replace(/(?:exp|expired|kadaluarsa|kedaluwarsa)\s+\d{1,2}\s+[a-z]+(?:\s+\d{4})?/gi, ' ')
    .replace(
      /\b(?:tadi|barusan|baru\s+saja|hari\s+ini|kemarin|tolong|coba|dong|deh|ya|nih|kok|lah|kan|terus|trus|lalu|sama|dan)\b/gi,
      ' '
    )
    .replace(
      /\b(?:ada\s+yang|ada\s+orang|orang|pembeli|pelanggan|customer|konsumen|tamu|bapak|ibu|mas|masnya|mbak|mbaknya|kakak|adik|abang|tetangga|temen|teman|gua|gue|gw|aku|saya|kita|kami|toko)\b/gi,
      ' '
    )
    .replace(
      /\b(?:tambah|tambahkan|tambahin|nambah|stok|barang|bahan|masuk|masukkan|masukin|kulakan|kulak|ngulak|beli|membeli|ngebeli|dibeli|kebeli|belanja|nyetok|restok|restock|laku|kejual|terjual|jual|menjual|penjualan|borong|diborong|pesan|pesen|dipesan|order|diorder|ambil|bungkus|basi|rusak|pecah|buang|dibuang|expired|kadaluarsa|kedaluwarsa)\b/gi,
      ' '
    )
    .replace(
      /\b(?:sebanyak|jumlah|seharga|harga|senilai|total|satuan|sebesar|rp|ribu|rebu|rb|k|juta|jt)\b/gi,
      ' '
    )
    .replace(new RegExp(`\\b(?:${unitRegexGroup})\\b`, 'gi'), ' ')
    .replace(
      /\b(?:seratus|seribu|satu|dua|tiga|empat|lima|enam|enem|tujuh|delapan|lapan|sembilan|sepuluh|sebelas|belas|puluh|ratus)\b/gi,
      ' '
    )
    .replace(/\d+(?:[.,]\d+)?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const name = clean
    ? clean
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'Barang Toko';

  if (/\b(?:ayam|daging|sapi|bebek|ikan|kambing|udang|cumi|telur|telor)\b/i.test(clean)) {
    return {
      name,
      category: 'Bahan Baku',
      subcategory: 'Protein & Segar',
      suggestedUnit: /\bekor\b/i.test(lower) ? 'ekor' : /\bbutir\b/i.test(lower) ? 'butir' : 'kg',
      defaultPrice: 25000,
    };
  }

  if (
    /\b(?:leci|mangga|apel|jeruk|pisang|anggur|melon|semangka|alpukat|stroberi|buah|sayur|sayuran|selada|tomat|bayam|wortel|cabe|cabai|bawang|kentang)\b/i.test(
      clean
    )
  ) {
    return {
      name,
      category: 'Bahan Baku',
      subcategory: 'Sayur & Buah',
      suggestedUnit: /\bbuah\b/i.test(lower) ? 'buah' : 'kg',
      defaultPrice: 15000,
    };
  }

  if (/\b(?:susu|keju|butter|mentega|yogurt|krim|cream)\b/i.test(clean)) {
    return {
      name,
      category: 'Bahan Baku',
      subcategory: 'Susu & Dairy',
      suggestedUnit: 'liter',
      defaultPrice: 18000,
    };
  }

  if (/\b(?:cup|gelas|sedotan|plastik|kresek|kantong|kotak|box|paper|tutup|kemasan)\b/i.test(clean)) {
    return {
      name,
      category: 'Kemasan & Cup',
      subcategory: 'Kemasan',
      suggestedUnit: 'pcs',
      defaultPrice: 1000,
    };
  }

  return {
    name,
    category: 'Produk Siap Jual',
    suggestedUnit: /\bbuah\b/i.test(lower) ? 'buah' : 'pcs',
    defaultPrice: 10000,
  };
}

// -------------------------------------------------------------
// 7. Main Parsing Engine (Runs 100% Client-side)
// -------------------------------------------------------------
export function parseOmniboxInput(
  rawInput: string,
  existingProducts: Product[],
  categoryDefinitions?: CategoryDefinition[]
): ConfirmationDraft {
  // 1. Run autocorrect and speech glitch sanitization
  const feedback = autocorrectIndonesianVoice(rawInput);
  let text = feedback.cleanedText;

  // 1b. Strip redundant causal echo clauses so they don't duplicate items:
  // e.g. "Tadi gua beli ayam 6, jadinya stok nambah 6" or "ada yang beli leci 10 jadinya leci ngurang 10"
  text = text
    .replace(
      /,?\s*\b(?:jadinya|artinya|sehingga|otomatis|berarti)\s+(?:stok(?:nya)?|[a-zA-Z]+)?\s*(?:nambah|bertambah|masuk|ngurang|berkurang|kepotong)\s*\d*\s*(?:[a-zA-Z]+)?/gi,
      ''
    )
    .trim();

  // 2. Multi-clause splitting: Handles 1, 2, 3, 4+ sequential actions cleanly
  const normalizedForSplit = text
    .replace(/(?:\.|\;|\n|\r\n)+/g, ' [SPLIT] ')
    .replace(/,?\s*\b(?:terus|trus|lalu|kemudian|habis itu|abis itu|setelah itu|selain itu|berikutnya)\b/gi, ' [SPLIT] ')
    .replace(
      /,\s*(?=(?:laku|ada\s+yang|orang\s+beli|pembeli|pelanggan|dibeli|beli|belanja|jual|terjual|kejual|bayar|terima|pemasukan|pengeluaran|tambah|kulakan|nyetok|restok|stok|basi|rusak))/gi,
      ' [SPLIT] '
    )
    .replace(
      /\b(?:dan|sama)\s+(?=(?:laku|ada\s+yang|orang\s+beli|pembeli|pelanggan|dibeli|beli|belanja|jual|terjual|kejual|bayar|terima|pemasukan|pengeluaran|tambah|kulakan|nyetok|restok|stok|basi|rusak|[a-zA-Z]+\s+\d+|\d+\s+[a-zA-Z]+))/gi,
      ' [SPLIT] '
    );

  const rawClauses = normalizedForSplit
    .split(/\s*\[SPLIT\]\s*/)
    .map((c) => c.replace(/^[,\s;]+|[,\s;]+$/g, '').trim())
    .filter((c) => c.length > 0);

  const clauses = rawClauses.length > 0 ? rawClauses : [text];

  const cashChanges: ConfirmationDraft['cashChanges'] = [];
  const stockChanges: ConfirmationDraft['stockChanges'] = [];
  const categoryChanges: CategoryChangeDraft[] = [];
  const explanations: string[] = [];

  let lastActiveIntent: 'restock' | 'sale' | 'expense' | 'income' | 'loss' | null = null;

  const processClause = (clause: string) => {
    const clLower = clause.toLowerCase();
    const explicitAmount = parseIndonesianSpokenAmount(clause);
    const perUnitSpokenPrice = extractPerUnitSpokenPrice(clause);
    const { qty: rawQty, unitMultiplier, detectedUnit } = extractSpokenQuantity(clause);
    const matchedProduct = findBestMatchingProduct(clause, existingProducts);
    const expiryDate = extractSpokenExpiryDate(clause);

    // ---------------------------------------------------------
    // CASE 0: CATEGORY OR SUB-CATEGORY ADDITION INTENT
    // ---------------------------------------------------------
    const isCategoryIntent =
      /\b(?:tambah|tambahkan|tambahin|buat|bikin)\s+(?:kategori|subkategori|sub-kategori|sub kategori)\b/i.test(
        clLower
      ) || /\b(?:kategori baru|sub-kategori baru|subkategori baru)\b/i.test(clLower);

    if (isCategoryIntent) {
      const isSub = /\b(?:subkategori|sub-kategori|sub kategori)\b/i.test(clLower);

      const extractedName = clause
        .replace(
          /\b(?:tambah|tambahkan|tambahin|buat|bikin|kategori|subkategori|sub-kategori|sub kategori|baru|di kategori|pada kategori|di|pada)\b/gi,
          ''
        )
        .replace(/^(?:baru)\s+/i, '')
        .trim();

      let mainCat = categoryDefinitions?.[0]?.name || 'Bahan Baku';
      let subCat = '';

      if (isSub) {
        // Match against user's existing categoryDefinitions first!
        const matchedDef = categoryDefinitions?.find((cd) =>
          clLower.includes(cd.name.toLowerCase())
        );
        if (matchedDef) {
          mainCat = matchedDef.name;
          subCat = extractedName
            .replace(new RegExp(escapeRegex(matchedDef.name), 'gi'), '')
            .trim();
        } else {
          if (/bahan baku|dapur/i.test(clause)) mainCat = 'Bahan Baku';
          else if (/produk|menu|jual/i.test(clause)) mainCat = 'Produk Siap Jual';
          else if (/kemasan|packaging|cup/i.test(clause)) mainCat = 'Kemasan & Cup';
          else if (/operasional|utilitas|listrik/i.test(clause)) mainCat = 'Operasional';

          subCat = extractedName
            .replace(/\b(?:bahan baku|dapur|produk siap jual|produk|kemasan|packaging|operasional)\b/gi, '')
            .trim();
        }
        if (!subCat) subCat = 'Sub-Kategori Baru';
      } else {
        mainCat = extractedName || 'Kategori Baru';
      }

      const formatTitle = (str: string) =>
        str
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

      mainCat = formatTitle(mainCat);
      if (subCat) subCat = formatTitle(subCat);

      categoryChanges.push({
        mainCategory: mainCat,
        subcategory: isSub ? subCat : undefined,
        action: isSub ? 'add_sub' : 'add_main',
        description: isSub
          ? `Menambahkan Sub-Kategori "${subCat}" di Kategori Utama "${mainCat}"`
          : `Menambahkan Kategori Utama "${mainCat}"`,
      });

      explanations.push(
        isSub
          ? `Sub-Kategori Baru: "${subCat}" di "${mainCat}"`
          : `Kategori Baru: "${mainCat}"`
      );
      return;
    }

    // ---------------------------------------------------------
    // STRICT PRIORITY INTENT DISAMBIGUATION
    // ---------------------------------------------------------
    const isCustomerSaleExplicit = matchesAny(clLower, CUSTOMER_SALE_PATTERNS);
    const isLossExplicit = matchesAny(clLower, LOSS_WASTE_PATTERNS);
    const isRestockExplicit = !isCustomerSaleExplicit && matchesAny(clLower, EXPLICIT_RESTOCK_PATTERNS);
    const isPureExpenseExplicit = matchesAny(clLower, PURE_EXPENSE_PATTERNS);
    const isPureIncomeExplicit = matchesAny(clLower, PURE_INCOME_PATTERNS);

    // Bare "beli / belanja" WITHOUT customer subject ("ada yang beli", "orang beli", "dibeli", etc.):
    // e.g. "beli leci 10" or "belanja gula 5 kilo" -> store buying supplies (restock if product or stok context, expense if operational)
    const hasBareStoreBuy =
      !isCustomerSaleExplicit && /\b(?:beli|membeli|belanja)\b/i.test(clLower);

    let intent: 'sale' | 'restock' | 'loss' | 'expense' | 'income' | null = null;

    if (isCustomerSaleExplicit) {
      intent = 'sale';
    } else if (isLossExplicit) {
      intent = 'loss';
    } else if (isRestockExplicit) {
      intent = 'restock';
    } else if (hasBareStoreBuy) {
      // If a known catalog product is mentioned (e.g. "beli leci 10") or stock units/items, treat as restock;
      // if non-product operational item (e.g. "beli bensin 20rb", "beli es batu 15rb"), treat as expense!
      if (
        matchedProduct ||
        /\b(?:stok|gudang|karton|dus|lusin|kodi|karung)\b/i.test(clLower)
      ) {
        intent = 'restock';
      } else if (
        explicitAmount > 0 &&
        /\b(?:es batu|gas|elpiji|galon|sedotan|plastik|kresek|tisu|sabun|bensin|pulsa|token|listrik|kopi\s+sachet|makan\s+siang)\b/i.test(
          clLower
        )
      ) {
        intent = 'expense';
      } else {
        intent = 'restock';
      }
    } else if (isPureExpenseExplicit && !matchedProduct) {
      intent = 'expense';
    } else if (isPureIncomeExplicit && !matchedProduct) {
      intent = 'income';
    } else if (lastActiveIntent) {
      // Context inheritance across multi-item lists ("Ada yang beli leci 10, mangga 5")
      intent = lastActiveIntent;
    } else if (matchedProduct) {
      // Mentioning a registered product + quantity in cashier omnibox defaults to Sale!
      intent = 'sale';
    } else if (isPureExpenseExplicit) {
      intent = 'expense';
    } else if (isPureIncomeExplicit) {
      intent = 'income';
    }

    if (intent) {
      lastActiveIntent = intent;
    }

    // ---------------------------------------------------------
    // CASE 1: CUSTOMER SALE (Penjualan -> Uang Masuk +, Stok Gudang Berkurang -)
    // ---------------------------------------------------------
    if (intent === 'sale') {
      if (matchedProduct) {
        const prodUnitLower = (matchedProduct.unit || '').toLowerCase();
        const isBulkCatalogUnit = ['lusin', 'kodi', 'dus', 'karton', 'karung', 'sak', 'bal'].includes(
          prodUnitLower
        );
        const finalQty =
          unitMultiplier > 1 && !isBulkCatalogUnit
            ? rawQty * unitMultiplier
            : rawQty > 0
            ? rawQty
            : 1;

        // Smart unit price fallback: sellingPrice first; if sellingPrice is 0, fallback to hppAmount!
        const catalogUnitPrice =
          matchedProduct.sellingPrice > 0
            ? matchedProduct.sellingPrice
            : matchedProduct.hppAmount;

        const totalAmount =
          perUnitSpokenPrice > 0
            ? finalQty * perUnitSpokenPrice
            : explicitAmount > 0
            ? explicitAmount
            : finalQty * catalogUnitPrice;

        const isShortage = finalQty > matchedProduct.currentStock;
        const shortage = isShortage ? finalQty - matchedProduct.currentStock : 0;

        cashChanges.push({
          type: 'income',
          amount: totalAmount,
          category: 'Penjualan',
          description: `Penjualan ${finalQty} ${matchedProduct.unit} ${matchedProduct.name}`,
        });

        stockChanges.push({
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          category: matchedProduct.category,
          unit: matchedProduct.unit,
          location: matchedProduct.location,
          quantityDelta: -finalQty, // STOK BERKURANG!
          pricePerUnit: finalQty > 0 ? Math.round(totalAmount / finalQty) : catalogUnitPrice,
          insufficientStockWarning: isShortage
            ? {
                currentStock: matchedProduct.currentStock,
                requestedQty: finalQty,
                shortage,
              }
            : undefined,
        });

        if (isShortage) {
          explanations.push(
            `Penjualan ${finalQty} ${matchedProduct.unit} ${matchedProduct.name} (+Rp ${totalAmount.toLocaleString(
              'id-ID'
            )}) — Perhatian: stok di gudang sisa ${matchedProduct.currentStock} ${matchedProduct.unit} (kurang ${shortage} ${matchedProduct.unit})`
          );
        } else {
          explanations.push(
            `Penjualan ${finalQty} ${matchedProduct.unit} ${matchedProduct.name}: Uang Masuk (+Rp ${totalAmount.toLocaleString(
              'id-ID'
            )}), Stok Gudang Berkurang (-${finalQty} ${matchedProduct.unit})`
          );
        }
        return;
      } else {
        // Unregistered product sale: record Cash Income AND Stock Deduction draft
        const itemInfo = extractUnregisteredItemDetails(clause);
        const finalQty = rawQty > 0 ? rawQty * unitMultiplier : 1;
        const finalUnit = detectedUnit !== 'pcs' ? detectedUnit : itemInfo.suggestedUnit;
        const totalAmount =
          perUnitSpokenPrice > 0
            ? finalQty * perUnitSpokenPrice
            : explicitAmount > 0
            ? explicitAmount
            : finalQty * itemInfo.defaultPrice;

        cashChanges.push({
          type: 'income',
          amount: totalAmount,
          category: 'Penjualan',
          description: `Penjualan ${finalQty} ${finalUnit} ${itemInfo.name}`,
        });

        explanations.push(
          `Penjualan ${finalQty} ${finalUnit} ${itemInfo.name}: Uang Masuk (+Rp ${totalAmount.toLocaleString(
            'id-ID'
          )})`
        );
        return;
      }
    }

    // ---------------------------------------------------------
    // CASE 2: STORE RESTOCK / KULAKAN (Stok Gudang Bertambah +, Uang Keluar -)
    // ---------------------------------------------------------
    if (intent === 'restock') {
      if (matchedProduct) {
        const prodUnitLower = (matchedProduct.unit || '').toLowerCase();
        const isBulkCatalogUnit = ['lusin', 'kodi', 'dus', 'karton', 'karung', 'sak', 'bal'].includes(
          prodUnitLower
        );
        const finalQty =
          unitMultiplier > 1 && !isBulkCatalogUnit
            ? rawQty * unitMultiplier
            : rawQty > 0
            ? rawQty
            : 1;

        const alreadyRestocked = stockChanges.some(
          (s) =>
            s.productName.toLowerCase() === matchedProduct.name.toLowerCase() &&
            s.quantityDelta === finalQty
        );
        if (alreadyRestocked) return;

        const catalogUnitCost =
          matchedProduct.hppAmount > 0
            ? matchedProduct.hppAmount
            : matchedProduct.sellingPrice;

        const totalCost =
          perUnitSpokenPrice > 0
            ? finalQty * perUnitSpokenPrice
            : explicitAmount > 0
            ? explicitAmount
            : finalQty * catalogUnitCost;

        cashChanges.push({
          type: 'expense',
          amount: totalCost,
          category: matchedProduct.category || 'Bahan Baku',
          description: `Kulakan ${finalQty} ${matchedProduct.unit} ${matchedProduct.name}`,
        });

        stockChanges.push({
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          category: matchedProduct.category,
          unit: matchedProduct.unit,
          location: matchedProduct.location,
          quantityDelta: finalQty, // STOK BERTAMBAH!
          pricePerUnit: finalQty > 0 ? Math.round(totalCost / finalQty) : catalogUnitCost,
          expiryDate: expiryDate || matchedProduct.expiryDate || undefined,
        });

        explanations.push(
          `Kulakan ${finalQty} ${matchedProduct.unit} ${matchedProduct.name}: Stok Bertambah (+${finalQty} ${
            matchedProduct.unit
          }), Uang Keluar (-Rp ${totalCost.toLocaleString('id-ID')})${
            expiryDate ? ` [Exp: ${expiryDate}]` : ''
          }`
        );
        return;
      } else {
        const itemInfo = extractUnregisteredItemDetails(clause);
        const finalQty = rawQty > 0 ? rawQty * unitMultiplier : 1;
        const finalUnit = detectedUnit !== 'pcs' ? detectedUnit : itemInfo.suggestedUnit;

        const alreadyRestocked = stockChanges.some(
          (s) =>
            s.productName.toLowerCase() === itemInfo.name.toLowerCase() &&
            s.quantityDelta === finalQty
        );
        if (alreadyRestocked) return;

        const totalCost =
          perUnitSpokenPrice > 0
            ? finalQty * perUnitSpokenPrice
            : explicitAmount > 0
            ? explicitAmount
            : finalQty * itemInfo.defaultPrice;

        cashChanges.push({
          type: 'expense',
          amount: totalCost,
          category: itemInfo.category,
          description: `Kulakan ${finalQty} ${finalUnit} ${itemInfo.name}`,
        });

        stockChanges.push({
          productName: itemInfo.name,
          category: itemInfo.category,
          unit: finalUnit,
          quantityDelta: finalQty, // STOK BERTAMBAH!
          pricePerUnit: finalQty > 0 ? Math.round(totalCost / finalQty) : itemInfo.defaultPrice,
          expiryDate: expiryDate || undefined,
          isNewProduct: true,
        });

        explanations.push(
          `Kulakan Barang Baru (${itemInfo.name}): Stok Bertambah (+${finalQty} ${finalUnit}), Uang Keluar (-Rp ${totalCost.toLocaleString(
            'id-ID'
          )})${expiryDate ? ` [Exp: ${expiryDate}]` : ''}`
        );
        return;
      }
    }

    // ---------------------------------------------------------
    // CASE 3: PRODUCT LOSS / BASI / RUSAK (Stok Berkurang -, Tanpa Efek Kas)
    // ---------------------------------------------------------
    if (intent === 'loss') {
      if (matchedProduct) {
        const finalQty = rawQty > 0 ? rawQty : 1;
        stockChanges.push({
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          category: matchedProduct.category,
          unit: matchedProduct.unit,
          location: matchedProduct.location,
          quantityDelta: -finalQty,
          pricePerUnit: matchedProduct.hppAmount,
        });

        explanations.push(
          `Barang Rusak/Basi: Stok ${matchedProduct.name} berkurang -${finalQty} ${matchedProduct.unit}`
        );
        return;
      } else {
        const itemInfo = extractUnregisteredItemDetails(clause);
        const finalQty = rawQty > 0 ? rawQty : 1;
        const finalUnit = detectedUnit !== 'pcs' ? detectedUnit : itemInfo.suggestedUnit;
        stockChanges.push({
          productName: itemInfo.name,
          category: itemInfo.category,
          unit: finalUnit,
          quantityDelta: -finalQty,
          pricePerUnit: itemInfo.defaultPrice,
        });

        explanations.push(
          `Barang Rusak/Basi: Stok ${itemInfo.name} berkurang -${finalQty} ${finalUnit}`
        );
        return;
      }
    }

    // ---------------------------------------------------------
    // CASE 4: PURE CASH INCOME (Pemasukan Non-Barang)
    // ---------------------------------------------------------
    if (intent === 'income') {
      const amount = explicitAmount > 0 ? explicitAmount : 0;
      const desc = clause.replace(/^(?:lalu|dan|sama|terus|trus)\s+/i, '').trim();
      cashChanges.push({
        type: 'income',
        amount,
        category: 'Penjualan',
        description: desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : 'Pemasukan Kas',
      });
      explanations.push(
        `Uang Masuk: +Rp ${amount.toLocaleString('id-ID')} (${desc || 'Pemasukan'})`
      );
      return;
    }

    // ---------------------------------------------------------
    // CASE 5: GENERAL OPERATIONAL EXPENSE (Pengeluaran Kas Non-Stok)
    // ---------------------------------------------------------
    if (intent === 'expense' || explicitAmount > 0) {
      const amount = explicitAmount > 0 ? explicitAmount : 0;
      let cat = 'Operasional';

      if (/es batu|gas|elpiji|air|galon|gula|minyak|bumbu/i.test(clLower)) cat = 'Bahan Baku';
      else if (/sedotan|plastik|kresek|cup|paper|kantong|kemasan|dus/i.test(clLower)) cat = 'Kemasan & Cup';
      else if (/gaji|upah|lembur|thr|karyawan/i.test(clLower)) cat = 'Gaji Karyawan';
      else if (/listrik|token|air|pdam/i.test(clLower)) cat = 'Listrik & Air';

      const desc = clause.replace(/^(?:lalu|dan|sama|terus|trus)\s+/i, '').trim();

      cashChanges.push({
        type: 'expense',
        amount,
        category: cat,
        description: desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : 'Pengeluaran Operasional',
      });

      explanations.push(
        `Uang Keluar: -Rp ${amount.toLocaleString('id-ID')} untuk ${desc || 'Operasional'} (${cat})`
      );
      return;
    }
  };

  clauses.forEach((c) => processClause(c));

  if (cashChanges.length === 0 && stockChanges.length === 0 && categoryChanges.length === 0) {
    const fallbackAmount = parseIndonesianSpokenAmount(text);
    if (fallbackAmount > 0) {
      cashChanges.push({
        type: 'income',
        amount: fallbackAmount,
        category: 'Penjualan',
        description: text || 'Catatan Transaksi Suara',
      });
      explanations.push(`Uang Masuk: +Rp ${fallbackAmount.toLocaleString('id-ID')}`);
    } else {
      explanations.push(
        `Kalimat "${text}" belum terdeteksi nominal/barang spesifik. Klik kotak Ringkasan ini untuk memperbaiki kalimat Anda.`
      );
    }
  }

  return {
    id: `draft-${Date.now()}`,
    source: 'mic_omni',
    title: 'Konfirmasi Draf Pintar (Kas & Gudang)',
    explanation: explanations.join(' • '),
    cashChanges,
    stockChanges,
    categoryChanges: categoryChanges.length > 0 ? categoryChanges : undefined,
    originalInput: rawInput,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Receipt OCR Scanner Parser
 * Prepares an editable receipt draft connected to Cash & Storage
 */
export function parseReceiptImage(
  receiptName: string,
  existingProducts: Product[]
): ConfirmationDraft {
  const cleanFileLabel = (receiptName || 'Nota Belanja')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  const matched = existingProducts.find(
    (p) =>
      cleanFileLabel.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(cleanFileLabel.toLowerCase())
  );

  const defaultPrice = matched ? matched.hppAmount : 0;

  const stockChanges: StockChangeDraft[] = [
    {
      productId: matched?.id,
      productName: matched?.name || cleanFileLabel || 'Barang Belanja Nota',
      category: matched?.category || 'Bahan Baku',
      unit: matched?.unit || 'pcs',
      quantityDelta: 1,
      pricePerUnit: defaultPrice,
      expiryDate: undefined,
      isNewProduct: !matched,
    },
  ];

  return {
    id: `draft-ocr-${Date.now()}`,
    source: 'photo_receipt',
    title: 'Konfirmasi Hasil Pindai Nota Belanja',
    explanation: `Nota "${receiptName || 'Foto_Nota.jpg'}" siap ditinjau. Silakan sesuaikan nama barang, jumlah, kategori, kedaluwarsa, dan total nominal belanja sebelum disimpan ke Buku Kas & Gudang.`,
    cashChanges: [
      {
        type: 'expense',
        amount: defaultPrice,
        category: matched?.category || 'Bahan Baku',
        description: `Belanja Nota (${cleanFileLabel || 'Nota Toko'})`,
      },
    ],
    stockChanges,
    originalInput: `Pindai Foto Nota: ${receiptName || 'Foto_Nota.jpg'}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
}
