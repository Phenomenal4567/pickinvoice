'use client';

import { useEffect, useState } from 'react';
import { Check, DollarSign, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import type { Document, Payment, Currency } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  document: Document;
  /** Called after a new payment is successfully recorded so parent can refresh. */
  onPaymentAdded: () => void;
}

interface PaymentForm {
  amount: string;
  payment_method: string;
  payment_date: string;
  notes: string;
}

const EMPTY_FORM: PaymentForm = {
  amount: '',
  payment_method: '',
  payment_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export function PaymentModal({ open, onClose, document: doc, onPaymentAdded }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<PaymentForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const currency = doc.currency as Currency;

  // Load payment history whenever modal opens
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setLoadingPayments(true);
    fetch(`/api/payments?document_id=${doc.id}`)
      .then(r => r.json())
      .then(data => setPayments(data.payments ?? []))
      .catch(() => setPayments([]))
      .finally(() => setLoadingPayments(false));
  }, [open, doc.id]);

  // Use payments from server when loaded, otherwise fall back to doc totals
  const totalPaid = payments.length > 0
    ? payments.reduce((s, p) => s + p.amount, 0)
    : doc.amount_paid;
  const remaining = Math.max(0, doc.total - totalPaid);

  function set(field: keyof PaymentForm, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a positive payment amount.', variant: 'error' });
      return;
    }
    if (!form.payment_date) {
      toast({ title: 'Date required', description: 'Please pick a payment date.', variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: doc.id,
          amount,
          payment_method: form.payment_method || undefined,
          payment_date: form.payment_date,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error ?? 'Failed to record payment');
      }

      const { payment } = await res.json();
      setPayments(prev => [payment, ...prev]);
      setForm(EMPTY_FORM);
      toast({ title: 'Payment recorded', description: `${formatCurrency(amount, currency)} saved successfully.`, variant: 'success' });
      onPaymentAdded();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      description={`${doc.document_number} · ${formatCurrency(doc.total, currency)} total`}
      maxWidth="max-w-lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 text-sm border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.amount}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </>
      }
    >
      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-0.5">Total</div>
          <div className="text-sm font-bold text-gray-900">{formatCurrency(doc.total, currency)}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-0.5">Paid</div>
          <div className="text-sm font-bold text-green-700">{formatCurrency(totalPaid, currency)}</div>
        </div>
        <div className={`rounded-xl p-3 text-center ${remaining > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <div className="text-xs text-gray-500 mb-0.5">Balance</div>
          <div className={`text-sm font-bold ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {remaining > 0 ? formatCurrency(remaining, currency) : 'Fully paid'}
          </div>
        </div>
      </div>

      {/* Payment history */}
      {loadingPayments ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={18} className="animate-spin text-gray-400" />
        </div>
      ) : payments.length > 0 ? (
        <div className="mb-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment History</div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount, currency)}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(p.payment_date)}
                    {p.payment_method && <> · {p.payment_method}</>}
                    {p.notes && <> · {p.notes}</>}
                  </div>
                </div>
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign size={12} className="text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* New payment form */}
      <div className="border-t border-gray-100 pt-4 space-y-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add New Payment</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                {currency}
              </span>
              <input
                className={`${inputCls} pl-12`}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
              />
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelCls}>Date <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              type="date"
              value={form.payment_date}
              onChange={e => set('payment_date', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Payment Method</label>
          <select
            className={inputCls}
            value={form.payment_method}
            onChange={e => set('payment_method', e.target.value)}
          >
            <option value="">Select method (optional)</option>
            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <input
            className={inputCls}
            placeholder="e.g. 50% deposit, bank transfer ref…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
