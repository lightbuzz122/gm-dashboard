import React, { useState } from "react";
import {
  Home, Gauge, PoundSterling, Users, GraduationCap, Heart, Layers,
  ShieldCheck, Package, ListChecks, Wrench, FileBarChart, Sparkles,
  Bell, ChevronDown, Plus, Star, Gift, Trophy, Calendar, CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/* ---------- tiny building blocks ---------- */

const Sparkline = ({ points, color }) => {
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
  <span className={`text-xs font-medium ${good ? "text-emerald-400" : "text-red-400"}`}>{value}</span>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-[#121826] border border-white/5 rounded-2xl ${className}`}>{children}</div>
);

const RingGauge = ({ value, size = 96, stroke = 10, color = "#f59e0b", track = "#2a2f3d" }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
};

const NAV = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: Gauge, label: "Performance" },
  { icon: PoundSterling, label: "Sales & Profit" },
  { icon: Users, label: "Labour" },
  { icon: GraduationCap, label: "People & Training" },
  { icon: Heart, label: "Guest Experience" },
  { icon: Layers, label: "Operations" },
  { icon: ShieldCheck, label: "Compliance & Safety" },
  { icon: Package, label: "Stock & Waste" },
  { icon: ListChecks, label: "Tasks & Actions" },
  { icon: Wrench, label: "Maintenance" },
  { icon: FileBarChart, label: "Reports" },
  { icon: Sparkles, label: "AI Insights" },
];

const TABS = ["Overview", "Sales & Profit", "Labour", "People", "Guest Experience", "Operations", "Compliance", "Stock & Waste"];

const kpis = [
  { label: "TOTAL SALES (NET)", value: "£472,692", sub: "vs Forecast £510,355", delta: "-7.4%", good: false, icon: PoundSterling, color: "#22c55e", pts: [30, 34, 28, 40, 33, 45, 38] },
  { label: "GROSS PROFIT", value: "£164,697", sub: "34.8% of Sales", delta: "-4.1%", good: false, icon: PoundSterling, color: "#a78bfa", pts: [40, 38, 35, 30, 28, 26, 24] },
  { label: "LABOUR %", value: "36.2%", sub: "vs Target 35.0%", delta: "+1.2pp", good: false, icon: Users, color: "#f97316", pts: [30, 32, 31, 34, 33, 35, 36] },
  { label: "REVIEW SCORE (PTD)", value: "4.60", sub: "vs Target 4.50", delta: "+0.10", good: true, icon: Star, color: "#38bdf8", pts: [4.4, 4.5, 4.45, 4.5, 4.55, 4.58, 4.6] },
  { label: "NPS (PTD)", value: "42", sub: "vs Target 50", delta: "-8", good: false, icon: Heart, color: "#f43f5e", pts: [50, 48, 45, 44, 43, 42, 42] },
];

const alerts = [
  { title: "High Labour %", body: "36.2% is 1.2pp over target", time: "10m ago" },
  { title: "Low Review Score", body: "Review score below target", time: "1h ago" },
  { title: "Missed Safety Checks", body: "5 checks overdue", time: "2h ago" },
  { title: "Stock Variance", body: "Wet stock gap over target", time: "2h ago" },
  { title: "OOS Events High", body: "4.43 avg events per day", time: "3h ago" },
  { title: "Overdue Tasks", body: "15 urgent/medium tasks overdue", time: "3h ago" },
];

const tasks = [
  { n: 15, label: "Overdue", color: "text-red-400" },
  { n: 9, label: "Due Today", color: "text-amber-400" },
  { n: 12, label: "Due This Week", color: "text-amber-300" },
  { n: 28, label: "Completed", color: "text-emerald-400" },
];

const accountability = ["KPI Tracker Completed", "Weekly Sales Summary", "Management Meeting Held", "FOH & BOH MOTQ Updated"];

