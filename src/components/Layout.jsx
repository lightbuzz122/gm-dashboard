import React from "react";
import Sidebar from "./Sidebar";

// One shell for every page: dark navigation + light content.
// On phones the navigation becomes a top bar with a slide-out menu.
export function Shell({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F3F5F9]">
      <Sidebar />
      <main
        className="flex-1 min-w-0 p-4 sm:p-5 md:p-7 space-y-5 text-slate-800 text-[14px]"
        style={{ background: "#F3F5F9" }}
      >
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children }) {
  return <Shell>{children}</Shell>;
}

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>{children}</div>
);
