// Read-only preview of LegacyIm1CleanupMigration.js's pure plan-building
// logic against REAL, currently-live production data — fetched via the
// same anonymous, read-only doGet endpoint the frontend already calls on
// every page load (frontend/src/api.js's API_URL). Performs zero writes:
// no Apps Script function is executed, no sheet is opened, no backup is
// created. Mirrors the Sprint 5 audit's own "verification only" approach in
// docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md.
//
// Usage: node scripts/import-staging/preview-legacy-cleanup-live.mjs [path-to-cached-planner-data.json]
// If no path is given, fetches fresh from the live endpoint.

import { legacyCleanupBuildPlan_, legacyCleanupBuildPreviewReport_ } from "../../apps-script-planning/LegacyIm1CleanupMigration.js";

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
const plan = legacyCleanupBuildPlan_({
  units: data.units,
  lessons: data.lessons,
  dailyProgress: data.dailyProgress,
});
const report = legacyCleanupBuildPreviewReport_(plan, new Date());

console.log("This preview performed zero writes: no Apps Script function was called, no sheet was opened.");
console.log(JSON.stringify(report, null, 2));
