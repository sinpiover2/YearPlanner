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

function legacyM8ArchiveCellEqual_(a, b) {
  const aIsDate = a instanceof Date;
  const bIsDate = b instanceof Date;
  if (aIsDate || bIsDate) return aIsDate && bIsDate && Object.is(a.getTime(), b.getTime());
  return Object.is(a, b);
}

function legacyM8ArchiveCloneCell_(value) {
  return value instanceof Date ? new Date(value.getTime()) : value;
}

function legacyM8ArchiveCloneMatrix_(matrix) {
  if (!Array.isArray(matrix)) return [];
  const clone = new Array(matrix.length);
  for (let r = 0; r < matrix.length; r += 1) {
    if (!Object.prototype.hasOwnProperty.call(matrix, r)) continue;
    const row = matrix[r];
    if (!Array.isArray(row)) {
      clone[r] = legacyM8ArchiveCloneCell_(row);
      continue;
    }
    const rowClone = new Array(row.length);
    for (let c = 0; c < row.length; c += 1) {
      if (!Object.prototype.hasOwnProperty.call(row, c)) continue;
      rowClone[c] = legacyM8ArchiveCloneCell_(row[c]);
    }
    clone[r] = rowClone;
  }
  return clone;
}

function legacyM8ArchiveDuplicateHeaders_(headers) {
  return legacyM8ArchiveDuplicates_(headers.map(function (header) { return { header: header }; }), "header");
}

