import { z } from 'zod';

// ─── LINE ITEM ───────────────────────────────────────────────────
export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().min(0.01).max(999999),
  unit_price: z.number().min(0).max(99999999),
  tax_rate: z.number().min(0).max(100).default(0),
  amount: z.number().min(0),
});

// ─── BUSINESS PROFILE ───────────────────────────────────────────
export const businessProfileSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  tax_number: z.string().max(50).optional(),
  reg_number: z.string().max(50).optional(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color').optional(),
  default_currency: z.enum(['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR']).optional(),
  default_tax_rate: z.number().min(0).max(100).optional(),
  default_tax_type: z.enum(['VAT', 'GST', 'Sales Tax', 'None']).optional(),
  invoice_prefix: z.string().max(10).optional(),
  receipt_prefix: z.string().max(10).optional(),
  preferred_template: z.enum(['classic', 'modern', 'minimal', 'bold']).optional(),
  onboarding_completed: z.boolean().optional(),
});

// ─── CLIENT ─────────────────────────────────────────────────────
export const clientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Client name is required').max(200),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  contact_person: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

// ─── PRODUCT ─────────────────────────────────────────────────────
export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(500).optional(),
  unit_price: z.number().min(0).max(99999999),
  tax_rate: z.number().min(0).max(100).default(0),
  unit: z.string().max(20).optional(),
});

// ─── DOCUMENT ───────────────────────────────────────────────────
export const documentSchema = z.object({
  document_type: z.enum(['invoice', 'receipt']),
  template: z.enum(['classic', 'modern', 'minimal', 'bold']).default('classic'),
  client_id: z.string().uuid().nullable().optional(),
  client_name: z.string().max(200).optional(),
  client_email: z.string().email().or(z.literal('')).optional(),
  client_address: z.string().max(500).optional(),
  client_phone: z.string().max(20).optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().nullable().optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_type: z.enum(['VAT', 'GST', 'Sales Tax', 'None']).default('VAT'),
  discount_type: z.enum(['percentage', 'fixed']).default('percentage'),
  discount_value: z.number().min(0).default(0),
  currency: z.enum(['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR']).default('NGN'),
  payment_method: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  payment_terms: z.string().max(500).optional(),
  internal_note: z.string().max(1000).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'void', 'disputed', 'partially_paid']).optional(),
});

// ─── PAYMENT ─────────────────────────────────────────────────────
export const paymentSchema = z.object({
  document_id: z.string().uuid(),
  amount: z.number().min(0.01),
  payment_method: z.string().max(100).optional(),
  payment_date: z.string().min(1),
  notes: z.string().max(500).optional(),
});

// ─── ACTIVATION CODE ─────────────────────────────────────────────
export const activationCodeSchema = z.object({
  code: z.string().min(8).max(20).regex(/^[A-Z0-9\-]+$/, 'Invalid code format'),
});

// ─── LOGO UPLOAD ─────────────────────────────────────────────────
export const logoUploadSchema = z.object({
  file_size: z.number().max(2 * 1024 * 1024, 'Logo must be under 2MB'),
  file_type: z.enum(['image/png', 'image/jpeg', 'image/svg+xml'], {
    message: 'Logo must be PNG, JPG, or SVG',
  }),
});
