// Read-only preview of UnitsArchiveMigration.js's pure plan-building logic
// against REAL, currently-live production data — fetched via the same
// anonymous, read-only doGet endpoint the frontend already calls. Performs
// zero writes: no Apps Script function is executed, no sheet is opened, no
// backup is created.
//
// Usage: node scripts/import-staging/preview-units-archive-live.mjs [path-to-cached-planner-data.json]

import { unitsArchiveBuildPlan_, unitsArchiveBuildPreviewReport_ } from "../../apps-script-planning/UnitsArchiveMigration.js";

const API_URL =
  "https://script.google.com/macros/s/AKfycbz8lBGl75prYnpy9YT32XK2bVgUaZi96zl8NbQw6n7E-PSx7SIT6mP79-McBfrVvBhA/exec";

async function loadData() {
  const cachedPath = process.argv[2];
  if (cachedPath) {
    const fs = await import("node:fs");
    return JSON.parse(fs.readFileSync(cachedPath, "utf8"));
  }
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch planner data: " + response.status);
  return response.json();
}

const data = await loadData();
// The live doGet response is already header-keyed objects (no separate
// headers array) — derive the header list from the union of keys present
// (every Units row shares the same shape today), which is exactly what
// unitsArchiveBuildPlan_ needs to classify schema state.
const headers = data.units.length > 0 ? Object.keys(data.units[0]) : [];
const plan = unitsArchiveBuildPlan_({ headers, objects: data.units });
const report = unitsArchiveBuildPreviewReport_(plan, new Date());

console.log("This preview performed zero writes: no Apps Script function was called, no sheet was opened.");
console.log(JSON.stringify(report, null, 2));
