-- Auto activity log: written by the app whenever product tracker data is saved.
-- This replaces the manual daily entry sheet as the source of daily activity.
CREATE TABLE IF NOT EXISTS product_activity_log (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   uuid REFERENCES products(id) ON DELETE CASCADE,
  product_code text NOT NULL,
  product_name text NOT NULL,
  action       text NOT NULL,   -- e.g. 'Cutting', 'Dispatch', 'Stage'
  details      text,            -- human-readable summary
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_product ON product_activity_log(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date    ON product_activity_log(created_at DESC);

ALTER TABLE product_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON product_activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
