// Local simulation/test harness for the guarded Lessons Type/PlacementRule
// schema migration (apps-script-planning/LessonsSchemaMigration.js). Loads
// that file via Node's CommonJS `require` — see the `module.exports` guard
// at the bottom of that file, which is inert in the real Apps Script
// runtime (no `module` global there) and active here.
//
// EVERYTHING in this file runs against in-memory fakes
// (fake-spreadsheet.mjs). Nothing here reads or writes a real spreadsheet,
// calls a network API, or requires Apps Script deployment. No production
// migration has run; this proves the migration's own logic is internally
// consistent and safe against a faithful model of the audited schema.
//
// Run with: node --test scripts/import-staging/lessons-schema-migration.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  createFakeSpreadsheetFromRawSheets,
  createFakeSpreadsheetApp,
  createFakeLockService,
} from "./fake-spreadsheet.mjs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const migration = require(path.join(__dirname, "..", "..", "apps-script-planning", "LessonsSchemaMigration.js"));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function sampleOriginalLessonsRows() {
  return [
    [
      "IM1-U1-L1", "IM1-U1", "IM1", 1, "Number Systems", 2, 1,
      "Understand rational and irrational numbers.", "A description.",
      "https://example.com/l1", "Went well last year.", false,
    ],
    ["IM1-U1-L2", "IM1-U1", "IM1", 2, "Exponents", 1, 2, "", "", "", "", false],
    ["M8-U1-L1", "M8-U1", "M8", 1, "Rigid Motions", 3, 1, "", "", "", "", true],
  ];
}

// A sentinel Units sheet — deliberately a different shape than Lessons, and
// never referenced by this migration at all. Every test that runs a full
// execute pass snapshots this before and confirms it is byte-identical
// after, proving the migration never opens or touches Units.
function sampleUnitsSheetRows() {
  return [
    ["UnitID", "CourseID", "UnitNumber", "UnitTitle", "RequiredDays", "OptionalDays", "SortOrder", "UnitPurpose"],
    ["IM1-U1", "IM1", 1, "Patterns and Sequences", 15, 3, 1, "Intro unit."],
  ];
}

function placeholderRow(headers) {
  return headers.map((h) => {
    if (h === "LessonID") return "IM1-U1-L1";
    if (h === "UnitID") return "IM1-U1";
    if (h === "CourseID") return "IM1";
    return "";
  });
}

function buildMigrationDestinationSpreadsheet({
  lessonsHeaders = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.slice(),
  lessonsRows = sampleOriginalLessonsRows(),
  includeUnits = true,
} = {}) {
  const sheets = { Lessons: [lessonsHeaders, ...lessonsRows] };
  if (includeUnits) sheets.Units = sampleUnitsSheetRows();
  return createFakeSpreadsheetFromRawSheets(sheets);
}

