import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import {
  createFakeLockService,
  createFakeSpreadsheetApp,
  createFakeSpreadsheetFromRawSheets,
} from "../import-staging/fake-spreadsheet.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const require = createRequire(import.meta.url);
const migration = require(path.join(repoRoot, "apps-script-planning/Im1GoalMigration.js"));
const migrationSource = fs.readFileSync(path.join(repoRoot, "apps-script-planning/Im1GoalMigration.js"), "utf8");
const payloadSource = fs.readFileSync(path.join(repoRoot, "apps-script-planning/Im1GoalPayload.js"), "utf8");
const payloadContext = { module: { exports: {} } };
vm.runInNewContext(payloadSource + "\nmodule.exports = { IM1_GOAL_PAYLOAD_METADATA, IM1_GOAL_ROWS };", payloadContext);
const realPayload = JSON.parse(JSON.stringify(payloadContext.module.exports.IM1_GOAL_ROWS));
const realMetadata = JSON.parse(JSON.stringify(payloadContext.module.exports.IM1_GOAL_PAYLOAD_METADATA));

const headers = [
  "LessonID", "UnitID", "CourseID", "LessonNumber", "LessonTitle", "PlannedDays", "SortOrder",
  "Type", "PlacementRule", "KeyOutcome", "Description", "PrimaryLink", "TeacherNotes", "IsOptional",
];
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");

function fixture() {
  const rows = [];
  const payload = [];
  for (let index = 1; index <= 164; index += 1) {
    const unitNumber = index <= 99 ? 1 : 2;
    const itemNumber = index <= 99 ? index : index - 99;
    const unitId = `AMP-IM1-U${unitNumber}`;
    const lessonId = `${unitId}-I${String(itemNumber).padStart(2, "0")}`;
    const object = {
      LessonID: lessonId, UnitID: unitId, CourseID: "IM1", LessonNumber: "", LessonTitle: `Lesson ${index}`,
      PlannedDays: "", SortOrder: itemNumber, Type: "Lesson", PlacementRule: "", KeyOutcome: "",
      Description: `Description ${index}`, PrimaryLink: "", TeacherNotes: "", IsOptional: false,
    };
    rows.push(headers.map((header) => object[header]));
    const nonKey = { ...object };
    delete nonKey.KeyOutcome;
    delete nonKey.PlannedDays;
    payload.push({
      CourseID: "IM1", UnitID: unitId, LessonID: lessonId, LessonTitle: object.LessonTitle,
      KeyOutcome: `I can complete goal ${index}.`,
      PlannedDays: 1,
      NonParitySHA256: sha256(migration.im1GoalsStableJson_(nonKey)),
    });
  }
  const payloadSha256 = sha256(migration.im1GoalsStableJson_(payload));
  return {
    rows,
    payload,
    metadata: {
      schemaVersion: 1,
      expectedRowCount: 164,
      payloadSha256,
      confirmationPhrase: `IMPORT-IM1-PARITY-${payloadSha256.slice(0, 16).toUpperCase()}-CONFIRMED`,
    },
  };
}

function depsFor(spreadsheet, payload, metadata, lockService = createFakeLockService()) {
  const spreadsheetApp = createFakeSpreadsheetApp(spreadsheet);
  spreadsheetApp.flush = () => {};
  return { spreadsheetApp, lockService, sheetId: "fake", payload, metadata, hashText: sha256, formatTimestamp: () => "2026-08-15 220000" };
}

test("generated real payload is exact, unique, immutable metadata-bound data", () => {
  assert.equal(realPayload.length, 164);
  assert.equal(new Set(realPayload.map((row) => row.LessonID)).size, 164);
  assert.equal(realMetadata.expectedRowCount, 164);
  assert.equal(realMetadata.payloadSha256, sha256(migration.im1GoalsStableJson_(realPayload)));
  assert.match(realMetadata.confirmationPhrase, /^IMPORT-IM1-PARITY-[A-F0-9]{16}-CONFIRMED$/);
  for (const row of realPayload) {
    assert.equal(row.CourseID, "IM1");
    assert.match(row.KeyOutcome, /^I can /);
    assert.equal(row.PlannedDays, 1);
    assert.match(row.NonParitySHA256, /^[a-f0-9]{64}$/);
  }
});