function legacyM8ArchiveBuildPlan_(data) {
  const units = data.units || [];
  const lessons = data.lessons || [];
  const targetSet = new Set(LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS);
  const duplicateUnitIds = legacyM8ArchiveDuplicates_(units, "UnitID");
  const duplicateLessonIds = legacyM8ArchiveDuplicates_(lessons, "LessonID");
  const duplicateUnitsHeaders = legacyM8ArchiveDuplicateHeaders_(data.unitsHeaders || []);
  const duplicateLessonsHeaders = legacyM8ArchiveDuplicateHeaders_(data.lessonsHeaders || []);
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
  if (duplicateUnitsHeaders.length) blockingFindings.push("Duplicate Units header(s): " + duplicateUnitsHeaders.join(", ") + ".");
  if (duplicateLessonsHeaders.length) blockingFindings.push("Duplicate Lessons header(s): " + duplicateLessonsHeaders.join(", ") + ".");
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
    duplicateLessonIds: duplicateLessonIds, duplicateUnitsHeaders: duplicateUnitsHeaders,
    duplicateLessonsHeaders: duplicateLessonsHeaders, identityMismatches: identityMismatches,
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

function legacyM8ArchiveVerifyRaw_(before, after) {
  const errors = [];
  const targetSet = new Set(LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS);
  const beforeUnits = before.unitsRaw || [];
  const afterUnits = after.unitsRaw || [];
  const beforeLessons = before.lessonsRaw || [];
  const afterLessons = after.lessonsRaw || [];
  const unitsHeaders = beforeUnits[0] || [];
  const afterUnitsHeaders = afterUnits[0] || [];
  const lessonsHeaders = beforeLessons[0] || [];
  const afterLessonsHeaders = afterLessons[0] || [];
  const unitIdIndex = unitsHeaders.indexOf("UnitID");
  const archivedIndex = unitsHeaders.indexOf("IsArchived");
  let archivedTargetCount = 0;

  function hasOwn_(arrayValue, index) {
    return Object.prototype.hasOwnProperty.call(arrayValue, index);
  }

  function compareExactMatrix_(label, oldMatrix, newMatrix) {
    if (oldMatrix.length !== newMatrix.length) errors.push(label + " row count changed.");
    const rows = Math.max(oldMatrix.length, newMatrix.length);
    for (let r = 0; r < rows; r += 1) {
      const oldHasRow = hasOwn_(oldMatrix, r);
      const newHasRow = hasOwn_(newMatrix, r);
      if (oldHasRow !== newHasRow) {
        errors.push(label + " row " + (r + 1) + " presence changed.");
        continue;
      }
      if (!oldHasRow) continue;
      const oldRow = oldMatrix[r];
      const newRow = newMatrix[r];
      if (!Array.isArray(oldRow) || !Array.isArray(newRow)) {
        errors.push(label + " row " + (r + 1) + " is not an array in both snapshots.");
        continue;
      }
      if (oldRow.length !== newRow.length) errors.push(label + " row " + (r + 1) + " column count changed.");
      const columns = Math.max(oldRow.length, newRow.length);
      for (let c = 0; c < columns; c += 1) {
        const oldHasCell = hasOwn_(oldRow, c);
        const newHasCell = hasOwn_(newRow, c);
        if (oldHasCell !== newHasCell) {
          errors.push(label + " R" + (r + 1) + "C" + (c + 1) + " presence changed.");
          continue;
        }
        if (!oldHasCell) continue;
        if (!legacyM8ArchiveCellEqual_(oldRow[c], newRow[c])) errors.push(label + " R" + (r + 1) + "C" + (c + 1) + " changed.");
      }
    }
  }

  if (legacyM8ArchiveDuplicateHeaders_(unitsHeaders).length || legacyM8ArchiveDuplicateHeaders_(afterUnitsHeaders).length) errors.push("Units contains a duplicate header.");
  if (legacyM8ArchiveDuplicateHeaders_(lessonsHeaders).length || legacyM8ArchiveDuplicateHeaders_(afterLessonsHeaders).length) errors.push("Lessons contains a duplicate header.");
  if (unitIdIndex < 0 || archivedIndex < 0 || unitsHeaders.indexOf("UnitID", unitIdIndex + 1) >= 0 || unitsHeaders.indexOf("IsArchived", archivedIndex + 1) >= 0) errors.push("Units target columns are missing or duplicated.");

  if (beforeUnits.length !== afterUnits.length) errors.push("Units row count changed.");
  const unitRows = Math.max(beforeUnits.length, afterUnits.length);
  for (let r = 0; r < unitRows; r += 1) {
    const oldHasRow = hasOwn_(beforeUnits, r);
    const newHasRow = hasOwn_(afterUnits, r);
    if (oldHasRow !== newHasRow) {
      errors.push("Units row " + (r + 1) + " presence changed.");
      continue;
    }
    if (!oldHasRow) continue;
    const oldRow = beforeUnits[r];
    const newRow = afterUnits[r];
    if (!Array.isArray(oldRow) || !Array.isArray(newRow)) {
      errors.push("Units row " + (r + 1) + " is not an array in both snapshots.");
      continue;
    }
    if (oldRow.length !== newRow.length) errors.push("Units row " + (r + 1) + " column count changed.");
    const oldHasUnitIdCell = r > 0 && unitIdIndex >= 0 && hasOwn_(oldRow, unitIdIndex);
    const newHasUnitIdCell = r > 0 && unitIdIndex >= 0 && hasOwn_(newRow, unitIdIndex);
    const unitId = oldHasUnitIdCell ? oldRow[unitIdIndex] : null;
    const unitIdPreserved = oldHasUnitIdCell && newHasUnitIdCell && legacyM8ArchiveCellEqual_(oldRow[unitIdIndex], newRow[unitIdIndex]);
    const isTarget = unitIdPreserved && targetSet.has(unitId);
    const columns = Math.max(oldRow.length, newRow.length);
    for (let c = 0; c < columns; c += 1) {
      const oldHasCell = hasOwn_(oldRow, c);
      const newHasCell = hasOwn_(newRow, c);
      if (oldHasCell !== newHasCell) {
        errors.push("Units R" + (r + 1) + "C" + (c + 1) + " presence changed.");
        continue;
      }
      if (!oldHasCell) continue;
      if (!(isTarget && c === archivedIndex) && !legacyM8ArchiveCellEqual_(oldRow[c], newRow[c])) {
        errors.push("Units R" + (r + 1) + "C" + (c + 1) + " changed.");
      }
    }
    if (isTarget) {
      const oldHasArchivedCell = archivedIndex >= 0 && hasOwn_(oldRow, archivedIndex);
      const newHasArchivedCell = archivedIndex >= 0 && hasOwn_(newRow, archivedIndex);
      if (!oldHasArchivedCell || !newHasArchivedCell) {
        errors.push(unitId + " IsArchived cell presence changed.");
      } else if (newRow[archivedIndex] !== true) {
        errors.push(unitId + " IsArchived is not boolean true.");
      } else {
        archivedTargetCount += 1;
      }
    }
  }
  if (archivedTargetCount !== LEGACY_M8_ARCHIVE_EXPECTED_UNIT_COUNT) errors.push("Exactly 9 target Units were not preserved in place and archived.");
  compareExactMatrix_("Lessons", beforeLessons, afterLessons);
  return { valid: errors.length === 0, errors: errors, archivedTargetCount: archivedTargetCount };
}

function legacyM8ArchiveReadSheet_(spreadsheet, name) {
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) return { present: false, headers: [], objects: [], rawRows: [] };
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow === 0 || lastColumn === 0) {
    return { present: true, sheet: sheet, headers: [], objects: [], rawRows: [], rawValues: [] };
  }
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(String);
  const objects = values.slice(1).map(function (row) {
    const object = {};
    headers.forEach(function (header, index) { object[header] = row[index]; });
    return object;
  });
  return { present: true, sheet: sheet, headers: headers, rawRows: values.slice(1), rawValues: values, objects: objects };
}

