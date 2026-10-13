import React from "react";
import { Link } from "react-router-dom";
import {
  DoorOpen, Beer, Warehouse, UtensilsCrossed, ConciergeBell, SprayCan, Truck, Banknote,
  ShieldCheck, Siren, Wrench, Users, CalendarDays, FileCheck, ChevronRight,
} from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { OPERATIONS_AREAS } from "../lib/operationsAreas";

const ICONS = {
  "opening-closing": DoorOpen, bar: Beer, cellar: Warehouse, kitchen: UtensilsCrossed,
  "front-of-house": ConciergeBell, cleaning: SprayCan, "deliveries-stock": Truck,
  "cash-handling": Banknote, "health-safety": ShieldCheck, emergencies: Siren,
  maintenance: Wrench, staff: Users, events: CalendarDays, licensing: FileCheck,
};

export default function Operations() {
  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Operations</h1>
        <p className="text-slate-600 mt-1">Procedures for each part of the business. Choose an area to open its procedures.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {OPERATIONS_AREAS.map((a) => {
          const Icon = ICONS[a.slug] || ShieldCheck;
          return (
            <Link key={a.slug} to={`/operations/${a.slug}`} className="group">
              <Card className="p-5 h-full flex items-start gap-4 transition group-hover:border-indigo-300 group-hover:shadow-md">
                <span className="h-11 w-11 shrink-0 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Icon size={22} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] font-semibold text-slate-900">{a.name}</div>
                  <div className="text-[13px] text-slate-600 mt-0.5">{a.desc}</div>
                </div>
                <ChevronRight size={18} className="text-slate-400 mt-1 group-hover:text-indigo-600" />
              </Card>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
}
