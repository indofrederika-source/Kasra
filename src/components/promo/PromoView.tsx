'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useKasra } from '@/lib/store/KasraContext';
import { Product } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import {
  Download,
  Copy,
  Check,
  Package,
  Layers,
  Palette,
  Type,
  Megaphone,
} from 'lucide-react';

export const PromoView: React.FC = () => {
  const { products, selectedProductForPromo } = useKasra();

  // Active product on canvas
  const [activeProduct, setActiveProduct] = useState<Product>(
    selectedProductForPromo || products[0]
  );

  // Canvas Format: 1:1 (Square) vs 9:16 (Story)
  const [canvasFormat, setCanvasFormat] = useState<'square' | 'story'>('square');

  // Promotional Themes
  const [promoTheme, setPromoTheme] = useState<'flash_sale' | 'new_item' | 'special_deal'>('flash_sale');

  // Editable text elements
  const [headline, setHeadline] = useState('PROMO SPESIAL HARI INI');
  const [badgeText, setBadgeText] = useState('DISKON 25%');
  const [customPrice, setCustomPrice] = useState(
    Math.round((selectedProductForPromo || products[0])?.sellingPrice * 0.75).toString()
  );
  const [bgColor, setBgColor] = useState('#141417');

  // AI-generated WA caption
  const [aiCaption, setAiCaption] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update headline & badge whenever theme changes
  useEffect(() => {
    if (promoTheme === 'flash_sale') {
      setHeadline('CUCI GUDANG HEMAT');
      setBadgeText('POTONGAN 30%');
      setCustomPrice(Math.round(activeProduct.sellingPrice * 0.7).toString());
    } else if (promoTheme === 'new_item') {
      setHeadline('MENU BARU FAVORIT');
      setBadgeText('HARGA COBA Rp');
      setCustomPrice(Math.round(activeProduct.sellingPrice * 0.85).toString());
    } else {
      setHeadline('PAKET HEMAT KELUARGA');
      setBadgeText('SERBA SPESIAL');
      setCustomPrice(Math.round(activeProduct.sellingPrice * 0.8).toString());
    }
  }, [promoTheme, activeProduct]);

  // Update caption
  useEffect(() => {
    const orig = formatRupiah(activeProduct.sellingPrice);
    const promo = formatRupiah(parseInt(customPrice, 10) || activeProduct.sellingPrice);
    const text = `Halo Sobat KASRA! 👋\n\nKabar gembira buat kamu! Hari ini ada ${headline} untuk menu spesial favorit kita:\n✨ *${activeProduct.name}*\n\nHarga Normal: ~${orig}~\n*Harga Promo Spesial: CUMA ${promo}!* 🔥\n\nStok sangat terbatas ya, jangan sampai kehabisan! Pesan sekarang sebelum promo berakhir hari ini:\n👉 Langsung chat WhatsApp admin toko di sini!\n\n_KASRA Official Store_`;
    setAiCaption(text);
  }, [activeProduct, headline, customPrice]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvasFormat === 'square' ? 600 : 540;
    const height = canvasFormat === 'square' ? 600 : 960;

    canvas.width = width;
    canvas.height = height;

    // 1. Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Subtle Radial Glow
    const gradient = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      20,
      width / 2,
      height * 0.35,
      width * 0.7
    );
    gradient.addColorStop(0, 'rgba(242, 170, 75, 0.08)');
    gradient.addColorStop(0.5, 'transparent');
    gradient.addColorStop(1, 'rgba(18, 18, 20, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Border Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // 3. Store Brand Header
    ctx.fillStyle = '#f2aa4b';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KOPI & ROTI KASRA', width / 2, 55);

    // 4. Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px sans-serif';
    ctx.fillText(headline, width / 2, 90);

    // 5. Badge Pill
    ctx.fillStyle = '#f2aa4b';
    ctx.beginPath();
    ctx.roundRect(width / 2 - 70, 105, 140, 28, 14);
    ctx.fill();

    ctx.fillStyle = '#121214';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(badgeText, width / 2, 124);

    // 6. Draw Product Image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeProduct.imageUrl;
    img.onload = () => {
      const imgSize = canvasFormat === 'square' ? 260 : 340;
      const imgX = (width - imgSize) / 2;
      const imgY = canvasFormat === 'square' ? 150 : 180;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgSize, imgSize, 20);
      ctx.clip();
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(imgX, imgY, imgSize, imgSize);

      // 7. Product Name
      const textStartY = imgY + imgSize + 40;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(activeProduct.name, width / 2, textStartY);

      // 8. Strikethrough Price vs Promo Price
      const priceY = textStartY + 45;
      const originalPriceText = formatRupiah(activeProduct.sellingPrice);
      const promoPriceText = formatRupiah(parseInt(customPrice, 10) || activeProduct.sellingPrice);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#71717a';
      ctx.fillText(originalPriceText, width / 2 - 70, priceY);

      const origMetrics = ctx.measureText(originalPriceText);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 70 - origMetrics.width / 2 - 4, priceY - 5);
      ctx.lineTo(width / 2 - 70 + origMetrics.width / 2 + 4, priceY - 5);
      ctx.stroke();

      ctx.font = 'bold 30px sans-serif';
      ctx.fillStyle = '#f2aa4b';
      ctx.fillText(promoPriceText, width / 2 + 70, priceY + 3);

      // 9. Footer Call to action
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(
        canvasFormat === 'square'
          ? 'Pesan Sekarang via WhatsApp Toko'
          : 'Balas Story Ini untuk Pesan Langsung!',
        width / 2,
        height - 45
      );
    };
  }, [
    activeProduct,
    canvasFormat,
    headline,
    badgeText,
    customPrice,
    bgColor,
  ]);

  const handleDownloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Poster-Promo-${activeProduct.name.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(aiCaption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* 1. Header & Quick Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Promosi Studio & Pembuat Poster
          </h1>
          <p className="text-xs text-[#8a8a92] mt-1">
            Kanvas desain promosi interaktif (100% dapat diedit) & pembuat pesan siaran WhatsApp
          </p>
        </div>

        <button
          onClick={handleDownloadPoster}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-stone-200 text-black text-xs font-bold transition-all shadow-md active:scale-95 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Desain (HD PNG)</span>
        </button>
      </div>

      {/* 2. Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pick Product from Storage */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-stone-300" />
              <span>1. Pilih Barang dari Gudang</span>
            </label>

            <CustomDropdown
              value={activeProduct.id}
              onChange={(val) => {
                const found = products.find((p) => p.id === val);
                if (found) {
                  setActiveProduct(found);
                  setCustomPrice(Math.round(found.sellingPrice * 0.75).toString());
                }
              }}
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} — ${formatRupiah(p.sellingPrice)} (${p.currentStock} ${p.unit})`,
              }))}
            />
          </div>

          {/* Format & Theme Selection */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-300" />
              <span>2. Format Ukuran & Tema</span>
            </label>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#171719] rounded-xl border border-[#2c2c32] text-xs font-medium">
              <button
                type="button"
                onClick={() => setCanvasFormat('square')}
                className={`py-1.5 rounded-lg transition-colors ${
                  canvasFormat === 'square'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Persegi (1:1 Feed / WA)
              </button>
              <button
                type="button"
                onClick={() => setCanvasFormat('story')}
                className={`py-1.5 rounded-lg transition-colors ${
                  canvasFormat === 'story'
                    ? 'bg-white text-black font-bold shadow'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Vertikal (9:16 Story)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={() => setPromoTheme('flash_sale')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  promoTheme === 'flash_sale'
                    ? 'bg-[#2a171c] border-[#48202a] text-rose-300 font-bold'
                    : 'bg-[#171719] border-[#2c2c32] text-stone-400'
                }`}
              >
                <div className="text-[10px]">🔥 Diskon</div>
                <div className="text-xs">Cuci Gudang</div>
              </button>

              <button
                type="button"
                onClick={() => setPromoTheme('new_item')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  promoTheme === 'new_item'
                    ? 'bg-[#242428] border-white/20 text-white font-bold'
                    : 'bg-[#171719] border-[#2c2c32] text-stone-400'
                }`}
              >
                <div className="text-[10px]">✨ Baru</div>
                <div className="text-xs">Menu Hits</div>
              </button>

              <button
                type="button"
                onClick={() => setPromoTheme('special_deal')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  promoTheme === 'special_deal'
                    ? 'bg-[#282015] border-[#44331e] text-[#f2aa4b] font-bold'
                    : 'bg-[#171719] border-[#2c2c32] text-stone-400'
                }`}
              >
                <div className="text-[10px]">🎁 Hemat</div>
                <div className="text-xs">Paket Santai</div>
              </button>
            </div>
          </div>

          {/* Interactive Visual Customizer */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-stone-300" />
              <span>3. Kustomisasi Teks & Harga</span>
            </label>

            <div className="space-y-1">
              <label className="text-[11px] text-[#8a8a92]">Judul Headline Poster</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#8a8a92]">Teks Badge / Pita</label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full bg-[#171719] border border-[#2c2c32] rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-[#8a8a92]">Harga Coret / Diskon</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full bg-[#171719] border border-[#2c2c32] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] text-[#8a8a92] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-stone-400" />
                <span>Warna Latar Belakang Kanvas</span>
              </label>
              <div className="flex items-center gap-2.5">
                {[
                  { label: 'Matte Charcoal', color: '#141417' },
                  { label: 'Deep Espresso', color: '#1c1613' },
                  { label: 'Pure Dark', color: '#0d0d0f' },
                  { label: 'Slate Carbon', color: '#191b20' },
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => setBgColor(item.color)}
                    style={{ backgroundColor: item.color }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      bgColor === item.color ? 'border-white scale-110' : 'border-[#3a3a40]'
                    }`}
                    title={item.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Canvas & Copywriting Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 flex flex-col items-center justify-center shadow-2xl relative">
            <span className="text-[11px] text-[#71717a] mb-2 font-mono">
              Pratinjau Kanvas ({canvasFormat === 'square' ? '600 x 600 px' : '540 x 960 px'})
            </span>

            <div className="overflow-hidden rounded-2xl shadow-2xl border border-[#2c2c32]">
              <canvas
                ref={canvasRef}
                className="max-h-[460px] w-auto object-contain block mx-auto"
              />
            </div>
          </div>

          {/* Copywriting Box */}
          <div className="bg-[#1c1c1f] border border-[#2c2c32] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-stone-300" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pesan Broadcast WhatsApp Toko
                </h3>
              </div>

              <button
                onClick={handleCopyCaption}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#202024] hover:bg-[#28282e] text-white border border-[#2c2c32] text-xs font-medium transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={aiCaption}
              onChange={(e) => setAiCaption(e.target.value)}
              className="w-full bg-[#171719] border border-[#2c2c32] focus:border-white/30 rounded-xl p-3.5 text-xs text-stone-200 leading-relaxed focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
