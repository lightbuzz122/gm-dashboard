import React from "react";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Layout, { Card } from "../components/Layout";

export default function ComingSoon() {
  return (
    <Layout>
      <Card className="p-12 text-center max-w-lg mx-auto mt-10">
        <Sparkles size={28} className="text-indigo-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white mb-2">Coming soon</h2>
        <p className="text-slate-500 text-sm">
          This tab needs its own real design conversation before it's built — not something worth rushing.
          Flag it if you want it prioritised next.
        </p>
      </Card>
    </Layout>
  );
}
