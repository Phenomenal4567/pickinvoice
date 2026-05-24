'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Send, Download, Image as ImageIcon, Eye, EyeOff, Copy } from 'lucide-react';
import { generateId, calculateLineItems, formatCurrency, addDaysToDate, NET_TERMS, PAYMENT_METHODS } from '@/lib/utils';
import { CURRENCIES, PAID_TEMPLATES } from '@/types';
import { DocumentPreview } from './DocumentPreview';
import { StatusActions } from './StatusActions';
import type { BusinessProfile, Client, Product, Document, LineItem, DocumentType, Currency, TaxType, DocumentStatus } from '@/types';

interface Props {
  mode: 'new' | 'edit';
  docType: DocumentType;
  profile: BusinessProfile;
  clients: Client[];
  products: Product[];
  document?: Document;
}

export function InvoiceEditor({ mode, docType, profile, clients, products, document }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Form state
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    document_type: docType,
    template: document?.template || profile.preferred_template || 'classic',
    client_id: document?.client_id || null as string | null,
    client_name: document?.client_name || '',
    client_email: document?.client_email || '',
    client_address: document?.client_address || '',
    client_phone: document?.client_phone || '',
    issue_date: document?.issue_date || today,
    due_date: document?.due_date || (docType === 'invoice' ? addDaysToDate(today, 30) : null) as string | null,
    currency: (document?.currency || profile.default_currency || 'NGN') as Currency,
    tax_rate: document?.tax_rate ?? profile.default_tax_rate ?? 0,
    tax_type: (document?.tax_type || profile.default_tax_type || 'VAT') as TaxType,
    discount_type: document?.discount_type || 'percentage' as 'percentage' | 'fixed',
    discount_value: document?.discount_value || 0,
    payment_method: document?.payment_method || '',
    notes: document?.notes || '',
    payment_terms: document?.payment_terms || '',
    internal_note: document?.internal_note || '',
    status: document?.status || 'draft',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    document?.line_items?.length
      ? document.line_items
      : [{ id: generateId(), description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }]
  );

  const [shareUrl, setShareUrl] = useState(
    document?.share_token
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invoice/view/${document.share_token}`
      : ''
  );

  const totals = calculateLineItems(lineItems, form.tax_rate, form.discount_type, form.discount_value);

  function setField(field: keyof typeof form, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleClientSelect(clientId: string) {
    if (!clientId) { setField('client_id', null); return; }
    const c = clients.find(x => x.id === clientId);
    if (c) {
      setForm(f => ({
        ...f,
        client_id: c.id,
        client_name: c.name,
        client_email: c.email,
        client_address: c.address ? `${c.address}${c.city ? ', ' + c.city : ''}` : '',
        client_phone: c.phone,
      }));
    }
  }

  function updateLineItem(id: string, field: keyof LineItem, value: unknown) {
    setLineItems(items => items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.amount = Math.round(updated.quantity * updated.unit_price * 100) / 100;
      return updated;
    }));
  }

  function addLineItem() {
    setLineItems(items => [...items, { id: generateId(), description: '', quantity: 1, unit_price: 0, tax_rate: 0, amount: 0 }]);
  }

  function removeLineItem(id: string) {
    if (lineItems.length === 1) return;
    setLineItems(items => items.filter(i => i.id !== id));
  }

  function addProductToItems(product: Product) {
    setLineItems(items => [...items, {
      id: generateId(),
      description: product.name + (product.description ? ` — ${product.description}` : ''),
      quantity: 1,
      unit_price: product.unit_price,
      tax_rate: product.tax_rate,
      amount: product.unit_price,
    }]);
  }

  async function handleSave(status?: string) {
    setSaving(true);
    try {
      const payload = {
        ...form,
        line_items: lineItems,
        status: status || form.status,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        discount_amount: totals.discount_amount,
        total: totals.total,
      };

      let res;
      if (mode === 'edit' && document) {
        res = await fetch(`/api/documents/${document.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const doc = data.document;

      if (doc.share_token) {
        setShareUrl(`${window.location.origin}/invoice/view/${doc.share_token}`);
      }

      if (mode === 'new') {
        router.push(`/invoice/edit/${doc.id}`);
      }
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPDF() {
    const target = exportRef.current;
    if (!target) return;
    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');

    // Reveal the hidden node so html2canvas can paint it
    target.style.display = 'block';
    // Wait for fonts/images to render
    await new Promise(r => setTimeout(r, 400));

    try {
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      // If content exceeds one page, tile across multiple pages
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, imgH);
      } else {
        let yOffset = 0;
        while (yOffset < imgH) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH);
          yOffset += pageH;
        }
      }
      pdf.save(`${docType}-${form.client_name || 'document'}.pdf`);
    } finally {
      target.style.display = 'none';
    }
  }

  async function handleExportImage() {
    const target = exportRef.current;
    if (!target) return;
    const { default: html2canvas } = await import('html2canvas');

    target.style.display = 'block';
    await new Promise(r => setTimeout(r, 400));

    try {
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });
      const link = window.document.createElement('a');
      link.download = `${docType}-${form.client_name || 'document'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      target.style.display = 'none';
    }
  }

  function handleWhatsAppShare() {
    if (shareUrl) {
      window.open(`https://wa.me/?text=${encodeURIComponent(`Here's your ${docType}: ${shareUrl}`)}`);
    }
  }

  function fallbackCopyText(text: string) {
  const el = window.document.createElement('textarea');

  el.value = text;
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  el.style.top = '-9999px';

  window.document.body.appendChild(el);

  el.focus();
  el.select();

  try {
    window.document.execCommand('copy');
  } catch {
    // silent
  }

  window.document.body.removeChild(el);
}
  function copyShareLink() {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).catch(() => fallbackCopyText(shareUrl));
    } else {
      fallbackCopyText(shareUrl);
    }
    alert('Link copied to clipboard!');
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide';

  const docForPreview: Partial<Document> = {
    ...form,
    line_items: lineItems,
    subtotal: totals.subtotal,
    tax_amount: totals.tax_amount,
    discount_amount: totals.discount_amount,
    total: totals.total,
    sender_name: profile.business_name,
    sender_email: profile.email,
    sender_address: `${profile.address}${profile.city ? ', ' + profile.city : ''}`,
    sender_phone: profile.phone,
    sender_logo_url: profile.logo_url,
    sender_brand_color: profile.brand_color,
    sender_tax_number: profile.tax_number,
    document_number: document?.document_number || `${form.document_type === 'invoice' ? profile.invoice_prefix : profile.receipt_prefix}-PREVIEW`,
    due_date: form.due_date || undefined,
  };

  return (
    <div className="flex h-full">
      {/* Editor panel */}
      <div className={`flex-1 overflow-y-auto ${showPreview ? 'hidden lg:block lg:w-1/2 lg:flex-none' : ''}`}>
        <div className="p-4 sm:p-6 max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">
                {mode === 'new' ? 'New' : 'Edit'} {docType}
              </h1>
              {document && (
                <p className="text-sm text-gray-500 font-mono">{document.document_number}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>
          </div>

          {/* Status actions — edit mode only */}
          {mode === 'edit' && document && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Status</div>
              <StatusActions
                document={document}
                onStatusChange={(newStatus: DocumentStatus) => {
                  setField('status', newStatus);
                  router.refresh();
                }}
                onPaymentAdded={() => router.refresh()}
              />
            </div>
          )}

          {/* Template — Bug #1: free plan cannot use paid templates */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <label className={labelCls}>Template</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {(['classic', 'modern', 'minimal', 'bold'] as const).map(t => {
                const isPaidTemplate = PAID_TEMPLATES.includes(t);
                const isLocked = isPaidTemplate && profile.plan === 'free' || isPaidTemplate && profile.plan === 'starter';
                return (
                  <div key={t} className="relative">
                    <button
                      onClick={() => !isLocked && setField('template', t)}
                      className={`w-full py-2 px-2 rounded-lg border text-xs font-medium transition-all capitalize ${
                        form.template === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {t}
                    </button>
                    {isLocked && (
                      <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white text-[9px] font-bold rounded-full px-1 shadow">PREMIUM</span>
                    )}
                  </div>
                );
              })}
            </div>
            {(profile.plan === 'free' || profile.plan === 'starter') && (
              <p className="text-xs text-amber-600 mt-2">
                🔒 Minimal & Bold require Growth or Pro. <a href="/upgrade" className="underline">Upgrade →</a>
              </p>
            )}
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">
              {docType === 'invoice' ? 'Bill To' : 'Customer'}
            </h3>
            {clients.length > 0 && (
              <div className="mb-3">
                <label className={labelCls}>Select saved client</label>
                <select className={inputCls} onChange={e => handleClientSelect(e.target.value)} value={form.client_id || ''}>
                  <option value="">— Type manually or select —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={form.client_name} onChange={e => setField('client_name', e.target.value)} placeholder="Client or company name" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={form.client_email} onChange={e => setField('client_email', e.target.value)} placeholder="client@email.com" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={form.client_phone} onChange={e => setField('client_phone', e.target.value)} placeholder="+234..." />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Address</label>
                <input className={inputCls} value={form.client_address} onChange={e => setField('client_address', e.target.value)} placeholder="Street, City, Country" />
              </div>
            </div>
          </div>

          {/* Dates & Currency */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Issue Date</label>
                <input className={inputCls} type="date" value={form.issue_date} onChange={e => setField('issue_date', e.target.value)} />
              </div>
              {docType === 'invoice' && (
                <div>
                  <label className={labelCls}>Due Date</label>
                  <input className={inputCls} type="date" value={form.due_date || ''} onChange={e => setField('due_date', e.target.value)} />
                </div>
              )}
              <div>
                <label className={labelCls}>Currency</label>
                <select className={inputCls} value={form.currency} onChange={e => setField('currency', e.target.value as Currency)}>
                  {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.symbol} {c.value}</option>)}
                </select>
              </div>
              {docType === 'invoice' && (
                <div>
                  <label className={labelCls}>Net Terms</label>
                  <select className={inputCls} value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)}>
                    <option value="">Select terms</option>
                    {NET_TERMS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                  </select>
                </div>
              )}
              {docType === 'receipt' && (
                <div>
                  <label className={labelCls}>Payment Method</label>
                  <select className={inputCls} value={form.payment_method} onChange={e => setField('payment_method', e.target.value)}>
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Line Items</h3>
              {products.length > 0 && (
                <select
                  className="text-xs border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-lg px-2 py-1 cursor-pointer"
                  onChange={e => {
                    const p = products.find(x => x.id === e.target.value);
                    if (p) { addProductToItems(p); e.target.value = ''; }
                  }}
                  value=""
                >
                  <option value="">+ Add from library</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.unit_price, form.currency)}</option>)}
                </select>
              )}
            </div>

            {/* Header row */}
            <div className="hidden sm:grid grid-cols-12 gap-2 mb-2 px-1">
              <div className="col-span-5 text-xs text-gray-400 uppercase tracking-wide">Description</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide">Qty</div>
              <div className="col-span-3 text-xs text-gray-400 uppercase tracking-wide">Unit Price</div>
              <div className="col-span-2 text-xs text-gray-400 uppercase tracking-wide text-right">Amount</div>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="col-span-12 sm:col-span-5 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={item.description}
                    onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                    placeholder={`Item ${idx + 1}`}
                  />
                  <input
                    className="col-span-4 sm:col-span-2 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                    type="number" min="1" step="1"
                    value={item.quantity}
                    onChange={e => updateLineItem(item.id, 'quantity', Math.max(1, Math.floor(parseInt(e.target.value) || 1)))}
                  />
                  <input
                    className="col-span-6 sm:col-span-3 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                    type="number" min="0" step="0.01"
                    value={item.unit_price}
                    onChange={e => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <div className="col-span-1 sm:col-span-2 flex items-center justify-end gap-1">
                    <span className="text-sm font-medium text-gray-900 hidden sm:block">
                      {formatCurrency(item.amount, form.currency)}
                    </span>
                    <button onClick={() => removeLineItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addLineItem}
              className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Plus size={15} /> Add line item
            </button>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {/* Tax */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <select className="text-xs border border-gray-200 rounded px-2 py-1.5" value={form.tax_type} onChange={e => {
                    const val = e.target.value;
                    setField('tax_type', val);
                    if (val === 'None') setField('tax_rate', 0);
                  }}>
                    {['VAT', 'GST', 'Sales Tax', 'None'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  {form.tax_type !== 'None' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min="0" max="100" step="0.5"
                        className="w-16 text-xs border border-gray-200 rounded px-2 py-1.5 text-right"
                        value={form.tax_rate}
                        onChange={e => setField('tax_rate', parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600">{form.tax_type === 'None' ? formatCurrency(0, form.currency) : formatCurrency(totals.tax_amount, form.currency)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <select className="text-xs border border-gray-200 rounded px-2 py-1.5" value={form.discount_type} onChange={e => setField('discount_type', e.target.value)}>
                    <option value="percentage">Discount %</option>
                    <option value="fixed">Discount fixed</option>
                  </select>
                  <input
                    type="number" min="0" step="0.01"
                    className="w-20 text-xs border border-gray-200 rounded px-2 py-1.5 text-right"
                    value={form.discount_value}
                    onChange={e => setField('discount_value', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <span className="text-sm text-gray-600">-{formatCurrency(totals.discount_amount, form.currency)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(totals.total, form.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Notes / Message to Client</label>
                  <div className="flex gap-1">
                    {[
                      { label: 'Thank you', text: 'Thank you for your business! We appreciate your trust and look forward to working with you again.' },
                      { label: 'Payment info', text: `Please make payment within the due date. Bank transfer preferred. Contact us at ${profile.email || 'our email'} for any questions.` },
                    ].map(tpl => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => setField('notes', tpl.text)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100 whitespace-nowrap"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea className={`${inputCls} resize-none h-20`} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Thank you for your business..." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelCls}>Internal Note (not shown)</label>
                  <div className="flex gap-1">
                    {[
                      { label: 'Follow up', text: 'Follow up in 3 days if payment not received. Check with accounts team.' },
                      { label: 'Reference', text: `Project ref: [CODE]. Assigned to: [NAME]. Quarter: Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}.` },
                    ].map(tpl => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => setField('internal_note', tpl.text)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200 whitespace-nowrap"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea className={`${inputCls} resize-none h-20`} value={form.internal_note} onChange={e => setField('internal_note', e.target.value)} placeholder="Reference, project code..." />
              </div>
            </div>
          </div>

          {/* Share link */}
          {shareUrl && (
            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <label className="text-xs font-medium text-indigo-700 uppercase tracking-wide mb-2 block">Share Link</label>
              <div className="flex items-center gap-2">
                <input className="flex-1 text-xs bg-white border border-indigo-200 rounded-lg px-3 py-2 text-gray-700" value={shareUrl} readOnly />
                <button onClick={copyShareLink} className="p-2 bg-white border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors">
                  <Copy size={15} />
                </button>
                <button onClick={handleWhatsAppShare} className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors text-xs font-medium px-3">
                  WA
                </button>
              </div>
            </div>
          )}

          {/* Actions — Bug #7: 2x2 grid on mobile, row on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 pb-8">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center justify-center gap-1.5 text-sm border border-gray-200 bg-white text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save size={15} /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave('sent')}
              disabled={saving}
              className="flex items-center justify-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Send size={15} /> {saving ? 'Saving...' : 'Mark as Sent'}
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-1.5 text-sm bg-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              onClick={handleExportImage}
              className="flex items-center justify-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
            >
              <ImageIcon size={15} /> Download Image
            </button>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      {showPreview && (
        <div className="flex-1 bg-gray-100 overflow-y-auto lg:border-l border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Live Preview</span>
              <button onClick={() => setShowPreview(false)} className="lg:hidden text-xs text-gray-500 hover:text-gray-700">✕ Close</button>
            </div>
            <div ref={previewRef} className="bg-white rounded-lg shadow-sm">
              <DocumentPreview document={docForPreview as Document} />
            </div>
          </div>
        </div>
      )}

      {/* Hidden full A4 export node — used by PDF and Image download.
          Must NOT use negative z-index or overflow:hidden — html2canvas
          cannot capture elements painted behind the stacking context. */}
      <div
        ref={exportRef}
        aria-hidden="true"
        style={{
          display: 'none',
          position: 'absolute',
          top: 0,
          left: '-9999px',
          width: '794px',
          background: '#ffffff',
          pointerEvents: 'none',
        }}
      >
        <DocumentPreview document={docForPreview as Document} />
      </div>
    </div>
  );
}
