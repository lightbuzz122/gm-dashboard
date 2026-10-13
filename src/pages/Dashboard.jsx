import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, CheckCircle2, AlertTriangle, XCircle, Circle, Check, X, Minus, ShieldCheck,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { computeStatus, formatValue } from "../lib/kpiEngine";
import { Shell } from "../components/Layout";
import {
  SITE, DEMO, CHECK_ITEMS, CHECK_PERIODS, CHECK_PERIOD_LABEL, CHECK_DUE_HOUR,
} from "../config";
import { DEMO_DEFS, DEMO_ENTRIES, DEMO_CHECKS } from "../lib/demoData";

/* =====================================================================
   Data hooks (also used by the category pages — keep these exports)
   ===================================================================== */

export function useKpiData(siteId) {
  const [kpiDefs, setKpiDefs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    setLoading(true);
    Promise.all([
      supabase.from("kpis").select("*").order("sort_order"),
      supabase
        .from("kpi_entries")
        .select("kpi_key, period_start, value")
        .eq("site_id", siteId)
        .order("period_start", { ascending: true }),
    ]).then(([kpisRes, entriesRes]) => {
      setKpiDefs(kpisRes.data || []);
      setEntries(entriesRes.data || []);
      setLoading(false);
    });
  }, [siteId]);

  return useIndexed(kpiDefs, entries, loading);
}

function useIndexed(kpiDefs, entries, loading) {
  const entriesByKpi = useMemo(() => {
    const map = {};
    entries.forEach((e) => (map[e.kpi_key] ||= []).push(e));
    return map;
  }, [entries]);
  const defByKey = useMemo(() => Object.fromEntries(kpiDefs.map((k) => [k.key, k])), [kpiDefs]);
  return { kpiDefs, defByKey, entriesByKpi, loading };
}

// Resolves the signed-in user's site.
export function useSiteId() {
  const { profile } = useAuth();
  return profile?.site_id || null;
}

function useLiveDashboard() {
  const siteId = useSiteId();
  const kpi = useKpiData(siteId);
  const [checks, setChecks] = useState([]);
  useEffect(() => {
    if (!siteId) return;
    supabase
      .from("compliance_checks")
      .select("period, item, status")
      .eq("site_id", siteId)
      .eq("check_date", new Date().toISOString().slice(0, 10))
      .then(({ data }) => setChecks(data || []));
  }, [siteId]);
  return { ...kpi, checks, nowHour: new Date().getHours() };
}

function useDemoDashboard() {
  const kpi = useIndexed(DEMO_DEFS, DEMO_ENTRIES, false);
  return { ...kpi, checks: DEMO_CHECKS, nowHour: 14 };
}

const useDashboard = DEMO ? useDemoDashboard : useLiveDashboard;

/* =====================================================================
   Look & feel
   ===================================================================== */

const STATUS_UI = {
  green: { label: "On target", fg: "#14663A", bg: "#E3F4EA", bar: "#22A55B", Icon: CheckCircle2 },
  amber: { label: "Needs attention", fg: "#8A5300", bg: "#FFF1D6", bar: "#F0A020", Icon: AlertTriangle },
  red: { label: "Off target", fg: "#A62020", bg: "#FDE6E6", bar: "#E14B4B", Icon: XCircle },
  unknown: { label: "No data yet", fg: "#4B5563", bg: "#EEF0F3", bar: "#9CA3AF", Icon: Circle },
};

const INK = "#162033";
const MUTED = "#5A6577";
const LINE = "#E3E7EE";
const ACCENT = "#4338CA";

const Card = ({ children, className = "" }) => (
  <section
    className={`bg-white rounded-2xl border border-[#E3E7EE] shadow-[0_1px_2px_rgba(22,32,51,0.04)] ${className}`}
  >
    {children}
  </section>
);

const CardTitle = ({ children, hint }) => (
  <div className="flex items-baseline justify-between gap-3 mb-4">
    <h2 className="text-[17px] font-semibold" style={{ color: INK }}>{children}</h2>
    {hint && <span className="text-[13px]" style={{ color: MUTED }}>{hint}</span>}
  </div>
);

