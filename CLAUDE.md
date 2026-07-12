# Bindu Production Tracker

**Company:** Bindu Premium | **CEO:** Nazrul Islam  
**Stack:** Next.js 14 (App Router) · Supabase · Tailwind CSS · shadcn/ui · TypeScript strict

---

## Two trackers in one app

| Section | Route | Purpose |
|---|---|---|
| Daily Entry Sheet | `/dashboard/daily` | Date-centric log — up to 6 design codes per day, spreadsheet grid |
| Product Tracker | `/dashboard/products` | Product lifecycle — one row per design, cutting → dispatch → stock |

Both share the same Supabase backend. `production_entries` = daily log. `products` + stage tables = product lifecycle.

---

## Key rules

- **TypeScript strict** — no `any`
- **Server Components by default** — `"use client"` only for interactivity
- **shadcn/ui** for all UI primitives
- **Tailwind** only — no CSS modules
- **Auto-save on blur** in the daily grid (800ms debounce via `use-debounce`)
- **6 colors** for cutting in the product tracker; **5 colors** in the daily entry sheet
- All qty fields: `integer ≥ 0`, display `0` as empty string visually
- Dates stored as `date` (YYYY-MM-DD); displayed as `DD MMM YYYY`
- Branch list: Aziz-1, Aziz-2, Aziz-3, Cox-1, Cox-2, Cox-3, Teknaf, Basurhat, Jessore, Barisal, Lamabazar, Dorgagate, Online (13 total)
- Max **6 entries** per date per branch in daily sheet
- Product dispatch: up to **3 slots** per branch per product

---

## Supabase client

```ts
// Client components
import { createClient } from '@/lib/supabase/client'

// Server components / route handlers
import { createClient } from '@/lib/supabase/server'
```

After schema changes: `npx supabase gen types typescript --local > src/types/database.ts`

---

## Column colours (daily sheet)

| Section | Colour |
|---|---|
| Cutting | blue-600 |
| Printing/Embroidery | teal-600 |
| Sewing/Swing | orange-600 |
| QC (good) | green-600 |
| Reject/Alter/Spot | red-600 |
| Finished Goods | purple-600 |
| Branch Dispatch | sky-600 |
| Stock | slate-600 |

---

## Local dev

```bash
cd bindu-tracker
npm install
# Fill in .env.local with your Supabase project URL + anon key
npx supabase db push   # push migrations/001_initial_schema.sql
npm run dev
```