function baseDeps(overrides = {}) {
  return {
    spreadsheetApp: createFakeSpreadsheetApp(overrides.spreadsheet ?? buildMigrationDestinationSpreadsheet()),
    lockService: createFakeLockService(),
    sheetId: "fake-sheet-id",
    formatTimestamp: () => "2026-01-01 000000",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Preview (read-only)
// ---------------------------------------------------------------------------

test("preview: the audited 12-column schema reports migration-required and proposes insertion after SortOrder", () => {
  const deps = baseDeps();
  const report = migration.lessonsMigrationBuildPreviewReport_(deps, new Date());

  assert.equal(report.sheetPresent, true);
  assert.equal(report.classification.state, "migration-required");
  assert.equal(report.hasType, false);
  assert.equal(report.hasPlacementRule, false);
  assert.deepEqual(report.headers, migration.LESSONS_MIGRATION_ORIGINAL_HEADERS);
  assert.equal(report.proposedInsertion.afterHeader, "SortOrder");
  assert.equal(report.proposedInsertion.afterPosition, 7);
  assert.deepEqual(report.proposedInsertion.newHeaderPositions, [8, 9]);
  assert.equal(report.confirmationRequired, migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE);
});

test("preview: performs zero writes — the sheet is byte-identical before and after", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const before = JSON.parse(JSON.stringify(spreadsheet.getSheetByName("Lessons").values));
  const deps = baseDeps({ spreadsheet });

  const report = migration.lessonsMigrationBuildPreviewReport_(deps, new Date());

  assert.equal(report.writesOccurred, false);
  assert.deepEqual(spreadsheet.getSheetByName("Lessons").values, before);
});

// ---------------------------------------------------------------------------
// Confirmation contract
// ---------------------------------------------------------------------------

test("execute: refuses when called with no confirmation argument at all", () => {
  const deps = baseDeps();
  const report = migration.lessonsMigrationExecuteLocked_(undefined, deps);
  assert.equal(report.errorStage, "confirmation");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses on a wrong confirmation string", () => {
  const deps = baseDeps();
  const report = migration.lessonsMigrationExecuteLocked_(
    "MIGRATE_LESSONS_SCHEMA_ADD_TYPE_AND_PLACEMENTRULE_V2",
    deps,
  );
  assert.equal(report.errorStage, "confirmation");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses on a whitespace-padded confirmation (no trimming)", () => {
  const deps = baseDeps();
  const report = migration.lessonsMigrationExecuteLocked_(
    " " + migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE + " ",
    deps,
  );
  assert.equal(report.errorStage, "confirmation");
  assert.equal(report.writesOccurred, false);
});

// ---------------------------------------------------------------------------
// Schema preconditions
// ---------------------------------------------------------------------------

test("execute: refuses when the Lessons sheet is missing", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets({ Units: sampleUnitsSheetRows() });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when a required original header is missing", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.filter((h) => h !== "KeyOutcome");
  const spreadsheet = buildMigrationDestinationSpreadsheet({ lessonsHeaders: headers, lessonsRows: [placeholderRow(headers)] });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when a header is duplicated", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.slice();
  headers[headers.indexOf("Description")] = "PlannedDays";
  const spreadsheet = buildMigrationDestinationSpreadsheet({ lessonsHeaders: headers, lessonsRows: [placeholderRow(headers)] });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.ok(report.classification.reasons.some((r) => r.includes("Duplicate header")));
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when a blank header exists within the active schema", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.slice();
  headers[headers.length - 1] = "";
  const spreadsheet = buildMigrationDestinationSpreadsheet({ lessonsHeaders: headers, lessonsRows: [placeholderRow(headers)] });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.ok(report.classification.reasons.some((r) => r.includes("Blank header")));
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when only Type is present (partially complete) — never guesses the other column", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.slice();
  headers.splice(headers.indexOf("SortOrder") + 1, 0, "Type");
  const spreadsheet = buildMigrationDestinationSpreadsheet({ lessonsHeaders: headers, lessonsRows: [placeholderRow(headers)] });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "partially-complete");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when only PlacementRule is present (partially complete) — never guesses the other column", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.slice();
  headers.splice(headers.indexOf("SortOrder") + 1, 0, "PlacementRule");
  const spreadsheet = buildMigrationDestinationSpreadsheet({ lessonsHeaders: headers, lessonsRows: [placeholderRow(headers)] });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "partially-complete");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when header order differs from the audited order", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.slice();
  const a = headers.indexOf("LessonTitle");
  const b = headers.indexOf("PlannedDays");
  [headers[a], headers[b]] = [headers[b], headers[a]];
  const spreadsheet = buildMigrationDestinationSpreadsheet({ lessonsHeaders: headers, lessonsRows: [placeholderRow(headers)] });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when an unknown, populated trailing column exists beyond the audited 12 (neither Type nor PlacementRule present)", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.concat(["CustomNotes"]);
  const spreadsheet = buildMigrationDestinationSpreadsheet({
    lessonsHeaders: headers,
    lessonsRows: [placeholderRow(headers).concat(["some stray content"])],
  });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when both new headers exist but an extra unexpected column is also present (otherwise-complete schema)", () => {
  const headers = migration.LESSONS_MIGRATION_APPROVED_FINAL_HEADERS.concat(["LegacyColumn"]);
  const spreadsheet = buildMigrationDestinationSpreadsheet({
    lessonsHeaders: headers,
    lessonsRows: [placeholderRow(headers)],
  });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when Type is duplicated (both new headers technically present)", () => {
  const headers = migration.LESSONS_MIGRATION_APPROVED_FINAL_HEADERS.slice();
  headers[headers.indexOf("PlacementRule")] = "Type"; // Type now appears twice; PlacementRule is gone
  const spreadsheet = buildMigrationDestinationSpreadsheet({
    lessonsHeaders: headers,
    lessonsRows: [placeholderRow(headers)],
  });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.ok(report.classification.reasons.some((r) => r.includes("Duplicate header")));
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when both new headers are present but in the wrong position (complete set, wrong order)", () => {
  const headers = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.slice();
  headers.push("Type", "PlacementRule"); // appended at the end instead of after SortOrder
  const spreadsheet = buildMigrationDestinationSpreadsheet({
    lessonsHeaders: headers,
    lessonsRows: [placeholderRow(headers)],
  });
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "schema");
  assert.equal(report.classification.state, "unexpected");
  assert.equal(report.writesOccurred, false);
});

