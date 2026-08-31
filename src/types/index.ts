export interface QuotationItem {
  id: string;
  quotation_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  amount: number;
  created_at: string;
}

export interface Quotation {
  id: string;
  user_id: string;
  quotation_number: string;
  customer_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  quotation_date: string;
  valid_until: string | null;
  subtotal: number;
  gst: number;
  gst_rate: number;
  total: number;
  created_at: string;
  quotation_items?: QuotationItem[];
}

export type QuotationWithItems = Quotation & {
  quotation_items: QuotationItem[];
};

export interface DraftItem {
  id: string;
  product_name: string;
  quantity: string;
  unit_price: string;
  discount: string;
}

export interface QuotationFormErrors {
  customer_name?: string;
  email?: string;
  quotation_number?: string;
  quotation_date?: string;
  gst_rate?: string;
  items?: Record<string, { product_name?: string; quantity?: string; unit_price?: string; discount?: string }>;
  general?: string;
}
