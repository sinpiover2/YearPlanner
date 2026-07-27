// Guarded, teacher-invoked real-roster import. Turns rows pasted into the
// RosterImport staging sheet into Students + SectionEnrollments rows.
//
// This file lives in the authenticated roster project (see README.md) and
// is never reachable through doGet/doPost or the anonymous planning API.
// Entry points are run directly from the Apps Script editor (matching how
// setupRosterSheetsV1() already works in the main project) or from the
// "Year Planner Roster Admin" spreadsheet menu installed by installRosterMenuTrigger_().
//
// Shares SHEET_ID, ROSTER_SCHEMAS, readRosterSheet_, isActiveRosterValue_,
// and describeRosterSchemaMismatch_ with Code.js — Apps Script projects
// share one global namespace across files, so nothing is imported.

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

// Creates or validates the RosterImport staging sheet. Safe to run more than
// once: an already-correct sheet is left untouched, and an incompatible
// non-empty sheet is refused rather than overwritten.
function setupRosterImportSheetV1() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error("Roster import setup is already running. Try again later.");
  }

  try {
    return setupRosterImportSheetV1Locked_();
  } finally {
    lock.releaseLock();
  }
}

function setupRosterImportSheetV1Locked_() {
  const expectedHeaders = ROSTER_SCHEMAS.RosterImport;
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName("RosterImport");

  if (!sheet) {
    sheet = spreadsheet.insertSheet("RosterImport");
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);

    return {
      ok: true,
      created: true,
      sheetExisted: false,
      message: "RosterImport sheet created with header row.",
    };
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 && lastColumn === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);

    return {
      ok: true,
      created: true,
      sheetExisted: true,
      message: "RosterImport sheet existed but was empty; header row written.",
    };
  }

  const actualHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((header) => String(header));
  const schemaMatches =
    lastColumn === expectedHeaders.length &&
    actualHeaders.every((header, index) => header === expectedHeaders[index]);

  if (!schemaMatches) {
    throw new Error(
      describeRosterSchemaMismatch_("RosterImport", expectedHeaders, actualHeaders),
    );
  }

  return {
    ok: true,
    created: false,
    sheetExisted: true,
    message: "RosterImport sheet already exists with the correct header row.",
  };
}

// ---------------------------------------------------------------------------
// Reading staging input
// ---------------------------------------------------------------------------

// Reads RosterImport rows, preserving each row's physical sheet row number so
// results can be written back to the correct Status cell. Throws on header
// mismatch, matching readRosterSheet_'s existing convention for canonical
// roster sheets.
function readRosterImportRows_(sheet) {
  const expectedHeaders = ROSTER_SCHEMAS.RosterImport;
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const actualHeaders =
    lastRow >= 1 && lastColumn >= 1
      ? sheet
          .getRange(1, 1, 1, lastColumn)
          .getValues()[0]
          .map((header) => String(header))
      : [];
  const schemaMatches =
    lastRow >= 1 &&
    lastColumn === expectedHeaders.length &&
    actualHeaders.every((header, index) => header === expectedHeaders[index]);

  if (!schemaMatches) {
    throw new Error(
      describeRosterSchemaMismatch_("RosterImport", expectedHeaders, actualHeaders),
    );
  }

  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, expectedHeaders.length).getValues();

  return values.map((row, index) => {
    const sectionId = String(row[0] || "").trim();
    const legalFirstName = String(row[1] || "").trim();
    const legalLastName = String(row[2] || "").trim();
    const preferredName = String(row[3] || "").trim();

    return {
      rowNumber: index + 2,
      sectionId,
      legalFirstName,
      legalLastName,
      preferredName,
      blank: !sectionId && !legalFirstName && !legalLastName && !preferredName,
    };
  });
}

// ---------------------------------------------------------------------------
// Planning (pure — no Apps Script services, safe to unit test in isolation)
// ---------------------------------------------------------------------------

function normalizeImportNameKey_(firstName, lastName) {
  return `${String(firstName || "").trim().toLocaleLowerCase()}|${String(lastName || "")
    .trim()
    .toLocaleLowerCase()}`;
}

