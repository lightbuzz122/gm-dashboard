-- Run this to put security back after a demo.

drop policy if exists "TEMP demo: anyone can read sites" on sites;
drop policy if exists "TEMP demo: anyone can read kpi entries" on kpi_entries;
