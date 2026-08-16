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