function legacyM8ArchiveReadData_(spreadsheet) {
  const units = legacyM8ArchiveReadSheet_(spreadsheet, "Units");
  const lessons = legacyM8ArchiveReadSheet_(spreadsheet, "Lessons");
  return { units: units.objects, lessons: lessons.objects, unitsHeaders: units.headers, lessonsHeaders: lessons.headers, unitsSheetInfo: units, lessonsSheetInfo: lessons };
}

function legacyM8ArchiveValidatePreviewSchema_(data) {
  const required = {
    Units: ["UnitID", "CourseID", "UnitTitle", "IsArchived"],
    Lessons: ["LessonID", "CourseID", "UnitID"],
  };
  const sheetInfo = { Units: data.unitsSheetInfo, Lessons: data.lessonsSheetInfo };
  const sheets = {};
  const errors = [];
  Object.keys(required).forEach(function (name) {
    const info = sheetInfo[name];
    const headers = info.headers || [];
    const missingHeaders = required[name].filter(function (header) { return headers.indexOf(header) === -1; });
    const duplicateHeaders = legacyM8ArchiveDuplicateHeaders_(headers);
    sheets[name] = {
      present: info.present,
      requiredHeaders: required[name].slice(),
      actualHeaders: headers.slice(),
      missingHeaders: missingHeaders,
      duplicateHeaders: duplicateHeaders,
      valid: info.present && missingHeaders.length === 0 && duplicateHeaders.length === 0,
    };
    if (!info.present) errors.push(name + " sheet is missing.");
    if (missingHeaders.length) errors.push(name + " required header(s) missing: " + missingHeaders.join(", ") + ".");
    if (duplicateHeaders.length) errors.push(name + " duplicate header(s): " + duplicateHeaders.join(", ") + ".");
  });
  return { valid: errors.length === 0, sheets: sheets, errors: errors };
}

// Read-only live-preview adapter. Dependencies keep the production Apps Script
// globals out of the testable implementation and make its allowed surface
// explicit: open one configured spreadsheet, read Units/Lessons, and log.
function legacyM8ArchiveBuildLivePreview_(deps, now) {
  const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
  const data = legacyM8ArchiveReadData_(spreadsheet);
  const plan = legacyM8ArchiveBuildPlan_(data);
  const schemaValidation = legacyM8ArchiveValidatePreviewSchema_(data);
  const blockerReasons = plan.blockingFindings.concat(schemaValidation.errors.filter(function (reason) {
    return plan.blockingFindings.indexOf(reason) === -1;
  }));
  const alreadyComplete = blockerReasons.length === 0 && plan.alreadyComplete;
  const report = {
    mode: "preview",
    timestamp: now.toISOString(),
    spreadsheetIdentity: {
      configuredSheetId: deps.sheetId,
      spreadsheetId: spreadsheet.getId(),
      spreadsheetName: spreadsheet.getName(),
      spreadsheetUrl: spreadsheet.getUrl(),
    },
    sheetsPresent: {
      Units: data.unitsSheetInfo.present,
      Lessons: data.lessonsSheetInfo.present,
    },
    schemaValidation: schemaValidation,
    targetUnitIds: plan.targetIds,
    targetUnits: plan.targets,
    currentIsArchivedStates: plan.targets.map(function (target) {
      return { UnitID: target.UnitID, UnitTitle: target.UnitTitle, IsArchived: target.currentIsArchived, missing: target.missing === true };
    }),
    targetCount: plan.targetCount,
    linkedLegacyLessonCount: plan.linkedLessonCount,
    missingOrDuplicateIds: {
      missingTargetUnitIds: plan.missingTargetIds,
      duplicateUnitIds: plan.duplicateUnitIds,
      duplicateLessonIds: plan.duplicateLessonIds,
    },
    courseOwnershipMismatches: plan.identityMismatches,
    lessonOwnershipCountProblems: {
      expectedLinkedLessonCount: LEGACY_M8_ARCHIVE_EXPECTED_LESSON_COUNT,
      actualLinkedLessonCount: plan.linkedLessonCount,
      countMatches: plan.linkedLessonCount === LEGACY_M8_ARCHIVE_EXPECTED_LESSON_COUNT,
      ownershipMismatches: plan.unexpectedLessonOwnership,
    },
    nonTargetArchiveConflicts: plan.nonTargetConflicts,
    blockerReasons: blockerReasons,
    safeToExecute: blockerReasons.length === 0 && !alreadyComplete,
    alreadyComplete: alreadyComplete,
    confirmationRequired: LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE,
    writesOccurred: false,
    note: "This preview performed zero writes. It acquired no lock, created no backup or copy, and modified nothing.",
  };
  deps.logger.log(JSON.stringify(report, null, 2));
  return report;
}

