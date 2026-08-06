import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS, LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE,
  legacyM8ArchiveBuildPlan_, legacyM8ArchivePreview_, legacyM8ArchiveExecuteLocked_,
  previewLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigration,
  executeLegacyM8ArchiveMigrationFromEditor, verifyLegacyM8ArchiveMigration,
} from "../../apps-script-planning/LegacyM8ArchiveMigration.js";
import { createFakeSpreadsheetFromRawSheets, createFakeSpreadsheetApp, createFakeLockService } from "./fake-spreadsheet.mjs";

const UNIT_HEADERS = ["UnitID", "CourseID", "UnitNumber", "UnitTitle", "RequiredDays", "OptionalDays", "SortOrder", "UnitPurpose", "IsArchived"];
const LESSON_HEADERS = ["LessonID", "CourseID", "UnitID", "LessonTitle", "Type", "SortOrder", "PlannedDays", "TeacherNotes", "PrimaryLink", "KeyOutcome"];
const row = (headers, object) => headers.map((header) => object[header] ?? "");

function fixture({ archived = false } = {}) {
  const units = LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.map((id, index) => ({ UnitID: id, CourseID: "M8", UnitNumber: index, UnitTitle: "Legacy " + index, RequiredDays: index + 10, OptionalDays: 1, SortOrder: index, UnitPurpose: "purpose " + index, IsArchived: archived ? true : "" }));
  units.push({ UnitID: "AMP-M8-U1", CourseID: "M8", UnitNumber: 1, UnitTitle: "Amplify", IsArchived: "" });
  units.push({ UnitID: "IM1-U1", CourseID: "IM1", UnitNumber: 1, UnitTitle: "IM1", IsArchived: "" });
  const lessons = Array.from({ length: 50 }, (_, index) => ({ LessonID: "LEGACY-M8-L" + String(index + 1).padStart(2, "0"), CourseID: "M8", UnitID: LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS[index % 9], LessonTitle: "Lesson " + index, Type: "Lesson", SortOrder: index, PlannedDays: index % 3, TeacherNotes: "note " + index, PrimaryLink: "https://example.invalid/" + index, KeyOutcome: "outcome " + index }));
  lessons.push({ LessonID: "AMP-M8-I01", CourseID: "M8", UnitID: "AMP-M8-U1", LessonTitle: "Amplify lesson", TeacherNotes: "preserve" });
  lessons.push({ LessonID: "IM1-L1", CourseID: "IM1", UnitID: "IM1-U1", LessonTitle: "IM1 lesson" });
  return { units, lessons, unitsHeaders: UNIT_HEADERS };
}

function raw(data) { return { Units: [UNIT_HEADERS, ...data.units.map((x) => row(UNIT_HEADERS, x))], Lessons: [LESSON_HEADERS, ...data.lessons.map((x) => row(LESSON_HEADERS, x))] }; }
function deps(data, options = {}) {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(raw(data));
  const spreadsheetApp = createFakeSpreadsheetApp(spreadsheet);
  let backupCalls = 0;
  const originalCopy = spreadsheet.copy.bind(spreadsheet);
  spreadsheet.copy = (name) => { backupCalls += 1; return originalCopy(name); };
  return { spreadsheet, spreadsheetApp, lockService: createFakeLockService({ acquireSucceeds: options.lockSucceeds !== false }), sheetId: spreadsheet.id, formatTimestamp: () => "2026-08-05 000000", backupCalls: () => backupCalls };
}

test("exact nine-unit and 50-linked-lesson plan is safe and reports required preview fields", () => {
  const plan = legacyM8ArchiveBuildPlan_(fixture());
  assert.equal(plan.safeToExecute, true); assert.equal(plan.targetCount, 9); assert.equal(plan.linkedLessonCount, 50);
  assert.deepEqual(plan.targetIds, LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS); assert.deepEqual(plan.missingTargetIds, []);
  assert.deepEqual(plan.identityMismatches, []); assert.ok(Array.isArray(plan.nonTargetConflicts));
});

test("preview is pure and performs zero writes", () => {
  const data = fixture(); const before = JSON.stringify(data);
  const report = legacyM8ArchivePreview_(data, new Date("2026-08-05T00:00:00Z"));
  assert.equal(report.writesOccurred, false); assert.equal(JSON.stringify(data), before); assert.equal(report.targets.length, 9);
});

test("missing and duplicate target IDs block", () => {
  const missing = fixture(); missing.units = missing.units.filter((u) => u.UnitID !== "M8-U8");
  assert.equal(legacyM8ArchiveBuildPlan_(missing).safeToExecute, false);
  const duplicate = fixture(); duplicate.units.push({ ...duplicate.units[0] });
  assert.deepEqual(legacyM8ArchiveBuildPlan_(duplicate).duplicateUnitIds, ["M8-U0"]);
});

test("wrong target CourseID blocks", () => { const data = fixture(); data.units[2].CourseID = "IM1"; assert.equal(legacyM8ArchiveBuildPlan_(data).safeToExecute, false); });

