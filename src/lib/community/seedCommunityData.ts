import { CommunityPost, PublicStoreProfile } from '@/types';

export const SEED_COMMUNITY_PROFILES: PublicStoreProfile[] = [
  {
    userId: 'seed-store-braga-roastery',
    storeName: 'Roemah Kopi Braga',
    handle: 'roemahkopibraga',
    ownerName: 'Raka Pratama',
    businessCategory: 'Kafe & Kopi',
    bio: 'Kedai kopi sangrai mandiri & racikan gula aren asli Priangan. Menerima suplai biji kopi espresso blend untuk sesama kafe UMKM.',
    logoUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    operatingHours: 'Setiap Hari, 07.30 - 22.00 WIB',
    province: 'Jawa Barat',
    city: 'Bandung',
    address: 'Jl. Braga No. 48, Sumur Bandung, Kota Bandung',
    latitude: -6.9178,
    longitude: 107.6095,
    phone: '081223344556',
    showPublicCatalog: true,
    showWhatsappPublic: true,
    showMapPublic: true,
    isSeedPartner: true,
    joinedAt: '2026-08-12T08:00:00.000Z',
    showcaseProducts: [
      {
        id: 'seed-prod-kopi-1',
        name: 'Es Kopi Susu Priangan 1 Liter',
        category: 'Produk Siap Jual',
        subcategory: 'Minuman Botol',
        imageUrl:
          'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 68000,
        unit: 'liter',
        publicDescription: 'Racikan double ristretto Arabika Puntang dengan gula aren organik.',
      },
      {
        id: 'seed-prod-kopi-2',
        name: 'House Blend Arabika Malabar 250g',
        category: 'Produk Siap Jual',
        subcategory: 'Roasted Beans',
        imageUrl:
          'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 85000,
        unit: 'bungkus',
        publicDescription: 'Medium roast notes cokelat, karamel, dan sitrus lembut.',
      },
      {
        id: 'seed-prod-kopi-3',
        name: 'Uji Matcha Oat Latte',
        category: 'Produk Siap Jual',
        subcategory: 'Non-Coffee',
        imageUrl:
          'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 28000,
        unit: 'cup',
        publicDescription: 'Matcha seremonial Jepang berpadu susu gandum creamy.',
      },
    ],
  },
  {
    userId: 'seed-store-roti-menteng',
    storeName: 'Artisan Roti Senja',
    handle: 'artisanrotisenja',
    ownerName: 'Nadia Kusuma',
    businessCategory: 'Roti, Kue & Dessert',
    bio: 'Sourdough & butter pastry dipanggang segar setiap subuh tanpa pengawet. Siap kolaborasi pasokan pastry harian untuk coffee shop Jabodetabek.',
    logoUrl:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
    operatingHours: 'Selasa - Minggu, 07.00 - 20.00 WIB',
    province: 'DKI Jakarta',
    city: 'Jakarta Selatan',
    address: 'Jl. Cipete Raya No. 19, Cilandak, Jakarta Selatan',
    latitude: -6.2768,
    longitude: 106.8031,
    phone: '081388990011',
    showPublicCatalog: true,
    showWhatsappPublic: true,
    showMapPublic: true,
    isSeedPartner: true,
    joinedAt: '2026-09-03T09:00:00.000Z',
    showcaseProducts: [
      {
        id: 'seed-prod-roti-1',
        name: 'French Butter Croissant',
        category: 'Produk Siap Jual',
        subcategory: 'Viennoiserie',
        imageUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 24000,
        unit: 'pcs',
        publicDescription: 'Renyah berlapis dengan mentega fermentasi pilihan.',
      },
      {
        id: 'seed-prod-roti-2',
        name: 'Country Sourdough Loaf',
        category: 'Produk Siap Jual',
        subcategory: 'Artisan Bread',
        imageUrl:
          'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 52000,
        unit: 'pcs',
        publicDescription: 'Fermentasi alami 28 jam, ramah pencernaan & rendah indeks glikemik.',
      },
    ],
  },
  {
    userId: 'seed-store-tenun-jogja',
    storeName: 'Karsa Wastra Studio',
    handle: 'karsawastra',
    ownerName: 'Dimas Wibowo',
    businessCategory: 'Fashion & Pakaian',
    bio: 'Busana kasual harian berbahan katun linen & tenun lurik ATBM pengrajin Yogyakarta. Nyaman dipakai kerja maupun santai.',
    logoUrl:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&auto=format&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    operatingHours: 'Senin - Sabtu, 09.00 - 21.00 WIB',
    province: 'DI Yogyakarta',
    city: 'Yogyakarta',
    address: 'Jl. Prawirotaman II No. 14, Mergangsan, Yogyakarta',
    latitude: -7.8191,
    longitude: 110.3712,
    phone: '081977665544',
    showPublicCatalog: true,
    showWhatsappPublic: true,
    showMapPublic: true,
    isSeedPartner: true,
    joinedAt: '2026-09-18T10:00:00.000Z',
    showcaseProducts: [
      {
        id: 'seed-prod-fash-1',
        name: 'Kemeja Overshirt Lurik Sage',
        category: 'Produk Siap Jual',
        subcategory: 'Atasan Pria & Wanita',
        imageUrl:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 239000,
        unit: 'pcs',
        publicDescription: 'Potongan rileks uniseks dari tenun tangan asli Klaten & Jogja.',
      },
      {
        id: 'seed-prod-fash-2',
        name: 'Tote Bag Kanvas Tenun Nusantara',
        category: 'Produk Siap Jual',
        subcategory: 'Tas & Aksesoris',
        imageUrl:
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 129000,
        unit: 'pcs',
        publicDescription: 'Muat laptop 14 inci dengan saku dalam beritsleting.',
      },
    ],
  },
  {
    userId: 'seed-store-sambal-sby',
    storeName: 'Dapur Rempah Bu Rini',
    handle: 'dapurrempahburini',
    ownerName: 'Hj. Rini Wahyuni',
    businessCategory: 'Kuliner & Rumah Makan',
    bio: 'Spesialis sambal kemangi asap, bebek ungkep vakum, dan lauk siap saji khas Jawa Timur tanpa MSG tambahan. Kirim seluruh Indonesia.',
    logoUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&auto=format&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    operatingHours: 'Senin - Minggu, 08.00 - 20.00 WIB',
    province: 'Jawa Timur',
    city: 'Surabaya',
    address: 'Jl. Dharmawangsa No. 82, Gubeng, Surabaya',
    latitude: -7.2742,
    longitude: 112.7563,
    phone: '081555667788',
    showPublicCatalog: true,
    showWhatsappPublic: true,
    showMapPublic: true,
    isSeedPartner: true,
    joinedAt: '2026-10-01T07:00:00.000Z',
    showcaseProducts: [
      {
        id: 'seed-prod-kul-1',
        name: 'Sambal Bawang Asap Botol Kaca',
        category: 'Produk Siap Jual',
        subcategory: 'Sambal Kemasan',
        imageUrl:
          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 36000,
        unit: 'pcs',
        publicDescription: 'Dimasak perlahan 4 jam dengan minyak kelapa murni, tahan 3 bulan segel.',
      },
      {
        id: 'seed-prod-kul-2',
        name: 'Bebek Ungkep Bumbu Hitam Vakum',
        category: 'Produk Siap Jual',
        subcategory: 'Frozen Lauk',
        imageUrl:
          'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 92000,
        unit: 'paket',
        publicDescription: 'Isi 4 potong besar + bumbu hitam Madura & sambal korek.',
      },
    ],
  },
  {
    userId: 'seed-store-keramik-malang',
    storeName: 'Tanah Liat Studio',
    handle: 'tanahliatstudio',
    ownerName: 'Ayu Saraswati',
    businessCategory: 'Kerajinan & Kreatif',
    bio: 'Keramik stoneware buatan tangan untuk cangkir kafe, piring saji restoran, dan suvenir korporat.',
    logoUrl:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&auto=format&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=1200&auto=format&fit=crop&q=80',
    operatingHours: 'Senin - Sabtu, 09.00 - 17.30 WIB',
    province: 'Jawa Timur',
    city: 'Malang',
    address: 'Jl. Ijen Nirwana No. 11, Klojen, Kota Malang',
    latitude: -7.973,
    longitude: 112.624,
    phone: '081700112233',
    showPublicCatalog: true,
    showWhatsappPublic: true,
    showMapPublic: true,
    isSeedPartner: true,
    joinedAt: '2026-10-12T11:00:00.000Z',
    showcaseProducts: [
      {
        id: 'seed-prod-kriya-1',
        name: 'Cangkir Cappuccino Stoneware 220ml',
        category: 'Produk Siap Jual',
        subcategory: 'Tableware Kafe',
        imageUrl:
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 75000,
        unit: 'pcs',
        publicDescription: 'Glasir hijau sage natural, tahan dishwasher & microwave.',
      },
    ],
  },
];