// Decides, for every nonblank staging row, whether it creates a new student
// and/or enrollment, reuses an existing student, is a duplicate to skip, or
// must reject the whole batch. Never touches a spreadsheet — importRosterFromStaging()
// is the only place that turns this plan into a write.
//
// Matching policy (see ROSTER_INFORMATION_MODEL.md — no external student ID
// exists to match against, so name is the only available signal):
//   - Exactly one existing active student with this normalized name: reuse it.
//   - No existing active student with this name: this is a new student the
//     first time it's seen in the batch; later rows in the same batch with
//     the same name reuse that freshly minted StudentID rather than minting
//     a second one.
//   - Two or more existing active students share this normalized name:
//     unresolvable — reject rather than guess which one is meant.
// A row whose (resolved student, SectionID) pair is already an active
// enrollment — either in canonical data or earlier in this same batch — is
// skipped, never re-created.
function planRosterImport_({ stagingRows, sectionIds, students, enrollments, generateId }) {
  const activeStudentsByName = new Map();

  students.forEach((student) => {
    if (!isActiveRosterValue_(student.Active)) return;

    const key = normalizeImportNameKey_(student.LegalFirstName, student.LegalLastName);

    if (!activeStudentsByName.has(key)) activeStudentsByName.set(key, []);
    activeStudentsByName.get(key).push(String(student.StudentID));
  });

  const activeEnrollmentKeys = new Set(
    enrollments
      .filter((enrollment) => isActiveRosterValue_(enrollment.Active))
      .map((enrollment) => `${enrollment.StudentID}|${enrollment.SectionID}`),
  );

  const batchNewStudentsByName = new Map();
  const batchEnrollmentKeysSeen = new Set();
  const rows = [];
  const blockingErrors = [];

  stagingRows.forEach((stagingRow) => {
    if (stagingRow.blank) return;

    const { rowNumber, sectionId, legalFirstName, legalLastName, preferredName } = stagingRow;
    const base = { rowNumber, sectionId, legalFirstName, legalLastName, preferredName };

    if (!sectionId || !sectionIds.has(sectionId)) {
      rows.push({ ...base, action: "reject", status: "Rejected: unknown SectionID", studentId: null });
      blockingErrors.push(`Row ${rowNumber}: unknown SectionID "${sectionId || ""}".`);
      return;
    }

    if (!legalFirstName) {
      rows.push({
        ...base,
        action: "reject",
        status: "Rejected: missing legal first name",
        studentId: null,
      });
      blockingErrors.push(`Row ${rowNumber}: missing legal first name.`);
      return;
    }

    if (!legalLastName) {
      rows.push({
        ...base,
        action: "reject",
        status: "Rejected: missing legal last name",
        studentId: null,
      });
      blockingErrors.push(`Row ${rowNumber}: missing legal last name.`);
      return;
    }

    const nameKey = normalizeImportNameKey_(legalFirstName, legalLastName);
    const canonicalMatches = activeStudentsByName.get(nameKey) || [];

    let studentId = null;
    let isNewStudent = false;

    if (canonicalMatches.length > 1) {
      const status = `Rejected: ambiguous student match (${canonicalMatches.length} existing students share this name)`;
      rows.push({ ...base, action: "reject", status, studentId: null });
      blockingErrors.push(
        `Row ${rowNumber}: ambiguous student match — ${canonicalMatches.length} existing active students share the name "${legalFirstName} ${legalLastName}". Resolve manually before importing.`,
      );
      return;
    }

    if (canonicalMatches.length === 1) {
      studentId = canonicalMatches[0];
    } else if (batchNewStudentsByName.has(nameKey)) {
      studentId = batchNewStudentsByName.get(nameKey);
    } else {
      studentId = generateId("STU");
      isNewStudent = true;
      batchNewStudentsByName.set(nameKey, studentId);
    }

    const enrollmentKey = `${studentId}|${sectionId}`;

    if (activeEnrollmentKeys.has(enrollmentKey)) {
      rows.push({
        ...base,
        action: "skip-existing-duplicate",
        status: "Skipped: active enrollment already exists",
        studentId,
        isNewStudent: false,
      });
      return;
    }

    if (batchEnrollmentKeysSeen.has(enrollmentKey)) {
      rows.push({
        ...base,
        action: "skip-batch-duplicate",
        status: "Skipped: duplicate row within this import",
        studentId,
        isNewStudent: false,
      });
      return;
    }

    batchEnrollmentKeysSeen.add(enrollmentKey);

    rows.push({
      ...base,
      action: isNewStudent ? "create-student-and-enrollment" : "create-enrollment",
      status: isNewStudent
        ? "Imported: student and enrollment created"
        : "Imported: enrollment created",
      studentId,
      isNewStudent,
      newEnrollmentId: generateId("ENR"),
    });
  });

  const ok = blockingErrors.length === 0;

  // A single bad row blocks the whole batch (see module comment above and
  // ROSTER_INFORMATION_MODEL.md). Rows that were otherwise fine are relabeled
  // "blocked" rather than silently left showing an "Imported" status they
  // never actually received.
  const finalRows = ok
    ? rows
    : rows.map((row) =>
        row.action === "reject"
          ? row
          : {
              ...row,
              action: "blocked",
              status: "Not imported: batch rejected — fix flagged rows above and re-run",
            },
      );

  return {
    ok,
    rows: finalRows,
    blockingErrors,
    summary: buildImportSummary_(finalRows),
  };
}