test("missing, extra, duplicate, and cross-owned linked lessons each block", () => {
  const missing = fixture(); missing.lessons.splice(0, 1); assert.equal(legacyM8ArchiveBuildPlan_(missing).safeToExecute, false);
  const extra = fixture(); extra.lessons.push({ ...extra.lessons[0], LessonID: "EXTRA" }); assert.equal(legacyM8ArchiveBuildPlan_(extra).safeToExecute, false);
  const duplicate = fixture(); duplicate.lessons.push({ ...duplicate.lessons[0] }); assert.ok(legacyM8ArchiveBuildPlan_(duplicate).duplicateLessonIds.length);
  const cross = fixture(); cross.lessons[0].CourseID = "IM1"; assert.ok(legacyM8ArchiveBuildPlan_(cross).unexpectedLessonOwnership.length);
});

test("non-target and AMP-M8 rows never become targets", () => { const plan = legacyM8ArchiveBuildPlan_(fixture()); assert.equal(plan.targets.some((u) => u.UnitID.startsWith("AMP-M8-") || u.CourseID === "IM1"), false); });

test("confirmation and lock failures are zero-write", () => {
  let d = deps(fixture()); let report = legacyM8ArchiveExecuteLocked_("wrong", d); assert.equal(report.errorStage, "confirmation"); assert.equal(report.writesOccurred, false);
  d = deps(fixture(), { lockSucceeds: false }); report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "lock"); assert.equal(report.writesOccurred, false);
});

test("backup failure blocks before mutation", () => { const d = deps(fixture()); d.spreadsheet.copy = () => { throw new Error("backup failed"); }; const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "backup"); assert.equal(report.writesOccurred, false); });

test("revalidation drift blocks after backup and before mutation", () => {
  const d = deps(fixture()); const original = d.spreadsheet.getSheetByName.bind(d.spreadsheet); let reads = 0;
  d.spreadsheet.getSheetByName = (name) => { if (name === "Units" && ++reads === 2) { const clone = original(name).clone(); clone.values[1][3] = "drift"; return clone; } return original(name); };
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "revalidation"); assert.equal(report.writesOccurred, false); assert.ok(report.backup);
});

test("successful execution writes only nine IsArchived cells and preserves every other byte", () => {
  const data = fixture(); const d = deps(data); const unitsBefore = JSON.stringify(d.spreadsheet.getSheetByName("Units").values); const lessonsBefore = JSON.stringify(d.spreadsheet.getSheetByName("Lessons").values);
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d);
  assert.equal(report.success, true); assert.equal(report.cellsWritten, 9); assert.equal(report.verification.valid, true); assert.equal(d.backupCalls(), 1);
  assert.equal(JSON.stringify(d.spreadsheet.getSheetByName("Lessons").values), lessonsBefore);
  const before = JSON.parse(unitsBefore), after = d.spreadsheet.getSheetByName("Units").values, archiveIndex = UNIT_HEADERS.indexOf("IsArchived");
  after.forEach((r, i) => r.forEach((value, j) => { if (i && LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.includes(r[0]) && j === archiveIndex) assert.equal(value, true); else assert.deepEqual(value, before[i][j]); }));
});

test("already archived state and second execution are zero-write zero-backup no-ops", () => {
  let d = deps(fixture({ archived: true })); let report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.success, true); assert.equal(report.writesOccurred, false); assert.equal(d.backupCalls(), 0);
  d = deps(fixture()); assert.equal(legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d).success, true); report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.success, true); assert.equal(report.writesOccurred, false); assert.equal(d.backupCalls(), 1);
});

test("mid-write failure reports backup and manual recovery guidance", () => {
  const d = deps(fixture()); const sheet = d.spreadsheet.getSheetByName("Units"); const original = sheet.getRange.bind(sheet); let writes = 0;
  sheet.getRange = (...args) => { const range = original(...args); const set = range.setValue.bind(range); range.setValue = (value) => { writes += 1; if (writes === 4) throw new Error("simulated mid-write failure"); return set(value); }; return range; };
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "mutation"); assert.equal(report.writesOccurred, true); assert.ok(report.backup.id); assert.match(report.manualRecoveryGuidance, /Restore/);
});

test("post-write verification failure is explicit with recovery guidance", () => {
  const d = deps(fixture()); d.spreadsheetApp.flush = () => { d.spreadsheet.getSheetByName("Lessons").values[1][3] = "tampered"; };
  const report = legacyM8ArchiveExecuteLocked_(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, d); assert.equal(report.errorStage, "post-write-verification"); assert.equal(report.success, false); assert.match(report.manualRecoveryGuidance, /backup/);
});

test("all four live wrappers remain unconditionally DISARMED", () => { for (const wrapper of [previewLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigrationFromEditor, verifyLegacyM8ArchiveMigration]) assert.throws(() => wrapper(LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE), /DISARMED/); });

test("existing IM1 migration source remains unchanged by this dedicated module", () => {
  const source = readFileSync(new URL("../../apps-script-planning/LegacyIm1CleanupMigration.js", import.meta.url), "utf8");
  assert.match(source, /DELETE-LEGACY-IM1-CURRICULUM-CONFIRMED-V1/); assert.doesNotMatch(source, /LEGACY_M8_ARCHIVE/);
});
