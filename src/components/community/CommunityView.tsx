'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { CommunityPost, CommunityPostType } from '@/types';
import {
  formatRupiah,
  formatRelativeTimeIndo,
  calculateDistanceKm,
} from '@/lib/utils';
import { compressImageFile } from '@/lib/imageUtils';
import {
  BUSINESS_CATEGORY_PRESETS,
  INDONESIA_CITY_PRESETS,
} from '@/lib/constants/businessCategories';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  Compass,
  Users,
  Store,
  Bookmark,
  Search,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  Briefcase,
  UserPlus,
  UserCheck,
  Send,
  Trash2,
  X,
  Image as ImageIcon,
  Package,
  RefreshCw,
  Navigation,
  Sparkles,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  ShieldCheck,
  Loader2,
  Radio,
  Calendar,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

type CommunityMainTab = 'explore' | 'following' | 'stores' | 'saved';

const POST_TYPE_META: Record<
  CommunityPostType,
  { label: string; badgeClass: string; liveBadgeClass: string }
> = {
  general: {
    label: 'Kabar Usaha',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    liveBadgeClass: 'bg-rose-500 text-white',
  },
  new_product: {
    label: 'Produk Baru',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    liveBadgeClass: 'bg-rose-500 text-white',
  },
  promo: {
    label: 'Promo & Diskon',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    liveBadgeClass: 'bg-rose-500 text-white',
  },
  collab: {
    label: 'Cari Mitra / Kolab',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    liveBadgeClass: 'bg-rose-500 text-white',
  },
  story: {
    label: 'Cerita Dapur',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    liveBadgeClass: 'bg-rose-500 text-white',
  },
};

function getBusinessCategoryEmoji(cat?: string): string {
  const c = (cat || '').toLowerCase();
  if (c.includes('kopi') || c.includes('kafe')) return '☕';
  if (c.includes('kuliner') || c.includes('makan')) return '🍱';
  if (c.includes('roti') || c.includes('kue') || c.includes('dessert')) return '🥐';
  if (c.includes('minuman')) return '🧋';
  if (c.includes('fashion') || c.includes('pakaian')) return '👗';
  if (c.includes('kelontong') || c.includes('sembako')) return '🛒';
  if (c.includes('kerajinan') || c.includes('kreatif')) return '🪴';
  if (c.includes('kecantikan') || c.includes('perawatan')) return '💄';
  if (c.includes('pertanian') || c.includes('sayur') || c.includes('buah')) return '🌿';
  if (c.includes('petshop') || c.includes('hewan')) return '🐾';
  if (c.includes('elektronik')) return '📱';
  if (c.includes('jasa') || c.includes('bengkel')) return '🛠️';
  return '💼';
}

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
];

