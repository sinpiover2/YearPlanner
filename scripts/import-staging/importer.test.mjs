// Local simulation/test harness for the guarded Amplify IM1 Apps Script
// importer (apps-script-planning/AmplifyIm1Importer.js). Loads that file
// (and its generated data sibling) via Node's CommonJS `require` — see the
// `module.exports` guard at the bottom of each file, which is inert in the
// real Apps Script runtime (no `module` global there) and active here.
//
// EVERYTHING in this file runs against in-memory fakes
// (fake-spreadsheet.mjs). Nothing here reads or writes a real spreadsheet,
// calls a network API, or requires Apps Script deployment.
//
// Run with: node --test scripts/import-staging/importer.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { buildArtifact } from "./generate-artifact.mjs";
import { buildImportPlan } from "./build-import-plan.mjs";
import {
  createFakeSpreadsheetFromFixture,
  createFakeSpreadsheetApp,
  createFakeLockService,
  createFakeSheet,
} from "./fake-spreadsheet.mjs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const importer = require(path.join(__dirname, "..", "..", "apps-script-planning", "AmplifyIm1Importer.js"));
const importData = require(path.join(__dirname, "..", "..", "apps-script-planning", "AmplifyIm1ImportData.js"));

function sha256Hex(text) {
  return createHash("sha256").update(text).digest("hex");
}

const UNIT_HEADERS = importer.AMPLIFY_IM1_REQUIRED_UNIT_HEADERS;
const LESSON_HEADERS = importer.AMPLIFY_IM1_REQUIRED_LESSON_HEADERS;

function buildMetadataFor(payload, overrides = {}) {
  const serialized = JSON.stringify(payload, null, 2) + "\n";
  const artifactSha256 = sha256Hex(serialized);
  const unitCount = payload.units.length;
  const itemCount = payload.units.reduce((total, u) => total + u.items.length, 0);
  return {
    schemaVersion: importer.AMPLIFY_IM1_IMPORTER_SUPPORTED_SCHEMA_VERSION,
    artifactPath: "test-fixture",
    artifactSha256,
    sourceDocument: "test-fixture",
    sourceDocumentSha256: "test-fixture",
    unitCount,
    itemCount,
    confirmationPhrase: `IMPORT_AMPLIFY_IM1_${artifactSha256.slice(0, 12)}_${unitCount}_${itemCount}`,
    ...overrides,
  };
}

// A small, fast 2-item payload (one fixed, one flexible) for execute-flow
// tests that don't need the full 164-item real artifact.
function minimalPayload() {
  return {
    schemaVersion: "1.0.0",
    course: { courseId: "IM1" },
    units: [
      {
        unitId: "TEST-U1",
        unitNumber: 1,
        title: "Test Unit",
        requiredDays: { status: "not_yet_verified", value: null },
        optionalDays: { status: "not_yet_verified", value: null },
        items: [
          {
            itemId: "TEST-U1-I01",
            order: 1,
            placementRule: null,
            type: "Lesson",
            title: "A Lesson",
            subtitle: null,
            isOptional: false,
            summary: "Summary one.",
          },
          {
            itemId: "TEST-U1-F1",
            order: null,
            placementRule: "anytime after Lesson 1",
            type: "Investigate",
            title: "An Investigation",
            subtitle: null,
            isOptional: true,
            summary: "Summary two.",
          },
        ],
      },
    ],
  };
}

function emptyDestinationSpreadsheet() {
  const spreadsheet = createFakeSpreadsheetFromFixture({ units: [], lessons: [] }, { units: UNIT_HEADERS, lessons: LESSON_HEADERS });
  return spreadsheet;
}

