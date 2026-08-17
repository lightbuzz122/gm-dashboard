import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import Layout, { Card } from "../components/Layout";

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay() || 7; // Mon=1..Sun=7
  if (day !== 1) date.setDate(date.getDate() - (day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

export default function DataEntry() {
  const { profile } = useAuth();
  const [kpis, setKpis] = useState([]);
  const [values, setValues] = useState({});
  const [periodStart, setPeriodStart] = useState(toISODate(startOfWeek(new Date())));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const periodEnd = toISODate(
    new Date(new Date(periodStart).getTime() + 6 * 24 * 60 * 60 * 1000)
  );

  useEffect(() => {
    supabase
      .from("kpis")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setKpis(data || []);
        setLoading(false);
      });
  }, []);

  // Load any existing entries for the selected week so re-visiting/editing works
  useEffect(() => {
    if (!profile?.site_id) return;
    supabase
      .from("kpi_entries")
      .select("kpi_key, value")
      .eq("site_id", profile.site_id)
      .eq("period_start", periodStart)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((row) => (map[row.kpi_key] = row.value));
        setValues(map);
      });
  }, [profile, periodStart]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const rows = kpis
      .filter((k) => values[k.key] !== undefined && values[k.key] !== "")
      .map((k) => ({
        site_id: profile.site_id,
        kpi_key: k.key,
        period_start: periodStart,
        period_end: periodEnd,
        value: Number(values[k.key]),
        entered_by: profile.id,
      }));

    if (rows.length === 0) {
      setSaving(false);
      setError("Enter at least one value before saving.");
      return;
    }

    const { error } = await supabase
      .from("kpi_entries")
      .upsert(rows, { onConflict: "site_id,kpi_key,period_start" });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const grouped = kpis.reduce((acc, k) => {
    (acc[k.category] ||= []).push(k);
    return acc;
  }, {});

  return (
    <Layout>
      <h1 className="text-xl font-semibold text-white mb-1">Weekly data entry</h1>
      <p className="text-slate-500 text-sm mb-6">
        Enter this week's actuals — same fields you'd normally type into the spreadsheet.
      </p>

      <div className="mb-6">
        <label className="text-xs text-slate-500">Week starting (Monday)</label>
        <input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className="block mt-1 bg-[#121826] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <p className="text-[11px] text-slate-600 mt-1">Week: {periodStart} → {periodEnd}</p>
      </div>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading fields…</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-[#121826] border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">{category}</h2>
              <div className="grid grid-cols-2 gap-4">
                {items.map((k) => (
                  <div key={k.key}>
                    <label className="text-xs text-slate-500">
                      {k.name}
                      {k.unit === "currency" && " (£)"}
                      {k.unit === "percent" && " (%)"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={values[k.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [k.key]: e.target.value }))}
                      placeholder={k.target != null ? `Target: ${k.target}` : ""}
                      className="w-full mt-1 bg-[#0e1420] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm px-4 py-2.5 rounded-lg disabled:opacity-50"
          >
            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {saving ? "Saving…" : saved ? "Saved" : "Save week"}
          </button>
        </form>
      )}
    </Layout>
  );
}
