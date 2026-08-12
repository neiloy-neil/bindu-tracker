-- Fix Supabase security advisor warnings
-- 1. Recreate views with security_invoker=true (fixes "Security Definer View" CRITICAL warnings)
-- 2. Pin function search paths (fixes "Function Search Path Mutable" warnings)

-- ── product_summary ──────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.product_summary;
CREATE VIEW public.product_summary
  WITH (security_invoker = true)
AS
SELECT
  p.id, p.product_code, p.product_name, p.image_url,
  p.production_start_date, p.complete_date, p.current_stage, p.notes,
  c.total_qty    AS cutting_total_qty,
  c.total_kg     AS cutting_total_kg,
  pr.status      AS print_status,
  s.status       AS sew_status,
  q.status       AS qc_status,
  q.out_qty      AS qc_out_qty,
  q.reject_qty   AS qc_reject_qty,
  f.received_qty AS finishing_qty,
  w.total_qty    AS stock_total,
  COALESCE(d.total_dispatched, 0) AS total_dispatched,
  p.created_at, p.updated_at
FROM products p
LEFT JOIN cutting         c  ON c.product_id  = p.id
LEFT JOIN printing        pr ON pr.product_id = p.id
LEFT JOIN sewing          s  ON s.product_id  = p.id
LEFT JOIN qc              q  ON q.product_id  = p.id
LEFT JOIN finishing       f  ON f.product_id  = p.id
LEFT JOIN warehouse_stock w  ON w.product_id  = p.id
LEFT JOIN (
  SELECT product_id, SUM(qty) AS total_dispatched
  FROM branch_dispatch
  GROUP BY product_id
) d ON d.product_id = p.id;

-- ── monthly_summary ──────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.monthly_summary;
CREATE VIEW public.monthly_summary
  WITH (security_invoker = true)
AS
SELECT
  date_trunc('month', entry_date) AS month,
  branch_id,
  SUM(cut_color_1 + cut_color_2 + cut_color_3 + cut_color_4 + cut_color_5) AS total_cutting,
  SUM(pe_sending_qty)         AS total_pe_sending,
  SUM(pe_received_qty)        AS total_pe_received,
  SUM(swing_out_qty)          AS total_swing_out,
  SUM(swing_in_qty)           AS total_swing_in,
  SUM(qc_received_qty)        AS total_qc_received,
  SUM(qc_output_qty)          AS total_qc_output,
  SUM(qc_reject_qty)          AS total_reject,
  SUM(qc_alter_qty)           AS total_alter,
  SUM(qc_spot_qty)            AS total_spot,
  SUM(finished_goods_qty)     AS total_finished,
  SUM(dispatch_retail_qty)    AS total_retail,
  SUM(dispatch_wholesale_qty) AS total_wholesale,
  SUM(stock_warehouse)        AS stock_warehouse,
  SUM(stock_cutting)          AS stock_cutting,
  SUM(stock_swingline)        AS stock_swingline,
  SUM(stock_short)            AS stock_short
FROM production_entries
GROUP BY 1, 2;

-- ── Pin function search paths ─────────────────────────────────────────────────
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.get_my_role()       SET search_path = public;
