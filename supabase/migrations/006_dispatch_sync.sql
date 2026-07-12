-- Extend aggregate_production_entries to also sync dispatch into branch_dispatch
-- dispatch_no=1 is the auto-synced slot (sum of daily entries per branch)
-- dispatch_no=2 and 3 remain manually editable

create or replace function aggregate_production_entries()
returns trigger as $$
declare
  pid uuid;
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

  -- 2. PRINTING
  insert into printing (product_id, out_qty, in_qty)
  select pid, coalesce(sum(pe_sending_qty), 0), coalesce(sum(pe_received_qty), 0)
  from production_entries where product_id = pid
  on conflict (product_id) do update set
    out_qty = excluded.out_qty,
    in_qty  = excluded.in_qty;

  -- 3. SEWING
  insert into sewing (product_id, in_qty, out_qty)
  select pid, coalesce(sum(swing_in_qty), 0), coalesce(sum(swing_out_qty), 0)
  from production_entries where product_id = pid
  on conflict (product_id) do update set
    in_qty  = excluded.in_qty,
    out_qty = excluded.out_qty;

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
  -- Delete auto-synced rows first, then re-insert non-zero totals
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

-- Backfill: re-fire trigger for all linked entries to populate dispatch_no=1
update production_entries set id = id where product_id is not null;
