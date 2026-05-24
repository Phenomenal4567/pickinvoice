// PickInvoice — Global Types

export type Plan = 'free' | 'starter' | 'growth' | 'pro';
export type DocumentType = 'invoice' | 'receipt';
export type DocumentStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void' | 'disputed' | 'partially_paid';
export type Template = 'classic' | 'modern' | 'minimal' | 'bold';
export type TaxType = 'VAT' | 'GST' | 'Sales Tax' | 'None';
export type DiscountType = 'percentage' | 'fixed';
export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR' | 'GHS' | 'KES' | 'ZAR';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  lga: string;
  country: string;
  tax_number: string;
  reg_number: string;
  logo_url: string;
  brand_color: string;
  default_currency: Currency;
  default_tax_rate: number;
  default_tax_type: TaxType;
  invoice_prefix: string;
  invoice_counter: number;
  receipt_prefix: string;
  receipt_counter: number;
  preferred_template: Template;
  onboarding_completed: boolean;
  plan: Plan;
  plan_activated_at: string | null;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  contact_person: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  unit_price: number;
  tax_rate: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  document_type: DocumentType;
  document_number: string;
  status: DocumentStatus;
  template: Template;
  client_id: string | null;
  client_name: string;
  client_email: string;
  client_address: string;
  client_phone: string;
  sender_name: string;
  sender_email: string;
  sender_address: string;
  sender_phone: string;
  sender_logo_url: string;
  sender_brand_color: string;
  sender_tax_number: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  line_items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax_type: TaxType;
  tax_amount: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  currency: Currency;
  payment_method: string;
  notes: string;
  payment_terms: string;
  internal_note: string;
  share_token: string;
  viewed_at: string | null;
  viewed_count: number;
  pdf_url: string;
  qr_code_url: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  document_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string;
  created_at: string;
}

export interface DashboardStats {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  invoices_this_month: number;
  documents_due_this_week: Document[];
  recent_documents: Document[];
  top_clients: { name: string; total: number }[];
  monthly_revenue: { month: string; amount: number }[];
}

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'NGN', label: 'Nigerian Naira', symbol: '₦' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GHS', label: 'Ghanaian Cedi', symbol: 'GH₵' },
  { value: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
  { value: 'ZAR', label: 'South African Rand', symbol: 'R' },
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: 'GH₵', KES: 'KSh', ZAR: 'R',
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-gray-200 text-gray-500',
  disputed: 'bg-orange-100 text-orange-700',
  partially_paid: 'bg-yellow-100 text-yellow-700',
};

// Bug fix #1: Free plan only gets classic + modern (2 templates). 
// growth/pro get all 4. starter gets 2 as well.
export const PLAN_LIMITS: Record<Plan, { invoices: number; clients: number; templates: number; history_days: number }> = {
  free:    { invoices: 20,         clients: 50,        templates: 2, history_days: 30  },
  starter: { invoices: 50,         clients: 200,       templates: 2, history_days: 90  },
  growth:  { invoices: Infinity,   clients: Infinity,  templates: 4, history_days: Infinity },
  pro:     { invoices: Infinity,   clients: Infinity,  templates: 4, history_days: Infinity },
};

// Templates available per plan
export const PAID_TEMPLATES: Template[] = ['minimal', 'bold'];
export const FREE_TEMPLATES: Template[] = ['classic', 'modern'];

// Nigerian States for business details
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

// LGAs by state (abbreviated for major states)
export const LGAS_BY_STATE: Record<string, string[]> = {
  'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
  'FCT - Abuja': ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'],
  'Rivers': ['Abua-Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emouha', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio-Akpor', 'Ogba-Egbema-Ndoni', 'Ogu-Bolo', 'Okrika', 'Omuma', 'Opobo-Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
  'Kano': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
  'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'],
  'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi-Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Sagamu', 'Yewa North', 'Yewa South'],
  'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
  'Edo': ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
};
