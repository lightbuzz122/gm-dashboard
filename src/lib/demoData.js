// Sample data used ONLY for the local design preview (VITE_DEMO=true).
// The live app never imports this when VITE_DEMO is off.

const def = (key, name, category, unit, direction, target, warning_pct = 5, sort_order = 0, aggregation = "sum") => ({
  key, name, category, unit, direction, target, warning_pct, critical_pct: warning_pct * 2.5,
  active: true, aggregation, sort_order,
});

// The same metric list the live database holds (schema seed + the imported set).
export const DEMO_DEFS = [
  def("total_sales", "Total Sales (Net)", "Sales", "currency", "higher_better", 510355, 3, 1),
  def("wet_sales", "Wet Sales (Net)", "Sales", "currency", "higher_better", 400200, 3, 2),
  def("dry_sales", "Dry Sales (Net)", "Sales", "currency", "higher_better", 110155, 3, 3),
  def("gross_profit", "Gross Profit", "Sales", "currency", "higher_better", 172000, 3, 4),
  def("wet_sales_discounts", "Wet Sales Discounts", "Sales", "currency", "lower_better", null, 5, 12),
  def("wet_sales_promotions", "Wet Sales Promotions", "Sales", "currency", "lower_better", null, 5, 13),
  def("dry_sales_discounts", "Dry Sales Discounts", "Sales", "currency", "lower_better", null, 5, 14),
  def("dry_sales_promotions", "Dry Sales Promotions", "Sales", "currency", "lower_better", null, 5, 15),
  def("cogs", "Cost of Goods Sold", "Sales", "currency", "lower_better", null, 5, 16),
  def("sales_forecast_wet", "Wet Sales Forecast", "Sales", "currency", "higher_better", null, 5, 17),
  def("sales_forecast_dry", "Dry Sales Forecast", "Sales", "currency", "higher_better", null, 5, 18),
  def("labour_pct", "Labour %", "Labour", "percent", "lower_better", 35, 3, 5, "average"),
  def("labour_scheduled_hours", "Scheduled Hours", "Labour", "number", "lower_better", null, 5, 20),
  def("labour_actual_hours", "Actual Hours", "Labour", "number", "lower_better", null, 5, 21),
  def("labour_overtime_hours", "Overtime Hours", "Labour", "number", "lower_better", 40, 10, 22),
  def("labour_foh_cost", "Labour Cost - FOH", "Labour", "currency", "lower_better", null, 5, 23),
  def("labour_boh_cost", "Labour Cost - BOH", "Labour", "currency", "lower_better", null, 5, 24),
  def("training_completion_pct", "Training Completion %", "People", "percent", "higher_better", 90, 5, 34, "average"),
  def("review_score", "Review Score (PTD)", "Guest", "number", "higher_better", 4.5, 2, 6, "average"),
  def("nps", "NPS (PTD)", "Guest", "number", "higher_better", 50, 5, 7, "average"),
  def("complaints", "Complaints (PTD)", "Guest", "number", "lower_better", 10, 10, 8),
  def("social_posts", "Social Media Posts", "Guest", "number", "higher_better", 20, 5, 25),
  def("preorder_revenue", "Preorder Revenue", "Guest", "currency", "higher_better", null, 5, 26),
  def("preorder_bookings", "Preorder Bookings", "Guest", "number", "higher_better", null, 5, 27),
  def("upsell_revenue", "Upsell / 5-Star Sales Revenue", "Guest", "currency", "higher_better", null, 5, 28),
  def("safety_checks_pct", "Safety Checks", "Compliance", "percent", "higher_better", 100, 3, 9, "average"),
  def("action_tickets_pct", "Action Tickets Closed On Time", "Tasks", "percent", "higher_better", 100, 5, 10, "average"),
  def("draught_yield_pct", "Draught Yield (All)", "Stock", "percent", "higher_better", 100, 2, 11, "average"),
  def("wet_stock_variance", "Wet Stock Variance", "Stock", "currency", "higher_better", 0, 5, 30),
  def("dry_stock_variance", "Dry Stock Variance", "Stock", "currency", "higher_better", 0, 5, 31),
  def("waste_value", "Waste Value", "Stock", "currency", "lower_better", 0, 5, 32),
  def("waste_pct_sales", "Waste % of Sales", "Stock", "percent", "lower_better", 2, 5, 33, "average"),
];

const weeks = ["2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"];