function baseDeps(overrides = {}) {
  return {
    spreadsheetApp: createFakeSpreadsheetApp(overrides.spreadsheet ?? emptyDestinationSpreadsheet()),
    lockService: createFakeLockService(),
    sheetId: "fake-sheet-id",
    computeSha256Hex: sha256Hex,
    payload: minimalPayload(),
    metadata: buildMetadataFor(minimalPayload()),
    formatTimestamp: () => "2026-01-01 000000",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Parity: the ported Apps Script plan builder must match the Node plan
// builder exactly against the SAME fixtures used in test.mjs.
// ---------------------------------------------------------------------------

test("parity: Apps Script plan builder matches Node plan builder on the real 164-item artifact (empty destination)", () => {
  const artifact = buildArtifact();
  const empty = { units: [], lessons: [] };
  const nodePlan = buildImportPlan(artifact, empty);
  const appsScriptPlan = importer.amplifyIm1BuildImportPlan_(artifact, empty);
  assert.equal(JSON.stringify(appsScriptPlan), JSON.stringify(nodePlan));
});

test("parity: Apps Script plan builder matches Node plan builder against the representative fixture", () => {
  const artifact = buildArtifact();
  const destination = JSON.parse(
    require("node:fs").readFileSync(path.join(__dirname, "fixtures", "representative-destination.json"), "utf8"),
  );
  const nodePlan = buildImportPlan(artifact, destination);
  const appsScriptPlan = importer.amplifyIm1BuildImportPlan_(artifact, destination);
  assert.equal(JSON.stringify(appsScriptPlan), JSON.stringify(nodePlan));
});

// ---------------------------------------------------------------------------
// Confirmation contract
// ---------------------------------------------------------------------------

test("confirmation: exact match required; wrong, stale, whitespace, boolean, and generic values all fail", () => {
  const metadata = buildMetadataFor(minimalPayload());
  assert.equal(importer.amplifyIm1ValidateConfirmation_(metadata.confirmationPhrase, metadata.confirmationPhrase), true);
  assert.equal(importer.amplifyIm1ValidateConfirmation_("wrong", metadata.confirmationPhrase), false);
  assert.equal(importer.amplifyIm1ValidateConfirmation_(metadata.confirmationPhrase + " ", metadata.confirmationPhrase), false);
  assert.equal(importer.amplifyIm1ValidateConfirmation_(" " + metadata.confirmationPhrase, metadata.confirmationPhrase), false);
  assert.equal(importer.amplifyIm1ValidateConfirmation_(true, metadata.confirmationPhrase), false);
  assert.equal(importer.amplifyIm1ValidateConfirmation_("CONFIRM", metadata.confirmationPhrase), false);
  assert.equal(importer.amplifyIm1ValidateConfirmation_(undefined, metadata.confirmationPhrase), false);
  // Stale: confirmation valid for a payload with one fewer item.
  const otherPayload = minimalPayload();
  otherPayload.units[0].items.pop();
  const staleMetadata = buildMetadataFor(otherPayload);
  assert.equal(importer.amplifyIm1ValidateConfirmation_(staleMetadata.confirmationPhrase, metadata.confirmationPhrase), false);
});

// ---------------------------------------------------------------------------
// Payload integrity / structure
// ---------------------------------------------------------------------------

test("payload integrity: real generated AmplifyIm1ImportData.js is internally consistent", () => {
  const result = importer.amplifyIm1ValidatePayloadIntegrity_(
    importData.AMPLIFY_IM1_IMPORT_PAYLOAD,
    importData.AMPLIFY_IM1_IMPORT_METADATA,
    sha256Hex,
  );
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
});

test("payload integrity: artifact hash mismatch is detected", () => {
  const payload = minimalPayload();
  const metadata = buildMetadataFor(payload, { artifactSha256: "0".repeat(64) });
  const result = importer.amplifyIm1ValidatePayloadIntegrity_(payload, metadata, sha256Hex);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("does not match")));
});

test("payload integrity: unsupported schema version is refused", () => {
  const payload = minimalPayload();
  const metadata = buildMetadataFor(payload, { schemaVersion: "9.9.9" });
  const result = importer.amplifyIm1ValidatePayloadIntegrity_(payload, metadata, sha256Hex);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Unsupported")));
});

test("payload structure: duplicate itemId in payload is a hard error", () => {
  const payload = minimalPayload();
  payload.units[0].items.push({ ...payload.units[0].items[0] });
  const result = importer.amplifyIm1ValidatePayloadStructure_(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Duplicate itemId")));
});

test("payload structure: flexible item with a fixed SortOrder (both order and placementRule) is a hard error", () => {
  const payload = minimalPayload();
  payload.units[0].items[1].order = 2; // the flexible item now also has an order
  const result = importer.amplifyIm1ValidatePayloadStructure_(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("both an order and a placementRule")));
});

test("payload structure: fixed item lacking SortOrder (neither order nor placementRule) is a hard error", () => {
  const payload = minimalPayload();
  payload.units[0].items[0].order = null; // the fixed item now has neither
  const result = importer.amplifyIm1ValidatePayloadStructure_(payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("neither an order nor a placementRule")));
});

// ---------------------------------------------------------------------------
// Destination schema validation
// ---------------------------------------------------------------------------

test("schema: passes when all required Units/Lessons headers are present", () => {
  const result = importer.amplifyIm1ValidateDestinationSchema_({ units: UNIT_HEADERS, lessons: LESSON_HEADERS });
  assert.equal(result.valid, true);
});

test("schema: Type/PlacementRule missing from current production-shaped Lessons headers is correctly blocked", () => {
  // This is the real, current production Lessons header list per
  // docs/Reference/SHEET_STRUCTURE.md — Type/PlacementRule do not exist yet.
  const currentProductionLessonHeaders = [
    "LessonID", "UnitID", "CourseID", "LessonNumber", "LessonTitle",
    "PlannedDays", "SortOrder", "KeyOutcome", "Description", "PrimaryLink",
    "TeacherNotes", "IsOptional",
  ];
  const result = importer.amplifyIm1ValidateDestinationSchema_({ units: UNIT_HEADERS, lessons: currentProductionLessonHeaders });
  assert.equal(result.valid, false);
  assert.deepEqual(result.missingLessonHeaders, ["Type", "PlacementRule"]);
});

