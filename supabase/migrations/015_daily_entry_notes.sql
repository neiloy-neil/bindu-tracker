-- Daily entry is now a reference log only (no production quantities).
-- Add a notes column for per-row remarks.
ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS notes text;