// ---------------------------------------------------------------------------
// Lock / backup guards
// ---------------------------------------------------------------------------

test("execute: refuses when lock acquisition fails, before any backup is attempted", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet, lockService: createFakeLockService({ acquireSucceeds: false }) });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "lock");
  assert.equal(report.lockAcquired, false);
  assert.equal(report.backup, null);
  assert.equal(report.writesOccurred, false);
});

test("execute: refuses when backup creation fails, before any mutation", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  spreadsheet.copy = () => {
    throw new Error("Simulated Drive backup failure");
  };
  const deps = baseDeps({ spreadsheet });
  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(report.errorStage, "backup");
  assert.equal(report.backup, null);
  assert.equal(report.writesOccurred, false);
  assert.equal(spreadsheet.getSheetByName("Lessons").getLastColumn(), migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.length);
});

test("execute: refuses when the schema changes between a successful backup and the revalidation pass", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const realCopy = spreadsheet.copy.bind(spreadsheet);
  spreadsheet.copy = function (name) {
    const backupCopy = realCopy(name);
    // Simulate a concurrent edit landing on the LIVE sheet immediately
    // after the backup snapshot was taken but before the revalidation
    // re-read that follows it — e.g. a teacher's browser-based edit, which
    // shares no lock with this migration at all.
    lessonsSheet.values[0] = lessonsSheet.values[0].slice();
    lessonsSheet.values[0][lessonsSheet.values[0].length - 1] = "IsOptionalRenamed";
    return backupCopy;
  };

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, "revalidation");
  assert.equal(report.writesOccurred, false);
  // The backup itself succeeded (captured before the concurrent edit) and
  // is still reported — it is simply unnecessary since nothing was written.
  assert.ok(report.backup && report.backup.id);
});

// ---------------------------------------------------------------------------
// Valid execution
// ---------------------------------------------------------------------------

test("execute: a valid migration inserts exactly two columns in the approved order, preserves all original data and IDs, leaves new cells blank, verifies clean, and never touches Units", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const unitsSheet = spreadsheet.getSheetByName("Units");
  const unitsSnapshotBefore = JSON.parse(JSON.stringify(unitsSheet.values));
  const deps = baseDeps({ spreadsheet });

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, null, report.errorMessage);
  assert.equal(report.writesOccurred, true);
  assert.equal(report.columnsInserted, true);
  assert.deepEqual(report.writeDetails.insertedHeaders, ["Type", "PlacementRule"]);
  assert.equal(report.writeDetails.insertedAfterPosition, 7);
  assert.deepEqual(report.writeDetails.insertedAtColumns, [8, 9]);
  assert.ok(report.backup && report.backup.id);

  const lessonsSheet = spreadsheet.getSheetByName("Lessons");

  // Exactly two columns added; final order matches the approved schema.
  assert.equal(lessonsSheet.getLastColumn(), migration.LESSONS_MIGRATION_APPROVED_FINAL_HEADERS.length);
  const finalHeaders = lessonsSheet.getRange(1, 1, 1, lessonsSheet.getLastColumn()).getValues()[0];
  assert.deepEqual(finalHeaders, migration.LESSONS_MIGRATION_APPROVED_FINAL_HEADERS);

  // Row count unchanged.
  assert.equal(lessonsSheet.getLastRow() - 1, sampleOriginalLessonsRows().length);

  // Original values, including LessonID/UnitID, remain attached to their
  // original header names — never shifted into the wrong semantic column.
  const finalRows = lessonsSheet.getDataRange().getValues().slice(1);
  const lessonIdCol = finalHeaders.indexOf("LessonID");
  const unitIdCol = finalHeaders.indexOf("UnitID");
  const titleCol = finalHeaders.indexOf("LessonTitle");
  const plannedDaysCol = finalHeaders.indexOf("PlannedDays");
  assert.deepEqual(finalRows.map((r) => r[lessonIdCol]), ["IM1-U1-L1", "IM1-U1-L2", "M8-U1-L1"]);
  assert.deepEqual(finalRows.map((r) => r[unitIdCol]), ["IM1-U1", "IM1-U1", "M8-U1"]);
  assert.deepEqual(finalRows.map((r) => r[titleCol]), ["Number Systems", "Exponents", "Rigid Motions"]);
  assert.deepEqual(finalRows.map((r) => r[plannedDaysCol]), [2, 1, 3]);

  // New cells blank.
  const typeCol = finalHeaders.indexOf("Type");
  const placementCol = finalHeaders.indexOf("PlacementRule");
  finalRows.forEach((r) => {
    assert.equal(r[typeCol], "");
    assert.equal(r[placementCol], "");
  });

  // Verification ran and passed as part of execute.
  assert.equal(report.verification.valid, true);
  assert.equal(report.verification.rowCountUnchanged, true);
  assert.equal(report.verification.columnCountIncreasedByTwo, true);
  assert.equal(report.verification.newColumnsBlank, true);
  assert.equal(report.verification.originalFieldValuesPreserved, true);

  // Units sheet completely untouched — byte-identical.
  assert.deepEqual(unitsSheet.values, unitsSnapshotBefore);

  // The standalone, read-only verify() also passes against the resulting state.
  const verifyReport = migration.lessonsMigrationBuildStandaloneVerifyReport_(deps, new Date());
  assert.equal(verifyReport.valid, true);
  assert.equal(verifyReport.classification.state, "already-complete");
  assert.deepEqual(verifyReport.newColumnsBlank, { type: true, placementRule: true });
});

