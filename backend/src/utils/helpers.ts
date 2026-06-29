import { Invoice } from '../models';

export async function generateInvoiceNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;

  const lastInvoice = await Invoice.findOne({
    invoiceNumber: { $regex: `^${prefix}` },
  })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();

  let nextNum = 1;
  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

export function calculateTotals(
  items: Array<{ quantity: number; unitPrice: number; taxRate: number }>,
  discount: number,
  discountType: string
): { subtotal: number; taxTotal: number; total: number } {
  let subtotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;
    taxTotal += lineTotal * (item.taxRate / 100);
  }

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * (discount / 100);
  } else {
    discountAmount = discount;
  }

  const total = subtotal + taxTotal - discountAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' CFA';
}

export function paginate(
  page: number = 1,
  limit: number = 20
): { skip: number; limit: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
  };
}
