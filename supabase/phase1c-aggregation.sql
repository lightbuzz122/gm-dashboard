-- Phase 1c — supports Monthly/Yearly rollups and forecasting.
-- Run this once in Supabase SQL Editor before importing the CSV.

alter table kpis add column if not exists aggregation text not null default 'sum'
  check (aggregation in ('sum', 'average'));

-- Flow metrics (money, hours, counts) get summed across a month/year.
-- Rate metrics (%, scores) get averaged instead — summing a percentage
-- across weeks would be meaningless.
update kpis set aggregation = 'average' where key in (
  'labour_pct', 'review_score', 'nps', 'safety_checks_pct',
  'action_tickets_pct', 'draught_yield_pct'
);