// ---------------------------------------------------------------------------
// Post-write verification
// ---------------------------------------------------------------------------

test("verification: passes against a correctly-written destination", () => {
  const payload = minimalPayload();
  const units = [{ UnitID: "TEST-U1", CourseID: "IM1", UnitNumber: 1, UnitTitle: "Test Unit" }];
  const lessons = [
    { LessonID: "TEST-U1-I01", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "A Lesson", Type: "Lesson", SortOrder: 1, PlacementRule: "", IsOptional: false, Description: "Summary one." },
    { LessonID: "TEST-U1-F1", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "An Investigation", Type: "Investigate", SortOrder: "", PlacementRule: "anytime after Lesson 1", IsOptional: true, Description: "Summary two." },
  ];
  const result = importer.amplifyIm1VerifyAgainstPayload_(payload, units, lessons);
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
  assert.equal(result.checkedUnitCount, 1);
  assert.equal(result.checkedItemCount, 2);
  assert.equal(result.knownStaleCount, 0);
});

test("verification: catches missing rows, duplicate IDs, and writes that did not take effect", () => {
  const payload = minimalPayload();
  const units = [{ UnitID: "TEST-U1", CourseID: "IM1", UnitNumber: 1, UnitTitle: "Test Unit" }];
  const lessons = [
    // Wrong Type, no teacher fields populated -> classifies "source-update"
    // (the intended write did not take effect) rather than "no-op".
    { LessonID: "TEST-U1-I01", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "A Lesson", Type: "Explore", SortOrder: 1, PlacementRule: "", IsOptional: false, Description: "Summary one." },
    // Duplicate LessonID
    { LessonID: "TEST-U1-I01", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "A Lesson", Type: "Lesson", SortOrder: 1, PlacementRule: "", IsOptional: false, Description: "Summary one." },
    // Flexible item given a fixed SortOrder — should never happen post-write
    { LessonID: "TEST-U1-F1", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "An Investigation", Type: "Investigate", SortOrder: 99, PlacementRule: "anytime after Lesson 1", IsOptional: true, Description: "Summary two." },
  ];
  const result = importer.amplifyIm1VerifyAgainstPayload_(payload, units, lessons);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Duplicate destination LessonID")));
});

test("verification: a row blocked to protect teacher-owned fields counts as known-stale, not a hard error", () => {
  const payload = minimalPayload();
  const units = [{ UnitID: "TEST-U1", CourseID: "IM1", UnitNumber: 1, UnitTitle: "Test Unit" }];
  const lessons = [
    // Wrong Type AND a teacher field populated -> "blocked" with
    // preserve-teacher-fields, which must NOT be treated as a verification
    // failure — it's the correct, intentional outcome.
    { LessonID: "TEST-U1-I01", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "A Lesson", Type: "Explore", SortOrder: 1, PlacementRule: "", IsOptional: false, Description: "Summary one.", TeacherNotes: "Taught this differently." },
    { LessonID: "TEST-U1-F1", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "An Investigation", Type: "Investigate", SortOrder: "", PlacementRule: "anytime after Lesson 1", IsOptional: true, Description: "Summary two." },
  ];
  const result = importer.amplifyIm1VerifyAgainstPayload_(payload, units, lessons);
  assert.equal(result.valid, true);
  assert.equal(result.knownStaleCount, 1);
  assert.equal(result.checkedItemCount, 1);
});

test("verification: catches a missing expected Unit/Item ID entirely", () => {
  const payload = minimalPayload();
  const result = importer.amplifyIm1VerifyAgainstPayload_(payload, [], []);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Missing expected UnitID "TEST-U1"')));
  assert.ok(result.errors.some((e) => e.includes('Missing expected LessonID "TEST-U1-I01"')));
});

// ---------------------------------------------------------------------------
// Full guarded execute sequence — simulation only, fake spreadsheet
// ---------------------------------------------------------------------------

test("execute: refuses on wrong confirmation, touches nothing", () => {
  const deps = baseDeps();
  const report = importer.amplifyIm1ExecuteLocked_("not-the-right-confirmation", deps);
  assert.equal(report.errorStage, "confirmation");
  assert.equal(report.writesOccurred, false);
  assert.equal(report.backup, null);
});

