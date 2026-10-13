import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import Layout, { Card } from "../components/Layout";
import { OPERATIONS_AREAS } from "../lib/operationsAreas";

// Placeholder for one area's procedures. The real content is added once it has
// been confirmed against the site's own manual.
export default function OperationsArea() {
  const { slug } = useParams();
  const area = OPERATIONS_AREAS.find((a) => a.slug === slug);
  return (
    <Layout>
      <Link to="/operations" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-indigo-700 hover:text-indigo-900">
        <ArrowLeft size={16} /> All operations
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{area ? area.name : "Operations"}</h1>
        {area && <p className="text-slate-600 mt-1">{area.desc}</p>}
      </div>
      <Card className="p-10 text-center max-w-xl">
        <BookOpen size={28} className="text-indigo-700 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Procedures coming soon</h2>
        <p className="text-slate-600 text-sm">
          These will be added once they've been confirmed against your own manuals.
        </p>
      </Card>
    </Layout>
  );
}
