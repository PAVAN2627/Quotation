import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from '@/hooks/useRouter';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/calculations';
import { formatDate } from '@/lib/utils';
import type { QuotationWithItems } from '@/types';

interface ViewQuotationPageProps {
  id: string;
}

export function ViewQuotationPage({ id }: ViewQuotationPageProps) {
  const { navigate } = useRouter();
  const [quotation, setQuotation] = useState<QuotationWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotation = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('quotations')
        .select('*, quotation_items(*)')
        .eq('id', id)
        .maybeSingle();
      setLoading(false);
      if (error) {
        setError('Failed to load quotation. Please try again.');
        return;
      }
      if (!data) {
        setError('Quotation not found. It may have been deleted or you may not have access to it.');
        return;
      }
      setQuotation(data as QuotationWithItems);
    };
    fetchQuotation();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate({ name: 'dashboard' })}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quotations
          </button>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium text-red-700">{error ?? 'Quotation not found.'}</p>
            <Button variant="outline" size="sm" onClick={() => navigate({ name: 'dashboard' })}>
              Back to Quotations
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate({ name: 'dashboard' })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quotations
          </button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print Quotation
          </Button>
        </div>

        {/* Quotation Document */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 print:border-0 print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 print:bg-slate-900">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Software Quotation</h1>
                <p className="text-sm text-slate-500">Quotation Management System</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-mono text-lg font-bold text-slate-900">{quotation.quotation_number}</p>
              <p className="text-sm text-slate-500">Date: {formatDate(quotation.quotation_date)}</p>
              {quotation.valid_until && (
                <p className="text-sm text-slate-500">Valid Until: {formatDate(quotation.valid_until)}</p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer Details
              </h2>
              <dl className="space-y-1.5">
                <div className="flex gap-2">
                  <dt className="text-sm font-medium text-slate-500">Name:</dt>
                  <dd className="text-sm font-semibold text-slate-900">{quotation.customer_name}</dd>
                </div>
                {quotation.company_name && (
                  <div className="flex gap-2">
                    <dt className="text-sm font-medium text-slate-500">Company:</dt>
                    <dd className="text-sm text-slate-900">{quotation.company_name}</dd>
                  </div>
                )}
                {quotation.email && (
                  <div className="flex gap-2">
                    <dt className="text-sm font-medium text-slate-500">Email:</dt>
                    <dd className="text-sm text-slate-900">{quotation.email}</dd>
                  </div>
                )}
                {quotation.phone && (
                  <div className="flex gap-2">
                    <dt className="text-sm font-medium text-slate-500">Phone:</dt>
                    <dd className="text-sm text-slate-900">{quotation.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5">Product / Service</th>
                  <th className="px-3 py-2.5 text-right">Qty</th>
                  <th className="px-3 py-2.5 text-right">Unit Price</th>
                  <th className="px-3 py-2.5 text-right">Disc. %</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotation.quotation_items.map((item) => (
                  <tr key={item.id} className="text-sm">
                    <td className="px-3 py-3 font-medium text-slate-900">{item.product_name}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{formatINR(item.unit_price)}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{item.discount}%</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatINR(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">GST ({quotation.gst_rate}%)</span>
                <span className="font-semibold text-slate-900">{formatINR(quotation.gst)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="font-bold text-slate-900">{formatINR(quotation.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 border-t border-slate-200 pt-6">
            <p className="text-xs text-slate-400">
              This quotation was generated on {formatDate(quotation.created_at)} and is subject to the terms and
              conditions agreed upon between the parties.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
