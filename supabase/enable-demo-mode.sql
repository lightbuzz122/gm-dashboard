-- TEMPORARY — run this to demo without a login screen.
-- Run supabase/revert-demo-mode.sql afterward to put security back.

create policy "TEMP demo: anyone can read sites" on sites
  for select using (true);

create policy "TEMP demo: anyone can read kpi entries" on kpi_entries
  for select using (true);
