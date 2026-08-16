import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const liveSource = process.argv[2];
if (!liveSource) throw new Error("Usage: node generate-im1-parity-preview.mjs <read-only-api-url-or-snapshot.json>");

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
const artifact = readJson("data/import-staging/amplify-im1.json");
const review = readJson("data/goal-staging/amplify-im1-goal-review.json");
let live;
if (/^https?:\/\//.test(liveSource)) {
  const response = await fetch(liveSource);
  if (!response.ok) throw new Error(`Read-only API returned ${response.status}.`);
  live = await response.json();
} else {
  live = JSON.parse(fs.readFileSync(path.resolve(liveSource), "utf8"));
}

const expectedUnitIds = new Set(artifact.units.map((unit) => unit.unitId));
const liveUnits = live.units.filter((unit) => expectedUnitIds.has(unit.UnitID));
const liveLessons = live.lessons.filter((lesson) => expectedUnitIds.has(lesson.UnitID));
const unitsById = new Map(liveUnits.map((unit) => [unit.UnitID, unit]));
const lessonsById = new Map(liveLessons.map((lesson) => [lesson.LessonID, lesson]));
const blockers = [];
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

if (liveUnits.length !== 7) blockers.push(`Expected 7 active IM1 units; found ${liveUnits.length}.`);
if (liveLessons.length !== 164) blockers.push(`Expected 164 active IM1 items; found ${liveLessons.length}.`);

const unitChanges = artifact.units.map((unit) => {
  const before = unitsById.get(unit.unitId);
  if (!before) blockers.push(`Missing live UnitID ${unit.unitId}.`);
  if (before && (before.CourseID !== "IM1" || before.UnitTitle !== unit.title)) {
    blockers.push(`${unit.unitId} identity or title drifted.`);
  }
  if (before && String(before.UnitPurpose || "") && before.UnitPurpose !== unit.purpose) {
    blockers.push(`${unit.unitId} already has a different UnitPurpose.`);
  }
  return {
    UnitID: unit.unitId,
    BeforeUnitPurpose: before?.UnitPurpose || "",
    AfterUnitPurpose: unit.purpose,
    ChangedFields: before?.UnitPurpose === unit.purpose ? [] : ["UnitPurpose"],
  };
});

const lessonChanges = review.inventory.map((item) => {
  const before = lessonsById.get(item.LessonID);
  if (!before) blockers.push(`Missing live LessonID ${item.LessonID}.`);
  if (before && (before.CourseID !== "IM1" || before.UnitID !== item.UnitID || before.LessonTitle !== item.LessonTitle)) {
    blockers.push(`${item.LessonID} identity or title drifted.`);
  }
  if (before && String(before.KeyOutcome || "") && before.KeyOutcome !== item.SerializedKeyOutcome) {
    blockers.push(`${item.LessonID} already has a different KeyOutcome.`);
  }
  if (before && before.PlannedDays !== "" && before.PlannedDays !== null && before.PlannedDays !== undefined && Number(before.PlannedDays) !== 1) {
    blockers.push(`${item.LessonID} already has a teacher PlannedDays value other than 1.`);
  }
  const changedFields = [];
  if (before?.KeyOutcome !== item.SerializedKeyOutcome) changedFields.push("KeyOutcome");
  if (Number(before?.PlannedDays) !== 1 || before?.PlannedDays === "") changedFields.push("PlannedDays");
  const nonParity = {};
  for (const [key, value] of Object.entries(before || {})) {
    if (key !== "KeyOutcome" && key !== "PlannedDays") nonParity[key] = value;
  }
  return {
    LessonID: item.LessonID,
    UnitID: item.UnitID,
    LessonTitle: item.LessonTitle,
    BeforeKeyOutcome: before?.KeyOutcome || "",
    AfterKeyOutcome: item.SerializedKeyOutcome,
    BeforePlannedDays: before?.PlannedDays ?? "",
    AfterPlannedDays: 1,
    NonParitySHA256: sha256(stableJson(nonParity)),
    ChangedFields: changedFields,
  };
});

const preview = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceSnapshotLastUpdated: live.lastUpdated,
  courseId: "IM1",
  acceptanceCriterion: "Integrated Math 1 renders through the same Year Planner presentation as Math 8, using Math 1 curriculum content.",
  proposedChangeCounts: {
    UnitPurpose: unitChanges.filter((row) => row.ChangedFields.includes("UnitPurpose")).length,
    KeyOutcome: lessonChanges.filter((row) => row.ChangedFields.includes("KeyOutcome")).length,
    PlannedDays: lessonChanges.filter((row) => row.ChangedFields.includes("PlannedDays")).length,
  },
  unchangedPublisherFields: ["UnitTitle", "UnitNumber", "LessonTitle", "Type", "Description", "SortOrder", "PlacementRule", "IsOptional"],
  blockers,
  safeToPrepareGuardedMigration: blockers.length === 0,
  writesOccurred: false,
  unitChanges,
  lessonChanges,
};

const outputDir = path.join(repoRoot, "data/parity-staging");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "amplify-im1-parity-preview.json"), JSON.stringify(preview, null, 2) + "\n");
console.log(JSON.stringify({
  sourceSnapshotLastUpdated: preview.sourceSnapshotLastUpdated,
  proposedChangeCounts: preview.proposedChangeCounts,
  blockers: preview.blockers,
  safeToPrepareGuardedMigration: preview.safeToPrepareGuardedMigration,
  writesOccurred: false,
}, null, 2));
