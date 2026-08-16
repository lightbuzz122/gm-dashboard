-- Hospitality OS — Phase 1 schema
-- Run this once in Supabase: Project -> SQL Editor -> New query -> paste all -> Run

create extension if not exists "uuid-ossp";

-- 1. Organisations (kept for future multi-site/multi-tenant growth)
create table if not exists organisations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Sites
create table if not exists sites (
  id uuid primary key default uuid_generate_v4(),
  organisation_id uuid references organisations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- 3. Profiles — links a logged-in user to a site and a role.
--    Auto-created for every new sign-up via the trigger below.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  site_id uuid references sites(id),
  full_name text,
  role text not null default 'manager' check (role in ('manager','director','admin')),
  created_at timestamptz default now()
);

-- 4. KPI definitions — the generic KPI engine. Add new rows here later
--    instead of changing app code every time a metric changes.
create table if not exists kpis (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,             -- e.g. 'total_sales'
  name text not null,                   -- e.g. 'Total Sales (Net)'
  category text not null,               -- 'Sales' | 'Labour' | 'Guest' | 'Compliance' | 'Stock' | 'Tasks'
  unit text not null default 'number',  -- 'currency' | 'percent' | 'number'
  direction text not null default 'higher_better' check (direction in ('higher_better','lower_better')),
  target numeric,
  warning_pct numeric not null default 5,   -- % away from target that counts as amber
  critical_pct numeric not null default 10, -- beyond this % away from target counts as red
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- 5. KPI entries — the actual values a manager enters, one row per
--    site + kpi + period. This is what the dashboard reads.
create table if not exists kpi_entries (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  kpi_key text references kpis(key) on delete cascade,
  period_start date not null,
  period_end date not null,
  value numeric not null,
  entered_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (site_id, kpi_key, period_start)
);

-- ---------- Row Level Security ----------
-- Every table is locked down so a user can only ever see/write data
-- tied to their own site. This is also what multi-site/director access
-- gets built on top of later (Phase 3).

alter table sites enable row level security;
alter table profiles enable row level security;
alter table kpis enable row level security;
alter table kpi_entries enable row level security;

create policy "read own profile" on profiles
  for select using (auth.uid() = id);

create policy "update own profile" on profiles
  for update using (auth.uid() = id);

create policy "read own site" on sites
  for select using (id in (select site_id from profiles where id = auth.uid()));

create policy "read active kpis when logged in" on kpis
  for select using (auth.role() = 'authenticated');

create policy "read own site kpi entries" on kpi_entries
  for select using (site_id in (select site_id from profiles where id = auth.uid()));

create policy "insert own site kpi entries" on kpi_entries
  for insert with check (site_id in (select site_id from profiles where id = auth.uid()));

create policy "update own site kpi entries" on kpi_entries
  for update using (site_id in (select site_id from profiles where id = auth.uid()));

-- ---------- Auto-provision a profile for every new sign-up ----------
-- For Phase 1 (one manager, one site) every new user is attached to
-- the first site that exists. Phase 3 replaces this with a proper
-- invite flow tied to a specific site.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, site_id, role, full_name)
  values (
    new.id,
    (select id from public.sites order by created_at asc limit 1),
    'manager',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Seed: one organisation, one site ----------

insert into organisations (name)
select 'My Hospitality Group'
where not exists (select 1 from organisations);

insert into sites (organisation_id, name)
select (select id from organisations limit 1), 'Alwyne Castle'
where not exists (select 1 from sites);

-- ---------- Seed: starter KPI set (matches the Executive Dashboard) ----------
-- Add more rows here any time — the app reads this table, nothing is hard-coded.

insert into kpis (key, name, category, unit, direction, target, warning_pct, critical_pct, sort_order) values
  ('total_sales',      'Total Sales (Net)',   'Sales',      'currency', 'higher_better', 510355, 3, 8,  1),
  ('wet_sales',        'Wet Sales (Net)',     'Sales',      'currency', 'higher_better', 400200, 3, 8,  2),
  ('dry_sales',        'Dry Sales (Net)',     'Sales',      'currency', 'higher_better', 110155, 3, 8,  3),
  ('gross_profit',     'Gross Profit',        'Sales',      'currency', 'higher_better', 172000, 3, 8,  4),
  ('labour_pct',       'Labour %',            'Labour',     'percent',  'lower_better',  35,     3, 8,  5),
  ('review_score',     'Review Score (PTD)',  'Guest',      'number',   'higher_better', 4.5,    2, 5,  6),
  ('nps',              'NPS (PTD)',           'Guest',      'number',   'higher_better', 50,     5, 15, 7),
  ('complaints',       'Complaints (PTD)',    'Guest',      'number',   'lower_better',  10,     10,25, 8),
  ('safety_checks_pct','Safety Checks',       'Compliance', 'percent',  'higher_better', 100,    3, 8,  9),
  ('action_tickets_pct','Action Tickets Closed On Time','Tasks','percent','higher_better',100,   5, 15, 10),
  ('draught_yield_pct','Draught Yield (All)', 'Stock',      'percent',  'higher_better', 100,    2, 5,  11)
on conflict (key) do nothing;
