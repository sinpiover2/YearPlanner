// Dedicated archival migration for the nine legacy Math 8 units. This file
// is locally testable and intentionally has no armed production entry point.
// Every symbol is prefixed legacyM8Archive to avoid Apps Script global-name
// collisions with the independently maintained IM1 migrations.

const LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS = [
  "M8-U0", "M8-U1", "M8-U2", "M8-U3", "M8-U4",
  "M8-U5", "M8-U6", "M8-U7", "M8-U8",
];
const LEGACY_M8_ARCHIVE_COURSE_ID = "M8";
const LEGACY_M8_ARCHIVE_EXPECTED_UNIT_COUNT = 9;
const LEGACY_M8_ARCHIVE_EXPECTED_LESSON_COUNT = 50;
const LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE = "ARCHIVE-LEGACY-M8-UNITS-CONFIRMED-V1";
const LEGACY_M8_ARCHIVE_EDITOR_PLACEHOLDER = "DISARMED";

function legacyM8ArchiveDuplicates_(rows, field) {
  const counts = {};
  rows.forEach(function (row) {
    const id = row[field];
    counts[id] = (counts[id] || 0) + 1;
  });
  return Object.keys(counts).filter(function (id) { return counts[id] > 1; }).sort();
}

function legacyM8ArchiveRawEqual_(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function legacyM8ArchiveBuildPlan_(data) {
  const units = data.units || [];
  const lessons = data.lessons || [];
  const targetSet = new Set(LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS);
  const duplicateUnitIds = legacyM8ArchiveDuplicates_(units, "UnitID");
  const duplicateLessonIds = legacyM8ArchiveDuplicates_(lessons, "LessonID");
  const missingTargetIds = LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.filter(function (id) {
    return !units.some(function (unit) { return unit.UnitID === id; });
  });
  const targetRows = units.filter(function (unit) { return targetSet.has(unit.UnitID); });
  const identityMismatches = targetRows.filter(function (unit) {
    return unit.CourseID !== LEGACY_M8_ARCHIVE_COURSE_ID;
  }).map(function (unit) {
    return { UnitID: unit.UnitID, expectedCourseID: LEGACY_M8_ARCHIVE_COURSE_ID, actualCourseID: unit.CourseID };
  });
  const linkedLessons = lessons.filter(function (lesson) { return targetSet.has(lesson.UnitID); });
  const unexpectedLessonOwnership = linkedLessons.filter(function (lesson) {
    return lesson.CourseID !== LEGACY_M8_ARCHIVE_COURSE_ID;
  }).map(function (lesson) {
    return { LessonID: lesson.LessonID, UnitID: lesson.UnitID, CourseID: lesson.CourseID };
  });
  const nonTargetConflicts = units.filter(function (unit) {
    return !targetSet.has(unit.UnitID) && unit.IsArchived === true;
  }).map(function (unit) { return { UnitID: unit.UnitID, CourseID: unit.CourseID, IsArchived: unit.IsArchived }; });
  const blockingFindings = [];
  if (data.unitsHeaders && data.unitsHeaders.indexOf("IsArchived") === -1) blockingFindings.push("Units.IsArchived column is missing.");
  if (targetRows.length !== LEGACY_M8_ARCHIVE_EXPECTED_UNIT_COUNT) blockingFindings.push("Expected exactly 9 target unit rows; found " + targetRows.length + ".");
  if (linkedLessons.length !== LEGACY_M8_ARCHIVE_EXPECTED_LESSON_COUNT) blockingFindings.push("Expected exactly 50 linked legacy lessons; found " + linkedLessons.length + ".");
  if (missingTargetIds.length) blockingFindings.push("Missing target UnitID(s): " + missingTargetIds.join(", ") + ".");
  if (duplicateUnitIds.length) blockingFindings.push("Duplicate UnitID(s): " + duplicateUnitIds.join(", ") + ".");
  if (duplicateLessonIds.length) blockingFindings.push("Duplicate LessonID(s): " + duplicateLessonIds.join(", ") + ".");
  if (identityMismatches.length) blockingFindings.push("Target CourseID mismatch(es): " + identityMismatches.map(function (x) { return x.UnitID; }).join(", ") + ".");
  if (unexpectedLessonOwnership.length) blockingFindings.push("Linked legacy lesson CourseID mismatch(es): " + unexpectedLessonOwnership.map(function (x) { return x.LessonID; }).join(", ") + ".");
  const targets = LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.map(function (id) {
    const unit = units.find(function (candidate) { return candidate.UnitID === id; });
    return unit ? { UnitID: id, UnitTitle: unit.UnitTitle, CourseID: unit.CourseID, currentIsArchived: unit.IsArchived } : { UnitID: id, missing: true };
  });
  const alreadyComplete = blockingFindings.length === 0 && targets.every(function (target) { return target.currentIsArchived === true; });
  return {
    targetIds: LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.slice(), targets: targets,
    targetCount: targetRows.length, linkedLessonCount: linkedLessons.length,
    missingTargetIds: missingTargetIds, duplicateUnitIds: duplicateUnitIds,
    duplicateLessonIds: duplicateLessonIds, identityMismatches: identityMismatches,
    unexpectedLessonOwnership: unexpectedLessonOwnership, nonTargetConflicts: nonTargetConflicts,
    blockingFindings: blockingFindings, alreadyComplete: alreadyComplete,
    safeToExecute: blockingFindings.length === 0 && !alreadyComplete,
  };
}

function legacyM8ArchivePreview_(data, now) {
  const plan = legacyM8ArchiveBuildPlan_(data);
  return Object.assign({ mode: "preview", timestamp: now.toISOString(), writesOccurred: false }, plan);
}

function legacyM8ArchivePlanSignature_(data) {
  const targetSet = new Set(LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS);
  return JSON.stringify({
    plan: legacyM8ArchiveBuildPlan_(data),
    targets: (data.units || []).filter(function (u) { return targetSet.has(u.UnitID); }),
    nonTargetUnits: (data.units || []).filter(function (u) { return !targetSet.has(u.UnitID); }),
    lessons: data.lessons || [],
  });
}

function legacyM8ArchiveVerify_(before, after) {
  const errors = [];
  const targetSet = new Set(LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS);
  const afterById = {};
  (after.units || []).forEach(function (unit) { afterById[unit.UnitID] = unit; });
  LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.forEach(function (id) {
    const oldRow = (before.units || []).find(function (u) { return u.UnitID === id; });
    const newRow = afterById[id];
    if (!newRow || newRow.IsArchived !== true) errors.push(id + " is not explicitly archived.");
    if (oldRow && newRow) Object.keys(oldRow).forEach(function (field) {
      if (field !== "IsArchived" && !legacyM8ArchiveRawEqual_(oldRow[field], newRow[field])) errors.push(id + "." + field + " changed.");
    });
  });
  const beforeNonTargets = (before.units || []).filter(function (u) { return !targetSet.has(u.UnitID); });
  const afterNonTargets = (after.units || []).filter(function (u) { return !targetSet.has(u.UnitID); });
  if (!legacyM8ArchiveRawEqual_(beforeNonTargets, afterNonTargets)) errors.push("A non-target Units row changed.");
  if (!legacyM8ArchiveRawEqual_(before.lessons || [], after.lessons || [])) errors.push("A Lessons row changed.");
  return { valid: errors.length === 0, errors: errors, archivedTargetCount: LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.filter(function (id) { return afterById[id] && afterById[id].IsArchived === true; }).length };
}

function legacyM8ArchiveReadSheet_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) return { present: false, headers: [], objects: [], rawRows: [] };
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = values[0].map(String);
  const objects = values.slice(1).map(function (row) {
    const object = {};
    headers.forEach(function (header, index) { object[header] = row[index]; });
    return object;
  });
  return { present: true, sheet: sheet, headers: headers, rawRows: values.slice(1), objects: objects };
}

