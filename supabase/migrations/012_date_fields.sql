-- Add missing date and qty fields to stage tables
alter table cutting   add column if not exists start_date      date;
alter table sewing    add column if not exists sending_date    date;
alter table sewing    add column if not exists short_qty       integer default 0;
alter table qc        add column if not exists start_date      date;
alter table finishing add column if not exists start_date      date;
alter table finishing add column if not exists completed_date  date;
