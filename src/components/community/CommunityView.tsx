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
} from 'lucide-react';

type CommunityMainTab = 'explore' | 'following' | 'stores' | 'saved';

const POST_TYPE_META: Record<
  CommunityPostType,
  { label: string; badgeClass: string }
> = {
  general: {
    label: 'Kabar Usaha',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  new_product: {
    label: 'Produk Baru',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  promo: {
    label: 'Promo & Diskon',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  collab: {
    label: 'Cari Mitra / Kolab',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  story: {
    label: 'Cerita Dapur',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

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
      .slice(0, 8);
  }, [communityPosts]);

  // Suggested Stores to Follow
  const suggestedStores = useMemo(() => {
    return communityProfiles
      .filter((sp) => sp.userId !== currentUid && !followedStoreIds.includes(sp.userId))
      .slice(0, 4);
  }, [communityProfiles, currentUid, followedStoreIds]);

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
      {/* 1. Community Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Komunitas Usaha & Jejaring UMKM
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Eksplorasi produk jadi, kabar bisnis, dan kolaborasi antar pemilik usaha berdasarkan bidang toko & daerah
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            title="Segarkan Lini Masa"
            className="p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Profil & Etalase Saya</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenComposer('general')}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${primaryBtnClass}`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Buat Postingan</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 2. Navigation Tabs + Search + Dual Filter Card (Bidang Usaha & Daerah) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
        {/* Top Row: Segmented Tabs + Search Input */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70">
            {[
              { id: 'explore' as const, label: 'Jelajah', icon: Compass },
              {
                id: 'following' as const,
                label: `Mengikuti (${followedStoreIds.length})`,
                icon: Users,
              },
              {
                id: 'stores' as const,
                label: `Direktori Toko (${communityProfiles.length})`,
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
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? primaryBtnClass + ' shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari toko (@handle), produk jadi, #tagar, atau kota..."
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-full pl-10 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Row 1: Bidang Usaha Toko */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filter Bidang Toko:</span>
            </span>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBusinessField('ALL');
                  setSelectedRegion('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Reset Filter ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedBusinessField('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                selectedBusinessField === 'ALL'
                  ? primaryBtnClass + ' border-transparent'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Semua Bidang
            </button>

            {businessFieldOptions.map((field) => {
              const active =
                selectedBusinessField.toLowerCase() === field.toLowerCase();
              return (
                <button
                  key={field}
                  type="button"
                  onClick={() =>
                    setSelectedBusinessField(active ? 'ALL' : field)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
                    active
                      ? primaryBtnClass + ' border-transparent font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {field}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Row 2: Daerah / Kota & GPS Terdekat */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Filter Daerah:</span>
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-1">
            <button
              type="button"
              onClick={() => setSelectedRegion('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                selectedRegion === 'ALL'
                  ? primaryBtnClass + ' border-transparent'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              Seluruh Indonesia
            </button>

            <button
              type="button"
              onClick={handleSelectNearbyGps}
              disabled={isLocatingGps}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all cursor-pointer ${
                selectedRegion === 'NEARBY'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              {isLocatingGps ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Navigation className="w-3 h-3" />
              )}
              <span>Terdekat dari Saya</span>
            </button>

            {regionCityOptions.slice(0, 7).map((cityName) => {
              const active =
                selectedRegion.toLowerCase() === cityName.toLowerCase();
              return (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => setSelectedRegion(active ? 'ALL' : cityName)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
                    active
                      ? primaryBtnClass + ' border-transparent font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {cityName}
                </button>
              );
            })}
          </div>

          {/* Full City Dropdown for 30+ Cities */}
          <select
            value={
              selectedRegion === 'ALL' || selectedRegion === 'NEARBY'
                ? ''
                : selectedRegion
            }
            onChange={(e) => setSelectedRegion(e.target.value || 'ALL')}
            className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none shrink-0"
          >
            <option value="">Pilih Kota Lainnya...</option>
            {regionCityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / MAIN COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Quick Inline Post Composer Box (shown on feed tabs) */}
          {activeFeedTab !== 'stores' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center font-extrabold text-sm cursor-pointer"
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
                  className="flex-1 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-full px-4 py-2.5 text-left text-xs text-slate-500 transition-colors cursor-pointer"
                >
                  Bagikan produk jadi terbaru, promo toko, atau cari mitra kolaborasi dari{' '}
                  <strong className="text-slate-700">
                    {myPublicStoreProfile.storeName}
                  </strong>
                  ...
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenComposer('new_product')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pamerkan Produk Jadi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenComposer('promo')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Info Promo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenComposer('collab')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Cari Kolaborasi B2B</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenComposer('general')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Unggah Foto</span>
                </button>
              </div>
            </div>
          )}

          {/* MODE A: STORE DIRECTORY VIEW */}
          {activeFeedTab === 'stores' ? (
            filteredStores.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-2 shadow-xs">
                <Store className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tidak Ada Toko yang Sesuai Filter
                </h3>
                <p className="text-xs text-slate-500">
                  Coba pilih &ldquo;Semua Bidang&rdquo; atau &ldquo;Seluruh Indonesia&rdquo; untuk melihat seluruh mitra usaha.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredStores.map((sp) => {
                  const isMe = sp.userId === currentUid;
                  const isFollowing = followedStoreIds.includes(sp.userId);
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
                      className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                    >
                      <div>
                        {/* Mini Cover */}
                        <div
                          onClick={() => setSelectedStoreProfileId(sp.userId)}
                          className="relative h-24 bg-slate-100 border-b border-slate-200 overflow-hidden cursor-pointer"
                        >
                          {sp.bannerUrl ? (
                            <img
                              src={sp.bannerUrl}
                              alt={sp.storeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full ${
                                isDark
                                  ? 'bg-gradient-to-r from-[#0D1C42] to-[#22396F]'
                                  : 'bg-gradient-to-r from-[#1E3D1C] to-[#3A6836]'
                              }`}
                            />
                          )}
                          {distanceKm !== null && (
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[10px] font-bold text-emerald-800 border border-emerald-200 font-mono">
                              {distanceKm} km
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="flex items-end justify-between gap-2 -mt-10 relative z-10">
                            <button
                              type="button"
                              onClick={() => setSelectedStoreProfileId(sp.userId)}
                              className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              {sp.logoUrl ? (
                                <img
                                  src={sp.logoUrl}
                                  alt={sp.storeName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-extrabold text-base ${
                                    isDark
                                      ? 'bg-[#0D1C42] text-[#FCF1D0]'
                                      : 'bg-[#1E3D1C] text-[#F8FAF6]'
                                  }`}
                                >
                                  {sp.storeName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </button>

                            {!isMe ? (
                              <button
                                type="button"
                                onClick={() => toggleFollowStore(sp.userId)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  isFollowing
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                    : primaryBtnClass
                                }`}
                              >
                                {isFollowing ? 'Mengikuti' : '+ Ikuti'}
                              </button>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                                Toko Anda
                              </span>
                            )}
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedStoreProfileId(sp.userId)}
                              className="text-sm font-extrabold text-slate-900 hover:underline flex items-center gap-1 text-left cursor-pointer"
                            >
                              <span>{sp.storeName}</span>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </button>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{sp.handle}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                              {sp.businessCategory}
                            </span>
                            {sp.city && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>{sp.city}</span>
                              </span>
                            )}
                          </div>

                          {sp.bio && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {sp.bio}
                            </p>
                          )}

                          {/* Mini Showcase Preview */}
                          {sp.showPublicCatalog && sp.showcaseProducts.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                Produk Jadi Unggulan ({sp.showcaseProducts.length}):
                              </span>
                              <div className="flex items-center gap-1.5 overflow-x-auto">
                                {sp.showcaseProducts.slice(0, 3).map((prod) => (
                                  <button
                                    key={prod.id}
                                    type="button"
                                    onClick={() => setSelectedStoreProfileId(sp.userId)}
                                    className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-800 truncate max-w-[140px] cursor-pointer"
                                  >
                                    {prod.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          <strong className="text-slate-900 font-mono">
                            {getFollowerCount(sp.userId)}
                          </strong>{' '}
                          Pengikut
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedStoreProfileId(sp.userId)}
                          className="font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Lihat Etalase & Lokasi →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : /* MODE B: SOCIAL FEED POSTS */
          filteredPosts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6" />
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
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer ${primaryBtnClass}`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Cari Toko untuk Diikuti</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {filteredPosts.map((post) => {
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
                    className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs transition-all"
                  >
                    {/* Post Author Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelectedStoreProfileId(post.userId)}
                          className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-extrabold text-sm cursor-pointer"
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedStoreProfileId(post.userId)}
                              className="text-sm font-extrabold text-slate-900 hover:underline truncate cursor-pointer"
                            >
                              {post.storeName}
                            </button>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-xs text-slate-400 font-mono">
                              @{post.storeHandle}
                            </span>
                            <span className="text-xs text-slate-400">
                              • {formatRelativeTimeIndo(post.createdAt)}
                            </span>
                          </div>

                          {/* Clickable Business Field & Region Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {post.businessCategory && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedBusinessField(post.businessCategory)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                              >
                                <Briefcase className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{post.businessCategory}</span>
                              </button>
                            )}

                            {post.city && (
                              <button
                                type="button"
                                onClick={() => setSelectedRegion(post.city)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                              >
                                <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                                <span>
                                  {post.city}
                                  {distanceKm !== null ? ` (${distanceKm} km)` : ''}
                                </span>
                              </button>
                            )}

                            <span
                              className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${postMeta.badgeClass}`}
                            >
                              {postMeta.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Header Action: Follow/Unfollow or Delete Own Post */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isOwnPost ? (
                          <button
                            type="button"
                            onClick={() => toggleFollowStore(post.userId)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isFollowingAuthor
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                : primaryBtnClass
                            }`}
                          >
                            {isFollowingAuthor ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Mengikuti</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Ikuti</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletePostTarget(post)}
                            className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus postingan saya"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Caption */}
                    {post.caption && (
                      <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
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
                        {post.imageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 max-h-[420px] flex items-center justify-center"
                          >
                            <img
                              src={url}
                              alt={`${post.storeName} foto ${idx + 1}`}
                              className="w-full h-full object-cover max-h-[420px]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tagged Finished Showcase Products */}
                    {post.taggedProducts.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
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
                              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                {tp.imageUrl ? (
                                  <img
                                    src={tp.imageUrl}
                                    alt={tp.name}
                                    className="w-full h-full object-contain"
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

                    {/* Action Bar: Like, Comment, Share, Bookmark */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => toggleLikePost(post.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            isLiked
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform active:scale-125 ${
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            isCommentsOpen
                              ? 'bg-slate-100 text-slate-900'
                              : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments.length} Komentar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSharePost(post)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Bagikan</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleBookmarkPost(post.id)}
                        title={isSaved ? 'Hapus dari Tersimpan' : 'Simpan Postingan'}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          isSaved
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
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
                        className="px-3.5 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/70 transition-colors"
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
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                        {post.comments.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Belum ada komentar. Jadilah rekan usaha pertama yang berdiskusi!
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {post.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-2 text-xs"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStoreProfileId(comment.userId)}
                                    className="w-7 h-7 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-[11px] text-slate-700 cursor-pointer"
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
                            className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-full px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!(commentInputs[post.id] || '').trim()}
                            className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40 cursor-pointer ${primaryBtnClass}`}
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

        {/* RIGHT SIDEBAR COLUMN (4 cols) */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Card 1: Own Public Store Summary */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="h-16 bg-slate-100 overflow-hidden">
              {myPublicStoreProfile.bannerUrl ? (
                <img
                  src={myPublicStoreProfile.bannerUrl}
                  alt={myPublicStoreProfile.storeName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full ${
                    isDark
                      ? 'bg-gradient-to-r from-[#0D1C42] to-[#22396F]'
                      : 'bg-gradient-to-r from-[#1E3D1C] to-[#3A6836]'
                  }`}
                />
              )}
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-end gap-3 -mt-10 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  {myPublicStoreProfile.logoUrl ? (
                    <img
                      src={myPublicStoreProfile.logoUrl}
                      alt={myPublicStoreProfile.storeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center font-extrabold text-base ${
                        isDark
                          ? 'bg-[#0D1C42] text-[#FCF1D0]'
                          : 'bg-[#1E3D1C] text-[#F8FAF6]'
                      }`}
                    >
                      {(myPublicStoreProfile.storeName || 'K').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 pb-0.5">
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {myPublicStoreProfile.storeName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    @{myPublicStoreProfile.handle}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                  {myPublicStoreProfile.businessCategory}
                </span>
                {myPublicStoreProfile.city ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{myPublicStoreProfile.city}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 cursor-pointer"
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    <span>+ Atur Lokasi Peta</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="text-sm font-extrabold text-slate-900 font-mono">
                    {getFollowerCount(currentUid)}
                  </div>
                  <div className="text-[10px] text-slate-500">Pengikut</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="text-sm font-extrabold text-slate-900 font-mono">
                    {getFollowingCount(currentUid)}
                  </div>
                  <div className="text-[10px] text-slate-500">Mengikuti</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="text-sm font-extrabold text-slate-900 font-mono">
                    {myPublicStoreProfile.showcaseProducts.length}
                  </div>
                  <div className="text-[10px] text-slate-500">Etalase</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-3 rounded-full text-[11px] font-bold text-center transition-all cursor-pointer ${primaryBtnClass}`}
                >
                  Profil & Etalase
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="py-2 px-3 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] font-bold text-slate-800 text-center transition-colors cursor-pointer"
                >
                  Atur Bidang & Peta
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Suggested Stores to Follow */}
          {suggestedStores.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rekomendasi Mitra Usaha</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveFeedTab('stores')}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Semua
                </button>
              </div>

              <div className="space-y-2.5">
                {suggestedStores.map((sp) => (
                  <div
                    key={sp.userId}
                    className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedStoreProfileId(sp.userId)}
                      className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-700">
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
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {sp.storeName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {sp.businessCategory}
                          {sp.city ? ` • ${sp.city}` : ''}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFollowStore(sp.userId)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 cursor-pointer ${primaryBtnClass}`}
                    >
                      Ikuti
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 3: Popular Hashtags */}
          {trendingHashtags.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tagar Populer Komunitas</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {trendingHashtags.map(([tag, count]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setActiveFeedTab('explore');
                      setSearchQuery(`#${tag}`);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <span>#{tag}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
                            ? primaryBtnClass + ' border-transparent'
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
                            // Convenience: if post has no photo yet and product has image, offer easy visual
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
                  className={`px-6 py-2.5 rounded-full text-xs font-bold disabled:opacity-40 transition-all shadow-sm cursor-pointer ${primaryBtnClass}`}
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
