'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Send,
  CheckCircle,
  AlertTriangle,
  Ban,
  MessageSquareWarning,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import { PaymentModal } from '@/components/invoice/PaymentModal';
import { STATUS_COLORS, type DocumentStatus } from '@/types';
import type { Document } from '@/types';

interface Props {
  document: Document;
  /** Called after a successful status change so the parent can re-fetch / refresh. */
  onStatusChange: (newStatus: DocumentStatus) => void;
  /** Called after a payment is added (triggers refresh). */
  onPaymentAdded: () => void;
}

interface StatusOption {
  value: DocumentStatus;
  label: string;
  icon: typeof Send;
  className: string;
  /** Only show for these source statuses (undefined = always) */
  from?: DocumentStatus[];
}

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'sent',
    label: 'Mark as Sent',
    icon: Send,
    className: 'text-blue-700 hover:bg-blue-50',
    from: ['draft', 'overdue', 'disputed'],
  },
  {
    value: 'paid',
    label: 'Mark as Paid',
    icon: CheckCircle,
    className: 'text-green-700 hover:bg-green-50',
    from: ['draft', 'sent', 'overdue', 'partially_paid', 'disputed'],
  },
  {
    value: 'overdue',
    label: 'Mark as Overdue',
    icon: AlertTriangle,
    className: 'text-orange-700 hover:bg-orange-50',
    from: ['sent', 'partially_paid'],
  },
  {
    value: 'disputed',
    label: 'Mark as Disputed',
    icon: MessageSquareWarning,
    className: 'text-purple-700 hover:bg-purple-50',
    from: ['sent', 'overdue', 'partially_paid'],
  },
  {
    value: 'void',
    label: 'Void Document',
    icon: Ban,
    className: 'text-red-600 hover:bg-red-50',
    // Allow void from any non-void status including paid
    from: ['draft', 'sent', 'overdue', 'disputed', 'partially_paid', 'paid'],
  },
];

export function StatusActions({ document: doc, onStatusChange, onPaymentAdded }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<DocumentStatus | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const visibleOptions = STATUS_OPTIONS.filter(
    opt => !opt.from || opt.from.includes(doc.status as DocumentStatus)
  );

  const currentStatus = doc.status as DocumentStatus;
  const currentColor = STATUS_COLORS[currentStatus] ?? 'bg-gray-100 text-gray-700';

  async function handleStatusChange(status: DocumentStatus) {
    if (status === doc.status) { setOpen(false); return; }
    setOpen(false);
    setLoading(status);
    try {
      const body: Record<string, unknown> = { status };
      // Always stamp paid_date when marking as paid
      if (status === 'paid') {
        body.paid_date = new Date().toISOString().split('T')[0];
      }
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error ?? 'Failed to update status');
      }
      onStatusChange(status);
      toast({
        title: 'Status updated',
        description: `Document marked as ${status.replace('_', ' ')}.`,
        variant: 'success',
      });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message || 'Could not update status. Try again.', variant: 'error' });
    } finally {
      setLoading(null);
    }
  }

  const isVoided = doc.status === 'void';

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Current status badge */}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${currentColor}`}>
          {currentStatus.replace('_', ' ')}
        </span>

        {/* Record Payment button — only for invoice-like statuses */}
        {!isVoided && doc.document_type === 'invoice' && (
          <button
            onClick={() => setPaymentOpen(true)}
            className="flex items-center gap-1.5 text-xs border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium"
          >
            <DollarSign size={13} /> Record Payment
          </button>
        )}

        {/* Status dropdown */}
        {!isVoided && visibleOptions.length > 0 && (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              disabled={!!loading}
              className="flex items-center gap-1.5 text-xs border border-gray-200 bg-white text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>Change Status <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></>
              )}
            </button>

            {open && (
              <div className="absolute left-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 min-w-48" style={{ animation: 'dropdownIn 120ms ease-out both' }}>
                {visibleOptions.map(opt => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm transition-colors ${opt.className}`}
                    >
                      <Icon size={14} />
                      {opt.label}
                    </button>
                  );
                })}
                <style>{`
                  @keyframes dropdownIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        document={doc}
        onPaymentAdded={() => {
          setPaymentOpen(false);
          onPaymentAdded();
        }}
      />
    </>
  );
}