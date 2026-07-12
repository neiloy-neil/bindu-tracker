# CLAUDE.md — Bindu Premium Production Tracker Web App

## Project Overview

**Company:** Bindu Premium  
**App Name:** Bindu Production Tracker  
**Stack:** Next.js 14 (App Router) + Supabase + Tailwind CSS + shadcn/ui  
**Purpose:** Replace the manual Excel/Google Sheets production tracking system with a structured web app that tracks garment/textile production from cutting through dispatch to all branches.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 — App Router |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| State | Zustand (client state) |
| Tables | TanStack Table v8 |
| File Upload | Supabase Storage (product images) |
| Date Handling | date-fns |
| Charts | Recharts |
| Icons | Lucide React |

---

## Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Sidebar + topbar shell
│   │   ├── dashboard/page.tsx          # Overview stats
│   │   ├── products/
│   │   │   ├── page.tsx                # Product list (100-row table)
│   │   │   ├── new/page.tsx            # Create product
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Product detail / full tracker row
│   │   │       └── edit/page.tsx
│   │   ├── cutting/page.tsx            # Cutting stage view
│   │   ├── printing/page.tsx           # Printing/Embroidery view
│   │   ├── sewing/page.tsx             # Sewing view
│   │   ├── qc/page.tsx                 # QC view
│   │   ├── finishing/page.tsx          # Finishing view
│   │   ├── dispatch/page.tsx           # Branch dispatch view
│   │   ├── stock/page.tsx              # Warehouse stock view
│   │   └── reports/page.tsx            # Export / summary reports
│   ├── api/
│   │   └── products/
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── products/
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   └── ProductCard.tsx
│   ├── cutting/
│   │   ├── CuttingForm.tsx
│   │   └── ColorQtyPair.tsx            # Reusable color+qty input pair
│   ├── dispatch/
│   │   ├── DispatchTable.tsx
│   │   └── BranchDispatchRow.tsx
│   ├── stock/
│   │   └── StockColorGrid.tsx
│   ├── shared/
│   │   ├── StatusBadge.tsx
│   │   ├── ColorDropdown.tsx           # Shared color selector
│   │   ├── ImageUpload.tsx
│   │   └── StageProgress.tsx           # Visual pipeline progress bar
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Topbar.tsx
│       └── MobileNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── product.ts                  # Zod schemas
│   │   ├── cutting.ts
│   │   ├── dispatch.ts
│   │   └── stock.ts
│   ├── hooks/
│   │   ├── useProducts.ts
│   │   ├── useCutting.ts
│   │   ├── useDispatch.ts
│   │   └── useStock.ts
│   └── utils.ts
├── types/
│   ├── database.ts                     # Generated Supabase types
│   └── app.ts                          # App-level types
├── constants/
│   └── index.ts                        # Colors, branches, status options
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── seed.sql
```

---

## Database Schema (Supabase / PostgreSQL)

### Constants (defined in code, not DB)

```typescript
// constants/index.ts

export const COLOR_OPTIONS = [
  "Red", "Blue", "Green", "Yellow", "Black", "White",
  "Orange", "Pink", "Purple", "Brown", "White Melange", "Grey Melange", "Navy"
];

export const BRANCHES = [
  "Aziz-1", "Aziz-2", "Aziz-3",
  "Cox-1", "Cox-2", "Cox-3",
  "Teknaf", "Basurhat", "Jessore",
  "Barisal", "Lamabazar", "Dorgagate", "Online"
];

