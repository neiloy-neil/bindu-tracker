# CLAUDE.md — Bindu Premium Production Tracking App

## Project Overview

**Company:** Bindu Premium  
**App Purpose:** Web-based production tracking system to replace manual Excel/Google Sheets workflow.  
**Stack:** Next.js 14 (App Router) + Supabase (Postgres + Auth + Realtime) + Tailwind CSS + shadcn/ui  
**Language:** TypeScript throughout — no plain JS files

---

## Business Context

Bindu Premium is a multi-branch retail and wholesale garment/textile company in Bangladesh.  
Branches: Aziz, Basurhat, Cox's Bazar, Teknaf, Dorgagate, Jessore, Lamabazar, Head Office, Barisal.  
Retail outlets: 8 | Wholesale outlets: 3

The production workflow tracks garments from raw cutting through to branch dispatch:

```
Cutting (by color) → Printing/Embroidery Vendor → Sewing/Swing → QC → Finishing → Branch Dispatch → Stock
```

Each working day can have **up to 6 active design codes** (e.g. 3001, 3002, 3003…) running simultaneously at different stages of the pipeline.

---

## Core Data Model

### Design Entry (one row in the tracker)
Each entry represents **one design code on one date**. Up to 6 entries per date.

| Field Group | Fields |
|---|---|
| Identity | `date`, `design_code`, `branch_id` |
| Cutting | `cut_color_1` through `cut_color_5`, `cut_total` (computed) |
| Printing/Embroidery | `pe_vendor_name`, `pe_sending_qty`, `pe_received_qty` |
| Sewing/Swing | `swing_vendor_name`, `swing_out_qty`, `swing_in_qty` |
| Quality Control | `qc_received_qty`, `qc_output_qty`, `qc_reject_qty`, `qc_alter_qty`, `qc_spot_qty` |
| Finished Goods | `finished_goods_qty` |
| Branch Dispatch | `dispatch_retail_qty`, `dispatch_wholesale_qty` |
| Stock | `stock_warehouse`, `stock_cutting`, `stock_swingline`, `stock_short` |
| Meta | `created_by`, `created_at`, `updated_at` |

---

## Supabase Schema

### Tables

```sql
-- Branches
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text check (type in ('retail', 'wholesale', 'head_office')),
  active boolean default true,
  created_at timestamptz default now()
);

-- Production entries (core table)
create table production_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  design_code text not null,
  branch_id uuid references branches(id),
  
  -- Cutting
  cut_color_1 int default 0,
  cut_color_2 int default 0,
  cut_color_3 int default 0,
  cut_color_4 int default 0,
  cut_color_5 int default 0,
  -- cut_total is always sum of cut_color_1..5, computed in app layer
  
  -- Printing / Embroidery
  pe_vendor_name text,
  pe_sending_qty int default 0,
  pe_received_qty int default 0,
  
  -- Sewing / Swing
  swing_vendor_name text,
  swing_out_qty int default 0,
  swing_in_qty int default 0,
  
  -- QC
  qc_received_qty int default 0,
  qc_output_qty int default 0,
  qc_reject_qty int default 0,
  qc_alter_qty int default 0,
  qc_spot_qty int default 0,
  
  -- Finished
  finished_goods_qty int default 0,
  
  -- Branch dispatch
  dispatch_retail_qty int default 0,
  dispatch_wholesale_qty int default 0,
  
  -- Stock
  stock_warehouse int default 0,
  stock_cutting int default 0,
  stock_swingline int default 0,
  stock_short int default 0,
  
  -- Meta
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Max 6 entries per date per branch
  constraint max_entries_per_day check (true) -- enforced at app level
);

-- Index for date-range queries
create index idx_production_date on production_entries(entry_date);
create index idx_production_branch on production_entries(branch_id);
create index idx_production_date_branch on production_entries(entry_date, branch_id);

-- Monthly summary view
create view monthly_summary as
select
  date_trunc('month', entry_date) as month,
  branch_id,
  sum(cut_color_1 + cut_color_2 + cut_color_3 + cut_color_4 + cut_color_5) as total_cutting,
  sum(pe_sending_qty) as total_pe_sending,
  sum(pe_received_qty) as total_pe_received,
  sum(swing_out_qty) as total_swing_out,
  sum(swing_in_qty) as total_swing_in,
  sum(qc_received_qty) as total_qc_received,
  sum(qc_output_qty) as total_qc_output,
  sum(qc_reject_qty) as total_reject,
  sum(qc_alter_qty) as total_alter,
  sum(qc_spot_qty) as total_spot,
  sum(finished_goods_qty) as total_finished,
  sum(dispatch_retail_qty) as total_retail,
  sum(dispatch_wholesale_qty) as total_wholesale,
  sum(stock_warehouse) as stock_warehouse,
  sum(stock_cutting) as stock_cutting,
  sum(stock_swingline) as stock_swingline,
  sum(stock_short) as stock_short
from production_entries
group by 1, 2;

-- RLS Policies
alter table production_entries enable row level security;
alter table branches enable row level security;

-- Authenticated users can read all; only owners or admins can write
create policy "Authenticated read" on production_entries
  for select using (auth.role() = 'authenticated');
create policy "Authenticated insert" on production_entries
  for insert with check (auth.uid() = created_by);
create policy "Owner or admin update" on production_entries
  for update using (auth.uid() = created_by);
```

