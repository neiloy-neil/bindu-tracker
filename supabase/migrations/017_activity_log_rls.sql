-- Add RLS to product_activity_log (missed in 016)
ALTER TABLE product_activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_activity_log' AND policyname = 'auth_all'
  ) THEN
    CREATE POLICY "auth_all" ON product_activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;