test("execute: refuses when schema version is unsupported", () => {
  const payload = minimalPayload();
  const metadata = buildMetadataFor(payload, { schemaVersion: "9.9.9" });
  const deps = baseDeps({ payload, metadata });
  const report = importer.amplifyIm1ExecuteLocked_(metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "payload-validation");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when artifact hash has been tampered with", () => {
  const payload = minimalPayload();
  const metadata = buildMetadataFor(payload, { artifactSha256: "1".repeat(64), confirmationPhrase: "IMPORT_AMPLIFY_IM1_111111111111_1_2" });
  const deps = baseDeps({ payload, metadata });
  const report = importer.amplifyIm1ExecuteLocked_(metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "payload-validation");
});

test("execute: refuses when a required sheet is absent", () => {
  const spreadsheet = createFakeSpreadsheetFromFixture({ units: [], lessons: [] }, { units: UNIT_HEADERS, lessons: LESSON_HEADERS });
  delete spreadsheet.sheetsByName.Lessons;
  const deps = baseDeps({ spreadsheet });
  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when a required header is absent (Type/PlacementRule missing)", () => {
  const legacyLessonHeaders = LESSON_HEADERS.filter((h) => h !== "Type" && h !== "PlacementRule");
  const spreadsheet = createFakeSpreadsheetFromFixture({ units: [], lessons: [] }, { units: UNIT_HEADERS, lessons: legacyLessonHeaders });
  const deps = baseDeps({ spreadsheet });
  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "schema");
  assert.deepEqual(report.destinationSchema.missingLessonHeaders, ["Type", "PlacementRule"]);
});

test("execute: refuses when a duplicate destination ID exists (blocked plan)", () => {
  const lessons = [
    { LessonID: "TEST-U1-I01", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "A Lesson", Type: "Lesson", SortOrder: 1, Description: "Summary one." },
    { LessonID: "TEST-U1-I01", UnitID: "TEST-U1", CourseID: "IM1", LessonTitle: "Duplicate", Type: "Lesson", SortOrder: 1, Description: "Summary one." },
  ];
  const spreadsheet = createFakeSpreadsheetFromFixture({ units: [], lessons }, { units: UNIT_HEADERS, lessons: LESSON_HEADERS });
  const deps = baseDeps({ spreadsheet });
  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "planning");
  assert.equal(report.writesOccurred, false);
  assert.equal(report.plan.blocked, true);
});

test("execute: refuses when a cross-course ID collision exists", () => {
  const lessons = [
    { LessonID: "TEST-U1-I01", UnitID: "TEST-U1", CourseID: "M8", LessonTitle: "A Lesson", Type: "Lesson", SortOrder: 1, Description: "Summary one." },
  ];
  const spreadsheet = createFakeSpreadsheetFromFixture({ units: [], lessons }, { units: UNIT_HEADERS, lessons: LESSON_HEADERS });
  const deps = baseDeps({ spreadsheet });
  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "planning");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when lock acquisition fails", () => {
  const deps = baseDeps({ lockService: createFakeLockService({ acquireSucceeds: false }) });
  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "lock");
  assert.equal(report.lockAcquired, false);
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses and reports manual-recovery guidance when backup fails", () => {
  const spreadsheet = emptyDestinationSpreadsheet();
  spreadsheet.copy = () => {
    throw new Error("Simulated Drive backup failure");
  };
  const deps = baseDeps({ spreadsheet });
  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "backup");
  assert.equal(report.writesOccurred, false);
  assert.equal(report.backup, null);
});

test("execute: refuses when destination state changes between planning and revalidation passes", () => {
  const spreadsheet = emptyDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const realGetRange = lessonsSheet.getRange.bind(lessonsSheet);
  let readCount = 0;
  lessonsSheet.getRange = function (...args) {
    const range = realGetRange(...args);
    const realGetValues = range.getValues.bind(range);
    range.getValues = function () {
      readCount += 1;
      // The revalidation pass is the 2nd full-sheet read of Lessons headers+
      // rows (planning pass = 1st). Inject an extra row only starting on
      // that 2nd read, simulating a concurrent edit that landed between the
      // two passes.
      const values = realGetValues();
      if (readCount === 2 && values.length > 0 && values[0][0] === "LessonID") {
        // Simulates a concurrent edit landing on one of our own expected
        // items between the planning and revalidation reads — this actually
        // changes the computed plan (that item flips from "create" to
        // "no-op"/"source-update"), which is what amplifyIm1PlansEqual_
        // must detect. An unrelated orphan row would NOT change the plan's
        // output and would not exercise this refusal path.
        const surpriseRow = LESSON_HEADERS.map((h) => {
          if (h === "LessonID") return "TEST-U1-I01";
          if (h === "UnitID") return "TEST-U1";
          if (h === "CourseID") return "IM1";
          if (h === "LessonTitle") return "A Lesson";
          if (h === "Type") return "Lesson";
          if (h === "SortOrder") return 1;
          if (h === "Description") return "Summary one.";
          return "";
        });
        return [...values, surpriseRow];
      }
      return values;
    };
    return range;
  };

  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.errorStage, "revalidation");
  assert.equal(report.writesOccurred, false);
});

