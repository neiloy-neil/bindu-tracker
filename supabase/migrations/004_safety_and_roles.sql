-- 1. Soft Deletes
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_production_entries_is_deleted ON production_entries(is_deleted);
CREATE INDEX IF NOT EXISTS idx_vendors_is_deleted ON vendors(is_deleted);

-- Update the product_summary view to include is_deleted
DROP VIEW IF EXISTS product_summary;

CREATE VIEW product_summary AS
SELECT
  p.id, p.product_code, p.product_name, p.image_url,
  p.production_start_date, p.complete_date, p.current_stage, p.notes,
  c.total_qty   as cutting_total_qty,
  c.total_kg    as cutting_total_kg,
  pr.status     as print_status,
  s.status      as sew_status,
  q.status      as qc_status,
  q.out_qty     as qc_out_qty,
  q.reject_qty  as qc_reject_qty,
  f.received_qty as finishing_qty,
  w.total_qty   as stock_total,
  p.created_at, p.updated_at,
  p.is_deleted
FROM products p
LEFT JOIN cutting         c  on c.product_id  = p.id
LEFT JOIN printing        pr on pr.product_id = p.id
LEFT JOIN sewing          s  on s.product_id  = p.id
LEFT JOIN qc              q  on q.product_id  = p.id
LEFT JOIN finishing       f  on f.product_id  = p.id
LEFT JOIN warehouse_stock w  on w.product_id  = p.id
WHERE p.is_deleted = false;

-- 2. User Roles (RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('Admin', 'Manager', 'Viewer')) DEFAULT 'Viewer',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role" ON user_roles 
  FOR SELECT USING (auth.uid() = user_id);

-- Optional: Function to get role (useful for RLS or client)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
