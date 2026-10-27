import { ConfirmationDraft, Product, CategoryDefinition, CategoryChangeDraft } from '@/types';

/**
 * KASRA Smart On-Device Context-Aware NLP, Autocorrect & Voice Engine
 * Zero Cloud Token Cost — Runs 100% client-side in the browser.
 *
 * Upgrades:
 * 1. Speech Punctuation & Dot Glitch Sanitizer (e.g., "baru.Uht.Sesuatu" -> "baru Uht Sesuatu")
 * 2. Indonesian UMKM Phonetic & Slang Autocorrect (aym -> ayam, kopsu -> kopi susu, etc.)
 * 3. 2-Tier Category & Sub-Category Intent Extraction
 * 4. Bulletproof Restock ("Tambahkan stok", "Restok", "Kulakan") -> ALWAYS Positive Stock Delta!
 * 5. Strict Sale Isolation ("Laku", "Terjual") -> Negative Stock Delta + Cash Income
 * 6. Dynamic Non-Catalog Item Ingestion (detects "ayam", "sayur" even before catalog registration)
 * 7. Live Intent Badge Detector for real-time visual feedback in Mic Modal
 */

export interface LiveIntentFeedback {
  cleanedText: string;
  detectedIntent: 'restock' | 'sale' | 'category' | 'expense' | 'loss' | 'unknown';
  intentLabel: string;
  intentColor: string;
  matchedEntity?: string;
  suggestedAction?: string;
}

