'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { STATUS_COLORS } from '@/types';
import type { BusinessProfile, Document, Currency } from '@/types';

interface TopClient { name: string; total: number; }
interface MonthlyRevenue { month: string; amount: number; }
interface DashboardStats {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  documents_due_this_week?: Document[];
  top_clients?: TopClient[];
  monthly_revenue?: MonthlyRevenue[];
}
import { FileText, Plus, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface Props {
  profile: BusinessProfile;
  stats: DashboardStats;
  recentDocs: Document[];
}

export function DashboardClient({ profile, stats, recentDocs }: Props) {
  const currency = profile.default_currency || 'NGN';

  const cards = [
    {
      label: 'Total Invoiced',
      value: formatCurrency(stats.total_invoiced, currency),
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Paid',
      value: formatCurrency(stats.total_paid, currency),
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats.total_outstanding, currency),
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      label: 'Overdue',
      value: formatCurrency(stats.total_overdue, currency),
      icon: AlertCircle,
      color: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {profile.business_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your billing overview</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/invoice/new?type=receipt"
            className="hidden sm:flex items-center gap-2 text-sm border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus size={15} /> Receipt
          </Link>
          <Link
            href="/invoice/new?type=invoice"
            className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Invoice
          </Link>
        </div>
      </div>

      {/* Plan warning */}
      {profile.plan === 'free' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            You&apos;re on the <strong>Free plan</strong> — 20 invoices/month, watermarked exports.
          </p>
          <Link href="/upgrade" className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors font-medium">
            Upgrade
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon size={18} />
            </div>
            <div className="text-xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Documents</h2>
            <Link href="/history" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {recentDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText size={36} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-4">No documents yet</p>
              <Link href="/invoice/new?type=invoice" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Create your first invoice
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDocs.map((doc) => (
                <Link key={doc.id} href={`/invoice/edit/${doc.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-gray-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {doc.document_number}
                      </div>
                      <div className="text-xs text-gray-500">{doc.client_name || 'No client'} · {formatDate(doc.issue_date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status]}`}>
                      {doc.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(doc.total, doc.currency as Currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Due this week */}
          {(stats.documents_due_this_week?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Due This Week</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.documents_due_this_week?.slice(0, 4).map((doc: Document) => (
                  <Link key={doc.id} href={`/invoice/edit/${doc.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="text-xs font-medium text-gray-900">{doc.document_number}</div>
                      <div className="text-xs text-gray-500">{doc.client_name}</div>
                    </div>
                    <div className="text-xs font-semibold text-red-600">
                      {formatCurrency(doc.balance_due || doc.total, doc.currency as Currency)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top Clients */}
          {(stats.top_clients?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Top Clients</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.top_clients?.map((c: TopClient, i: number) => (
                  <div key={c.name} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{c.name}</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-700">
                      {formatCurrency(c.total, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Revenue */}
          {(stats.monthly_revenue?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Revenue Trend</h3>
              <div className="flex items-end gap-1.5 h-20">
                {stats.monthly_revenue?.map((m: MonthlyRevenue) => {
                  const max = Math.max(...(stats.monthly_revenue ?? []).map((x: MonthlyRevenue) => x.amount));
                  const pct = max > 0 ? (m.amount / max) * 100 : 0;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-indigo-500 rounded-t-sm min-h-[2px]"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                        title={formatCurrency(m.amount, currency)}
                      />
                      <span className="text-[9px] text-gray-400">{m.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}