---

## Project File Structure

```
bindu-production/
├── CLAUDE.md                          ← this file
├── .env.local                         ← NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── next.config.ts
├── tailwind.config.ts
├── components.json                    ← shadcn/ui config
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 ← root layout, global font, Toaster
│   │   ├── page.tsx                   ← redirect to /dashboard or /login
│   │   ├── login/
│   │   │   └── page.tsx              ← Supabase Auth UI
│   │   └── dashboard/
│   │       ├── layout.tsx            ← sidebar + top nav
│   │       ├── page.tsx              ← monthly overview / summary
│   │       ├── entry/
│   │       │   ├── page.tsx          ← daily entry sheet (main data entry)
│   │       │   └── [id]/
│   │       │       └── page.tsx      ← edit single entry
│   │       └── reports/
│   │           └── page.tsx          ← monthly/date-range reports
│   │
│   ├── components/
│   │   ├── ui/                        ← shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopNav.tsx
│   │   ├── entry/
│   │   │   ├── DailyEntryTable.tsx   ← main spreadsheet-like data entry grid
│   │   │   ├── EntryRow.tsx          ← single design-code row (all columns)
│   │   │   └── DatePicker.tsx
│   │   ├── reports/
│   │   │   ├── MonthlyTable.tsx
│   │   │   └── SummaryCards.tsx
│   │   └── shared/
│   │       ├── BranchSelector.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             ← createBrowserClient
│   │   │   ├── server.ts             ← createServerClient (cookies)
│   │   │   └── middleware.ts         ← session refresh
│   │   ├── types/
│   │   │   ├── database.types.ts     ← generated from Supabase CLI: supabase gen types
│   │   │   └── app.types.ts          ← derived/UI types
│   │   ├── hooks/
│   │   │   ├── useProductionEntries.ts
│   │   │   ├── useBranches.ts
│   │   │   └── useMonthlySummary.ts
│   │   └── utils/
│   │       ├── calculations.ts       ← cut_total, derived fields
│   │       └── formatters.ts         ← date, number formatting (Bengali context)
│   │
│   └── middleware.ts                  ← Supabase auth session middleware
```

---

## Key Implementation Rules

### 1. Supabase Client Usage
- **Client components** → `createBrowserClient` from `@supabase/ssr`
- **Server components / Route handlers** → `createServerClient` from `@supabase/ssr` with `cookies()`
- **Never** use the old `@supabase/supabase-js` `createClient` directly in server components
- Always run `supabase gen types typescript --project-id YOUR_ID > src/lib/types/database.types.ts` after schema changes

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### 2. Daily Entry Sheet — UI Behavior
The main data entry screen (`/dashboard/entry`) must feel like a spreadsheet:
- Show the selected **date** at the top with a date picker
- Display **6 rows** for that date (one per potential design code)
- Empty rows are visible but blank — user fills in only the rows needed
- **Tab key** moves between cells left→right, then jumps to next row col 2
- Each row auto-saves on blur (optimistic update pattern)
- `cut_total` = sum of `cut_color_1..5`, computed in `calculations.ts`, displayed read-only
- Columns are grouped visually with colored headers matching the Excel:
  - 🔵 Cutting (steel blue)
  - 🟦 Printing/Embroidery (teal)
  - 🟠 Sewing/Swing (orange)
  - 🟢 QC (green) | 🔴 Reject/Alter/Spot (red)
  - 🟣 Finished Goods (purple)
  - 🔵 Branch Dispatch (mid blue)
  - 🔵 Stock (dark navy)

### 3. Row Limit Enforcement
Each date + branch combination allows **maximum 6 entries**.  
Check count before insert:
```ts
const { count } = await supabase
  .from('production_entries')
  .select('*', { count: 'exact', head: true })
  .eq('entry_date', date)
  .eq('branch_id', branchId)

if (count >= 6) throw new Error('Maximum 6 design codes per day reached')
```

### 4. Auto-save Pattern
Use debounced mutation — do not require a Save button for individual cells:
```ts
const debouncedSave = useDebouncedCallback(async (rowId, field, value) => {
  await supabase.from('production_entries').update({ [field]: value }).eq('id', rowId)
}, 800)
```

### 5. Number Fields
- All quantity fields are **integers**, minimum 0
- Use `<input type="number" min="0" step="1" />` — never allow negative
- Display `0` as empty string visually (cleaner spreadsheet feel)
- On focus: select all text for quick overwrite

### 6. Date Handling
- Store as `date` type in Postgres (YYYY-MM-DD), no timezone issues
- Display format in UI: `DD MMM YYYY` (e.g. `11 Jul 2026`)
- Use `date-fns` for all date manipulation

### 7. Branch Selector
- Always present in the top nav / session — user selects their branch once
- Persist selection in `localStorage` + URL search param `?branch=uuid`
- All queries filter by `branch_id`