const SERIES = {
  total_sales: [468200, 489100, 455300, 502400, 478900, 496200, 481500, 472692],
  wet_sales: [352000, 371000, 340500, 389000, 361000, 377500, 366000, 358457],
  dry_sales: [116200, 118100, 114800, 113400, 117900, 118700, 115500, 114235],
  gross_profit: [160200, 168900, 155100, 171800, 163500, 169000, 165200, 164697],
  labour_pct: [34.1, 34.8, 35.4, 34.9, 35.8, 36.0, 35.6, 36.2],
  labour_overtime_hours: [31, 36, 44, 38, 47, 52, 49, 46],
  review_score: [4.4, 4.5, 4.45, 4.5, 4.55, 4.58, 4.52, 4.6],
  nps: [51, 48, 46, 47, 44, 43, 44, 42],
  complaints: [8, 9, 11, 7, 10, 8, 9, 12],
};

export const DEMO_ENTRIES = Object.entries(SERIES).flatMap(([kpi_key, vals]) =>
  vals.map((value, i) => ({ kpi_key, period_start: weeks[i], value }))
);

// Today's safety checks (pretend it's mid-afternoon).
export const DEMO_CHECKS = [
  ...["Fridge 1 Temperature", "Fridge 2 Temperature", "Freezer Temperature", "Hot Hold Food Temperature", "Allergen Check"]
    .map((item) => ({ period: "morning", item, status: "pass" })),
  { period: "daytime", item: "Fridge 1 Temperature", status: "pass" },
  { period: "daytime", item: "Fridge 2 Temperature", status: "pass" },
  { period: "daytime", item: "Freezer Temperature", status: "pass" },
  { period: "daytime", item: "Hot Hold Food Temperature", status: "fail" },
];
// Sample data used ONLY for the local design preview (VITE_DEMO=true).
// The live app never imports this when VITE_DEMO is off.

const def = (key, name, category, unit, direction, target, warning_pct = 5) => ({
  key, name, category, unit, direction, target, warning_pct, critical_pct: warning_pct * 2.5,
  active: true, aggregation: "sum", sort_order: 0,
});

export const DEMO_DEFS = [
  def("total_sales", "Total Sales (Net)", "Sales", "currency", "higher_better", 510355, 3),
  def("wet_sales", "Wet Sales (Net)", "Sales", "currency", "higher_better", 400200, 3),
  def("dry_sales", "Dry Sales (Net)", "Sales", "currency", "higher_better", 110155, 3),
  def("gross_profit", "Gross Profit", "Sales", "currency", "higher_better", 172000, 3),
  def("labour_pct", "Labour %", "Labour", "percent", "lower_better", 35, 3),
  def("labour_overtime_hours", "Overtime Hours", "Labour", "number", "lower_better", 40, 10),
  def("review_score", "Review Score", "Guest", "number", "higher_better", 4.5, 2),
  def("nps", "NPS", "Guest", "number", "higher_better", 50, 5),
  def("complaints", "Complaints", "Guest", "number", "lower_better", 10, 10),
];

const weeks = ["2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"];

const SERIES = {
  total_sales: [468200, 489100, 455300, 502400, 478900, 496200, 481500, 472692],
  wet_sales: [352000, 371000, 340500, 389000, 361000, 377500, 366000, 358457],
  dry_sales: [116200, 118100, 114800, 113400, 117900, 118700, 115500, 114235],
  gross_profit: [160200, 168900, 155100, 171800, 163500, 169000, 165200, 164697],
  labour_pct: [34.1, 34.8, 35.4, 34.9, 35.8, 36.0, 35.6, 36.2],
  labour_overtime_hours: [31, 36, 44, 38, 47, 52, 49, 46],
  review_score: [4.4, 4.5, 4.45, 4.5, 4.55, 4.58, 4.52, 4.6],
  nps: [51, 48, 46, 47, 44, 43, 44, 42],
  complaints: [8, 9, 11, 7, 10, 8, 9, 12],
};

export const DEMO_ENTRIES = Object.entries(SERIES).flatMap(([kpi_key, vals]) =>
  vals.map((value, i) => ({ kpi_key, period_start: weeks[i], value }))
);

// Today's safety checks (pretend it's mid-afternoon).
export const DEMO_CHECKS = [
  ...["Fridge 1 Temperature", "Fridge 2 Temperature", "Freezer Temperature", "Hot Hold Food Temperature", "Allergen Check"]
    .map((item) => ({ period: "morning", item, status: "pass" })),
  { period: "daytime", item: "Fridge 1 Temperature", status: "pass" },
  { period: "daytime", item: "Fridge 2 Temperature", status: "pass" },
  { period: "daytime", item: "Freezer Temperature", status: "pass" },
  { period: "daytime", item: "Hot Hold Food Temperature", status: "fail" },
];
