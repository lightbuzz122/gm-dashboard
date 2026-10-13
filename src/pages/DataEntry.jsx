import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, Save, ChevronLeft, ChevronRight, PoundSterling, Users, Heart,
  ShieldCheck, Package, ListChecks, LayoutGrid, Wand2, GraduationCap,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import Layout, { Card } from "../components/Layout";
import { computeStatus, formatValue } from "../lib/kpiEngine";
import { DEMO } from "../config";
import { DEMO_DEFS, DEMO_ENTRIES } from "../lib/demoData";

/* ---------- helpers ---------- */

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay() || 7; // Mon=1..Sun=7
  if (day !== 1) date.setDate(date.getDate() - (day - 1));
  date.setHours(12, 0, 0, 0);
  return date;
}
const toISODate = (d) => d.toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
const nice = (iso) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const CATEGORY_UI = {
  Sales: { label: "Sales & profit", Icon: PoundSterling },
  Labour: { label: "Labour", Icon: Users },
  People: { label: "People & training", Icon: GraduationCap },
  Guest: { label: "Guest experience", Icon: Heart },
  Compliance: { label: "Compliance & safety", Icon: ShieldCheck },
  Stock: { label: "Stock & waste", Icon: Package },
  Tasks: { label: "Tasks", Icon: ListChecks },
};
const CATEGORY_ORDER = ["Sales", "Labour", "People", "Guest", "Compliance", "Stock", "Tasks"];

const STATUS_DOT = { green: "#22A55B", amber: "#F0A020", red: "#E14B4B", unknown: "#B6BFCD" };
const STATUS_WORD = { green: "On target", amber: "Close", red: "Off target", unknown: "" };

// This KPI is entered as "passed out of total" and turned into a percentage.
const SAFETY_KEY = "safety_checks_pct";

/* ---------- one row per metric ---------- */

const ROW = "grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_190px_120px_120px_28px] items-center gap-x-4 gap-y-1 px-4 py-2.5";

// Enter moves to the next box, like a spreadsheet.
function nextOnEnter(e) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const all = [...e.currentTarget.form.querySelectorAll("input[data-entry]")];
  const i = all.indexOf(e.currentTarget);
  (all[i + 1] || e.currentTarget.form.querySelector("button[type=submit]"))?.focus();
}

function Dot({ status }) {
  return status === "unknown" ? <span /> : (
    <span className="h-3 w-3 rounded-full justify-self-end" title={STATUS_WORD[status]}
      style={{ background: STATUS_DOT[status] }} />
  );
}

function Row({ kpi, value, onChange, last }) {
  const num = value === "" || value == null ? null : Number(value);
  const status = num == null ? "unknown" : computeStatus(kpi, num);
  const prefix = kpi.unit === "currency" ? "£" : "";
  const suffix = kpi.unit === "percent" ? "%" : "";
  return (
    <div className={`${ROW} border-t border-slate-200`}>
      <label htmlFor={"f-" + kpi.key} className="text-[15px] font-medium text-slate-900">{kpi.name}</label>
      <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        {prefix && <span className="text-[17px] text-slate-500 mr-1">{prefix}</span>}
        <input id={"f-" + kpi.key} data-entry type="number" inputMode="decimal" step="any"
          value={value ?? ""} onChange={(e) => onChange(e.target.value)} onKeyDown={nextOnEnter}
          onFocus={(e) => e.target.select()} placeholder="0"
          className="w-full min-w-0 bg-transparent py-2 text-[18px] font-semibold text-slate-900 tabular-nums outline-none placeholder:text-slate-300" />
        {suffix && <span className="text-[17px] text-slate-500 ml-1">{suffix}</span>}
      </div>
      <div className="hidden sm:block text-[13px] text-slate-600">{kpi.target != null ? `Target ${formatValue(kpi.target, kpi.unit)}` : ""}</div>
      <div className="hidden sm:block text-[13px] text-slate-600">{last != null ? `Last wk ${formatValue(last, kpi.unit)}` : ""}</div>
      <Dot status={status} />
      <div className="sm:hidden text-[12px] text-slate-600">
        {kpi.target != null ? `Target ${formatValue(kpi.target, kpi.unit)}` : ""}{last != null ? ` · Last week ${formatValue(last, kpi.unit)}` : ""}
      </div>
    </div>
  );
}

/* ---------- safety checks as "X out of Y" ---------- */