// ---------------------------------------------------------------------------
// Idempotence
// ---------------------------------------------------------------------------

test("execute: a second run against an already-migrated sheet is a successful no-op and creates no second backup", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });

  const first = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(first.errorStage, null, first.errorMessage);
  assert.ok(first.backup);

  const second = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(second.errorStage, null, second.errorMessage);
  assert.equal(second.alreadyComplete, true);
  assert.equal(second.writesOccurred, false);
  assert.equal(second.columnsInserted, false);
  assert.equal(second.backup, null);
  assert.equal(second.classification.state, "already-complete");

  // Still exactly the expected column count — the no-op truly wrote nothing.
  assert.equal(
    spreadsheet.getSheetByName("Lessons").getLastColumn(),
    migration.LESSONS_MIGRATION_APPROVED_FINAL_HEADERS.length,
  );
});

// ---------------------------------------------------------------------------
// Failure honesty
// ---------------------------------------------------------------------------

test("execute: a post-write verification failure (simulated data corruption) reports unsuccessful, not silently successful", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const realInsert = lessonsSheet.insertColumnsAfter.bind(lessonsSheet);
  lessonsSheet.insertColumnsAfter = function (afterPosition, howMany) {
    realInsert(afterPosition, howMany);
    // Simulate corruption during migration: an original field's value
    // changes on one row. This must never be reported as a clean success.
    lessonsSheet.values[1][0] = "CORRUPTED-LESSON-ID";
  };

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, "post-write-verification");
  assert.equal(report.writesOccurred, true);
  assert.equal(report.verification.valid, false);
  assert.ok(report.verification.errors.some((e) => e.includes("do not match their pre-migration values")));
  assert.ok(report.backup && report.backup.id);
  assert.match(report.errorMessage, /backup created this run/);
});

test("execute: post-write verification detects row reordering, even with row count and headers otherwise unchanged", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const realInsert = lessonsSheet.insertColumnsAfter.bind(lessonsSheet);
  lessonsSheet.insertColumnsAfter = function (afterPosition, howMany) {
    realInsert(afterPosition, howMany);
    // Same row count, same headers, same set of values overall — just two
    // data rows swapped. Content-set equality would miss this; row-for-row
    // order must be checked too.
    const tmp = lessonsSheet.values[1];
    lessonsSheet.values[1] = lessonsSheet.values[2];
    lessonsSheet.values[2] = tmp;
  };

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, "post-write-verification");
  assert.equal(report.verification.valid, false);
  assert.equal(report.verification.originalFieldValuesPreserved, false);
  assert.equal(report.verification.rowCountUnchanged, true); // count alone would have missed this
});

