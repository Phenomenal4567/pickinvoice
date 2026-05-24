-- PickInvoice v2.0 — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- BUSINESS PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE, -- Clerk user ID
  business_name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  country TEXT DEFAULT 'Nigeria',
  tax_number TEXT DEFAULT '',
  reg_number TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  brand_color TEXT DEFAULT '#6366f1',
  default_currency TEXT DEFAULT 'NGN',
  default_tax_rate NUMERIC(5,2) DEFAULT 7.5,
  default_tax_type TEXT DEFAULT 'VAT',
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_counter INTEGER DEFAULT 1,
  receipt_prefix TEXT DEFAULT 'RCP',
  receipt_counter INTEGER DEFAULT 1,
  preferred_template TEXT DEFAULT 'classic',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'pro')),
  plan_activated_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(user_id, name);

-- ─────────────────────────────────────────────
-- PRODUCTS / ITEM LIBRARY
-- ─────────────────────────────────────────────
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  unit TEXT DEFAULT 'unit',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_user_id ON products(user_id);

-- ─────────────────────────────────────────────
-- DOCUMENTS (Invoices + Receipts)
-- ─────────────────────────────────────────────
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'receipt')),
  document_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void', 'disputed', 'partially_paid')),
  template TEXT NOT NULL DEFAULT 'classic' CHECK (template IN ('classic', 'modern', 'minimal', 'bold')),

  -- Client info (snapshot at time of creation)
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',

  -- Sender info (snapshot)
  sender_name TEXT DEFAULT '',
  sender_email TEXT DEFAULT '',
  sender_address TEXT DEFAULT '',
  sender_phone TEXT DEFAULT '',
  sender_logo_url TEXT DEFAULT '',
  sender_brand_color TEXT DEFAULT '#6366f1',
  sender_tax_number TEXT DEFAULT '',

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,

  -- Line items stored as JSON
  line_items JSONB NOT NULL DEFAULT '[]',

  -- Financial
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_type TEXT DEFAULT 'VAT',
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'NGN',

  -- Receipt specific
  payment_method TEXT DEFAULT '',

  -- Notes
  notes TEXT DEFAULT '',
  payment_terms TEXT DEFAULT '',
  internal_note TEXT DEFAULT '',

  -- Sharing & tracking
  share_token TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
  viewed_at TIMESTAMPTZ,
  viewed_count INTEGER DEFAULT 0,
  pdf_url TEXT DEFAULT '',

  -- QR
  qr_code_url TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(user_id, status);
CREATE INDEX idx_documents_type ON documents(user_id, document_type);
CREATE INDEX idx_documents_client ON documents(user_id, client_id);
CREATE INDEX idx_documents_date ON documents(user_id, issue_date DESC);
CREATE INDEX idx_documents_share_token ON documents(share_token);

-- ─────────────────────────────────────────────
-- PAYMENTS (partial payment recording)
-- ─────────────────────────────────────────────
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT DEFAULT '',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_document_id ON payments(document_id);

-- ─────────────────────────────────────────────
-- ACTIVATION CODES
-- ─────────────────────────────────────────────
CREATE TABLE activation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'pro')),
  user_id TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Business profiles: users manage only their own
CREATE POLICY "Users manage own profile" ON business_profiles
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Clients
CREATE POLICY "Users manage own clients" ON clients
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Products
CREATE POLICY "Users manage own products" ON products
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Documents: owners can do everything; share_token allows public read
CREATE POLICY "Users manage own documents" ON documents
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Public can view via share token" ON documents
  FOR SELECT
  USING (share_token IS NOT NULL);

-- Payments
CREATE POLICY "Users manage own payments" ON payments
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- STORAGE BUCKETS (run via Supabase dashboard or API)
-- ─────────────────────────────────────────────
-- Create these buckets in Supabase Storage:
-- 1. "logos"       — public bucket, max 2MB, image/png,image/jpeg,image/svg+xml
-- 2. "pdfs"        — private bucket, application/pdf
-- 3. "exports"     — private bucket, image/png,image/jpeg
