# PickInvoice v2.0 — Next.js + Supabase

**WhatsApp-native invoice & receipt generator for Nigerian/African businesses.**

---

## ✅ FILES ALREADY BUILT (Steps 1, 2, 3 & 4 complete)

### Config & Infrastructure
- `.env.local.example` — all environment variables
- `supabase-schema.sql` — full DB schema (run in Supabase SQL editor)
- `src/middleware.ts` — Clerk auth middleware, route protection
- `src/types/index.ts` — all TypeScript types + constants

### Library / Utilities
- `src/lib/supabase/client.ts` — Supabase browser + server clients
- `src/lib/supabase/queries.ts` — all DB queries (profiles, clients, documents, payments, stats)
- `src/lib/validators/index.ts` — Zod schemas for every API input
- `src/lib/rate-limit.ts` — Upstash rate limiting (auth/ai/general tiers)
- `src/lib/utils.ts` — formatting, calculations, helpers

### API Routes (all secured: Clerk auth + Zod validation + rate limiting)
- `src/app/api/profile/route.ts` — GET/POST business profile
- `src/app/api/clients/route.ts` — GET/POST/DELETE clients
- `src/app/api/products/route.ts` — GET/POST/DELETE product library
- `src/app/api/documents/route.ts` — GET/POST documents
- `src/app/api/documents/[id]/route.ts` — GET/PATCH/DELETE single document
- `src/app/api/payments/route.ts` — GET/POST partial payments
- `src/app/api/upload/route.ts` — logo upload → Supabase Storage
- `src/app/api/activate/route.ts` — plan activation codes
- `src/app/api/stats/route.ts` — dashboard analytics

### Pages
- `src/app/page.tsx` — landing page
- `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in
- `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up
- `src/app/onboarding/page.tsx` — onboarding (server wrapper)
- `src/app/dashboard/page.tsx` — dashboard (server wrapper)
- `src/app/invoice/new/page.tsx` — new invoice/receipt
- `src/app/invoice/edit/[id]/page.tsx` — edit existing document

### Components
- `src/components/layout/AppLayout.tsx` — sidebar + mobile nav
- `src/components/onboarding/OnboardingClient.tsx` — 3-step onboarding flow
- `src/components/dashboard/DashboardClient.tsx` — stats cards, recent docs, charts
- `src/components/invoice/InvoiceEditor.tsx` — full editor (line items, totals, export)
- `src/components/invoice/DocumentPreview.tsx` — all 4 templates (Classic, Modern, Minimal, Bold)

---

## ✅ ALL FILES COMPLETE

All pages, API routes, components, and configuration have been built across Steps 1–4 and bug-fixed. The project is ready for setup and deployment.

### Full File Inventory

#### Pages
- `src/app/page.tsx` — Landing page ✅
- `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in ✅
- `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up ✅
- `src/app/onboarding/page.tsx` + `OnboardingClient.tsx` — 3-step onboarding ✅
- `src/app/dashboard/page.tsx` + `DashboardClient.tsx` — Stats, recent docs, revenue chart ✅
- `src/app/invoice/new/page.tsx` — New invoice/receipt ✅
- `src/app/invoice/edit/[id]/page.tsx` — Edit existing document ✅
- `src/app/invoice/view/[token]/page.tsx` — Public share page (no auth) ✅
- `src/app/history/page.tsx` + `HistoryClient.tsx` — Searchable, filterable document history ✅
- `src/app/clients/page.tsx` + `ClientsClient.tsx` — Client management ✅
- `src/app/products/page.tsx` + `ProductsClient.tsx` — Product/service library ✅
- `src/app/settings/page.tsx` + `SettingsClient.tsx` — Business profile, branding, billing ✅
- `src/app/upgrade/page.tsx` + `UpgradeClient.tsx` — Pricing & plan activation ✅

#### API Routes
- `src/app/api/profile/route.ts` — GET/POST business profile ✅
- `src/app/api/clients/route.ts` — GET/POST/DELETE clients ✅
- `src/app/api/products/route.ts` — GET/POST/DELETE products ✅
- `src/app/api/documents/route.ts` — GET/POST documents ✅
- `src/app/api/documents/[id]/route.ts` — GET/PATCH/DELETE single document ✅
- `src/app/api/documents/[id]/pdf/route.ts` — PDF generation via Puppeteer ✅
- `src/app/api/documents/[id]/duplicate/route.ts` — Clone document ✅
- `src/app/api/payments/route.ts` — GET/POST partial payments ✅
- `src/app/api/upload/route.ts` — Logo upload to Supabase Storage ✅
- `src/app/api/activate/route.ts` — Plan activation codes ✅
- `src/app/api/stats/route.ts` — Dashboard analytics ✅

