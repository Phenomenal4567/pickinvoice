'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, X, Check } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { Client } from '@/types';

interface Props { clients: Client[]; }

const EMPTY: Partial<Client> = { name: '', email: '', phone: '', address: '', city: '', country: '', contact_person: '' };

export function ClientsClient({ clients: initial }: Props) {
  const [clients, setClients] = useState(initial);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Partial<Client> | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    if (!modal?.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modal),
      });
      const { client } = await res.json();
      if (modal.id) {
        setClients(cs => cs.map(c => c.id === client.id ? client : c));
      } else {
        setClients(cs => [...cs, client]);
      }
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this client?')) return;
    await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
    setClients(cs => cs.filter(c => c.id !== id));
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} saved</p>
        </div>
        <button
          onClick={() => setModal(EMPTY)}
          className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> New Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Search clients by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20 text-center">
          <Users size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4">No clients yet</p>
          <button onClick={() => setModal(EMPTY)} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Add your first client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {getInitials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{c.name}</div>
                    {c.contact_person && <div className="text-xs text-gray-500 truncate">{c.contact_person}</div>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModal(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-500">
                {c.email && <div className="truncate">✉ {c.email}</div>}
                {c.phone && <div>📞 {c.phone}</div>}
                {(c.address || c.city) && <div className="truncate">📍 {[c.address, c.city].filter(Boolean).join(', ')}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{modal.id ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                <input className={inputCls} value={modal.name || ''} onChange={e => setModal(m => ({ ...m, name: e.target.value }))} placeholder="Client or company name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input className={inputCls} type="email" value={modal.email || ''} onChange={e => setModal(m => ({ ...m, email: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} value={modal.phone || ''} onChange={e => setModal(m => ({ ...m, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Contact Person</label>
                <input className={inputCls} value={modal.contact_person || ''} onChange={e => setModal(m => ({ ...m, contact_person: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input className={inputCls} value={modal.address || ''} onChange={e => setModal(m => ({ ...m, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} value={modal.city || ''} onChange={e => setModal(m => ({ ...m, city: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <input className={inputCls} value={modal.country || ''} onChange={e => setModal(m => ({ ...m, country: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(null)} className="flex-1 text-sm border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !modal.name}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Check size={15} /> {saving ? 'Saving...' : 'Save Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