test("execute: post-write verification detects a value shifted to the wrong semantic header within a row", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const originalHeaders = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS;
  const titleCol = originalHeaders.indexOf("LessonTitle");
  const plannedDaysCol = originalHeaders.indexOf("PlannedDays");
  const realInsert = lessonsSheet.insertColumnsAfter.bind(lessonsSheet);
  lessonsSheet.insertColumnsAfter = function (afterPosition, howMany) {
    realInsert(afterPosition, howMany);
    // Simulate a column-alignment bug: LessonTitle and PlannedDays swap
    // values on one row, as if a write mapped the wrong header to the
    // wrong index. Neither the row count nor the column count changes.
    const row = lessonsSheet.values[1];
    const tmp = row[titleCol];
    row[titleCol] = row[plannedDaysCol];
    row[plannedDaysCol] = tmp;
  };

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, "post-write-verification");
  assert.equal(report.verification.valid, false);
  assert.equal(report.verification.originalFieldValuesPreserved, false);
});

test("execute: post-write verification detects a nonblank value appearing under a new column", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const afterPosition = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.indexOf("SortOrder") + 1;
  const realInsert = lessonsSheet.insertColumnsAfter.bind(lessonsSheet);
  lessonsSheet.insertColumnsAfter = function (afterPositionArg, howMany) {
    realInsert(afterPositionArg, howMany);
    // The new Type column (0-indexed afterPosition) ends up non-blank on
    // one row — must never be silently accepted as a clean migration.
    lessonsSheet.values[1][afterPosition] = "Lesson";
  };

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, "post-write-verification");
  assert.equal(report.verification.valid, false);
  assert.equal(report.verification.newColumnsBlank, false);
  assert.ok(report.verification.errors.some((e) => e.includes("New Type column is not blank")));
});

test("execute: a flush() failure after a fully successful insert-and-header-write still reports writesOccurred/columnsInserted truthfully", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const flushingSpreadsheetApp = {
    openById: () => spreadsheet,
    flush: () => {
      throw new Error("Simulated flush failure");
    },
  };
  const deps = baseDeps({ spreadsheet, spreadsheetApp: flushingSpreadsheetApp });

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, "exception");
  // The mutation (insertColumnsAfter + header write) genuinely completed
  // before flush() was even called — the report must say so, not
  // under-claim "no writes happened" just because a later, non-mutating
  // call failed.
  assert.equal(report.columnsInserted, true);
  assert.equal(report.writesOccurred, true);
  assert.ok(report.backup && report.backup.id);
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  assert.equal(lessonsSheet.getLastColumn(), migration.LESSONS_MIGRATION_APPROVED_FINAL_HEADERS.length);
});

test("execute: rerunning after a failed partial write (columns inserted, headers never labeled) is blocked as unexpected, not silently completed", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const afterPosition = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.indexOf("SortOrder") + 1;
  const realGetRange = lessonsSheet.getRange.bind(lessonsSheet);
  lessonsSheet.getRange = function (row, col, numRows, numCols) {
    if (row === 1 && col === afterPosition + 1 && numRows === 1 && numCols === 2) {
      throw new Error("Simulated failure writing header cells after column insertion");
    }
    return realGetRange(row, col, numRows, numCols);
  };

  const first = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);
  assert.equal(first.errorStage, "exception");
  assert.equal(lessonsSheet.getLastColumn(), migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.length + 2);

  // Restore normal getRange behavior and try again, exactly as an operator
  // re-running the function would.
  lessonsSheet.getRange = realGetRange;
  const second = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(second.errorStage, "schema");
  assert.equal(second.classification.state, "unexpected");
  assert.equal(second.writesOccurred, false);
  assert.equal(second.backup, null);
  // Still exactly the partially-migrated column count — the blocked rerun
  // did not touch anything further.
  assert.equal(lessonsSheet.getLastColumn(), migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.length + 2);
});

test("verify: never writes and never creates a backup, even when the schema is already complete", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps); // migrate once

  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const before = JSON.parse(JSON.stringify(lessonsSheet.values));
  let copyCalled = false;
  spreadsheet.copy = () => {
    copyCalled = true;
    throw new Error("copy() should never be called by verify");
  };

  const verifyReport = migration.lessonsMigrationBuildStandaloneVerifyReport_(deps, new Date());

  assert.equal(verifyReport.valid, true);
  assert.equal(copyCalled, false);
  assert.deepEqual(lessonsSheet.values, before);
});