export const PRINT_STATUS = ["Out for Print", "Received from Print"] as const;
export const SEW_STATUS   = ["Ongoing", "Completed", "HOLD"] as const;
export const QC_STATUS    = ["Ongoing", "Completed"] as const;
export const STAGES       = ["Cutting", "Printing", "Sewing", "QC", "Finishing", "Dispatched", "Completed"] as const;
```

### SQL Migration

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
create table products (
  id                  uuid primary key default uuid_generate_v4(),
  product_code        text unique not null,           -- e.g. BP-2026-001
  product_name        text not null,
  image_url           text,                           -- Supabase Storage URL
  production_start_date date,
  complete_date       date,
  current_stage       text default 'Cutting',         -- tracks active stage
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── CUTTING ─────────────────────────────────────────────────────────────────
create table cutting (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references products(id) on delete cascade,
  color_1_name text,  color_1_qty  integer default 0,
  color_2_name text,  color_2_qty  integer default 0,
  color_3_name text,  color_3_qty  integer default 0,
  color_4_name text,  color_4_qty  integer default 0,
  color_5_name text,  color_5_qty  integer default 0,
  color_6_name text,  color_6_qty  integer default 0,
  total_qty   integer generated always as (
    color_1_qty + color_2_qty + color_3_qty +
    color_4_qty + color_5_qty + color_6_qty
  ) stored,
  total_kg    numeric(10,2),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(product_id)
);

-- ─── PRINTING / EMBROIDERY ───────────────────────────────────────────────────
create table printing (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references products(id) on delete cascade,
  vendor_name text,
  out_qty     integer default 0,
  in_qty      integer default 0,
  status      text check (status in ('Out for Print', 'Received from Print')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(product_id)
);

-- ─── SEWING ──────────────────────────────────────────────────────────────────
create table sewing (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references products(id) on delete cascade,
  vendor_name text,
  out_qty     integer default 0,
  in_qty      integer default 0,
  status      text check (status in ('Ongoing', 'Completed', 'HOLD')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(product_id)
);

-- ─── QC ──────────────────────────────────────────────────────────────────────
create table qc (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references products(id) on delete cascade,
  in_qty      integer default 0,
  out_qty     integer default 0,
  reject_qty  integer default 0,
  status      text check (status in ('Ongoing', 'Completed')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(product_id)
);

-- ─── FINISHING ───────────────────────────────────────────────────────────────
create table finishing (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid references products(id) on delete cascade,
  received_qty  integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(product_id)
);

-- ─── BRANCH DISPATCH ─────────────────────────────────────────────────────────
-- One row per branch per dispatch (up to 3 dispatches per branch per product)
create table branch_dispatch (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid references products(id) on delete cascade,
  branch_name   text not null,                        -- must be in BRANCHES list
  dispatch_no   integer not null check (dispatch_no in (1, 2, 3)),
  dispatch_date date,
  qty           integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(product_id, branch_name, dispatch_no)
);

-- ─── WAREHOUSE STOCK ─────────────────────────────────────────────────────────
create table warehouse_stock (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references products(id) on delete cascade,
  color_1_name text,  color_1_qty  integer default 0,
  color_2_name text,  color_2_qty  integer default 0,
  color_3_name text,  color_3_qty  integer default 0,
  color_4_name text,  color_4_qty  integer default 0,
  color_5_name text,  color_5_qty  integer default 0,
  color_6_name text,  color_6_qty  integer default 0,
  total_qty   integer generated always as (
    color_1_qty + color_2_qty + color_3_qty +
    color_4_qty + color_5_qty + color_6_qty
  ) stored,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(product_id)
);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

create trigger trg_cutting_updated_at
  before update on cutting
  for each row execute function update_updated_at();

create trigger trg_printing_updated_at
  before update on printing
  for each row execute function update_updated_at();

create trigger trg_sewing_updated_at
  before update on sewing
  for each row execute function update_updated_at();

create trigger trg_qc_updated_at
  before update on qc
  for each row execute function update_updated_at();

create trigger trg_finishing_updated_at
  before update on finishing
  for each row execute function update_updated_at();

create trigger trg_dispatch_updated_at
  before update on branch_dispatch
  for each row execute function update_updated_at();

create trigger trg_stock_updated_at
  before update on warehouse_stock
  for each row execute function update_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table products         enable row level security;
alter table cutting          enable row level security;
alter table printing         enable row level security;
alter table sewing           enable row level security;
alter table qc               enable row level security;
alter table finishing        enable row level security;
alter table branch_dispatch  enable row level security;
alter table warehouse_stock  enable row level security;

-- Allow all authenticated users to read/write (adjust per role later)
create policy "auth_all" on products
  for all to authenticated using (true) with check (true);
create policy "auth_all" on cutting
  for all to authenticated using (true) with check (true);
create policy "auth_all" on printing
  for all to authenticated using (true) with check (true);
create policy "auth_all" on sewing
  for all to authenticated using (true) with check (true);
create policy "auth_all" on qc
  for all to authenticated using (true) with check (true);
create policy "auth_all" on finishing
  for all to authenticated using (true) with check (true);
create policy "auth_all" on branch_dispatch
  for all to authenticated using (true) with check (true);
create policy "auth_all" on warehouse_stock
  for all to authenticated using (true) with check (true);

-- ─── USEFUL VIEW: full product summary ───────────────────────────────────────
create or replace view product_summary as
select
  p.id,
  p.product_code,
  p.product_name,
  p.image_url,
  p.production_start_date,
  p.complete_date,
  p.current_stage,
  c.total_qty   as cutting_total_qty,
  c.total_kg    as cutting_total_kg,
  pr.status     as print_status,
  s.status      as sew_status,
  q.status      as qc_status,
  f.received_qty as finishing_qty,
  w.total_qty   as stock_total,
  p.created_at,
  p.updated_at
from products p
left join cutting         c  on c.product_id  = p.id
left join printing        pr on pr.product_id = p.id
left join sewing          s  on s.product_id  = p.id
left join qc              q  on q.product_id  = p.id
left join finishing       f  on f.product_id  = p.id
left join warehouse_stock w  on w.product_id  = p.id;
```