function buildImportSummary_(rows) {
  const summary = {
    rowsRead: rows.length,
    studentsCreated: 0,
    enrollmentsCreated: 0,
    duplicateEnrollmentsSkipped: 0,
    rejectedRows: 0,
    perSection: {},
  };

  rows.forEach((row) => {
    const sectionKey = row.sectionId || "(unknown)";

    if (!summary.perSection[sectionKey]) {
      summary.perSection[sectionKey] = { read: 0, imported: 0, skipped: 0, rejected: 0 };
    }

    summary.perSection[sectionKey].read += 1;

    if (row.action === "create-student-and-enrollment") {
      summary.studentsCreated += 1;
      summary.enrollmentsCreated += 1;
      summary.perSection[sectionKey].imported += 1;
    } else if (row.action === "create-enrollment") {
      summary.enrollmentsCreated += 1;
      summary.perSection[sectionKey].imported += 1;
    } else if (row.action === "skip-existing-duplicate" || row.action === "skip-batch-duplicate") {
      summary.duplicateEnrollmentsSkipped += 1;
      summary.perSection[sectionKey].skipped += 1;
    } else if (row.action === "reject") {
      summary.rejectedRows += 1;
      summary.perSection[sectionKey].rejected += 1;
    }
    // "blocked" rows (valid rows shadowed by another row's rejection) count
    // only toward `read` — they were never the problem, so they don't inflate
    // rejectedRows, and they never became an import, so they don't inflate
    // studentsCreated/enrollmentsCreated either.
  });

  return summary;
}

// ---------------------------------------------------------------------------
// Status write-back
// ---------------------------------------------------------------------------

// Writes each row's outcome into its own Status cell. Only ever touches the
// RosterImport staging sheet, never canonical roster data, so this is always
// safe to call — including when the batch was rejected before any mutation.
function writeImportStatuses_(sheet, rows) {
  if (!rows.length) return;

  const statusColumn = ROSTER_SCHEMAS.RosterImport.indexOf("Status") + 1;

  rows.forEach((row) => {
    sheet.getRange(row.rowNumber, statusColumn).setValue(row.status);
  });
}

// ---------------------------------------------------------------------------
// Import entry point
// ---------------------------------------------------------------------------

function importRosterFromStaging() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error("Roster import is already running. Try again later.");
  }

  try {
    return importRosterFromStagingLocked_();
  } finally {
    lock.releaseLock();
  }
}

