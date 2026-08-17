# GM Dashboard — Phase 1c: Full metrics, Monthly/Yearly, Forecasting

Adds most of the raw-input metrics from the full spec, plus:

- **Weekly / Month-to-Date / Year-to-Date toggle** on every category page
  (Sales & Profit, Labour, Guest Experience, Stock & Waste, People). Flow
  metrics (£, hours) sum across the period; rate metrics (%, scores)
  average instead — summing a percentage across weeks would be meaningless.
- **Simple trend forecast** ("Next week trend") on each metric, based on a
  straight-line trend through recent actuals. This is a directional
  heads-up, not a real forecasting model — good enough to flag "labour's
  been creeping up for 4 weeks" but not to bet the business on.

## Setup — run these two things in order

1. **Run `supabase/phase1c-aggregation.sql`** in Supabase's SQL Editor
   (adds the column that controls sum vs average — takes a few seconds).
2. **Import `new-kpis-import.csv`** — in Supabase: Table Editor → `kpis`
   table → the Insert/Import button near the top → Import data from CSV →
   select the file. This adds ~20 new metrics pulled from the full spec
   (sales discounts/promotions, COGS, forecasts, labour hours by type,
   FOH/BOH labour cost, social posts, preorders, upsells, stock variance,
   waste, training completion). No manual typing needed.

After both, go to Admin → Metrics to see everything, tick off anything
you don't want tracked yet, and go to Add Weekly Data — the new fields
appear there automatically.

## What's deliberately NOT in the CSV

Anything that's really a *record*, not a single weekly number — OOS
events, action tickets, maintenance jobs, individual employee training
records, management meeting minutes. Those need their own tables and
their own screens, same as Tasks and Compliance already got. Worth doing
next once the weekly numbers are bedded in.

## Simplification worth knowing about

The spec distinguishes Budget vs Contract vs Forecast vs Actual as four
separate tracked figures. For now, "Target" in the `kpis` table plays the
role of Budget/Contract combined, and Forecast is entered as its own
metric (`sales_forecast_wet`/`sales_forecast_dry`) so Forecast Accuracy
can eventually be calculated as Actual ÷ Forecast. If you need Budget and
Contract tracked as genuinely separate numbers later, that's a small
schema addition, not a rebuild.