// -------------------------------------------------------------
// 1. Voice Autocorrect & Phonetic Normalizer
// -------------------------------------------------------------
export function autocorrectIndonesianVoice(rawInput: string): LiveIntentFeedback {
  if (!rawInput) {
    return {
      cleanedText: '',
      detectedIntent: 'unknown',
      intentLabel: 'Menunggu Ucapan...',
      intentColor: '#8a8a92',
    };
  }

  // 1. Fix speech-to-text dot glitches and preserve sentence delimiters (. , ;)
  let text = rawInput
    .replace(/([a-zA-Z0-9])\.([a-zA-Z0-9])/g, '$1 . $2')
    .replace(/([0-9])\.([a-zA-Z])/g, '$1 . $2')
    .replace(/[\/#!$%\^&\*{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Common speech recognition misheard words in UMKM contexts
  const phoneticReplacements: Array<[RegExp, string]> = [
    [/\btamba\b/gi, 'tambah'],
    [/\btmbah\b/gi, 'tambah'],
    [/\btambahkn\b/gi, 'tambahkan'],
    [/\bsetok\b/gi, 'stok'],
    [/\bngestok\b/gi, 'nyetok'],
    [/\baym\b/gi, 'ayam'],
    [/\bekor aym\b/gi, 'ekor ayam'],
    [/\bkopsus\b/gi, 'kopi susu'],
    [/\bkopsu\b/gi, 'kopi susu'],
    [/\buht\b/gi, 'susu uht'],
    [/\bcroisant\b/gi, 'croissant'],
    [/\bkroisan\b/gi, 'croissant'],
    [/\bsebal\b/gi, '1 bal'],
    [/\bsebiji\b/gi, '1 pcs'],
    [/\bsecangkir\b/gi, '1 cup'],
  ];

  for (const [pattern, replacement] of phoneticReplacements) {
    text = text.replace(pattern, replacement);
  }

  const lower = text.toLowerCase();

  // 3. Classify intent for real-time user feedback
  if (
    /\b(?:tambah|tambahkan|tambahin|buat|bikin)\s+(?:kategori|subkategori|sub-kategori|sub kategori)\b/i.test(
      lower
    ) ||
    /\b(?:kategori baru|sub-kategori baru|subkategori baru)\b/i.test(lower)
  ) {
    return {
      cleanedText: text,
      detectedIntent: 'category',
      intentLabel: '🏷️ Penambahan Kategori / Sub-Kategori',
      intentColor: '#a855f7',
      suggestedAction: 'Menambahkan kategori baru ke sistem',
    };
  }

  if (
    /\b(?:tambah|tambahkan|tambahin|masuk|masukkan|masukin)\s+(?:stok|barang|bahan)?/i.test(lower) ||
    /\b(?:kulakan|nyetok|restok|restock|pasok|pasokan|belanja stok|belanja bahan|beli stok|beli bahan)\b/i.test(
      lower
    ) ||
    /\b(?:stok masuk)\b/i.test(lower)
  ) {
    return {
      cleanedText: text,
      detectedIntent: 'restock',
      intentLabel: '📦 Restok Gudang (+Stok Masuk)',
      intentColor: '#06b6d4',
      suggestedAction: 'Menambahkan jumlah fisik barang ke gudang',
    };
  }

  if (
    /\b(?:laku|kejual|terjual|jual|penjualan|ada yang beli|dibeli|order|orderan|pesan|pesanan|tumbas)\b/i.test(
      lower
    )
  ) {
    return {
      cleanedText: text,
      detectedIntent: 'sale',
      intentLabel: '✅ Penjualan Kasir (+Kas & -Stok)',
      intentColor: '#10b981',
      suggestedAction: 'Mencatat kas masuk & memotong stok barang',
    };
  }

  if (/\b(?:basi|rusak|pecah|expired|kadaluarsa|kedaluwarsa|dibuang|tumpah|hilang|buang)\b/i.test(lower)) {
    return {
      cleanedText: text,
      detectedIntent: 'loss',
      intentLabel: '⚠️ Barang Rusak / Basi (-Stok)',
      intentColor: '#f59e0b',
      suggestedAction: 'Mengurangi stok barang yang rusak/basi tanpa efek kas',
    };
  }

  if (
    /\b(?:bayar|ongkir|bensin|listrik|token|pulsa|wifi|es batu|parkir|gaji|galon|kebersihan|belanja|beli)\b/i.test(
      lower
    )
  ) {
    return {
      cleanedText: text,
      detectedIntent: 'expense',
      intentLabel: '💸 Pengeluaran Operasional (-Kas)',
      intentColor: '#f43f5e',
      suggestedAction: 'Mencatat pengeluaran kas non-stok',
    };
  }

  return {
    cleanedText: text,
    detectedIntent: 'unknown',
    intentLabel: '💡 Draf Transaksi Umum',
    intentColor: '#71717a',
    suggestedAction: 'Draf dapat diedit sebelum disimpan',
  };
}

// -------------------------------------------------------------
// 2. Indonesian Slang & Monetary Normalizer
// -------------------------------------------------------------
export function parseIndonesianSpokenAmount(text: string): number {
  const lower = text.toLowerCase().trim();

  // Direct slang terms
  if (/\b(?:gocap|lima puluh rebu|lima puluh ribu)\b/i.test(lower)) return 50000;
  if (/\b(?:ceban|sepuluh rebu|sepuluh ribu)\b/i.test(lower)) return 10000;
  if (/\b(?:goceng|lima rebu|lima ribu)\b/i.test(lower)) return 5000;
  if (/\b(?:noceng|dua rebu|dua ribu)\b/i.test(lower)) return 2000;
  if (/\b(?:seceng|serebu|seribu)\b/i.test(lower)) return 1000;
  if (/\b(?:setengah juta|setengah jt)\b/i.test(lower)) return 500000;
  if (/\b(?:satu juta|sejuta)\b/i.test(lower)) return 1000000;
  if (/\b(?:dua juta)\b/i.test(lower)) return 2000000;

  // Patterns like "1.5jt", "2,5 juta", "10 juta"
  const mJt = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
  if (mJt) {
    const val = parseFloat(mJt[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  // Patterns like "360 ribu", "25rb", "15k", "140 rebu"
  const mRb = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu|rebu)/i);
  if (mRb) {
    const val = parseFloat(mRb[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  // Indonesian word-numbers followed by ribu/rebu (e.g. "dua puluh lima ribu", "tiga ratus ribu")
  const wordMultiplierMap: Record<string, number> = {
    'tiga ratus lima puluh': 350,
    'dua ratus lima puluh': 250,
    'seratus lima puluh': 150,
    'tiga ratus': 300,
    'dua ratus': 200,
    'seratus': 100,
    'tujuh puluh lima': 75,
    'lima puluh': 50,
    'tiga puluh lima': 35,
    'tiga puluh': 30,
    'dua puluh lima': 25,
    'dua puluh': 20,
    'lima belas': 15,
    'empat belas': 14,
    'tiga belas': 13,
    'dua belas': 12,
    'sebelas': 11,
    'sepuluh': 10,
    'sembilan': 9,
    'delapan': 8,
    'tujuh': 7,
    'enam': 6,
    'lima': 5,
    'empat': 4,
    'tiga': 3,
    'dua': 2,
    'satu': 1,
  };

  for (const [w, val] of Object.entries(wordMultiplierMap)) {
    const regex = new RegExp(`\\b${w}\\s*(?:ribu|rebu)\\b`, 'i');
    if (regex.test(lower)) {
      return val * 1000;
    }
  }

  // Standard digits: "15000", "Rp 15.000", "Rp25000"
  const mPlain = lower.match(/(?:rp\.?\s*)?(\d{4,9})/i);
  if (mPlain) {
    return parseInt(mPlain[1], 10);
  }

  return 0;
}

// -------------------------------------------------------------
// 3. Quantity & Package Multiplier Extractor
// -------------------------------------------------------------
export function extractSpokenQuantity(text: string): {
  qty: number;
  unitMultiplier: number;
  detectedUnit: string;
} {
  const lower = text.toLowerCase();

  // Detect Unit
  let detectedUnit = 'pcs';
  if (/\b(?:ekor)\b/i.test(lower)) detectedUnit = 'ekor';
  else if (/\b(?:kg|kilo|kilogram)\b/i.test(lower)) detectedUnit = 'kg';
  else if (/\b(?:liter|ltr)\b/i.test(lower)) detectedUnit = 'liter';
  else if (/\b(?:cup|gelas|cangkir)\b/i.test(lower)) detectedUnit = 'cup';
  else if (/\b(?:porsi|piring|mangkok)\b/i.test(lower)) detectedUnit = 'porsi';
  else if (/\b(?:bal|balok)\b/i.test(lower)) detectedUnit = 'bal';
  else if (/\b(?:kotak|box)\b/i.test(lower)) detectedUnit = 'kotak';
  else if (/\b(?:bungkus|bks|pack)\b/i.test(lower)) detectedUnit = 'bungkus';
  else if (/\b(?:dus|karton)\b/i.test(lower)) detectedUnit = 'karton';
  else if (/\b(?:botol)\b/i.test(lower)) detectedUnit = 'botol';
  else if (/\b(?:butir)\b/i.test(lower)) detectedUnit = 'butir';

  // Multiplier words: 1 dus/karton of milk usually = 12 or 24
  let unitMultiplier = 1;
  if (/\b(?:dus|karton)\b/i.test(lower)) {
    unitMultiplier = 12;
  }

  // Digits: "laku 4", "4 cup", "sebanyak 10", "10 ekor", "3x"
  const mDigit = lower.match(
    /(?:sebanyak\s+)?(\d+)\s*(?:x|cup|porsi|pcs|biji|botol|bungkus|kotak|dus|karton|bal|pack|liter|kg|ekor|butir)?/i
  );
  if (mDigit && parseInt(mDigit[1], 10) > 0) {
    return { qty: parseInt(mDigit[1], 10), unitMultiplier, detectedUnit };
  }

  // Words for single items
  if (
    /\b(?:seporsi|secangkir|segelas|sebotol|sebiji|sebungkus|sebuah|sekotak|seikat|sebal|seekor|sebutir)\b/i.test(
      lower
    )
  ) {
    return { qty: 1, unitMultiplier, detectedUnit };
  }
  if (/\b(?:sekarton|sedus)\b/i.test(lower)) {
    return { qty: 1, unitMultiplier: 12, detectedUnit: 'karton' };
  }

  // Word numbers
  const numberWords: Record<string, number> = {
    'dua puluh': 20,
    'lima belas': 15,
    'dua belas': 12,
    'sepuluh': 10,
    'sembilan': 9,
    'delapan': 8,
    'tujuh': 7,
    'enam': 6,
    'lima': 5,
    'empat': 4,
    'tiga': 3,
    'dua': 2,
    'satu': 1,
  };

  for (const [w, val] of Object.entries(numberWords)) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) {
      return { qty: val, unitMultiplier, detectedUnit };
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
  const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : 2026;

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

  const monthNum = months[monthName] || 11;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${year}-${pad(monthNum)}-${pad(day)}`;
}

// -------------------------------------------------------------
// 5. Fuzzy Product Matcher (Dynamic Store Catalog Injected)
// -------------------------------------------------------------
function findBestMatchingProduct(clause: string, catalog: Product[]): Product | null {
  const lowerClause = clause.toLowerCase();
  let bestProduct: Product | null = null;
  let highestScore = 0;

  for (const prod of catalog) {
    const prodNameLower = prod.name.toLowerCase();
    let score = 0;

    // 1. Exact full name match
    if (lowerClause.includes(prodNameLower)) {
      score += 50;
    }

    // 2. Automated Alias Generation from Product Name & Category
    const aliases: string[] = [];

    if (/kopi susu/i.test(prodNameLower)) {
      aliases.push('kopsu', 'kopi susu', 'es kopi', 'kopi aren', 'kopsu aren', 'kopsus');
    }
    if (/macchiato/i.test(prodNameLower)) {
      aliases.push('macchiato', 'karamel macchiato', 'caramel macchiato');
    }
    if (/roti bakar/i.test(prodNameLower)) {
      aliases.push('roti bakar', 'roti keju', 'roti coklat', 'roti');
    }
    if (/croissant/i.test(prodNameLower)) {
      aliases.push('croissant', 'kroisan', 'butter croissant');
    }
    if (/susu uht/i.test(prodNameLower) || /diamond/i.test(prodNameLower)) {
      aliases.push('susu uht', 'susu diamond', 'uht diamond', 'susu full cream', 'susu kotak');
    }
    if (/arabika/i.test(prodNameLower) || /gayo/i.test(prodNameLower) || /biji kopi/i.test(prodNameLower)) {
      aliases.push('biji kopi', 'arabika', 'kopi gayo', 'beans');
    }
    if (/paper cup/i.test(prodNameLower) || /cup dingin/i.test(prodNameLower)) {
      aliases.push('paper cup', 'cup dingin', 'gelas cup', 'cup 12oz', 'tutup cup', 'paper cup dingin');
    }
    if (/gula aren/i.test(prodNameLower)) {
      aliases.push('gula aren cair', 'sirup aren', 'gula aren organik', 'sirup gula aren');
    }
    if (/ayam/i.test(prodNameLower)) {
      aliases.push('ayam', 'daging ayam', 'ayam potong', 'karkas ayam', 'ayam segar');
    }
    if (/sayur/i.test(prodNameLower)) {
      aliases.push('sayur', 'sayuran', 'selada', 'tomat');
    }

    // Dynamic aliases: extract keywords with length >= 3
    const cleanTokens = prodNameLower
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length >= 3);
    cleanTokens.forEach((t) => aliases.push(t));

    // Check alias matching
    for (const alias of aliases) {
      if (new RegExp(`\\b${alias}\\b`, 'i').test(lowerClause)) {
        score += 15 + alias.length;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestProduct = prod;
    }
  }

  // Must have a meaningful match score
  return highestScore >= 12 ? bestProduct : null;
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

  // Strip common command and action words
  let clean = lower
    .replace(/\b(?:tambah|tambahkan|tambahin|stok|barang|bahan|masuk|kulakan|beli|nyetok|restok|laku|jual)\b/gi, '')
    .replace(/\b(?:sebanyak|seharga|harga|rp|ribu|rebu|rb|k|ekor|pcs|cup|porsi|kg|liter|bal|kotak|bungkus)\b/gi, '')
    .replace(/\d+/g, '')
    .trim();

  // Clean extra spaces
  clean = clean.replace(/\s+/g, ' ').trim();

  // Capitalize name
  const name = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Barang Baru';

  // Infer category, subcategory, unit & default price
  if (/\b(?:ayam|daging|sapi|bebek|ikan|kambing)\b/i.test(clean)) {
    return {
      name: name || 'Daging Ayam',
      category: 'Bahan Baku',
      subcategory: 'Ayam & Daging',
      suggestedUnit: /\bekor\b/i.test(lower) ? 'ekor' : 'kg',
      defaultPrice: 35000,
    };
  }

  if (/\b(?:sayur|sayuran|selada|tomat|bayam|wortel|cabe|cabai|bawang)\b/i.test(clean)) {
    return {
      name: name || 'Sayuran Segar',
      category: 'Bahan Baku',
      subcategory: 'Sayur & Buah',
      suggestedUnit: 'kg',
      defaultPrice: 18000,
    };
  }

  if (/\b(?:susu|keju|butter|mentega|yogurt)\b/i.test(clean)) {
    return {
      name: name || 'Susu UHT',
      category: 'Bahan Baku',
      subcategory: 'Susu & Dairy',
      suggestedUnit: 'liter',
      defaultPrice: 19500,
    };
  }

  if (/\b(?:cup|gelas|sedotan|plastik|kresek|kantong|kotak|box|paper)\b/i.test(clean)) {
    return {
      name: name || 'Kemasan Toko',
      category: 'Kemasan & Cup',
      subcategory: 'Cup & Tutup',
      suggestedUnit: 'pcs',
      defaultPrice: 1200,
    };
  }

  return {
    name: name || 'Produk Baru',
    category: 'Bahan Baku',
    subcategory: 'Lainnya',
    suggestedUnit: 'pcs',
    defaultPrice: 20000,
  };
}

// -------------------------------------------------------------
// 7. Main Parsing Engine (Runs 100% Client-side with 0 Token Cost)
// -------------------------------------------------------------
export function parseOmniboxInput(
  rawInput: string,
  existingProducts: Product[],
  categoryDefinitions?: CategoryDefinition[]
): ConfirmationDraft {
  // 1. Run autocorrect and speech glitch sanitization
  const feedback = autocorrectIndonesianVoice(rawInput);
  const text = feedback.cleanedText;

  // Multi-clause splitting: Handles 1, 2, 3, 4, or any number of conditions/clauses!
  // Splits by period, semicolon, newline, comma, or spoken transition conjunctions
  const normalizedForSplit = text
    .replace(/(?:\.|\;|\n|\r\n)+/g, ' [SPLIT] ')
    .replace(/\b(?:dan|terus|trus|lalu|kemudian|sama|plus|serta|jadinya|juga|habis itu|setelah itu)\b/gi, ' [SPLIT] ');

  const rawClauses = normalizedForSplit
    .split(/\s*\[SPLIT\]\s*|,\s*/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const clauses = rawClauses.length > 0 ? rawClauses : [text];

  const cashChanges: ConfirmationDraft['cashChanges'] = [];
  const stockChanges: ConfirmationDraft['stockChanges'] = [];
  const categoryChanges: CategoryChangeDraft[] = [];
  const explanations: string[] = [];

  // Helper to process a single clause
  const processClause = (clause: string) => {
    const clLower = clause.toLowerCase();
    const explicitAmount = parseIndonesianSpokenAmount(clause);
    const { qty: rawQty, unitMultiplier, detectedUnit } = extractSpokenQuantity(clause);
    const matchedProduct = findBestMatchingProduct(clause, existingProducts);
    const expiryDate = extractSpokenExpiryDate(clause);

    // ---------------------------------------------------------
    // CASE 0: CATEGORY OR SUB-CATEGORY ADDITION INTENT
    // e.g. "Tambahkan kategori baru Susu UHT"
    // e.g. "Tambahkan sub-kategori ayam di bahan baku"
    // ---------------------------------------------------------
    const isCategoryIntent =
      /\b(?:tambah|tambahkan|tambahin|buat|bikin)\s+(?:kategori|subkategori|sub-kategori|sub kategori)\b/i.test(
        clLower
      ) || /\b(?:kategori baru|sub-kategori baru|subkategori baru)\b/i.test(clLower);

    if (isCategoryIntent) {
      const isSub = /\b(?:subkategori|sub-kategori|sub kategori)\b/i.test(clLower);

      let extractedName = clause
        .replace(
          /\b(?:tambah|tambahkan|tambahin|buat|bikin|kategori|subkategori|sub-kategori|sub kategori|baru|di kategori|pada kategori|di|pada)\b/gi,
          ''
        )
        .replace(/^(?:baru)\s+/i, '')
        .trim();

      let mainCat = 'Bahan Baku & Dapur';
      let subCat = '';

      if (isSub) {
        if (/bahan baku|dapur/i.test(clause)) mainCat = 'Bahan Baku & Dapur';
        else if (/produk|menu|jual/i.test(clause)) mainCat = 'Produk Siap Jual';
        else if (/kemasan|packaging|cup/i.test(clause)) mainCat = 'Kemasan & Packaging';
        else if (/operasional|utilitas|listrik/i.test(clause)) mainCat = 'Operasional & Utilitas';
        else if (/peralatan|mesin|aset/i.test(clause)) mainCat = 'Peralatan & Aset Toko';
        else if (/jasa|layanan/i.test(clause)) mainCat = 'Jasa & Layanan';

        subCat = extractedName
          .replace(/\b(?:bahan baku|dapur|produk siap jual|produk|kemasan|packaging|operasional|peralatan|jasa)\b/gi, '')
          .trim();
        if (!subCat) subCat = 'Kategori Baru';
      } else {
        mainCat = extractedName || 'Kategori Baru';
      }

      const formatTitle = (str: string) =>
        str
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

      mainCat = formatTitle(mainCat);
      if (subCat) subCat = formatTitle(subCat);

      categoryChanges.push({
        mainCategory: mainCat,
        subcategory: isSub ? subCat : undefined,
        action: isSub ? 'add_sub' : 'add_main',
        description: isSub
          ? `Menambahkan Sub-Kategori "${subCat}" di bawah Kategori Utama "${mainCat}"`
          : `Menambahkan Kategori Utama Baru "${mainCat}"`,
      });

      explanations.push(
        isSub
          ? `🏷️ Sub-Kategori Baru: Menambahkan "${subCat}" pada "${mainCat}" ke dalam sistem.`
          : `🏷️ Kategori Baru: Menambahkan "${mainCat}" ke dalam sistem kategori.`
      );

      return;
    }

    // ---------------------------------------------------------
    // INTENT DISAMBIGUATION (MULTI-CONDITION RESILIENT)
    // ---------------------------------------------------------
    const hasBeliOrBelanja = /\b(?:beli|belanja|pesan pasokan|order pasokan)\b/i.test(clLower);
    const hasNambahStok =
      /\b(?:tambah|tambahkan|tambahin|nambah|masuk|masukkan|masukin)\s+(?:stok|barang|bahan)?/i.test(clLower) ||
      /\b(?:stok\s+(?:nambah|bertambah|masuk))\b/i.test(clLower);
    const hasRestockKeywords = /\b(?:kulakan|nyetok|restok|restock|pasok|pasokan)\b/i.test(clLower);

    // Restock Intent:
    // 1. Explicit restock keywords
    // 2. Add stock phrasing ("tambah stok", "stok nambah 6")
    // 3. "Beli [Barang]" where product or ingredient is matched
    const isRestock =
      hasRestockKeywords ||
      hasNambahStok ||
      (hasBeliOrBelanja &&
        (matchedProduct !== null ||
          /\b(?:ayam|daging|telur|susu|kopi|sayur|minyak|beras|tepung|cup|sedotan|kemasan|roti|ikan|bumbu)\b/i.test(
            clLower
          )));

    // Sale Intent: user SOLD something (-Stok, +Kas)
    const isSale =
      !isRestock &&
      /\b(?:laku|kejual|terjual|jual|penjualan|ada yang beli|dibeli|order|orderan|pesan|pesanan|tumbas)\b/i.test(
        clLower
      );

    // Loss / Waste Intent (-Stok, 0 Kas)
    const isLoss = /\b(?:basi|expired|kadaluarsa|kedaluwarsa|rusak|pecah|dibuang|tumpah|hilang|buang|sisa kemarin)\b/i.test(
      clLower
    );

    // Explicit Expense Intent (-Kas, 0 Stok)
    const isExplicitExpense =
      !isRestock &&
      !isSale &&
      /\b(?:bayar|ongkir|bensin|listrik|token|pulsa|wifi|es batu|parkir|gaji|galon|kebersihan)\b/i.test(
        clLower
      );

    // ---------------------------------------------------------
    // CASE 1: RESTOCK / TAMBAH STOK (Stok Bertambah +)
    // ---------------------------------------------------------
    if (isRestock) {
      if (matchedProduct) {
        const finalQty =
          /\b(?:dus|karton)\b/i.test(clLower) &&
          (matchedProduct.unit === 'pcs' || matchedProduct.unit === 'kotak' || matchedProduct.unit === 'liter')
            ? rawQty * unitMultiplier
            : rawQty > 0
            ? rawQty
            : 1;

        // Deduplication check: If this exact product and quantity were already restocked in a predecessor clause
        // (e.g. "tadi gue beli ayam 6" followed by "jadinya stok nambah 6 ayam"):
        const alreadyRestocked = stockChanges.some(
          (s) => s.productName.toLowerCase() === matchedProduct.name.toLowerCase() && s.quantityDelta === finalQty
        );
        if (alreadyRestocked) {
          // Already handled by the purchase clause!
          return;
        }

        const totalCost = explicitAmount > 0 ? explicitAmount : finalQty * matchedProduct.hppAmount;

        // Always record cash expense when buying/restocking
        cashChanges.push({
          type: 'expense',
          amount: totalCost,
          category: matchedProduct.category || 'Bahan Baku & Dapur',
          description: `Kulakan ${finalQty} ${
            /\b(?:dus|karton)\b/i.test(clLower) ? 'dus' : matchedProduct.unit
          } ${matchedProduct.name}`,
        });

        stockChanges.push({
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          category: matchedProduct.category,
          unit: matchedProduct.unit,
          location: matchedProduct.location,
          quantityDelta: finalQty, // POSITIVE! Always adds stock
          pricePerUnit: Math.round(totalCost / (finalQty || 1)),
          expiryDate: expiryDate || matchedProduct.expiryDate || undefined,
        });

        explanations.push(
          `📦 Kulakan & Penambahan Stok ${matchedProduct.name}: Stok Gudang Bertambah (+${finalQty} ${
            matchedProduct.unit
          }), Pengeluaran Kas (-Rp ${totalCost.toLocaleString('id-ID')})${
            expiryDate ? ` [Kedaluwarsa: ${expiryDate}]` : ''
          }`
        );
        return;
      } else {
        // Product NOT YET in catalog (e.g. "Tambahkan stok ayam 6 ekor")
        const itemInfo = extractUnregisteredItemDetails(clause);
        const finalQty = rawQty > 0 ? rawQty : 1;
        const finalUnit = detectedUnit !== 'pcs' ? detectedUnit : itemInfo.suggestedUnit;

        // Deduplication check
        const alreadyRestocked = stockChanges.some(
          (s) => s.productName.toLowerCase() === itemInfo.name.toLowerCase() && s.quantityDelta === finalQty
        );
        if (alreadyRestocked) return;

        const totalCost = explicitAmount > 0 ? explicitAmount : finalQty * itemInfo.defaultPrice;

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
          quantityDelta: finalQty, // POSITIVE!
          pricePerUnit: Math.round(totalCost / finalQty),
          expiryDate: expiryDate || undefined,
          isNewProduct: true,
        });

        explanations.push(
          `📦 Kulakan Barang Baru (${itemInfo.name}): Gudang Bertambah (+${finalQty} ${finalUnit}), Pengeluaran Kas (-Rp ${totalCost.toLocaleString(
            'id-ID'
          )})${expiryDate ? ` [Kedaluwarsa: ${expiryDate}]` : ''}`
        );
        return;
      }
    }

    // ---------------------------------------------------------
    // CASE 2: PRODUCT SALE (Kas Masuk + Stok Berkurang -)
    // ---------------------------------------------------------
    if (isSale) {
      if (matchedProduct) {
        const finalQty = rawQty;
        const totalAmount = explicitAmount > 0 ? explicitAmount : finalQty * matchedProduct.sellingPrice;

        // Stock Sufficiency Validation
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
          quantityDelta: -finalQty, // BERKURANG di gudang!
          pricePerUnit: matchedProduct.sellingPrice,
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
            `⚠️ STOK TIDAK MENCUKUPI: ${matchedProduct.name} hanya ada ${matchedProduct.currentStock} ${matchedProduct.unit} di gudang, sedangkan penjualan diminta ${finalQty} ${matchedProduct.unit} (Kurang ${shortage} ${matchedProduct.unit}).`
          );
        } else {
          explanations.push(
            `✅ Penjualan ${finalQty} ${matchedProduct.unit} ${matchedProduct.name}: Kas Masuk (+Rp ${totalAmount.toLocaleString(
              'id-ID'
            )}), Stok Gudang Berkurang (-${finalQty} ${matchedProduct.unit})`
          );
        }
        return;
      } else {
        // Unregistered product sale
        const itemInfo = extractUnregisteredItemDetails(clause);
        const finalQty = rawQty > 0 ? rawQty : 1;
        const totalAmount = explicitAmount > 0 ? explicitAmount : finalQty * itemInfo.defaultPrice;

        cashChanges.push({
          type: 'income',
          amount: totalAmount,
          category: 'Penjualan',
          description: `Penjualan ${finalQty} ${detectedUnit} ${itemInfo.name}`,
        });

        explanations.push(
          `✅ Penjualan ${itemInfo.name}: Kas Masuk (+Rp ${totalAmount.toLocaleString('id-ID')})`
        );
        return;
      }
    }

    // ---------------------------------------------------------
    // CASE 3: PRODUCT LOSS / BASI / EXPIRED (Hanya Stok Berkurang -)
    // ---------------------------------------------------------
    if (isLoss) {
      if (matchedProduct) {
        const finalQty = rawQty;
        stockChanges.push({
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          category: matchedProduct.category,
          unit: matchedProduct.unit,
          quantityDelta: -finalQty, // Stok Berkurang
          pricePerUnit: matchedProduct.hppAmount,
        });

        explanations.push(
          `⚠️ Barang Rusak/Basi: Stok ${matchedProduct.name} berkurang -${finalQty} ${matchedProduct.unit} (Kas tidak terpengaruh)`
        );
        return;
      } else {
        const itemInfo = extractUnregisteredItemDetails(clause);
        const finalQty = rawQty > 0 ? rawQty : 1;
        stockChanges.push({
          productName: itemInfo.name,
          category: itemInfo.category,
          unit: detectedUnit !== 'pcs' ? detectedUnit : itemInfo.suggestedUnit,
          quantityDelta: -finalQty,
          pricePerUnit: itemInfo.defaultPrice,
        });

        explanations.push(
          `⚠️ Barang Rusak/Basi: Stok ${itemInfo.name} berkurang -${finalQty} ${detectedUnit}`
        );
        return;
      }
    }

    // ---------------------------------------------------------
    // CASE 4: GENERAL OPERATIONAL EXPENSE (Belanja Non-Stok)
    // e.g. "bayar listrik 150rb", "beli es batu 20 ribu", "beli sedotan 25k"
    // ---------------------------------------------------------
    if (isExplicitExpense || (explicitAmount > 0 && !matchedProduct)) {
      const amount = explicitAmount > 0 ? explicitAmount : 20000;
      let cat = 'Operasional';

      if (/es batu|gas|air|galon|gula|minyak/i.test(clLower)) cat = 'Bahan Baku';
      else if (/sedotan|plastik|kresek|cup|paper|kantong/i.test(clLower)) cat = 'Kemasan & Cup';
      else if (/listrik|token|pulsa|wifi|bensin|parkir|ongkir|kebersihan/i.test(clLower)) cat = 'Operasional';

      const desc = clause.replace(/^(?:lalu|dan|sama|terus)\s+/i, '').trim();

      cashChanges.push({
        type: 'expense',
        amount,
        category: cat,
        description: desc.charAt(0).toUpperCase() + desc.slice(1),
      });

      explanations.push(
        `💸 Pengeluaran Kas: -Rp ${amount.toLocaleString('id-ID')} untuk ${desc} (${cat})`
      );
      return;
    }

    // ---------------------------------------------------------
    // CASE 5: PRODUCT MATCHED WITH NO EXPLICIT ACTION
    // Default to Sale if context implies store checkout, or prompt clearly
    // ---------------------------------------------------------
    if (matchedProduct) {
      const finalQty = rawQty;
      const totalAmount = explicitAmount > 0 ? explicitAmount : finalQty * matchedProduct.sellingPrice;

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
        quantityDelta: -finalQty,
        pricePerUnit: matchedProduct.sellingPrice,
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
          `⚠️ STOK TIDAK MENCUKUPI: Sisa stok ${matchedProduct.name} hanya ${matchedProduct.currentStock} ${matchedProduct.unit} (Kurang ${shortage} ${matchedProduct.unit}).`
        );
      } else {
        explanations.push(
          `Penjualan ${finalQty} ${matchedProduct.unit} ${matchedProduct.name}: Kas (+Rp ${totalAmount.toLocaleString(
            'id-ID'
          )}), Stok Gudang (-${finalQty} ${matchedProduct.unit})`
        );
      }
      return;
    }
  };

  // Process all parsed clauses
  clauses.forEach((c) => processClause(c));

  // If nothing was caught, construct an honest, non-bogus draft
  if (cashChanges.length === 0 && stockChanges.length === 0 && categoryChanges.length === 0) {
    const fallbackAmount = parseIndonesianSpokenAmount(text);
    if (fallbackAmount > 0) {
      cashChanges.push({
        type: 'income',
        amount: fallbackAmount,
        category: 'Penjualan',
        description: text || 'Catatan Transaksi Suara',
      });
      explanations.push(`Mencatat transaksi kas Rp ${fallbackAmount.toLocaleString('id-ID')}`);
    } else {
      explanations.push(
        `AI mendengarkan: "${text}". Draf telah disiapkan, Anda dapat memilih atau mengoreksi rincian sebelum disimpan.`
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
 * Simulates Gemini Vision API receipt extraction with rich line items
 */
export function parseReceiptImage(
  receiptName: string,
  existingProducts: Product[]
): ConfirmationDraft {
  const ocrItems = [
    {
      name: 'Susu UHT Diamond Full Cream 1L',
      qty: 12,
      unit: 'kotak',
      pricePerUnit: 16500,
      subtotal: 198000,
      expiryDate: '2026-11-20',
      category: 'Bahan Baku',
    },
    {
      name: 'Gula Aren Cair Organik 1L',
      qty: 6,
      unit: 'botol',
      pricePerUnit: 24000,
      subtotal: 144000,
      expiryDate: '2027-02-15',
      category: 'Bahan Baku',
    },
    {
      name: 'Paper Cup Dingin 12oz',
      qty: 100,
      unit: 'pcs',
      pricePerUnit: 850,
      subtotal: 85000,
      expiryDate: undefined,
      category: 'Kemasan & Cup',
    },
  ];

  const totalReceipt = ocrItems.reduce((sum, item) => sum + item.subtotal, 0);

  const stockChanges = ocrItems.map((item) => {
    const matched = existingProducts.find(
      (p) =>
        p.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(p.name.toLowerCase())
    );

    return {
      productId: matched?.id,
      productName: matched?.name || item.name,
      category: matched?.category || item.category,
      unit: matched?.unit || item.unit,
      quantityDelta: item.qty, // adding stock!
      pricePerUnit: item.pricePerUnit,
      expiryDate: item.expiryDate,
      isNewProduct: !matched,
    };
  });

  return {
    id: `draft-ocr-${Date.now()}`,
    source: 'photo_receipt',
    title: 'Konfirmasi Hasil Pindai Nota Grosir (OCR)',
    explanation: `Terdeteksi 3 jenis barang belanjaan dari nota dengan total belanja Rp ${totalReceipt.toLocaleString(
      'id-ID'
    )}. Sistem akan mencatat Kas Keluar sekaligus menambahkan stok barang ke Gudang secara otomatis.`,
    cashChanges: [
      {
        type: 'expense',
        amount: totalReceipt,
        category: 'Bahan Baku',
        description: `Belanja Kulakan Grosir (${receiptName || 'Nota Agen Berkah'})`,
      },
    ],
    stockChanges,
    originalInput: `Pindai Foto Nota: ${receiptName || 'Struk_Kulakan_Agen.jpg'}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
}
