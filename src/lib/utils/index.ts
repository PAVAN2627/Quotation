import { supabase } from '@/lib/supabase/client';

export async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `QT-${year}-`;

  const { data, error } = await supabase
    .from('quotations')
    .select('quotation_number')
    .like('quotation_number', `${prefix}%`)
    .order('quotation_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    const count = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  let nextNumber = 1;
  if (data && data.quotation_number) {
    const parts = data.quotation_number.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextNumber = lastNum + 1;
    }
  }
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
