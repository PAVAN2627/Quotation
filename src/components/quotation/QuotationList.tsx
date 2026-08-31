import { useMemo, useState } from 'react';
import { Search, Eye, Trash2, FileText, ArrowUpDown, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { formatINR } from '@/lib/calculations';
import { formatDate } from '@/lib/utils';
import type { Quotation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface QuotationListProps {
  quotations: Quotation[];
  loading: boolean;
  error: string | null;
  onDeleted: () => void;
}

type SortKey = 'date' | 'amount' | 'number';

export function QuotationList({ quotations, loading, error, onDeleted }: QuotationListProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const { user } = useAuth();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = quotations;
    if (q) {
      result = quotations.filter(
        (item) =>
          item.quotation_number.toLowerCase().includes(q) ||
          item.customer_name.toLowerCase().includes(q) ||
          (item.company_name ?? '').toLowerCase().includes(q)
      );
    }
    const sorted = result.slice().sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = new Date(a.quotation_date).getTime() - new Date(b.quotation_date).getTime();
      else if (sortKey === 'amount') cmp = (a.total ?? 0) - (b.total ?? 0);
      else cmp = a.quotation_number.localeCompare(b.quotation_number);
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [quotations, search, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', deleteTarget.id)
      .eq('user_id', user?.id ?? '');
    setDeleting(false);
    if (error) {
      showToast('Failed to delete quotation. Please try again.', 'error');
    } else {
      showToast('Quotation deleted successfully.', 'success');
      setDeleteTarget(null);
      onDeleted();
    }
  };

  const SortIcon = ({ active }: { active: boolean }) => (
    <ArrowUpDown className={`h-3.5 w-3.5 ${active ? 'text-slate-900' : 'text-slate-300'}`} />
  );

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 p-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-10 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-red-700">{error}</p>
        <Button variant="outline" size="sm" onClick={onDeleted}>
          Try again
        </Button>
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">No quotations yet</h3>
          <p className="mt-1 text-sm text-slate-500">Create your first quotation to get started.</p>
        </div>
        <Button onClick={() => navigate({ name: 'new-quotation' })}>
          <Plus className="h-4 w-4" />
          Create New Quotation
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by number, customer, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <p className="text-sm text-slate-500">
            {filtered.length} of {quotations.length} quotations
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">No quotations match your search.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 text-left">
                      <button
                        onClick={() => toggleSort('number')}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      >
                        Quotation No. <SortIcon active={sortKey === 'number'} />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-left">
                      <button
                        onClick={() => toggleSort('amount')}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      >
                        Amount <SortIcon active={sortKey === 'amount'} />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-left">
                      <button
                        onClick={() => toggleSort('date')}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                      >
                        Date <SortIcon active={sortKey === 'date'} />
                      </button>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((q) => (
                    <tr key={q.id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-semibold text-slate-900">{q.quotation_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-900">{q.customer_name}</p>
                        {q.company_name && <p className="text-xs text-slate-500">{q.company_name}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-slate-900">{formatINR(q.total)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600">{formatDate(q.quotation_date)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate({ name: 'view-quotation', id: q.id })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((q) => (
                <div key={q.id} className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-900">{q.quotation_number}</p>
                      <p className="text-sm font-medium text-slate-700">{q.customer_name}</p>
                      {q.company_name && <p className="text-xs text-slate-500">{q.company_name}</p>}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-900">{formatINR(q.total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatDate(q.quotation_date)}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate({ name: 'view-quotation', id: q.id })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quotation"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete quotation{' '}
              <span className="font-semibold text-slate-900">{deleteTarget?.quotation_number}</span> for{' '}
              <span className="font-semibold text-slate-900">{deleteTarget?.customer_name}</span>?
            </p>
            <p className="mt-2 text-sm font-medium text-red-600">
              This action cannot be undone. All items in this quotation will also be deleted.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