---

## Key Types

```typescript
// types/app.ts

export type ColorPair = {
  name: string | null;
  qty: number;
};

export type CuttingData = {
  colors: [ColorPair, ColorPair, ColorPair, ColorPair, ColorPair, ColorPair]; // always 6
  total_qty: number;   // computed
  total_kg: number | null;
};

export type DispatchEntry = {
  branch_name: string;
  dispatch_no: 1 | 2 | 3;
  dispatch_date: string | null;
  qty: number;
};

export type ProductStage =
  | "Cutting" | "Printing" | "Sewing"
  | "QC" | "Finishing" | "Dispatched" | "Completed";
```

---

## Pages & Features

### 1. Dashboard (`/dashboard`)
- Total products count
- Products by current stage (pipeline funnel chart)
- Recent activity feed
- Low stock alerts (warehouse stock < threshold)
- Quick links to each stage

### 2. Products List (`/products`)
- Full data table with TanStack Table
- Columns: Image, Code, Name, Stage, Cutting QTY, Print Status, Sew Status, QC Status, Stock, Start Date, Actions
- Filter by: Stage, Date range, Search by name/code
- Export to Excel button (use `xlsx` library)
- "New Product" button

### 3. Product Detail (`/products/[id]`)
- Top: Product image + code + name + stage progress bar
- Tabbed sections: Cutting → Printing → Sewing → QC → Finishing → Dispatch → Stock
- Each tab shows that stage's data with inline edit
- Timeline/activity log at bottom

### 4. Create / Edit Product (`/products/new`, `/products/[id]/edit`)
- Step-by-step form wizard OR single long form
- Stage 1: Basic info (code, name, image upload, start date)
- Stage 2: Cutting (6 color+qty pairs, total KG)
- Stage 3: Printing details
- Stage 4: Sewing details
- Stage 5: QC
- Stage 6: Finishing
- Stage 7: Dispatch (branch × 3 dispatch slots)
- Stage 8: Warehouse stock (6 color+qty pairs)

### 5. Stage Views (`/cutting`, `/printing`, etc.)
- Filtered table showing only products at that stage
- Inline quick-edit for that stage's fields
- Bulk status update

### 6. Dispatch View (`/dispatch`)
- Grid: Rows = Products, Columns = 13 Branches
- Each cell shows dispatch entries (Date + QTY per dispatch slot)
- Add/edit dispatch entry inline

### 7. Stock View (`/stock`)
- Cards per product showing 6 color stocks
- Total stock per product
- Color-wise stock summary across all products

### 8. Reports (`/reports`)
- Export full tracker to Excel (matching original sheet format)
- Filter by date range, stage, branch
- Summary stats

---

## Component Patterns

### ColorQtyPair (reused in Cutting & Stock)
```tsx
// components/shared/ColorQtyPair.tsx
// Props: index (1-6), colorValue, qtyValue, onColorChange, onQtyChange
// Renders: [Color dropdown ▾] [QTY number input]
// Color dropdown uses COLOR_OPTIONS constant
// Label shows "Color {index}"
```

### StatusBadge
```tsx
// Green  → Completed / Received from Print
// Blue   → Ongoing / Out for Print  
// Red    → HOLD
// Grey   → empty/null
```

### StageProgress
```tsx
// Horizontal stepper: Cutting → Printing → Sewing → QC → Finishing → Dispatched → Completed
// Completed stages = filled green circle
// Current stage = pulsing blue
// Upcoming = grey outline
```

### ImageUpload
```tsx
// Uses Supabase Storage bucket: "product-images"
// Accept: image/jpeg, image/png, image/webp
// Max size: 5MB
// Preview thumbnail after upload
// Returns public URL stored in products.image_url
```

---

## Supabase Setup