function StatusChip({ status, text }) {
  const s = STATUS_UI[status] || STATUS_UI.unknown;
  const Icon = s.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      <Icon size={14} aria-hidden="true" />
      {text || s.label}
    </span>
  );
}

/* =====================================================================
   Small helpers
   ===================================================================== */

const latestOf = (entriesByKpi, key) => {
  const arr = entriesByKpi[key];
  return arr && arr.length ? arr[arr.length - 1].value : null;
};

const seriesOf = (entriesByKpi, key, n = 8) => (entriesByKpi[key] || []).slice(-n);

function amountText(abs, unit) {
  if (unit === "currency") return "£" + Math.round(abs).toLocaleString();
  if (unit === "percent") return Number(abs.toFixed(1)) + " pts";
  return Number(abs.toFixed(2)).toString();
}

// "£37,663 below target", "2 over limit" …
function gapText(kpi, actual) {
  if (actual == null || kpi?.target == null) return "No target set";
  const diff = actual - kpi.target;
  if (Math.abs(diff) < 1e-9) return "Exactly on target";
  const amt = amountText(Math.abs(diff), kpi.unit);
  if (kpi.direction === "lower_better") return diff > 0 ? `${amt} over limit` : `${amt} under limit`;
  return diff < 0 ? `${amt} below target` : `${amt} above target`;
}

const shortDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/* =====================================================================
   Charts
   ===================================================================== */

// Actual bar against a target marker. Every row uses the same scale
// (0–120% of its own target) so the target line sits in the same place.
function TargetBar({ kpi, actual }) {
  const status = computeStatus(kpi, actual);
  const ui = STATUS_UI[status];
  const SCALE = 1.2;
  const ratio = actual != null && kpi.target ? actual / kpi.target : 0;
  const width = Math.min(ratio / SCALE, 1) * 100;
  const tick = (1 / SCALE) * 100;
  const pct = actual != null && kpi.target ? Math.round(ratio * 100) : null;

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <div className="text-[14px] font-medium" style={{ color: INK }}>{kpi.name}</div>
          <div className="text-[26px] leading-8 font-semibold tabular-nums" style={{ color: INK }}>
            {formatValue(actual, kpi.unit)}
          </div>
        </div>
        <div className="text-right">
          <StatusChip status={status} text={pct != null ? `${pct}% of target` : undefined} />
        </div>
      </div>
      <div
        className="relative h-4 rounded-full"
        style={{ background: "#EDF0F5" }}
        role="img"
        aria-label={`${kpi.name}: ${formatValue(actual, kpi.unit)} against a target of ${formatValue(kpi.target, kpi.unit)}`}
      >
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: ui.bar }} />
        <div
          className="absolute -top-1.5 -bottom-1.5 w-[3px] rounded"
          style={{ left: `calc(${tick}% - 1.5px)`, background: INK }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[13px]" style={{ color: MUTED }}>
        <span>{gapText(kpi, actual)}</span>
        <span>Target {formatValue(kpi.target, kpi.unit)}</span>
      </div>
    </div>
  );
}

// Weekly line with the target as a dashed reference line.
const fmtThousands = (v) => "£" + Math.round(v / 1000) + "k";