function importRosterFromStagingLocked_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const stagingSheet = spreadsheet.getSheetByName("RosterImport");

  if (!stagingSheet) {
    throw new Error(
      'RosterImport sheet not found. Run "Set Up Roster Import Sheet" first.',
    );
  }

  // Preflight — every check below must pass before the first roster
  // mutation. readRosterSheet_ and readRosterImportRows_ both throw on
  // missing sheets or a header mismatch, which is exactly the fail-fast
  // behavior required here.
  const stagingRows = readRosterImportRows_(stagingSheet);
  const sections = readRosterSheet_(spreadsheet, "Sections");
  const students = readRosterSheet_(spreadsheet, "Students");
  const enrollments = readRosterSheet_(spreadsheet, "SectionEnrollments");

  const sectionIds = new Set(sections.map((section) => String(section.SectionID)));

  const plan = planRosterImport_({
    stagingRows,
    sectionIds,
    students,
    enrollments,
    generateId: (prefix) => `${prefix}-${Utilities.getUuid()}`,
  });

  // Rows whose outcome doesn't depend on the pending write below (rejected,
  // blocked, or skipped as a duplicate) get a durable Status immediately.
  // Rows about to be imported are deliberately NOT marked here — Status must
  // never claim "Imported" before the corresponding write has actually
  // succeeded (see the writeImportStatuses_ calls below, after the write).
  const pendingCreateRows = plan.rows.filter(
    (row) => row.action === "create-student-and-enrollment" || row.action === "create-enrollment",
  );
  const settledRows = plan.rows.filter((row) => !pendingCreateRows.includes(row));

  writeImportStatuses_(stagingSheet, settledRows);

  if (!plan.ok) {
    // plan.ok === false guarantees pendingCreateRows is empty — a rejected
    // batch never resolves any row to a create action (see
    // planRosterImport_) — so settledRows above already covered every row.
    return buildImportResult_(plan, {
      ok: false,
      studentsCreated: 0,
      enrollmentsCreated: 0,
      errors: plan.blockingErrors,
      rollbackRequired: false,
      rollbackSucceeded: null,
    });
  }

  const newStudentRows = pendingCreateRows
    .filter((row) => row.action === "create-student-and-enrollment")
    .map((row) => [row.studentId, row.legalFirstName, row.legalLastName, row.preferredName, true]);
  const newEnrollmentRows = pendingCreateRows.map((row) => [
    row.newEnrollmentId,
    row.sectionId,
    row.studentId,
    true,
    "",
    "",
  ]);

  const studentsSheet = spreadsheet.getSheetByName("Students");
  const enrollmentsSheet = spreadsheet.getSheetByName("SectionEnrollments");
  const studentsStartRow = studentsSheet.getLastRow();
  const enrollmentsStartRow = enrollmentsSheet.getLastRow();

  let writtenStudents = false;
  let writtenEnrollments = false;

  try {
    if (newStudentRows.length > 0) {
      studentsSheet
        .getRange(studentsStartRow + 1, 1, newStudentRows.length, ROSTER_SCHEMAS.Students.length)
        .setValues(newStudentRows);
      writtenStudents = true;
    }

    if (newEnrollmentRows.length > 0) {
      enrollmentsSheet
        .getRange(
          enrollmentsStartRow + 1,
          1,
          newEnrollmentRows.length,
          ROSTER_SCHEMAS.SectionEnrollments.length,
        )
        .setValues(newEnrollmentRows);
      writtenEnrollments = true;
    }
  } catch (error) {
    // Rollback is scoped to exactly the rows this attempt appended — the
    // prior row count was captured above, so this never touches
    // pre-existing canonical data, unlike setupRosterSheetsV1Locked's
    // whole-sheet rollback (that function could assume an empty starting
    // sheet; this one cannot).
    const rollbackErrors = [];

    if (writtenStudents) {
      try {
        studentsSheet.deleteRows(studentsStartRow + 1, newStudentRows.length);
      } catch (rollbackError) {
        rollbackErrors.push(`Students: ${rollbackError.message}`);
      }
    }

    if (writtenEnrollments) {
      try {
        enrollmentsSheet.deleteRows(enrollmentsStartRow + 1, newEnrollmentRows.length);
      } catch (rollbackError) {
        rollbackErrors.push(`SectionEnrollments: ${rollbackError.message}`);
      }
    }

    const rollbackSucceeded = rollbackErrors.length === 0;

    writeImportStatuses_(
      stagingSheet,
      pendingCreateRows.map((row) => ({
        ...row,
        status: "Not imported: write failed — see import summary",
      })),
    );

    return buildImportResult_(plan, {
      ok: false,
      studentsCreated: 0,
      enrollmentsCreated: 0,
      errors: [
        `Roster mutation failed: ${error.message}`,
        rollbackSucceeded
          ? "Rollback of newly written rows succeeded; no canonical data was left in a partial state."
          : `Rollback was incomplete: ${rollbackErrors.join("; ")}. Manual spreadsheet review is required.`,
      ],
      rollbackRequired: true,
      rollbackSucceeded,
    });
  }

  // Only now — after the write above has actually succeeded — record
  // "Imported" for these rows.
  writeImportStatuses_(stagingSheet, pendingCreateRows);

  return buildImportResult_(plan, {
    ok: true,
    studentsCreated: newStudentRows.length,
    enrollmentsCreated: newEnrollmentRows.length,
    errors: [],
    rollbackRequired: false,
    rollbackSucceeded: null,
  });
}