test("execute: full create run against an empty destination succeeds and verifies", () => {
  const spreadsheet = emptyDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);

  assert.equal(report.errorStage, null, report.errorMessage);
  assert.equal(report.writesOccurred, true);
  assert.equal(report.writeCounts.unitsCreated, 1);
  assert.equal(report.writeCounts.itemsCreated, 2);
  assert.equal(report.verification.valid, true);
  assert.ok(report.backup && report.backup.id);
});

// ---------------------------------------------------------------------------
// Idempotence (Task 15/17)
// ---------------------------------------------------------------------------

test("idempotence: first run creates, second run against the resulting destination is all no-ops", () => {
  const spreadsheet = emptyDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });

  const first = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(first.errorStage, null);
  assert.equal(first.writeCounts.unitsCreated, 1);
  assert.equal(first.writeCounts.itemsCreated, 2);

  const second = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(second.errorStage, null, second.errorMessage);
  assert.equal(second.writeCounts.unitsCreated, 0);
  assert.equal(second.writeCounts.unitsUpdated, 0);
  assert.equal(second.writeCounts.itemsCreated, 0);
  assert.equal(second.writeCounts.itemsUpdated, 0);
  assert.equal(second.verification.valid, true);
});

test("idempotence: a source-owned field change on rerun produces a narrowly scoped source-update, and unrelated Math 8 rows are untouched", () => {
  const mathEightLessonRow = {
    LessonID: "M8-U1-L1", UnitID: "M8-U1", CourseID: "M8", LessonNumber: 1,
    LessonTitle: "Some Math 8 Lesson", PlannedDays: 1, SortOrder: 1,
    Type: "Lesson", Description: "", PrimaryLink: "", TeacherNotes: "", IsOptional: false,
  };
  const spreadsheet = createFakeSpreadsheetFromFixture(
    { units: [], lessons: [mathEightLessonRow] },
    { units: UNIT_HEADERS, lessons: LESSON_HEADERS },
  );
  const deps = baseDeps({ spreadsheet });

  const first = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(first.errorStage, null, first.errorMessage);

  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const headers = lessonsSheet.getRange(1, 1, 1, lessonsSheet.getLastColumn()).getValues()[0];
  const descriptionCol = headers.indexOf("Description");
  const lessonIdCol = headers.indexOf("LessonID");
  const values = lessonsSheet.getDataRange().getValues();
  const rowIndex = values.findIndex((row) => row[lessonIdCol] === "TEST-U1-I01");
  assert.ok(rowIndex > 0);

  // Simulate a publisher content correction landing on the source document
  // (Description changes) without touching any teacher-owned field.
  lessonsSheet.getRange(rowIndex + 1, descriptionCol + 1).setValue("A stale description that will be corrected.");

  const second = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(second.errorStage, null, second.errorMessage);
  assert.equal(second.writeCounts.itemsUpdated, 1);
  assert.equal(second.writeCounts.itemsCreated, 0);

  const finalValues = lessonsSheet.getDataRange().getValues();
  const mathRow = finalValues.find((row) => row[lessonIdCol] === "M8-U1-L1");
  assert.deepEqual(
    mathRow,
    headers.map((h) => (mathEightLessonRow[h] === undefined || mathEightLessonRow[h] === null ? "" : mathEightLessonRow[h])),
  );
});

test("idempotence: populated teacher-owned fields survive a rerun even when a publisher field also changed (blocked, not silently overwritten)", () => {
  const spreadsheet = emptyDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });

  const first = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(first.errorStage, null, first.errorMessage);

  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const headers = lessonsSheet.getRange(1, 1, 1, lessonsSheet.getLastColumn()).getValues()[0];
  const lessonIdCol = headers.indexOf("LessonID");
  const plannedDaysCol = headers.indexOf("PlannedDays");
  const teacherNotesCol = headers.indexOf("TeacherNotes");
  const descriptionCol = headers.indexOf("Description");
  const values = lessonsSheet.getDataRange().getValues();
  const rowIndex = values.findIndex((row) => row[lessonIdCol] === "TEST-U1-I01");

  // Teacher has taught this lesson and left notes/planned days.
  lessonsSheet.getRange(rowIndex + 1, plannedDaysCol + 1).setValue(2);
  lessonsSheet.getRange(rowIndex + 1, teacherNotesCol + 1).setValue("Ran long, split across two days.");
  // A publisher correction also lands on the same row.
  lessonsSheet.getRange(rowIndex + 1, descriptionCol + 1).setValue("Updated publisher summary.");

  const second = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(second.errorStage, null, second.errorMessage);
  assert.equal(second.writeCounts.itemsUpdated, 0, "a teacher-touched row must never be auto-updated");

  const finalValues = lessonsSheet.getDataRange().getValues();
  const finalRow = finalValues.find((row) => row[lessonIdCol] === "TEST-U1-I01");
  assert.equal(finalRow[plannedDaysCol], 2);
  assert.equal(finalRow[teacherNotesCol], "Ran long, split across two days.");
  // The stale Description was NOT silently corrected, because the row is blocked.
  assert.equal(finalRow[descriptionCol], "Updated publisher summary.");
});