test("clean preview classifies all 164 exact rows as KeyOutcome updates and performs no writes", () => {
  const data = fixture();
  const spreadsheet = createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...data.rows] });
  const before = JSON.stringify(spreadsheet.sheetsByName.Lessons.values);
  const report = migration.im1GoalsPreviewLive_(depsFor(spreadsheet, data.payload, data.metadata));
  assert.equal(report.safeToExecute, true);
  assert.equal(report.updateCount, 164);
  assert.equal(report.noOpCount, 0);
  assert.equal(report.writesOccurred, false);
  assert.equal(JSON.stringify(spreadsheet.sheetsByName.Lessons.values), before);
});

test("payload SHA-256 and confirmation phrase are enforced by the live plan", () => {
  const changed = fixture();
  const spreadsheet = createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...changed.rows] });
  changed.payload[0].KeyOutcome = "I can tamper with the generated payload.";
  const changedReport = migration.im1GoalsPreviewLive_(depsFor(spreadsheet, changed.payload, changed.metadata));
  assert.equal(changedReport.safeToExecute, false);
  assert.ok(changedReport.blockingFindings.some((finding) => finding.includes("Payload SHA-256")));

  const phrase = fixture();
  phrase.metadata.confirmationPhrase = "IMPORT-IM1-PARITY-0000000000000000-CONFIRMED";
  const phraseReport = migration.im1GoalsPreviewLive_(depsFor(
    createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...phrase.rows] }),
    phrase.payload,
    phrase.metadata,
  ));
  assert.equal(phraseReport.safeToExecute, false);
  assert.ok(phraseReport.blockingFindings.some((finding) => finding.includes("Confirmation phrase")));
});

test("identity, title, non-goal drift, duplicate IDs, and existing different goals all block", () => {
  for (const mutate of [
    (values) => { values[1][headers.indexOf("CourseID")] = "M8"; },
    (values) => { values[1][headers.indexOf("LessonTitle")] = "Changed"; },
    (values) => { values[1][headers.indexOf("Description")] = "Drift"; },
    (values) => { values[2][headers.indexOf("LessonID")] = values[1][headers.indexOf("LessonID")]; },
    (values) => { values[1][headers.indexOf("KeyOutcome")] = "Teacher goal"; },
  ]) {
    const data = fixture();
    const values = [headers, ...data.rows.map((row) => row.slice())];
    mutate(values);
    const spreadsheet = createFakeSpreadsheetFromRawSheets({ Lessons: values });
    const report = migration.im1GoalsPreviewLive_(depsFor(spreadsheet, data.payload, data.metadata));
    assert.equal(report.safeToExecute, false);
    assert.ok(report.blockingFindings.length > 0);
  }
});

test("wrong confirmation and lock failure refuse before any write or backup", () => {
  const data = fixture();
  const spreadsheet = createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...data.rows] });
  let copies = 0;
  const originalCopy = spreadsheet.copy.bind(spreadsheet);
  spreadsheet.copy = (name) => { copies += 1; return originalCopy(name); };
  const before = JSON.stringify(spreadsheet.sheetsByName.Lessons.values);
  const wrong = migration.im1GoalsExecuteLocked_("WRONG", depsFor(spreadsheet, data.payload, data.metadata));
  assert.equal(wrong.errorStage, "confirmation");
  const locked = migration.im1GoalsExecuteLocked_(data.metadata.confirmationPhrase, depsFor(spreadsheet, data.payload, data.metadata, createFakeLockService({ acquireSucceeds: false })));
  assert.equal(locked.errorStage, "lock");
  assert.equal(copies, 0);
  assert.equal(JSON.stringify(spreadsheet.sheetsByName.Lessons.values), before);
});

