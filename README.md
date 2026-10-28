# 💼 KASRA (Kinetic AI System for Retail Analytics & Accounting)

<div align="center">

![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)

**Sistem Pembukuan Kas Digital, Manajemen Gudang Multi-Batch FEFO, dan Studio Analisis Keuangan Berbasis AI untuk UMKM Modern.**

[Fitur Utama](#-fitur-utama) • [Arsitektur Sistem](#-arsitektur-sistem) • [Panduan Instalasi](#-panduan-instalasi) • [Tangkapan Layar & UI](#-desain-antarmuka)

</div>

---

## 👥 WongLarpers

Kasra dibuat oleh Kelompok **WongLarpers**, sekelompok mahasiswa semester satu Informatika Telkom University. Kelompok ini beranggotakan dari tiga orang:

1. Naufal Rama Octantyo
2. Indo Frederika Suherdin
3. Muhammad Arifathul Rahman

---

---

## 📌 Tentang KASRA

**KASRA** (_Kinetic AI System for Retail Analytics & Accounting_) dirancang khusus untuk memecahkan friksi terbesar operasional UMKM retail, F&B, kafe, toko kelontong, dan distributor grosir: **pencatatan keuangan dan inventaris yang lambat, rentan salah hitung, serta sulit memisahkan bahan baku kedaluwarsa.**

Dengan memadukan **Voice AI Multi-Klausul**, **Optical Character Recognition (OCR) Struk**, serta manajemen stok **FEFO (_First Expired, First Out_) multi-batch bertanggal**, pemilik usaha dapat mencatat puluhan transaksi dan mutasi gudang hanya dengan berbicara beberapa detik atau mengunggah foto struk belanjaan.

---

## ✨ Fitur Utama

### 🎙️ 1. Asisten Suara Omni-Modal (Multi-Clause Voice AI)

- **Pemrosesan Kalimat Majemuk**: Memahami kalimat multi-kondisi dalam satu tarikan nafas (misal: _"Tadi gue beli ayam 6 ekor 120 ribu, terus ada yang beli kopi 5 cup sama roti 2"_).
- **Otomasi Neraca Kas & Stok**: Secara cerdas membedakan transaksi kulakan (_stok bertambah & kas berkurang_) dan penjualan kasir (_stok berkurang & kas bertambah_).
- **Anti-Halusinasi & 100% Transparan**: Setiap instruksi suara tidak langsung mengubah database, melainkan ditampilkan dalam bentuk **Draf Konfirmasi Interaktif** yang dapat diedit sebelum disetujui.
- **Deteksi Stok Tidak Cukup**: Memberikan peringatan dini saat kuantitas penjualan melebihi sisa fisik di gudang.

### 📦 2. Manajemen Gudang & Buku Mutasi Keluar-Masuk (FEFO Multi-Batch)

- **Pelacak Batch Bertanggal Otomatis**: Penamaan batch otomatis menggunakan format tanggal masuk (`Batch 24 Oktober 2026`, `Batch 27 Oktober 2026`).
- **Transisi Status Kedaluwarsa Otomatis**: Jika Batch pertama stoknya telah habis (`qty = 0`), status kedaluwarsa produk otomatis berpindah ke batch berikutnya yang masih memiliki sisa stok.
- **Buku Mutasi Gudang (Kasir Versi Gudang)**: Log kronologis pencatatan mutasi stok (_Masuk/Kulakan_, _Keluar/Penjualan_, _Susut/Rusak/Basi_, dan _Koreksi Opname_) lengkap dengan kode batch, lokasi rak penyimpanan, dan nilai finansial HPP.
- **Struktur Kategori 2-Tier**: Kategori utama universal (Bahan Baku & Dapur, Produk Jadi, Kemasan, Operasional) dan sub-kategori spesifik (Daging Ayam, Sayuran, Biji Kopi, dsb.).
- **Unggah Foto Barang Kustom**: Pengguna bebas mengunggah foto produk langsung dari perangkat tanpa dependensi preset luar.

### 🧮 3. Kalkulator HPP & Penetapan Margin Keuntungan (3 Metode)

- **Metode Bagi Grosir / Dus**: Menghitung HPP per unit dari total harga beli dus, biaya ongkos kirim/logistik, dan persentase toleransi susut.
- **Metode Resep & Komposisi Bahan**: Membagi biaya per porsi berdasarkan komponen bahan baku, kemasan, serta overhead utilitas/listrik per porsi.
- **Input Bebas / Manual**: Untuk barang retail siap jual.
- **Slider Margin Interaktif**: Slider persentase laba kotor yang secara instan mengalkulasi rekomendasi harga jual ke pelanggan.

### 📊 4. Studio Analisis & Generator Laporan Perbankan (KUR)

- **Multi-Timeframe**: Pilihan analisis periode **Per Hari**, **Per Minggu**, **Per Bulan**, dan **Per Tahun**.
- **Model Diagram Lengkap**:
  - _Diagram Batang_: Arus kas masuk vs arus kas keluar.
  - _Tren Area_: Akumulasi pertumbuhan saldo kas bersih.
  - _Diagram Donat_: Komposisi alokasi beban usaha per kategori (dilengkapi tooltip nominal dan persentase kontribusi).
  - _Diagram Terpadu_: Omset penjualan vs rasio margin laba (%).
- **Ekspor 1-Klik**:
  - File **Excel (.xlsx)** lengkap dengan lembar jurnal dan ringkasan arus kas.
  - Dokumen cetak **PDF Resmi Standar Bank** (siap dilampirkan untuk pengajuan Kredit Usaha Rakyat / KUR).
- **Spreadsheet Interaktif In-App**: Tabel editable bergaya Excel langsung di dalam browser tanpa perlu membuka aplikasi pihak ketiga.

---

## 🎨 Desain Antarmuka (Haulix Palette)

KASRA dibangun dengan estetika minimalis profesional:

- **Background Utama**: Dark Warm Charcoal (`#121214`, `#171719`)
- **Elevated Surfaces**: Dark Zinc (`#1c1c1f`, `#202024`)
- **Border & Pembatas**: Subtle Dark Line (`#2c2c32`)
- **Aksen Utama**: Warm Amber Gold (`#f2aa4b`)
- **Indikator Finansial**: Emerald (`#10b981`) untuk surplus kas, Rose (`#f43f5e`) untuk beban & susut.
- **Ergonomi**: Bebas efek silau, kursor hover gelap transparan, serta tombol dan datepicker ramah sentuhan layar.

---

## 🛠️ Arsitektur & Teknologi

| Komponen          | Teknologi                                                                      |
| :---------------- | :----------------------------------------------------------------------------- |
| **Framework**     | [Next.js 16](https://nextjs.org/) (App Router, Turbopack)                      |
| **Library UI**    | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling**       | [Tailwind CSS 3.4](https://tailwindcss.com/)                                   |
| **Icons**         | [Lucide React](https://lucide.dev/)                                            |
| **Grafik & Data** | [Recharts](https://recharts.org/)                                              |
| **Export Engine** | `xlsx` (SheetJS), `jspdf`, `jspdf-autotable`                                   |
| **AI Parser**     | Native Tokenizer Regex & Heuristic Clause Extractor (Gemini-Ready)             |

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat

- [Node.js](https://nodejs.org/) versi 18.18 atau lebih baru
- npm, pnpm, atau yarn

### 1. Kloning Repositori

```bash
git clone https://github.com/indofrederika-source/Kasra.git
cd Kasra
```

### 2. Pasang Dependensi

```bash
npm install
```

### 3. Jalankan Server Pengembangan

```bash
npm run dev
```

Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

### 4. Build Produksi

```bash
npm run build
npm run start
```

---

## 📁 Struktur Direktori

```text
Kasra/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout dengan font Geist & metadata KASRA
│   │   ├── page.tsx           # Entry page controller & tab router
│   │   └── globals.css        # Tailwind directives & tema warna
│   ├── components/
│   │   ├── dashboard/         # Dashboard ringkasan keuangan & stok kritis
│   │   ├── cash/              # Pencatatan kas harian & filter transaksi
│   │   ├── storage/           # Katalog fisik, buku mutasi gudang & modal produk
│   │   ├── analytics/         # Grafik Recharts, spreadsheet & export bank
│   │   ├── promo/             # Kalkulator diskon & bundling deadstock
│   │   ├── settings/          # Pengaturan profil toko & manajemen akun
│   │   ├── shared/            # Modal suara, OCR struk & draf konfirmasi AI
│   │   └── ui/                # Datepicker kustom, dropdown, modal konfirmasi
│   ├── lib/
│   │   ├── ai/                # Parser suara multi-klausul & autocorrect Indo
│   │   ├── export/            # Engine pembuat Excel & PDF resmi bank
│   │   ├── store/             # KasraContext (State Management sentral)
│   │   ├── mockData.ts        # Data awal realistis UMKM retail
│   │   └── utils.ts           # Formatter Rupiah, tanggal Indo, FEFO batching
│   └── types/
│       └── index.ts           # Definisi TypeScript untuk transaksi, stok & draf
├── public/                    # Aset statis & logo
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **MIT**. Bebas digunakan dan dikembangkan untuk kemajuan ekosistem UMKM Indonesia.