function legacyM8ArchiveReadData_(spreadsheet) {
  const units = legacyM8ArchiveReadSheet_(spreadsheet, "Units");
  const lessons = legacyM8ArchiveReadSheet_(spreadsheet, "Lessons");
  return { units: units.objects, lessons: lessons.objects, unitsHeaders: units.headers, unitsSheetInfo: units, lessonsSheetInfo: lessons };
}

function legacyM8ArchiveCreateBackup_(spreadsheet, formatTimestamp) {
  const name = "Year Planner Database — pre-legacy-m8-archive " + formatTimestamp();
  const copy = spreadsheet.copy(name);
  if (!copy || !copy.getId()) throw new Error("Spreadsheet.copy() did not return a usable backup.");
  return { id: copy.getId(), url: copy.getUrl(), name: name };
}

function legacyM8ArchiveExecuteLocked_(confirmation, deps) {
  const report = { mode: "execute", success: false, writesOccurred: false, backup: null, targetCount: 0, linkedLessonCount: 0, cellsWritten: 0, errorStage: null, errorMessage: null, manualRecoveryGuidance: null };
  if (confirmation !== LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE) { report.errorStage = "confirmation"; report.errorMessage = "Exact confirmation phrase required."; return report; }
  const lock = deps.lockService.getScriptLock();
  let acquired = false;
  try { acquired = lock.tryLock(30000); } catch (error) { acquired = false; }
  if (!acquired) { report.errorStage = "lock"; report.errorMessage = "Could not acquire script lock."; return report; }
  try {
    const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
    const before = legacyM8ArchiveReadData_(spreadsheet);
    const plan = legacyM8ArchiveBuildPlan_(before);
    report.plan = plan; report.targetCount = plan.targetCount; report.linkedLessonCount = plan.linkedLessonCount;
    if (plan.alreadyComplete) { report.success = true; report.alreadyComplete = true; return report; }
    if (!plan.safeToExecute) { report.errorStage = "planning"; report.errorMessage = "Plan is blocked."; return report; }
    try { report.backup = legacyM8ArchiveCreateBackup_(spreadsheet, deps.formatTimestamp); }
    catch (error) { report.errorStage = "backup"; report.errorMessage = error.message; return report; }
    const revalidated = legacyM8ArchiveReadData_(spreadsheet);
    if (legacyM8ArchivePlanSignature_(before) !== legacyM8ArchivePlanSignature_(revalidated)) { report.errorStage = "revalidation"; report.errorMessage = "Data drifted after backup and before mutation."; return report; }
    const info = revalidated.unitsSheetInfo;
    const idIndex = info.headers.indexOf("UnitID");
    const archivedIndex = info.headers.indexOf("IsArchived");
    LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS.forEach(function (id) {
      const rowIndex = info.rawRows.findIndex(function (row) { return row[idIndex] === id; });
      info.sheet.getRange(rowIndex + 2, archivedIndex + 1).setValue(true);
      report.cellsWritten += 1; report.writesOccurred = true;
    });
    if (typeof deps.spreadsheetApp.flush === "function") deps.spreadsheetApp.flush();
    const after = legacyM8ArchiveReadData_(spreadsheet);
    report.verification = legacyM8ArchiveVerify_(before, after);
    if (!report.verification.valid) { report.errorStage = "post-write-verification"; report.errorMessage = "Post-write verification failed."; report.manualRecoveryGuidance = "Restore the complete spreadsheet from report.backup, then investigate before retrying. No automatic rollback was attempted."; return report; }
    report.success = true;
    return report;
  } catch (error) {
    report.errorStage = report.writesOccurred ? "mutation" : (report.errorStage || "exception");
    report.errorMessage = error.message;
    if (report.writesOccurred) report.manualRecoveryGuidance = "A partial write may have occurred. Restore the complete spreadsheet from report.backup, then investigate before retrying. No automatic rollback was attempted.";
    return report;
  } finally { try { lock.releaseLock(); } catch (ignored) {} }
}

