'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import type { Document } from '@/types';

interface Props {
  document: Document;
}

const A4_WIDTH = 794; // px at 96 dpi

export function DocumentPreview({ document: doc }: Props) {
  const template = doc.template || 'classic';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const recalculate = useCallback(() => {
    if (!wrapperRef.current || !contentRef.current) return;
    const containerWidth = wrapperRef.current.getBoundingClientRect().width;
    if (containerWidth > 0) {
      const newScale = Math.min(1, containerWidth / A4_WIDTH);
      setScale(newScale);
      const naturalHeight = contentRef.current.scrollHeight;
      setContentHeight(Math.round(naturalHeight * newScale));
    }
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver(recalculate);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [recalculate]);

  // Re-measure whenever template or key doc fields change
  useEffect(() => {
    requestAnimationFrame(recalculate);
  }, [template, doc.line_items?.length, doc.notes, recalculate]);

  const content = (() => {
    if (template === 'modern') return <ModernTemplate doc={doc} />;
    if (template === 'minimal') return <MinimalTemplate doc={doc} />;
    if (template === 'bold') return <BoldTemplate doc={doc} />;
    return <ClassicTemplate doc={doc} />;
  })();

  return (
    <div
      ref={wrapperRef}
      className="w-full overflow-hidden bg-white"
      // Constrain wrapper to the scaled height so no blank space below
      style={{ height: contentHeight != null ? `${contentHeight}px` : undefined }}
    >
      <div
        ref={contentRef}
        className="origin-top-left"
        style={{
          width: `${A4_WIDTH}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {content}
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ClassicTemplate({ doc }: { doc: Document }) {
  const color = doc.sender_brand_color || '#6366f1';
  const cur = doc.currency;
  return (
    <div className="p-10 min-h-[1120px] bg-white" style={{ fontFamily: 'Georgia, serif', width: '794px' }}>
      <div className="flex justify-between items-start mb-10">
        <div>
          {doc.sender_logo_url && <Image src={doc.sender_logo_url} alt="Logo" width={160} height={64} className="max-h-16 max-w-40 object-contain mb-3" unoptimized crossOrigin="anonymous" />}
          <div className="text-xl font-bold" style={{ color }}>{doc.sender_name}</div>
          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
            {doc.sender_address && <div>{doc.sender_address}</div>}
            {doc.sender_phone && <div>{doc.sender_phone}</div>}
            {doc.sender_email && <div>{doc.sender_email}</div>}
            {doc.sender_tax_number && <div>Tax No: {doc.sender_tax_number}</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold uppercase tracking-widest text-gray-200">{doc.document_type}</div>
          <div className="text-lg font-bold mt-1" style={{ color }}>{doc.document_number}</div>
          <div className="text-xs text-gray-500 mt-2 space-y-0.5">
            <div>Date: {formatDate(doc.issue_date)}</div>
            {doc.due_date && <div>Due: {formatDate(doc.due_date)}</div>}
          </div>
        </div>
      </div>
      <div className="h-0.5 mb-8" style={{ backgroundColor: color }} />
      {doc.client_name && (
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</div>
          <div className="font-bold text-gray-900">{doc.client_name}</div>
          {doc.client_address && <div className="text-sm text-gray-600">{doc.client_address}</div>}
          {doc.client_phone && <div className="text-sm text-gray-600">{doc.client_phone}</div>}
          {doc.client_email && <div className="text-sm text-gray-600">{doc.client_email}</div>}
        </div>
      )}
      <table className="w-full mb-8">
        <thead>
          <tr style={{ backgroundColor: color }}>
            <th className="text-left text-white text-xs font-semibold px-3 py-2.5">Description</th>
            <th className="text-right text-white text-xs font-semibold px-3 py-2.5 w-16">Qty</th>
            <th className="text-right text-white text-xs font-semibold px-3 py-2.5 w-28">Unit Price</th>
            <th className="text-right text-white text-xs font-semibold px-3 py-2.5 w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.line_items?.map((item, i) => (
            <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="text-sm px-3 py-2.5">{item.description}</td>
              <td className="text-sm text-right px-3 py-2.5">{item.quantity}</td>
              <td className="text-sm text-right px-3 py-2.5">{formatCurrency(item.unit_price, cur)}</td>
              <td className="text-sm text-right px-3 py-2.5 font-medium">{formatCurrency(item.amount, cur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1.5">
          <TotalRow label="Subtotal" value={formatCurrency(doc.subtotal, cur)} />
          {doc.discount_amount > 0 && <TotalRow label="Discount" value={`-${formatCurrency(doc.discount_amount, cur)}`} />}
          {doc.tax_amount > 0 && <TotalRow label={`${doc.tax_type || 'Tax'} (${doc.tax_rate}%)`} value={formatCurrency(doc.tax_amount, cur)} />}
          <div className="flex justify-between pt-2 border-t-2 font-bold" style={{ borderColor: color }}>
            <span>Total</span><span style={{ color }}>{formatCurrency(doc.total, cur)}</span>
          </div>
        </div>
      </div>
      {doc.notes && <div className="border-t pt-4"><p className="text-sm text-gray-600">{doc.notes}</p></div>}
      <div className="mt-12 pt-4 border-t text-center text-xs text-gray-400">Generated with PickInvoice</div>
    </div>
  );
}

// Bug #3: Modern template — more colorful with gradient header like reference images
function ModernTemplate({ doc }: { doc: Document }) {
  const color = doc.sender_brand_color || '#6366f1';
  const cur = doc.currency;
  // Generate a complementary gradient color
  const gradientColor = shiftHue(color, 40);
  return (
    <div className="min-h-[1120px] bg-white" style={{ fontFamily: 'system-ui, sans-serif', width: '794px' }}>
      {/* Colorful gradient header */}
      <div className="px-10 py-10 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color} 0%, ${gradientColor} 100%)` }}>
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translateY(50%)' }} />
        <div className="flex justify-between items-start relative z-10">
          <div>
            {doc.sender_logo_url
              ? <Image src={doc.sender_logo_url} alt="Logo" width={144} height={48} className="max-h-12 max-w-36 object-contain mb-2" style={{ filter: 'brightness(0) invert(1)' }} unoptimized crossOrigin="anonymous" />
              : <div className="text-2xl font-bold text-white">{doc.sender_name}</div>}
            {doc.sender_logo_url && <div className="text-white font-bold text-lg">{doc.sender_name}</div>}
            <div className="text-white/70 text-xs mt-1 space-y-0.5">
              {doc.sender_address && <div>{doc.sender_address}</div>}
              {doc.sender_email && <div>{doc.sender_email}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/70 text-sm uppercase tracking-widest">{doc.document_type}</div>
            <div className="text-white text-3xl font-black mt-1">{doc.document_number}</div>
            <div className="text-white/70 text-xs mt-2 space-y-0.5">
              <div>Issued: {formatDate(doc.issue_date)}</div>
              {doc.due_date && <div>Due: {formatDate(doc.due_date)}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Client info bar */}
      {doc.client_name && (
        <div className="px-10 py-5 border-b border-gray-100 bg-gray-50 flex items-center gap-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color }}>Bill To</div>
            <div className="font-semibold text-gray-900">{doc.client_name}</div>
            {doc.client_address && <div className="text-sm text-gray-500">{doc.client_address}</div>}
            {doc.client_phone && <div className="text-sm text-gray-500">{doc.client_phone}</div>}
            {doc.client_email && <div className="text-sm text-gray-500">{doc.client_email}</div>}
          </div>
        </div>
      )}

      <div className="p-10">
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2" style={{ borderColor: color }}>
              <th className="text-left text-xs font-bold uppercase text-gray-500 pb-3">Description</th>
              <th className="text-right text-xs font-bold uppercase text-gray-500 pb-3 w-16">Qty</th>
              <th className="text-right text-xs font-bold uppercase text-gray-500 pb-3 w-28">Unit Price</th>
              <th className="text-right text-xs font-bold uppercase text-gray-500 pb-3 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.line_items?.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="text-sm py-3 px-2">{item.description}</td>
                <td className="text-sm py-3 text-right text-gray-600 px-2">{item.quantity}</td>
                <td className="text-sm py-3 text-right text-gray-600 px-2">{formatCurrency(item.unit_price, cur)}</td>
                <td className="text-sm py-3 text-right font-semibold px-2">{formatCurrency(item.amount, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="space-y-2 pb-3 border-b border-gray-100">
              <TotalRow label="Subtotal" value={formatCurrency(doc.subtotal, cur)} />
              {doc.discount_amount > 0 && <TotalRow label="Discount" value={`-${formatCurrency(doc.discount_amount, cur)}`} />}
              {doc.tax_amount > 0 && <TotalRow label={`${doc.tax_type} ${doc.tax_rate}%`} value={formatCurrency(doc.tax_amount, cur)} />}
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl text-white font-bold text-lg mt-3" style={{ background: `linear-gradient(135deg, ${color} 0%, ${gradientColor} 100%)` }}>
              <span>Total Due</span><span>{formatCurrency(doc.total, cur)}</span>
            </div>
          </div>
        </div>
        {doc.notes && <p className="text-sm text-gray-500 border-t pt-4">{doc.notes}</p>}
        <div className="mt-10 pt-4 border-t text-center text-xs text-gray-400">Generated with PickInvoice</div>
      </div>
    </div>
  );
}

// Bug #3: Minimal — teal/cyan colorful version inspired by reference image 3
function MinimalTemplate({ doc }: { doc: Document }) {
  const color = doc.sender_brand_color || '#0d9488'; // teal default for minimal
  const cur = doc.currency;
  return (
    <div className="min-h-[1120px] bg-white" style={{ fontFamily: 'system-ui, sans-serif', width: '794px' }}>
      {/* Teal top bar */}
      <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${shiftHue(color, 30)})` }} />
      <div className="p-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            {doc.sender_logo_url && <Image src={doc.sender_logo_url} alt="Logo" width={144} height={48} className="max-h-12 max-w-36 object-contain mb-3" unoptimized crossOrigin="anonymous" />}
            <div className="text-2xl font-black" style={{ color }}>{doc.document_type.toUpperCase()}.</div>
            <div className="text-xs text-gray-400 font-mono mt-1">No. {doc.document_number}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900">{doc.sender_name}</div>
            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
              {doc.sender_address && <div>{doc.sender_address}</div>}
              {doc.sender_email && <div>{doc.sender_email}</div>}
              {doc.sender_phone && <div>{doc.sender_phone}</div>}
            </div>
          </div>
        </div>

        {/* Two column info */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {doc.client_name && (
            <div className="p-4 rounded-xl border-2" style={{ borderColor: color + '33', backgroundColor: color + '08' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>Invoice To:</div>
              <div className="font-semibold text-gray-900">{doc.client_name}</div>
              {doc.client_address && <div className="text-xs text-gray-500 mt-1">{doc.client_address}</div>}
              {doc.client_email && <div className="text-xs text-gray-500">{doc.client_email}</div>}
              {doc.client_phone && <div className="text-xs text-gray-500">{doc.client_phone}</div>}
            </div>
          )}
          <div className="p-4 rounded-xl" style={{ backgroundColor: color, color: 'white' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Payment Method</div>
            <div className="font-semibold">{doc.payment_method || 'Bank Transfer'}</div>
            <div className="mt-2 text-xs opacity-80 space-y-0.5">
              <div>Invoice Date: {formatDate(doc.issue_date)}</div>
              {doc.due_date && <div>Due Date: {formatDate(doc.due_date)}</div>}
            </div>
            <div className="mt-3 text-xs opacity-80">Amount Due:</div>
            <div className="text-xl font-black">{formatCurrency(doc.total, cur)}</div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-6">
          <thead>
            <tr>
              <th className="text-left text-xs font-bold uppercase text-white px-3 py-2.5 rounded-l-lg" style={{ backgroundColor: color }}>No.</th>
              <th className="text-left text-xs font-bold uppercase text-white px-3 py-2.5" style={{ backgroundColor: color }}>Product Description</th>
              <th className="text-right text-xs font-bold uppercase text-white px-3 py-2.5" style={{ backgroundColor: color }}>Price</th>
              <th className="text-right text-xs font-bold uppercase text-white px-3 py-2.5" style={{ backgroundColor: color }}>Qty</th>
              <th className="text-right text-xs font-bold uppercase text-white px-3 py-2.5 rounded-r-lg" style={{ backgroundColor: color }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.line_items?.map((item, i) => (
              <tr key={item.id} style={{ backgroundColor: i % 2 === 1 ? color + '10' : 'white' }}>
                <td className="text-sm px-3 py-3 text-gray-500">{String(i + 1).padStart(2, '0')}.</td>
                <td className="text-sm px-3 py-3 font-medium">{item.description}</td>
                <td className="text-sm px-3 py-3 text-right text-gray-600">{formatCurrency(item.unit_price, cur)}</td>
                <td className="text-sm px-3 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="text-sm px-3 py-3 text-right font-bold">{formatCurrency(item.amount, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Sub Total:</span><span>{formatCurrency(doc.subtotal, cur)}</span>
            </div>
            {doc.discount_amount > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Discount:</span><span>-{formatCurrency(doc.discount_amount, cur)}</span></div>}
            {doc.tax_amount > 0 && <div className="flex justify-between text-sm text-gray-500"><span>{doc.tax_type} ({doc.tax_rate}%):</span><span>{formatCurrency(doc.tax_amount, cur)}</span></div>}
            <div className="flex justify-between items-center py-2 px-4 rounded-xl font-bold text-white text-lg" style={{ backgroundColor: color }}>
              <span>Total Due:</span><span>{formatCurrency(doc.total, cur)}</span>
            </div>
          </div>
        </div>

        {doc.notes && (
          <div className="p-4 rounded-xl border mb-4" style={{ borderColor: color + '33', backgroundColor: color + '05' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color }}>Terms &amp; Conditions</div>
            <p className="text-xs text-gray-500">{doc.notes}</p>
          </div>
        )}
        <div className="pt-4 border-t text-center text-xs text-gray-400">Generated with PickInvoice</div>
      </div>
    </div>
  );
}

// Bug #3: Bold template — vibrant purple-to-red gradient inspired by reference image 2
function BoldTemplate({ doc }: { doc: Document }) {
  const color = doc.sender_brand_color || '#7c3aed';
  const cur = doc.currency;
  const gradEnd = shiftHue(color, 50); // shift toward red/orange
  return (
    <div className="min-h-[1120px] bg-white" style={{ fontFamily: 'system-ui, sans-serif', width: '794px' }}>
      {/* Full gradient header */}
      <div className="px-10 py-10 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color} 0%, ${gradEnd} 100%)` }}>
        {/* Geometric corner accents */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20" style={{ background: 'rgba(255,255,255,0.15)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
        <div className="flex justify-between items-start relative z-10">
          <div>
            {doc.sender_logo_url
              ? <Image src={doc.sender_logo_url} alt="Logo" width={160} height={56} className="max-h-14 max-w-40 object-contain" style={{ filter: 'brightness(0) invert(1)' }} unoptimized crossOrigin="anonymous" />
              : <div className="text-2xl font-black text-white">{doc.sender_name}</div>}
            {doc.sender_logo_url && <div className="text-white font-bold">{doc.sender_name}</div>}
          </div>
          <div className="text-right">
            <div className="text-white/70 text-sm font-semibold">Date Information</div>
            <div className="text-white text-sm">{formatDate(doc.issue_date)}</div>
            {doc.due_date && <><div className="text-white/70 text-sm font-semibold mt-2">Due Date</div><div className="text-white text-sm">{formatDate(doc.due_date)}</div></>}
            <div className="text-white/70 text-sm font-semibold mt-2">Invoice Number</div>
            <div className="text-white text-sm font-mono">{doc.document_number}</div>
          </div>
        </div>
        <div className="mt-6 relative z-10">
          <div className="text-5xl font-black text-white uppercase tracking-tight">{doc.document_type}</div>
          <div className="text-white/80 font-mono text-sm mt-1">#{doc.document_number}</div>
          {doc.sender_address && <div className="text-white/60 text-xs mt-2">{doc.sender_name}, {formatDate(doc.issue_date)}</div>}
        </div>
      </div>

      <div className="p-10">
        {/* Two col info */}
        {doc.client_name && (
          <div className="flex justify-between mb-8 pb-6 border-b border-gray-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Invoice To:</div>
              <div className="font-bold text-gray-900">{doc.client_name}</div>
              {doc.client_address && <div className="text-sm text-gray-500">{doc.client_address}</div>}
              {doc.client_phone && <div className="text-sm text-gray-500">{doc.client_phone}</div>}
              {doc.client_email && <div className="text-sm text-gray-500">{doc.client_email}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Due:</div>
              <div className="text-2xl font-black" style={{ color }}>{formatCurrency(doc.total, cur)}</div>
            </div>
          </div>
        )}

        <table className="w-full mb-6 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-xs font-bold uppercase text-gray-500 px-4 py-3">NO.</th>
              <th className="text-left text-xs font-bold uppercase text-gray-500 px-4 py-3">Item Description</th>
              <th className="text-right text-xs font-bold uppercase text-gray-500 px-4 py-3 w-28">Price</th>
              <th className="text-right text-xs font-bold uppercase text-gray-500 px-4 py-3 w-20">Qty.</th>
              <th className="text-right text-xs font-bold uppercase text-gray-500 px-4 py-3 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.line_items?.map((item, i) => (
              <tr key={item.id} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}>
                <td className="text-sm px-4 py-3 text-gray-400 font-mono">{String(i + 1).padStart(2, '0')}.</td>
                <td className="text-sm px-4 py-3 font-semibold">{item.description}</td>
                <td className="text-sm px-4 py-3 text-right text-gray-600">{formatCurrency(item.unit_price, cur)}</td>
                <td className="text-sm px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                <td className="text-sm px-4 py-3 text-right font-bold">{formatCurrency(item.amount, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-start justify-between mb-8">
          {/* Left: payment info */}
          <div className="space-y-1 text-sm text-gray-500 max-w-xs">
            <div className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2">Thank you for your business</div>
            {doc.sender_phone && <div>📞 {doc.sender_phone}</div>}
            {doc.sender_email && <div>✉ {doc.sender_email}</div>}
          </div>
          {/* Right: totals */}
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Sub total:</span><span className="text-gray-700">{formatCurrency(doc.subtotal, cur)}</span>
            </div>
            {doc.discount_amount > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Discount:</span><span>-{formatCurrency(doc.discount_amount, cur)}</span></div>}
            {doc.tax_amount > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Tax ({doc.tax_rate}%):</span><span>{formatCurrency(doc.tax_amount, cur)}</span></div>}
            <div className="flex justify-between items-center py-3 px-4 rounded-xl text-white font-bold text-lg mt-2" style={{ background: `linear-gradient(135deg, ${color} 0%, ${gradEnd} 100%)` }}>
              <span>Total</span><span>{formatCurrency(doc.total, cur)}</span>
            </div>
          </div>
        </div>

        {doc.notes && (
          <div className="border-t pt-4">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-1">Terms &amp; Conditions</div>
            <p className="text-xs text-gray-500">{doc.notes}</p>
          </div>
        )}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">Generated with PickInvoice</div>
      </div>
    </div>
  );
}

// Helper: shift hue of a hex color by degrees
function shiftHue(hex: string, degrees: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    h = (h * 360 + degrees) % 360;
    if (h < 0) h += 360;
    h /= 360;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p2 = 2 * l - q2;
    const rr = Math.round(hue2rgb(p2, q2, h + 1/3) * 255);
    const gg = Math.round(hue2rgb(p2, q2, h) * 255);
    const bb2 = Math.round(hue2rgb(p2, q2, h - 1/3) * 255);
    return `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb2.toString(16).padStart(2, '0')}`;
  } catch { return hex; }
}