#### UI Components
- `src/components/layout/AppLayout.tsx` — Sidebar + mobile nav ✅
- `src/components/ui/toaster.tsx` — Toast notification system ✅
- `src/components/ui/modal.tsx` — Accessible modal ✅
- `src/components/invoice/InvoiceEditor.tsx` — Full invoice/receipt editor ✅
- `src/components/invoice/DocumentPreview.tsx` — All 4 templates ✅
- `src/components/invoice/PaymentModal.tsx` — Record partial payments ✅
- `src/components/invoice/StatusActions.tsx` — Status change dropdown ✅

#### Infrastructure
- `src/lib/supabase/queries.ts` — All DB queries ✅
- `src/lib/validators/index.ts` — Zod schemas ✅
- `src/lib/rate-limit.ts` — Upstash rate limiting ✅
- `src/lib/utils.ts` — Formatting & calculation helpers ✅
- `src/lib/document-html.ts` — HTML renderer for PDF generation ✅
- `src/middleware.ts` — Clerk auth middleware ✅
- `src/types/index.ts` — All TypeScript types ✅

---

## 🚀 SETUP INSTRUCTIONS

### Step 1 — Clone & Install
```bash
npm install
cp .env.local.example .env.local
```

### Step 2 — Supabase
1. Create project at supabase.com
2. Run `supabase-schema.sql` in SQL Editor
3. Create Storage buckets: `logos` (public), `pdfs` (private), `exports` (private)
4. Copy URL + anon key + service role key → `.env.local`

### Step 3 — Clerk
1. Create app at clerk.com (enable Email + Google OAuth)
2. Set redirect URLs: sign-in → `/dashboard`, sign-up → `/onboarding`
3. Copy publishable key + secret key → `.env.local`

### Step 4 — Upstash (Rate Limiting)
1. Create Redis database at upstash.com
2. Copy REST URL + token → `.env.local`
3. *(Optional in dev — rate limiting silently skips if env vars missing)*

### Step 5 — Run
```bash
npm run dev
# Open http://localhost:3000
```

### Step 6 — Deploy (Vercel)
```bash
vercel deploy
# Set all .env.local vars in Vercel dashboard → Settings → Environment Variables
```

---

## 🗄️ DATABASE TABLES SUMMARY

| Table | Purpose |
|-------|---------|
| `business_profiles` | One row per user — business details, plan, branding |
| `clients` | Saved client records per user |
| `products` | Reusable line item library per user |
| `documents` | All invoices + receipts (full field snapshot) |
| `payments` | Partial payment records per document |
| `activation_codes` | Plan upgrade codes (generated manually or via payment webhook) |

---

## 🔐 SECURITY IMPLEMENTED

- ✅ Clerk auth on all routes via middleware
- ✅ Zod input validation on every API handler
- ✅ Supabase service role used server-side only (never exposed to browser)
- ✅ Upstash rate limiting: auth=5/min, general=60/min
- ✅ File upload validation (type + size) before Supabase Storage
- ✅ Row-level security on all Supabase tables
- ✅ User isolation — all queries scoped to `user_id`
- ✅ Share tokens use UUID — unguessable public links

---

## ✅ STEP 3 — Completed

### New UI Components

#### `src/components/ui/toaster.tsx`
- Context-based toast notification system (no external dependency)
- `<Toaster>` wraps the app as a provider — children access toasts via `useToast()` hook
- Three variants: `success` (green), `error` (red), `info` (indigo), each with a matching left-border and icon
- Toasts animate in/out, auto-dismiss after 4 s (configurable), support title + optional description
- Dismissible via × button; all `role="alert"` for screen-reader accessibility

#### `src/components/ui/modal.tsx`
- Reusable accessible `<Modal>` component (no Radix dependency required — built from scratch)
- Props: `open`, `onClose`, `title`, `description`, `maxWidth`, `children`, `footer`
- Keyboard: `Escape` to close, full Tab focus-trap, body scroll-lock while open
- Closes on backdrop click; smooth `scale + fade` entrance animation

#### `src/components/invoice/PaymentModal.tsx`
- Records partial or full payments on an invoice
- Loads and displays full payment history (fetches `GET /api/payments?document_id=`) whenever opened
- Shows a 3-stat summary bar: Total / Paid / Balance remaining
- Form fields: amount (with currency prefix), date, payment method (select from PAYMENT_METHODS), notes
- Posts to `POST /api/payments`; updates history list optimistically; toasts on success/error
- Calls `onPaymentAdded()` so parent can `router.refresh()` to re-sync server state