function SafetyRow({ kpi, value, onChange, last, siteId, periodStart, periodEnd }) {
  const [passed, setPassed] = useState("");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { setPassed(""); setTotal(""); setNote(""); }, [periodStart]);

  function recalc(p, t) {
    setPassed(p); setTotal(t);
    const P = Number(p), T = Number(t);
    if (p !== "" && t !== "" && T > 0) onChange(String(Math.round((P / T) * 1000) / 10));
  }
  async function fillFromLogged() {
    setNote("");
    if (DEMO) { recalc("96", "105"); setNote("Filled from this week's logged checks."); return; }
    if (!siteId) return;
    const { data, error } = await supabase.from("compliance_checks").select("status")
      .eq("site_id", siteId).gte("check_date", periodStart).lte("check_date", periodEnd);
    if (error || !data || data.length === 0) { setNote("No checks logged this week."); return; }
    const counted = data.filter((r) => r.status !== "na");
    recalc(String(counted.filter((r) => r.status === "pass").length), String(counted.length));
    setNote("Filled from this week's logged checks.");
  }
  const num = value === "" || value == null ? null : Number(value);
  const status = num == null ? "unknown" : computeStatus(kpi, num);
  const box = "w-full min-w-0 bg-transparent py-2 text-[18px] font-semibold text-slate-900 tabular-nums outline-none placeholder:text-slate-300";
  return (
    <div className={`${ROW} border-t border-slate-200`}>
      <div>
        <div className="text-[15px] font-medium text-slate-900">{kpi.name}</div>
        <button type="button" onClick={fillFromLogged} className="inline-flex items-center gap-1 text-[12px] font-medium text-indigo-700 hover:text-indigo-900">
          <Wand2 size={12} /> Fill from logged checks
        </button>
        {note && <span className="ml-2 text-[12px] text-emerald-700">{note}</span>}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <input data-entry type="number" inputMode="numeric" value={passed} placeholder="0" aria-label="Checks passed"
            onChange={(e) => recalc(e.target.value, total)} onKeyDown={nextOnEnter} onFocus={(e) => e.target.select()} className={box} />
        </div>
        <span className="text-slate-500 text-[14px]">of</span>
        <div className="flex-1 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
          <input data-entry type="number" inputMode="numeric" value={total} placeholder="105" aria-label="Checks due"
            onChange={(e) => recalc(passed, e.target.value)} onKeyDown={nextOnEnter} onFocus={(e) => e.target.select()} className={box} />
        </div>
      </div>
      <div className="text-[15px] font-semibold text-slate-900 tabular-nums">{num != null ? formatValue(num, "percent") : "—"}</div>
      <div className="hidden sm:block text-[13px] text-slate-600">{last != null ? `Last wk ${formatValue(last, kpi.unit)}` : ""}</div>
      <Dot status={status} />
      <div className="sm:hidden text-[12px] text-slate-600">Target {formatValue(kpi.target, kpi.unit)} · 105 checks in a full week</div>
    </div>
  );
}

/* ---------- page ---------- */

