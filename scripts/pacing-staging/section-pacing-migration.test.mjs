import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import {
  createFakeSpreadsheetFromRawSheets,
  createFakeSpreadsheetApp,
  createFakeLockService,
} from "../import-staging/fake-spreadsheet.mjs";
import { buildPacing } from "./generate-m8-required-pacing.mjs";

const require = createRequire(import.meta.url);
const migration = require("../../apps-script-planning/SectionPacingMigration.js");
const { SECTION_PACING_M8_ROWS } = require("../../apps-script-planning/SectionPacingPayload.js");

const sectionHeaders = ["SectionID", "CourseID", "SectionName", "Period", "BlockGroup", "SortOrder", "Active"];
const lessonHeaders = ["LessonID", "UnitID", "CourseID"];
const calendarHeaders = ["Date", "SchoolDay", "InstructionalDay", "DayType", "Event", "Notes"];
const patternHeaders = ["DayOfWeek", "ScheduleType", "Odd", "Even"];

function sourceSheets({ includeTarget = false, targetRows = [] } = {}) {
  const dates = [...new Set(SECTION_PACING_M8_ROWS.map((row) => row[2]))].sort();
  const lessonIds = [...new Set(SECTION_PACING_M8_ROWS.map((row) => row[4]))];
  const sheets = {
    Sections: [sectionHeaders,
      ["M8-P1", "M8", "Math 8 - Period 1", "1", "Odd", 1, true],
      ["M8-P2", "M8", "Math 8 - Period 2", "2", "Even", 2, true],
      ["M8-P3", "M8", "Math 8 - Period 3", "3", "Odd", 3, true]],
    Lessons: [lessonHeaders, ...lessonIds.map((id) => [id, id.split("-I")[0], "M8"])],
    SchoolCalendar: [calendarHeaders, ...dates.map((date, index) => [date, index + 1, true, "", "", ""])],
    SchedulePatterns: [patternHeaders,
      ["Monday", "Block", true, false],
      ["Tuesday", "Block", false, true],
      ["Wednesday", "Short", true, true],
      ["Thursday", "Full", true, true],
      ["Friday", "Full", true, true]],
  };
  if (includeTarget) sheets.SectionPacing = [migration.SECTION_PACING_HEADERS, ...targetRows];
  return sheets;
}

function input(overrides = {}) {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets());
  return {
    target: migration.sectionPacingReadSheet_(spreadsheet, "SectionPacing"),
    payload: SECTION_PACING_M8_ROWS,
    sections: migration.sectionPacingReadSheet_(spreadsheet, "Sections").objects,
    lessons: migration.sectionPacingReadSheet_(spreadsheet, "Lessons").objects,
    calendar: migration.sectionPacingReadSheet_(spreadsheet, "SchoolCalendar").objects,
    patterns: migration.sectionPacingReadSheet_(spreadsheet, "SchedulePatterns").objects,
    ...overrides,
  };
}

test("generated payload is the exact reviewed 417-row, seven-field candidate", () => {
  assert.equal(SECTION_PACING_M8_ROWS.length, 417);
  assert.ok(SECTION_PACING_M8_ROWS.every((row) => row.length === 7));
  assert.equal(new Set(SECTION_PACING_M8_ROWS.map((row) => row[0])).size, 417);
  const expected = buildPacing().sectionPacingRows.map((row) => [
    row.PacingID, row.SectionID, row.PlannedDate, Number(row.Sequence), row.LessonID, false, row.Notes,
  ]);
  assert.deepEqual(SECTION_PACING_M8_ROWS, expected);
  assert.notEqual(migration.SECTION_PACING_EDITOR_PLACEHOLDER, migration.SECTION_PACING_CONFIRMATION_PHRASE);
});

test("preflight accepts a missing target after validating all live relationships", () => {
  const plan = migration.sectionPacingBuildPlan_(input());
  assert.equal(plan.safeToExecute, true);
  assert.equal(plan.targetState, "missing");
  assert.deepEqual(plan.sectionCounts, { "M8-P1": 139, "M8-P2": 139, "M8-P3": 139 });
  assert.deepEqual(plan.blockingFindings, []);
});

