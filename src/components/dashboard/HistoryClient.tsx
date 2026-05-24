'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText, Copy, Trash2, MoreVertical, CheckCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { STATUS_COLORS, type DocumentStatus } from '@/types';
import type { Document, BusinessProfile, Currency } from '@/types';

interface Props {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  profile: BusinessProfile | null;
  filters: { type?: string; status?: string; search?: string };
}

const STATUSES: DocumentStatus[] = ['draft', 'sent', 'paid', 'overdue', 'void', 'disputed', 'partially_paid'];

export function HistoryClient({ documents, total, page, limit, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search || '');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  // Track per-menu whether it should open upward (when near bottom of viewport)
  const [menuOpenAbove, setMenuOpenAbove] = useState<Record<string, boolean>>({});
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenuId) return;
    function handler(e: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActionMenuId(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [actionMenuId]);

  const totalPages = Math.ceil(total / limit);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams();
    if (filters.type && key !== 'type') params.set('type', filters.type);
    if (filters.status && key !== 'status') params.set('status', filters.status);
    if (filters.search && key !== 'search') params.set('search', filters.search);
    if (value) params.set(key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter('search', search);
  }

  async function handleStatusChange(docId: string, status: DocumentStatus) {
    await fetch(`/api/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActionMenuId(null);
    router.refresh();
  }

  async function handleDuplicate(doc: Document) {
    const res = await fetch(`/api/documents/${doc.id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      const { document: newDoc } = await res.json();
      router.push(`/invoice/edit/${newDoc.id}`);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    setActionMenuId(null);
    router.refresh();
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    params.set('page', String(p));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document History</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} documents found</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoice/new?type=invoice" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            + Invoice
          </Link>
          <Link href="/invoice/new?type=receipt" className="text-sm border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            + Receipt
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-48 flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search client, number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="text-sm bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors">
            Go
          </button>
        </form>

        {/* Type filter */}
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.type || ''}
          onChange={e => updateFilter('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="invoice">Invoices</option>
          <option value="receipt">Receipts</option>
        </select>

        {/* Status filter */}
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.status || ''}
          onChange={e => updateFilter('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
          ))}
        </select>

        {(filters.type || filters.status || filters.search) && (
          <button
            onClick={() => { setSearch(''); startTransition(() => router.push(pathname)); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Document list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-visible">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">No documents found</p>
            <Link href="/invoice/new?type=invoice" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-3">Number</div>
              <div className="col-span-3">Client</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1" />
            </div>

            {/* Rows */}
            {documents.map((doc) => (
              <div key={doc.id} className="relative border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors overflow-visible">
                <div className="grid grid-cols-12 gap-2 px-5 py-4 items-center">
                  <div className="col-span-8 sm:col-span-3">
                    <Link href={`/invoice/edit/${doc.id}`} className="font-medium text-sm text-gray-900 hover:text-indigo-600 transition-colors">
                      {doc.document_number}
                    </Link>
                    <div className="text-xs text-gray-500 capitalize">{doc.document_type}</div>
                  </div>
                  <div className="hidden sm:block col-span-3 text-sm text-gray-700 truncate">
                    {doc.client_name || <span className="text-gray-400">—</span>}
                  </div>
                  <div className="hidden sm:block col-span-2 text-sm text-gray-500">
                    {formatDate(doc.issue_date)}
                  </div>
                  <div className="hidden sm:block col-span-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[doc.status]}`}>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <div className="font-semibold text-sm text-gray-900">{formatCurrency(doc.total, doc.currency as Currency)}</div>
                    {doc.balance_due > 0 && doc.status !== 'paid' && (
                      <div className="text-xs text-red-500">Due: {formatCurrency(doc.balance_due, doc.currency as Currency)}</div>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <div className="relative" ref={actionMenuId === doc.id ? menuContainerRef : null}>
                      <button
                        onClick={(e) => {
                          if (actionMenuId === doc.id) { setActionMenuId(null); return; }
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const spaceBelow = window.innerHeight - rect.bottom;
                          setMenuOpenAbove(prev => ({ ...prev, [doc.id]: spaceBelow < 240 }));
                          setActionMenuId(doc.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {actionMenuId === doc.id && (
                        <div className={`absolute right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 min-w-[192px] ${menuOpenAbove[doc.id] ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                          <Link href={`/invoice/edit/${doc.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <FileText size={14} /> View / Edit
                          </Link>
                          <Link href={`/invoice/view/${doc.share_token}`} target="_blank" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <ExternalLink size={14} /> Open share link
                          </Link>
                          <button onClick={() => handleDuplicate(doc)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left">
                            <Copy size={14} /> Duplicate & Edit
                          </button>
                          {doc.status !== 'paid' && (
                            <button onClick={() => handleStatusChange(doc.id, 'paid')} className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors w-full text-left">
                              <CheckCircle size={14} /> Mark as Paid
                            </button>
                          )}
                          {doc.status !== 'void' && (
                            <button onClick={() => handleStatusChange(doc.id, 'void')} className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors w-full text-left">
                              Void
                            </button>
                          )}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button onClick={() => handleDelete(doc.id)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600 px-3">Page {page} of {totalPages}</span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
