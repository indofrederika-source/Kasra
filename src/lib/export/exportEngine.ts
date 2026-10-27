import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Product, StoreProfile } from '@/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

/**
 * 1-Click Excel (.xlsx) Generator for KASRA
 * Generates structured spreadsheets with styled headers, borders, and number formatting.
 */
export async function exportToExcel(
  profile: StoreProfile,
  transactions: Transaction[],
  products: Product[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = `KASRA - ${profile.storeName}`;
  workbook.created = new Date();

  // 1. Sheet: Laporan Keuangan (Cashflow)
  const cashSheet = workbook.addWorksheet('Laporan Kas & Keuangan');

  // Header Title
  cashSheet.mergeCells('A1:F1');
  const titleCell = cashSheet.getCell('A1');
  titleCell.value = `LAPORAN ARUS KAS & KEUANGAN - ${profile.storeName.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  cashSheet.getRow(1).height = 30;

  cashSheet.addRow([
    `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Pemilik: ${profile.ownerName}`,
  ]);
  cashSheet.addRow([]); // Blank row

  // Table Headers
  const cashHeaderRow = cashSheet.addRow([
    'No',
    'Tanggal',
    'Tipe Transaksi',
    'Kategori',
    'Deskripsi Kejadian',
    'Nominal (Rp)',
  ]);
  cashHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  cashHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Data rows
  let totalIn = 0;
  let totalOut = 0;

  transactions.forEach((trx, idx) => {
    if (trx.type === 'income') totalIn += trx.amount;
    else totalOut += trx.amount;

    const row = cashSheet.addRow([
      idx + 1,
      trx.date,
      trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      trx.category,
      trx.description,
      trx.type === 'income' ? trx.amount : -trx.amount,
    ]);

    // Color amount cell
    const amountCell = row.getCell(6);
    amountCell.numFmt = '#,##0;[Red]-#,##0';
    amountCell.font = {
      color: { argb: trx.type === 'income' ? 'FF16A34A' : 'FFDC2626' },
      bold: true,
    };
  });

  // Summary Row
  cashSheet.addRow([]);
  const sumRow1 = cashSheet.addRow(['', '', '', '', 'Total Pemasukan:', totalIn]);
  sumRow1.getCell(6).numFmt = '#,##0';
  sumRow1.font = { bold: true };

  const sumRow2 = cashSheet.addRow(['', '', '', '', 'Total Pengeluaran:', totalOut]);
  sumRow2.getCell(6).numFmt = '#,##0';
  sumRow2.font = { bold: true };

  const sumRow3 = cashSheet.addRow(['', '', '', '', 'Estimasi Laba Bersih:', totalIn - totalOut]);
  sumRow3.getCell(6).numFmt = '#,##0;[Red]-#,##0';
  sumRow3.font = { bold: true, size: 12 };

  // Set column widths
  cashSheet.columns = [
    { width: 6 },
    { width: 14 },
    { width: 16 },
    { width: 18 },
    { width: 40 },
    { width: 18 },
  ];

  // 2. Sheet: Inventaris Gudang & Nilai Stok
  const stockSheet = workbook.addWorksheet('Inventaris & Nilai Stok');
  stockSheet.mergeCells('A1:H1');
  const stockTitle = stockSheet.getCell('A1');
  stockTitle.value = `REKAPITULASI INVENTARIS GUDANG - ${profile.storeName.toUpperCase()}`;
  stockTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  stockTitle.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  stockTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  stockSheet.getRow(1).height = 30;

  stockSheet.addRow([`Alamat: ${profile.address} | Telp: ${profile.phone}`]);
  stockSheet.addRow([]);

  const stockHeaderRow = stockSheet.addRow([
    'SKU',
    'Nama Barang',
    'Kategori',
    'Stok',
    'Satuan',
    'HPP (Modal)',
    'Harga Jual',
    'Nilai Aset (Rp)',
  ]);
  stockHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  stockHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let totalAsset = 0;
  products.forEach((p) => {
    const assetVal = p.currentStock * p.hppAmount;
    totalAsset += assetVal;

    const row = stockSheet.addRow([
      p.sku,
      p.name,
      p.category,
      p.currentStock,
      p.unit,
      p.hppAmount,
      p.sellingPrice,
      assetVal,
    ]);

    row.getCell(6).numFmt = '#,##0';
    row.getCell(7).numFmt = '#,##0';
    const valCell = row.getCell(8);
    valCell.numFmt = '#,##0';
    valCell.font = { bold: true };
  });

  stockSheet.addRow([]);
  const totalAssetRow = stockSheet.addRow([
    '',
    '',
    '',
    '',
    '',
    '',
    'Total Nilai Aset Gudang:',
    totalAsset,
  ]);
  totalAssetRow.getCell(8).numFmt = '#,##0';
  totalAssetRow.font = { bold: true, size: 12 };

  stockSheet.columns = [
    { width: 14 },
    { width: 32 },
    { width: 18 },
    { width: 10 },
    { width: 10 },
    { width: 16 },
    { width: 16 },
    { width: 20 },
  ];

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Laporan_Keuangan_Stok_${profile.storeName.replace(/\s+/g, '_')}_${new Date()
    .toISOString()
    .split('T')[0]}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

/**
 * 1-Click Official Bank-Ready PDF Report Generator
 * Generates an executive letterhead (Kop Surat) and official financial statement
 */
export function exportToOfficialPdf(
  profile: StoreProfile,
  transactions: Transaction[],
  products: Product[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Official Store Header (Kop Surat)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(profile.storeName.toUpperCase(), 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Bidang Usaha: ${profile.businessCategory}`, 14, 23);
  doc.text(`Alamat: ${profile.address}`, 14, 28);
  doc.text(`Kontak: ${profile.phone} | Rekening: ${profile.bankAccount}`, 14, 33);

  // Decorative divider line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(14, 37, pageWidth - 14, 37);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN LABA RUGI & ARUS KAS RESMI (UMKM)', 14, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Periode Cetak: ${formatDateIndo(new Date().toISOString())} | Dibuat otomatis oleh KASRA Copilot`, 14, 51);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const totalStockAsset = products.reduce((sum, p) => sum + p.currentStock * p.hppAmount, 0);

  // Financial Summary Cards on PDF
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 55, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74); // green
  doc.text(`Total Pemasukan: ${formatRupiah(totalIncome)}`, 18, 63);

  doc.setTextColor(220, 38, 38); // red
  doc.text(`Total Pengeluaran: ${formatRupiah(totalExpense)}`, 85, 63);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Estimasi Laba Bersih: ${formatRupiah(netProfit)}`, 145, 63);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Nilai Aset Stok Terdata: ${formatRupiah(totalStockAsset)} (${products.length} Jenis Barang)`, 18, 70);

  // Table of Transactions
  const tableRows = transactions.slice(0, 15).map((t, idx) => [
    idx + 1,
    t.date,
    t.category,
    t.description,
    t.type === 'income' ? 'Masuk' : 'Keluar',
    t.type === 'income' ? `+${formatRupiah(t.amount)}` : `-${formatRupiah(t.amount)}`,
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['No', 'Tanggal', 'Kategori', 'Keterangan', 'Arus', 'Nominal']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 28 },
      3: { cellWidth: 70 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Footer Signature Section
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 220;

  if (finalY < 250) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Depok, ${formatDateIndo(new Date().toISOString())}`, pageWidth - 60, finalY);
    doc.text('Pemilik Usaha / Penanggung Jawab,', pageWidth - 60, finalY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`( ${profile.ownerName} )`, pageWidth - 60, finalY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(profile.storeName, pageWidth - 60, finalY + 33);
  }

  // Trigger download
  doc.save(
    `Laporan_Resmi_${profile.storeName.replace(/\s+/g, '_')}_${new Date()
      .toISOString()
      .split('T')[0]}.pdf`
  );
}
