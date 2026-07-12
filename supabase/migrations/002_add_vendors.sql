create table vendors (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  type text check (type in ('printing', 'sewing', 'both')),
  active boolean default true,
  created_at timestamptz default now()
);

alter table vendors enable row level security;
create policy "auth_all" on vendors for all to authenticated using (true) with check (true);
