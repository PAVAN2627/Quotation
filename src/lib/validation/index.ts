import type { DraftItem, QuotationFormErrors } from '@/types';

export function isValidEmail(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateQuotationForm(data: {
  customer_name: string;
  email: string;
  quotation_number: string;
  quotation_date: string;
  gst_rate: string;
  items: DraftItem[];
}): QuotationFormErrors {
  const errors: QuotationFormErrors = {};
  const itemErrors: QuotationFormErrors['items'] = {};

  if (!data.customer_name.trim()) {
    errors.customer_name = 'Customer name is required.';
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.quotation_number.trim()) {
    errors.quotation_number = 'Quotation number is required.';
  }

  if (!data.quotation_date) {
    errors.quotation_date = 'Quotation date is required.';
  }

  const gst = parseFloat(data.gst_rate);
  if (isNaN(gst) || gst < 0 || gst > 100) {
    errors.gst_rate = 'GST must be between 0 and 100.';
  }

  if (!data.items || data.items.length === 0) {
    errors.general = 'At least one product is required.';
  }

  let hasItemError = false;
  data.items.forEach((item) => {
    const itemError: NonNullable<NonNullable<QuotationFormErrors['items']>>[string] = {};
    if (!item.product_name.trim()) {
      itemError.product_name = 'Product name is required.';
      hasItemError = true;
    }
    const qty = parseFloat(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      itemError.quantity = 'Quantity must be greater than 0.';
      hasItemError = true;
    }
    const price = parseFloat(item.unit_price);
    if (isNaN(price) || price < 0) {
      itemError.unit_price = 'Unit price cannot be negative.';
      hasItemError = true;
    }
    const discount = parseFloat(item.discount) || 0;
    if (discount < 0 || discount > 100) {
      itemError.discount = 'Discount must be between 0 and 100.';
      hasItemError = true;
    }
    if (Object.keys(itemError).length > 0) {
      itemErrors[item.id] = itemError;
    }
  });

  if (hasItemError || Object.keys(itemErrors).length > 0) {
    errors.items = itemErrors;
  }

  return errors;
}

export function hasErrors(errors: QuotationFormErrors): boolean {
  if (errors.general) return true;
  if (errors.customer_name || errors.email || errors.quotation_number || errors.quotation_date || errors.gst_rate) {
    return true;
  }
  if (errors.items && Object.keys(errors.items).length > 0) return true;
  return false;
}
