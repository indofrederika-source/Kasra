'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  ExternalLink,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';

interface SearchResultItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    county?: string;
    municipality?: string;
    state_district?: string;
    state?: string;
  };
}

interface StoreLocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  storeName?: string;
  isDark?: boolean;
  readOnly?: boolean;
  heightClassName?: string;
  onChangeCoordinates?: (lat: number, lng: number) => void;
  onDetectedLocationMeta?: (meta: {
    address: string;
    city?: string;
    province?: string;
  }) => void;
}

const DEFAULT_INDONESIA_CENTER = { lat: -6.2088, lng: 106.8456 }; // Jakarta center fallback

export const StoreLocationPicker: React.FC<StoreLocationPickerProps> = ({
  latitude,
  longitude,
  storeName,
  isDark = false,
  readOnly = false,
  heightClassName = 'h-64 sm:h-72',
  onChangeCoordinates,
  onDetectedLocationMeta,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const hasCoords =
    typeof latitude === 'number' &&
    !Number.isNaN(latitude) &&
    typeof longitude === 'number' &&
    !Number.isNaN(longitude);

  const activeLat = hasCoords ? (latitude as number) : DEFAULT_INDONESIA_CENTER.lat;
  const activeLng = hasCoords ? (longitude as number) : DEFAULT_INDONESIA_CENTER.lng;

  const reverseGeocodeCoordinates = async (
    lat: number,
    lng: number,
    autoApplyAddress = false
  ) => {
    if (!onDetectedLocationMeta) return;
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`
      );
      if (!res.ok) return;
      const data = await res.json();
      const addr = data?.address || {};
      const detectedCity =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.city_district ||
        addr.county ||
        addr.state_district ||
        '';
      const detectedProvince = addr.state || '';
      const displayAddress = data?.display_name || '';

      if (autoApplyAddress && displayAddress) {
        onDetectedLocationMeta({
          address: displayAddress,
          city: detectedCity || undefined,
          province: detectedProvince || undefined,
        });
        setStatusNote('Alamat & daerah berhasil diisi dari titik peta.');
        setTimeout(() => setStatusNote(null), 3000);
      }
    } catch {
      // ignore network error silently
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Initialize Leaflet Map on Client
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;
      leafletModuleRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [activeLat, activeLng],
        zoom: hasCoords ? 15 : 11,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const pinHtml = `
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: #1E3D1C;
          border: 3px solid #FCF1D0;
          box-shadow: 0 8px 20px rgba(13,28,66,0.38);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FCF1D0;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'kasra-leaflet-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 34],
      });

      const marker = L.marker([activeLat, activeLng], {
        draggable: !readOnly,
        icon: customIcon,
      }).addTo(map);

      if (storeName) {
        marker.bindTooltip(storeName, {
          direction: 'top',
          offset: [0, -28],
        });
      }

      if (!readOnly) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const roundedLat = Number(pos.lat.toFixed(6));
          const roundedLng = Number(pos.lng.toFixed(6));
          onChangeCoordinates?.(roundedLat, roundedLng);
        });

        map.on('click', (e: any) => {
          const roundedLat = Number(e.latlng.lat.toFixed(6));
          const roundedLng = Number(e.latlng.lng.toFixed(6));
          marker.setLatLng([roundedLat, roundedLng]);
          onChangeCoordinates?.(roundedLat, roundedLng);
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Keep marker & camera synced when parent updates lat/lng (e.g. selecting a city preset or search result)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !hasCoords) return;
    const currentPos = markerRef.current.getLatLng();
    const diff =
      Math.abs(currentPos.lat - (latitude as number)) +
      Math.abs(currentPos.lng - (longitude as number));
    if (diff > 0.00005) {
      markerRef.current.setLatLng([latitude as number, longitude as number]);
      mapInstanceRef.current.setView(
        [latitude as number, longitude as number],
        Math.max(mapInstanceRef.current.getZoom(), 15),
        { animate: true }
      );
    }
  }, [latitude, longitude, hasCoords]);

  const handleSearchLocation = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=id&accept-language=id&q=${encodeURIComponent(
          q
        )}`
      );
      if (res.ok) {
        const data: SearchResultItem[] = await res.json();
        setSearchResults(data || []);
      }
    } catch {
      setStatusNote('Gagal mencari lokasi. Pastikan koneksi internet aktif.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: SearchResultItem) => {
    const lat = Number(parseFloat(item.lat).toFixed(6));
    const lng = Number(parseFloat(item.lon).toFixed(6));
    onChangeCoordinates?.(lat, lng);

    const addr = item.address || {};
    const detectedCity =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.county ||
      addr.state_district ||
      '';
    const detectedProvince = addr.state || '';
    onDetectedLocationMeta?.({
      address: item.display_name,
      city: detectedCity || undefined,
      province: detectedProvince || undefined,
    });

    setSearchResults([]);
    setSearchQuery('');
    setStatusNote('Titik peta & alamat diperbarui dari hasil pencarian.');
    setTimeout(() => setStatusNote(null), 3000);
  };

  const handleUseCurrentGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatusNote('Browser perangkat ini tidak mendukung GPS.');
      return;
    }
    setIsLocatingGps(true);
    setStatusNote(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onChangeCoordinates?.(lat, lng);
        reverseGeocodeCoordinates(lat, lng, true);
        setIsLocatingGps(false);
      },
      () => {
        setIsLocatingGps(false);
        setStatusNote('Izin lokasi GPS ditolak atau tidak tersedia.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${activeLat},${activeLng}`;

  return (
    <div className="kasra-map-wrapper space-y-2.5">
      {!readOnly && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchLocation();
                }
              }}
              placeholder="Cari jalan, gedung, kelurahan, atau kota di peta..."
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-400 rounded-xl pl-9 pr-20 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-14 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSearchLocation()}
              disabled={isSearching || !searchQuery.trim()}
              className={`absolute right-1.5 top-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                isDark
                  ? 'bg-[#FCF1D0] text-[#0D1C42]'
                  : 'bg-[#1E3D1C] text-[#F8FAF6]'
              }`}
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cari'}
            </button>

            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                {searchResults.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start gap-2 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-800 line-clamp-2">
                      {item.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isLocatingGps}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer shrink-0"
          >
            {isLocatingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Titik GPS Saya</span>
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100">
        <div ref={mapContainerRef} className={`w-full ${heightClassName}`} />
        {!readOnly && (
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {hasCoords ? (
                  <>
                    Koordinat Pin:{' '}
                    <strong className="font-mono text-slate-900">
                      {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                    </strong>{' '}
                    <span className="text-slate-400">(Klik peta atau geser pin untuk koreksi)</span>
                  </>
                ) : (
                  'Klik pada peta atau geser pin hijau untuk menandai lokasi presisi toko Anda'
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasCoords && onDetectedLocationMeta && (
                <button
                  type="button"
                  disabled={isReverseGeocoding}
                  onClick={() =>
                    reverseGeocodeCoordinates(latitude as number, longitude as number, true)
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold transition-colors cursor-pointer"
                >
                  {isReverseGeocoding ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  <span>Isi Alamat dari Pin</span>
                </button>
              )}

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold transition-colors"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {readOnly && (
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-600 truncate">
              Titik lokasi terverifikasi di peta
            </span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold transition-colors shrink-0"
            >
              <span>Buka di Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {statusNote && (
        <p className="text-[11px] text-emerald-700 font-medium">{statusNote}</p>
      )}
    </div>
  );
};
