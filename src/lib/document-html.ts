import type { Document } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: 'GH₵', KES: 'KSh', ZAR: 'R',
  };
  const sym = symbols[currency] || currency;
  return `${sym}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Shared CSS reset + utils ────────────────────────────────────────────────

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { border-collapse: collapse; width: 100%; }
  img { display: block; }
`;

// ─── Template renderers ──────────────────────────────────────────────────────

function classicHtml(doc: Document): string {
  const color = esc(doc.sender_brand_color || '#6366f1');
  const cur = doc.currency;

  const rows = (doc.line_items || []).map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="padding:10px 12px;font-size:13px">${esc(item.description)}</td>
      <td style="padding:10px 12px;font-size:13px;text-align:right">${item.quantity}</td>
      <td style="padding:10px 12px;font-size:13px;text-align:right">${fmtCurrency(item.unit_price, cur)}</td>
      <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:600">${fmtCurrency(item.amount, cur)}</td>
    </tr>`).join('');

  const logoHtml = doc.sender_logo_url
    ? `<img src="${esc(doc.sender_logo_url)}" alt="logo" style="max-height:64px;max-width:160px;object-fit:contain;margin-bottom:12px" crossorigin="anonymous" />`
    : '';

  return `
    <div style="padding:40px;font-family:Georgia,serif;min-height:100vh">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
        <div>
          ${logoHtml}
          <div style="font-size:18px;font-weight:700;color:${color}">${esc(doc.sender_name)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;line-height:1.6">
            ${doc.sender_address ? `<div>${esc(doc.sender_address)}</div>` : ''}
            ${doc.sender_phone ? `<div>${esc(doc.sender_phone)}</div>` : ''}
            ${doc.sender_email ? `<div>${esc(doc.sender_email)}</div>` : ''}
            ${doc.sender_tax_number ? `<div>Tax No: ${esc(doc.sender_tax_number)}</div>` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:28px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#e5e7eb">${esc(doc.document_type)}</div>
          <div style="font-size:16px;font-weight:700;margin-top:4px;color:${color}">${esc(doc.document_number)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:8px;line-height:1.6">
            <div>Date: ${fmtDate(doc.issue_date)}</div>
            ${doc.due_date ? `<div>Due: ${fmtDate(doc.due_date)}</div>` : ''}
          </div>
        </div>
      </div>

      <div style="height:2px;background:${color};margin-bottom:32px"></div>

      ${doc.client_name ? `
        <div style="margin-bottom:32px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">Bill To</div>
          <div style="font-weight:700;color:#111827">${esc(doc.client_name)}</div>
          ${doc.client_address ? `<div style="font-size:13px;color:#4b5563">${esc(doc.client_address)}</div>` : ''}
          ${doc.client_email ? `<div style="font-size:13px;color:#4b5563">${esc(doc.client_email)}</div>` : ''}
        </div>` : ''}

      <table style="margin-bottom:32px">
        <thead>
          <tr style="background:${color}">
            <th style="text-align:left;color:#fff;font-size:11px;font-weight:600;padding:10px 12px">Description</th>
            <th style="text-align:right;color:#fff;font-size:11px;font-weight:600;padding:10px 12px;width:60px">Qty</th>
            <th style="text-align:right;color:#fff;font-size:11px;font-weight:600;padding:10px 12px;width:110px">Unit Price</th>
            <th style="text-align:right;color:#fff;font-size:11px;font-weight:600;padding:10px 12px;width:110px">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
        <div style="width:256px">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
            <span style="color:#6b7280">Subtotal</span><span style="font-weight:500">${fmtCurrency(doc.subtotal, cur)}</span>
          </div>
          ${doc.discount_amount > 0 ? `
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
              <span style="color:#6b7280">Discount</span><span style="font-weight:500">-${fmtCurrency(doc.discount_amount, cur)}</span>
            </div>` : ''}
          ${doc.tax_amount > 0 ? `
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
              <span style="color:#6b7280">${esc(doc.tax_type || 'Tax')} (${doc.tax_rate}%)</span><span style="font-weight:500">${fmtCurrency(doc.tax_amount, cur)}</span>
            </div>` : ''}
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px;border-top:2px solid ${color};padding-top:8px;margin-top:8px">
            <span>Total</span><span style="color:${color}">${fmtCurrency(doc.total, cur)}</span>
          </div>
        </div>
      </div>

      ${doc.notes ? `<div style="border-top:1px solid #e5e7eb;padding-top:16px"><p style="font-size:13px;color:#4b5563">${esc(doc.notes)}</p></div>` : ''}
      <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af">Generated with PickInvoice</div>
    </div>
  `;
}

function modernHtml(doc: Document): string {
  const color = esc(doc.sender_brand_color || '#6366f1');
  const cur = doc.currency;

  const rows = (doc.line_items || []).map(item => `
    <tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:12px 0;font-size:13px">${esc(item.description)}</td>
      <td style="padding:12px 0;font-size:13px;text-align:right;color:#6b7280">${item.quantity}</td>
      <td style="padding:12px 0;font-size:13px;text-align:right;color:#6b7280">${fmtCurrency(item.unit_price, cur)}</td>
      <td style="padding:12px 0;font-size:13px;text-align:right;font-weight:600">${fmtCurrency(item.amount, cur)}</td>
    </tr>`).join('');

  const logoBlock = doc.sender_logo_url
    ? `<img src="${esc(doc.sender_logo_url)}" alt="logo" style="max-height:48px;max-width:144px;object-fit:contain;margin-bottom:8px;filter:brightness(0) invert(1)" crossorigin="anonymous" />`
    : `<div style="font-size:22px;font-weight:700;color:#fff">${esc(doc.sender_name)}</div>`;

  return `
    <div style="font-family:system-ui,sans-serif;min-height:100vh">
      <div style="background:${color};padding:32px 40px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            ${logoBlock}
            ${doc.sender_logo_url ? `<div style="color:#fff;font-weight:700;font-size:16px">${esc(doc.sender_name)}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div style="color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:2px">${esc(doc.document_type)}</div>
            <div style="color:#fff;font-size:22px;font-weight:700;margin-top:4px">${esc(doc.document_number)}</div>
          </div>
        </div>
      </div>

      <div style="padding:40px">
        <div style="display:flex;justify-content:space-between;margin-bottom:32px">
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">From</div>
            <div style="font-size:13px;color:#4b5563;line-height:1.6">
              ${doc.sender_address ? `<div>${esc(doc.sender_address)}</div>` : ''}
              ${doc.sender_email ? `<div>${esc(doc.sender_email)}</div>` : ''}
            </div>
          </div>
          ${doc.client_name ? `
            <div style="text-align:right">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">Bill To</div>
              <div style="font-weight:600;color:#111827">${esc(doc.client_name)}</div>
              ${doc.client_address ? `<div style="font-size:13px;color:#6b7280">${esc(doc.client_address)}</div>` : ''}
            </div>` : ''}
          <div style="text-align:right">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:8px">Details</div>
            <div style="font-size:13px;color:#374151;line-height:1.6">
              <div>Issued: ${fmtDate(doc.issue_date)}</div>
              ${doc.due_date ? `<div>Due: ${fmtDate(doc.due_date)}</div>` : ''}
            </div>
          </div>
        </div>

        <table style="margin-bottom:32px">
          <thead>
            <tr style="border-bottom:2px solid ${color}">
              <th style="text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;padding-bottom:8px">Description</th>
              <th style="text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;padding-bottom:8px;width:60px">Qty</th>
              <th style="text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;padding-bottom:8px;width:110px">Rate</th>
              <th style="text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;padding-bottom:8px;width:110px">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
          <div style="width:288px">
            <div style="padding-bottom:12px">
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                <span style="color:#6b7280">Subtotal</span><span style="font-weight:500">${fmtCurrency(doc.subtotal, cur)}</span>
              </div>
              ${doc.discount_amount > 0 ? `
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                  <span style="color:#6b7280">Discount</span><span>-${fmtCurrency(doc.discount_amount, cur)}</span>
                </div>` : ''}
              ${doc.tax_amount > 0 ? `
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                  <span style="color:#6b7280">${esc(doc.tax_type)} ${doc.tax_rate}%</span><span>${fmtCurrency(doc.tax_amount, cur)}</span>
                </div>` : ''}
            </div>
            <div style="background:${color};border-radius:12px;padding:16px;color:#fff;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:18px">
              <span>Total Due</span><span>${fmtCurrency(doc.total, cur)}</span>
            </div>
          </div>
        </div>

        ${doc.notes ? `<p style="font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px">${esc(doc.notes)}</p>` : ''}
      </div>
    </div>
  `;
}

function minimalHtml(doc: Document): string {
  const cur = doc.currency;

  const rows = (doc.line_items || []).map(item => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e5e7eb">
      <div>
        <div style="font-size:13px;font-weight:500">${esc(item.description)}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px">${item.quantity} × ${fmtCurrency(item.unit_price, cur)}</div>
      </div>
      <div style="font-size:13px;font-weight:700">${fmtCurrency(item.amount, cur)}</div>
    </div>`).join('');

  const logoHtml = doc.sender_logo_url
    ? `<img src="${esc(doc.sender_logo_url)}" alt="logo" style="max-height:40px;max-width:128px;object-fit:contain;margin-bottom:8px;filter:grayscale(1)" crossorigin="anonymous" />`
    : '';

  return `
    <div style="padding:40px;font-family:monospace;min-height:100vh">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px">
        <div>
          ${logoHtml}
          <div style="font-weight:700;color:#111827">${esc(doc.sender_name)}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:4px">${esc(doc.sender_address)} · ${esc(doc.sender_email)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px">${esc(doc.document_type)}</div>
          <div style="font-size:18px;font-weight:700;color:#111827;margin-top:4px">${esc(doc.document_number)}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:4px">${fmtDate(doc.issue_date)}${doc.due_date ? ` → ${fmtDate(doc.due_date)}` : ''}</div>
        </div>
      </div>

      ${doc.client_name ? `
        <div style="margin-bottom:40px">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">To</div>
          <div style="font-weight:700">${esc(doc.client_name)}</div>
          ${doc.client_address ? `<div style="font-size:11px;color:#6b7280">${esc(doc.client_address)}</div>` : ''}
        </div>` : ''}

      <div style="border-top:1px solid #e5e7eb"></div>
      ${rows}

      <div style="margin-top:16px;display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        ${doc.discount_amount > 0 ? `
          <div style="display:flex;gap:32px;font-size:13px">
            <span style="color:#6b7280">Discount</span><span>-${fmtCurrency(doc.discount_amount, cur)}</span>
          </div>` : ''}
        ${doc.tax_amount > 0 ? `
          <div style="display:flex;gap:32px;font-size:13px">
            <span style="color:#6b7280">${esc(doc.tax_type)} ${doc.tax_rate}%</span><span>${fmtCurrency(doc.tax_amount, cur)}</span>
          </div>` : ''}
        <div style="display:flex;gap:32px;font-size:18px;font-weight:700;border-top:2px solid #111827;padding-top:8px;margin-top:8px">
          <span>TOTAL</span><span>${fmtCurrency(doc.total, cur)}</span>
        </div>
      </div>

      ${doc.notes ? `<p style="font-size:11px;color:#9ca3af;margin-top:40px;border-top:1px solid #e5e7eb;padding-top:16px">${esc(doc.notes)}</p>` : ''}
    </div>
  `;
}

function boldHtml(doc: Document): string {
  const color = esc(doc.sender_brand_color || '#6366f1');
  const cur = doc.currency;

  const rows = (doc.line_items || []).map(item => `
    <tr style="border-bottom:1px solid #f3f4f6">
      <td style="padding:12px 0;font-size:13px;font-weight:600">${esc(item.description)}</td>
      <td style="padding:12px 0;font-size:13px;text-align:right;color:#6b7280">${item.quantity}</td>
      <td style="padding:12px 0;font-size:13px;text-align:right;color:#6b7280">${fmtCurrency(item.unit_price, cur)}</td>
      <td style="padding:12px 0;font-size:13px;text-align:right;font-weight:700">${fmtCurrency(item.amount, cur)}</td>
    </tr>`).join('');

  const logoBlock = doc.sender_logo_url
    ? `<img src="${esc(doc.sender_logo_url)}" alt="logo" style="max-height:56px;max-width:160px;object-fit:contain" crossorigin="anonymous" />`
    : `<div style="font-size:28px;font-weight:900;color:#111827">${esc(doc.sender_name)}</div>`;

  return `
    <div style="padding:40px;font-family:system-ui,sans-serif;min-height:100vh">
      <div style="margin-bottom:32px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          ${logoBlock}
          <div style="font-size:48px;font-weight:900;text-transform:uppercase;color:${color};opacity:0.12">${esc(doc.document_type)}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px">
          <div style="font-size:11px;color:#6b7280">${esc(doc.sender_address)} · ${esc(doc.sender_email)}</div>
          <div style="text-align:right">
            <div style="font-size:22px;font-weight:900;color:${color}">${esc(doc.document_number)}</div>
            <div style="font-size:11px;color:#6b7280">${fmtDate(doc.issue_date)}${doc.due_date ? ` · Due ${fmtDate(doc.due_date)}` : ''}</div>
          </div>
        </div>
      </div>

      ${doc.client_name ? `
        <div style="background:#111827;color:#fff;padding:16px 24px;border-radius:12px;margin-bottom:32px">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px">Bill To</div>
          <div style="font-weight:900;font-size:18px">${esc(doc.client_name)}</div>
          ${doc.client_address ? `<div style="font-size:13px;color:#9ca3af">${esc(doc.client_address)}</div>` : ''}
        </div>` : ''}

      <table style="margin-bottom:24px">
        <thead>
          <tr style="border-bottom:2px solid #111827">
            <th style="text-align:left;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;padding-bottom:12px">Item</th>
            <th style="text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;padding-bottom:12px;width:60px">Qty</th>
            <th style="text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;padding-bottom:12px;width:110px">Price</th>
            <th style="text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;padding-bottom:12px;width:110px">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
        <div style="width:320px">
          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
              <span style="color:#6b7280">Subtotal</span><span style="font-weight:500">${fmtCurrency(doc.subtotal, cur)}</span>
            </div>
            ${doc.discount_amount > 0 ? `
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                <span style="color:#6b7280">Discount</span><span>-${fmtCurrency(doc.discount_amount, cur)}</span>
              </div>` : ''}
            ${doc.tax_amount > 0 ? `
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                <span style="color:#6b7280">${esc(doc.tax_type)} (${doc.tax_rate}%)</span><span>${fmtCurrency(doc.tax_amount, cur)}</span>
              </div>` : ''}
          </div>
          <div style="background:${color};border-radius:16px;padding:24px;color:#fff">
            <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;opacity:0.75;margin-bottom:4px">
              ${doc.document_type === 'receipt' ? 'Amount Paid' : 'Amount Due'}
            </div>
            <div style="font-size:36px;font-weight:900">${fmtCurrency(doc.total, cur)}</div>
            ${doc.due_date && doc.document_type === 'invoice' ? `<div style="font-size:11px;opacity:0.75;margin-top:4px">Due by ${fmtDate(doc.due_date)}</div>` : ''}
          </div>
        </div>
      </div>

      ${doc.notes ? `<p style="font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px">${esc(doc.notes)}</p>` : ''}
    </div>
  `;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function renderDocumentHtml(doc: Document): string {
  const template = doc.template || 'classic';

  let body: string;
  if (template === 'modern') body = modernHtml(doc);
  else if (template === 'minimal') body = minimalHtml(doc);
  else if (template === 'bold') body = boldHtml(doc);
  else body = classicHtml(doc);

  const docType = doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1);
  const title = `${docType} ${doc.document_number} — ${doc.sender_name}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    ${BASE_CSS}
    @page { size: A4; margin: 0; }
    body { width: 210mm; min-height: 297mm; background: #fff; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
}
