// Guarded Amplify IM1 lesson-goal and one-day pacing migration.
//
// Every live-facing wrapper remains unconditionally DISARMED in committed
// source. Im1GoalPayload.js is generated from the reviewed 164-item snapshot
// and the exact read-only production preview. Loading either file performs no
// read or write.

const IM1_GOAL_SHEET_NAME = "Lessons";
const IM1_GOAL_REQUIRED_HEADERS = ["LessonID", "UnitID", "CourseID", "LessonTitle", "KeyOutcome", "PlannedDays"];
const IM1_GOAL_EDITOR_PLACEHOLDER = "DISARMED";

function im1GoalsStableJson_(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return "[" + value.map(im1GoalsStableJson_).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ":" + im1GoalsStableJson_(value[key]);
    }).join(",") + "}";
  }
  return JSON.stringify(value);
}

function im1GoalsValuesEqual_(left, right) {
  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
  }
  return im1GoalsStableJson_(left) === im1GoalsStableJson_(right);
}

function im1GoalsSha256_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function (byte) { return (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0"); }).join("");
}

function im1GoalsCloneRaw_(rows) {
  return rows.map(function (row) {
    return row.map(function (value) { return value instanceof Date ? new Date(value.getTime()) : value; });
  });
}

function im1GoalsReadLessons_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(IM1_GOAL_SHEET_NAME);
  if (!sheet) return { present: false, sheet: null, headers: [], rows: [], objects: [], headerIndex: {} };
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (!lastRow || !lastColumn) return { present: true, sheet: sheet, headers: [], rows: [], objects: [], headerIndex: {} };
  const raw = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = raw[0] || [];
  const rows = raw.slice(1);
  const headerIndex = {};
  headers.forEach(function (header, index) {
    if (Object.prototype.hasOwnProperty.call(headerIndex, header)) headerIndex[header] = -2;
    else headerIndex[header] = index;
  });
  const objects = rows.map(function (row, index) {
    const object = { __rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) { object[header] = row[columnIndex]; });
    return object;
  });
  return { present: true, sheet: sheet, headers: headers, rows: rows, objects: objects, headerIndex: headerIndex };
}

function im1GoalsNonKeyObject_(headers, row) {
  const object = {};
  headers.forEach(function (header) { if (header !== "KeyOutcome" && header !== "PlannedDays") object[header] = row[header]; });
  return object;
}

function im1GoalsValidatePayload_(payload, metadata, hashText) {
  const blockers = [];
  if (!metadata || metadata.schemaVersion !== 1) blockers.push("Unsupported or missing payload schemaVersion.");
  if (!Array.isArray(payload) || payload.length !== 164 || metadata.expectedRowCount !== 164) blockers.push("Payload must contain exactly 164 rows.");
  if (metadata && Array.isArray(payload) && typeof hashText === "function") {
    const actualPayloadHash = hashText(im1GoalsStableJson_(payload));
    if (metadata.payloadSha256 !== actualPayloadHash) blockers.push("Payload SHA-256 does not match its generated metadata.");
    const expectedConfirmation = "IMPORT-IM1-PARITY-" + actualPayloadHash.slice(0, 16).toUpperCase() + "-CONFIRMED";
    if (metadata.confirmationPhrase !== expectedConfirmation) blockers.push("Confirmation phrase is not bound to the exact payload SHA-256.");
  }
  const seen = new Set();
  (payload || []).forEach(function (row, index) {
    const label = "Payload row " + (index + 1);
    if (!row || typeof row !== "object") { blockers.push(label + " is not an object."); return; }
    if (!row.LessonID || seen.has(row.LessonID)) blockers.push(label + " has a missing or duplicate LessonID: " + row.LessonID);
    seen.add(row.LessonID);
    if (row.CourseID !== "IM1" || !/^AMP-IM1-U[1-7](?:-I\d{2}|-F\d+)$/.test(row.LessonID)) blockers.push(label + " has invalid course or LessonID identity.");
    if (!/^AMP-IM1-U[1-7]$/.test(row.UnitID) || row.LessonID.indexOf(row.UnitID + "-") !== 0) blockers.push(label + " has inconsistent UnitID identity.");
    if (!String(row.LessonTitle || "").trim()) blockers.push(label + " has a blank LessonTitle.");
    if (!String(row.KeyOutcome || "").trim()) blockers.push(label + " has a blank KeyOutcome.");
    if (row.PlannedDays !== 1) blockers.push(label + " must set PlannedDays to exactly 1.");
    if (!/^[a-f0-9]{64}$/.test(String(row.NonParitySHA256 || ""))) blockers.push(label + " has an invalid non-parity hash.");
  });
  return blockers;
}