test("backup failure and post-backup drift refuse before mutation", () => {
  const first = fixture();
  const backupFailure = createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...first.rows] });
  backupFailure.copy = () => { throw new Error("backup unavailable"); };
  const failed = migration.im1GoalsExecuteLocked_(first.metadata.confirmationPhrase, depsFor(backupFailure, first.payload, first.metadata));
  assert.equal(failed.errorStage, "backup");
  assert.equal(failed.writesOccurred, false);

  const second = fixture();
  const drift = createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...second.rows] });
  const copy = drift.copy.bind(drift);
  drift.copy = (name) => {
    const result = copy(name);
    drift.sheetsByName.Lessons.values[1][headers.indexOf("Description")] = "Drift after backup";
    return result;
  };
  const drifted = migration.im1GoalsExecuteLocked_(second.metadata.confirmationPhrase, depsFor(drift, second.payload, second.metadata));
  assert.equal(drifted.errorStage, "revalidation");
  assert.equal(drifted.writesOccurred, false);
  assert.ok(drifted.backup?.id);
});

test("authorized execution writes exactly 164 goals and 164 one-day pacing values, backs up, verifies, and is idempotent", () => {
  const data = fixture();
  const spreadsheet = createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...data.rows] });
  const before = spreadsheet.sheetsByName.Lessons.values.map((row) => row.slice());
  const lock = createFakeLockService();
  const deps = depsFor(spreadsheet, data.payload, data.metadata, lock);
  const report = migration.im1GoalsExecuteLocked_(data.metadata.confirmationPhrase, deps);
  assert.equal(report.success, true);
  assert.equal(report.cellsWritten, 328);
  assert.equal(report.writesOccurred, true);
  assert.equal(report.verification.valid, true);
  assert.equal(report.verification.final.valid, true);
  assert.ok(report.backup?.id);
  assert.equal(lock.wasReleased(), true);
  const after = spreadsheet.sheetsByName.Lessons.values;
  const key = headers.indexOf("KeyOutcome");
  const planned = headers.indexOf("PlannedDays");
  for (let r = 1; r < after.length; r += 1) {
    for (let c = 0; c < headers.length; c += 1) {
      if (c === key) assert.equal(after[r][c], data.payload[r - 1].KeyOutcome);
      else if (c === planned) assert.equal(after[r][c], 1);
      else assert.deepEqual(after[r][c], before[r][c]);
    }
  }
  const second = migration.im1GoalsExecuteLocked_(data.metadata.confirmationPhrase, deps);
  assert.equal(second.success, true);
  assert.equal(second.writesOccurred, false);
  assert.equal(second.verification.alreadyComplete, true);
});

test("a mid-write exception automatically restores and exactly verifies the original Lessons sheet", () => {
  const data = fixture();
  const spreadsheet = createFakeSpreadsheetFromRawSheets({ Lessons: [headers, ...data.rows] });
  const sheet = spreadsheet.sheetsByName.Lessons;
  const before = JSON.stringify(sheet.values);
  const originalGetRange = sheet.getRange.bind(sheet);
  let writes = 0;
  let threw = false;
  sheet.getRange = (...args) => {
    const range = originalGetRange(...args);
    const originalSet = range.setValue.bind(range);
    range.setValue = (value) => {
      writes += 1;
      if (!threw && writes === 10) { threw = true; throw new Error("simulated write failure"); }
      return originalSet(value);
    };
    return range;
  };
  const report = migration.im1GoalsExecuteLocked_(data.metadata.confirmationPhrase, depsFor(spreadsheet, data.payload, data.metadata));
  assert.equal(report.success, false);
  assert.equal(report.writesOccurred, true);
  assert.equal(report.rolledBack, true);
  assert.equal(report.rollbackVerified, true);
  assert.equal(JSON.stringify(sheet.values), before);
});

test("all live-facing wrappers remain unconditionally DISARMED before global access", () => {
  for (const name of ["previewIm1GoalMigration", "executeIm1GoalMigration", "executeIm1GoalMigrationFromEditor", "verifyIm1GoalMigration"]) {
    const match = migrationSource.match(new RegExp(`function ${name}\\([^)]*\\) \\{([\\s\\S]*?)\\n\\}`));
    assert.ok(match, `${name} exists`);
    const body = match[1].trim();
    assert.match(body.split("\n")[0], /^throw new Error\("DISARMED:/);
  }
});
