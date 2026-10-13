// The parts of the business that will each get their own set of procedures.
// Each one opens a placeholder page for now; the real procedures are added
// once they've been confirmed against the site's own manuals.
export const OPERATIONS_AREAS = [
  { slug: "opening-closing", name: "Opening & closing", desc: "Opening up, closing down, locking up, alarms and keys." },
  { slug: "bar", name: "Bar service", desc: "Serving, pouring, licensing conditions and Challenge 25." },
  { slug: "cellar", name: "Cellar & lines", desc: "Cask and keg handling, line cleaning, gas and temperatures." },
  { slug: "kitchen", name: "Kitchen", desc: "Prep, cooking, food safety, allergens and closing down." },
  { slug: "front-of-house", name: "Front of house", desc: "Greeting, table service, bookings and handling guests." },
  { slug: "cleaning", name: "Cleaning", desc: "Cleaning schedules, chemicals and deep cleans." },
  { slug: "deliveries-stock", name: "Deliveries & stock", desc: "Goods in, storage, rotation, ordering and stocktake." },
  { slug: "cash-handling", name: "Cash handling", desc: "Tills, cash-up, safe, banking and floats." },
  { slug: "health-safety", name: "Health & safety", desc: "Risk assessments, fire safety, first aid and accident reporting." },
  { slug: "emergencies", name: "Emergencies & incidents", desc: "Fire, evacuation, injuries, ejections and who to call." },
  { slug: "maintenance", name: "Maintenance & equipment", desc: "Reporting faults, servicing and contractor call-outs." },
  { slug: "staff", name: "Staff & training", desc: "Starters, inductions, uniform, breaks and training records." },
  { slug: "events", name: "Events & functions", desc: "Large bookings, live music, sport and set-up." },
  { slug: "licensing", name: "Licensing & compliance", desc: "Premises licence, certificates, inspections and records." },
];
