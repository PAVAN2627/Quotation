export interface ItemCalculation {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
}

export interface QuotationTotals {
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
}

export function roundTo2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateItem(
  quantity: number,
  unitPrice: number,
  discountPercent: number
): ItemCalculation {
  const grossAmount = roundTo2(quantity * unitPrice);
  const discountAmount = roundTo2((grossAmount * discountPercent) / 100);
  const netAmount = roundTo2(grossAmount - discountAmount);
  return { grossAmount, discountAmount, netAmount };
}

export function calculateTotals(
  items: { quantity: number; unitPrice: number; discount: number }[],
  gstRate: number
): QuotationTotals {
  const subtotal = roundTo2(
    items.reduce((sum, item) => {
      const { netAmount } = calculateItem(item.quantity, item.unitPrice, item.discount);
      return sum + netAmount;
    }, 0)
  );
  const gstAmount = roundTo2((subtotal * gstRate) / 100);
  const grandTotal = roundTo2(subtotal + gstAmount);
  return { subtotal, gstAmount, grandTotal };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function parseNumber(value: string): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
