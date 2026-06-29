import xlsx from 'xlsx';

export function exportToExcel(
  data: any[],
  headers: string[],
  sheetName: string
): Buffer {
  const wsData = [headers, ...data.map((row) => headers.map((h) => row[h] ?? ''))];
  const ws = xlsx.utils.aoa_to_sheet(wsData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, sheetName);
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function parseExcelBuffer(buffer: Buffer): any[] {
  const wb = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(ws);
}

export function exportProductsToExcel(products: any[]): Buffer {
  const headers = [
    'name', 'sku', 'barcode', 'price', 'costPrice', 'taxRate',
    'unit', 'quantity', 'minStock', 'description', 'categoryId',
  ];
  return exportToExcel(products, headers, 'Products');
}

export function exportSalesToExcel(sales: any[]): Buffer {
  const headers = [
    'invoiceNumber', 'subtotal', 'taxTotal', 'discount', 'total',
    'paymentMethod', 'status', 'createdAt',
  ];
  return exportToExcel(sales, headers, 'Sales');
}
