# GM Dashboard — Phase 1

A real, working version of the Alwyne Castle GM dashboard: login, a weekly
data-entry form, and a dashboard driven entirely by a generic KPI engine
(add new metrics in Supabase — no code changes needed).

## What this is

- **Auth**: email + password sign-up/sign-in via Supabase
- **Data model**: a `kpis` table (definitions: target, thresholds, direction)
  and a `kpi_entries` table (the actual numbers you enter each week) — see
  `supabase/schema.sql`
- **Data entry**: `/entry` — a form generated automatically from whatever
  KPIs exist in the database
- **Dashboard**: `/` — reads real data, computes red/amber/green status and
  variance itself using the KPI engine in `src/lib/kpiEngine.js`

Sections marked **"demo data"** on the dashboard (alerts, accountability
checklist, next meeting) aren't wired to real tables yet — that's Phase 2.
Everything else on the dashboard is live.

## Setup — do this once

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New project. Free tier is fine.

### 2. Run the schema
In your Supabase project: **SQL Editor → New query**, paste the entire
contents of `supabase/schema.sql`, and click **Run**. This creates all
tables, security policies, and seeds one site ("Alwyne Castle") plus a
starter set of KPIs.

### 3. Get your API keys
In Supabase: **Project Settings → API**. Copy the **Project URL** and the
**anon public** key.

### 4. Set environment variables

Locally, copy `.env.example` to `.env` and fill in the two values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

On Vercel: **Project Settings → Environment Variables**, add the same two
keys there, then redeploy.

### 5. Run it

```bash
npm install
npm run dev
```

Sign up with any email/password on the login screen — you're automatically
attached to the seeded site. Go to **Add weekly data**, enter some numbers,
save, and the dashboard populates with real figures, live variance, and
correct red/amber/green status.

## Adding or changing a KPI

No code change needed. In Supabase, insert a row into `kpis`:

```sql
insert into kpis (key, name, category, unit, direction, target, warning_pct, critical_pct, sort_order)
values ('food_cost_pct', 'Food Cost %', 'Stock', 'percent', 'lower_better', 28, 3, 8, 12);
```

It appears in the data-entry form automatically. To show it on the main
dashboard cards too, add its key to `TOP_ROW` or `SECOND_ROW` in
`src/pages/Dashboard.jsx`.

## Stack

React + Vite + Tailwind CSS v4 + Supabase (Postgres, Auth, Row Level Security)

## What's next (Phase 2+)

- Wire alerts, tasks, and management-meeting sections to real tables
- CSV upload as an alternative to manual entry
- Multi-site + director rollup view (the schema already has `sites` and
  `organisations` ready for this)
