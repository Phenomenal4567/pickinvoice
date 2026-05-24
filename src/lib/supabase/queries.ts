import { createClient } from '@supabase/supabase-js';
import type { BusinessProfile, Client, Document, Product, Payment, DocumentStatus, DocumentType } from '@/types';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─── BUSINESS PROFILE ───────────────────────────────────────────
export async function getProfile(userId: string): Promise<BusinessProfile | null> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function upsertProfile(userId: string, profile: Partial<BusinessProfile>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('business_profiles')
    .upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── CLIENTS ────────────────────────────────────────────────────
export async function getClients(userId: string, search?: string): Promise<Client[]> {
  const supabase = getAdminClient();
  let query = supabase.from('clients').select('*').eq('user_id', userId).order('name');
  if (search) query = query.ilike('name', `%${search}%`);
  const { data } = await query;
  return data || [];
}

export async function upsertClient(userId: string, client: Partial<Client>) {
  const supabase = getAdminClient();
  const payload = { ...client, user_id: userId };
  if (client.id) {
    const { data, error } = await supabase.from('clients').update(payload).eq('id', client.id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('clients').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClient(userId: string, clientId: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from('clients').delete().eq('id', clientId).eq('user_id', userId);
  if (error) throw error;
}

// ─── PRODUCTS ───────────────────────────────────────────────────
export async function getProducts(userId: string, search?: string): Promise<Product[]> {
  const supabase = getAdminClient();
  let query = supabase.from('products').select('*').eq('user_id', userId).order('name');
  if (search) query = query.ilike('name', `%${search}%`);
  const { data } = await query;
  return data || [];
}

export async function upsertProduct(userId: string, product: Partial<Product>) {
  const supabase = getAdminClient();
  const payload = { ...product, user_id: userId };
  if (product.id) {
    const { data, error } = await supabase.from('products').update(payload).eq('id', product.id).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(userId: string, productId: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from('products').delete().eq('id', productId).eq('user_id', userId);
  if (error) throw error;
}

// ─── DOCUMENTS ──────────────────────────────────────────────────
export async function getDocuments(
  userId: string,
  filters?: {
    type?: DocumentType;
    status?: DocumentStatus;
    search?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Document[]; count: number }> {
  const supabase = getAdminClient();
  let query = supabase.from('documents').select('*', { count: 'exact' }).eq('user_id', userId);

  if (filters?.type) query = query.eq('document_type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.from) query = query.gte('issue_date', filters.from);
  if (filters?.to) query = query.lte('issue_date', filters.to);
  if (filters?.search) {
    query = query.or(
      `client_name.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`
    );
  }

  query = query.order('created_at', { ascending: false });
  if (filters?.limit) query = query.limit(filters.limit);
  if (filters?.offset && filters.offset > 0) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
  }

  const { data, count } = await query;
  return { data: data || [], count: count || 0 };
}

export async function getDocumentById(userId: string, id: string): Promise<Document | null> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  return data;
}

export async function getDocumentByShareToken(token: string): Promise<Document | null> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('share_token', token)
    .neq('status', 'void')
    .single();

  if (data) {
    // Increment view count
    await supabase.from('documents').update({
      viewed_at: new Date().toISOString(),
      viewed_count: (data.viewed_count || 0) + 1,
    }).eq('id', data.id);
  }

  return data;
}

export async function createDocument(userId: string, doc: Partial<Document>): Promise<Document> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .insert({ ...doc, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDocument(userId: string, id: string, updates: Partial<Document>): Promise<Document> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(userId: string, id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function getNextDocumentNumber(userId: string, type: DocumentType, profile: BusinessProfile): Promise<string> {
  const prefix = type === 'invoice' ? profile.invoice_prefix : profile.receipt_prefix;
  const counter = type === 'invoice' ? profile.invoice_counter : profile.receipt_counter;
  const padded = String(counter).padStart(4, '0');
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${padded}`;
}

export async function incrementDocumentCounter(userId: string, type: DocumentType) {
  const supabase = getAdminClient();
  const field = type === 'invoice' ? 'invoice_counter' : 'receipt_counter';
  const { data: profile } = await supabase
    .from('business_profiles')
    .select(field)
    .eq('user_id', userId)
    .single();

  if (profile) {
    await supabase
      .from('business_profiles')
      .update({ [field]: (profile as Record<string, unknown>)[field] as number + 1 })
      .eq('user_id', userId);
  }
}

// ─── PAYMENTS ───────────────────────────────────────────────────
export async function getPayments(documentId: string): Promise<Payment[]> {
  const supabase = getAdminClient();
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('document_id', documentId)
    .order('payment_date', { ascending: false });
  return data || [];
}

export async function addPayment(userId: string, payment: Partial<Payment>): Promise<Payment> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('payments')
    .insert({ ...payment, user_id: userId })
    .select()
    .single();
  if (error) throw error;

  // Update document amount_paid and status
  const { data: doc } = await supabase
    .from('documents')
    .select('total, amount_paid')
    .eq('id', payment.document_id)
    .eq('user_id', userId)
    .single();

  if (doc) {
    const newPaid = (doc.amount_paid || 0) + (payment.amount || 0);
    const balance = doc.total - newPaid;
    const status = balance <= 0 ? 'paid' : 'partially_paid';
    await supabase.from('documents').update({
      amount_paid: newPaid,
      balance_due: Math.max(0, balance),
      status,
    }).eq('id', payment.document_id).eq('user_id', userId);
  }

  return data;
}

// ─── DASHBOARD STATS ────────────────────────────────────────────
export async function getDashboardStats(userId: string) {
  const supabase = getAdminClient();

  const [allDocs, dueDocs] = await Promise.all([
    supabase
      .from('documents')
      .select('total, status, client_name, issue_date, balance_due')
      .eq('user_id', userId)
      .neq('status', 'void')
      .neq('status', 'draft'),
    supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['sent', 'overdue'])
      .gte('due_date', new Date().toISOString().split('T')[0])
      .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('due_date'),
  ]);

  const docs = allDocs.data || [];
  const total_invoiced = docs.reduce((s, d) => s + (d.total || 0), 0);
  const total_paid = docs.filter(d => d.status === 'paid').reduce((s, d) => s + (d.total || 0), 0);
  const total_outstanding = docs.filter(d => ['sent', 'partially_paid'].includes(d.status)).reduce((s, d) => s + (d.balance_due || d.total || 0), 0);
  const total_overdue = docs.filter(d => d.status === 'overdue').reduce((s, d) => s + (d.balance_due || d.total || 0), 0);

  const thisMonth = new Date().toISOString().substring(0, 7);
  const invoices_this_month = docs.filter(d => d.issue_date?.startsWith(thisMonth)).length;

  // Monthly revenue (last 6 months)
  const monthly: Record<string, number> = {};
  docs.forEach(d => {
    if (d.status === 'paid' && d.issue_date) {
      const month = d.issue_date.substring(0, 7);
      monthly[month] = (monthly[month] || 0) + (d.total || 0);
    }
  });

  const monthly_revenue = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  // Top clients
  const clientTotals: Record<string, number> = {};
  docs.forEach(d => {
    if (d.client_name) {
      clientTotals[d.client_name] = (clientTotals[d.client_name] || 0) + (d.total || 0);
    }
  });
  const top_clients = Object.entries(clientTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, total]) => ({ name, total }));

  return {
    total_invoiced,
    total_paid,
    total_outstanding,
    total_overdue,
    invoices_this_month,
    documents_due_this_week: dueDocs.data || [],
    top_clients,
    monthly_revenue,
  };
}

// ─── ACTIVATION CODES ───────────────────────────────────────────
export async function validateAndActivateCode(userId: string, code: string) {
  const supabase = getAdminClient();
  const { data: activation, error } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .is('used_at', null)
    .single();

  if (error || !activation) return { success: false, message: 'Invalid or already used activation code.' };

  // Mark code as used
  await supabase.from('activation_codes').update({
    used_at: new Date().toISOString(),
    user_id: userId,
  }).eq('id', activation.id);

  // Upgrade user plan
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await supabase.from('business_profiles').update({
    plan: activation.plan,
    plan_activated_at: new Date().toISOString(),
    plan_expires_at: expiresAt.toISOString(),
  }).eq('user_id', userId);

  return { success: true, plan: activation.plan };
}