function im1GoalsBuildPlan_(state, payload, metadata, hashText) {
  const blockers = im1GoalsValidatePayload_(payload, metadata, hashText);
  if (!state.present) blockers.push("Lessons sheet is missing.");
  IM1_GOAL_REQUIRED_HEADERS.forEach(function (header) {
    if (state.headerIndex[header] === undefined) blockers.push("Lessons header is missing: " + header);
    if (state.headerIndex[header] === -2) blockers.push("Lessons header is duplicated: " + header);
  });
  const byId = new Map();
  state.objects.forEach(function (row) {
    const lessonId = String(row.LessonID || "");
    if (!byId.has(lessonId)) byId.set(lessonId, []);
    byId.get(lessonId).push(row);
  });
  const actions = [];
  (payload || []).forEach(function (expected) {
    const matches = byId.get(expected.LessonID) || [];
    if (matches.length !== 1) {
      blockers.push(expected.LessonID + " must match exactly one live row; found " + matches.length + ".");
      return;
    }
    const row = matches[0];
    if (row.CourseID !== expected.CourseID || row.UnitID !== expected.UnitID || row.LessonTitle !== expected.LessonTitle) {
      blockers.push(expected.LessonID + " live course, UnitID, or title does not match the reviewed payload.");
      return;
    }
    const nonKeyHash = hashText(im1GoalsStableJson_(im1GoalsNonKeyObject_(state.headers, row)));
    if (nonKeyHash !== expected.NonParitySHA256) {
      blockers.push(expected.LessonID + " has non-parity drift from the reviewed live preview.");
      return;
    }
    const before = row.KeyOutcome === null || row.KeyOutcome === undefined ? "" : String(row.KeyOutcome);
    const beforePlannedDays = row.PlannedDays === null || row.PlannedDays === undefined ? "" : row.PlannedDays;
    if (before && before !== expected.KeyOutcome) {
      blockers.push(expected.LessonID + " already contains a different KeyOutcome; teacher-owned content is protected.");
      return;
    }
    if (beforePlannedDays !== "" && Number(beforePlannedDays) !== expected.PlannedDays) {
      blockers.push(expected.LessonID + " already contains a different teacher PlannedDays value.");
      return;
    }
    actions.push({
      LessonID: expected.LessonID,
      rowNumber: row.__rowNumber,
      before: before,
      after: expected.KeyOutcome,
      beforePlannedDays: beforePlannedDays,
      afterPlannedDays: expected.PlannedDays,
      classification: before === expected.KeyOutcome && Number(beforePlannedDays) === expected.PlannedDays ? "no-op" : "update",
      nonKeyOutcomeSha256: nonKeyHash,
    });
  });
  const updateCount = actions.filter(function (action) { return action.classification === "update"; }).length;
  const noOpCount = actions.filter(function (action) { return action.classification === "no-op"; }).length;
  return {
    expectedCount: 164,
    matchedCount: actions.length,
    updateCount: updateCount,
    noOpCount: noOpCount,
    blockingFindings: blockers,
    safeToExecute: blockers.length === 0 && actions.length === 164,
    alreadyComplete: blockers.length === 0 && actions.length === 164 && updateCount === 0,
    actions: actions,
  };
}

