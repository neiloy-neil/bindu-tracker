-- Add missing columns to finishing table
ALTER TABLE finishing
  ADD COLUMN IF NOT EXISTS ironing_qty       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS folding_qty       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispatch_ready_qty integer NOT NULL DEFAULT 0;

-- Extend trigger to auto-set qc.status when trigger updates qc quantities
CREATE OR REPLACE FUNCTION aggregate_production_entries()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  p_id uuid;
  cut_r   RECORD;
  print_r RECORD;
  sew_r   RECORD;
  qc_r    RECORD;
  fin_r   RECORD;
  new_stage text;
BEGIN
  -- Determine affected product_id
  IF TG_OP = 'DELETE' THEN
    p_id := OLD.product_id;
  ELSE
    p_id := NEW.product_id;
  END IF;

  IF p_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- ── CUTTING ──────────────────────────────────────────────────────────────
  SELECT
    COALESCE(SUM(cut_color_1),0) AS c1,
    COALESCE(SUM(cut_color_2),0) AS c2,
    COALESCE(SUM(cut_color_3),0) AS c3,
    COALESCE(SUM(cut_color_4),0) AS c4,
    COALESCE(SUM(cut_color_5),0) AS c5,
    COALESCE(SUM(cut_color_6),0) AS c6
  INTO cut_r FROM production_entries WHERE product_id = p_id;

  INSERT INTO cutting (product_id, color_1_qty, color_2_qty, color_3_qty, color_4_qty, color_5_qty, color_6_qty)
  VALUES (p_id, cut_r.c1, cut_r.c2, cut_r.c3, cut_r.c4, cut_r.c5, cut_r.c6)
  ON CONFLICT (product_id) DO UPDATE SET
    color_1_qty = EXCLUDED.color_1_qty, color_2_qty = EXCLUDED.color_2_qty,
    color_3_qty = EXCLUDED.color_3_qty, color_4_qty = EXCLUDED.color_4_qty,
    color_5_qty = EXCLUDED.color_5_qty, color_6_qty = EXCLUDED.color_6_qty;

  -- ── PRINTING ─────────────────────────────────────────────────────────────
  SELECT
    COALESCE(SUM(pe_sending_qty),0)  AS out_qty,
    COALESCE(SUM(pe_received_qty),0) AS in_qty
  INTO print_r FROM production_entries WHERE product_id = p_id;

  INSERT INTO printing (product_id, out_qty, in_qty, status)
  VALUES (
    p_id, print_r.out_qty, print_r.in_qty,
    CASE
      WHEN print_r.in_qty  > 0 THEN 'Received from Print'
      WHEN print_r.out_qty > 0 THEN 'Out for Print'
      ELSE NULL
    END
  )
  ON CONFLICT (product_id) DO UPDATE SET
    out_qty = EXCLUDED.out_qty,
    in_qty  = EXCLUDED.in_qty,
    status  = EXCLUDED.status;

  -- ── SEWING ───────────────────────────────────────────────────────────────
  SELECT
    COALESCE(SUM(swing_out_qty),0) AS out_qty,
    COALESCE(SUM(swing_in_qty),0)  AS in_qty
  INTO sew_r FROM production_entries WHERE product_id = p_id;

  INSERT INTO sewing (product_id, out_qty, in_qty, status)
  VALUES (
    p_id, sew_r.out_qty, sew_r.in_qty,
    CASE
      WHEN sew_r.in_qty  > 0 THEN 'Received from Sewing'
      WHEN sew_r.out_qty > 0 THEN 'Out for Sewing'
      ELSE NULL
    END
  )
  ON CONFLICT (product_id) DO UPDATE SET
    out_qty = EXCLUDED.out_qty,
    in_qty  = EXCLUDED.in_qty,
    status  = EXCLUDED.status;

  -- ── QC ───────────────────────────────────────────────────────────────────
  SELECT
    COALESCE(SUM(qc_received_qty),0) AS in_qty,
    COALESCE(SUM(qc_output_qty),0)   AS out_qty,
    COALESCE(SUM(qc_reject_qty),0)   AS reject_qty,
    COALESCE(SUM(qc_alter_qty),0)    AS alter_qty,
    COALESCE(SUM(qc_spot_qty),0)     AS spot_qty
  INTO qc_r FROM production_entries WHERE product_id = p_id;

  INSERT INTO qc (product_id, in_qty, out_qty, reject_qty, alter_qty, spot_qty, status)
  VALUES (
    p_id, qc_r.in_qty, qc_r.out_qty, qc_r.reject_qty, qc_r.alter_qty, qc_r.spot_qty,
    CASE
      WHEN qc_r.out_qty > 0 THEN 'Completed'
      WHEN qc_r.in_qty  > 0 THEN 'Ongoing'
      ELSE NULL
    END
  )
  ON CONFLICT (product_id) DO UPDATE SET
    in_qty     = EXCLUDED.in_qty,
    out_qty    = EXCLUDED.out_qty,
    reject_qty = EXCLUDED.reject_qty,
    alter_qty  = EXCLUDED.alter_qty,
    spot_qty   = EXCLUDED.spot_qty,
    status     = EXCLUDED.status;

  -- ── FINISHING ────────────────────────────────────────────────────────────
  SELECT COALESCE(SUM(finished_goods_qty),0) AS received_qty
  INTO fin_r FROM production_entries WHERE product_id = p_id;

  INSERT INTO finishing (product_id, received_qty)
  VALUES (p_id, fin_r.received_qty)
  ON CONFLICT (product_id) DO UPDATE SET
    received_qty = EXCLUDED.received_qty;

  -- ── DISPATCH (slot 1 per branch = auto-synced) ────────────────────────────
  INSERT INTO branch_dispatch (product_id, branch_name, dispatch_no, qty, dispatch_date)
  SELECT
    p_id,
    b.name,
    1,
    COALESCE(SUM(pe.dispatch_retail_qty + pe.dispatch_wholesale_qty), 0),
    MAX(pe.entry_date)
  FROM branches b
  LEFT JOIN production_entries pe
    ON pe.product_id = p_id AND pe.branch_id = b.id
  GROUP BY b.name
  ON CONFLICT (product_id, branch_name, dispatch_no) DO UPDATE SET
    qty           = EXCLUDED.qty,
    dispatch_date = EXCLUDED.dispatch_date;

  -- ── STAGE AUTO-ADVANCE ───────────────────────────────────────────────────
  SELECT color_1_qty+color_2_qty+color_3_qty+color_4_qty+color_5_qty+color_6_qty AS total
  INTO cut_r FROM cutting WHERE product_id = p_id;

  SELECT out_qty, in_qty INTO print_r FROM printing WHERE product_id = p_id;
  SELECT out_qty, in_qty INTO sew_r   FROM sewing   WHERE product_id = p_id;
  SELECT in_qty, out_qty INTO qc_r    FROM qc       WHERE product_id = p_id;
  SELECT received_qty    INTO fin_r   FROM finishing WHERE product_id = p_id;
  SELECT COALESCE(SUM(qty),0) AS total INTO cut_r
  FROM branch_dispatch WHERE product_id = p_id;

  -- Re-read each stage properly
  new_stage := 'Cutting';

  -- Has cutting?
  IF EXISTS (SELECT 1 FROM cutting WHERE product_id = p_id AND (color_1_qty+color_2_qty+color_3_qty+color_4_qty+color_5_qty+color_6_qty) > 0) THEN
    new_stage := 'Printing';
  END IF;

  -- Has sewing out?
  IF EXISTS (SELECT 1 FROM sewing WHERE product_id = p_id AND out_qty > 0) THEN
    new_stage := 'Sewing';
  END IF;

  -- Has sewing in (= QC stage)?
  IF EXISTS (SELECT 1 FROM sewing WHERE product_id = p_id AND in_qty > 0) THEN
    new_stage := 'QC';
  END IF;

  -- Has QC out?
  IF EXISTS (SELECT 1 FROM qc WHERE product_id = p_id AND out_qty > 0) THEN
    new_stage := 'Finishing';
  END IF;

  -- Has finishing received?
  IF EXISTS (SELECT 1 FROM finishing WHERE product_id = p_id AND received_qty > 0) THEN
    new_stage := 'Dispatched';
  END IF;

  -- Has any dispatch?
  IF EXISTS (SELECT 1 FROM branch_dispatch WHERE product_id = p_id AND qty > 0) THEN
    new_stage := 'Dispatched';
  END IF;

  UPDATE products
  SET current_stage = new_stage::product_stage, updated_at = now()
  WHERE id = p_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
