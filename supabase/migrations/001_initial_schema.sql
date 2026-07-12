-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── BRANCHES ────────────────────────────────────────────────────────────────
create table branches (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  type        text check (type in ('retail', 'wholesale', 'head_office')),
  active      boolean default true,
  created_at  timestamptz default now()
);

insert into branches (name, type) values
  ('Aziz-1',    'retail'),
  ('Aziz-2',    'retail'),
  ('Aziz-3',    'retail'),
  ('Cox-1',     'retail'),
  ('Cox-2',     'retail'),
  ('Cox-3',     'retail'),
  ('Teknaf',    'retail'),
  ('Basurhat',  'retail'),
  ('Jessore',   'wholesale'),
  ('Barisal',   'wholesale'),
  ('Lamabazar', 'wholesale'),
  ('Dorgagate', 'wholesale'),
  ('Online',    'retail');

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
create table products (
  id                    uuid primary key default uuid_generate_v4(),
  product_code          text unique not null,
  product_name          text not null,
  image_url             text,
  production_start_date date,
  complete_date         date,
  current_stage         text default 'Cutting',
  notes                 text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── CUTTING ─────────────────────────────────────────────────────────────────
create table cutting (
  id             uuid primary key default uuid_generate_v4(),
  product_id     uuid references products(id) on delete cascade,
  color_1_name   text, color_1_qty  integer default 0,
  color_2_name   text, color_2_qty  integer default 0,
  color_3_name   text, color_3_qty  integer default 0,
  color_4_name   text, color_4_qty  integer default 0,
  color_5_name   text, color_5_qty  integer default 0,
  color_6_name   text, color_6_qty  integer default 0,
  total_qty      integer generated always as (
    color_1_qty + color_2_qty + color_3_qty +
    color_4_qty + color_5_qty + color_6_qty
  ) stored,
  total_kg       numeric(10,2),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(product_id)
);

-- ─── PRINTING / EMBROIDERY ───────────────────────────────────────────────────
create table printing (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid references products(id) on delete cascade,
  vendor_name  text,
  sending_date date,
  out_qty      integer default 0,
  recv_date    date,
  in_qty       integer default 0,
  short_qty    integer default 0,
  status       text check (status in ('Out for Print', 'Received from Print')),
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(product_id)
);

-- ─── SEWING ──────────────────────────────────────────────────────────────────
create table sewing (
  id           uuid primary key default uuid_generate_v4(),
  product_id   uuid references products(id) on delete cascade,
  vendor_name  text,
  out_qty      integer default 0,
  in_qty       integer default 0,
  status       text check (status in ('Ongoing', 'Completed', 'HOLD')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(product_id)
);

-- ─── QC ──────────────────────────────────────────────────────────────────────
create table qc (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references products(id) on delete cascade,
  in_qty      integer default 0,
  out_qty     integer default 0,
  reject_qty  integer default 0,
  alter_qty   integer default 0,
  spot_qty    integer default 0,
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

-- ─── BRANCH DISPATCH (product-wise) ─────────────────────────────────────────
-- Up to 3 dispatch slots per branch per product
create table branch_dispatch (
  id             uuid primary key default uuid_generate_v4(),
  product_id     uuid references products(id) on delete cascade,
  branch_name    text not null,
  dispatch_no    integer not null check (dispatch_no in (1, 2, 3)),
  dispatch_date  date,
  qty            integer default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(product_id, branch_name, dispatch_no)
);

-- ─── WAREHOUSE STOCK (product-wise) ─────────────────────────────────────────
create table warehouse_stock (
  id             uuid primary key default uuid_generate_v4(),
  product_id     uuid references products(id) on delete cascade,
  color_1_name   text, color_1_qty  integer default 0,
  color_2_name   text, color_2_qty  integer default 0,
  color_3_name   text, color_3_qty  integer default 0,
  color_4_name   text, color_4_qty  integer default 0,
  color_5_name   text, color_5_qty  integer default 0,
  color_6_name   text, color_6_qty  integer default 0,
  total_qty      integer generated always as (
    color_1_qty + color_2_qty + color_3_qty +
    color_4_qty + color_5_qty + color_6_qty
  ) stored,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(product_id)
);

-- ─── DAILY PRODUCTION ENTRIES ────────────────────────────────────────────────
-- Daily operational log: up to 6 design codes per date per branch
create table production_entries (
  id                    uuid primary key default uuid_generate_v4(),
  entry_date            date not null,
  design_code           text not null,
  branch_id             uuid references branches(id),
  product_id            uuid references products(id), -- optional link to product tracker

  -- Cutting (5 colors in daily view)
  cut_color_1           integer default 0,
  cut_color_2           integer default 0,
  cut_color_3           integer default 0,
  cut_color_4           integer default 0,
  cut_color_5           integer default 0,

  -- Printing / Embroidery
  pe_vendor_name        text,
  pe_sending_qty        integer default 0,
  pe_received_qty       integer default 0,

  -- Sewing / Swing
  swing_vendor_name     text,
  swing_out_qty         integer default 0,
  swing_in_qty          integer default 0,

  -- QC
  qc_received_qty       integer default 0,
  qc_output_qty         integer default 0,
  qc_reject_qty         integer default 0,
  qc_alter_qty          integer default 0,
  qc_spot_qty           integer default 0,

  -- Finished
  finished_goods_qty    integer default 0,

  -- Branch dispatch
  dispatch_retail_qty   integer default 0,
  dispatch_wholesale_qty integer default 0,

  -- Stock
  stock_warehouse       integer default 0,
  stock_cutting         integer default 0,
  stock_swingline       integer default 0,
  stock_short           integer default 0,

  -- Meta
  created_by            uuid references auth.users(id),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_pe_date         on production_entries(entry_date);
create index idx_pe_branch       on production_entries(branch_id);
create index idx_pe_date_branch  on production_entries(entry_date, branch_id);

-- ─── AUTO-UPDATE updated_at ──────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_products_upd     before update on products          for each row execute function update_updated_at();
create trigger trg_cutting_upd      before update on cutting            for each row execute function update_updated_at();
create trigger trg_printing_upd     before update on printing           for each row execute function update_updated_at();
create trigger trg_sewing_upd       before update on sewing             for each row execute function update_updated_at();
create trigger trg_qc_upd           before update on qc                 for each row execute function update_updated_at();
create trigger trg_finishing_upd    before update on finishing           for each row execute function update_updated_at();
create trigger trg_dispatch_upd     before update on branch_dispatch     for each row execute function update_updated_at();
create trigger trg_stock_upd        before update on warehouse_stock     for each row execute function update_updated_at();
create trigger trg_pe_upd           before update on production_entries  for each row execute function update_updated_at();

-- ─── PRODUCT SUMMARY VIEW ────────────────────────────────────────────────────
create or replace view product_summary as
select
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
  p.created_at, p.updated_at
from products p
left join cutting         c  on c.product_id  = p.id
left join printing        pr on pr.product_id = p.id
left join sewing          s  on s.product_id  = p.id
left join qc              q  on q.product_id  = p.id
left join finishing       f  on f.product_id  = p.id
left join warehouse_stock w  on w.product_id  = p.id;

-- ─── MONTHLY SUMMARY VIEW ────────────────────────────────────────────────────
create or replace view monthly_summary as
select
  date_trunc('month', entry_date) as month,
  branch_id,
  sum(cut_color_1 + cut_color_2 + cut_color_3 + cut_color_4 + cut_color_5) as total_cutting,
  sum(pe_sending_qty)       as total_pe_sending,
  sum(pe_received_qty)      as total_pe_received,
  sum(swing_out_qty)        as total_swing_out,
  sum(swing_in_qty)         as total_swing_in,
  sum(qc_received_qty)      as total_qc_received,
  sum(qc_output_qty)        as total_qc_output,
  sum(qc_reject_qty)        as total_reject,
  sum(qc_alter_qty)         as total_alter,
  sum(qc_spot_qty)          as total_spot,
  sum(finished_goods_qty)   as total_finished,
  sum(dispatch_retail_qty)  as total_retail,
  sum(dispatch_wholesale_qty) as total_wholesale,
  sum(stock_warehouse)      as stock_warehouse,
  sum(stock_cutting)        as stock_cutting,
  sum(stock_swingline)      as stock_swingline,
  sum(stock_short)          as stock_short
from production_entries
group by 1, 2;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table branches           enable row level security;
alter table products           enable row level security;
alter table cutting            enable row level security;
alter table printing           enable row level security;
alter table sewing             enable row level security;
alter table qc                 enable row level security;
alter table finishing          enable row level security;
alter table branch_dispatch    enable row level security;
alter table warehouse_stock    enable row level security;
alter table production_entries enable row level security;

-- All authenticated users can read/write (tighten per-role later)
create policy "auth_all" on branches           for all to authenticated using (true) with check (true);
create policy "auth_all" on products           for all to authenticated using (true) with check (true);
create policy "auth_all" on cutting            for all to authenticated using (true) with check (true);
create policy "auth_all" on printing           for all to authenticated using (true) with check (true);
create policy "auth_all" on sewing             for all to authenticated using (true) with check (true);
create policy "auth_all" on qc                 for all to authenticated using (true) with check (true);
create policy "auth_all" on finishing          for all to authenticated using (true) with check (true);
create policy "auth_all" on branch_dispatch    for all to authenticated using (true) with check (true);
create policy "auth_all" on warehouse_stock    for all to authenticated using (true) with check (true);
create policy "auth_read" on production_entries for select to authenticated using (true);
create policy "auth_insert" on production_entries for insert to authenticated with check (auth.uid() = created_by);
create policy "auth_update" on production_entries for update to authenticated using (auth.uid() = created_by);