test("idempotence: flexible items remain without a fixed SortOrder and LessonNumber is never fabricated, across reruns", () => {
  const spreadsheet = emptyDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);

  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const headers = lessonsSheet.getRange(1, 1, 1, lessonsSheet.getLastColumn()).getValues()[0];
  const lessonIdCol = headers.indexOf("LessonID");
  const sortOrderCol = headers.indexOf("SortOrder");
  const lessonNumberCol = headers.indexOf("LessonNumber");
  const values = lessonsSheet.getDataRange().getValues();

  const flexRow = values.find((row) => row[lessonIdCol] === "TEST-U1-F1");
  assert.equal(flexRow[sortOrderCol], "");
  const fixedRow = values.find((row) => row[lessonIdCol] === "TEST-U1-I01");
  assert.equal(fixedRow[sortOrderCol], 1);
  assert.equal(fixedRow[lessonNumberCol], "");
});

// ---------------------------------------------------------------------------
// Partial-write honesty: writesOccurred must not claim success when the
// write step throws partway through.
// ---------------------------------------------------------------------------

test("execute: a mid-write exception is reported honestly, not silently as full success", () => {
  const spreadsheet = emptyDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const unitsSheet = spreadsheet.getSheetByName("Units");
  const realGetRange = unitsSheet.getRange.bind(unitsSheet);
  let callCount = 0;
  // Let the schema-check/planning-pass read (1st call) and the
  // revalidation-pass read (2nd call) succeed normally — both happen before
  // backup creation. Only the 3rd call, made by amplifyIm1ApplyPlan_ once
  // writing has actually begun (after the backup already exists), fails —
  // proving a mid-write failure is reported honestly rather than masked by
  // failing so early that no write was ever attempted.
  unitsSheet.getRange = function (...args) {
    callCount += 1;
    if (callCount >= 3) {
      throw new Error("Simulated mid-write failure");
    }
    return realGetRange(...args);
  };

  const report = importer.amplifyIm1ExecuteLocked_(deps.metadata.confirmationPhrase, deps);
  assert.equal(report.writesOccurred, false);
  assert.equal(report.errorStage, "exception");
  assert.ok(report.backup && report.backup.id, "backup must exist before any write is attempted");
  assert.ok(
    report.errorMessage.includes("backup"),
    `expected manual-recovery guidance in error message, got: ${report.errorMessage}`,
  );
});

// ---------------------------------------------------------------------------
// Sanity: node --check equivalents already run separately (see the sprint
// validation section), plus a plain require() smoke test that both files
// load without throwing under Node.
// ---------------------------------------------------------------------------

test("sanity: generated data file exposes the expected real artifact shape", () => {
  assert.equal(importData.AMPLIFY_IM1_IMPORT_PAYLOAD.units.length, 7);
  assert.equal(importData.AMPLIFY_IM1_IMPORT_METADATA.unitCount, 7);
  assert.equal(importData.AMPLIFY_IM1_IMPORT_METADATA.itemCount, 164);
});

// ---------------------------------------------------------------------------
// Compact preview summary (previewAmplifyIm1ImportSummary /
// amplifyIm1BuildPreviewSummary_) — added because a real production preview
// run against the full 164-item artifact exceeded the Apps Script execution
// log's size limit before showing plan.blocked/classification counts. These
// tests exercise the pure summary builder directly (no spreadsheet needed
// for most), plus one full-pipeline test against a fake spreadsheet for the
// two cases that need a real, multi-branch plan.
// ---------------------------------------------------------------------------

function fakeCleanFullReport(overrides = {}) {
  return {
    mode: "preview",
    timestamp: "2026-01-01T00:00:00.000Z",
    artifact: { schemaVersion: "1.0.0", sha256: "fixturesha256", unitCount: 1, itemCount: 2 },
    confirmationRequired: "IMPORT_AMPLIFY_IM1_fixturesha_1_2",
    spreadsheetId: "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789",
    sheetsPresent: { units: true, lessons: true },
    payloadIntegrity: { valid: true, errors: [] },
    payloadStructure: { valid: true, errors: [] },
    destinationSchema: { valid: true, errors: [], missingUnitHeaders: [], missingLessonHeaders: [] },
    plan: {
      blocked: false,
      blockers: [],
      units: [
        {
          unitId: "AMP-IM1-U1",
          title: "Test Unit",
          classification: "create",
          reasons: [],
          items: [
            { itemId: "AMP-IM1-U1-I01", title: "A Lesson", classification: "create", reasons: [] },
            { itemId: "AMP-IM1-U1-I02", title: "Another Lesson", classification: "no-op", reasons: [] },
          ],
        },
      ],
      summary: { units: { create: 1, "source-update": 0, "no-op": 0, blocked: 0 }, items: { create: 1, "source-update": 0, "no-op": 1, blocked: 0 } },
    },
    writesOccurred: false,
    note: "This preview performed zero writes. No spreadsheet was modified.",
    ...overrides,
  };
}

