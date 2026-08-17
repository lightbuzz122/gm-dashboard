import React, { useEffect, useState } from "react";
import { Plus, CheckCircle2, Circle, Clock } from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useSiteId } from "./Dashboard";

const STATUS_CYCLE = { open: "in_progress", in_progress: "done", done: "open" };
const STATUS_LABEL = { open: "Open", in_progress: "In progress", done: "Done" };

export default function Tasks() {
  const { profile } = useAuth();
  const siteId = useSiteId();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "task", assigned_to: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    load();
  }, [siteId]);

  function load() {
    setLoading(true);
    supabase.from("tasks").select("*").eq("site_id", siteId).order("created_at", { ascending: false })
      .then(({ data }) => {
        setTasks(data || []);
        setLoading(false);
      });
  }

  async function createTask(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      site_id: siteId,
      title: form.title,
      description: form.description || null,
      type: form.type,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      created_by: profile?.id,
    });
    setSaving(false);
    if (!error) {
      setForm({ title: "", description: "", type: "task", assigned_to: "", due_date: "" });
      setShowForm(false);
      load();
    }
  }

  async function cycleStatus(task) {
    const next = STATUS_CYCLE[task.status];
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    await supabase.from("tasks").update({ status: next }).eq("id", task.id);
  }

  const tasksList = tasks.filter((t) => t.type === "task");
  const handovers = tasks.filter((t) => t.type === "handover");

  return (
    <Layout>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tasks & Actions</h1>
          <p className="text-slate-500 mt-1">Handover notes and assigned tasks — click the status icon to move a task along.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition text-white rounded-lg px-3 py-2">
          <Plus size={14} /> {showForm ? "Cancel" : "New"}
        </button>
      </div>

      {showForm && (
        <Card className="p-5">
          <form onSubmit={createTask} className="space-y-3">
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="radio" checked={form.type === "task"} onChange={() => setForm((f) => ({ ...f, type: "task" }))} />
                Task (assign to someone)
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="radio" checked={form.type === "handover"} onChange={() => setForm((f) => ({ ...f, type: "handover" }))} />
                Handover note
              </label>
            </div>
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-[#0e1420] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
              required
            />
            <textarea
              placeholder="Details / notes"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-[#0e1420] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 min-h-20"
            />
            {form.type === "task" && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Assign to (name or email)"
                  value={form.assigned_to}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                  className="bg-[#0e1420] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="bg-[#0e1420] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                />
              </div>
            )}
            <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-semibold text-white mb-4">Tasks</h3>
          {loading ? <p className="text-slate-500 text-sm">Loading…</p> : tasksList.length === 0 ? (
            <p className="text-slate-500 text-sm">No tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {tasksList.map((t) => (
                <div key={t.id} className="flex items-start gap-3">
                  <button onClick={() => cycleStatus(t)} className="mt-0.5 shrink-0">
                    {t.status === "done" ? <CheckCircle2 size={18} className="text-emerald-400" /> :
                     t.status === "in_progress" ? <Clock size={18} className="text-amber-400" /> :
                     <Circle size={18} className="text-slate-500" />}
                  </button>
                  <div className="flex-1">
                    <div className={`text-sm ${t.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>{t.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.assigned_to && `Assigned to ${t.assigned_to}`}{t.due_date && ` · Due ${t.due_date}`} · {STATUS_LABEL[t.status]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-white mb-4">Handover notes</h3>
          {loading ? <p className="text-slate-500 text-sm">Loading…</p> : handovers.length === 0 ? (
            <p className="text-slate-500 text-sm">No handover notes yet.</p>
          ) : (
            <div className="space-y-3">
              {handovers.map((t) => (
                <div key={t.id} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="text-sm text-slate-200">{t.title}</div>
                  {t.description && <div className="text-[12px] text-slate-500 mt-0.5">{t.description}</div>}
                  <div className="text-[11px] text-slate-600 mt-1">{new Date(t.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