const secondaryKpis = [
  { label: "Review Score (PTD)", value: "4.60", sub: "vs Last Week 4.72" },
  { label: "Complaints (PTD)", value: "12", sub: "vs Last Week 8" },
  { label: "# Social Media Posts", value: "11", sub: "vs Target 20" },
  { label: "Action Tickets", value: "89%", sub: "vs Target 100%", ring: 89 },
  { label: "Prides Completed", value: "75%", sub: "vs Target 100%" },
  { label: "Avg OOS Events / Day", value: "4.43", sub: "vs Last Week 2.43" },
  { label: "NPS (PTD)", value: "42", sub: "vs Target 50" },
  { label: "Food Quality NPS", value: "75%", sub: "vs Last Week 60%" },
];

/* ---------- app ---------- */

export default function App() {
  const [tab, setTab] = useState("Overview");

  return (
    <div className="min-h-screen w-full bg-[#0a0e17] text-slate-200 flex font-sans text-[13px]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/5 p-4 flex flex-col gap-1 bg-[#0c111c]">
        <div className="flex items-center gap-2 px-2 pb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">A</div>
          <div>
            <div className="font-semibold tracking-wide text-sm leading-tight">ALWYNE CASTLE</div>
            <div className="text-[10px] text-slate-500 tracking-widest">LONDON</div>
          </div>
        </div>
        {NAV.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
              active ? "bg-indigo-600/90 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 flex">
        <main className="flex-1 p-6 space-y-5 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Good morning, Nathan 👋</h1>
              <p className="text-slate-500 mt-1">Here's how Alwyne Castle is performing today.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[#121826] border border-white/10 rounded-lg px-3 py-2 text-slate-300">
                <Calendar size={14} /> 20 May – 26 May 2024
              </button>
              <button className="flex items-center gap-2 bg-[#121826] border border-white/10 rounded-lg px-3 py-2 text-slate-300">
                Compare: Last Week <ChevronDown size={14} />
              </button>
              <button className="relative"><Bell size={18} className="text-slate-400" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">8</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
                <div>
                  <div className="text-sm font-medium text-white leading-tight">Nathan Collins</div>
                  <div className="text-[11px] text-slate-500">General Manager</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-white/5">
            <div className="flex gap-6 overflow-x-auto">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`pb-3 whitespace-nowrap text-sm ${tab === t ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300"}`}>
                  {t}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 transition text-white text-sm px-3 py-1.5 rounded-lg mb-2 shrink-0">
              <Plus size={14} /> Add Widget
            </button>
          </div>

          {tab !== "Overview" ? (
            <Card className="p-10 text-center text-slate-500">
              {tab} — this tab isn't built out in the prototype yet. Overview is the fully working demo.
            </Card>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-5 gap-4">
                {kpis.map((k) => (
                  <Card key={k.label} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: k.color + "22" }}>
                        <k.icon size={14} style={{ color: k.color }} />
                      </div>
                      <span className="text-[10px] tracking-wider text-slate-500">{k.label}</span>
                    </div>
                    <div className="text-xl font-semibold text-white">{k.value}</div>
                    <div className="flex items-center gap-2 mt-0.5 mb-1">
                      <span className="text-[11px] text-slate-500">{k.sub}</span>
                      <Delta value={k.delta} good={k.good} />
                    </div>
                    <Sparkline points={k.pts} color={k.color} />
                  </Card>
                ))}
              </div>

              {/* Sales / Labour panels */}
              <div className="grid grid-cols-2 gap-5">
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Sales Performance</h3>
                    <div className="flex bg-[#1a2130] rounded-lg p-0.5 text-xs">
                      <button className="px-3 py-1 rounded-md bg-indigo-600 text-white">This Week</button>
                      <button className="px-3 py-1 text-slate-400">YTD</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      {[
                        ["WET SALES (NET)", "£358,457", "vs Forecast £400,200", "-10.4%", false],
                        ["DRY SALES (NET)", "£114,235", "vs Forecast £110,155", "+3.7%", true],
                        ["TOTAL SALES (NET)", "£472,692", "vs Forecast £510,355", "-7.4%", false],
                      ].map(([l, v, s, d, g]) => (
                        <div key={l}>
                          <div className="text-[10px] text-slate-500 tracking-wide">{l}</div>
                          <div className="text-lg font-semibold text-white">{v}</div>
                          <div className="flex gap-2 text-[11px]"><span className="text-slate-500">{s}</span><Delta value={d} good={g} /></div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 text-[12px]">
                      {[
                        ["Sales vs Contract (£)", "-£36,957"],
                        ["Sales vs Budget", "-6.2%"],
                        ["Sales vs LYR", "+5.6%"],
                        ["Actual vs GM Forecast", "-7.4%"],
                      ].map(([l, v]) => (
                        <div key={l} className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-slate-500">{l}</span>
                          <span className={v.startsWith("-") ? "text-red-400" : "text-emerald-400"}>{v}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-slate-500 pt-1">
                        <span>Sessions within 10% Forecast</span>
                      </div>
                      <div className="flex gap-6">
                        <div><span className="text-slate-500">WET </span><span className="text-emerald-400 font-medium">75%</span></div>
                        <div><span className="text-slate-500">DRY </span><span className="text-emerald-400 font-medium">60%</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-[#0e1420] rounded-xl p-3 flex items-center gap-2">
                      <Star size={16} className="text-amber-400" />
                      <div>
                        <div className="text-[11px] text-slate-400">5 Star Sales Extra Upsells (1 week behind)</div>
                        <div className="text-sm font-medium text-white">£17,169 <span className="text-emerald-400 text-xs">+8.3%</span></div>
                      </div>
                    </div>
                    <div className="bg-[#0e1420] rounded-xl p-3 flex items-center gap-2">
                      <Gift size={16} className="text-pink-400" />
                      <div>
                        <div className="text-[11px] text-slate-400">Preorder Spend Per Booking</div>
                        <div className="text-sm font-medium text-white">£31 <span className="text-red-400 text-xs">-1.4%</span></div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Labour Overview</h3>
                    <div className="flex bg-[#1a2130] rounded-lg p-0.5 text-xs">
                      <button className="px-3 py-1 rounded-md bg-indigo-600 text-white">This Week</button>
                      <button className="px-3 py-1 text-slate-400">YTD</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="text-[11px] text-slate-500">Labour Spend (£)</div>
                        <div className="text-lg font-semibold text-white">£164,697</div>
                        <div className="flex gap-2 text-[11px]"><span className="text-slate-500">vs Contract £157,550</span><Delta value="+£7,147" good={false} /></div>
                      </div>
                      <div className="flex gap-6">
                        <div>
                          <div className="text-[11px] text-slate-500">Labour vs Contract</div>
                          <div className="text-red-400 font-medium">+£7,147</div>
                          <div className="text-[10px] text-slate-500">Over</div>
                        </div>
                        <div>
                          <div className="text-[11px] text-slate-500">Flex vs Contract</div>
                          <div className="text-emerald-400 font-medium">-£10,843</div>
                          <div className="text-[10px] text-slate-500">Saved</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">Teamplan Schedule Accuracy</div>
                        <div className="flex items-center gap-2"><span className="text-amber-400 font-medium">68%</span><span className="text-[11px] text-slate-500">vs Target 75% -7pp</span></div>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-center shrink-0">
                      <RingGauge value={72} color="#ef4444" size={110} stroke={12} />
                      <div className="absolute text-center">
                        <div className="text-lg font-semibold text-white">36.2%</div>
                        <div className="text-[10px] text-slate-500">of Sales</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Secondary KPI row */}
              <div className="grid grid-cols-8 gap-3">
                {secondaryKpis.map((k) => (
                  <Card key={k.label} className="p-3">
                    <div className="text-[10px] text-slate-500 mb-2 leading-tight h-7">{k.label}</div>
                    {k.ring ? (
                      <div className="relative w-12 h-12 mx-auto">
                        <RingGauge value={k.ring} size={48} stroke={5} color="#22c55e" />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">{k.value}</div>
                      </div>
                    ) : (
                      <div className="text-lg font-semibold text-white">{k.value}</div>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
                  </Card>
                ))}
              </div>

              {/* Safety / Stock / Sales summary row */}
              <div className="grid grid-cols-3 gap-5">
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Safety & Compliance</h3>
                    <span className="text-indigo-400 text-xs cursor-pointer">View Calendar</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <RingGauge value={93} color="#22c55e" size={90} stroke={9} />
                      <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white">93%</div>
                    </div>
                    <div className="text-[11px] space-y-2 flex-1">
                      <div className="flex justify-between"><span className="text-slate-500">Safety Checks Missed / Overdue</span><span className="text-red-400 font-medium bg-red-500/10 px-1.5 rounded">11</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Verisae Jobs Signed Off</span><span className="text-white">4/5</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Food / H&S / Allergen / EHO</span><span className="text-white">5/5</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Counts Compliance (%)</span><span className="text-emerald-400">100%</span></div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-3">vs Target 100% <span className="text-red-400">-7pp</span></div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-semibold text-white mb-4">Stock & Yield</h3>
                  <div className="space-y-2 text-[12px]">
                    {[
                      ["Wet Stock Gap (PTD)", "-£1,281", false],
                      ["Wet Stock Gap (YTD)", "-£23,927", false],
                      ["Dry Stock Gap (PTD)", "£531", true],
                      ["Dry Stock Gap (YTD)", "-£13,052", false],
                      ["Draught Yield (All) PTD", "99.5%", true],
                      ["Draught Yield (All) YTD", "99.7%", true],
                    ].map(([l, v, g]) => (
                      <div key={l} className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-500">{l}</span>
                        <span className={g ? "text-emerald-400" : "text-red-400"}>{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-semibold text-white mb-4">Sales & Profit Summary</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-[10px] text-slate-500">Profit</div>
                      <div className="text-lg font-semibold text-white">£782,450</div>
                      <div className="text-[10px] text-slate-500">31.5% of Sales</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Gross Margin</div>
                      <div className="text-lg font-semibold text-white">34.8%</div>
                      <div className="text-[10px] text-red-400">-3.1%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">Forecast Accuracy</div>
                      <div className="text-lg font-semibold text-white">92%</div>
                      <div className="text-[10px] text-slate-500">within 10% of GM Forecast</div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </main>

        {/* Right rail */}
        <aside className="w-80 shrink-0 border-l border-white/5 p-5 space-y-5 bg-[#0c111c]">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">Alerts & Notifications</h3>
              <span className="text-indigo-400 text-xs cursor-pointer">View all</span>
            </div>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.title} className="flex gap-2">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[12px] text-amber-300 font-medium">{a.title}</div>
                    <div className="text-[11px] text-slate-500">{a.body}</div>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white text-sm">Tasks Summary</h3>
              <span className="text-indigo-400 text-xs cursor-pointer">View all</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {tasks.map((t) => (
                <div key={t.label} className="bg-[#0e1420] rounded-lg py-2">
                  <div className={`text-lg font-semibold ${t.color}`}>{t.n}</div>
                  <div className="text-[9px] text-slate-500 leading-tight">{t.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-white text-sm mb-3">Management Accountability</h3>
            <div className="space-y-2">
              {accountability.map((a) => (
                <div key={a} className="flex items-center justify-between text-[12px]">
                  <span className="text-slate-400">{a}</span>
                  <CheckCircle2 size={15} className="text-emerald-400" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-white text-sm mb-3">Next Management Meeting</h3>
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-indigo-400" />
              <div className="flex-1">
                <div className="text-sm text-white">Tuesday, 28 May 2024</div>
                <div className="text-[11px] text-slate-500">10:00 AM</div>
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-500 transition text-white text-xs px-3 py-1.5 rounded-lg">Prepare</button>
            </div>
          </Card>

          <Card className="p-5 text-center">
            <div className="text-[11px] text-slate-500 mb-2 text-left">Venue Health Score</div>
            <div className="relative w-24 h-24 mx-auto">
              <RingGauge value={72} size={96} stroke={10} color="#f59e0b" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-white">72</div>
              </div>
            </div>
            <div className="text-amber-400 text-sm font-medium mt-1">Fair</div>
            <div className="text-[11px] text-slate-500">-6 vs last week</div>
            <button className="w-full mt-3 border border-white/10 rounded-lg py-1.5 text-xs text-slate-300 hover:bg-white/5">View Full Breakdown</button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
