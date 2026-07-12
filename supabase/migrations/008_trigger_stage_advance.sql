-- Extend aggregate_production_entries to auto-advance products.current_stage
-- Uses the same logic as the client-side refreshProductStage utility.
create or replace function aggregate_production_entries()
returns trigger as $$
declare
  pid           uuid;
  p_out         integer; p_in integer;
  s_out         integer; s_in integer;
  -- stage computation
  v_complete    date;
  v_cut_qty     integer;
  v_print_out   integer; v_print_status text;
  v_sew_out     integer; v_sew_status   text;
  v_qc_in       integer; v_qc_status    text;
  v_finish_qty  integer;
  v_stage       text;
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

  -- 7. STAGE AUTO-ADVANCE
  -- Read fresh values from the rows we just upserted
  select complete_date into v_complete from products where id = pid;
  select total_qty     into v_cut_qty  from cutting  where product_id = pid;
  select out_qty, status into v_print_out, v_print_status from printing where product_id = pid;
  select out_qty, status into v_sew_out,   v_sew_status   from sewing   where product_id = pid;
  select in_qty,  status into v_qc_in,     v_qc_status    from qc       where product_id = pid;
  select received_qty   into v_finish_qty  from finishing  where product_id = pid;

  v_stage := case
    when v_complete    is not null              then 'Completed'
    when coalesce(v_finish_qty, 0)  > 0         then 'Finishing'
    when v_qc_status   = 'Completed'            then 'Finishing'
    when coalesce(v_qc_in, 0)       > 0         then 'QC'
    when v_sew_status  = 'Completed'            then 'QC'
    when coalesce(v_sew_out, 0)     > 0         then 'Sewing'
    when v_print_status = 'Received from Print' then 'Sewing'
    when coalesce(v_print_out, 0)   > 0         then 'Printing'
    else 'Cutting'
  end;

  update products set current_stage = v_stage where id = pid;

  if (TG_OP = 'DELETE') then return OLD; else return NEW; end if;
end;
$$ language plpgsql;

-- Backfill: re-fire trigger for all linked entries to advance stages now
update production_entries set id = id where product_id is not null;
