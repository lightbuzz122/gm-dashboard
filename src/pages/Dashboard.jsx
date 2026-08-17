import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PoundSterling, Users, Heart, Bell, Plus, Star } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { computeStatus, formatValue, formatDelta, STATUS_COLOR } from "../lib/kpiEngine";
import Layout, { Card } from "../components/Layout";

/* ---------- tiny building blocks ---------- */

const Sparkline = ({ points, color }) => {
  if (!points || points.length < 2) {
    return <div className="w-full h-8 flex items-center text-[10px] text-slate-600">Not enough history yet</div>;
  }
  const w = 100, h = 30;
  const max = Math.max(...points), min = Math.min(...points);
  const norm = (v) => h - ((v - min) / (max - min || 1)) * h;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * w} ${norm(p)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const Delta = ({ value, good }) => (
  <span className={`text-xs font-medium ${good ? "text-emerald-400" : good === false ? "text-red-400" : "text-slate-500"}`}>{value}</span>
);

const RingGauge = ({ value, size = 96, stroke = 10, color = "#f59e0b", track = "#2a2f3d" }) => {
  const pct = Math.max(0, Math.min(100, value || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
};

const TOP_ROW = [
  { key: "total_sales", icon: PoundSterling, color: "#22c55e" },
  { key: "gross_profit", icon: PoundSterling, color: "#a78bfa" },
  { key: "labour_pct", icon: Users, color: "#f97316" },
  { key: "review_score", icon: Star, color: "#38bdf8" },
  { key: "nps", icon: Heart, color: "#f43f5e" },
];

const SECOND_ROW = ["complaints", "safety_checks_pct", "action_tickets_pct", "draught_yield_pct"];

/* ---------- data hook ---------- */

export function useKpiData(siteId) {
  const [kpiDefs, setKpiDefs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    Promise.all([
      supabase.from("kpis").select("*").order("sort_order"),
      supabase.from("kpi_entries").select("kpi_key, period_start, value").eq("site_id", siteId).order("period_start", { ascending: true }),
    ]).then(([kpisRes, entriesRes]) => {
      setKpiDefs(kpisRes.data || []);
      setEntries(entriesRes.data || []);
      setLoading(false);
    });
  }, [siteId]);

  const entriesByKpi = useMemo(() => {
    const map = {};
    entries.forEach((e) => (map[e.kpi_key] ||= []).push(e));
    return map;
  }, [entries]);

  const defByKey = useMemo(() => Object.fromEntries(kpiDefs.map((k) => [k.key, k])), [kpiDefs]);

  return { kpiDefs, defByKey, entriesByKpi, loading };
}

// Resolves the current user's site, falling back to the first site if
// nobody's logged in (demo mode).
export function useSiteId() {
  const { profile } = useAuth();
  const [demoSiteId, setDemoSiteId] = useState(null);
  useEffect(() => {
    if (profile?.site_id) return;
    supabase.from("sites").select("id").limit(1).single()
      .then(({ data }) => setDemoSiteId(data?.id || null));
  }, [profile]);
  return profile?.site_id || demoSiteId;
}

/* ---------- page ---------- */

export default function Dashboard() {
  const { profile } = useAuth();
  const siteId = useSiteId();
  const { defByKey, entriesByKpi, loading } = useKpiData(siteId);

  function latest(key) {
    const arr = entriesByKpi[key];
    return arr && arr.length ? arr[arr.length - 1].value : null;
  }
  function trend(key, n = 8) {
    const arr = entriesByKpi[key] || [];
    return arr.slice(-n).map((e) => e.value);
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Good morning{profile?.full_name ? `, ${profile.full_name.split("@")[0]}` : ""} 👋</h1>
          <p className="text-slate-500 mt-1">Here's how Alwyne Castle is performing today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/entry" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition text-white rounded-lg px-3 py-2">
            <Plus size={14} /> Add weekly data
          </Link>
          <button className="relative"><Bell size={18} className="text-slate-400" /></button>
        </div>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-slate-500">Loading your data…</Card>
      ) : Object.keys(entriesByKpi).length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-slate-300 mb-2">No data entered yet.</p>
          <p className="text-slate-500 text-sm mb-4">Add your first week's numbers to see the dashboard come alive.</p>
          <Link to="/entry" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm px-4 py-2 rounded-lg">
            <Plus size={14} /> Add weekly data
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-4">
            {TOP_ROW.map(({ key, icon: Icon, color }) => {
              const kpi = defByKey[key];
              if (!kpi || !kpi.active) return null;
              const actual = latest(key);
              const status = computeStatus(kpi, actual);
              const good = status === "green" ? true : status === "red" || status === "amber" ? false : null;
              return (
                <Card key={key} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <span className="text-[10px] tracking-wider text-slate-500">{kpi.name.toUpperCase()}</span>
                  </div>
                  <div className="text-xl font-semibold text-white">{formatValue(actual, kpi.unit)}</div>
                  <div className="flex items-center gap-2 mt-0.5 mb-1">
                    <span className="text-[11px] text-slate-500">vs Target {formatValue(kpi.target, kpi.unit)}</span>
                    <Delta value={formatDelta(actual, kpi.target, kpi.unit)} good={good} />
                  </div>
                  <Sparkline points={trend(key)} color={STATUS_COLOR[status]} />
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Card className="p-5">
              <h3 className="font-semibold text-white mb-4">Sales Performance</h3>
              <div className="space-y-4">
                {["wet_sales", "dry_sales", "total_sales"].map((key) => {
                  const kpi = defByKey[key];
                  if (!kpi || !kpi.active) return null;
                  const actual = latest(key);
                  const status = computeStatus(kpi, actual);
                  const good = status === "green" ? true : status === "unknown" ? null : false;
                  return (
                    <div key={key}>
                      <div className="text-[10px] text-slate-500 tracking-wide">{kpi.name.toUpperCase()}</div>
                      <div className="text-lg font-semibold text-white">{formatValue(actual, kpi.unit)}</div>
                      <div className="flex gap-2 text-[11px]">
                        <span className="text-slate-500">vs Target {formatValue(kpi.target, kpi.unit)}</span>
                        <Delta value={formatDelta(actual, kpi.target, kpi.unit)} good={good} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-white mb-4">Labour Overview</h3>
              {(() => {
                const kpi = defByKey["labour_pct"];
                const actual = latest("labour_pct");
                const status = computeStatus(kpi, actual);
                return (
                  <div className="flex items-center gap-6">
                    <div className="space-y-3 flex-1">
                      <div>
                        <div className="text-[11px] text-slate-500">Labour % of Sales</div>
                        <div className="text-lg font-semibold text-white">{formatValue(actual, "percent")}</div>
                        <div className="flex gap-2 text-[11px]">
                          <span className="text-slate-500">vs Target {formatValue(kpi?.target, "percent")}</span>
                          <Delta value={formatDelta(actual, kpi?.target, "percent")} good={status === "green"} />
                        </div>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-center shrink-0">
                      <RingGauge value={actual || 0} color={STATUS_COLOR[status]} size={110} stroke={12} />
                      <div className="absolute text-center">
                        <div className="text-lg font-semibold text-white">{formatValue(actual, "percent")}</div>
                        <div className="text-[10px] text-slate-500">of Sales</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </Card>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {SECOND_ROW.map((key) => {
              const kpi = defByKey[key];
              if (!kpi || !kpi.active) return null;
              const actual = latest(key);
              const status = computeStatus(kpi, actual);
              return (
                <Card key={key} className="p-3">
                  <div className="text-[10px] text-slate-500 mb-2 leading-tight h-7">{kpi.name}</div>
                  <div className="text-lg font-semibold" style={{ color: STATUS_COLOR[status] }}>{formatValue(actual, kpi.unit)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Target {formatValue(kpi.target, kpi.unit)}</div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
