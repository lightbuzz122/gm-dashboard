import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#0a0e17] text-slate-200 flex font-sans text-[13px]">
      <Sidebar />
      <main className="flex-1 p-6 space-y-5 min-w-0">{children}</main>
    </div>
  );
}

export const Card = ({ children, className = "" }) => (
  <div className={`bg-[#121826] border border-white/5 rounded-2xl ${className}`}>{children}</div>
);
