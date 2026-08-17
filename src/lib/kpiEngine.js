// The KPI engine: pure functions that turn a kpi definition + an actual
// value into a status and a display string. Add new KPIs in Supabase
// (the `kpis` table) — nothing here needs to change when you do.

export function percentVariance(actual, target) {
  if (actual == null || target == null || target === 0) return null;
  return ((actual - target) / Math.abs(target)) * 100;
}

// Returns 'green' | 'amber' | 'red' | 'unknown'
export function computeStatus(kpi, actual) {
  if (actual == null || kpi?.target == null) return "unknown";
  const diffPct = percentVariance(actual, kpi.target);
  const isOnOrAheadOfTarget =
    kpi.direction === "higher_better" ? diffPct >= 0 : diffPct <= 0;
  if (isOnOrAheadOfTarget) return "green";
  const absDiff = Math.abs(diffPct);
  if (absDiff <= kpi.warning_pct) return "amber";
  return "red";
}

export const STATUS_COLOR = {
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  unknown: "#64748b",
};

export function formatValue(value, unit) {
  if (value == null || Number.isNaN(value)) return "—";
  const n = Number(value);
  if (unit === "currency") return "£" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (unit === "percent") return n.toFixed(1) + "%";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatDelta(actual, target, unit) {
  if (actual == null || target == null) return "—";
  const diff = actual - target;
  const sign = diff > 0 ? "+" : "";
  if (unit === "currency") return sign + "£" + Math.round(diff).toLocaleString();
  if (unit === "percent") return sign + diff.toFixed(1) + "pp";
  return sign + diff.toFixed(1);
}

// Combine a set of weekly entries into a Month-to-Date or Year-to-Date
// figure. 'sum' for flow metrics (sales, hours, £), 'average' for rate
// metrics (%, scores) — summing a percentage across weeks is meaningless.
export function aggregate(entries, method = "sum") {
  if (!entries || entries.length === 0) return null;
  const values = entries.map((e) => e.value);
  if (method === "average") {
    return values.reduce((s, v) => s + v, 0) / values.length;
  }
  return values.reduce((s, v) => s + v, 0);
}

export function filterByRange(entries, range) {
  if (range === "week") return entries.slice(-1); // just the latest week
  const now = new Date();
  return (entries || []).filter((e) => {
    const d = new Date(e.period_start);
    if (range === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (range === "year") return d.getFullYear() === now.getFullYear();
    return true;
  });
}

// Simple linear-trend forecast for the next period, based on history.
// Not a substitute for a real forecasting model — it's a straight-line
// trend through recent actuals, useful as a directional heads-up.
export function forecastNext(entries, n = 8) {
  const recent = (entries || []).slice(-n);
  if (recent.length < 3) return null; // not enough history to trend meaningfully
  const pts = recent.map((e, i) => [i, e.value]);
  const len = pts.length;
  const sumX = pts.reduce((s, [x]) => s + x, 0);
  const sumY = pts.reduce((s, [, y]) => s + y, 0);
  const sumXY = pts.reduce((s, [x, y]) => s + x * y, 0);
  const sumXX = pts.reduce((s, [x]) => s + x * x, 0);
  const denom = len * sumXX - sumX * sumX;
  if (denom === 0) return recent[recent.length - 1].value;
  const slope = (len * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / len;
  return slope * len + intercept;
}
