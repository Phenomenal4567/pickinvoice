'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Save, Upload, Check, Building2, Palette, SlidersHorizontal, CreditCard, Zap, Eye, Lock } from 'lucide-react';
import { CURRENCIES, NIGERIAN_STATES, LGAS_BY_STATE, PAID_TEMPLATES } from '@/types';
import { DocumentPreview } from '@/components/invoice/DocumentPreview';
import type { BusinessProfile, Document, Template } from '@/types';

// Bug #9: Template preview thumbnails with lock for paid
const TEMPLATE_PREVIEWS: Record<Template, { label: string; description: string; colors: string[] }> = {
  classic: { label: 'Classic', description: 'Professional serif layout', colors: ['#6366f1', '#e5e7eb', '#1f2937'] },
  modern:  { label: 'Modern',  description: 'Gradient header, bold totals', colors: ['#8b5cf6', '#ec4899', '#1f2937'] },
  minimal: { label: 'Minimal', description: 'Teal accent, clean grid', colors: ['#0d9488', '#14b8a6', '#1f2937'] },
  bold:    { label: 'Bold',    description: 'Purple-red gradient, vibrant', colors: ['#7c3aed', '#ef4444', '#1f2937'] },
};

export function SettingsClient({ profile: initial }: { profile: BusinessProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [tab, setTab] = useState<'business' | 'branding' | 'preferences' | 'billing'>('business');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(initial.logo_url || '');
  const [code, setCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateMsg, setActivateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Bug #2: live preview state for branding tab
  const [showBrandPreview, setShowBrandPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isPaidPlan = profile.plan !== 'free' && profile.plan !== 'starter';

  function set(field: string, value: string | number | boolean | null) {
    setProfile(p => ({ ...p, [field]: value }));
  }

  // Bug #8: LGAs for the selected state
  const availableLGAs = profile.state ? (LGAS_BY_STATE[profile.state] || []) : [];

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Logo must be under 2MB'); return; }
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const { logo_url } = await res.json();
    setProfile(p => ({ ...p, logo_url }));
    setLogoUploading(false);
  }

async function handleSave() {
  setSaving(true);

  try {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      throw new Error('Failed to save settings');
    }

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);

    router.refresh();
  } catch (error) {
    console.error(error);
    alert('Failed to save settings');
  } finally {
    setSaving(false);
  }
}

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setActivating(true);
    setActivateMsg(null);
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setActivateMsg({ type: 'success', text: `Plan upgraded to ${data.plan?.toUpperCase()}!` });
        setCode('');
        setTimeout(() => router.refresh(), 1200);
      } else {
        setActivateMsg({ type: 'error', text: data.message || 'Invalid code.' });
      }
    } catch {
      setActivateMsg({ type: 'error', text: 'Something went wrong. Try again.' });
    } finally {
      setActivating(false);
    }
  }

  // Build a sample doc for live preview
  const previewDoc: Document = {
    id: 'preview',
    user_id: '',
    document_type: 'invoice',
    document_number: `${profile.invoice_prefix || 'INV'}-PREVIEW`,
    status: 'draft',
    template: profile.preferred_template || 'classic',
    client_id: null,
    client_name: 'Sample Client',
    client_email: 'client@example.com',
    client_address: '123 Business Ave, Lagos',
    client_phone: '+234 800 000 0000',
    sender_name: profile.business_name || 'Your Business',
    sender_email: profile.email || '',
    sender_address: `${profile.address || ''}${profile.city ? ', ' + profile.city : ''}`,
    sender_phone: profile.phone || '',
    sender_logo_url: logoPreview || '',
    sender_brand_color: profile.brand_color || '#6366f1',
    sender_tax_number: profile.tax_number || '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: null,
    paid_date: null,
    line_items: [
      { id: '1', description: 'Design Services', quantity: 1, unit_price: 50000, tax_rate: 0, amount: 50000 },
      { id: '2', description: 'Development Work', quantity: 2, unit_price: 75000, tax_rate: 0, amount: 150000 },
    ],
    subtotal: 200000,
    tax_rate: 7.5,
    tax_type: 'VAT',
    tax_amount: 15000,
    discount_type: 'percentage',
    discount_value: 0,
    discount_amount: 0,
    total: 215000,
    amount_paid: 0,
    balance_due: 215000,
    currency: profile.default_currency || 'NGN',
    payment_method: 'Bank Transfer',
    notes: 'Thank you for your business!',
    payment_terms: 'Net 30',
    internal_note: '',
    share_token: '',
    viewed_at: null,
    viewed_count: 0,
    pdf_url: '',
    qr_code_url: '',
    created_at: '',
    updated_at: '',
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  const TABS = [
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
    { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
  ] as const;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your business profile and preferences</p>
        </div>
        {tab !== 'billing' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> {saving ? 'Saving...' : 'Save'}</>}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Business Profile tab */}
      {tab === 'business' && (
        <section className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Business Details</h2>
          <div>
            <label className={labelCls}>Business Name</label>
            <input className={inputCls} value={profile.business_name} onChange={e => set('business_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" value={profile.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={profile.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <input className={inputCls} value={profile.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>City</label>
              <input className={inputCls} value={profile.city} onChange={e => set('city', e.target.value)} />
            </div>
            {/* Bug #8: State dropdown */}
            <div>
              <label className={labelCls}>State</label>
              <select
                className={inputCls}
                value={profile.state || ''}
                onChange={e => { set('state', e.target.value); set('lga', ''); }}
              >
                <option value="">— Select State —</option>
                {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* Bug #8: LGA dropdown (only shows when state is selected) */}
          {profile.state && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Local Government Area (LGA)</label>
                <select
                  className={inputCls}
                  value={profile.lga || ''}
                  onChange={e => set('lga', e.target.value)}
                >
                  <option value="">— Select LGA —</option>
                  {availableLGAs.length > 0
                    ? availableLGAs.map(lga => <option key={lga} value={lga}>{lga}</option>)
                    : <option value={profile.lga || ''}>{profile.lga || 'Type your LGA'}</option>
                  }
                </select>
                {availableLGAs.length === 0 && (
                  <input
                    className={`${inputCls} mt-2`}
                    placeholder="Enter LGA manually"
                    value={profile.lga || ''}
                    onChange={e => set('lga', e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input className={inputCls} value={profile.country} onChange={e => set('country', e.target.value)} />
              </div>
            </div>
          )}
          {!profile.state && (
            <div>
              <label className={labelCls}>Country</label>
              <input className={inputCls} value={profile.country} onChange={e => set('country', e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tax Number</label>
              <input className={inputCls} value={profile.tax_number} onChange={e => set('tax_number', e.target.value)} placeholder="e.g. RC-1234567" />
            </div>
            <div>
              <label className={labelCls}>Reg Number</label>
              <input className={inputCls} value={profile.reg_number} onChange={e => set('reg_number', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {/* Branding tab */}
      {tab === 'branding' && (
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Business Logo</h2>
            <div className="flex items-start gap-4">
              <div
                className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden flex-shrink-0"
                onClick={() => fileRef.current?.click()}
              >
                {logoPreview ? (
                  <Image
  src={logoPreview}
  alt="Logo"
  width={80}
  height={80}
  className="h-20 w-20 rounded-lg object-cover"
/>
                ) : (
                  <div className="text-center">
                    <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">Upload</span>
                  </div>
                )}
              </div>
              <div>
                <button onClick={() => fileRef.current?.click()} className="text-sm text-indigo-600 hover:underline block mb-1">
                  {logoUploading ? 'Uploading...' : logoPreview ? 'Change logo' : 'Upload logo'}
                </button>
                <p className="text-xs text-gray-400">PNG, JPG, SVG — max 2MB</p>
                {logoPreview && (
                  <button onClick={() => { setLogoPreview(''); set('logo_url', ''); }} className="text-xs text-red-500 hover:underline mt-1 block">
                    Remove logo
                  </button>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoChange} />
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Brand Accent Colour</h2>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="color"
                value={profile.brand_color}
                onChange={e => set('brand_color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <span className="text-sm font-mono text-gray-700">{profile.brand_color}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#1e293b','#0f766e','#c2410c'].map(c => (
                <button
                  key={c}
                  onClick={() => set('brand_color', c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${profile.brand_color === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </section>

          {/* Bug #1 + #9: Template picker with plan gating and previews */}
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Default Template</h2>
              {/* Bug #2: Preview current edits button */}
              <button
                onClick={() => setShowBrandPreview(!showBrandPreview)}
                className="flex items-center gap-1.5 text-sm text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Eye size={14} />
                {showBrandPreview ? 'Hide Preview' : 'Preview Changes'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(['classic', 'modern', 'minimal', 'bold'] as Template[]).map(t => {
                const isPaid = PAID_TEMPLATES.includes(t);
                const isLocked = isPaid && !isPaidPlan;
                const meta = TEMPLATE_PREVIEWS[t];
                const isSelected = profile.preferred_template === t;
                return (
                  <div key={t} className="relative">
                    <button
                      onClick={() => {
                        if (isLocked) return;
                        set('preferred_template', t);
                      }}
                      className={`w-full rounded-xl border-2 overflow-hidden text-left transition-all ${
                        isSelected ? 'border-indigo-500' : 'border-gray-200 hover:border-gray-300'
                      } ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {/* Color preview strip — Bug #3 visual hint */}
                      <div className="h-10 flex gap-1 p-2">
                        {meta.colors.map((c, i) => (
                          <div key={i} className="flex-1 rounded" style={{ backgroundColor: i === 0 ? profile.brand_color : c }} />
                        ))}
                      </div>
                      <div className={`px-3 py-2 ${isSelected ? 'bg-indigo-50' : 'bg-white'}`}>
                        <div className={`text-sm font-semibold capitalize ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>{t}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{meta.description}</div>
                      </div>
                    </button>
                    {/* Lock badge for paid templates */}
                    {isLocked && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1 shadow-sm">
                        <Lock size={10} />
                      </div>
                    )}
                    {isPaid && !isLocked && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs rounded-full px-1.5 py-0.5 shadow-sm font-bold">PRO</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bug #1: Upgrade prompt when free plan tries paid templates */}
            {!isPaidPlan && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <Lock size={13} className="text-amber-500 flex-shrink-0" />
                <span>
                  <strong>Minimal</strong> and <strong>Bold</strong> templates require Growth or Pro.{' '}
                  <a href="/upgrade" className="underline font-semibold hover:text-amber-900">Upgrade your plan →</a>
                </span>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">This template will be pre-selected when you create new documents.</p>
          </section>

          {/* Bug #2: Live preview of current branding changes */}
          {showBrandPreview && (
            <section className="bg-white rounded-xl border border-indigo-200 overflow-hidden">
              <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-indigo-800">Live Branding Preview</span>
                <span className="text-xs text-indigo-500">Updates as you edit</span>
              </div>
              <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'hidden' }}>
                <DocumentPreview document={previewDoc} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* Preferences tab */}
      {tab === 'preferences' && (
        <section className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Invoice Preferences</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Default Currency</label>
              <select className={inputCls} value={profile.default_currency} onChange={e => set('default_currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.symbol} {c.value} — {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tax Type</label>
              <select className={inputCls} value={profile.default_tax_type} onChange={e => set('default_tax_type', e.target.value)}>
                {['VAT', 'GST', 'Sales Tax', 'None'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Default Tax Rate (%)</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={profile.default_tax_rate}
                onChange={e => set('default_tax_rate', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Invoice Prefix</label>
              <input
                className={inputCls}
                value={profile.invoice_prefix}
                onChange={e => set('invoice_prefix', e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
            <div>
              <label className={labelCls}>Receipt Prefix</label>
              <input
                className={inputCls}
                value={profile.receipt_prefix}
                onChange={e => set('receipt_prefix', e.target.value.toUpperCase())}
                maxLength={10}
              />
            </div>
          </div>
          <div className="mt-4 bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
            <div>Next invoice: <strong className="text-gray-800">{profile.invoice_prefix}-{new Date().getFullYear()}-{String(profile.invoice_counter).padStart(4, '0')}</strong></div>
            <div className="mt-1">Next receipt: <strong className="text-gray-800">{profile.receipt_prefix}-{new Date().getFullYear()}-{String(profile.receipt_counter).padStart(4, '0')}</strong></div>
          </div>
        </section>
      )}

      {/* Plan & Billing tab */}
      {tab === 'billing' && (
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Current Plan</h2>
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <div>
                <div className="font-bold text-indigo-900 capitalize text-lg">{profile.plan} Plan</div>
                {profile.plan_expires_at && profile.plan !== 'free' ? (
                  <div className="text-xs text-indigo-600 mt-0.5">
                    Renews {new Date(profile.plan_expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                ) : (
                  <div className="text-xs text-indigo-500 mt-0.5">Upgrade for more features</div>
                )}
              </div>
              <a
                href="/upgrade"
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                {profile.plan === 'free' ? 'Upgrade' : 'See Plans'}
              </a>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-1">Activate a Plan Code</h2>
            <p className="text-xs text-gray-500 mb-4">
              Already paid? Enter your activation code to upgrade instantly.
            </p>
            <form onSubmit={handleActivate} className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="PICK-XXXX-XXXX"
                maxLength={20}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
              <button
                type="submit"
                disabled={activating || !code.trim()}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <Zap size={14} />
                {activating ? 'Activating...' : 'Activate'}
              </button>
            </form>
            {activateMsg && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${activateMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {activateMsg.text}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Don&apos;t have a code?{' '}
              <a href="/upgrade" className="text-indigo-600 hover:underline">View pricing & payment instructions →</a>
            </p>
          </section>
        </div>
      )}

      {/* Save button (bottom) */}
      {tab !== 'billing' && (
        <div className="flex justify-end mt-6 pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}</>}
          </button>
        </div>
      )}
    </div>
  );
}