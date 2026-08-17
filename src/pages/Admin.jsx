import React, { useEffect, useState } from "react";
import { Check, X, Save, History, ListChecks } from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useSiteId } from "./Dashboard";
import { formatValue } from "../lib/kpiEngine";

const TABS = ["Metrics", "Edit Entries", "Activity Log"];

export default function Admin() {
  const siteId = useSiteId();
  const [tab, setTab] = useState("Metrics");

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-semibold text-white">Admin</h1>
        <p className="text-slate-500 mt-1">Manage which metrics are tracked, fix mistakes, and see who changed what.</p>
      </div>

      <div className="flex gap-6 border-b border-white/5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-sm ${tab === t ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Metrics" && <MetricsTab />}
      {tab === "Edit Entries" && <EditEntriesTab siteId={siteId} />}
      {tab === "Activity Log" && <ActivityLogTab siteId={siteId} />}
    </Layout>
  );
}

/* ---------- Metrics: tick which KPIs are tracked ---------- */

function MetricsTab() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    supabase.from("kpis").select("*").order("category").order("sort_order")
      .then(({ data }) => {
        setKpis(data || []);
        setLoading(false);
      });
  }, []);

  async function toggle(kpi) {
    setSavingKey(kpi.key);
    const { error } = await supabase.from("kpis").update({ active: !kpi.active }).eq("id", kpi.id);
    if (!error) {
      setKpis((prev) => prev.map((k) => (k.id === kpi.id ? { ...k, active: !k.active } : k)));
    }
    setSavingKey(null);
  }

  const grouped = kpis.reduce((acc, k) => {
    (acc[k.category] ||= []).push(k);
    return acc;
  }, {});

  if (loading) return <Card className="p-10 text-center text-slate-500">Loading…</Card>;

  return (
    <div className="space-y-5">
      <p className="text-slate-500 text-sm">
        Only ticked metrics show up on the dashboard and on the weekly data-entry form.
      </p>
      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category} className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3">{category}</h3>
          <div className="space-y-2">
            {items.map((k) => (
              <div key={k.key} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-slate-200">{k.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Target {formatValue(k.target, k.unit)} · {k.direction === "higher_better" ? "higher is better" : "lower is better"}
                  </div>
                </div>
                <button
                  onClick={() => toggle(k)}
                  disabled={savingKey === k.key}
                  className={`w-11 h-6 rounded-full transition relative shrink-0 ${k.active ? "bg-indigo-600" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${k.active ? "left-5.5" : "left-0.5"}`}
                    style={{ left: k.active ? "22px" : "2px" }} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------- Edit Entries: fix a mistyped number ---------- */

function EditEntriesTab({ siteId }) {
  const [entries, setEntries] = useState([]);
  const [kpiNames, setKpiNames] = useState({});
  const [editing, setEditing] = useState(null); // entry id being edited
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    Promise.all([
      supabase.from("kpi_entries").select("*").eq("site_id", siteId).order("period_start", { ascending: false }).limit(100),
      supabase.from("kpis").select("key, name, unit"),
    ]).then(([entriesRes, kpisRes]) => {
      setEntries(entriesRes.data || []);
      const map = {};
      (kpisRes.data || []).forEach((k) => (map[k.key] = k));
      setKpiNames(map);
      setLoading(false);
    });
  }, [siteId]);

  async function saveEdit(entry) {
    const value = Number(draft);
    if (Number.isNaN(value)) return;
    const { error } = await supabase.from("kpi_entries").update({ value }).eq("id", entry.id);
    if (!error) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, value } : e)));
      setEditing(null);
    }
  }

  if (loading) return <Card className="p-10 text-center text-slate-500">Loading…</Card>;

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-white mb-1">Recent entries</h3>
      <p className="text-[12px] text-slate-500 mb-4">Click a value to correct it — for example, if an extra zero got typed in.</p>
      <div className="space-y-1">
        {entries.length === 0 && <p className="text-slate-500 text-sm">No entries yet.</p>}
        {entries.map((e) => {
          const kpi = kpiNames[e.kpi_key];
          const isEditing = editing === e.id;
          return (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <div>
                <div className="text-slate-200">{kpi?.name || e.kpi_key}</div>
                <div className="text-[11px] text-slate-500">Week of {e.period_start}</div>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="number"
                    step="any"
                    value={draft}
                    onChange={(ev) => setDraft(ev.target.value)}
                    className="w-28 bg-[#0e1420] border border-indigo-500 rounded-lg px-2 py-1 text-sm outline-none"
                  />
                  <button onClick={() => saveEdit(e)} className="text-emerald-400"><Check size={16} /></button>
                  <button onClick={() => setEditing(null)} className="text-slate-500"><X size={16} /></button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(e.id); setDraft(String(e.value)); }}
                  className="text-slate-200 hover:text-indigo-400 font-medium"
                >
                  {formatValue(e.value, kpi?.unit)}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Activity Log: who changed what ---------- */

function ActivityLogTab({ siteId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    supabase.from("kpi_audit_log").select("*").eq("site_id", siteId).order("changed_at", { ascending: false }).limit(100)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, [siteId]);

  if (loading) return <Card className="p-10 text-center text-slate-500">Loading…</Card>;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-white">Every change, automatically logged</h3>
      </div>
      {logs.length === 0 ? (
        <p className="text-slate-500 text-sm">No edits yet — this fills in automatically whenever data is entered or corrected.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b border-white/5 text-sm">
              <div>
                <span className="text-slate-200">{l.kpi_key}</span>
                <span className="text-slate-500"> · week of {l.period_start}</span>
              </div>
              <div className="text-[12px] text-slate-500">
                {l.old_value != null ? `${l.old_value} → ` : "new: "}
                <span className="text-white">{l.new_value}</span>
                <span className="ml-2 text-slate-600">{new Date(l.changed_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
