import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, TrendingUp } from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { useKpiData, useSiteId } from "./Dashboard";
import { computeStatus, formatValue, formatDelta, STATUS_COLOR, aggregate, filterByRange, forecastNext } from "../lib/kpiEngine";

const RANGES = [
  { key: "week", label: "This Week" },
  { key: "month", label: "Month to Date" },
  { key: "year", label: "Year to Date" },
];

export default function CategoryPage() {
  const { category } = useParams();
  const siteId = useSiteId();
  const { kpiDefs, entriesByKpi, loading } = useKpiData(siteId);
  const [range, setRange] = useState("week");

  const items = kpiDefs.filter((k) => k.category === category && k.active);

  return (
    <Layout>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{category}</h1>
          <p className="text-slate-500 mt-1">Every tracked metric in this category, live from your data.</p>
        </div>
        <Link to="/entry" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition text-white rounded-lg px-3 py-2">
          <Plus size={14} /> Add weekly data
        </Link>
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className={`px-4 py-2 rounded-lg text-sm ${range === r.key ? "bg-indigo-600 text-white" : "bg-[#121826] text-slate-400 border border-white/10"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card className="p-10 text-center text-slate-500">Loading…</Card>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          No active metrics in this category yet. Add or enable some from the Admin tab.
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {items.map((kpi) => {
            const allEntries = entriesByKpi[kpi.key] || [];
            const rangeEntries = filterByRange(allEntries, range);
            const actual = aggregate(rangeEntries, kpi.aggregation || "sum");
            // For week-range, target compares as-is; for month/year, scale
            // a weekly target roughly by how many weeks are in range so
            // the comparison stays meaningful for summed (flow) metrics.
            const target = kpi.target == null ? null :
              (kpi.aggregation === "average" || range === "week") ? kpi.target :
              kpi.target * Math.max(1, rangeEntries.length);
            const statusKpi = { ...kpi, target };
            const status = computeStatus(statusKpi, actual);
            const good = status === "green" ? true : status === "unknown" ? null : false;
            const forecast = range === "week" ? forecastNext(allEntries) : null;

            return (
              <Card key={kpi.key} className="p-4">
                <div className="text-[11px] text-slate-500 mb-2">{kpi.name}</div>
                <div className="text-2xl font-semibold" style={{ color: STATUS_COLOR[status] }}>
                  {formatValue(actual, kpi.unit)}
                </div>
                <div className="flex gap-2 text-[11px] mt-1">
                  <span className="text-slate-500">vs Target {formatValue(target, kpi.unit)}</span>
                  <span className={good ? "text-emerald-400" : good === false ? "text-red-400" : "text-slate-500"}>
                    {formatDelta(actual, target, kpi.unit)}
                  </span>
                </div>
                {forecast != null && (
                  <div className="flex items-center gap-1 text-[11px] text-indigo-400 mt-2 pt-2 border-t border-white/5">
                    <TrendingUp size={12} />
                    Next week trend: {formatValue(forecast, kpi.unit)}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