test("execute: a mid-migration failure between column insertion and header write reports writes honestly and preserves backup recovery guidance", () => {
  const spreadsheet = buildMigrationDestinationSpreadsheet();
  const deps = baseDeps({ spreadsheet });
  const lessonsSheet = spreadsheet.getSheetByName("Lessons");
  const afterPosition = migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.indexOf("SortOrder") + 1;
  const realGetRange = lessonsSheet.getRange.bind(lessonsSheet);
  lessonsSheet.getRange = function (row, col, numRows, numCols) {
    if (row === 1 && col === afterPosition + 1 && numRows === 1 && numCols === 2) {
      throw new Error("Simulated failure writing header cells after column insertion");
    }
    return realGetRange(row, col, numRows, numCols);
  };

  const report = migration.lessonsMigrationExecuteLocked_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(report.errorStage, "exception");
  // Deliberately conservative, matching AmplifyIm1Importer.js's precedent:
  // writesOccurred/columnsInserted are only ever set true after the whole
  // write step returns without throwing — never a best-guess partial state.
  assert.equal(report.writesOccurred, false);
  assert.equal(report.columnsInserted, false);
  assert.ok(report.backup && report.backup.id);
  assert.match(report.errorMessage, /backup created this run/);
  // The columns WERE physically inserted by insertColumnsAfter before the
  // header write threw — proving the sheet itself is left in a genuinely
  // partial state, which is exactly why the report points at the backup
  // rather than claiming anything about the sheet's current shape.
  assert.equal(lessonsSheet.getLastColumn(), migration.LESSONS_MIGRATION_ORIGINAL_HEADERS.length + 2);
});

// ---------------------------------------------------------------------------
// Editor wrapper (executeLessonsTypePlacementRuleMigrationFromEditor) —
// exercised through the pure lessonsMigrationRunEditorWrapper_ helper, since
// the real global wrapper calls executeLessonsTypePlacementRuleMigration,
// which references live SpreadsheetApp/LockService/SHEET_ID globals this
// suite cannot supply. See that helper's own comment in
// LessonsSchemaMigration.js for why the split exists.
// ---------------------------------------------------------------------------

test("editor wrapper: default placeholder confirmation never equals the real confirmation phrase", () => {
  assert.notEqual(
    migration.LESSONS_MIGRATION_EDITOR_PLACEHOLDER_CONFIRMATION,
    migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE,
  );
  // Also never satisfies the real validator, not just string-different —
  // the property that actually matters operationally.
  assert.equal(
    migration.lessonsMigrationValidateConfirmation_(migration.LESSONS_MIGRATION_EDITOR_PLACEHOLDER_CONFIRMATION),
    false,
  );
});

test("editor wrapper: passes its confirmation argument through to the injected executor unchanged", () => {
  let receivedConfirmation = null;
  const deps = {
    executeMigration: (confirmation) => {
      receivedConfirmation = confirmation;
      return { mode: "execute", errorStage: null };
    },
    log: () => {},
  };

  migration.lessonsMigrationRunEditorWrapper_("some-confirmation-value", deps);

  assert.equal(receivedConfirmation, "some-confirmation-value");
});

test("editor wrapper: logs the exact structured report it receives, as pretty-printed JSON", () => {
  const fakeReport = { mode: "execute", writesOccurred: true, backup: { id: "abc123", url: "https://example" } };
  let loggedText = null;
  const deps = {
    executeMigration: () => fakeReport,
    log: (text) => {
      loggedText = text;
    },
  };

  migration.lessonsMigrationRunEditorWrapper_(migration.LESSONS_MIGRATION_CONFIRMATION_PHRASE, deps);

  assert.equal(loggedText, JSON.stringify(fakeReport, null, 2));
});

test("editor wrapper: returns the identical report object it received, not a copy", () => {
  const fakeReport = { mode: "execute", errorStage: "confirmation" };
  const deps = {
    executeMigration: () => fakeReport,
    log: () => {},
  };

  const returned = migration.lessonsMigrationRunEditorWrapper_("whatever", deps);

  assert.strictEqual(returned, fakeReport);
});

test("editor wrapper: contains no migration, lock, backup, or schema logic of its own", () => {
  const source = migration.lessonsMigrationRunEditorWrapper_.toString();

  // The only calls this function may make are its two injected deps — proof
  // by inspection that no spreadsheet/lock/backup API is inlined here,
  // rather than only by architectural argument.
  ["SpreadsheetApp", "LockService", "insertColumnsAfter", "getRange", "copy(", "tryLock", "releaseLock"].forEach(
    (forbidden) => {
      assert.ok(!source.includes(forbidden), `unexpected "${forbidden}" reference in editor wrapper adapter`);
    },
  );
});
