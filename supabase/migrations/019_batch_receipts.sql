-- Batch receipts for Printing and Sewing stages
-- Vendors often return goods in multiple partial shipments.
-- Previously only a single receipt date/qty was stored per product.
-- These tables allow unlimited receipt batches, each with its own date, qty, and color breakdown.

-- ── printing_receipts ────────────────────────────────────────────────────────
CREATE TABLE printing_receipts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  receipt_date date,
  qty          integer NOT NULL DEFAULT 0,
  color_1_qty  integer NOT NULL DEFAULT 0,
  color_2_qty  integer NOT NULL DEFAULT 0,
  color_3_qty  integer NOT NULL DEFAULT 0,
  color_4_qty  integer NOT NULL DEFAULT 0,
  color_5_qty  integer NOT NULL DEFAULT 0,
  color_6_qty  integer NOT NULL DEFAULT 0,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_printing_receipts_product ON printing_receipts(product_id);

ALTER TABLE printing_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON printing_receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── sewing_receipts ──────────────────────────────────────────────────────────
CREATE TABLE sewing_receipts (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  receipt_date date,
  qty          integer NOT NULL DEFAULT 0,
  color_1_qty  integer NOT NULL DEFAULT 0,
  color_2_qty  integer NOT NULL DEFAULT 0,
  color_3_qty  integer NOT NULL DEFAULT 0,
  color_4_qty  integer NOT NULL DEFAULT 0,
  color_5_qty  integer NOT NULL DEFAULT 0,
  color_6_qty  integer NOT NULL DEFAULT 0,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_sewing_receipts_product ON sewing_receipts(product_id);

ALTER TABLE sewing_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON sewing_receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Add recv_date to sewing (was missing) ────────────────────────────────────
ALTER TABLE sewing ADD COLUMN IF NOT EXISTS recv_date date;

-- ── Migrate existing single-receipt data into the new tables ─────────────────
-- If a product already has in_qty > 0, preserve it as the first receipt batch.
INSERT INTO printing_receipts (product_id, receipt_date, qty,
  color_1_qty, color_2_qty, color_3_qty, color_4_qty, color_5_qty, color_6_qty)
SELECT product_id, recv_date, in_qty,
  recv_color_1_qty, recv_color_2_qty, recv_color_3_qty,
  recv_color_4_qty, recv_color_5_qty, recv_color_6_qty
FROM printing
WHERE in_qty > 0;

INSERT INTO sewing_receipts (product_id, receipt_date, qty,
  color_1_qty, color_2_qty, color_3_qty, color_4_qty, color_5_qty, color_6_qty)
SELECT product_id, NULL, in_qty,
  recv_color_1_qty, recv_color_2_qty, recv_color_3_qty,
  recv_color_4_qty, recv_color_5_qty, recv_color_6_qty
FROM sewing
WHERE in_qty > 0;
