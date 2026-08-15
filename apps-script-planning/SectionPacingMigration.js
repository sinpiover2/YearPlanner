// Guarded initial SectionPacing importer. This file is inert until an editor
// explicitly runs executeSectionPacingImportFromEditor() after replacing its
// placeholder with the exact confirmation phrase. SectionPacingPayload.js is
// generated from the reviewed local pacing preview and performs no write.

const SECTION_PACING_SHEET_NAME = "SectionPacing";
const SECTION_PACING_HEADERS = [
  "PacingID", "SectionID", "PlannedDate", "Sequence", "LessonID", "Locked", "Notes",
];
const SECTION_PACING_EXPECTED_ROW_COUNT = 417;
const SECTION_PACING_CONFIRMATION_PHRASE = "IMPORT-M8-SECTION-PACING-2026-27-CONFIRMED-V1";
const SECTION_PACING_EDITOR_PLACEHOLDER = "REPLACE_WITH_EXACT_AUTHORIZATION_PHRASE_BEFORE_RUNNING";
const SECTION_PACING_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function sectionPacingIsTrue_(value) {
  return value === true || String(value).trim().toLowerCase() === "true";
}

function sectionPacingArraysEqual_(left, right) {
  return left.length === right.length && left.every(function (value, index) {
    return value === right[index];
  });
}

function sectionPacingDateKey_(value) {
  if (value instanceof Date) {
    return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, "0"), String(value.getDate()).padStart(2, "0")].join("-");
  }
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function sectionPacingObjects_(headers, rows) {
  return rows.map(function (row) {
    const object = {};
    headers.forEach(function (header, index) { object[header] = row[index]; });
    return object;
  });
}

function sectionPacingReadSheet_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) return { present: false, headers: [], rawRows: [], objects: [] };
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow === 0 && lastColumn === 0) return { present: true, headers: [], rawRows: [], objects: [] };
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0] || [];
  const rawRows = values.slice(1);
  return { present: true, headers: headers, rawRows: rawRows, objects: sectionPacingObjects_(headers, rawRows) };
}

function sectionPacingRowsEqual_(left, right) {
  return left.length === right.length && left.every(function (row, rowIndex) {
    return sectionPacingArraysEqual_(row, right[rowIndex]);
  });
}

function sectionPacingBuildPlan_(input) {
  const findings = [];
  const target = input.target;
  const payload = input.payload || [];
  const targetState = !target.present ? "missing" : target.headers.length === 0 && target.rawRows.length === 0 ? "empty" : sectionPacingArraysEqual_(target.headers, SECTION_PACING_HEADERS) && target.rawRows.length === 0 ? "header-only" : sectionPacingArraysEqual_(target.headers, SECTION_PACING_HEADERS) ? "nonempty" : "unexpected";

  if (targetState === "nonempty") findings.push("SectionPacing already contains rows; initial import refuses to overwrite or merge.");
  if (targetState === "unexpected") findings.push("SectionPacing headers do not exactly match the approved seven-column schema.");
  if (payload.length !== SECTION_PACING_EXPECTED_ROW_COUNT) findings.push("Payload must contain exactly 417 rows.");

  const sections = new Map(input.sections.map(function (row) { return [String(row.SectionID), row]; }));
  const lessons = new Map(input.lessons.map(function (row) { return [String(row.LessonID), row]; }));
  const calendar = new Map(input.calendar.map(function (row) { return [sectionPacingDateKey_(row.Date), row]; }));
  const patterns = new Map(input.patterns.map(function (row) { return [String(row.DayOfWeek), row]; }));
  const pacingIds = new Set();
  const slots = new Set();
  const counts = new Map();

  payload.forEach(function (row, index) {
    if (!Array.isArray(row) || row.length !== SECTION_PACING_HEADERS.length) {
      findings.push("Payload row " + (index + 1) + " does not have exactly seven fields.");
      return;
    }
    const pacingId = String(row[0]);
    const sectionId = String(row[1]);
    const dateKey = sectionPacingDateKey_(row[2]);
    const sequence = Number(row[3]);
    const lessonId = String(row[4]);
    const expectedId = sectionId + "|" + dateKey + "|" + sequence;
    const slot = sectionId + "|" + dateKey + "|" + sequence;
    const section = sections.get(sectionId);
    const lesson = lessons.get(lessonId);
    const calendarRow = calendar.get(dateKey);

    if (!pacingId || pacingId !== expectedId) findings.push("Row " + (index + 1) + " has an invalid PacingID.");
    if (pacingIds.has(pacingId)) findings.push("Duplicate PacingID: " + pacingId);
    if (slots.has(slot)) findings.push("Duplicate section/date/sequence slot: " + slot);
    pacingIds.add(pacingId); slots.add(slot);
    if (!Number.isInteger(sequence) || sequence < 1) findings.push("Invalid Sequence at row " + (index + 1) + ".");
    if (!section || !sectionPacingIsTrue_(section.Active)) findings.push("Missing or inactive section: " + sectionId);
    if (!lesson) findings.push("Missing lesson: " + lessonId);
    if (section && lesson && String(section.CourseID) !== String(lesson.CourseID)) findings.push("Course mismatch for " + pacingId + ".");
    if (!calendarRow || !sectionPacingIsTrue_(calendarRow.InstructionalDay)) findings.push("Not an instructional date: " + dateKey);
    if (section && calendarRow) {
      const weekday = SECTION_PACING_WEEKDAYS[new Date(dateKey + "T12:00:00Z").getUTCDay()];
      const pattern = patterns.get(weekday);
      if (!pattern || !sectionPacingIsTrue_(pattern[section.BlockGroup])) findings.push("Section does not meet on " + dateKey + ": " + sectionId);
    }
    counts.set(sectionId, (counts.get(sectionId) || 0) + 1);
  });

  ["M8-P1", "M8-P2", "M8-P3"].forEach(function (sectionId) {
    if (counts.get(sectionId) !== 139) findings.push(sectionId + " must have exactly 139 rows.");
  });
  Array.from(counts.keys()).forEach(function (sectionId) {
    if (["M8-P1", "M8-P2", "M8-P3"].indexOf(sectionId) === -1) findings.push("Unexpected section in payload: " + sectionId);
  });

  return {
    targetState: targetState,
    payloadRowCount: payload.length,
    sectionCounts: Object.fromEntries(counts),
    blockingFindings: findings,
    safeToExecute: findings.length === 0 && ["missing", "empty", "header-only"].indexOf(targetState) !== -1,
  };
}