function im1GoalsPlanSignature_(plan) {
  return im1GoalsStableJson_({
    expectedCount: plan.expectedCount,
    matchedCount: plan.matchedCount,
    updateCount: plan.updateCount,
    noOpCount: plan.noOpCount,
    blockingFindings: plan.blockingFindings,
    actions: plan.actions,
  });
}

function im1GoalsCompactPlan_(plan) {
  return {
    expectedCount: plan.expectedCount,
    matchedCount: plan.matchedCount,
    updateCount: plan.updateCount,
    noOpCount: plan.noOpCount,
    blockingFindings: plan.blockingFindings,
    safeToExecute: plan.safeToExecute,
    alreadyComplete: plan.alreadyComplete,
    writesOccurred: false,
  };
}

function im1GoalsVerifyRawMutation_(beforeRaw, afterRaw, headers, payload) {
  const errors = [];
  if (beforeRaw.length !== afterRaw.length) errors.push("Lessons row count changed.");
  if (!beforeRaw[0] || !afterRaw[0] || !im1GoalsValuesEqual_(beforeRaw[0], afterRaw[0])) errors.push("Lessons headers changed.");
  const lessonIdColumn = headers.indexOf("LessonID");
  const keyOutcomeColumn = headers.indexOf("KeyOutcome");
  const plannedDaysColumn = headers.indexOf("PlannedDays");
  const expected = new Map(payload.map(function (row) { return [row.LessonID, row]; }));
  const rowCount = Math.max(beforeRaw.length, afterRaw.length);
  for (let rowIndex = 1; rowIndex < rowCount; rowIndex += 1) {
    const beforeRow = beforeRaw[rowIndex] || [];
    const afterRow = afterRaw[rowIndex] || [];
    if (beforeRow.length !== afterRow.length) { errors.push("Lessons column count changed at row " + (rowIndex + 1) + "."); continue; }
    const lessonId = String(beforeRow[lessonIdColumn] || "");
    for (let columnIndex = 0; columnIndex < Math.max(beforeRow.length, afterRow.length); columnIndex += 1) {
      if (columnIndex === keyOutcomeColumn && expected.has(lessonId)) {
        if (String(afterRow[columnIndex] || "") !== expected.get(lessonId).KeyOutcome) errors.push(lessonId + " KeyOutcome read-back mismatch.");
      } else if (columnIndex === plannedDaysColumn && expected.has(lessonId)) {
        if (Number(afterRow[columnIndex]) !== expected.get(lessonId).PlannedDays) errors.push(lessonId + " PlannedDays read-back mismatch.");
      } else if (!im1GoalsValuesEqual_(beforeRow[columnIndex], afterRow[columnIndex])) {
        errors.push("Unexpected Lessons change at row " + (rowIndex + 1) + ", column " + (columnIndex + 1) + ".");
      }
    }
  }
  return { valid: errors.length === 0, errors: errors };
}

function im1GoalsRawEqual_(left, right) {
  if (left.length !== right.length) return false;
  return left.every(function (row, rowIndex) {
    const other = right[rowIndex] || [];
    return row.length === other.length && row.every(function (value, columnIndex) { return im1GoalsValuesEqual_(value, other[columnIndex]); });
  });
}

function im1GoalsCreateBackup_(spreadsheet, formatTimestamp) {
  const name = "Year Planner Database — pre-im1-goal-import " + formatTimestamp();
  const copy = spreadsheet.copy(name);
  if (!copy || !copy.getId()) throw new Error("Spreadsheet.copy() did not return a usable backup spreadsheet.");
  return { id: copy.getId(), url: copy.getUrl(), name: name };
}

function im1GoalsBuildLivePlan_(spreadsheet, payload, metadata, hashText) {
  return im1GoalsBuildPlan_(im1GoalsReadLessons_(spreadsheet), payload, metadata, hashText);
}

function im1GoalsPreviewLive_(deps) {
  const spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
  return im1GoalsCompactPlan_(im1GoalsBuildLivePlan_(spreadsheet, deps.payload, deps.metadata, deps.hashText));
}