export const CommunityView: React.FC = () => {
  const {
    profile,
    myPublicStoreProfile,
    finishedGoodsProducts,
    communityPosts,
    communityProfiles,
    followedStoreIds,
    bookmarkedPostIds,
    setSelectedStoreProfileId,
    getFollowerCount,
    getFollowingCount,
    createCommunityPost,
    deleteCommunityPost,
    toggleLikePost,
    addPostComment,
    deletePostComment,
    toggleFollowStore,
    toggleBookmarkPost,
    refreshCommunityFeed,
    setActiveTab,
    theme,
  } = useKasra();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const currentUid = user?.id || 'guest';

  // Feed Navigation & Dual Filter States
  const [activeFeedTab, setActiveFeedTab] = useState<CommunityMainTab>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusinessField, setSelectedBusinessField] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // GPS Nearby Filter State
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(() =>
    typeof profile.latitude === 'number' && typeof profile.longitude === 'number'
      ? { lat: profile.latitude, lng: profile.longitude }
      : null
  );
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  // Feed Interactions
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [deletePostTarget, setDeletePostTarget] = useState<CommunityPost | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Post Composer Modal States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<CommunityPostType>('general');
  const [composeCaption, setComposeCaption] = useState('');
  const [composeImages, setComposeImages] = useState<string[]>([]);
  const [composeTaggedProductIds, setComposeTaggedProductIds] = useState<string[]>([]);
  const composeFileRef = useRef<HTMLInputElement | null>(null);

  const primaryBtnClass = isDark
    ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
    : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6]';

  const darkBrownPillClass = isDark
    ? 'bg-[#FCF1D0] text-[#0D1C42] hover:opacity-90'
    : 'bg-[#3C332A] text-white hover:bg-[#2A231D]';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Dynamic Business Field Filter Options (Curated Presets + Any Custom Fields used by Stores)
  const businessFieldOptions = useMemo(() => {
    const baseList = BUSINESS_CATEGORY_PRESETS.map((b) => b.value);
    const customSet = new Set<string>();

    communityProfiles.forEach((p) => {
      const cat = (p.businessCategory || '').trim();
      if (
        cat &&
        !baseList.some((b) => b.toLowerCase() === cat.toLowerCase())
      ) {
        customSet.add(cat);
      }
    });
    communityPosts.forEach((post) => {
      const cat = (post.businessCategory || '').trim();
      if (
        cat &&
        !baseList.some((b) => b.toLowerCase() === cat.toLowerCase())
      ) {
        customSet.add(cat);
      }
    });

    return [...Array.from(customSet), ...baseList];
  }, [communityProfiles, communityPosts]);

  // Dynamic Region / City Filter Options (Active Store Cities first + Indonesia City Presets)
  const regionCityOptions = useMemo(() => {
    const activeCities = new Set<string>();
    communityProfiles.forEach((p) => {
      if (p.city && p.city.trim()) activeCities.add(p.city.trim());
    });
    communityPosts.forEach((post) => {
      if (post.city && post.city.trim()) activeCities.add(post.city.trim());
    });

    const presetCities = INDONESIA_CITY_PRESETS.map((c) => c.city).filter(
      (c) => !Array.from(activeCities).some((ac) => ac.toLowerCase() === c.toLowerCase())
    );

    return [...Array.from(activeCities), ...presetCities];
  }, [communityProfiles, communityPosts]);

  // Map userId -> PublicStoreProfile for coordinates & metadata lookup
  const profileLookup = useMemo(() => {
    const map = new Map<string, (typeof communityProfiles)[number]>();
    communityProfiles.forEach((p) => map.set(p.userId, p));
    return map;
  }, [communityProfiles]);

  // Activate GPS Nearby Filter
  const handleSelectNearbyGps = () => {
    if (selectedRegion === 'NEARBY') {
      setSelectedRegion('ALL');
      return;
    }
    if (typeof profile.latitude === 'number' && typeof profile.longitude === 'number') {
      setGpsCoords({ lat: profile.latitude, lng: profile.longitude });
      setSelectedRegion('NEARBY');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('Perangkat tidak mendukung GPS. Atur titik peta di Pengaturan Toko.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSelectedRegion('NEARBY');
        setIsLocatingGps(false);
      },
      () => {
        setIsLocatingGps(false);
        showToast('Izin lokasi ditolak. Pilih kota secara manual atau atur lokasi di Pengaturan.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cleanTagQuery = q.startsWith('#') ? q.slice(1) : q;

    return communityPosts.filter((post) => {
      // 1. Tab filter
      if (activeFeedTab === 'following') {
        if (post.userId !== currentUid && !followedStoreIds.includes(post.userId)) {
          return false;
        }
      } else if (activeFeedTab === 'saved') {
        if (!bookmarkedPostIds.includes(post.id)) {
          return false;
        }
      }

      // 2. Business Category filter
      if (selectedBusinessField !== 'ALL') {
        if (
          (post.businessCategory || '').trim().toLowerCase() !==
          selectedBusinessField.toLowerCase()
        ) {
          return false;
        }
      }

      // 3. Region / City filter
      if (selectedRegion === 'NEARBY' && gpsCoords) {
        const authorProfile = profileLookup.get(post.userId);
        if (
          typeof authorProfile?.latitude === 'number' &&
          typeof authorProfile?.longitude === 'number'
        ) {
          const dist = calculateDistanceKm(
            gpsCoords.lat,
            gpsCoords.lng,
            authorProfile.latitude,
            authorProfile.longitude
          );
          if (dist > 60) return false;
        } else if (profile.city && post.city) {
          if (post.city.toLowerCase() !== profile.city.toLowerCase()) return false;
        } else {
          return false;
        }
      } else if (selectedRegion !== 'ALL' && selectedRegion !== 'NEARBY') {
        const cityMatch =
          (post.city || '').toLowerCase().includes(selectedRegion.toLowerCase()) ||
          (post.province || '').toLowerCase().includes(selectedRegion.toLowerCase());
        if (!cityMatch) return false;
      }

      // 4. Search query filter
      if (q) {
        const inStore =
          post.storeName.toLowerCase().includes(q) ||
          post.storeHandle.toLowerCase().includes(q.replace(/^@/, ''));
        const inCaption = post.caption.toLowerCase().includes(q);
        const inHashtags = post.hashtags.some((h) => h.toLowerCase().includes(cleanTagQuery));
        const inProducts = post.taggedProducts.some((tp) =>
          tp.name.toLowerCase().includes(q)
        );
        const inMeta =
          (post.businessCategory || '').toLowerCase().includes(q) ||
          (post.city || '').toLowerCase().includes(q);
        if (!inStore && !inCaption && !inHashtags && !inProducts && !inMeta) {
          return false;
        }
      }

      return true;
    });
  }, [
    communityPosts,
    activeFeedTab,
    currentUid,
    followedStoreIds,
    bookmarkedPostIds,
    selectedBusinessField,
    selectedRegion,
    gpsCoords,
    profileLookup,
    profile.city,
    searchQuery,
  ]);

  // Filtered Stores for "Direktori Toko" tab
  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = communityProfiles.filter((sp) => {
      if (selectedBusinessField !== 'ALL') {
        if (
          (sp.businessCategory || '').trim().toLowerCase() !==
          selectedBusinessField.toLowerCase()
        ) {
          return false;
        }
      }

      if (selectedRegion === 'NEARBY' && gpsCoords) {
        if (typeof sp.latitude === 'number' && typeof sp.longitude === 'number') {
          const dist = calculateDistanceKm(
            gpsCoords.lat,
            gpsCoords.lng,
            sp.latitude,
            sp.longitude
          );
          if (dist > 60) return false;
        } else {
          return false;
        }
      } else if (selectedRegion !== 'ALL' && selectedRegion !== 'NEARBY') {
        const cityMatch =
          (sp.city || '').toLowerCase().includes(selectedRegion.toLowerCase()) ||
          (sp.province || '').toLowerCase().includes(selectedRegion.toLowerCase());
        if (!cityMatch) return false;
      }

      if (q) {
        const matchName =
          sp.storeName.toLowerCase().includes(q) ||
          sp.handle.toLowerCase().includes(q.replace(/^@/, ''));
        const matchBio = (sp.bio || '').toLowerCase().includes(q);
        const matchField = (sp.businessCategory || '').toLowerCase().includes(q);
        const matchCity = (sp.city || '').toLowerCase().includes(q);
        const matchProd = sp.showcaseProducts.some((prod) =>
          prod.name.toLowerCase().includes(q)
        );
        if (!matchName && !matchBio && !matchField && !matchCity && !matchProd) {
          return false;
        }
      }

      return true;
    });

    if (selectedRegion === 'NEARBY' && gpsCoords) {
      return [...list].sort((a, b) => {
        const da =
          typeof a.latitude === 'number' && typeof a.longitude === 'number'
            ? calculateDistanceKm(gpsCoords.lat, gpsCoords.lng, a.latitude, a.longitude)
            : 9999;
        const db =
          typeof b.latitude === 'number' && typeof b.longitude === 'number'
            ? calculateDistanceKm(gpsCoords.lat, gpsCoords.lng, b.latitude, b.longitude)
            : 9999;
        return da - db;
      });
    }

    return list;
  }, [communityProfiles, selectedBusinessField, selectedRegion, gpsCoords, searchQuery]);

  // Trending Hashtags
  const trendingHashtags = useMemo(() => {
    const counts = new Map<string, number>();
    communityPosts.forEach((p) => {
      p.hashtags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [communityPosts]);

  // Suggested Stores to Follow
  const suggestedStores = useMemo(() => {
    return communityProfiles
      .filter((sp) => sp.userId !== currentUid && !followedStoreIds.includes(sp.userId))
      .slice(0, 5);
  }, [communityProfiles, currentUid, followedStoreIds]);

  // Featured Posts for the 3-card "Live Rooms" style top showcase
  const featuredLivePosts = useMemo(() => {
    return filteredPosts.slice(0, 3);
  }, [filteredPosts]);

  // Total Showcase Products count across all community profiles
  const totalCommunityShowcaseCount = useMemo(() => {
    return communityProfiles.reduce((acc, sp) => acc + (sp.showcaseProducts?.length || 0), 0);
  }, [communityProfiles]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCommunityFeed();
    setTimeout(() => setIsRefreshing(false), 350);
  };

  const handleOpenComposer = (presetType: CommunityPostType = 'general') => {
    setComposeType(presetType);
    setIsComposeOpen(true);
  };

  const handleUploadPostImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remainingSlots = Math.max(0, 4 - composeImages.length);
    const selected = files.slice(0, remainingSlots);
    const compressedList: string[] = [];
    for (const file of selected) {
      try {
        const dataUrl = await compressImageFile(file, 1080, 0.82);
        compressedList.push(dataUrl);
      } catch {
        // ignore single file failure
      }
    }
    if (compressedList.length > 0) {
      setComposeImages((prev) => [...prev, ...compressedList].slice(0, 4));
    }
    e.target.value = '';
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeCaption.trim() && composeImages.length === 0) return;

    createCommunityPost({
      caption: composeCaption.trim(),
      postType: composeType,
      imageUrls: composeImages,
      taggedProductIds: composeTaggedProductIds,
    });

    setComposeCaption('');
    setComposeImages([]);
    setComposeTaggedProductIds([]);
    setComposeType('general');
    setIsComposeOpen(false);
    setActiveFeedTab('explore');
    showToast('Postingan berhasil diterbitkan ke Komunitas KASRA!');
  };

  const handleSharePost = async (post: CommunityPost) => {
    const text = `${post.storeName} (@${post.storeHandle}): "${post.caption}"`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.storeName, text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        showToast('Tautan teks postingan disalin ke papan klip!');
      }
    } catch {
      // cancelled
    }
  };

  // Render caption with clickable #hashtags
  const renderCaptionWithHashtags = (caption: string) => {
    const parts = caption.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, idx) => {
      if (/^#[a-zA-Z0-9_]+$/.test(part)) {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => setSearchQuery(part)}
            className="font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            {part}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const activeFiltersCount =
    (selectedBusinessField !== 'ALL' ? 1 : 0) +
    (selectedRegion !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="space-y-5 pb-24 md:pb-10">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          1. TOP ROW: 3 KPI STAT CARDS (Left 8 cols) + 4 VERTICAL STORY CARDS (Right 4 cols)
          Matches the reference dashboard top bar layout
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 8 Cols: 3 Clean Stat Cards */}
        <div className="lg:col-span-8 grid grid-cols-3 gap-3 sm:gap-4">
          {/* Stat Card 1: Active Rooms / Postingan Aktif */}
          <button
            type="button"
            onClick={() => setActiveFeedTab('explore')}
            className={`text-left bg-white border rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-sm cursor-pointer ${
              activeFeedTab === 'explore'
                ? 'border-slate-300 ring-1 ring-slate-200/80'
                : 'border-slate-200/80'
            }`}
          >
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              Postingan Aktif
            </span>
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {communityPosts.length}
              </span>
              <span className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Stat Card 2: Upcoming Events / Mitra Usaha */}
          <button
            type="button"
            onClick={() => setActiveFeedTab('stores')}
            className={`text-left bg-white border rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-sm cursor-pointer ${
              activeFeedTab === 'stores'
                ? 'border-slate-300 ring-1 ring-slate-200/80'
                : 'border-slate-200/80'
            }`}
          >
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              Mitra Toko UMKM
            </span>
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {communityProfiles.length}
              </span>
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Stat Card 3: Time Active / Etalase Produk */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="text-left bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-2xs hover:shadow-sm cursor-pointer"
          >
            <span className="text-xs sm:text-sm font-medium text-slate-500">
              Produk Etalase
            </span>
            <div className="flex items-center gap-2.5 mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalCommunityShowcaseCount}{' '}
                <span className="text-sm sm:text-base font-bold text-slate-500">SKU</span>
              </span>
              <span className="w-7 h-7 rounded-lg bg-amber-50/90 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </span>
            </div>
          </button>
        </div>

        {/* Right 4 Cols: 4 Vertical Story Portrait Cards with Bottom Circular Avatar */}
        <div className="lg:col-span-4 grid grid-cols-4 gap-2.5">
          {communityProfiles.slice(0, 4).map((sp, idx) => {
            const bgImg =
              sp.bannerUrl ||
              sp.showcaseProducts[0]?.imageUrl ||
              FALLBACK_COVERS[idx % FALLBACK_COVERS.length];
            return (
              <button
                key={sp.userId}
                type="button"
                onClick={() => setSelectedStoreProfileId(sp.userId)}
                title={`${sp.storeName} (@${sp.handle})`}
                className="group relative h-28 sm:h-32 rounded-2xl overflow-hidden border border-slate-300/80 shadow-2xs hover:shadow-md transition-all cursor-pointer bg-slate-100"
              >
                <img
                  src={bgImg}
                  alt={sp.storeName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {/* Bottom-centered circular avatar */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white p-0.5 shadow-md overflow-hidden flex items-center justify-center">
                  {sp.logoUrl ? (
                    <img
                      src={sp.logoUrl}
                      alt={sp.storeName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-extrabold text-slate-800">
                      {sp.storeName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          2. MAIN 2-COLUMN LAYOUT (Left 8 cols: Live Rooms + Your Communities, Right 4 cols: Trending Hashtags + Suggested Communities)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* -----------------------------------------------------------------
              SECTION A: "Live Rooms" Style Card (Sorotan & Filter Komunitas)
             ----------------------------------------------------------------- */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            {/* Header Row: Title on Left, "+ Live" (Buat Postingan) & "View All ↗" on Right */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Sorotan Komunitas UMKM
                </h2>
                <button
                  type="button"
                  onClick={handleRefresh}
                  title="Segarkan Lini Masa"
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenComposer('general')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Posting</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveFeedTab(activeFeedTab === 'stores' ? 'explore' : 'stores')
                  }
                  className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${darkBrownPillClass}`}
                >
                  <span>
                    {activeFeedTab === 'stores'
                      ? 'Lihat Feed'
                      : `Direktori (${communityProfiles.length})`}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category Pills Row (Matches `👀 All`, `🎓 Education`, `💼 Business`, etc.) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedBusinessField('ALL')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedBusinessField === 'ALL'
                    ? `${darkBrownPillClass} shadow-xs`
                    : 'bg-slate-100/90 hover:bg-slate-200/70 text-slate-700'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/90 text-[11px] flex items-center justify-center shadow-2xs">
                  👀
                </span>
                <span>Semua</span>
              </button>

              {businessFieldOptions.map((field) => {
                const active =
                  selectedBusinessField.toLowerCase() === field.toLowerCase();
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => setSelectedBusinessField(active ? 'ALL' : field)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      active
                        ? `${darkBrownPillClass} font-bold shadow-xs`
                        : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    <span>{getBusinessCategoryEmoji(field)}</span>
                    <span>{field}</span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Compact Filter Bar: Feed Mode Tabs + Search + Region / GPS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
              {/* Feed Mode Switcher Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {[
                  { id: 'explore' as const, label: 'Jelajah', icon: Compass },
                  {
                    id: 'following' as const,
                    label: `Mengikuti (${followedStoreIds.length})`,
                    icon: Users,
                  },
                  {
                    id: 'stores' as const,
                    label: `Toko (${communityProfiles.length})`,
                    icon: Store,
                  },
                  {
                    id: 'saved' as const,
                    label: `Tersimpan (${bookmarkedPostIds.length})`,
                    icon: Bookmark,
                  },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeFeedTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFeedTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? primaryBtnClass
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search + Region Filter */}
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {/* GPS Nearby Pill */}
                <button
                  type="button"
                  onClick={handleSelectNearbyGps}
                  disabled={isLocatingGps}
                  title="Filter toko & postingan terdekat dari lokasi GPS Anda"
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all cursor-pointer ${
                    selectedRegion === 'NEARBY'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isLocatingGps ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Navigation className="w-3 h-3 text-emerald-600" />
                  )}
                  <span>Terdekat</span>
                </button>

                {/* City Select */}
                <select
                  value={selectedRegion === 'NEARBY' ? 'ALL' : selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value || 'ALL')}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none max-w-[135px] truncate cursor-pointer"
                >
                  <option value="ALL">Semua Daerah</option>
                  {regionCityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Search Input */}
                <div className="relative flex-1 sm:w-44">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari toko / #tagar..."
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-8 pr-6 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBusinessField('ALL');
                      setSelectedRegion('ALL');
                      setSearchQuery('');
                    }}
                    className="px-2 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-bold hover:bg-rose-100 shrink-0 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* 3-Column Visual Highlight Grid (Matches the 3 Live Room Cards in Reference Image) */}
            {featuredLivePosts.length > 0 && activeFeedTab !== 'stores' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {featuredLivePosts.map((post, idx) => {
                  const postMeta = POST_TYPE_META[post.postType] || POST_TYPE_META.general;
                  const authorProfile = profileLookup.get(post.userId);
                  const coverImage =
                    post.imageUrls[0] ||
                    post.taggedProducts[0]?.imageUrl ||
                    authorProfile?.bannerUrl ||
                    FALLBACK_COVERS[idx % FALLBACK_COVERS.length];
                  const engagementCount =
                    post.likedByUserIds.length + post.comments.length;
                  const cardTitle =
                    post.taggedProducts[0]?.name ||
                    `${post.storeName} — ${postMeta.label}`;

                  return (
                    <div
                      key={`featured-${post.id}`}
                      onClick={() => setSelectedStoreProfileId(post.userId)}
                      className="group cursor-pointer space-y-2.5"
                    >
                      {/* Rounded Thumbnail with Top-Left Red Badge & Bottom-Right Count Pill */}
                      <div className="relative h-36 sm:h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70">
                        <img
                          src={coverImage}
                          alt={cardTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

                        {/* Top-left coral/red Live-style badge */}
                        <span
                          className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${postMeta.liveBadgeClass}`}
                        >
                          {postMeta.label}
                        </span>

                        {/* Bottom-right white participant/engagement pill */}
                        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 text-slate-900 text-[11px] font-bold shadow-sm">
                          <Users className="w-3 h-3 text-slate-700" />
                          <span>{engagementCount}</span>
                        </span>
                      </div>

                      {/* Title & 1-line Subtitle */}
                      <div className="space-y-0.5 px-0.5">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                          {cardTitle}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {post.caption}
                        </p>
                      </div>

                      {/* Bottom Author Row */}
                      <div className="flex items-center gap-2 px-0.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-[9px] font-bold text-slate-700">
                          {post.storeLogoUrl ? (
                            <img
                              src={post.storeLogoUrl}
                              alt={post.storeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            post.storeName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {post.storeName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* -----------------------------------------------------------------
              SECTION B: "Your Communities" Style Card (Jejaring & Lini Masa UMKM)
             ----------------------------------------------------------------- */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
            {/* Section Header: Title + View All button */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {activeFeedTab === 'stores'
                    ? 'Direktori Komunitas Toko UMKM'
                    : activeFeedTab === 'following'
                    ? 'Kabar Toko yang Anda Ikuti'
                    : activeFeedTab === 'saved'
                    ? 'Koleksi Postingan Tersimpan'
                    : 'Diskusi & Lini Masa Komunitas'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenComposer('new_product')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pamer Produk Jadi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBusinessField('ALL');
                    setSelectedRegion('ALL');
                    setSearchQuery('');
                    setActiveFeedTab(activeFeedTab === 'stores' ? 'explore' : 'stores');
                  }}
                  className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${darkBrownPillClass}`}
                >
                  <span>{activeFeedTab === 'stores' ? 'Semua Postingan' : 'Lihat Semua'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Inline Composer Strip */}
            {activeFeedTab !== 'stores' && (
              <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center font-extrabold text-xs cursor-pointer"
                  >
                    {myPublicStoreProfile.logoUrl ? (
                      <img
                        src={myPublicStoreProfile.logoUrl}
                        alt={myPublicStoreProfile.storeName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          isDark
                            ? 'bg-[#0D1C42] text-[#FCF1D0]'
                            : 'bg-[#1E3D1C] text-[#F8FAF6]'
                        }`}
                      >
                        {(myPublicStoreProfile.storeName || 'K').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenComposer('general')}
                    className="flex-1 text-left text-xs text-slate-500 hover:text-slate-800 truncate cursor-pointer"
                  >
                    Bagikan kabar terbaru atau produk jadi dari{' '}
                    <strong className="text-slate-800">
                      {myPublicStoreProfile.storeName}
                    </strong>
                    ...
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenComposer('promo')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3 h-3 text-amber-500" />
                    <span>Promo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenComposer('collab')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3 h-3 text-indigo-500" />
                    <span>Kolab B2B</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenComposer('general')}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>Foto</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODE A: STORE DIRECTORY LIST (Styled as "Your Communities" Horizontal Cards) */}
            {activeFeedTab === 'stores' ? (
              filteredStores.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-100 text-center space-y-2">
                  <Store className="w-7 h-7 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Tidak Ada Toko yang Sesuai Filter
                  </h3>
                  <p className="text-xs text-slate-500">
                    Coba pilih &ldquo;Semua&rdquo; atau &ldquo;Semua Daerah&rdquo; untuk melihat seluruh mitra usaha.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStores.map((sp, idx) => {
                    const isMe = sp.userId === currentUid;
                    const isFollowing = followedStoreIds.includes(sp.userId);
                    const followerCount = getFollowerCount(sp.userId);
                    const distanceKm =
                      gpsCoords &&
                      typeof sp.latitude === 'number' &&
                      typeof sp.longitude === 'number'
                        ? calculateDistanceKm(
                            gpsCoords.lat,
                            gpsCoords.lng,
                            sp.latitude,
                            sp.longitude
                          )
                        : null;

                    return (
                      <div
                        key={sp.userId}
                        className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition-all space-y-2.5"
                      >
                        {/* Top Meta Row: Category Icon + Label on Left, Status on Right */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium flex-wrap">
                            <span>{getBusinessCategoryEmoji(sp.businessCategory)}</span>
                            <span>{sp.businessCategory}</span>
                            {sp.city && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                                • <MapPin className="w-3 h-3 inline text-emerald-600" /> {sp.city}
                                {distanceKm !== null ? ` (${distanceKm} km)` : ''}
                              </span>
                            )}
                          </div>

                          {idx === 0 ? (
                            <span className="text-[11px] font-semibold text-rose-500">
                              #1 Mitra Populer
                            </span>
                          ) : sp.showPublicCatalog && sp.showcaseProducts.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{sp.showcaseProducts.length} produk etalase</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              @{sp.handle}
                            </span>
                          )}
                        </div>

                        {/* Middle Row: Bold Store Name + Bio + Follow/View Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedStoreProfileId(sp.userId)}
                              className="text-sm sm:text-base font-bold text-slate-900 hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                            >
                              <span className="truncate">{sp.storeName}</span>
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            </button>
                            {sp.bio && (
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {sp.bio}
                              </p>
                            )}
                          </div>

                          {/* Avatar Stack + Action Buttons */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Stacked Avatars of Store + Showcase */}
                            <div className="flex -space-x-2 overflow-hidden">
                              <div className="w-7 h-7 rounded-full ring-2 ring-white bg-slate-200 overflow-hidden flex items-center justify-center text-[10px] font-bold">
                                {sp.logoUrl ? (
                                  <img
                                    src={sp.logoUrl}
                                    alt={sp.storeName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  sp.storeName.charAt(0).toUpperCase()
                                )}
                              </div>
                              {sp.showcaseProducts.slice(0, 2).map((prod) => (
                                <div
                                  key={prod.id}
                                  className="w-7 h-7 rounded-full ring-2 ring-white bg-white overflow-hidden flex items-center justify-center"
                                >
                                  {prod.imageUrl ? (
                                    <img
                                      src={prod.imageUrl}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </div>
                              ))}
                            </div>

                            {!isMe ? (
                              <button
                                type="button"
                                onClick={() => toggleFollowStore(sp.userId)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  isFollowing
                                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                    : darkBrownPillClass
                                }`}
                              >
                                {isFollowing ? 'Mengikuti' : '+ Ikuti'}
                              </button>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                Toko Anda
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Stats Row: Followers + Showcase Items + Link */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
                          <div className="flex items-center gap-4">
                            <span>{followerCount} Pengikut</span>
                            <span>{sp.showcaseProducts.length} Produk Jadi</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedStoreProfileId(sp.userId)}
                            className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:underline cursor-pointer"
                          >
                            Lihat Etalase & Lokasi →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : /* MODE B: SOCIAL FEED POSTS (Styled with "Your Communities" Card DNA) */
            filteredPosts.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50/70 border border-slate-100 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeFeedTab === 'following'
                      ? 'Belum Ada Postingan dari Toko yang Anda Ikuti'
                      : activeFeedTab === 'saved'
                      ? 'Belum Ada Postingan Tersimpan'
                      : 'Tidak Ada Postingan yang Cocok dengan Filter'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {activeFeedTab === 'following'
                      ? 'Ikuti beberapa mitra usaha di tab Jelajah atau Direktori Toko untuk mengikuti perkembangan produk mereka.'
                      : activeFeedTab === 'saved'
                      ? 'Klik ikon pita simpan pada postingan mana pun untuk menyimpannya di sini.'
                      : 'Coba ubah filter bidang usaha atau daerah, atau jadilah yang pertama membuat postingan di kategori ini!'}
                  </p>
                </div>
                {activeFeedTab === 'following' && (
                  <button
                    type="button"
                    onClick={() => setActiveFeedTab('stores')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${darkBrownPillClass}`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Cari Toko untuk Diikuti</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredPosts.map((post, idx) => {
                  const isOwnPost = post.userId === currentUid;
                  const isFollowingAuthor = followedStoreIds.includes(post.userId);
                  const isLiked = post.likedByUserIds.includes(currentUid);
                  const isSaved = bookmarkedPostIds.includes(post.id);
                  const isCommentsOpen = !!expandedComments[post.id];
                  const postMeta = POST_TYPE_META[post.postType] || POST_TYPE_META.general;
                  const authorProfile = profileLookup.get(post.userId);
                  const distanceKm =
                    gpsCoords &&
                    typeof authorProfile?.latitude === 'number' &&
                    typeof authorProfile?.longitude === 'number'
                      ? calculateDistanceKm(
                          gpsCoords.lat,
                          gpsCoords.lng,
                          authorProfile.latitude,
                          authorProfile.longitude
                        )
                      : null;

                  return (
                    <article
                      key={post.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/75 hover:bg-slate-50 border border-slate-100 transition-all space-y-3.5"
                    >
                      {/* Row 1 ("Your Communities" Top Meta): Category Icon + Name on Left, Trending / Live Discussion status on Right */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.businessCategory && (
                            <button
                              type="button"
                              onClick={() => setSelectedBusinessField(post.businessCategory)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              <span>{getBusinessCategoryEmoji(post.businessCategory)}</span>
                              <span>{post.businessCategory}</span>
                            </button>
                          )}

                          {post.city && (
                            <button
                              type="button"
                              onClick={() => setSelectedRegion(post.city)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-slate-200/80 text-[10px] font-semibold text-slate-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                              <span>
                                {post.city}
                                {distanceKm !== null ? ` (${distanceKm} km)` : ''}
                              </span>
                            </button>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${postMeta.badgeClass}`}
                          >
                            {postMeta.label}
                          </span>
                        </div>

                        {/* Right Status Indicator (like `#1 Trending`, `3 discussions live`, `• Active now`) */}
                        <div className="flex items-center gap-2">
                          {idx === 0 ? (
                            <span className="text-[11px] font-semibold text-rose-500">
                              #1 Trending
                            </span>
                          ) : post.comments.length > 0 ? (
                            <span className="text-[11px] font-medium text-slate-600">
                              {post.comments.length} diskusi aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{formatRelativeTimeIndo(post.createdAt)}</span>
                            </span>
                          )}

                          {!isOwnPost ? (
                            <button
                              type="button"
                              onClick={() => toggleFollowStore(post.userId)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                isFollowingAuthor
                                  ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                  : darkBrownPillClass
                              }`}
                            >
                              {isFollowingAuthor ? (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Mengikuti</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3" />
                                  <span>Ikuti</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletePostTarget(post)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus postingan saya"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Store Author Header & Title */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedStoreProfileId(post.userId)}
                            className="w-9 h-9 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-extrabold text-xs cursor-pointer shadow-2xs"
                          >
                            {post.storeLogoUrl ? (
                              <img
                                src={post.storeLogoUrl}
                                alt={post.storeName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center ${
                                  isDark
                                    ? 'bg-[#0D1C42] text-[#FCF1D0]'
                                    : 'bg-[#1E3D1C] text-[#F8FAF6]'
                                }`}
                              >
                                {post.storeName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStoreProfileId(post.userId)}
                                className="text-sm sm:text-base font-bold text-slate-900 hover:underline truncate cursor-pointer"
                              >
                                {post.storeName}
                              </button>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{post.storeHandle} • {formatRelativeTimeIndo(post.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Overlapping Avatar Stack on the Right (Author + Commenters) */}
                        <div className="flex -space-x-2 overflow-hidden shrink-0">
                          <div className="w-7 h-7 rounded-full ring-2 ring-white bg-slate-200 overflow-hidden flex items-center justify-center text-[10px] font-bold">
                            {post.storeLogoUrl ? (
                              <img
                                src={post.storeLogoUrl}
                                alt={post.storeName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              post.storeName.charAt(0).toUpperCase()
                            )}
                          </div>
                          {post.comments.slice(0, 2).map((c) => (
                            <div
                              key={c.id}
                              className="w-7 h-7 rounded-full ring-2 ring-white bg-slate-100 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-700"
                            >
                              {c.storeLogoUrl ? (
                                <img
                                  src={c.storeLogoUrl}
                                  alt={c.storeName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                c.storeName.charAt(0).toUpperCase()
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Caption */}
                      {post.caption && (
                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {renderCaptionWithHashtags(post.caption)}
                        </p>
                      )}

                      {/* Post Photos */}
                      {post.imageUrls.length > 0 && (
                        <div
                          className={`grid gap-2.5 ${
                            post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                          }`}
                        >
                          {post.imageUrls.map((url, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="rounded-2xl overflow-hidden border border-slate-200/80 bg-white max-h-[360px] flex items-center justify-center"
                            >
                              <img
                                src={url}
                                alt={`${post.storeName} foto ${imgIdx + 1}`}
                                className="w-full h-full object-cover max-h-[360px]"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Tagged Finished Showcase Products */}
                      {post.taggedProducts.length > 0 && (
                        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Produk Jadi yang Ditampilkan:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedStoreProfileId(post.userId)}
                              className="font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                              Buka Etalase Toko →
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {post.taggedProducts.map((tp) => (
                              <button
                                key={tp.id}
                                type="button"
                                onClick={() => setSelectedStoreProfileId(post.userId)}
                                className="p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                              >
                                <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                  {tp.imageUrl ? (
                                    <img
                                      src={tp.imageUrl}
                                      alt={tp.name}
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  ) : (
                                    <Package className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {tp.name}
                                  </div>
                                  <div className="text-xs font-mono font-extrabold text-emerald-700">
                                    {formatRupiah(tp.sellingPrice)}
                                    <span className="text-[10px] font-normal text-slate-400">
                                      /{tp.unit}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Stats & Action Bar (Matches "496,8K Members   54 reply" aesthetic) */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-3 sm:gap-5">
                          <button
                            type="button"
                            onClick={() => toggleLikePost(post.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                              isLiked
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                isLiked ? 'fill-rose-600 text-rose-600' : ''
                              }`}
                            />
                            <span>{post.likedByUserIds.length} Suka</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedComments((prev) => ({
                                ...prev,
                                [post.id]: !prev[post.id],
                              }))
                            }
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              isCommentsOpen
                                ? 'text-slate-900 font-bold'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{post.comments.length} balasan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSharePost(post)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Bagikan</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleBookmarkPost(post.id)}
                          title={isSaved ? 'Hapus dari Tersimpan' : 'Simpan Postingan'}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            isSaved
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Bookmark
                            className={`w-4 h-4 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Preview 1 latest comment even when collapsed */}
                      {!isCommentsOpen && post.comments.length > 0 && (
                        <div
                          onClick={() =>
                            setExpandedComments((prev) => ({ ...prev, [post.id]: true }))
                          }
                          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/60 transition-colors"
                        >
                          <span className="font-bold text-slate-900 mr-1.5">
                            {post.comments[post.comments.length - 1].storeName}:
                          </span>
                          <span className="line-clamp-1 inline">
                            {post.comments[post.comments.length - 1].content}
                          </span>
                        </div>
                      )}

                      {/* Expanded Comments Section */}
                      {isCommentsOpen && (
                        <div className="pt-2 border-t border-slate-200/60 space-y-2.5 animate-in fade-in duration-150">
                          {post.comments.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              Belum ada komentar. Jadilah rekan usaha pertama yang berdiskusi!
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {post.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="p-3 rounded-xl bg-white border border-slate-200/70 flex items-start justify-between gap-2 text-xs"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedStoreProfileId(comment.userId)}
                                      className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-[11px] text-slate-700 cursor-pointer"
                                    >
                                      {comment.storeLogoUrl ? (
                                        <img
                                          src={comment.storeLogoUrl}
                                          alt={comment.storeName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        comment.storeName.charAt(0).toUpperCase()
                                      )}
                                    </button>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSelectedStoreProfileId(comment.userId)
                                          }
                                          className="font-bold text-slate-900 hover:underline cursor-pointer"
                                        >
                                          {comment.storeName}
                                        </button>
                                        <span className="text-[10px] font-mono text-slate-400">
                                          @{comment.storeHandle}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                          • {formatRelativeTimeIndo(comment.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-slate-700 mt-0.5 break-words">
                                        {comment.content}
                                      </p>
                                    </div>
                                  </div>

                                  {(comment.userId === currentUid || isOwnPost) && (
                                    <button
                                      type="button"
                                      onClick={() => deletePostComment(post.id, comment.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                                      title="Hapus komentar"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Comment Input */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const content = (commentInputs[post.id] || '').trim();
                              if (!content) return;
                              addPostComment(post.id, content);
                              setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder={`Tulis komentar sebagai ${myPublicStoreProfile.storeName}...`}
                              className="flex-1 bg-white border border-slate-200 focus:border-slate-400 rounded-full px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={!(commentInputs[post.id] || '').trim()}
                              className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer ${darkBrownPillClass}`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Kirim</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =================================================================
            RIGHT SIDEBAR COLUMN (4 Cols):
            Unified White Card containing Trending Hashtags + Suggested Communities
            + Compact Store Etalase Card below
           ================================================================= */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Card 1: Trending Hashtags + Suggested Communities (Matches Right Sidebar in Reference Image) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xs">
            {/* Trending Hashtags */}
            {trendingHashtags.length > 0 && (
              <div className="space-y-3.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Tagar Populer
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.map(([tag]) => {
                    const isTagSelected =
                      searchQuery.toLowerCase() === `#${tag.toLowerCase()}`;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setActiveFeedTab('explore');
                          setSearchQuery(isTagSelected ? '' : `#${tag}`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isTagSelected
                            ? `${darkBrownPillClass} font-bold`
                            : 'bg-slate-100/90 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggested Communities (Rekomendasi Mitra Usaha) */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Rekomendasi Komunitas Toko
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveFeedTab('stores')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Semua
                </button>
              </div>

              <div className="space-y-2.5">
                {(suggestedStores.length > 0
                  ? suggestedStores
                  : communityProfiles.slice(0, 5)
                ).map((sp, idx) => {
                  const isFollowing = followedStoreIds.includes(sp.userId);
                  const isMe = sp.userId === currentUid;
                  const followers = getFollowerCount(sp.userId);
                  return (
                    <div
                      key={sp.userId}
                      className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/60 border border-slate-100 flex items-center justify-between gap-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedStoreProfileId(sp.userId)}
                        className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                      >
                        {/* Circular Emoji / Avatar Badge */}
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-base shrink-0 overflow-hidden">
                          {sp.logoUrl ? (
                            <img
                              src={sp.logoUrl}
                              alt={sp.storeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{getBusinessCategoryEmoji(sp.businessCategory)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {sp.storeName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {followers} Pengikut
                            {sp.city ? ` • ${sp.city}` : ''}
                          </div>
                        </div>
                      </button>

                      {/* Circular `+` Follow Button (First item dark pill, others soft light circle like reference) */}
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => toggleFollowStore(sp.userId)}
                          title={isFollowing ? 'Berhenti Mengikuti' : `Ikuti ${sp.storeName}`}
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-emerald-100 text-emerald-800'
                              : idx === 0
                              ? `${darkBrownPillClass} shadow-xs`
                              : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          {isFollowing ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2: Own Store Profile & Quick Etalase Management */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {myPublicStoreProfile.logoUrl ? (
                    <img
                      src={myPublicStoreProfile.logoUrl}
                      alt={myPublicStoreProfile.storeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center font-extrabold text-sm ${
                        isDark
                          ? 'bg-[#0D1C42] text-[#FCF1D0]'
                          : 'bg-[#1E3D1C] text-[#F8FAF6]'
                      }`}
                    >
                      {(myPublicStoreProfile.storeName || 'K').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {myPublicStoreProfile.storeName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    @{myPublicStoreProfile.handle} • {myPublicStoreProfile.businessCategory}
                  </div>
                </div>
              </div>

              {myPublicStoreProfile.city ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700 shrink-0">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{myPublicStoreProfile.city}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 shrink-0 cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>+ Lokasi</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50/90">
                <div className="text-sm font-extrabold text-slate-900">
                  {getFollowerCount(currentUid)}
                </div>
                <div className="text-[10px] text-slate-500">Pengikut</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50/90">
                <div className="text-sm font-extrabold text-slate-900">
                  {getFollowingCount(currentUid)}
                </div>
                <div className="text-[10px] text-slate-500">Mengikuti</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50/90">
                <div className="text-sm font-extrabold text-slate-900">
                  {myPublicStoreProfile.showcaseProducts.length}
                </div>
                <div className="text-[10px] text-slate-500">Etalase</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${darkBrownPillClass}`}
              >
                Profil & Etalase
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-bold text-slate-700 text-center transition-colors cursor-pointer"
              >
                Atur Bidang & Peta
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* =====================================================================
          CREATE POST COMPOSER MODAL
         ===================================================================== */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Buat Postingan Komunitas — {myPublicStoreProfile.storeName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handlePublishPost}
              className="p-6 overflow-y-auto space-y-4"
            >
              {/* Store Category & City Context */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-800">
                    @{myPublicStoreProfile.handle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700">
                    {myPublicStoreProfile.businessCategory}
                  </span>
                  {myPublicStoreProfile.city && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                      <MapPin className="w-3 h-3" />
                      <span>{myPublicStoreProfile.city}</span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsComposeOpen(false);
                    setActiveTab('settings');
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Ubah Bidang/Lokasi</span>
                </button>
              </div>

              {/* Post Category Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Jenis Postingan
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(POST_TYPE_META) as CommunityPostType[]).map((pt) => {
                    const active = composeType === pt;
                    return (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setComposeType(pt)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          active
                            ? darkBrownPillClass + ' border-transparent'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {POST_TYPE_META[pt].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Cerita / Caption Postingan
                </label>
                <textarea
                  rows={4}
                  value={composeCaption}
                  onChange={(e) => setComposeCaption(e.target.value)}
                  placeholder="Tulis kabar produk jadi terbaru, promo spesial, atau ajakan kolaborasi sesama UMKM... Gunakan #tagar agar mudah ditemukan!"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {['#umkmlokal', '#produkjadi', '#kolaborasi', '#promotoko'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setComposeCaption((prev) =>
                            prev.includes(tag) ? prev : `${prev.trim()} ${tag}`.trim()
                          )
                        }
                        className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-600 cursor-pointer"
                      >
                        + {tag}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Foto Postingan ({composeImages.length}/4)
                  </label>
                  <input
                    ref={composeFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadPostImages}
                    className="hidden"
                  />
                  {composeImages.length < 4 && (
                    <button
                      type="button"
                      onClick={() => composeFileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unggah Foto</span>
                    </button>
                  )}
                </div>

                {composeImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {composeImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setComposeImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/75 text-white hover:bg-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tag Finished Goods from Own Store (Excludes Raw Materials Automatically) */}
              {finishedGoodsProducts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      Sematkan Produk Jadi dari Toko Anda (Opsional — Bahan Baku Dikecualikan)
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {finishedGoodsProducts.map((prod) => {
                      const selected = composeTaggedProductIds.includes(prod.id);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            setComposeTaggedProductIds((prev) =>
                              selected
                                ? prev.filter((id) => id !== prod.id)
                                : [...prev, prod.id]
                            );
                          }}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                            selected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{prod.name}</div>
                            <div className="text-[11px] font-mono text-emerald-700 font-bold">
                              {formatRupiah(prod.sellingPrice)}/{prod.unit}
                            </div>
                          </div>
                          {selected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!composeCaption.trim() && composeImages.length === 0}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold disabled:opacity-40 transition-all shadow-sm cursor-pointer ${darkBrownPillClass}`}
                >
                  Terbitkan Postingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Own Post Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletePostTarget}
        onClose={() => setDeletePostTarget(null)}
        onConfirm={() => {
          if (deletePostTarget) {
            deleteCommunityPost(deletePostTarget.id);
            setDeletePostTarget(null);
            showToast('Postingan berhasil dihapus.');
          }
        }}
        title="Hapus Postingan Komunitas"
        message="Apakah Anda yakin ingin menghapus postingan ini dari Komunitas KASRA?"
        confirmText="Ya, Hapus Postingan"
        isDanger={true}
      />
    </div>
  );
};