function legacyM8ArchiveRawSnapshot_(data) {
  return {
    unitsRaw: legacyM8ArchiveCloneMatrix_(data.unitsSheetInfo.rawValues),
    lessonsRaw: legacyM8ArchiveCloneMatrix_(data.lessonsSheetInfo.rawValues),
  };
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
    const rawBeforeMutation = legacyM8ArchiveRawSnapshot_(revalidated);
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
    report.verification = legacyM8ArchiveVerifyRaw_(rawBeforeMutation, legacyM8ArchiveRawSnapshot_(after));
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

// All live entry points remain unconditionally disarmed. The preview's
// production-capable read-only adapter is deliberately unreachable until a
// later, separately authorized procedure temporarily removes the throw.
function previewLegacyM8ArchiveMigration() {
  throw new Error("DISARMED: legacy Math 8 archive preview is local-only.");
  /* istanbul ignore next */
  return legacyM8ArchiveBuildLivePreview_({ spreadsheetApp: SpreadsheetApp, sheetId: SHEET_ID, logger: Logger }, new Date());
}
function executeLegacyM8ArchiveMigration() { throw new Error("DISARMED: legacy Math 8 archive execution is local-only."); }
function executeLegacyM8ArchiveMigrationFromEditor() { throw new Error("DISARMED: legacy Math 8 archive editor execution is local-only."); }
function verifyLegacyM8ArchiveMigration() { throw new Error("DISARMED: legacy Math 8 archive verification is local-only."); }

if (typeof module !== "undefined" && module.exports) module.exports = {
  LEGACY_M8_ARCHIVE_TARGET_UNIT_IDS, LEGACY_M8_ARCHIVE_COURSE_ID,
  LEGACY_M8_ARCHIVE_EXPECTED_UNIT_COUNT, LEGACY_M8_ARCHIVE_EXPECTED_LESSON_COUNT,
  LEGACY_M8_ARCHIVE_CONFIRMATION_PHRASE, LEGACY_M8_ARCHIVE_EDITOR_PLACEHOLDER,
  legacyM8ArchiveDuplicates_, legacyM8ArchiveBuildPlan_, legacyM8ArchivePreview_,
  legacyM8ArchivePlanSignature_, legacyM8ArchiveCellEqual_, legacyM8ArchiveCloneMatrix_,
  legacyM8ArchiveVerifyRaw_, legacyM8ArchiveReadSheet_, legacyM8ArchiveReadData_,
  legacyM8ArchiveValidatePreviewSchema_, legacyM8ArchiveBuildLivePreview_,
  legacyM8ArchiveRawSnapshot_, legacyM8ArchiveCreateBackup_, legacyM8ArchiveExecuteLocked_,
  previewLegacyM8ArchiveMigration, executeLegacyM8ArchiveMigration,
  executeLegacyM8ArchiveMigrationFromEditor, verifyLegacyM8ArchiveMigration,
};
