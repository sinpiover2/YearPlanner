import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifact } from "./generate-amplify-m8-artifact.mjs";
import { buildAmplifyM8ImportPlan } from "./build-amplify-m8-import-plan.mjs";
import { createFakeSpreadsheetFromFixture, createFakeSpreadsheetApp, createFakeLockService } from "./fake-spreadsheet.mjs";

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const importer = require(path.join(HERE, "../../apps-script-planning/AmplifyM8Importer.js"));
const data = require(path.join(HERE, "../../apps-script-planning/AmplifyM8ImportData.js"));
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const UNIT_HEADERS = importer.AMPLIFY_M8_REQUIRED_UNIT_HEADERS;
const LESSON_HEADERS = importer.AMPLIFY_M8_REQUIRED_LESSON_HEADERS;

function metadata(payload, overrides = {}) {
  const bytes = JSON.stringify(payload, null, 2) + "\n";
  const items = payload.units.flatMap((unit) => unit.items);
  const hash = sha256(bytes);
  return { schemaVersion: "2.0.0", profile: "amplify-m8", artifactSha256: hash,
    unitCount: payload.units.length, itemCount: items.length,
    fixedItemCount: items.filter((item) => item.order !== null).length,
    flexibleItemCount: items.filter((item) => item.order === null).length,
    confirmationPhrase: `IMPORT_AMPLIFY_M8_${hash.slice(0, 12)}_${payload.units.length}_${items.length}`, ...overrides };
}

function payload() {
  const field = (value, status = value === null ? "confirmed_absent" : "value_provided") => ({ value, status });
  const item = (itemId, order, placementRule, values) => ({ itemId, order, placementRule,
    type: values.type, typeStatus: field(values.type).status,
    title: values.title, titleStatus: field(values.title).status,
    subtitle: null, subtitleStatus: "confirmed_absent",
    summary: values.summary, summaryStatus: field(values.summary).status,
    isOptional: values.isOptional, isOptionalStatus: field(values.isOptional).status,
    provenance: { evidence: "fixture", optionalityEvidence: "fixture", placementEvidence: "fixture" } });
  return { schemaVersion: "2.0.0", course: { courseId: "M8" }, units: [{ unitId: "AMP-M8-U1", unitNumber: 1,
    title: "Test Unit", purpose: "Purpose", requiredDays: field(null), optionalDays: field(null), items: [
      item("AMP-M8-U1-I01", 1, null, { type: null, title: "Known", summary: null, isOptional: null }),
      item("AMP-M8-U1-F1", null, "Use anytime after Lesson 1.", { type: "Investigate", title: "Flex", summary: "Summary", isOptional: true }),
    ] }] };
}

function spreadsheet(destination = { units: [], lessons: [] }) {
  return createFakeSpreadsheetFromFixture(destination, { units: UNIT_HEADERS, lessons: LESSON_HEADERS });
}
function deps(overrides = {}) {
  const p = overrides.payload || payload();
  return { spreadsheetApp: createFakeSpreadsheetApp(overrides.spreadsheet || spreadsheet()), lockService: createFakeLockService(),
    sheetId: "local-only", computeSha256Hex: sha256, payload: p, metadata: overrides.metadata || metadata(p),
    courses: [{ CourseID: "M8", CourseName: "Math 8" }], formatTimestamp: () => "2026-08-02 000000", ...overrides };
}

test("generated payload preserves schema/profile/hash/counts and exact confirmation phrase", () => {
  const result = importer.amplifyM8ValidatePayloadIntegrity_(data.AMPLIFY_M8_IMPORT_PAYLOAD, data.AMPLIFY_M8_IMPORT_METADATA, sha256);
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.deepEqual([data.AMPLIFY_M8_IMPORT_METADATA.unitCount, data.AMPLIFY_M8_IMPORT_METADATA.itemCount,
    data.AMPLIFY_M8_IMPORT_METADATA.fixedItemCount, data.AMPLIFY_M8_IMPORT_METADATA.flexibleItemCount], [8, 163, 161, 2]);
  assert.match(data.AMPLIFY_M8_IMPORT_METADATA.confirmationPhrase, /^IMPORT_AMPLIFY_M8_[a-f0-9]{12}_8_163$/);
});

