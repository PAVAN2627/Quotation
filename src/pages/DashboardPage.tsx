import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from '@/hooks/useRouter';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { QuotationList } from '@/components/quotation/QuotationList';
import { Button } from '@/components/ui/Button';
import type { Quotation } from '@/types';

export function DashboardPage() {
  const { navigate } = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      setError('Failed to load quotations. Please check your connection and try again.');
      return;
    }
    setQuotations((data as Quotation[]) ?? []);
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotations</h1>
            <p className="mt-1 text-sm text-slate-500">Manage and track all your software quotations.</p>
          </div>
          <Button onClick={() => navigate({ name: 'new-quotation' })}>
            <Plus className="h-4 w-4" />
            Create New Quotation
          </Button>
        </div>

        <div className="mb-6">
          <SummaryCards quotations={quotations} loading={loading} />
        </div>

        <QuotationList quotations={quotations} loading={loading} error={error} onDeleted={fetchQuotations} />
      </main>
    </div>
  );
}