### Storage
```
Bucket: product-images
  Public: true
  File size limit: 5MB
  Allowed types: image/jpeg, image/png, image/webp
```

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only
```

### Client Setup
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(),
                 setAll: (cs) => cs.forEach(({name,value,options}) =>
                   cookieStore.set(name,value,options)) }}
  )
}
```

---

## Data Fetch Patterns

### Server Component (preferred for initial load)
```typescript
// In a page.tsx
const supabase = createClient()
const { data: products } = await supabase
  .from('product_summary')
  .select('*')
  .order('created_at', { ascending: false })
```

### Client Hook (for interactive updates)
```typescript
// lib/hooks/useProducts.ts
// Use SWR or React Query for client-side fetching with optimistic updates
```

### Upsert pattern (cutting, stock — single row per product)
```typescript
await supabase.from('cutting').upsert(
  { product_id, ...cuttingData },
  { onConflict: 'product_id' }
)
```

### Dispatch entries (multiple rows per product+branch)
```typescript
await supabase.from('branch_dispatch').upsert(
  { product_id, branch_name, dispatch_no, dispatch_date, qty },
  { onConflict: 'product_id,branch_name,dispatch_no' }
)
```

---

## UI / UX Rules

- **Language:** English UI labels; Bangla can be added later as a toggle
- **Theme:** Clean white + dark navy (`#1A3557`) sidebar, brand green accents
- **Mobile:** Responsive — table views collapse to card views on mobile
- **Loading:** Skeleton loaders on all data tables
- **Errors:** Toast notifications (sonner) for success/error on all mutations
- **Validation:** Zod schemas on both client (React Hook Form) and server (API routes)
- **Empty states:** Illustrated empty states for each stage view
- **Dates:** Display as DD/MM/YYYY (Bangladesh format), store as ISO in DB

---

## Business Logic Rules

1. **Total Cutting QTY** = sum of all 6 color QTYs (computed column in DB)
2. **Total Warehouse Stock** = sum of all 6 color stock QTYs (computed column in DB)
3. **current_stage** on products table should auto-advance based on which stages have data:
   - Has cutting data → "Cutting"
   - Has printing data → "Printing"
   - Sewing status = Completed → "QC"
   - QC status = Completed → "Finishing"
   - Has finishing received_qty → "Dispatched"
   - Has complete_date → "Completed"
4. **Dispatch:** Up to 3 dispatch entries per branch per product (dispatch_no = 1, 2, 3)
5. **Stock** represents current warehouse balance (updated manually — not auto-computed from dispatch)
6. **Color dropdowns** always use COLOR_OPTIONS constant — never free text

---

## Install Commands

```bash
# Create project
npx create-next-app@latest bindu-production-tracker \
  --typescript --tailwind --eslint --app --src-dir=false

cd bindu-production-tracker

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install @tanstack/react-table
npm install date-fns
npm install recharts
npm install zustand
npm install xlsx                    # Excel export
npm install sonner                  # Toast notifications
npm install lucide-react

# shadcn/ui setup
npx shadcn@latest init
npx shadcn@latest add button input label select card table badge
npx shadcn@latest add dialog sheet tabs form skeleton toast
npx shadcn@latest add dropdown-menu popover calendar

# Supabase CLI (for migrations)
npm install -D supabase
npx supabase init
npx supabase db push                # push migration files
```

---

## Development Notes

- Always use **App Router** patterns (no Pages Router)
- Server Components for data fetching, Client Components only where interactivity needed
- Mark client components with `"use client"` at top
- Use `loading.tsx` files for Suspense boundaries on each route
- Use `error.tsx` files for error boundaries
- Product images stored in Supabase Storage, URL saved in `products.image_url`
- Run `npx supabase gen types typescript --local > types/database.ts` after schema changes
- The `product_summary` view gives a fast single-query overview for the products list page
- Branch dispatch uses `upsert` with conflict on `(product_id, branch_name, dispatch_no)` — safe to call repeatedly

---

## Company Context

- **Company:** Bindu Premium
- **CEO/Founder:** Nazrul Islam
- **Branches:** Aziz-1, Aziz-2, Aziz-3, Cox-1, Cox-2, Cox-3, Teknaf, Basurhat, Jessore, Barisal, Lamabazar, Dorgagate, Online (13 total)
- **Products per tracker cycle:** ~100
- **Production flow:** Cutting → Printing/Embroidery → Sewing → QC → Finishing → Dispatch → Warehouse Stock
- **Colors tracked:** Up to 6 per product (name + qty pair each)
- **Dispatch:** Up to 3 separate dispatch dates+qty per branch per product