test("preview summary: does not mutate the full preview report it is given", () => {
  const fullReport = fakeCleanFullReport();
  const before = JSON.stringify(fullReport);

  importer.amplifyIm1BuildPreviewSummary_(fullReport);

  assert.equal(JSON.stringify(fullReport), before);
});

test("preview summary: a clean preview (valid, unblocked, no conflicts) produces safeToAuthorizeExecute: true", () => {
  const summary = importer.amplifyIm1BuildPreviewSummary_(fakeCleanFullReport());

  assert.equal(summary.safeToAuthorizeExecute, true);
  assert.deepEqual(summary.unitClassificationCounts, { create: 1, update: 0, unchanged: 0, conflict: 0, delete: 0 });
  assert.deepEqual(summary.itemClassificationCounts, {
    create: 1,
    update: 0,
    unchanged: 1,
    conflict: 0,
    delete: 0,
    teacherFieldProtected: 0,
  });
});

test("preview summary: writesOccurred true forces safeToAuthorizeExecute false, even if everything else looks clean", () => {
  const summary = importer.amplifyIm1BuildPreviewSummary_(fakeCleanFullReport({ writesOccurred: true }));
  assert.equal(summary.safeToAuthorizeExecute, false);
});

test("preview summary: invalid destinationSchema (plan not buildable) forces safeToAuthorizeExecute false", () => {
  const summary = importer.amplifyIm1BuildPreviewSummary_(
    fakeCleanFullReport({
      destinationSchema: { valid: false, errors: ['Lessons sheet is missing required column(s): Type, PlacementRule.'], missingUnitHeaders: [], missingLessonHeaders: ["Type", "PlacementRule"] },
      plan: null,
    }),
  );
  assert.equal(summary.safeToAuthorizeExecute, false);
  assert.equal(summary.plan, null);
  assert.deepEqual(summary.destinationSchema.missingLessonHeaders, ["Type", "PlacementRule"]);
});

test("preview summary: a hard-fail conflict (e.g. cross-course-id-collision) forces safeToAuthorizeExecute false, distinct from a benign teacher-field protection", () => {
  const summary = importer.amplifyIm1BuildPreviewSummary_(
    fakeCleanFullReport({
      plan: {
        blocked: true,
        blockers: ['LessonID "AMP-IM1-U1-I02" already exists under CourseID "M8", but the artifact assigns it to course "IM1".'],
        units: [
          {
            unitId: "AMP-IM1-U1",
            title: "Test Unit",
            classification: "no-op",
            reasons: [],
            items: [
              {
                itemId: "AMP-IM1-U1-I01",
                title: "A Lesson",
                classification: "blocked",
                reasons: ["preserve-teacher-fields"],
                populatedTeacherFields: ["PlannedDays", "TeacherNotes"],
              },
              {
                itemId: "AMP-IM1-U1-I02",
                title: "Another Lesson",
                classification: "blocked",
                reasons: ["cross-course-id-collision"],
              },
            ],
          },
        ],
      },
    }),
  );

  assert.equal(summary.safeToAuthorizeExecute, false);
  assert.equal(summary.itemClassificationCounts.conflict, 1);
  assert.equal(summary.itemClassificationCounts.teacherFieldProtected, 1);
  assert.equal(summary.teacherFieldPreservation.itemsProtected, 1);
  assert.deepEqual(summary.teacherFieldPreservation.fieldsAffected, { PlannedDays: 1, TeacherNotes: 1 });
  assert.equal(summary.units[0].messages.some((m) => m.includes("preserve-teacher-fields")), true);
  assert.equal(summary.units[0].messages.some((m) => m.includes("cross-course-id-collision")), true);
});