#### `src/components/invoice/StatusActions.tsx`
- Inline status toolbar rendered inside `InvoiceEditor` (edit mode only)
- Shows current status as a coloured pill (uses `STATUS_COLORS` from types)
- **Change Status dropdown**: context-aware — only shows valid transitions from the current status (e.g. can't re-send a paid invoice, can't void an already-voided document)
- **Record Payment button**: visible only for invoice documents not in `void` state; opens `PaymentModal`
- Calls `PATCH /api/documents/:id` with `{ status }` on change; toasts result
- Both actions call the parent's `onStatusChange` / `onPaymentAdded` callbacks to trigger a `router.refresh()`

### Updated Files

#### `src/app/layout.tsx`
- `<Toaster>` now wraps `{children}` as a context provider (changed from self-closing `<Toaster />`)

#### `src/components/invoice/InvoiceEditor.tsx`
- Imported `StatusActions` component
- Added `DocumentStatus` to the type imports
- In `edit` mode, renders a **Status** card above the Template picker containing `<StatusActions />`

#### `tailwind.config.ts`
- Extended `fontFamily` with `sans: ['Sora', 'system-ui', 'sans-serif']` and `mono: ['DM Mono', 'monospace']`
- Fonts already loaded via Google Fonts in `layout.tsx`

### Step-Completion Checklist
| Item | Status |
|------|--------|
| `src/components/ui/toaster.tsx` | ✅ Created |
| `src/components/ui/modal.tsx` | ✅ Created |
| `src/components/invoice/PaymentModal.tsx` | ✅ Created |
| `src/components/invoice/StatusActions.tsx` | ✅ Created |
| `src/app/layout.tsx` — Toaster as provider | ✅ Updated |
| `src/components/invoice/InvoiceEditor.tsx` — StatusActions integration | ✅ Updated |
| `tailwind.config.ts` — custom fonts | ✅ Updated |

---

### New API Routes

#### `src/app/api/documents/[id]/pdf/route.ts`
- `GET /api/documents/:id/pdf[?token=<share_token>]`
- Renders document HTML via a pure-TS renderer (`src/lib/document-html.ts`) that mirrors all 4 templates (Classic, Modern, Minimal, Bold)
- Launches Puppeteer with `@sparticuz/chromium` on Vercel; falls back to local Chrome in dev via `PUPPETEER_EXECUTABLE_PATH` env var
- Returns `application/pdf` with `Content-Disposition: attachment`
- Accessible without auth when a valid `?token=` is passed (used from public share page)

#### `src/app/api/documents/[id]/duplicate/route.ts`
- `POST /api/documents/:id/duplicate`
- Authenticated (Clerk session required)
- Clones source doc, assigns a fresh document number, resets `status → draft`, clears payment fields, `viewed_count`, `pdf_url`, `qr_code_url`
- Increments the user's document counter so the next number is unique
- Returns `{ document }` with HTTP 201

### New Files
- `src/lib/document-html.ts` — Self-contained HTML renderer for all 4 invoice templates. Used by the PDF route to produce Puppeteer-ready HTML without any React/Next.js overhead.

### Updated Files
- `next.config.mjs` — Added `images.remotePatterns` for Supabase storage, `serverComponentsExternalPackages` for puppeteer-core
- `package.json` — Added `@sparticuz/chromium ^123.0.1` and `puppeteer-core ^22.15.0`
- `src/app/invoice/view/[token]/page.tsx` — Download button now passes `?token=` to PDF route
- `src/components/dashboard/HistoryClient.tsx` — Duplicate action now calls `/api/documents/:id/duplicate` instead of inline POST

---

## ✅ STEP 4 — Completed

### Configuration Files Updated

#### `next.config.mjs`
- Added `images.remotePatterns` for Supabase Storage CDN domains (`*.supabase.co` and `*.supabase.in`)
- This allows Next.js `<Image>` to render logos and other assets served from Supabase Storage without throwing a hostname-not-configured error

#### `tailwind.config.ts`
- Extended `theme.extend.fontFamily` with:
  - `sans: ['Sora', 'system-ui', 'sans-serif']` — primary UI font (already loaded via Google Fonts in `layout.tsx`)
  - `mono: ['DM Mono', 'monospace']` — monospace font for invoice numbers, codes, and numeric fields

