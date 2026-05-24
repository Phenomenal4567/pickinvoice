'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Package, X, Check, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Product, Currency } from '@/types';

const EMPTY: Partial<Product> = { name: '', description: '', unit_price: 0, tax_rate: 0, unit: 'unit' };

export function ProductsClient({ products: initial, currency }: { products: Product[]; currency: Currency }) {
  const [products, setProducts] = useState(initial);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  async function handleSave() {
    if (!modal?.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modal),
      });
      const { product } = await res.json();
      if (modal.id) {
        setProducts(ps => ps.map(p => p.id === product.id ? product : p));
      } else {
        setProducts(ps => [...ps, product]);
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product/service?')) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    setProducts(ps => ps.filter(p => p.id !== id));
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">Save reusable products &amp; services</p>
        </div>
        <button
          onClick={() => setModal(EMPTY)}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> New Product
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <Package size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4">No products/services yet</p>
          <p className="text-xs text-gray-400 max-w-xs mb-4">Save your frequently billed services so you can add them to invoices in one tap.</p>
          <button onClick={() => setModal(EMPTY)} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Add first product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="col-span-5">Name</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Tax</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-1" />
          </div>
          {filtered.map(p => (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-5 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <div className="col-span-10 sm:col-span-5">
                <div className="font-medium text-sm text-gray-900">{p.name}</div>
                {p.description && <div className="text-xs text-gray-500 truncate">{p.description}</div>}
              </div>
              <div className="hidden sm:block col-span-2 text-sm text-gray-900 text-right font-medium">
                {formatCurrency(p.unit_price, currency)}
              </div>
              <div className="hidden sm:block col-span-2 text-sm text-gray-500 text-right">{p.tax_rate}%</div>
              <div className="hidden sm:block col-span-2 text-xs text-gray-500">{p.unit}</div>
              <div className="col-span-2 sm:col-span-1 flex justify-end gap-1">
                <button onClick={() => setModal(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{modal.id ? 'Edit Product' : 'New Product/Service'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                <input className={inputCls} value={modal.name || ''} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} placeholder="e.g. Web Design — 1 page" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <input className={inputCls} value={modal.description || ''} onChange={e => setModal(m => ({ ...m, description: e.target.value }))} placeholder="Optional detail" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Unit Price</label>
                  <input className={inputCls} type="number" min="0" step="0.01" value={modal.unit_price || 0} onChange={e => setModal(m => ({ ...m, unit_price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className={labelCls}>Tax %</label>
                  <input className={inputCls} type="number" min="0" max="100" step="0.5" value={modal.tax_rate || 0} onChange={e => setModal(m => ({ ...m, tax_rate: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <input className={inputCls} value={modal.unit || 'unit'} onChange={e => setModal(m => ({ ...m, unit: e.target.value }))} placeholder="unit, hour, day, page..." />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="flex-1 text-sm border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !modal.name}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Check size={15} /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
