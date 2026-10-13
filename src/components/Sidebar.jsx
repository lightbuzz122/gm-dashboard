import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, PoundSterling, Users, GraduationCap, Heart, Layers,
  ShieldCheck, Package, ListChecks, Wrench, FileBarChart, Sparkles,
  LogOut, ShieldAlert, Menu, X, Beer,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SITE } from "../config";

export const NAV = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: PoundSterling, label: "Sales & Profit", path: "/category/Sales" },
  { icon: Users, label: "Labour", path: "/category/Labour" },
  { icon: GraduationCap, label: "People & Training", path: "/category/People" },
  { icon: Heart, label: "Guest Experience", path: "/category/Guest" },
  { icon: Layers, label: "Operations", path: "/operations" },
  { icon: ShieldCheck, label: "Compliance & Safety", path: "/compliance" },
  { icon: Package, label: "Stock & Waste", path: "/category/Stock" },
  { icon: ListChecks, label: "Tasks & Actions", path: "/tasks" },
  { icon: Wrench, label: "Maintenance", path: "/coming-soon" },
  { icon: FileBarChart, label: "Reports", path: "/coming-soon" },
  { icon: Sparkles, label: "AI Insights", path: "/coming-soon" },
];

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
        <Beer size={18} />
      </div>
      <div>
        <div className="font-semibold text-[14px] leading-tight text-white">{SITE.name}</div>
        <div className="text-[11px] text-slate-400 tracking-widest uppercase mt-0.5">{SITE.area}</div>
      </div>
    </div>
  );
}

function NavList({ onNavigate }) {
  const { signOut } = useAuth();
  const location = useLocation();
  const item = (active) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition text-[14px] ${active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`;
  return (
    <>
      {NAV.map(({ icon: Icon, label, path }) => (
        <Link key={label} to={path} onClick={onNavigate} className={item(location.pathname === path || (path !== "/" && location.pathname.startsWith(path + "/")))}>
          <Icon size={17} />
          <span>{label}</span>
        </Link>
      ))}
      <Link to="/admin" onClick={onNavigate} className={`${item(location.pathname === "/admin")} mt-2`}>
        <ShieldAlert size={17} />
        <span>Admin</span>
      </Link>
      <div className="mt-auto pt-4 border-t border-white/10">
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-slate-300 hover:bg-white/5 hover:text-white w-full text-[14px]">
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      {/* Desktop / tablet: fixed side navigation */}
      <aside className="hidden md:flex w-56 shrink-0 p-4 flex-col gap-1 bg-[#0c111c] h-screen sticky top-0 overflow-y-auto">
        <div className="px-2 pb-5"><Brand /></div>
        <NavList />
      </aside>

      {/* Phone: top bar + slide-out menu */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-[#0c111c] px-4 py-3">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 -mr-2 text-white">
          <Menu size={24} />
        </button>
      </header>
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="relative w-72 max-w-[85%] bg-[#0c111c] p-4 flex flex-col gap-1 h-full overflow-y-auto">
            <div className="flex items-center justify-between px-2 pb-4">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 text-white"><X size={22} /></button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </>
  );
}
