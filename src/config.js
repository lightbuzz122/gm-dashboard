// Display settings for the venue shown in the sidebar and dashboard.
// Change these to the real site name when you're ready.
export const SITE = {
  name: "Current site",
  area: "London",
};

// The daily safety checks, in the order they appear on the checklist.
export const CHECK_ITEMS = [
  "Fridge 1 Temperature",
  "Fridge 2 Temperature",
  "Freezer Temperature",
  "Hot Hold Food Temperature",
  "Allergen Check",
];

export const CHECK_PERIODS = ["morning", "daytime", "evening"];
export const CHECK_PERIOD_LABEL = { morning: "Morning", daytime: "Daytime", evening: "Evening" };

// Hour of day (24h) by which each round of checks should be done.
export const CHECK_DUE_HOUR = { morning: 11, daytime: 16, evening: 22 };

export const DEMO = import.meta.env.VITE_DEMO === "true";
