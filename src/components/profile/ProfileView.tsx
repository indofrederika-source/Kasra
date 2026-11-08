'use client';

import React, { useState, useMemo } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { PublicStoreProfile } from '@/types';
import {
  formatRupiah,
  formatRelativeTimeIndo,
  formatWhatsAppUrl,
} from '@/lib/utils';
import { StoreLocationPicker } from '@/components/settings/StoreLocationPicker';
import {
  Store,
  MapPin,
  Clock,
  Briefcase,
  Settings,
  Eye,
  EyeOff,
  SlidersHorizontal,
  UserPlus,
  UserCheck,
  MessageCircle,
  Heart,
  Share2,
  Package,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  Send,
  Trash2,
  Bookmark,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface StorefrontContentProps {
  storeProfile: PublicStoreProfile;
  isOwnStore: boolean;
  isVisitorPreview?: boolean;
  onOpenManageCatalog?: () => void;
  onCloseModal?: () => void;
}

export const StorefrontContent: React.FC<StorefrontContentProps> = ({
  storeProfile,
  isOwnStore,
  isVisitorPreview = false,
  onOpenManageCatalog,
  onCloseModal,
}) => {
  const {
    communityPosts,
    followedStoreIds,
    bookmarkedPostIds,
    toggleFollowStore,
    toggleLikePost,
    toggleBookmarkPost,
    addPostComment,
    deletePostComment,
    deleteCommunityPost,
    getFollowerCount,
    getFollowingCount,
    getFollowersList,
    getFollowingList,
    setSelectedStoreProfileId,
    setActiveTab,
    theme,
  } = useKasra();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const currentUid = user?.id || 'guest';

  const [activeSubTab, setActiveSubTab] = useState<'showcase' | 'posts'>('showcase');
  const [followModalMode, setFollowModalMode] = useState<'followers' | 'following' | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [copiedBanner, setCopiedBanner] = useState(false);

  const primaryBtnClass = isDark
    ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
    : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6]';

  const storePosts = useMemo(
    () => communityPosts.filter((p) => p.userId === storeProfile.userId),
    [communityPosts, storeProfile.userId]
  );

  const followerCount = getFollowerCount(storeProfile.userId);
  const followingCount = getFollowingCount(storeProfile.userId);
  const isFollowing = followedStoreIds.includes(storeProfile.userId);

  const hasMapCoords =
    storeProfile.showMapPublic &&
    typeof storeProfile.latitude === 'number' &&
    !Number.isNaN(storeProfile.latitude) &&
    typeof storeProfile.longitude === 'number' &&
    !Number.isNaN(storeProfile.longitude);

  const waUrl =
    storeProfile.showWhatsappPublic && storeProfile.phone
      ? formatWhatsAppUrl(
          storeProfile.phone,
          `Halo ${storeProfile.storeName}, saya melihat profil & etalase toko Anda di Komunitas KASRA.`
        )
      : '';

  const showOwnerControls = isOwnStore && !isVisitorPreview;

  const handleShareStore = async () => {
    const shareText = `${storeProfile.storeName} (@${storeProfile.handle}) — ${storeProfile.businessCategory}${
      storeProfile.city ? ` • ${storeProfile.city}` : ''
    }`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: storeProfile.storeName,
          text: shareText,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopiedBanner(true);
        setTimeout(() => setCopiedBanner(false), 2500);
      }
    } catch {
      // user cancelled share
    }
  };

  const followListProfiles = useMemo(() => {
    if (!followModalMode) return [];
    return followModalMode === 'followers'
      ? getFollowersList(storeProfile.userId)
      : getFollowingList(storeProfile.userId);
  }, [followModalMode, getFollowersList, getFollowingList, storeProfile.userId]);

  return (
    <div className="space-y-6">
      {/* 1. Storefront Hero Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div className="relative h-40 sm:h-52 bg-slate-100 border-b border-slate-200 overflow-hidden">
          {storeProfile.bannerUrl ? (
            <img
              src={storeProfile.bannerUrl}
              alt={storeProfile.storeName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${
                isDark
                  ? 'bg-gradient-to-r from-[#0D1C42] via-[#1B3166] to-[#22396F]'
                  : 'bg-gradient-to-r from-[#1E3D1C] via-[#2B5428] to-[#3E6B3A]'
              }`}
            >
              <span className="text-xs font-semibold text-white/75 tracking-wide">
                Etalase Resmi Komunitas Usaha KASRA
              </span>
            </div>
          )}

          {/* Top Badges on Cover */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-[11px] font-bold text-slate-900 shadow-xs">
              <Briefcase className="w-3 h-3 text-emerald-600" />
              <span>{storeProfile.businessCategory || 'Usaha Mandiri'}</span>
            </span>
            {(storeProfile.city || storeProfile.province) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-[11px] font-semibold text-slate-800 shadow-xs">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>
                  {[storeProfile.city, storeProfile.province].filter(Boolean).join(', ')}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Avatar, Identity, Action Buttons & Stats */}
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 relative z-10">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                {storeProfile.logoUrl ? (
                  <img
                    src={storeProfile.logoUrl}
                    alt={storeProfile.storeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center text-3xl font-extrabold ${
                      isDark ? 'bg-[#0D1C42] text-[#FCF1D0]' : 'bg-[#1E3D1C] text-[#F8FAF6]'
                    }`}
                  >
                    {(storeProfile.storeName || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                    {storeProfile.storeName || 'Toko Belum Dinamai'}
                  </h2>
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-600 shrink-0"
                    aria-label="Mitra Terdaftar KASRA"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                  <span>@{storeProfile.handle}</span>
                  {storeProfile.ownerName && (
                    <>
                      <span>•</span>
                      <span className="font-sans text-slate-600 font-medium">
                        {storeProfile.ownerName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {!isOwnStore && (
                <button
                  type="button"
                  onClick={() => toggleFollowStore(storeProfile.userId)}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-900 border border-slate-200'
                      : primaryBtnClass
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mengikuti</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Ikuti Toko</span>
                    </>
                  )}
                </button>
              )}

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hubungi WhatsApp</span>
                </a>
              )}

              {showOwnerControls && onOpenManageCatalog && (
                <button
                  type="button"
                  onClick={onOpenManageCatalog}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${primaryBtnClass}`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Atur Produk Etalase</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShareStore}
                className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Bagikan Profil Toko"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {copiedBanner && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Info profil toko disalin ke papan klip!</span>
            </div>
          )}

          {/* Bio & Operational Info */}
          <div className="space-y-2.5">
            {storeProfile.bio ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                {storeProfile.bio}
              </p>
            ) : showOwnerControls ? (
              <p className="text-xs text-slate-400 italic">
                Belum ada bio toko. Tambahkan cerita singkat bisnis Anda melalui Pengaturan Akun & Toko.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 pt-1">
              {storeProfile.operatingHours && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{storeProfile.operatingHours}</span>
                </span>
              )}
              {(storeProfile.address || storeProfile.city) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {[storeProfile.address, storeProfile.city, storeProfile.province]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFollowModalMode('followers')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-left transition-colors cursor-pointer"
            >
              <span className="text-[11px] text-slate-500 block font-medium">Pengikut</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {followerCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFollowModalMode('following')}
              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-left transition-colors cursor-pointer"
            >
              <span className="text-[11px] text-slate-500 block font-medium">Mengikuti</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {followingCount}
              </span>
            </button>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 block font-medium">
                Produk Jadi Etalase
              </span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {storeProfile.showPublicCatalog ? storeProfile.showcaseProducts.length : 0}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 block font-medium">Postingan</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {storePosts.length}
              </span>
            </div>
          </div>

          {/* Interactive Map Preview (Read-Only) */}
          {hasMapCoords && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Titik Lokasi Toko</span>
                </span>
              </div>
              <StoreLocationPicker
                latitude={storeProfile.latitude}
                longitude={storeProfile.longitude}
                storeName={storeProfile.storeName}
                isDark={isDark}
                readOnly={true}
                heightClassName="h-44 sm:h-52"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Sub-Tabs: Etalase Produk Jadi vs Postingan Toko */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('showcase')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'showcase'
                ? primaryBtnClass + ' shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>
              Etalase Produk Jadi (
              {storeProfile.showPublicCatalog ? storeProfile.showcaseProducts.length : 0})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('posts')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'posts'
                ? primaryBtnClass + ' shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Postingan Toko ({storePosts.length})</span>
          </button>
        </div>

        {showOwnerControls && activeSubTab === 'posts' && (
          <button
            type="button"
            onClick={() => {
              onCloseModal?.();
              setActiveTab('community');
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${primaryBtnClass}`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Postingan Baru</span>
          </button>
        )}
      </div>

      {/* TAB A: ETALASE PRODUK JADI */}
      {activeSubTab === 'showcase' && (
        <div>
          {!storeProfile.showPublicCatalog ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-2 shadow-xs">
              <EyeOff className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">
                Etalase Produk Sedang Disembunyikan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Pemilik toko menonaktifkan tampilan katalog produk publik untuk sementara waktu.
              </p>
            </div>
          ) : storeProfile.showcaseProducts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Belum Ada Produk Jadi di Etalase
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {isOwnStore
                    ? 'Tambahkan produk siap jual di Gudang atau klik tombol di bawah untuk memilih produk jadi mana yang ingin ditampilkan ke publik (bahan baku otomatis dikecualikan).'
                    : 'Toko ini belum menampilkan daftar produk jadi pada etalase publiknya.'}
                </p>
              </div>
              {showOwnerControls && onOpenManageCatalog && (
                <button
                  type="button"
                  onClick={onOpenManageCatalog}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${primaryBtnClass}`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Pilih Produk Jadi untuk Etalase</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {storeProfile.showcaseProducts.map((prod) => {
                const prodWaUrl =
                  storeProfile.showWhatsappPublic && storeProfile.phone
                    ? formatWhatsAppUrl(
                        storeProfile.phone,
                        `Halo ${storeProfile.storeName}, saya tertarik memesan produk "${prod.name}" (${formatRupiah(
                          prod.sellingPrice
                        )}/${prod.unit}) dari Etalase KASRA.`
                      )
                    : '';

                return (
                  <div
                    key={prod.id}
                    className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl overflow-hidden flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
                  >
                    <div>
                      <div className="relative h-52 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 overflow-hidden">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-contain drop-shadow-xs"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-slate-300" />
                        )}

                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-[10px] font-bold text-slate-700">
                          {prod.subcategory || prod.category}
                        </span>
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                          {prod.name}
                        </h3>
                        {prod.publicDescription && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {prod.publicDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Harga Jual
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 font-mono">
                          {formatRupiah(prod.sellingPrice)}
                          <span className="text-[11px] font-normal text-slate-500">
                            /{prod.unit}
                          </span>
                        </span>
                      </div>

                      {prodWaUrl && (
                        <a
                          href={prodWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors shrink-0"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>Pesan</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB B: POSTINGAN KOMUNITAS TOKO */}
      {activeSubTab === 'posts' && (
        <div className="space-y-4">
          {storePosts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-2 shadow-xs">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Postingan Komunitas</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {isOwnStore
                  ? 'Bagikan kabar menu baru, promo, atau ajakan kolaborasi UMKM di tab Komunitas Usaha.'
                  : 'Toko ini belum membagikan postingan di lini masa komunitas.'}
              </p>
            </div>
          ) : (
            storePosts.map((post) => {
              const isLiked = post.likedByUserIds.includes(currentUid);
              const isBookmarked = bookmarkedPostIds.includes(post.id);
              const commentsOpen = expandedCommentsPostId === post.id;

              return (
                <div
                  key={post.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-900">
                        {post.storeName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        @{post.storeHandle}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        • {formatRelativeTimeIndo(post.createdAt)}
                      </span>
                    </div>

                    {post.userId === currentUid && (
                      <button
                        type="button"
                        onClick={() => deleteCommunityPost(post.id)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Postingan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                    {post.caption}
                  </p>

                  {post.imageUrls.length > 0 && (
                    <div
                      className={`grid gap-2.5 ${
                        post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                      }`}
                    >
                      {post.imageUrls.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-80 flex items-center justify-center"
                        >
                          <img
                            src={imgUrl}
                            alt={post.storeName}
                            className="w-full h-full object-cover max-h-80"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {post.taggedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.taggedProducts.map((tp) => (
                        <div
                          key={tp.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                        >
                          <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800">{tp.name}</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {formatRupiah(tp.sellingPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => toggleLikePost(post.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                          isLiked ? 'text-rose-600' : 'text-slate-600 hover:text-rose-600'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`}
                        />
                        <span>{post.likedByUserIds.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCommentsPostId(commentsOpen ? null : post.id)
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments.length} Komentar</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleBookmarkPost(post.id)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Comments Thread */}
                  {commentsOpen && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      {post.comments.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedStoreProfileId(c.userId)}
                                className="font-bold text-slate-900 hover:underline cursor-pointer"
                              >
                                {c.storeName}
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono">
                                @{c.storeHandle}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                • {formatRelativeTimeIndo(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-700 mt-0.5">{c.content}</p>
                          </div>
                          {c.userId === currentUid && (
                            <button
                              type="button"
                              onClick={() => deletePostComment(post.id, c.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const text = (commentDrafts[post.id] || '').trim();
                          if (!text) return;
                          addPostComment(post.id, text);
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          placeholder="Tulis balasan atau diskusi..."
                          className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-full px-3.5 py-2 text-xs text-slate-900 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!(commentDrafts[post.id] || '').trim()}
                          className={`p-2 rounded-full disabled:opacity-40 cursor-pointer ${primaryBtnClass}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Followers / Following List Modal */}
      {followModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {followModalMode === 'followers'
                  ? `Pengikut ${storeProfile.storeName} (${followListProfiles.length})`
                  : `Toko yang Diikuti (${followListProfiles.length})`}
              </h3>
              <button
                type="button"
                onClick={() => setFollowModalMode(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5">
              {followListProfiles.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  Belum ada daftar toko pada bagian ini.
                </p>
              ) : (
                followListProfiles.map((fp) => {
                  const amFollowing = followedStoreIds.includes(fp.userId);
                  const isMe = fp.userId === currentUid;
                  return (
                    <div
                      key={fp.userId}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFollowModalMode(null);
                          setSelectedStoreProfileId(fp.userId);
                        }}
                        className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-700">
                          {fp.logoUrl ? (
                            <img
                              src={fp.logoUrl}
                              alt={fp.storeName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            fp.storeName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {fp.storeName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {fp.businessCategory}
                            {fp.city ? ` • ${fp.city}` : ''}
                          </div>
                        </div>
                      </button>

                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => toggleFollowStore(fp.userId)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 cursor-pointer ${
                            amFollowing
                              ? 'bg-white border border-slate-200 text-slate-700'
                              : primaryBtnClass
                          }`}
                        >
                          {amFollowing ? 'Mengikuti' : 'Ikuti'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   MAIN OWN PROFILE VIEW (activeTab === 'profile')
   ============================================================================ */
export const ProfileView: React.FC = () => {
  const {
    myPublicStoreProfile,
    finishedGoodsProducts,
    products,
    profile,
    updateProfile,
    updateProduct,
    setActiveTab,
    theme,
  } = useKasra();
  const isDark = theme === 'dark';

  const [isVisitorPreview, setIsVisitorPreview] = useState(false);
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);

  const rawMaterialExcludedCount = Math.max(
    0,
    products.length - finishedGoodsProducts.length
  );

  const primaryBtnClass = isDark
    ? 'bg-[#FCF1D0] hover:opacity-95 text-[#0D1C42]'
    : 'bg-[#1E3D1C] hover:bg-[#162E14] text-[#F8FAF6]';

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* Top Owner Bar (Separated from Account Settings) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Profil Publik & Etalase Toko
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Halaman resmi toko Anda yang dilihat anggota komunitas & pelanggan. Hanya produk jadi yang dapat ditampilkan (bahan baku & HPP selalu privat).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Visitor Preview */}
          <button
            type="button"
            onClick={() => setIsVisitorPreview((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
              isVisitorPreview
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {isVisitorPreview ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                <span>Keluar Mode Pengunjung</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pratinjau sebagai Pengunjung</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Pengaturan & Lokasi</span>
          </button>
        </div>
      </div>

      {isVisitorPreview && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-3">
          <span>
            <strong>Mode Pratinjau Pengunjung Aktif:</strong> Inilah tampilan persis profil toko Anda ketika dilihat oleh pengguna lain di Komunitas KASRA.
          </span>
          <button
            type="button"
            onClick={() => setIsVisitorPreview(false)}
            className="font-bold underline shrink-0 cursor-pointer"
          >
            Kembali ke Mode Pemilik
          </button>
        </div>
      )}

      {/* Render Storefront */}
      <StorefrontContent
        storeProfile={myPublicStoreProfile}
        isOwnStore={true}
        isVisitorPreview={isVisitorPreview}
        onOpenManageCatalog={() => setIsCatalogManagerOpen(true)}
      />

      {/* Manage Showcase Products Modal (Finished Goods ONLY) */}
      {isCatalogManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Atur Etalase Produk Jadi Toko</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih produk jadi mana yang tampil di profil toko Anda ({rawMaterialExcludedCount} item bahan baku/kemasan otomatis disembunyikan)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogManagerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Master Switch */}
              <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Aktifkan Etalase Katalog di Profil Publik
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Jika dimatikan, seluruh daftar produk tidak ditampilkan ke pengunjung
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profile.showPublicCatalog !== false}
                  onChange={(e) => updateProfile({ showPublicCatalog: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                />
              </label>

              {finishedGoodsProducts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Belum Ada Produk Jadi di Gudang
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Tambahkan barang dengan kategori selain &ldquo;Bahan Baku&rdquo; atau &ldquo;Kemasan&rdquo; pada menu Gudang agar muncul sebagai produk jadi siap jual.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCatalogManagerOpen(false);
                      setActiveTab('storage');
                    }}
                    className={`mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${primaryBtnClass}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buka Gudang & Tambah Produk Jadi</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {finishedGoodsProducts.map((prod) => {
                    const isShown = prod.isPublicShowcase !== false;
                    return (
                      <div
                        key={prod.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {prod.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                {prod.category}
                              </span>
                            </div>
                            <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                              Harga Publik: {formatRupiah(prod.sellingPrice)}/{prod.unit}
                            </div>
                            <input
                              type="text"
                              value={prod.publicDescription || ''}
                              onChange={(e) =>
                                updateProduct(prod.id, { publicDescription: e.target.value })
                              }
                              placeholder="Tulis deskripsi singkat produk untuk pengunjung (opsional)..."
                              className="mt-1.5 w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateProduct(prod.id, { isPublicShowcase: !isShown })
                          }
                          className={`px-3.5 py-2 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                            isShown
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/70'
                          }`}
                        >
                          {isShown ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ditampilkan</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Disembunyikan</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsCatalogManagerOpen(false)}
                className={`px-5 py-2 rounded-full text-xs font-bold cursor-pointer ${primaryBtnClass}`}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   GLOBAL STOREFRONT PROFILE MODAL (Opens when clicking any store in Community)
   ============================================================================ */
export const StoreProfileModal: React.FC = () => {
  const {
    selectedStoreProfileId,
    setSelectedStoreProfileId,
    communityProfiles,
    myPublicStoreProfile,
    setActiveTab,
    theme,
  } = useKasra();
  const { user } = useAuth();
  const currentUid = user?.id || 'guest';
  const isDark = theme === 'dark';

  if (!selectedStoreProfileId) return null;

  const targetProfile =
    selectedStoreProfileId === currentUid
      ? myPublicStoreProfile
      : communityProfiles.find((p) => p.userId === selectedStoreProfileId);

  if (!targetProfile) return null;

  const isOwn = targetProfile.userId === currentUid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col ${
          isDark ? 'bg-[#0D1C42]' : 'bg-[#EFF2EC]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900 truncate">
              Profil Toko — {targetProfile.storeName} (@{targetProfile.handle})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOwn && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStoreProfileId(null);
                  setActiveTab('profile');
                }}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
              >
                Buka Halaman Penuh
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedStoreProfileId(null)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50/70">
          <StorefrontContent
            storeProfile={targetProfile}
            isOwnStore={isOwn}
            onCloseModal={() => setSelectedStoreProfileId(null)}
          />
        </div>
      </div>
    </div>
  );
};
