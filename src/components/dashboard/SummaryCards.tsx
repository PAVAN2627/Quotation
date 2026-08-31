import { FileText, IndianRupee, Clock } from 'lucide-react';
import { formatINR } from '@/lib/calculations';
import type { Quotation } from '@/types';

interface SummaryCardsProps {
  quotations: Quotation[];
  loading: boolean;
}

export function SummaryCards({ quotations, loading }: SummaryCardsProps) {
  const totalValue = quotations.reduce((sum, q) => sum + (q.total || 0), 0);
  const recent = quotations
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const cards = [
    {
      label: 'Total Quotations',
      value: loading ? '—' : String(quotations.length),
      icon: FileText,
      color: 'text-slate-700 bg-slate-100',
    },
    {
      label: 'Total Quotation Value',
      value: loading ? '—' : formatINR(totalValue),
      icon: IndianRupee,
      color: 'text-emerald-700 bg-emerald-100',
    },
    {
      label: 'Recent Quotation',
      value: loading ? '—' : recent?.quotation_number ?? 'None yet',
      icon: Clock,
      color: 'text-blue-700 bg-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="truncate text-xl font-bold text-slate-900">{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