function im1GoalsVerifyLive_(deps) {
  const plan = im1GoalsBuildLivePlan_(deps.spreadsheetApp.openById(deps.sheetId), deps.payload, deps.metadata, deps.hashText);
  return {
    valid: plan.safeToExecute && plan.alreadyComplete && plan.matchedCount === 164 && plan.noOpCount === 164,
    matchedCount: plan.matchedCount,
    noOpCount: plan.noOpCount,
    blockingFindings: plan.blockingFindings,
    writesOccurred: false,
  };
}

function im1GoalsExecuteLocked_(confirmation, deps) {
  const report = {
    mode: "execute", success: false, confirmationAccepted: false, lockAcquired: false,
    backup: null, writesOccurred: false, cellsWritten: 0, rolledBack: false, rollbackVerified: false,
  };
  if (confirmation !== deps.metadata.confirmationPhrase) {
    report.errorStage = "confirmation";
    report.errorMessage = "Confirmation did not match exactly. Nothing was opened, read, or written.";
    return report;
  }
  report.confirmationAccepted = true;
  const lock = deps.lockService.getScriptLock();
  let acquired = false;
  try { acquired = lock.tryLock(30000); } catch (error) { acquired = false; }
  if (!acquired) { report.errorStage = "lock"; report.errorMessage = "Could not acquire script lock. Nothing was written."; return report; }
  report.lockAcquired = true;
  let spreadsheet;
  let beforeRaw;
  let actions = [];
  try {
    spreadsheet = deps.spreadsheetApp.openById(deps.sheetId);
    const firstState = im1GoalsReadLessons_(spreadsheet);
    const firstPlan = im1GoalsBuildPlan_(firstState, deps.payload, deps.metadata, deps.hashText);
    report.plan = im1GoalsCompactPlan_(firstPlan);
    if (!firstPlan.safeToExecute) { report.errorStage = "planning"; report.errorMessage = "Preflight refused the goal update."; return report; }
    if (firstPlan.alreadyComplete) { report.success = true; report.verification = { valid: true, alreadyComplete: true }; return report; }
    try {
      report.backup = im1GoalsCreateBackup_(spreadsheet, deps.formatTimestamp);
    } catch (backupError) {
      report.errorStage = "backup";
      report.errorMessage = backupError.message;
      return report;
    }
    const secondState = im1GoalsReadLessons_(spreadsheet);
    const secondPlan = im1GoalsBuildPlan_(secondState, deps.payload, deps.metadata, deps.hashText);
    if (im1GoalsPlanSignature_(firstPlan) !== im1GoalsPlanSignature_(secondPlan)) {
      report.errorStage = "revalidation"; report.errorMessage = "Lessons changed after backup and before mutation."; return report;
    }
    actions = secondPlan.actions.filter(function (action) { return action.classification === "update"; });
    beforeRaw = [secondState.headers.slice()].concat(im1GoalsCloneRaw_(secondState.rows));
    const keyOutcomeColumn = secondState.headerIndex.KeyOutcome + 1;
    const plannedDaysColumn = secondState.headerIndex.PlannedDays + 1;
    actions.forEach(function (action) {
      secondState.sheet.getRange(action.rowNumber, keyOutcomeColumn).setValue(action.after);
      secondState.sheet.getRange(action.rowNumber, plannedDaysColumn).setValue(action.afterPlannedDays);
      report.cellsWritten += 2;
      report.writesOccurred = true;
    });
    if (typeof deps.spreadsheetApp.flush === "function") deps.spreadsheetApp.flush();
    const afterState = im1GoalsReadLessons_(spreadsheet);
    const afterRaw = [afterState.headers.slice()].concat(im1GoalsCloneRaw_(afterState.rows));
    report.verification = im1GoalsVerifyRawMutation_(beforeRaw, afterRaw, secondState.headers, deps.payload);
    if (!report.verification.valid) throw new Error("Exact post-write read-back failed.");
    const finalVerification = im1GoalsVerifyLive_(deps);
    report.verification.final = finalVerification;
    if (!finalVerification.valid) throw new Error("Standalone-shaped verification did not classify all 164 rows as exact no-ops.");
    report.success = true;
    return report;
  } catch (error) {
    report.errorStage = report.errorStage || "write-or-verify";
    report.errorMessage = error.message;
    if (spreadsheet && beforeRaw && actions.length) {
      try {
        const state = im1GoalsReadLessons_(spreadsheet);
        const keyOutcomeColumn = state.headerIndex.KeyOutcome + 1;
        const plannedDaysColumn = state.headerIndex.PlannedDays + 1;
        actions.forEach(function (action) {
          state.sheet.getRange(action.rowNumber, keyOutcomeColumn).setValue(action.before);
          state.sheet.getRange(action.rowNumber, plannedDaysColumn).setValue(action.beforePlannedDays);
        });
        if (typeof deps.spreadsheetApp.flush === "function") deps.spreadsheetApp.flush();
        const restored = im1GoalsReadLessons_(spreadsheet);
        const restoredRaw = [restored.headers.slice()].concat(im1GoalsCloneRaw_(restored.rows));
        report.rolledBack = true;
        report.rollbackVerified = im1GoalsRawEqual_(beforeRaw, restoredRaw);
      } catch (rollbackError) {
        report.rolledBack = false;
        report.rollbackVerified = false;
        report.rollbackError = rollbackError.message;
      }
    }
    report.manualRecoveryGuidance = report.backup && !report.rollbackVerified
      ? "Restore the complete spreadsheet from report.backup before any retry."
      : null;
    return report;
  } finally {
    try { lock.releaseLock(); } catch (releaseError) { /* Preserve the completed report. */ }
  }
}