---

## Pages Specification

### `/dashboard/entry` — Daily Entry Sheet
**Purpose:** Main daily data entry (replaces the Excel month sheet)

**UI Layout:**
```
[TopNav: Branch Selector | Date Picker | Month/Year]
[Column Headers: Date | Design# | Cut Total | Color1..5 | PE Vendor | PE Send | PE Recv | Swing Vendor | Swing Out | Swing In | QC Recv | QC Out | Reject | Alter | Spot | Finished | Retail | Wholesale | Warehouse | Cut Stock | Swing Stock | Short]
[Row 1: editable]
[Row 2: editable]
...
[Row 6: editable]
[DAILY TOTAL row: auto-sum of 6 rows]
```

**Behavior:**
- Horizontal scroll for all columns (sticky first 2 cols: Date + Design#)
- Each row saves independently on blur
- Add new entry button (only if < 6 entries for the date)
- Delete row with confirmation dialog

---

### `/dashboard` — Monthly Summary
**Purpose:** Overview of the month (replaces the Excel Summary sheet)

**UI Layout:**
```
[Month/Year picker]
[Summary Cards: Total Cutting | Total Finished | Total Dispatch | Pending in QC | Short Products]
[Monthly Table: one row per day, totals across all design codes for that day]
[Footer: Monthly Grand Total row]
```

---

### `/dashboard/reports` — Reports
**Purpose:** Date-range reports and branch comparisons

**Features:**
- Date range picker (from → to)
- Branch filter (single or all)
- Downloadable as CSV
- Printable view

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only, never expose
```

---

## Package Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@supabase/ssr": "^0.5",
    "@supabase/supabase-js": "^2",
    "tailwindcss": "^3",
    "shadcn-ui": "latest",
    "date-fns": "^3",
    "use-debounce": "^10",
    "react-hot-toast": "^2",
    "lucide-react": "latest",
    "@tanstack/react-query": "^5"
  }
}
```

---

## Coding Conventions

- **TypeScript strict mode** — no `any`, use generated DB types everywhere
- **Server Components by default** — only add `"use client"` when needed (event handlers, hooks, browser APIs)
- **React Query** (`@tanstack/react-query`) for all data fetching in client components — not raw `useEffect`
- **shadcn/ui** for all UI primitives (Button, Input, Table, Dialog, Select, etc.)
- **Tailwind** for all styling — no CSS modules, no inline styles
- **Error handling:** always show toast on mutation failure (`react-hot-toast`)
- **Loading states:** use shadcn Skeleton components, not spinners
- **Folder naming:** `kebab-case` for folders, `PascalCase` for component files
- **API routes** live in `src/app/api/` if needed (prefer direct Supabase client calls from server components)

---

## Computed Fields (calculations.ts)

```ts
export const getCutTotal = (entry: ProductionEntry): number =>
  (entry.cut_color_1 ?? 0) +
  (entry.cut_color_2 ?? 0) +
  (entry.cut_color_3 ?? 0) +
  (entry.cut_color_4 ?? 0) +
  (entry.cut_color_5 ?? 0)

export const getPendingAtPE = (entry: ProductionEntry): number =>
  (entry.pe_sending_qty ?? 0) - (entry.pe_received_qty ?? 0)

export const getPendingAtSwing = (entry: ProductionEntry): number =>
  (entry.swing_out_qty ?? 0) - (entry.swing_in_qty ?? 0)

export const getQCRejectRate = (entry: ProductionEntry): number => {
  const received = entry.qc_received_qty ?? 0
  if (received === 0) return 0
  return ((entry.qc_reject_qty ?? 0) / received) * 100
}
```

---

## Auth Flow

1. User visits `/` → middleware checks session → redirect to `/login` if no session
2. Login page uses Supabase email/password auth (no OAuth needed for internal tool)
3. On successful login → redirect to `/dashboard/entry`
4. Middleware in `src/middleware.ts` refreshes session on every request

```ts
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // refresh session, redirect unauthenticated users to /login
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
```

---

## Local Development Setup

```bash
# 1. Clone and install
git clone <repo>
cd bindu-production
npm install

# 2. Set up Supabase (local or cloud)
npx supabase init
npx supabase start          # local dev (Docker required)
# OR use cloud project and set .env.local

# 3. Run migrations
npx supabase db push

# 4. Generate types
npx supabase gen types typescript --local > src/lib/types/database.types.ts

# 5. Start dev server
npm run dev
```

---

## Important Notes for Claude

- Always refer to the company as **Bindu Premium** (exact spelling)
- The founder/CEO is **Nazrul Islam**
- This is an **internal operations tool** — prioritize functionality and data integrity over flashy UI
- Bangla text may appear in design codes or vendor names — ensure UTF-8 handling throughout
- The spreadsheet-like entry grid is the **most critical UI** — it must feel fast and keyboard-navigable
- When building the entry grid, keep columns horizontally scrollable with the first 2 columns (Date, Design#) **sticky/frozen**
- Monthly Total rows must always auto-calculate in the UI — never require manual refresh
- All numeric inputs must reject negative values at both UI and DB constraint level