function TrendChart({ kpi, points, fmt = fmtThousands, noun = "sales", height = 230 }) {
  if (!kpi || points.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-[14px] text-center px-4" style={{ color: MUTED }}>
        Add at least two weeks of {noun} to see the trend.
      </div>
    );
  }
  const W = 420, H = height, L = 58, R = 14, T = 16, B = 34;
  const vals = points.map((p) => p.value);
  const hi = Math.max(...vals, kpi.target || 0);
  const lo = Math.min(...vals, kpi.target ?? Infinity);
  const pad = (hi - lo) * 0.25 || hi * 0.1;
  const max = hi + pad, min = Math.max(0, lo - pad);
  const x = (i) => L + (i / (points.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - min) / (max - min || 1)) * (H - T - B);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const ticks = [min, (min + max) / 2, max];
  const last = points[points.length - 1];
  const targetAbove = kpi.target != null && y(kpi.target) > T + 22;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label={`Weekly ${kpi.name} against a target of ${formatValue(kpi.target, kpi.unit)}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={LINE} strokeWidth="1" />
          <text x={L - 8} y={y(t) + 5} textAnchor="end" fontSize="14" fill={MUTED}>{fmt(t)}</text>
        </g>
      ))}
      {kpi.target != null && (
        <g>
          <line x1={L} x2={W - R} y1={y(kpi.target)} y2={y(kpi.target)} stroke={INK} strokeWidth="1.8" strokeDasharray="6 5" />
          <text x={W - R} y={targetAbove ? y(kpi.target) - 7 : y(kpi.target) + 18} textAnchor="end"
            fontSize="14" fontWeight="600" fill={INK} stroke="#fff" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">Target {fmt(kpi.target)}</text>
        </g>
      )}
      <path d={path} fill="none" stroke={ACCENT} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.period_start} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 6 : 4}
          fill="#fff" stroke={ACCENT} strokeWidth="3" />
      ))}
      {points.map((p, i) =>
        i % 3 === (points.length - 1) % 3 ? (
          <text key={"x" + p.period_start} x={x(i)} y={H - 8} textAnchor={i === points.length - 1 ? "end" : "middle"} fontSize="13" fill={MUTED}>
            {shortDate(p.period_start)}
          </text>
        ) : null
      )}
      <text x={x(points.length - 1)} y={y(last.value) + (y(last.value) < T + 24 ? 26 : -13)} textAnchor="end"
        fontSize="15" fontWeight="700" fill={ACCENT} stroke="#fff" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">{fmt(last.value)}</text>
    </svg>
  );
}

// A row of pips for small whole-number limits (e.g. complaints, max 10).
function PipMeter({ kpi, actual }) {
  const status = computeStatus(kpi, actual);
  const limit = kpi.target;
  const total = Math.max(limit, actual ?? 0);
  const over = actual != null ? Math.max(0, actual - limit) : 0;
  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <div className="text-[14px] font-medium" style={{ color: INK }}>{kpi.name} this period</div>
          <div className="text-[26px] leading-8 font-semibold tabular-nums" style={{ color: INK }}>
            {actual ?? "—"}
            <span className="text-[15px] font-normal" style={{ color: MUTED }}> of {limit} allowed</span>
          </div>
        </div>
        <StatusChip status={status} text={over > 0 ? `${over} over the limit` : STATUS_UI[status].label} />
      </div>
      <div className="flex flex-wrap gap-1.5" role="img"
        aria-label={`${actual} ${kpi.name.toLowerCase()} against a limit of ${limit}`}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = actual != null && i < actual;
          const beyond = i >= limit;
          return (
            <span key={i} className="h-5 w-5 rounded-md border"
              style={{
                background: filled ? (beyond ? "#E14B4B" : "#5B6B85") : "#fff",
                borderColor: filled ? (beyond ? "#E14B4B" : "#5B6B85") : "#C9D0DC",
              }} />
          );
        })}
      </div>
      <div className="mt-2 text-[13px]" style={{ color: MUTED }}>
        Grey = within the limit of {limit}. Red = over the limit.
      </div>
    </div>
  );
}

// Plain meter for a single value against a target (labour %, reviews, NPS).
function MeterRow({ kpi, actual }) {
  const status = computeStatus(kpi, actual);
  const ui = STATUS_UI[status];
  const max = Math.max(actual ?? 0, kpi.target ?? 0) * 1.25 || 1;
  const w = ((actual ?? 0) / max) * 100;
  const t = ((kpi.target ?? 0) / max) * 100;
  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <div className="text-[14px] font-medium" style={{ color: INK }}>{kpi.name}</div>
          <div className="text-[24px] leading-7 font-semibold tabular-nums" style={{ color: INK }}>
            {formatValue(actual, kpi.unit)}
          </div>
        </div>
        <StatusChip status={status} />
      </div>
      <div className="relative h-3 rounded-full" style={{ background: "#EDF0F5" }}
        role="img" aria-label={`${kpi.name}: ${formatValue(actual, kpi.unit)}, target ${formatValue(kpi.target, kpi.unit)}`}>
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: ui.bar }} />
        <div className="absolute -top-1 -bottom-1 w-[3px] rounded" style={{ left: `calc(${t}% - 1.5px)`, background: INK }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[13px]" style={{ color: MUTED }}>
        <span>{gapText(kpi, actual)}</span>
        <span>Target {formatValue(kpi.target, kpi.unit)}</span>
      </div>
    </div>
  );
}

function Sparkline({ values, color }) {
  if (values.length < 2) return <div className="h-8" />;
  const w = 100, h = 30;
  const max = Math.max(...values), min = Math.min(...values);
  const pts = values.map((v, i) => `${i ? "L" : "M"}${(i / (values.length - 1)) * w} ${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" aria-hidden="true" preserveAspectRatio="none">
      <path d={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* =====================================================================
   Safety checklist
   ===================================================================== */

function SafetyChecklist({ checks, nowHour }) {
  const byKey = {};
  checks.forEach((c) => (byKey[`${c.period}|${c.item}`] = c));
  const required = CHECK_ITEMS.length * CHECK_PERIODS.length;
  const done = checks.filter((c) => c.status !== "fail" && byKey[`${c.period}|${c.item}`]).length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const recorded = Object.keys(byKey).length;
  const missed = CHECK_PERIODS.reduce((n, p) => {
    if (nowHour < CHECK_DUE_HOUR[p]) return n;
    return n + CHECK_ITEMS.filter((it) => !byKey[`${p}|${it}`]).length;
  }, 0);
  const pct = Math.round((done / required) * 100);
  const status = failed || missed ? (failed ? "red" : "amber") : pct === 100 ? "green" : "unknown";
  const ui = STATUS_UI[status === "unknown" ? "amber" : status];

  const R = 34, C = 2 * Math.PI * R;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative shrink-0">
          <svg width="86" height="86" viewBox="0 0 86 86" className="-rotate-90" aria-hidden="true">
            <circle cx="43" cy="43" r={R} fill="none" stroke="#EDF0F5" strokeWidth="9" />
            <circle cx="43" cy="43" r={R} fill="none" stroke={ui.bar} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C - (pct / 100) * C} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[20px] font-semibold tabular-nums" style={{ color: INK }}>
            {pct}%
          </div>
        </div>
        <div className="text-[14px] leading-6" style={{ color: INK }}>
          <div><b>{done}</b> of <b>{required}</b> checks passed today</div>
          {failed > 0 && <div style={{ color: STATUS_UI.red.fg }}>{failed} failed — action needed</div>}
          {missed > 0 && <div style={{ color: STATUS_UI.amber.fg }}>{missed} overdue</div>}
          {!failed && !missed && recorded < required && <div style={{ color: MUTED }}>{required - recorded} still to do</div>}
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: LINE }}>
        <div className="grid grid-cols-[1fr_repeat(3,66px)] text-[13px] font-medium px-3 py-2"
          style={{ background: "#F6F8FB", color: MUTED }}>
          <span>Check</span>
          {CHECK_PERIODS.map((p) => <span key={p} className="text-center text-[12px]">{CHECK_PERIOD_LABEL[p]}</span>)}
        </div>
        {CHECK_ITEMS.map((item) => (
          <div key={item} className="grid grid-cols-[1fr_repeat(3,66px)] items-center px-3 py-2.5 border-t text-[14px]"
            style={{ borderColor: LINE, color: INK }}>
            <span className="pr-2 leading-5">{item.replace(" Temperature", "").replace("Hot Hold Food", "Hot hold food")}</span>
            {CHECK_PERIODS.map((p) => {
              const c = byKey[`${p}|${item}`];
              const late = !c && nowHour >= CHECK_DUE_HOUR[p];
              return (
                <span key={p} className="flex justify-center">
                  <CheckMark record={c} late={late} label={`${item}, ${CHECK_PERIOD_LABEL[p]}`} />
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[13px]" style={{ color: MUTED }}>
        <span className="inline-flex items-center gap-1"><Check size={13} /> Passed</span>
        <span className="inline-flex items-center gap-1"><X size={13} /> Failed</span>
        <span className="inline-flex items-center gap-1"><Circle size={13} /> To do</span>
      </div>
      <Link to="/compliance" className="inline-block mt-3 text-[14px] font-medium" style={{ color: ACCENT }}>
        Open today's checks →
      </Link>
    </div>
  );
}

function CheckMark({ record, late, label }) {
  const base = "h-7 w-7 rounded-full flex items-center justify-center";
  if (record?.status === "pass")
    return <span className={base} style={{ background: "#22A55B", color: "#fff" }} role="img" aria-label={`${label}: passed`}><Check size={16} strokeWidth={3} /></span>;
  if (record?.status === "fail")
    return <span className={base} style={{ background: "#E14B4B", color: "#fff" }} role="img" aria-label={`${label}: failed`}><X size={16} strokeWidth={3} /></span>;
  if (record?.status === "na")
    return <span className={base} style={{ background: "#EDF0F5", color: MUTED }} role="img" aria-label={`${label}: not applicable`}><Minus size={16} /></span>;
  return (
    <span className={base} role="img" aria-label={`${label}: ${late ? "overdue" : "to do"}`}
      style={{ border: `2px ${late ? "solid" : "dashed"} ${late ? "#F0A020" : "#B6BFCD"}` }} />
  );
}

/* =====================================================================
   Page
   ===================================================================== */

const TILES = [
  { key: "total_sales", label: "Total sales" },
  { key: "gross_profit", label: "Gross profit" },
  { key: "labour_pct", label: "Labour cost" },
  { key: "review_score", label: "Review score" },
  { key: "nps", label: "NPS" },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { defByKey, entriesByKpi, kpiDefs, loading, checks, nowHour } = useDashboard();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const rawName = DEMO ? "Sam" : profile?.full_name?.split("@")[0];
  const name = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "";

  const noData = Object.keys(entriesByKpi).length === 0;
  const allDates = Object.values(entriesByKpi).flat().map((e) => e.period_start).sort();
  const latestWeek = allDates[allDates.length - 1];

  // Anything red or amber, worst first — this is the "what needs my attention" list.
  const attention = kpiDefs
    .filter((k) => k.active)
    .map((k) => ({ k, v: latestOf(entriesByKpi, k.key) }))
    .filter(({ k, v }) => v != null && ["red", "amber"].includes(computeStatus(k, v)))
    .map(({ k, v }) => ({ k, v, s: computeStatus(k, v) }))
    .sort((a, b) => (a.s === b.s ? 0 : a.s === "red" ? -1 : 1))
    .slice(0, 6);

  const wet = defByKey.wet_sales, dry = defByKey.dry_sales, total = defByKey.total_sales;
  const labour = defByKey.labour_pct, review = defByKey.review_score, nps = defByKey.nps, complaints = defByKey.complaints;

  return (
    <Shell>
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] leading-9 font-semibold">
              {greeting}{name ? `, ${name}` : ""}
            </h1>
            <p className="text-[15px] mt-0.5" style={{ color: MUTED }}>
              Trading overview{latestWeek ? ` · latest data: week of ${shortDate(latestWeek)}` : ""}
            </p>
          </div>
          <Link to="/entry"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-medium text-white"
            style={{ background: ACCENT }}>
            <Plus size={16} /> Add weekly data
          </Link>
        </header>

        {loading ? (
          <Card className="p-10 text-center" ><span style={{ color: MUTED }}>Loading your data…</span></Card>
        ) : noData ? (
          <Card className="p-10 text-center">
            <p className="text-[17px] font-medium mb-1">No data entered yet</p>
            <p className="mb-4" style={{ color: MUTED }}>Add your first week's numbers and this page fills in.</p>
            <Link to="/entry" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium text-white" style={{ background: ACCENT }}>
              <Plus size={16} /> Add weekly data
            </Link>
          </Card>
        ) : (
          <>
            {/* Headline numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {TILES.map(({ key, label }) => {
                const kpi = defByKey[key];
                if (!kpi || !kpi.active) return null;
                const v = latestOf(entriesByKpi, key);
                const status = computeStatus(kpi, v);
                return (
                  <Card key={key} className="px-4 pt-3 pb-3">
                    <div className="text-[14px] font-medium" style={{ color: MUTED }}>{label}</div>
                    <div className="text-[36px] leading-[44px] font-bold tabular-nums tracking-tight">{formatValue(v, kpi.unit)}</div>
                    <Sparkline values={seriesOf(entriesByKpi, key).map((e) => e.value)} color={STATUS_UI[status].bar} />
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mt-1.5">
                      <StatusChip status={status} />
                      <span className="text-[13px]" style={{ color: MUTED }}>Target {formatValue(kpi.target, kpi.unit)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Sales + attention */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <Card className="p-5 xl:col-span-2">
                <CardTitle hint="This week against target">Sales performance</CardTitle>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-6">
                    {wet && <TargetBar kpi={wet} actual={latestOf(entriesByKpi, "wet_sales")} />}
                    {dry && <TargetBar kpi={dry} actual={latestOf(entriesByKpi, "dry_sales")} />}
                    {total && <TargetBar kpi={total} actual={latestOf(entriesByKpi, "total_sales")} />}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium mb-2">Total sales, last 8 weeks</div>
                    <TrendChart kpi={total} points={seriesOf(entriesByKpi, "total_sales")} height={340} />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <CardTitle hint="Worst first">Needs your attention</CardTitle>
                {attention.length === 0 ? (
                  <div className="flex items-center gap-2 text-[15px]" style={{ color: STATUS_UI.green.fg }}>
                    <CheckCircle2 size={18} /> Everything is on target.
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {attention.map(({ k, v, s }) => {
                      const Icon = STATUS_UI[s].Icon;
                      return (
                        <li key={k.key} className="flex gap-3">
                          <Icon size={18} className="mt-0.5 shrink-0" style={{ color: STATUS_UI[s].fg }} aria-hidden="true" />
                          <div>
                            <div className="text-[15px] font-medium">{k.name}: {formatValue(v, k.unit)}</div>
                            <div className="text-[13px]" style={{ color: MUTED }}>{gapText(k, v)} · target {formatValue(k.target, k.unit)}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            {/* Labour, guests, safety */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
              <Card className="p-5">
                <CardTitle hint="This week">Labour</CardTitle>
                <div className="space-y-6">
                  {labour && <MeterRow kpi={labour} actual={latestOf(entriesByKpi, "labour_pct")} />}
                  {labour && (
                    <div>
                      <div className="text-[14px] font-medium mb-1">Labour %, last 8 weeks</div>
                      <TrendChart kpi={labour} points={seriesOf(entriesByKpi, "labour_pct")} noun="labour"
                        fmt={(v) => v.toFixed(1) + "%"} height={190} />
                    </div>
                  )}
                  {defByKey.labour_overtime_hours?.active && latestOf(entriesByKpi, "labour_overtime_hours") != null && (
                    <MeterRow kpi={defByKey.labour_overtime_hours} actual={latestOf(entriesByKpi, "labour_overtime_hours")} />
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <CardTitle hint="This week">Guests</CardTitle>
                <div className="space-y-6">
                  {complaints && complaints.active && <PipMeter kpi={complaints} actual={latestOf(entriesByKpi, "complaints")} />}
                  {complaints && complaints.active && (
                    <div>
                      <div className="text-[14px] font-medium mb-1">Complaints, last 8 weeks</div>
                      <TrendChart kpi={complaints} points={seriesOf(entriesByKpi, "complaints")} noun="complaints"
                        fmt={(v) => String(Math.round(v))} height={170} />
                    </div>
                  )}
                  {review && review.active && <MeterRow kpi={review} actual={latestOf(entriesByKpi, "review_score")} />}
                  {nps && nps.active && <MeterRow kpi={nps} actual={latestOf(entriesByKpi, "nps")} />}
                </div>
              </Card>

              <Card className="p-5">
                <CardTitle hint="Today">
                  <span className="inline-flex items-center gap-2"><ShieldCheck size={18} style={{ color: ACCENT }} /> Safety checks</span>
                </CardTitle>
                <SafetyChecklist checks={checks} nowHour={nowHour} />
              </Card>
            </div>
          </>
        )}
    </Shell>
  );
}
