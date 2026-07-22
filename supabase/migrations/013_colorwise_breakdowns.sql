-- Color-wise received qty for printing (uses color names from cutting table)
alter table printing add column if not exists recv_color_1_qty integer default 0;
alter table printing add column if not exists recv_color_2_qty integer default 0;
alter table printing add column if not exists recv_color_3_qty integer default 0;
alter table printing add column if not exists recv_color_4_qty integer default 0;
alter table printing add column if not exists recv_color_5_qty integer default 0;
alter table printing add column if not exists recv_color_6_qty integer default 0;

-- Color-wise received qty for sewing
alter table sewing add column if not exists recv_color_1_qty integer default 0;
alter table sewing add column if not exists recv_color_2_qty integer default 0;
alter table sewing add column if not exists recv_color_3_qty integer default 0;
alter table sewing add column if not exists recv_color_4_qty integer default 0;
alter table sewing add column if not exists recv_color_5_qty integer default 0;
alter table sewing add column if not exists recv_color_6_qty integer default 0;

-- Color-wise in qty for finishing
alter table finishing add column if not exists in_color_1_qty integer default 0;
alter table finishing add column if not exists in_color_2_qty integer default 0;
alter table finishing add column if not exists in_color_3_qty integer default 0;
alter table finishing add column if not exists in_color_4_qty integer default 0;
alter table finishing add column if not exists in_color_5_qty integer default 0;
alter table finishing add column if not exists in_color_6_qty integer default 0;