test("Apps Script classifier matches schema-2 Node classifications and write proposals", () => {
  const artifact = buildArtifact();
  for (const destination of [{ units: [], lessons: [] }, { units: [], lessons: [{ LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8", LessonTitle: "stale", TeacherNotes: "owned" }] }]) {
    const actual = importer.amplifyM8BuildImportPlan_(artifact, destination);
    const expected = buildAmplifyM8ImportPlan(artifact, destination);
    assert.deepEqual(actual.summary, expected.summary);
    assert.equal(actual.blocked, expected.blocked);
    assert.deepEqual(actual.units.map((unit) => [unit.unitId, unit.classification, unit.items.map((item) => [item.itemId, item.classification])]),
      expected.units.map((unit) => [unit.unitId, unit.classification, unit.items.map((item) => [item.itemId, item.classification])]));
  }
});

test("null/unresolved updates are omitted and never clear destination values", () => {
  const p = payload();
  const row = { LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8", LessonTitle: "Known", Type: "Teacher value", SortOrder: 1,
    PlacementRule: "", IsOptional: false, Description: "Keep me" };
  const plan = importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [row] });
  const item = plan.units[0].items[0];
  assert.equal(item.classification, "no-op");
});

test("publisher difference on any teacher-owned row is blocked", () => {
  const p = payload();
  const row = { LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8", LessonTitle: "stale", SortOrder: 1, PlannedDays: 2 };
  const item = importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [row] }).units[0].items[0];
  assert.equal(item.classification, "blocked");
  assert.deepEqual(item.populatedTeacherFields, ["PlannedDays"]);
});

test("exact IDs only; legacy M8 rows are untouched", () => {
  const p = payload();
  const destination = { units: [{ UnitID: "M8-U1", CourseID: "M8", UnitTitle: "Legacy" }], lessons: [{ LessonID: "M8-U1-L1", UnitID: "M8-U1", CourseID: "M8" }] };
  const before = structuredClone(destination);
  const plan = importer.amplifyM8BuildImportPlan_(p, destination);
  assert.equal(plan.units[0].classification, "create");
  importer.amplifyM8ApplyPlan_(spreadsheet(destination), plan);
  assert.deepEqual(destination, before);
});

test("duplicate IDs, incompatible collisions, and structural clears block", () => {
  const p = payload();
  const duplicate = { LessonID: "AMP-M8-U1-I01", UnitID: "AMP-M8-U1", CourseID: "M8" };
  assert.equal(importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [duplicate, duplicate] }).blocked, true);
  assert.equal(importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [{ ...duplicate, CourseID: "OTHER" }] }).blocked, true);
  assert.equal(importer.amplifyM8BuildImportPlan_(p, { units: [], lessons: [{ ...duplicate, PlacementRule: "would clear" }] }).blocked, true);
});

test("requires exactly one existing compatible M8 course", () => {
  assert.equal(importer.amplifyM8ValidateCourse_([]).valid, false);
  assert.equal(importer.amplifyM8ValidateCourse_([{ CourseID: "M8" }]).valid, true);
  assert.equal(importer.amplifyM8ValidateCourse_([{ CourseID: "M8" }, { CourseID: "M8" }]).valid, false);
});

test("confirmation, lock, and backup guards fail before writes", () => {
  assert.equal(importer.amplifyM8ExecuteLocked_("wrong", deps()).errorStage, "confirmation");
  const lockFail = deps({ lockService: createFakeLockService({ acquireSucceeds: false }) });
  assert.equal(importer.amplifyM8ExecuteLocked_(lockFail.metadata.confirmationPhrase, lockFail).errorStage, "lock");
  const s = spreadsheet(); s.copy = () => { throw new Error("backup failed"); };
  const backupFail = deps({ spreadsheet: s });
  assert.equal(importer.amplifyM8ExecuteLocked_(backupFail.metadata.confirmationPhrase, backupFail).errorStage, "backup");
});

test("full simulation performs narrow writes, verifies, and is idempotent", () => {
  const s = spreadsheet();
  const d = deps({ spreadsheet: s });
  const first = importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d);
  assert.equal(first.errorStage, null, first.errorMessage);
  assert.deepEqual(first.writeCounts, { unitsCreated: 1, unitsUpdated: 0, itemsCreated: 2, itemsUpdated: 0 });
  assert.equal(first.verification.valid, true);
  const second = importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d);
  assert.deepEqual(second.writeCounts, { unitsCreated: 0, unitsUpdated: 0, itemsCreated: 0, itemsUpdated: 0 });
});

test("revalidation change and simulated write failure are reported", () => {
  const s = spreadsheet();
  const lessons = s.getSheetByName("Lessons");
  const original = lessons.getRange.bind(lessons); let reads = 0;
  lessons.getRange = function (...args) { const range = original(...args); const get = range.getValues.bind(range); range.getValues = () => {
    const values = get(); reads += 1; if (reads === 2 && values[0] && values[0][0] === "LessonID") return [...values, LESSON_HEADERS.map((h) => h === "LessonID" ? "AMP-M8-U1-I01" : h === "UnitID" ? "AMP-M8-U1" : h === "CourseID" ? "M8" : "")]; return values; }; return range; };
  const d = deps({ spreadsheet: s });
  assert.equal(importer.amplifyM8ExecuteLocked_(d.metadata.confirmationPhrase, d).errorStage, "revalidation");
  const broken = spreadsheet(); broken.getSheetByName("Units").getRange = () => { throw new Error("simulated failure"); };
  const bd = deps({ spreadsheet: broken });
  assert.ok(["schema", "exception"].includes(importer.amplifyM8ExecuteLocked_(bd.metadata.confirmationPhrase, bd).errorStage));
});

test("live spreadsheet entry points are explicitly DISARMED", () => {
  for (const name of ["previewAmplifyM8Import", "executeAmplifyM8Import", "verifyAmplifyM8Import"]) {
    const source = require("node:fs").readFileSync(path.join(HERE, "../../apps-script-planning/AmplifyM8Importer.js"), "utf8");
    assert.match(source, new RegExp(`function ${name}\\([^)]*\\) \\{\\n  throw new Error\\(\"DISARMED:`));
  }
});