test("preflight refuses duplicate slots, inactive sections, course mismatches, and non-meeting dates", () => {
  const badPayload = SECTION_PACING_M8_ROWS.map((row) => row.slice());
  badPayload[1] = badPayload[0].slice();
  const data = input({ payload: badPayload });
  data.sections[0].Active = false;
  data.lessons.find((row) => row.LessonID === badPayload[2][4]).CourseID = "IM1";
  data.calendar.find((row) => migration.sectionPacingDateKey_(row.Date) === badPayload[3][2]).InstructionalDay = false;
  const plan = migration.sectionPacingBuildPlan_(data);
  assert.equal(plan.safeToExecute, false);
  assert.ok(plan.blockingFindings.some((finding) => finding.includes("Duplicate PacingID")));
  assert.ok(plan.blockingFindings.some((finding) => finding.includes("inactive section")));
  assert.ok(plan.blockingFindings.some((finding) => finding.includes("Course mismatch")));
  assert.ok(plan.blockingFindings.some((finding) => finding.includes("Not an instructional date")));
});

test("preflight refuses any nonempty target rather than overwriting or merging", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets({ includeTarget: true, targetRows: [SECTION_PACING_M8_ROWS[0]] }));
  const data = input({ target: migration.sectionPacingReadSheet_(spreadsheet, "SectionPacing") });
  const plan = migration.sectionPacingBuildPlan_(data);
  assert.equal(plan.targetState, "nonempty");
  assert.equal(plan.safeToExecute, false);
});

test("execution refuses an incorrect confirmation before opening the spreadsheet", () => {
  let opened = false;
  const report = migration.sectionPacingExecuteLocked_("wrong", {
    spreadsheetApp: { openById() { opened = true; } },
    lockService: createFakeLockService(),
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
  });
  assert.equal(report.success, false);
  assert.equal(report.errorStage, "confirmation");
  assert.equal(opened, false);
});

test("execution refuses when the script lock cannot be acquired", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets());
  const report = migration.sectionPacingExecuteLocked_(migration.SECTION_PACING_CONFIRMATION_PHRASE, {
    spreadsheetApp: createFakeSpreadsheetApp(spreadsheet),
    lockService: createFakeLockService({ acquireSucceeds: false }),
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
  });
  assert.equal(report.success, false);
  assert.equal(report.errorStage, "lock");
  assert.equal(spreadsheet.getSheetByName("SectionPacing"), null);
});

test("authorized execution creates, writes, and exactly verifies the initial sheet", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets());
  const lockService = createFakeLockService();
  const report = migration.sectionPacingExecuteLocked_(migration.SECTION_PACING_CONFIRMATION_PHRASE, {
    spreadsheetApp: createFakeSpreadsheetApp(spreadsheet),
    lockService,
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
    formatTimestamp: () => "2026-08-15 120000",
  });
  assert.equal(report.success, true);
  assert.equal(report.writesOccurred, true);
  assert.equal(report.verification.valid, true);
  assert.equal(report.verification.rowCount, 417);
  assert.match(report.backup.name, /pre-section-pacing-import 2026-08-15 120000$/);
  assert.ok(report.backup.id);
  assert.ok(report.backup.url);
  assert.equal(lockService.wasReleased(), true);
  assert.deepEqual(spreadsheet.getSheetByName("SectionPacing").values, [migration.SECTION_PACING_HEADERS, ...SECTION_PACING_M8_ROWS]);
});