test("preview summary: excludes full proposed rows and verbose item content, staying compact", () => {
  const artifact = buildArtifact();
  const destination = JSON.parse(
    require("node:fs").readFileSync(path.join(__dirname, "fixtures", "representative-destination.json"), "utf8"),
  );
  const plan = importer.amplifyIm1BuildImportPlan_(artifact, destination);
  const fullReport = fakeCleanFullReport({ plan });

  const summary = importer.amplifyIm1BuildPreviewSummary_(fullReport);
  const serialized = JSON.stringify(summary);

  // No per-unit entry carries a proposedRow, and the summary never repeats
  // an item's Description/summary text anywhere.
  summary.units.forEach((unitSummary) => {
    assert.equal(Object.prototype.hasOwnProperty.call(unitSummary, "proposedRow"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(unitSummary, "items"), false);
  });
  assert.equal(serialized.includes("proposedRow"), false);
  // A real Description string from the fixture must never appear.
  assert.equal(serialized.includes("Let's explore visual patterns."), false);
  // Comfortably smaller than the full plan's own serialization (164 items'
  // worth of proposed rows/descriptions).
  assert.ok(serialized.length < JSON.stringify(plan).length);
});

test("preview summary: aggregates a real, multi-branch plan into classification counts and per-unit item counts that match an independent tally of the same plan", () => {
  const artifact = buildArtifact();
  const destination = JSON.parse(
    require("node:fs").readFileSync(path.join(__dirname, "fixtures", "representative-destination.json"), "utf8"),
  );
  const plan = importer.amplifyIm1BuildImportPlan_(artifact, destination);
  const summary = importer.amplifyIm1BuildPreviewSummary_(fakeCleanFullReport({ plan }));

  function isTeacherFieldProtectedOnly(reasons) {
    const list = reasons || [];
    return (
      list.indexOf("preserve-teacher-fields") !== -1 &&
      list.indexOf("duplicate-destination-id") === -1 &&
      list.indexOf("cross-course-id-collision") === -1
    );
  }

  // Independently tallied directly from the SAME plan object returned by
  // amplifyIm1BuildImportPlan_ — proves aggregation correctness without
  // re-implementing that function's own classification decisions.
  const expectedUnitCounts = { create: 0, update: 0, unchanged: 0, conflict: 0, delete: 0 };
  const expectedItemCounts = { create: 0, update: 0, unchanged: 0, conflict: 0, delete: 0, teacherFieldProtected: 0 };
  const unitBucketOf = (classification) =>
    ({ create: "create", "source-update": "update", "no-op": "unchanged" })[classification] || "conflict";

  plan.units.forEach((unit, unitIndex) => {
    expectedUnitCounts[unitBucketOf(unit.classification)] += 1;

    let expectedItemTotalForUnit = 0;
    (unit.items || []).forEach((item) => {
      let bucket;
      if (item.classification === "create") bucket = "create";
      else if (item.classification === "source-update") bucket = "update";
      else if (item.classification === "no-op") bucket = "unchanged";
      else if (item.classification === "blocked" && isTeacherFieldProtectedOnly(item.reasons)) bucket = "teacherFieldProtected";
      else bucket = "conflict";
      expectedItemCounts[bucket] += 1;
      expectedItemTotalForUnit += 1;
    });

    const summaryUnit = summary.units[unitIndex];
    const summaryItemTotalForUnit =
      Object.values(summaryUnit.itemCounts).reduce((a, b) => a + b, 0) +
      (unit.items || []).filter((item) => item.classification === "blocked" && isTeacherFieldProtectedOnly(item.reasons)).length;
    assert.equal(summaryItemTotalForUnit, expectedItemTotalForUnit, `unit ${unit.unitId} item count mismatch`);
  });

  assert.deepEqual(summary.unitClassificationCounts, expectedUnitCounts);
  assert.deepEqual(summary.itemClassificationCounts, expectedItemCounts);
  // This fixture is documented to include a duplicate-ID and a cross-course
  // hard fail, so plan.blocked must be true and safety must be false.
  assert.equal(plan.blocked, true);
  assert.equal(summary.plan.blocked, true);
  assert.equal(summary.safeToAuthorizeExecute, false);
});

test("preview summary pipeline: the exact sequence previewAmplifyIm1ImportSummary performs (build report, then summary) logs valid, parseable JSON and returns the summary unchanged", () => {
  // previewAmplifyIm1ImportSummary() itself calls amplifyIm1BuildPreviewReport_
  // then amplifyIm1BuildPreviewSummary_ against the real SpreadsheetApp/
  // SHEET_ID globals, which this suite cannot supply directly — the same
  // reason previewAmplifyIm1Import() itself is never unit-tested directly
  // elsewhere in this file. This test exercises the identical two-call
  // sequence against a fake spreadsheet instead.
  const deps = baseDeps();
  const fullReport = importer.amplifyIm1BuildPreviewReport_(deps, new Date());
  const summary = importer.amplifyIm1BuildPreviewSummary_(fullReport);

  const loggedLines = [];
  const fakeLoggerLog = (text) => loggedLines.push(text);
  fakeLoggerLog(JSON.stringify(summary, null, 2));

  assert.equal(loggedLines.length, 1);
  assert.deepEqual(JSON.parse(loggedLines[0]), summary);
  assert.equal(summary.mode, "preview");
  assert.equal(summary.writesOccurred, false);
  assert.equal(summary.backup, null);
});
