'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { CURRENCIES } from '@/types';

const STEPS = ['Business Details', 'Logo & Branding', 'Preferences'];

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  // FIX: added error state so failures surface in the UI instead of silently failing
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Nigeria',
    tax_number: '',
    brand_color: '#6366f1',
    default_currency: 'NGN',
    default_tax_rate: 7.5,
    default_tax_type: 'VAT',
    invoice_prefix: 'INV',
    preferred_template: 'classic',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);

  function set(field: string, value: string | number | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2MB'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  // FIX: was silently ignoring the 400 response and calling router.push('/dashboard') anyway.
  // The API returned 400 because the Zod schema rejected empty-string email values.
  // Now we check res.ok and surface the error before ever attempting the redirect.
  async function handleFinish() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, onboarding_completed: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Zod flatten() puts field errors in fieldErrors and top-level in formErrors
        const fieldErrors = body?.error?.fieldErrors
          ? Object.entries(body.error.fieldErrors)
              .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
              .join(' | ')
          : null;
        const msg = fieldErrors || body?.error || `Server error (${res.status})`;
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        return;
      }

      // Upload logo if provided — non-fatal if it fails
      if (logoFile) {
        const fd = new FormData();
        fd.append('file', logoFile);
        await fetch('/api/upload', { method: 'POST', body: fd });
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Network error — please check your connection and try again.');
      console.error('[onboarding] handleFinish error:', err);
    } finally {
      setLoading(false);
    }
  }

  // FIX: was not awaiting the fetch result and not handling errors,
  // so if the POST failed the redirect still happened and dashboard would
  // find no completed profile and redirect back — causing a loop.
  async function handleSkip() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: form.business_name || 'My Business', onboarding_completed: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error || `Server error (${res.status})`;
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('Network error — please check your connection and try again.');
      console.error('[onboarding] handleSkip error:', err);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up PickInvoice</h1>
          <p className="text-sm text-gray-500 mt-1">Takes about 2 minutes. Skip anything you can fill in later.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <div className={`text-xs hidden sm:block ${i === step ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>{s}</div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* FIX: error banner — shows the API error so user knows what went wrong */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Business Details</h2>
              <div>
                <label className={labelCls}>Business / Trading Name <span className="text-red-500">*</span></label>
                <input className={inputCls} value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="e.g. Adewale Consultants" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="hello@business.com" />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+234 800 0000 000" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="12 Lagos Street, Victoria Island" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lagos" />
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <input className={inputCls} value={form.country} onChange={e => set('country', e.target.value)} placeholder="Nigeria" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tax / Registration Number</label>
                <input className={inputCls} value={form.tax_number} onChange={e => set('tax_number', e.target.value)} placeholder="e.g. RC-1234567" />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Logo & Branding</h2>

              {/* Logo upload */}
              <div>
                <label className={labelCls}>Business Logo</label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  onClick={() => fileRef.current?.click()}
                >
                  {logoPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <Image src={logoPreview} alt="Logo preview" width={200} height={80} className="max-h-20 max-w-full object-contain rounded" unoptimized />
                      <span className="text-xs text-indigo-600">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={28} className="text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload logo</p>
                      <p className="text-xs text-gray-400">PNG, JPG, SVG — max 2MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoChange} />
              </div>

              {/* Brand color */}
              <div>
                <label className={labelCls}>Brand Accent Colour</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brand_color}
                    onChange={e => set('brand_color', e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer p-1"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{form.brand_color}</div>
                    <div className="text-xs text-gray-500">Used in document headings &amp; table headers</div>
                  </div>
                </div>
                {/* Preset colors */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#1e293b'].map(c => (
                    <button
                      key={c}
                      onClick={() => set('brand_color', c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.brand_color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Template */}
              <div>
                <label className={labelCls}>Default Template</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: 'classic', label: 'Classic', desc: 'Formal & structured' },
                    { id: 'modern', label: 'Modern', desc: 'Bold colour header' },
                    { id: 'minimal', label: 'Minimal', desc: 'Clean & simple' },
                    { id: 'bold', label: 'Bold', desc: 'Large total callout' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => set('preferred_template', t.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.preferred_template === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">{t.label}</div>
                      <div className="text-xs text-gray-500">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Preferences</h2>
              <div>
                <label className={labelCls}>Default Currency</label>
                <select className={inputCls} value={form.default_currency} onChange={e => set('default_currency', e.target.value)}>
                  {CURRENCIES.map(c => (
                    <option key={c.value} value={c.value}>{c.symbol} {c.label} ({c.value})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tax Type</label>
                  <select className={inputCls} value={form.default_tax_type} onChange={e => set('default_tax_type', e.target.value)}>
                    {['VAT', 'GST', 'Sales Tax', 'None'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tax Rate (%)</label>
                  <input
                    className={inputCls}
                    type="number"
                    min="0" max="100" step="0.5"
                    value={form.default_tax_rate}
                    onChange={e => set('default_tax_rate', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Invoice Number Prefix</label>
                <input className={inputCls} value={form.invoice_prefix} onChange={e => set('invoice_prefix', e.target.value.toUpperCase())} placeholder="INV" maxLength={10} />
                <p className="text-xs text-gray-400 mt-1">Example: <strong>{form.invoice_prefix}-{new Date().getFullYear()}-0001</strong></p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Your setup summary</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Business: <strong>{form.business_name || '—'}</strong></div>
                  <div>Currency: <strong>{form.default_currency}</strong></div>
                  <div>Tax: <strong>{form.default_tax_rate}% {form.default_tax_type}</strong></div>
                  <div>Template: <strong className="capitalize">{form.preferred_template}</strong></div>
                  {logoPreview && <div>Logo: <strong>✓ Uploaded</strong></div>}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              <button onClick={handleSkip} disabled={loading} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
                Skip setup
              </button>
            </div>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => { setError(''); setStep(s => s + 1); }}
                disabled={step === 0 && !form.business_name}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading || !form.business_name}
                className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : <><Check size={15} /> Finish Setup</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}