test("verification accepts Google Sheets native date-cell coercion without weakening content checks", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets());
  const spreadsheetApp = createFakeSpreadsheetApp(spreadsheet);
  spreadsheetApp.flush = function () {
    const sheet = spreadsheet.getSheetByName("SectionPacing");
    for (let rowIndex = 1; rowIndex < sheet.values.length; rowIndex += 1) {
      const [year, month, day] = sheet.values[rowIndex][2].split("-").map(Number);
      sheet.values[rowIndex][2] = new Date(year, month - 1, day);
    }
  };
  const report = migration.sectionPacingExecuteLocked_(migration.SECTION_PACING_CONFIRMATION_PHRASE, {
    spreadsheetApp,
    lockService: createFakeLockService(),
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
    formatTimestamp: () => "2026-08-15 120000",
  });
  assert.equal(report.success, true);
  assert.equal(report.verification.valid, true);
  const altered = SECTION_PACING_M8_ROWS.map((row) => row.slice());
  altered[0][4] = "WRONG-LESSON";
  assert.equal(migration.sectionPacingVerify_(spreadsheet, altered).valid, false);
});

test("a second execution is refused and preserves the first import exactly", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets({ includeTarget: true, targetRows: SECTION_PACING_M8_ROWS }));
  const before = spreadsheet.getSheetByName("SectionPacing").values.map((row) => row.slice());
  const report = migration.sectionPacingExecuteLocked_(migration.SECTION_PACING_CONFIRMATION_PHRASE, {
    spreadsheetApp: createFakeSpreadsheetApp(spreadsheet),
    lockService: createFakeLockService(),
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
    formatTimestamp: () => "2026-08-15 120000",
  });
  assert.equal(report.success, false);
  assert.equal(report.errorStage, "planning");
  assert.deepEqual(spreadsheet.getSheetByName("SectionPacing").values, before);
});

test("failed read-back deletes a newly created sheet and reports rollback", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets());
  const spreadsheetApp = createFakeSpreadsheetApp(spreadsheet);
  spreadsheetApp.flush = function () {
    spreadsheet.getSheetByName("SectionPacing").values[1][4] = "CORRUPTED";
  };
  const report = migration.sectionPacingExecuteLocked_(migration.SECTION_PACING_CONFIRMATION_PHRASE, {
    spreadsheetApp,
    lockService: createFakeLockService(),
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
    formatTimestamp: () => "2026-08-15 120000",
  });
  assert.equal(report.success, false);
  assert.equal(report.errorStage, "write-or-verify");
  assert.equal(report.rolledBack, true);
  assert.equal(spreadsheet.getSheetByName("SectionPacing"), null);
});

test("failed read-back restores a pre-existing empty sheet to completely empty", () => {
  const sheets = sourceSheets();
  sheets.SectionPacing = [];
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sheets);
  const spreadsheetApp = createFakeSpreadsheetApp(spreadsheet);
  spreadsheetApp.flush = function () {
    spreadsheet.getSheetByName("SectionPacing").values[1][4] = "CORRUPTED";
  };
  const report = migration.sectionPacingExecuteLocked_(migration.SECTION_PACING_CONFIRMATION_PHRASE, {
    spreadsheetApp,
    lockService: createFakeLockService(),
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
    formatTimestamp: () => "2026-08-15 120000",
  });
  assert.equal(report.rolledBack, true);
  assert.deepEqual(spreadsheet.getSheetByName("SectionPacing").values, []);
});

test("backup failure refuses before creating or writing SectionPacing", () => {
  const spreadsheet = createFakeSpreadsheetFromRawSheets(sourceSheets());
  spreadsheet.copy = function () { throw new Error("simulated backup failure"); };
  const report = migration.sectionPacingExecuteLocked_(migration.SECTION_PACING_CONFIRMATION_PHRASE, {
    spreadsheetApp: createFakeSpreadsheetApp(spreadsheet),
    lockService: createFakeLockService(),
    sheetId: "fake",
    payload: SECTION_PACING_M8_ROWS,
    formatTimestamp: () => "2026-08-15 120000",
  });
  assert.equal(report.success, false);
  assert.equal(report.errorStage, "backup");
  assert.equal(report.writesOccurred, false);
  assert.equal(report.backup, null);
  assert.equal(spreadsheet.getSheetByName("SectionPacing"), null);
});
