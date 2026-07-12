-- 1. Extend aggregate_production_entries to auto-set printing and sewing status
--    based on synced qty: if received > 0 → completed status, else if sent > 0 → in-progress
create or replace function aggregate_production_entries()
returns trigger as $$
declare
  pid uuid;
  p_out integer; p_in integer;
  s_out integer; s_in integer;
begin
  if (TG_OP = 'DELETE') then
    pid := OLD.product_id;
  else
    pid := NEW.product_id;
  end if;

  if pid is null then
    if (TG_OP = 'DELETE') then return OLD; else return NEW; end if;
  end if;

  -- 1. CUTTING
  insert into cutting (
    product_id, color_1_qty, color_2_qty, color_3_qty, color_4_qty, color_5_qty
  )
  select
    pid,
    coalesce(sum(cut_color_1), 0),
    coalesce(sum(cut_color_2), 0),
    coalesce(sum(cut_color_3), 0),
    coalesce(sum(cut_color_4), 0),
    coalesce(sum(cut_color_5), 0)
  from production_entries
  where product_id = pid
  on conflict (product_id) do update set
    color_1_qty = excluded.color_1_qty,
    color_2_qty = excluded.color_2_qty,
    color_3_qty = excluded.color_3_qty,
    color_4_qty = excluded.color_4_qty,
    color_5_qty = excluded.color_5_qty;

  -- 2. PRINTING (with auto status)
  select
    coalesce(sum(pe_sending_qty), 0),
    coalesce(sum(pe_received_qty), 0)
  into p_out, p_in
  from production_entries where product_id = pid;

  insert into printing (product_id, out_qty, in_qty, status)
  values (
    pid, p_out, p_in,
    case
      when p_in  > 0 then 'Received from Print'
      when p_out > 0 then 'Out for Print'
      else null
    end
  )
  on conflict (product_id) do update set
    out_qty = excluded.out_qty,
    in_qty  = excluded.in_qty,
    status  = excluded.status;

  -- 3. SEWING (with auto status)
  select
    coalesce(sum(swing_out_qty), 0),
    coalesce(sum(swing_in_qty), 0)
  into s_out, s_in
  from production_entries where product_id = pid;

  insert into sewing (product_id, out_qty, in_qty, status)
  values (
    pid, s_out, s_in,
    case
      when s_in  > 0 then 'Completed'
      when s_out > 0 then 'Ongoing'
      else null
    end
  )
  on conflict (product_id) do update set
    out_qty = excluded.out_qty,
    in_qty  = excluded.in_qty,
    status  = excluded.status;

  -- 4. QC
  insert into qc (product_id, in_qty, out_qty, reject_qty, alter_qty, spot_qty)
  select pid,
    coalesce(sum(qc_received_qty), 0), coalesce(sum(qc_output_qty), 0),
    coalesce(sum(qc_reject_qty), 0),   coalesce(sum(qc_alter_qty), 0),
    coalesce(sum(qc_spot_qty), 0)
  from production_entries where product_id = pid
  on conflict (product_id) do update set
    in_qty     = excluded.in_qty,
    out_qty    = excluded.out_qty,
    reject_qty = excluded.reject_qty,
    alter_qty  = excluded.alter_qty,
    spot_qty   = excluded.spot_qty;

  -- 5. FINISHING
  insert into finishing (product_id, received_qty)
  select pid, coalesce(sum(finished_goods_qty), 0)
  from production_entries where product_id = pid
  on conflict (product_id) do update set
    received_qty = excluded.received_qty;

  -- 6. DISPATCH (auto-sync → dispatch_no = 1 per branch)
  delete from branch_dispatch where product_id = pid and dispatch_no = 1;

  insert into branch_dispatch (product_id, branch_name, dispatch_no, dispatch_date, qty)
  select
    pid,
    b.name,
    1,
    max(pe.entry_date),
    sum(pe.dispatch_retail_qty + pe.dispatch_wholesale_qty)
  from production_entries pe
  join branches b on b.id = pe.branch_id
  where pe.product_id = pid
    and pe.branch_id is not null
  group by b.name
  having sum(pe.dispatch_retail_qty + pe.dispatch_wholesale_qty) > 0;

  if (TG_OP = 'DELETE') then return OLD; else return NEW; end if;
end;
$$ language plpgsql;

-- 2. Add total_dispatched to product_summary view (must drop+recreate to add column)
drop view if exists product_summary;
create view product_summary as
select
  p.id, p.product_code, p.product_name, p.image_url,
  p.production_start_date, p.complete_date, p.current_stage, p.notes,
  c.total_qty    as cutting_total_qty,
  c.total_kg     as cutting_total_kg,
  pr.status      as print_status,
  s.status       as sew_status,
  q.status       as qc_status,
  q.out_qty      as qc_out_qty,
  q.reject_qty   as qc_reject_qty,
  f.received_qty as finishing_qty,
  w.total_qty    as stock_total,
  coalesce(d.total_dispatched, 0) as total_dispatched,
  p.created_at, p.updated_at
from products p
left join cutting         c  on c.product_id  = p.id
left join printing        pr on pr.product_id = p.id
left join sewing          s  on s.product_id  = p.id
left join qc              q  on q.product_id  = p.id
left join finishing       f  on f.product_id  = p.id
left join warehouse_stock w  on w.product_id  = p.id
left join (
  select product_id, sum(qty) as total_dispatched
  from branch_dispatch
  group by product_id
) d on d.product_id = p.id;

-- Backfill: re-fire trigger for all linked entries
update production_entries set id = id where product_id is not null;
