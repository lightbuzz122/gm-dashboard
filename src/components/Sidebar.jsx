import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, PoundSterling, Users, GraduationCap, Heart, Layers,
  ShieldCheck, Package, ListChecks, Wrench, FileBarChart, Sparkles,
  LogOut, ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const NAV = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: PoundSterling, label: "Sales & Profit", path: "/category/Sales" },
  { icon: Users, label: "Labour", path: "/category/Labour" },
  { icon: GraduationCap, label: "People & Training", path: "/category/People" },
  { icon: Heart, label: "Guest Experience", path: "/category/Guest" },
  { icon: Layers, label: "Operations", path: "/compliance" },
  { icon: ShieldCheck, label: "Compliance & Safety", path: "/compliance" },
  { icon: Package, label: "Stock & Waste", path: "/category/Stock" },
  { icon: ListChecks, label: "Tasks & Actions", path: "/tasks" },
  { icon: Wrench, label: "Maintenance", path: "/coming-soon" },
  { icon: FileBarChart, label: "Reports", path: "/coming-soon" },
  { icon: Sparkles, label: "AI Insights", path: "/coming-soon" },
];

export default function Sidebar() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-56 shrink-0 border-r border-white/5 p-4 flex flex-col gap-1 bg-[#0c111c] h-screen sticky top-0 overflow-y-auto">
      <div className="flex items-center gap-2 px-2 pb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">A</div>
        <div>
          <div className="font-semibold tracking-wide text-sm leading-tight">ALWYNE CASTLE</div>
          <div className="text-[10px] text-slate-500 tracking-widest">LONDON</div>
        </div>
      </div>

      {NAV.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <Link key={label} to={path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition text-[13px] ${active ? "bg-indigo-600/90 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        );
      })}

      <Link to="/admin"
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[13px] mt-2 border-t border-white/5 pt-4 ${location.pathname === "/admin" ? "bg-indigo-600/90 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
        <ShieldAlert size={16} />
        <span>Admin</span>
      </Link>

      <div className="mt-auto pt-4 border-t border-white/5">
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2 rounded-lg text-left text-slate-400 hover:bg-white/5 hover:text-slate-200 w-full text-[13px]">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
