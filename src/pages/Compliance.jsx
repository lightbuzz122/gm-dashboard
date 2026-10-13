import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useSiteId } from "./Dashboard";

import { CHECK_ITEMS as ITEMS, CHECK_PERIODS as PERIODS, CHECK_PERIOD_LABEL as PERIOD_LABEL } from "../config";
// The check list lives in src/config.js so the dashboard and this form always match.

const today = () => new Date().toISOString().slice(0, 10);

export default function Compliance() {
  const { profile } = useAuth();
  const siteId = useSiteId();
  const [period, setPeriod] = useState("morning");
  const [completedToday, setCompletedToday] = useState({}); // "period|item" -> {status, value}
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    supabase.from("compliance_checks").select("*").eq("site_id", siteId).eq("check_date", today())
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((row) => (map[`${row.period}|${row.item}`] = row));
        setCompletedToday(map);
      });
  }, [siteId]);

  async function submitPeriod(e) {
    e.preventDefault();
    setSaving(true);
    const rows = ITEMS.map((item) => ({
      site_id: siteId,
      check_date: today(),
      period,
      item,
      value: values[item] || null,
      status: values[`${item}_status`] || "pass",
      completed_by: profile?.id,
    }));
    const { error } = await supabase.from("compliance_checks").insert(rows);
    setSaving(false);
    if (!error) {
      const map = { ...completedToday };
      rows.forEach((r) => (map[`${r.period}|${r.item}`] = r));
      setCompletedToday(map);
      setValues({});
    }
  }

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Compliance & Safety</h1>
        <p className="text-slate-600 mt-1">Daily fridge, food temperature, and allergen checks — morning, daytime, and evening.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => {
          const doneCount = ITEMS.filter((item) => completedToday[`${p}|${item}`]).length;
          const done = doneCount === ITEMS.length;
          return (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${period === p ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-300"}`}>
              {done && <CheckCircle2 size={14} className="text-emerald-700" />}
              {PERIOD_LABEL[p]} ({doneCount}/{ITEMS.length})
            </button>
          );
        })}
      </div>

      <Card className="p-5">
        <form onSubmit={submitPeriod} className="space-y-4">
          {ITEMS.map((item) => {
            const already = completedToday[`${period}|${item}`];
            return (
              <div key={item} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 pb-3 last:border-0">
                <div className="flex-1">
                  <div className="text-sm text-slate-800">{item}</div>
                  {already && <div className="text-[11px] text-emerald-700">Recorded: {already.value || already.status}</div>}
                </div>
                {!already && (
                  <>
                    <input
                      placeholder="Reading / note"
                      value={values[item] || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [item]: e.target.value }))}
                      className="w-full sm:w-40 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                    <select
                      value={values[`${item}_status`] || "pass"}
                      onChange={(e) => setValues((v) => ({ ...v, [`${item}_status`]: e.target.value }))}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                      <option value="na">N/A</option>
                    </select>
                  </>
                )}
              </div>
            );
          })}
          <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? "Saving…" : `Submit ${PERIOD_LABEL[period]} checks`}
          </button>
        </form>
      </Card>

      <p className="text-[11px] text-slate-500">
        This checklist is a starting template. Once your real process is confirmed, the item list and required fields can be tailored exactly to how the kitchen actually works.
      </p>
    </Layout>
  );
}
