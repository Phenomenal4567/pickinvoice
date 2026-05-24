import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getDocumentByShareToken } from '@/lib/supabase/queries';
import { DocumentPreview } from '@/components/invoice/DocumentPreview';
import { formatCurrency, formatDate } from '@/lib/utils';
import { STATUS_COLORS } from '@/types';

export default async function PublicInvoicePage({ params }: { params: { token: string } }) {
  const doc = await getDocumentByShareToken(params.token);
  if (!doc) return notFound();

  const safeDoc = doc!;
  const brandColor = safeDoc.sender_brand_color || '#6366f1';
  const senderName = safeDoc.sender_name || 'PickInvoice';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {safeDoc.sender_logo_url ? (
          <Image
              src={safeDoc.sender_logo_url}
              alt={senderName}
              width={120}
              height={32}
              className="h-8 w-auto object-contain max-w-[120px]"
              unoptimized
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <span className="text-white font-bold text-sm">
                {senderName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-gray-900">{senderName}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-500 capitalize">{safeDoc.document_type} · {safeDoc.document_number}</div>
            <div className="text-sm font-bold text-gray-900">{formatCurrency(safeDoc.total, safeDoc.currency)}</div>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[safeDoc.status]}`}
          >
            {safeDoc.status.replace('_', ' ')}
          </span>
          <a
            href={`/api/documents/${safeDoc.id}/pdf?token=${params.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity font-medium whitespace-nowrap"
            style={{ backgroundColor: brandColor }}
          >
            Download PDF
          </a>
        </div>
      </div>

      {/* Invoice preview */}
      <div className="max-w-2xl mx-auto p-4 sm:p-8">
        {/* Mobile amount */}
        <div className="sm:hidden mb-4 text-center">
          <div className="text-xs text-gray-500 capitalize mb-0.5">{safeDoc.document_type} · {safeDoc.document_number}</div>
          <div className="text-xl font-bold text-gray-900">{formatCurrency(safeDoc.total, safeDoc.currency)}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <DocumentPreview document={safeDoc} />
        </div>

        {/* Due date banner */}
        {safeDoc.due_date && safeDoc.status !== 'paid' && safeDoc.status !== 'void' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center mb-3">
            Payment due by <strong>{formatDate(safeDoc.due_date)}</strong>
            {safeDoc.balance_due > 0 && (
              <> — <strong>{formatCurrency(safeDoc.balance_due, safeDoc.currency)}</strong> outstanding</>
            )}
          </div>
        )}

        {safeDoc.status === 'paid' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 text-center font-medium mb-3">
            ✓ This {safeDoc.document_type} has been paid in full
          </div>
        )}

        {safeDoc.status === 'void' && (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-sm text-gray-600 text-center mb-3">
            This document has been voided
          </div>
        )}

        {safeDoc.viewed_count > 1 && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Viewed {safeDoc.viewed_count} times
            {safeDoc.viewed_at && <> · Last viewed {formatDate(safeDoc.viewed_at)}</>}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-xs text-gray-400">
        <a
          href="https://pickinvoice.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors"
        >
          Powered by <span className="font-semibold">PickInvoice</span>
        </a>
        {' · '}
        <span>Professional invoicing for African businesses</span>
      </div>
    </div>
  );
}