function buildImportResult_(plan, overrides) {
  return {
    ok: overrides.ok,
    rowsRead: plan.summary.rowsRead,
    studentsCreated: overrides.studentsCreated,
    enrollmentsCreated: overrides.enrollmentsCreated,
    duplicateEnrollmentsSkipped: plan.summary.duplicateEnrollmentsSkipped,
    rejectedRows: plan.summary.rejectedRows,
    perSection: plan.summary.perSection,
    errors: overrides.errors,
    warnings: [],
    rollbackRequired: overrides.rollbackRequired,
    rollbackSucceeded: overrides.rollbackSucceeded,
  };
}

// ---------------------------------------------------------------------------
// Spreadsheet menu
// ---------------------------------------------------------------------------

// This project is a standalone Apps Script project, not bound to the
// spreadsheet (see Code.js: every sheet access goes through
// SpreadsheetApp.openById(SHEET_ID), never getActiveSpreadsheet()). A simple
// onOpen() trigger only fires automatically for bound scripts, so the menu
// below only appears after installRosterMenuTrigger_() has been run once.
// Until then — or as an always-available fallback — every function above
// remains directly runnable from the Apps Script editor's Run button, the
// same way setupRosterSheetsV1() already is.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Year Planner Roster Admin")
    .addItem("Set Up Roster Import Sheet", "runSetupRosterImportSheetFromMenu_")
    .addItem("Import Roster from Staging", "runImportRosterFromStagingFromMenu_")
    .addToUi();
}

// Thin UI wrappers around the guarded functions above. Kept separate so the
// guarded functions themselves never call SpreadsheetApp.getUi() — that call
// throws when a function is run directly from the Apps Script editor (no UI
// context there), which is the primary, guaranteed-to-work invocation path.
function runSetupRosterImportSheetFromMenu_() {
  try {
    const result = setupRosterImportSheetV1();
    SpreadsheetApp.getUi().alert(result.message);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Roster import sheet setup failed: ${error.message}`);
  }
}

function runImportRosterFromStagingFromMenu_() {
  try {
    const result = importRosterFromStaging();
    SpreadsheetApp.getUi().alert(formatImportSummaryForAlert_(result));
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Roster import failed: ${error.message}`);
  }
}

function formatImportSummaryForAlert_(result) {
  const perSectionLines = Object.keys(result.perSection)
    .sort()
    .map((sectionId) => {
      const counts = result.perSection[sectionId];
      return `  ${sectionId}: ${counts.imported} imported, ${counts.skipped} skipped, ${counts.rejected} rejected`;
    });
  const lines = [
    result.ok ? "Import completed." : "Import was not applied — see details below.",
    `Rows read: ${result.rowsRead}`,
    `Students created: ${result.studentsCreated}`,
    `Enrollments created: ${result.enrollmentsCreated}`,
    `Duplicate enrollments skipped: ${result.duplicateEnrollmentsSkipped}`,
    `Rejected rows: ${result.rejectedRows}`,
    "Per section:",
    ...perSectionLines,
  ];

  if (result.errors.length) {
    lines.push("Errors:", ...result.errors.map((message) => `  ${message}`));
  }

  if (result.rollbackRequired) {
    lines.push(
      result.rollbackSucceeded
        ? "A write failure occurred; rollback succeeded and no partial data was left behind."
        : "A write failure occurred and rollback was INCOMPLETE — manual spreadsheet review is required.",
    );
  }

  lines.push("See the Status column in RosterImport for a per-row result.");

  return lines.join("\n");
}

// One-time setup so the menu above appears automatically on open. Safe to
// run more than once — it checks for an existing trigger first. Run this
// once from the Apps Script editor after the project is pushed/deployed.
function installRosterMenuTrigger_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const alreadyInstalled = ScriptApp.getProjectTriggers().some(
    (trigger) =>
      trigger.getHandlerFunction() === "onOpen" &&
      trigger.getEventType() === ScriptApp.EventType.ON_OPEN,
  );

  if (alreadyInstalled) {
    return { ok: true, alreadyInstalled: true };
  }

  ScriptApp.newTrigger("onOpen").forSpreadsheet(spreadsheet).onOpen().create();

  return { ok: true, alreadyInstalled: false };
}