function im1GoalsLiveDeps_() {
  return {
    spreadsheetApp: SpreadsheetApp,
    lockService: LockService,
    sheetId: SHEET_ID,
    payload: IM1_GOAL_ROWS,
    metadata: IM1_GOAL_PAYLOAD_METADATA,
    hashText: im1GoalsSha256_,
    formatTimestamp: function () { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss"); },
  };
}

function previewIm1GoalMigration() {
  throw new Error("DISARMED: IM1 goal preview requires temporary source authorization.");
  const report = im1GoalsPreviewLive_(im1GoalsLiveDeps_());
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function executeIm1GoalMigration(confirmation) {
  throw new Error("DISARMED: IM1 goal execution requires separate temporary source authorization.");
  return im1GoalsExecuteLocked_(confirmation, im1GoalsLiveDeps_());
}

function executeIm1GoalMigrationFromEditor() {
  throw new Error("DISARMED: IM1 goal editor execution requires separate temporary source authorization.");
  const CONFIRMATION = IM1_GOAL_EDITOR_PLACEHOLDER;
  const report = executeIm1GoalMigration(CONFIRMATION);
  Logger.log(JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.success) throw new Error("IM1 goal migration refused or failed: " + (report.errorMessage || "unknown error"));
  return report;
}

function verifyIm1GoalMigration() {
  throw new Error("DISARMED: IM1 goal verification requires temporary source authorization.");
  const report = im1GoalsVerifyLive_(im1GoalsLiveDeps_());
  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    IM1_GOAL_SHEET_NAME, IM1_GOAL_REQUIRED_HEADERS, IM1_GOAL_EDITOR_PLACEHOLDER,
    im1GoalsStableJson_, im1GoalsValuesEqual_, im1GoalsCloneRaw_, im1GoalsReadLessons_, im1GoalsNonKeyObject_,
    im1GoalsValidatePayload_, im1GoalsBuildPlan_, im1GoalsPlanSignature_, im1GoalsCompactPlan_,
    im1GoalsVerifyRawMutation_, im1GoalsRawEqual_, im1GoalsCreateBackup_, im1GoalsBuildLivePlan_,
    im1GoalsPreviewLive_, im1GoalsVerifyLive_, im1GoalsExecuteLocked_,
  };
}