function sectionPacingBuildLivePlan_(spreadsheet, payload) {
  return sectionPacingBuildPlan_({
    target: sectionPacingReadSheet_(spreadsheet, SECTION_PACING_SHEET_NAME),
    payload: payload,
    sections: sectionPacingReadSheet_(spreadsheet, "Sections").objects,
    lessons: sectionPacingReadSheet_(spreadsheet, "Lessons").objects,
    calendar: sectionPacingReadSheet_(spreadsheet, "SchoolCalendar").objects,
    patterns: sectionPacingReadSheet_(spreadsheet, "SchedulePatterns").objects,
  });
}

function sectionPacingPlansMatch_(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sectionPacingCreateBackup_(spreadsheet, formatTimestamp) {
  const timestamp = formatTimestamp();
  const backupName = "Year Planner Database — pre-section-pacing-import " + timestamp;
  const backupSpreadsheet = spreadsheet.copy(backupName);
  if (!backupSpreadsheet || !backupSpreadsheet.getId()) {
    throw new Error("Spreadsheet.copy() did not return a usable backup spreadsheet.");
  }
  return { id: backupSpreadsheet.getId(), url: backupSpreadsheet.getUrl(), name: backupName };
}

function sectionPacingVerify_(spreadsheet, payload) {
  const target = sectionPacingReadSheet_(spreadsheet, SECTION_PACING_SHEET_NAME);
  return {
    valid: target.present && sectionPacingArraysEqual_(target.headers, SECTION_PACING_HEADERS) && sectionPacingRowsEqual_(target.rawRows, payload),
    rowCount: target.rawRows.length,
  };
}

function sectionPacingExecuteLocked_(confirmation, deps) {
  const report = { mode: "execute", confirmationAccepted: false, lockAcquired: false, backup: null, writesOccurred: false, success: false };
  if (confirmation !== SECTION_PACING_CONFIRMATION_PHRASE) {
    report.errorStage = "confirmation"; report.errorMessage = "Confirmation did not match exactly. Nothing was read or written."; return report;
  }
  report.confirmationAccepted = true;
  const lock = deps.lockService.getScriptLock();
  let lockAcquired = false;
  try { lockAcquired = lock.tryLock(30000); } catch (error) { lockAcquired = false; }
  if (!lockAcquired) { report.errorStage = "lock"; report.errorMessage = "Could not acquire script lock. Nothing was written."; return report; }
  report.lockAcquired = true;
  let created = false;
  let wroteRows = false;
  let originalTargetState = "missing";
  try {
    const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
    const firstPlan = sectionPacingBuildLivePlan_(spreadsheet, deps.payload);
    report.plan = firstPlan;
    originalTargetState = firstPlan.targetState;
    if (!firstPlan.safeToExecute) { report.errorStage = "planning"; report.errorMessage = "Preflight refused the import."; return report; }
    try {
      report.backup = sectionPacingCreateBackup_(spreadsheet, deps.formatTimestamp);
    } catch (error) {
      report.errorStage = "backup"; report.errorMessage = "Backup creation failed: " + error.message + ". Nothing was written."; return report;
    }
    const secondPlan = sectionPacingBuildLivePlan_(spreadsheet, deps.payload);
    if (!sectionPacingPlansMatch_(firstPlan, secondPlan)) { report.errorStage = "revalidation"; report.errorMessage = "Workbook changed during preflight."; return report; }
    let sheet = spreadsheet.getSheetByName(SECTION_PACING_SHEET_NAME);
    if (!sheet) { sheet = spreadsheet.insertSheet(SECTION_PACING_SHEET_NAME); created = true; }
    if (sheet.getLastRow() === 0 && sheet.getLastColumn() === 0) sheet.getRange(1, 1, 1, SECTION_PACING_HEADERS.length).setValues([SECTION_PACING_HEADERS]);
    sheet.getRange(2, 1, deps.payload.length, SECTION_PACING_HEADERS.length).setValues(deps.payload);
    wroteRows = true; report.writesOccurred = true;
    if (typeof deps.spreadsheetApp.flush === "function") deps.spreadsheetApp.flush();
    report.verification = sectionPacingVerify_(spreadsheet, deps.payload);
    if (!report.verification.valid) throw new Error("Post-write read-back did not exactly match the approved payload.");
    report.success = true;
    return report;
  } catch (error) {
    report.errorStage = "write-or-verify"; report.errorMessage = error.message;
    try {
      const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
      const sheet = spreadsheet.getSheetByName(SECTION_PACING_SHEET_NAME);
      if (sheet && created) spreadsheet.deleteSheet(sheet);
      else if (sheet && wroteRows && originalTargetState === "empty") sheet.clearContents();
      else if (sheet && wroteRows) sheet.getRange(2, 1, deps.payload.length, SECTION_PACING_HEADERS.length).clearContent();
      report.rolledBack = true;
    } catch (rollbackError) { report.rolledBack = false; report.rollbackError = rollbackError.message; }
    return report;
  } finally {
    try { lock.releaseLock(); } catch (releaseError) { /* Preserve the completed report. */ }
  }
}

function previewSectionPacingImport() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const report = sectionPacingBuildLivePlan_(spreadsheet, SECTION_PACING_M8_ROWS);
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function executeSectionPacingImport(confirmation) {
  return sectionPacingExecuteLocked_(confirmation, {
    spreadsheetApp: SpreadsheetApp,
    lockService: LockService,
    sheetId: SHEET_ID,
    payload: SECTION_PACING_M8_ROWS,
    formatTimestamp: function () {
      return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
    },
  });
}

function executeSectionPacingImportFromEditor() {
  const CONFIRMATION = SECTION_PACING_EDITOR_PLACEHOLDER;
  const report = executeSectionPacingImport(CONFIRMATION);
  Logger.log(JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.success) throw new Error("SectionPacing import refused or failed: " + (report.errorMessage || "unknown error"));
  return report;
}

function verifySectionPacingImport() {
  const report = sectionPacingVerify_(SpreadsheetApp.openById(SHEET_ID), SECTION_PACING_M8_ROWS);
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SECTION_PACING_SHEET_NAME, SECTION_PACING_HEADERS, SECTION_PACING_EXPECTED_ROW_COUNT,
    SECTION_PACING_CONFIRMATION_PHRASE, SECTION_PACING_EDITOR_PLACEHOLDER,
    sectionPacingIsTrue_, sectionPacingDateKey_, sectionPacingReadSheet_, sectionPacingBuildPlan_,
    sectionPacingBuildLivePlan_, sectionPacingPlansMatch_, sectionPacingCreateBackup_, sectionPacingVerify_, sectionPacingExecuteLocked_,
  };
}
