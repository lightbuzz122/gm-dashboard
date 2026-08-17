-- Phase 1b — Admin, Tasks & Actions, Compliance checklist, audit log
-- Run this in Supabase SQL Editor after the original schema.sql

-- ---------- Tasks & handover notes ----------
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'task' check (type in ('task','handover')),
  assigned_to text,          -- free-text name/email for now; becomes a real user link in Phase 3
  status text not null default 'open' check (status in ('open','in_progress','done')),
  due_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table tasks enable row level security;

create policy "read own site tasks" on tasks
  for select using (site_id in (select site_id from profiles where id = auth.uid()));
create policy "insert own site tasks" on tasks
  for insert with check (site_id in (select site_id from profiles where id = auth.uid()));
create policy "update own site tasks" on tasks
  for update using (site_id in (select site_id from profiles where id = auth.uid()));

-- ---------- Daily compliance checklist ----------
create table if not exists compliance_checks (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  check_date date not null default current_date,
  period text not null check (period in ('morning','daytime','evening')),
  item text not null,             -- e.g. 'Fridge 1 Temperature', 'Allergen Check'
  value text,                     -- reading or free-text note
  status text not null default 'pass' check (status in ('pass','fail','na')),
  completed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table compliance_checks enable row level security;

create policy "read own site compliance checks" on compliance_checks
  for select using (site_id in (select site_id from profiles where id = auth.uid()));
create policy "insert own site compliance checks" on compliance_checks
  for insert with check (site_id in (select site_id from profiles where id = auth.uid()));

-- ---------- Audit log for KPI entry edits ----------
create table if not exists kpi_audit_log (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references sites(id) on delete cascade,
  kpi_key text,
  period_start date,
  old_value numeric,
  new_value numeric,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);

alter table kpi_audit_log enable row level security;

create policy "read own site audit log" on kpi_audit_log
  for select using (site_id in (select site_id from profiles where id = auth.uid()));

-- Auto-log every insert/update to kpi_entries
create or replace function public.log_kpi_entry_change()
returns trigger as $$
begin
  insert into public.kpi_audit_log (site_id, kpi_key, period_start, old_value, new_value, changed_by)
  values (
    new.site_id,
    new.kpi_key,
    new.period_start,
    case when tg_op = 'UPDATE' then old.value else null end,
    new.value,
    auth.uid()
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_kpi_entry_change on kpi_entries;
create trigger on_kpi_entry_change
  after insert or update on kpi_entries
  for each row execute procedure public.log_kpi_entry_change();

-- ---------- Allow updating kpi definitions (Admin's metric toggle) ----------
create policy "authenticated users can update kpis" on kpis
  for update using (auth.role() = 'authenticated');