### Step-Completion Checklist
| Item | Status |
|------|--------|
| `next.config.mjs` — Supabase image domains | ✅ Updated |
| `tailwind.config.ts` — Sora + DM Mono fonts | ✅ Updated |

---

## 🐛 BUG FIXES — Applied After Step 4

The following bugs were identified and fixed across the codebase:

### 1. `src/components/invoice/InvoiceEditor.tsx` — SSR crash on `window.location.origin`
`window.location.origin` was called inside `useState()` initializer, which runs during server-side rendering where `window` is undefined. Fixed with a `typeof window !== 'undefined'` guard.

### 2. `src/components/invoice/InvoiceEditor.tsx` — `document.createElement` shadowed by prop name
`handleExportImage` called `document.createElement('a')` but `document` was the name of a destructured React prop, causing a runtime type error. Fixed by using `window.document.createElement`.

### 3. `src/app/api/documents/[id]/route.ts` — PATCH wipes `balance_due` on saves with partial payments
When a document was saved after recording partial payments, `balance_due` was reset to `total` (ignoring `amount_paid`). Fixed by fetching the existing document and subtracting `amount_paid` before setting `balance_due`.

### 4. `src/lib/supabase/queries.ts` — `getDocuments` double-applies pagination
When `offset` was `0`, both `limit()` and `range()` were applied, causing Supabase to use the more restrictive constraint. Fixed by only calling `range()` when `offset > 0`.

### 5. `src/lib/supabase/queries.ts` — `getDashboardStats` missing `invoices_this_month`
The `DashboardStats` type includes `invoices_this_month` but `getDashboardStats` never computed or returned it. Fixed by counting documents issued in the current calendar month.

### 6. `src/lib/supabase/queries.ts` — `addPayment` document ownership not verified
The document fetch and update inside `addPayment` queried by `document_id` only, without scoping to `user_id`. A crafted request could modify another user's document balance. Fixed by adding `.eq('user_id', userId)` to both queries.

### 7. `src/components/dashboard/HistoryClient.tsx` — Action menu never closes on outside click
The kebab-menu dropdown had no outside-click handler, so it could only be dismissed by clicking the toggle button again. Fixed by adding a `useEffect` with a `mousedown` listener and a `menuContainerRef`.

### 8. `src/components/dashboard/HistoryClient.tsx` — Wrong icon for "Open share link"
The "Open share link" menu item used the `Filter` icon. Fixed to use `ExternalLink`.

### 9. `src/components/invoice/StatusActions.tsx` — Tailwind v3 incompatible animation classes
`animate-in`, `fade-in`, `slide-in-from-top-1`, `duration-150` are Tailwind v4 / `tailwindcss-animate` plugin classes, not available in the v3 setup used here. Fixed by replacing with an inline `@keyframes` CSS animation.

### 10. `src/components/invoice/PaymentModal.tsx` — Balance summary shows ₦0 on first open
The modal computed `totalPaid` from the local `payments` array, which is empty until the fetch completes. On first open the summary briefly showed the wrong values. Fixed by falling back to `doc.amount_paid` until the fetch resolves.

### 11. `src/components/dashboard/SettingsClient.tsx` — Sends unrecognized fields to profile API
`handleSave` sent the entire profile object including DB-managed fields (`id`, `user_id`, `plan`, `created_at`, etc.). In Zod v4 unknown fields are stripped silently, but this is fragile. Fixed by destructuring and sending only schema-accepted fields.

### 12. `src/components/layout/AppLayout.tsx` — Nav active state logic broken for query-string routes
`href.split('?')[0]` was computed inline but then compared against the full `href` including query string for the `pathname === href` check, causing "New Invoice" and "New Receipt" to both highlight when on `/invoice/new`. Fixed by extracting `hrefPath` and using it consistently.

### 13. `src/middleware.ts` — PDF download route not public
The `/api/documents/:id/pdf` endpoint supports unauthenticated access via `?token=` but was protected by Clerk middleware. Public share page's "Download PDF" button would fail for non-logged-in recipients. Fixed by adding it to `isPublicRoute`.

### 14. `package.json` — Invalid package versions
`lucide-react: ^1.16.0` and `@clerk/nextjs: ^7.4.1` do not exist on npm. Fixed to `^0.454.0` and `^6.12.6` respectively.

---

### Setup Note (PDF in dev)
To test PDF generation locally, install Chrome and set the executable path:
```bash
# .env.local
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable   # Linux
# PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome  # macOS
```
Or skip the env var — the route auto-detects common install paths.
#   p i c k i n v o i c e  
 