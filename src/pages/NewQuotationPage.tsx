import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { useToast } from '@/components/ui/Toast';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateItem, calculateTotals, formatINR, parseNumber } from '@/lib/calculations';
import { validateQuotationForm, hasErrors } from '@/lib/validation';
import { generateQuotationNumber, todayISO } from '@/lib/utils';
import type { DraftItem, QuotationFormErrors } from '@/types';

function createDraftItem(): DraftItem {
  return {
    id: Math.random().toString(36).substring(2, 9),
    product_name: '',
    quantity: '1',
    unit_price: '0',
    discount: '0',
  };
}

export function NewQuotationPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  const [quotationNumber, setQuotationNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quotationDate, setQuotationDate] = useState(todayISO());
  const [validUntil, setValidUntil] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [items, setItems] = useState<DraftItem[]>([createDraftItem()]);
  const [errors, setErrors] = useState<QuotationFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [numberLoading, setNumberLoading] = useState(true);

  useEffect(() => {
    generateQuotationNumber().then((num) => {
      setQuotationNumber(num);
      setNumberLoading(false);
    });
  }, []);

  const computedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        ...calculateItem(parseNumber(item.quantity), parseNumber(item.unit_price), parseNumber(item.discount)),
      })),
    [items]
  );

  const totals = useMemo(
    () =>
      calculateTotals(
        items.map((i) => ({
          quantity: parseNumber(i.quantity),
          unitPrice: parseNumber(i.unit_price),
          discount: parseNumber(i.discount),
        })),
        parseNumber(gstRate)
      ),
    [items, gstRate]
  );

  const updateItem = (id: string, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    setItems((prev) => [...prev, createDraftItem()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const handleSubmit = async () => {
    const formData = {
      customer_name: customerName,
      email,
      quotation_number: quotationNumber,
      quotation_date: quotationDate,
      gst_rate: gstRate,
      items,
    };
    const validationErrors = validateQuotationForm(formData);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) {
      showToast('Please fix the errors in the form before saving.', 'error');
      return;
    }

    setSubmitting(true);

    const { data: quotationData, error: quotationError } = await supabase
      .from('quotations')
      .insert({
        user_id: user?.id,
        quotation_number: quotationNumber.trim(),
        customer_name: customerName.trim(),
        company_name: companyName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        quotation_date: quotationDate,
        valid_until: validUntil || null,
        subtotal: totals.subtotal,
        gst: totals.gstAmount,
        gst_rate: parseNumber(gstRate),
        total: totals.grandTotal,
      })
      .select('id')
      .single();

    if (quotationError || !quotationData) {
      setSubmitting(false);
      showToast('Failed to create quotation. Please try again.', 'error');
      return;
    }

    const itemsPayload = computedItems.map((item) => ({
      quotation_id: quotationData.id,
      product_name: item.product_name.trim(),
      quantity: parseNumber(item.quantity),
      unit_price: parseNumber(item.unit_price),
      discount: parseNumber(item.discount),
      amount: item.netAmount,
    }));

    const { error: itemsError } = await supabase.from('quotation_items').insert(itemsPayload);

    if (itemsError) {
      await supabase.from('quotations').delete().eq('id', quotationData.id);
      setSubmitting(false);
      showToast('Failed to save quotation items. Please try again.', 'error');
      return;
    }

    setSubmitting(false);
    showToast('Quotation created successfully!', 'success');
    navigate({ name: 'dashboard' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate({ name: 'dashboard' })}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quotations
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create New Quotation</h1>
          <p className="mt-1 text-sm text-slate-500">Fill in the customer and product details below.</p>
        </div>

        <div className="space-y-6">
          {/* Customer Information */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">Customer Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Customer Name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                error={errors.customer_name}
                placeholder="John Doe"
              />
              <Input
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ABC Technologies"
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="john@abctech.com"
              />
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </section>

          {/* Quotation Information */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">Quotation Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Quotation Number"
                required
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                error={errors.quotation_number}
                placeholder={numberLoading ? 'Generating...' : 'QT-2026-0001'}
                disabled={numberLoading}
              />
              <Input
                label="Quotation Date"
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                error={errors.quotation_date}
              />
              <Input
                label="Valid Until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </section>

          {/* Product / Service Information */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Products / Services</h2>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="pb-2 pr-3">Product / Service</th>
                    <th className="pb-2 px-3 w-20">Qty</th>
                    <th className="pb-2 px-3 w-28">Unit Price</th>
                    <th className="pb-2 px-3 w-20">Disc. %</th>
                    <th className="pb-2 px-3 w-28 text-right">Amount</th>
                    <th className="pb-2 pl-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {computedItems.map((item) => {
                    const itemError = errors.items?.[item.id];
                    return (
                      <tr key={item.id}>
                        <td className="py-3 pr-3">
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={(e) => updateItem(item.id, 'product_name', e.target.value)}
                            placeholder="Product / Service name"
                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                              itemError?.product_name
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-slate-900 focus:ring-slate-200'
                            }`}
                          />
                          {itemError?.product_name && (
                            <p className="mt-1 text-xs font-medium text-red-600">{itemError.product_name}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            className={`w-full rounded-lg border bg-white px-2.5 py-2 text-right text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                              itemError?.quantity
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-slate-900 focus:ring-slate-200'
                            }`}
                          />
                          {itemError?.quantity && (
                            <p className="mt-1 text-xs font-medium text-red-600">{itemError.quantity}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                            className={`w-full rounded-lg border bg-white px-2.5 py-2 text-right text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                              itemError?.unit_price
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-slate-900 focus:ring-slate-200'
                            }`}
                          />
                          {itemError?.unit_price && (
                            <p className="mt-1 text-xs font-medium text-red-600">{itemError.unit_price}</p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                            className={`w-full rounded-lg border bg-white px-2.5 py-2 text-right text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                              itemError?.discount
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-slate-900 focus:ring-slate-200'
                            }`}
                          />
                          {itemError?.discount && (
                            <p className="mt-1 text-xs font-medium text-red-600">{itemError.discount}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="text-sm font-semibold text-slate-900">{formatINR(item.netAmount)}</span>
                        </td>
                        <td className="py-3 pl-3 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            aria-label="Remove product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-4 md:hidden">
              {computedItems.map((item, idx) => {
                const itemError = errors.items?.[item.id];
                return (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Item {idx + 1}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        aria-label="Remove product"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        label="Product / Service"
                        value={item.product_name}
                        onChange={(e) => updateItem(item.id, 'product_name', e.target.value)}
                        error={itemError?.product_name}
                        placeholder="Product name"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          label="Qty"
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          error={itemError?.quantity}
                        />
                        <Input
                          label="Unit Price"
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                          error={itemError?.unit_price}
                        />
                        <Input
                          label="Disc %"
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                          error={itemError?.discount}
                        />
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-2">
                        <span className="text-sm text-slate-500">Amount</span>
                        <span className="text-sm font-bold text-slate-900">{formatINR(item.netAmount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </section>

          {/* Calculation Summary */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-900">Calculation Summary</h2>
            <div className="ml-auto max-w-sm space-y-3">
              <div className="flex items-center gap-3">
                <label htmlFor="gst-rate" className="w-32 text-sm font-medium text-slate-600">
                  GST Rate (%)
                </label>
                <input
                  id="gst-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className={`flex-1 rounded-lg border bg-white px-3 py-2 text-right text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                    errors.gst_rate
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-slate-900 focus:ring-slate-200'
                  }`}
                />
              </div>
              {errors.gst_rate && (
                <p className="ml-32 text-xs font-medium text-red-600">{errors.gst_rate}</p>
              )}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatINR(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">GST ({parseNumber(gstRate)}%)</span>
                  <span className="font-semibold text-slate-900">{formatINR(totals.gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                  <span className="font-bold text-slate-900">Grand Total</span>
                  <span className="font-bold text-slate-900">{formatINR(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => navigate({ name: 'dashboard' })} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting} size="lg">
              <Save className="h-4 w-4" />
              Save Quotation
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