export const SEED_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'seed-post-1',
    userId: 'seed-store-braga-roastery',
    storeName: 'Roemah Kopi Braga',
    storeHandle: 'roemahkopibraga',
    storeLogoUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80',
    businessCategory: 'Kafe & Kopi',
    city: 'Bandung',
    province: 'Jawa Barat',
    postType: 'new_product',
    caption:
      'Batch sangrai minggu ini baru turun dari mesin! House Blend Arabika Malabar 250g siap kirim untuk teman-teman kedai kopi yang cari karakter manis karamel & cokelat tebal. Boleh mampir icip dulu di Braga! #kopilokal #roastery #bandung #umkmindonesia',
    imageUrls: [
      'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=900&auto=format&fit=crop&q=80',
    ],
    hashtags: ['kopilokal', 'roastery', 'bandung', 'umkmindonesia'],
    taggedProducts: [
      {
        id: 'seed-prod-kopi-2',
        name: 'House Blend Arabika Malabar 250g',
        category: 'Produk Siap Jual',
        subcategory: 'Roasted Beans',
        imageUrl:
          'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 85000,
        unit: 'bungkus',
      },
    ],
    likedByUserIds: ['seed-store-roti-menteng', 'seed-store-keramik-malang'],
    comments: [
      {
        id: 'seed-cmt-1',
        postId: 'seed-post-1',
        userId: 'seed-store-roti-menteng',
        storeName: 'Artisan Roti Senja',
        storeHandle: 'artisanrotisenja',
        storeLogoUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=80',
        content: 'Cocok banget dipasangin sama butter croissant pagi-pagi kak! Sukses terus sangrainya.',
        createdAt: '2026-11-07T09:30:00.000Z',
      },
    ],
    createdAt: '2026-11-07T08:15:00.000Z',
  },
  {
    id: 'seed-post-2',
    userId: 'seed-store-roti-menteng',
    storeName: 'Artisan Roti Senja',
    storeHandle: 'artisanrotisenja',
    storeLogoUrl:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=80',
    businessCategory: 'Roti, Kue & Dessert',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postType: 'collab',
    caption:
      'Halo pemilik coffee shop area Jakarta Selatan & Tangerang! Bulan ini dapur kami buka 4 slot suplai pastry B2B pagi hari (diantar sebelum jam 07.00 WIB). Cek etalase profil kami untuk harga & varian ya! #bakery #kolaborasiumkm #jakartaselatan #croissant',
    imageUrls: [
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=900&auto=format&fit=crop&q=80',
    ],
    hashtags: ['bakery', 'kolaborasiumkm', 'jakartaselatan', 'croissant'],
    taggedProducts: [
      {
        id: 'seed-prod-roti-1',
        name: 'French Butter Croissant',
        category: 'Produk Siap Jual',
        subcategory: 'Viennoiserie',
        imageUrl:
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 24000,
        unit: 'pcs',
      },
    ],
    likedByUserIds: ['seed-store-braga-roastery', 'seed-store-tenun-jogja', 'seed-store-sambal-sby'],
    comments: [],
    createdAt: '2026-11-07T14:20:00.000Z',
  },
  {
    id: 'seed-post-3',
    userId: 'seed-store-tenun-jogja',
    storeName: 'Karsa Wastra Studio',
    storeHandle: 'karsawastra',
    storeLogoUrl:
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&auto=format&fit=crop&q=80',
    businessCategory: 'Fashion & Pakaian',
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    postType: 'story',
    caption:
      'Koleksi warna hijau sage musim ini tenun langsung bareng ibu-ibu penenun ATBM di Klaten & Jogja. Adem dipakai seharian dan tetap rapi buat meeting. #wastra #fashionlokal #yogyakarta #lurikmodern',
    imageUrls: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=80',
    ],
    hashtags: ['wastra', 'fashionlokal', 'yogyakarta', 'lurikmodern'],
    taggedProducts: [
      {
        id: 'seed-prod-fash-1',
        name: 'Kemeja Overshirt Lurik Sage',
        category: 'Produk Siap Jual',
        subcategory: 'Atasan Pria & Wanita',
        imageUrl:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 239000,
        unit: 'pcs',
      },
    ],
    likedByUserIds: ['seed-store-keramik-malang'],
    comments: [],
    createdAt: '2026-11-08T03:45:00.000Z',
  },
  {
    id: 'seed-post-4',
    userId: 'seed-store-sambal-sby',
    storeName: 'Dapur Rempah Bu Rini',
    storeHandle: 'dapurrempahburini',
    storeLogoUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&auto=format&fit=crop&q=80',
    businessCategory: 'Kuliner & Rumah Makan',
    city: 'Surabaya',
    province: 'Jawa Timur',
    postType: 'promo',
    caption:
      'Alhamdulillah 150 botol Sambal Bawang Asap hari ini siap meluncur! Buat sesama anggota komunitas KASRA ada harga paket reseller khusus pembelian minimal 12 botol. #kulinersurabaya #sambalrumahan #resellerumkm',
    imageUrls: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=900&auto=format&fit=crop&q=80',
    ],
    hashtags: ['kulinersurabaya', 'sambalrumahan', 'resellerumkm'],
    taggedProducts: [
      {
        id: 'seed-prod-kul-1',
        name: 'Sambal Bawang Asap Botol Kaca',
        category: 'Produk Siap Jual',
        subcategory: 'Sambal Kemasan',
        imageUrl:
          'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
        sellingPrice: 36000,
        unit: 'pcs',
      },
    ],
    likedByUserIds: ['seed-store-braga-roastery'],
    comments: [],
    createdAt: '2026-11-08T06:10:00.000Z',
  },
];