export default function DataEntry() {
  const { profile } = useAuth();
  const siteId = profile?.site_id || null;
  const [kpis, setKpis] = useState([]);
  const [values, setValues] = useState({});
  const [lastWeek, setLastWeek] = useState({});
  const [periodStart, setPeriodStart] = useState(toISODate(startOfWeek(new Date())));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const periodEnd = addDays(periodStart, 6);
  const thisMonday = toISODate(startOfWeek(new Date()));

  useEffect(() => {
    if (DEMO) { setKpis(DEMO_DEFS.filter((k) => k.active)); setLoading(false); return; }
    supabase.from("kpis").select("*").eq("active", true).order("sort_order")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setKpis(data || []);
        setLoading(false);
      });
  }, []);

  // Existing values for the chosen week (so re-visiting edits), plus last week for reference.
  useEffect(() => {
    setSaved(false);
    if (DEMO) {
      const cur = {}, prev = {};
      DEMO_ENTRIES.forEach((e) => {
        if (e.period_start === periodStart) cur[e.kpi_key] = e.value;
        if (e.period_start === addDays(periodStart, -7)) prev[e.kpi_key] = e.value;
      });
      setValues(cur); setLastWeek(prev);
      return;
    }
    if (!siteId) return;
    supabase.from("kpi_entries").select("kpi_key, value, period_start")
      .eq("site_id", siteId).in("period_start", [periodStart, addDays(periodStart, -7)])
      .then(({ data }) => {
        const cur = {}, prev = {};
        (data || []).forEach((r) => {
          if (r.period_start === periodStart) cur[r.kpi_key] = r.value;
          else prev[r.kpi_key] = r.value;
        });
        setValues(cur); setLastWeek(prev);
      });
  }, [siteId, periodStart]);

  const grouped = useMemo(() => {
    const g = {};
    [...kpis].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).forEach((k) => (g[k.category] ||= []).push(k));
    const cats = Object.keys(g).sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return cats.map((c) => [c, g[c]]);
  }, [kpis]);

  const filled = kpis.filter((k) => values[k.key] !== undefined && values[k.key] !== "").length;
  const pct = kpis.length ? Math.round((filled / kpis.length) * 100) : 0;

  const setVal = (key) => (v) => { setSaved(false); setValues((s) => ({ ...s, [key]: v })); };

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const rows = kpis
      .filter((k) => values[k.key] !== undefined && values[k.key] !== "")
      .map((k) => ({
        site_id: siteId,
        kpi_key: k.key,
        period_start: periodStart,
        period_end: periodEnd,
        value: Number(values[k.key]),
        entered_by: profile?.id,
      }));
    if (rows.length === 0) {
      setSaving(false);
      setError("Enter at least one number before saving.");
      return;
    }
    if (DEMO) { setSaving(false); setSaved(true); return; }
    const { error } = await supabase.from("kpi_entries")
      .upsert(rows, { onConflict: "site_id,kpi_key,period_start" });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSaved(true);
  }

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Add weekly data</h1>
        <p className="text-slate-600 mt-1">Type each number and press Enter to jump to the next one. Empty boxes are fine, you can come back.</p>
      </div>

      {/* Week picker */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setPeriodStart(addDays(periodStart, -7))} aria-label="Previous week"
          className="h-10 w-10 rounded-lg border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-[190px]">
          <div className="text-[12px] text-slate-600">Week</div>
          <div className="text-[18px] font-semibold text-slate-900">{nice(periodStart)} – {nice(periodEnd)}</div>
        </div>
        <button type="button" onClick={() => setPeriodStart(addDays(periodStart, 7))} aria-label="Next week"
          className="h-10 w-10 rounded-lg border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50">
          <ChevronRight size={18} />
        </button>
        {periodStart !== thisMonday && (
          <button type="button" onClick={() => setPeriodStart(thisMonday)}
            className="text-[14px] font-medium text-indigo-700 hover:text-indigo-900">This week</button>
        )}
        <div className="ml-auto w-full sm:w-64">
          <div className="flex justify-between text-[13px] text-slate-600 mb-1">
            <span>{filled} of {kpis.length} filled in</span><span>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Card>

      {loading ? (
        <p className="text-slate-600">Loading fields…</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 pb-24">
          {grouped.map(([category, items]) => {
            const ui = CATEGORY_UI[category] || { label: category, Icon: LayoutGrid };
            const Icon = ui.Icon;
            const done = items.filter((k) => values[k.key] !== undefined && values[k.key] !== "").length;
            return (
              <Card key={category} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#F6F8FB]">
                  <h2 className="flex items-center gap-2 text-[16px] font-semibold text-slate-900">
                    <Icon size={17} className="text-indigo-700" /> {ui.label}
                  </h2>
                  <span className="text-[13px] text-slate-600">{done} of {items.length}</span>
                </div>
                {items.map((k) =>
                  k.key === SAFETY_KEY ? (
                    <SafetyRow key={k.key} kpi={k} value={values[k.key]} onChange={setVal(k.key)}
                      last={lastWeek[k.key]} siteId={siteId} periodStart={periodStart} periodEnd={periodEnd} />
                  ) : (
                    <Row key={k.key} kpi={k} value={values[k.key]} onChange={setVal(k.key)} last={lastWeek[k.key]} />
                  )
                )}
              </Card>
            );
          })}

          {/* Sticky save bar */}
          <div className="fixed bottom-0 right-0 left-0 md:left-56 z-20 border-t border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-7 py-3 flex items-center gap-3">
            <div className="text-[14px] flex-1 min-w-0">
              {error ? <span className="text-red-700">{error}</span>
                : saved ? <span className="text-emerald-700 inline-flex items-center gap-1.5"><CheckCircle2 size={16} /> Saved for {nice(periodStart)} – {nice(periodEnd)}</span>
                : <span className="text-slate-600">{filled} of {kpis.length} filled in</span>}
            </div>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-white text-[15px] font-medium px-5 py-2.5 disabled:opacity-50">
              {saved ? <CheckCircle2 size={17} /> : <Save size={17} />}
              {saving ? "Saving…" : saved ? "Saved" : "Save week"}
            </button>
          </div>
        </form>
      )}
    </Layout>
  );
}