// All live entry points remain unconditionally disarmed. Local tests call
// only the pure/dependency-injected functions above.
function previewLegacyM8ArchiveMigration() { throw new Error("DISARMED: legacy Math 8 archive preview is local-only."); }
function executeLegacyM8ArchiveMigration() { throw new Error("DISARMED: legacy Math 8 archive execution is local-only."); }
function executeLegacyM8ArchiveMigrationFromEditor() { throw new Error("DISARMED: legacy Math 8 archive editor execution is local-only."); }
function verifyLegacyM8ArchiveMigration() { throw new Error("DISARMED: legacy Math 8 archive verification is local-only."); }

if (typeof module !== "undefined" && module.exports) module.exports = {
  LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS, LEGACY_M8_ARCHIVE_COURSE_ID,
  LEGACY_M8_ARCHIVE_EXPECTED_UNIT_COUNT, LEGACY_M8_ARCHIVE_EXPECTED_LESSON_COUNT,
  LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, LEGACY_M8_ARCHIVE_EDITOR_PLACEHOLDER,
  legacyM8ArchiveDuplicates_, legacyM8ArchiveBuildPlan_, legacyM8ArchivePreview_,
  legacyM8ArchivePlanSignature_, legacyM8ArchiveVerify_, legacyM8ArchiveReadSheet_,
  legacyM8ArchiveReadData_, legacyM8ArchiveCreateBackup_, legacyM8ArchiveExecuteLocked_,
  previewLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigration,
  executeLegacyM8ArchiveMigrationFromEditor, verifyLegacyM8ArchiveMigration,
};
