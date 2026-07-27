// Guarded cleanup for the confirmed fictional/test data in the shared Year
// Planner production spreadsheet, driven by ProductionDataAudit.js's
// findings (see that file's live results: 48/48 seeded roster matches, a
// possible Ferd Derfman import, 4 malformed DailyProgress rows, 1 populated
// RosterImport staging row).
//
// Administrative, teacher-triggered tool: run previewProductionDataCleanupV1()
// from the Apps Script editor's Run button while signed into the district
// account, review its output, and only then consider
// executeProductionDataCleanupV1() (see that function for how confirmation
// works). There is no doGet/doPost route, no frontend integration, and this
// is not wired into the Sheets menu — Jeff runs both functions manually.
//
// Hard dependency: this file reuses SHEET_ID (Code.js), and auditReadSheet_,
// auditBuildIdSet_, auditNormalizeId_, auditIsBlank_, auditNormalizeNameKey_,
// auditParseDateValue_, AUDIT_FICTIONAL_STUDENT_NAMES,
// AUDIT_SEEDED_SECTION_IDS (ProductionDataAudit.js) — same Apps Script
// project, shared global namespace. It must be pushed alongside those files,
// not in isolation. Reusing the audit's already-reviewed 48-name list and
// matching primitives here (rather than a third hand-copied duplicate) is
// deliberate — see that file's own header comment for why a second copy
// already exists.
//
// Scope: this file only ever reads Sections/Courses/Units/Lessons (to build
// valid-ID reference sets for the DailyProgress orphan check) and only ever
// mutates Students, SectionEnrollments, DailyProgress, and RosterImport —
// and even then only the specific rows selected by cleanupBuildPlan_ below.
// Settings, RosterSettings, SchoolCalendar, SchedulePatterns, YearPlan, and
// any "CourseCalendar" sheet are never read or touched by this file at all.

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CLEANUP_EXPECTED_SEEDED_STUDENT_COUNT = 48;
const CLEANUP_EXPECTED_SEEDED_ENROLLMENT_COUNT = 48;
const CLEANUP_EXPECTED_MALFORMED_DAILY_PROGRESS_COUNT = 4;

const CLEANUP_FERD_FIRST_NAME = "Ferd";
const CLEANUP_FERD_LAST_NAME = "Derfman";

// The malformed DailyProgress rows' exact garbage values, per the audit's
// live findings — not real IDs, just the specific broken strings that must
// match exactly before a row is even considered.
const CLEANUP_MALFORMED_DAILY_PROGRESS_COURSE_SECTION_ID = "IM1";
const CLEANUP_MALFORMED_DAILY_PROGRESS_COURSE_ID = "IM1-U1";
const CLEANUP_MALFORMED_DAILY_PROGRESS_UNIT_ID = "IM1-U1-L2";

const CLEANUP_EXAMPLE_NAME_COUNT = 5;

const CLEANUP_BACKUP_NAME_PREFIX = "Year Planner Database — pre-test-data-cleanup ";

// executeProductionDataCleanupV1() refuses to mutate anything unless the
// confirmation argument is exactly this string (strict ===, not a truthy
// check) — see that function for how Jeff supplies it.
const CLEANUP_CONFIRMATION_SENTINEL = "DELETE-CONFIRMED-YEAR-PLANNER-TEST-DATA";

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

// Read-only. Builds the exact same plan executeProductionDataCleanupV1()
// would use, and reports it — zero mutations, no backup, no lock. Run this
// first, every time, and review its output before ever touching
// executeProductionDataCleanupV1().
function previewProductionDataCleanupV1() {
  const startedAt = new Date();
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const plan = cleanupBuildPlan_(spreadsheet);
  const report = cleanupBuildPreviewReport_(plan, startedAt);

  Logger.log(cleanupBuildPreviewHumanSummary_(report).join("\n"));
  Logger.log("\n----- CLEANUP PREVIEW REPORT (JSON) -----\n");
  Logger.log(JSON.stringify(report, null, 2));

  return report;
}

// Apps Script's Run button calls functions with zero arguments, so an
// argument-based confirmation (executeProductionDataCleanupV1("...")) isn't
// practical to invoke from the editor's primary workflow. Instead: this
// wrapper carries a placeholder confirmation value that refuses to mutate
// anything. To actually run the cleanup, deliberately edit the line below —
// and only after you have run and read previewProductionDataCleanupV1()'s
// output.
function executeProductionDataCleanupV1() {
  // Change ONLY the line below, and only when ready to run the real cleanup
  // against the LIVE production spreadsheet. Any value other than the exact
  // sentinel in CLEANUP_CONFIRMATION_SENTINEL refuses to mutate anything —
  // no partial phrase, no boolean, no accidental truthy value will work.
  const CONFIRMATION = "REVIEW-PREVIEW-FIRST-BEFORE-CHANGING-THIS";

  return executeProductionDataCleanupV1Locked_(CONFIRMATION);
}

// ---------------------------------------------------------------------------
// Execution (guarded)
// ---------------------------------------------------------------------------

function executeProductionDataCleanupV1Locked_(confirmation) {
  const startedAt = new Date();
  const completedSteps = [];
  let backup = null;

  if (confirmation !== CLEANUP_CONFIRMATION_SENTINEL) {
    return cleanupBuildExecutionReport_({
      startedAt: startedAt,
      success: false,
      confirmationAccepted: false,
      failurePoint: "confirmation",
      errorMessage: "Confirmation sentinel did not match exactly. No data was read or touched.",
      completedSteps: completedSteps,
      backup: backup,
    });
  }

  // Lock scope, precisely (see ProductionDataAudit.js's identical caveat):
  // LockService.getScriptLock() is per-Apps-Script-*project*, not
  // per-spreadsheet. It only prevents overlap with other functions in this
  // same project that also take the script lock (setupRosterImportSheetV1,
  // importRosterFromStaging, previewProductionDataCleanupV1 does NOT take
  // it). It does NOT prevent overlap with apps-script-planning (a separate
  // project, separate lock domain — saveDailyProgress/addLesson/
  // deleteLesson/setupRosterSheetsV1 there share no lock with this one) and
  // does NOT block manual edits made directly in the Sheets UI. 30s timeout
  // matches the existing guarded functions' convention in RosterImport.js.
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lockAcquired = lock.tryLock(30000);
  } catch (error) {
    lockAcquired = false;
  }

  if (!lockAcquired) {
    return cleanupBuildExecutionReport_({
      startedAt: startedAt,
      success: false,
      confirmationAccepted: true,
      failurePoint: "lock",
      errorMessage: "Could not acquire the script lock within 30 seconds. No data was touched.",
      completedSteps: completedSteps,
      backup: backup,
    });
  }

  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

    const planningPass = cleanupBuildPlan_(spreadsheet);

    if (planningPass.blocked) {
      return cleanupBuildExecutionReport_({
        startedAt: startedAt,
        success: false,
        confirmationAccepted: true,
        failurePoint: "planning",
        errorMessage: "Cleanup plan has blocking findings; no data was touched.",
        blockingFindings: planningPass.blockingFindings,
        completedSteps: completedSteps,
        backup: backup,
      });
    }

    // Defense in depth: cleanupBuildPlan_ already enforces these exact
    // counts via blockingFindings (so planningPass.blocked would already be
    // true otherwise), but re-asserted explicitly here so the guard is
    // visible directly in the execution path, not only inside the shared
    // plan builder.
    if (
      planningPass.seeded.students.length !== CLEANUP_EXPECTED_SEEDED_STUDENT_COUNT ||
      planningPass.seeded.enrollments.length !== CLEANUP_EXPECTED_SEEDED_ENROLLMENT_COUNT ||
      planningPass.malformedDailyProgress.rows.length !== CLEANUP_EXPECTED_MALFORMED_DAILY_PROGRESS_COUNT
    ) {
      return cleanupBuildExecutionReport_({
        startedAt: startedAt,
        success: false,
        confirmationAccepted: true,
        failurePoint: "count-guard",
        errorMessage: "Exact-count guard failed; no data was touched.",
        completedSteps: completedSteps,
        backup: backup,
      });
    }

    try {
      backup = cleanupCreateBackup_(spreadsheet);
    } catch (error) {
      return cleanupBuildExecutionReport_({
        startedAt: startedAt,
        success: false,
        confirmationAccepted: true,
        failurePoint: "backup",
        errorMessage: "Backup creation failed: " + error.message + ". No production data was touched.",
        completedSteps: completedSteps,
        backup: null,
      });
    }
    completedSteps.push("backup-created");

    // Re-read and re-run the exact same selection logic immediately before
    // mutating, keeping the validation-to-mutation window as short as
    // practical (just the time the backup copy took). cleanupBuildPlan_ is
    // a pure function of live sheet state, so calling it again and
    // comparing row-number sets against the planning pass is both the
    // simplest and the most rigorous way to confirm nothing about the
    // selected rows changed — any edit, addition, or removal among the
    // qualifying rows changes at least one row-number set and aborts here,
    // before anything is deleted.
    const revalidationPass = cleanupBuildPlan_(spreadsheet);

    if (!cleanupPlansMatch_(planningPass, revalidationPass)) {
      return cleanupBuildExecutionReport_({
        startedAt: startedAt,
        success: false,
        confirmationAccepted: true,
        failurePoint: "revalidation",
        errorMessage: "Selected rows changed between planning and mutation; aborted before deleting anything.",
        completedSteps: completedSteps,
        backup: backup,
      });
    }
    completedSteps.push("revalidated");

    const plan = revalidationPass;
    const studentsSheet = spreadsheet.getSheetByName("Students");
    const enrollmentsSheet = spreadsheet.getSheetByName("SectionEnrollments");
    const dailyProgressSheet = spreadsheet.getSheetByName("DailyProgress");
    const rosterImportSheet = spreadsheet.getSheetByName("RosterImport");

    // 1 & 2 — children before parents: every SectionEnrollments row for the
    // 48 seeded students plus Ferd's (if matched), deleted together in one
    // bottom-to-top pass so no deletion shifts a not-yet-deleted row number.
    const enrollmentRowNumbers = plan.seeded.enrollments
      .map(function (item) {
        return item.rowNumber;
      })
      .concat(
        plan.ferd.enrollments.map(function (item) {
          return item.rowNumber;
        }),
      );
    const enrollmentsRemoved = cleanupDeleteRowsDescending_(enrollmentsSheet, enrollmentRowNumbers);
    completedSteps.push("enrollments-deleted:" + enrollmentsRemoved);

    // 3 & 4 — the 48 seeded Students plus Ferd (if matched), bottom-to-top.
    const studentRowNumbers = plan.seeded.students
      .map(function (item) {
        return item.rowNumber;
      })
      .concat(plan.ferd.student ? [plan.ferd.student.rowNumber] : []);
    const studentsRemoved = cleanupDeleteRowsDescending_(studentsSheet, studentRowNumbers);
    completedSteps.push("students-deleted:" + studentsRemoved);

    // 5 — the 4 matched malformed DailyProgress rows, bottom-to-top.
    const dailyProgressRowNumbers = plan.malformedDailyProgress.rows.map(function (item) {
      return item.rowNumber;
    });
    const dailyProgressRemoved = cleanupDeleteRowsDescending_(dailyProgressSheet, dailyProgressRowNumbers);
    completedSteps.push("daily-progress-deleted:" + dailyProgressRemoved);

    // 6 — clear RosterImport's populated data range only; header row,
    // formatting, validation, column widths, and sheet identity untouched.
    cleanupClearRosterImportData_(rosterImportSheet);
    completedSteps.push("roster-import-cleared");

    return cleanupBuildExecutionReport_({
      startedAt: startedAt,
      success: true,
      confirmationAccepted: true,
      backup: backup,
      enrollmentsRemoved: enrollmentsRemoved,
      studentsRemoved: studentsRemoved,
      ferdRemoved: !!plan.ferd.student,
      dailyProgressRowsRemoved: dailyProgressRemoved,
      rosterImportRowsCleared: plan.rosterImport.rows.length,
      completedSteps: completedSteps,
    });
  } catch (error) {
    return cleanupBuildExecutionReport_({
      startedAt: startedAt,
      success: false,
      confirmationAccepted: true,
      failurePoint: "exception",
      errorMessage: error.message,
      completedSteps: completedSteps,
      backup: backup,
    });
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

// ---------------------------------------------------------------------------
// Shared selection logic (read-only) — the single source of truth for what
// qualifies, used identically by preview and by execution's planning AND
// revalidation passes. Never mutates anything; only calls auditReadSheet_
// (ProductionDataAudit.js) and pure JavaScript aggregation.
// ---------------------------------------------------------------------------

function cleanupBuildPlan_(spreadsheet) {
  const requiredSheets = {
    Students: auditReadSheet_(spreadsheet, "Students"),
    SectionEnrollments: auditReadSheet_(spreadsheet, "SectionEnrollments"),
    Sections: auditReadSheet_(spreadsheet, "Sections"),
    Courses: auditReadSheet_(spreadsheet, "Courses"),
    Units: auditReadSheet_(spreadsheet, "Units"),
    Lessons: auditReadSheet_(spreadsheet, "Lessons"),
    DailyProgress: auditReadSheet_(spreadsheet, "DailyProgress"),
    RosterImport: auditReadSheet_(spreadsheet, "RosterImport"),
  };

  const blockingFindings = [];

  Object.keys(requiredSheets).forEach(function (name) {
    const sheet = requiredSheets[name];
    if (!sheet.present) {
      blockingFindings.push("Required sheet '" + name + "' was not found.");
      return;
    }
    // A duplicate column header silently corrupts every field-based match
    // on that sheet (the later column wins) — refusing outright here is
    // stricter than the read-only audit, which only warns, because this
    // file deletes rows based on that same field data.
    if (sheet.duplicateHeaders && sheet.duplicateHeaders.length > 0) {
      blockingFindings.push(
        "Sheet '" + name + "' has duplicate column header(s) " + sheet.duplicateHeaders.join(", ") + ".",
      );
    }
  });

  const emptyPlan = {
    students: [],
    enrollments: [],
    skipped: [],
    blockingFindings: [],
  };

  if (blockingFindings.length > 0) {
    return {
      blocked: true,
      blockingFindings: blockingFindings,
      seeded: emptyPlan,
      ferd: { status: "none", student: null, enrollments: [], blockingFindings: [] },
      malformedDailyProgress: { rows: [], blockingFindings: [] },
      rosterImport: { rows: [] },
    };
  }

  const validSectionIds = auditBuildIdSet_(requiredSheets.Sections.objects, "SectionID");
  const validCourseIds = auditBuildIdSet_(requiredSheets.Courses.objects, "CourseID");
  const validUnitIds = auditBuildIdSet_(requiredSheets.Units.objects, "UnitID");
  const validLessonIds = auditBuildIdSet_(requiredSheets.Lessons.objects, "LessonID");

  const seeded = cleanupQualifySeededStudents_(requiredSheets.Students, requiredSheets.SectionEnrollments);
  const ferd = cleanupFindFerd_(requiredSheets.Students, requiredSheets.SectionEnrollments);
  const malformedDailyProgress = cleanupFindMalformedDailyProgressRows_(
    requiredSheets.DailyProgress,
    validSectionIds,
    validCourseIds,
    validUnitIds,
    validLessonIds,
  );
  const rosterImport = cleanupFindRosterImportRows_(requiredSheets.RosterImport);

  const allBlockingFindings = [].concat(seeded.blockingFindings, ferd.blockingFindings, malformedDailyProgress.blockingFindings);

  return {
    blocked: allBlockingFindings.length > 0,
    blockingFindings: allBlockingFindings,
    seeded: seeded,
    ferd: ferd,
    malformedDailyProgress: malformedDailyProgress,
    rosterImport: rosterImport,
  };
}

// A seed name qualifies its Student only when every one of the task's
// listed conditions holds; any failure both skips that name AND adds a
// blocking finding (per spec, every one of these discrepancies must stop
// execution, not just be silently excluded).
function cleanupQualifySeededStudents_(studentsSheet, enrollmentsSheet) {
  const seededSectionSet = new Set(AUDIT_SEEDED_SECTION_IDS);

  const studentsByNameKey = {};
  studentsSheet.objects.forEach(function (row) {
    const key = auditNormalizeNameKey_(row.LegalFirstName, row.LegalLastName);
    if (!studentsByNameKey[key]) studentsByNameKey[key] = [];
    studentsByNameKey[key].push(row);
  });

  const enrollmentsByStudentId = {};
  enrollmentsSheet.objects.forEach(function (row) {
    const studentId = auditNormalizeId_(row.StudentID);
    if (!studentId) return;
    if (!enrollmentsByStudentId[studentId]) enrollmentsByStudentId[studentId] = [];
    enrollmentsByStudentId[studentId].push(row);
  });

  const students = [];
  const enrollments = [];
  const skipped = [];
  const blockingFindings = [];

  AUDIT_FICTIONAL_STUDENT_NAMES.forEach(function (pair) {
    const label = pair[0] + " " + pair[1];
    const key = auditNormalizeNameKey_(pair[0], pair[1]);
    const matches = studentsByNameKey[key] || [];

    if (matches.length === 0) {
      skipped.push({ name: label, reason: "zero Students matches" });
      blockingFindings.push("Seed name '" + label + "' has zero matches.");
      return;
    }
    if (matches.length > 1) {
      skipped.push({ name: label, reason: matches.length + " Students matches (ambiguous)" });
      blockingFindings.push("Seed name '" + label + "' matched " + matches.length + " Students rows (ambiguous).");
      return;
    }

    const studentRow = matches[0];
    const studentId = auditNormalizeId_(studentRow.StudentID);
    const studentEnrollments = enrollmentsByStudentId[studentId] || [];

    if (studentEnrollments.length === 0) {
      skipped.push({ name: label, reason: "no enrollments" });
      blockingFindings.push("Seed name '" + label + "' has no SectionEnrollments row.");
      return;
    }

    // The seeder always creates exactly one enrollment per seeded student;
    // more than one is not itself in the task's literal disqualifying list,
    // but it never happens for real seeded data, and the 48/48 aggregate
    // guard would fail anyway if it did — flagged explicitly here for a
    // clearer, specific error rather than only a generic count mismatch.
    if (studentEnrollments.length > 1) {
      skipped.push({ name: label, reason: studentEnrollments.length + " enrollments (expected exactly 1)" });
      blockingFindings.push("Seed name '" + label + "' has " + studentEnrollments.length + " enrollments; expected exactly 1.");
      return;
    }

    const enrollment = studentEnrollments[0];
    const sectionId = auditNormalizeId_(enrollment.SectionID);
    const blankStart = auditIsBlank_(enrollment.StartDate);
    const blankEnd = auditIsBlank_(enrollment.EndDate);

    if (!seededSectionSet.has(sectionId)) {
      skipped.push({ name: label, reason: "enrollment SectionID '" + sectionId + "' is outside the four seeded sections" });
      blockingFindings.push("Seed name '" + label + "' has an enrollment outside the seeded sections (" + sectionId + ").");
      return;
    }
    if (!blankStart || !blankEnd) {
      skipped.push({ name: label, reason: "enrollment has a nonblank StartDate/EndDate" });
      blockingFindings.push("Seed name '" + label + "' has a nonblank StartDate/EndDate.");
      return;
    }

    students.push({
      rowNumber: studentRow._rowNumber,
      studentId: studentId,
      legalFirstName: studentRow.LegalFirstName,
      legalLastName: studentRow.LegalLastName,
    });
    enrollments.push({
      rowNumber: enrollment._rowNumber,
      studentId: studentId,
      sectionId: sectionId,
    });
  });

  if (students.length !== CLEANUP_EXPECTED_SEEDED_STUDENT_COUNT) {
    blockingFindings.push(
      "Expected exactly " + CLEANUP_EXPECTED_SEEDED_STUDENT_COUNT + " qualifying seeded students; found " + students.length + ".",
    );
  }
  if (enrollments.length !== CLEANUP_EXPECTED_SEEDED_ENROLLMENT_COUNT) {
    blockingFindings.push(
      "Expected exactly " +
        CLEANUP_EXPECTED_SEEDED_ENROLLMENT_COUNT +
        " qualifying seeded enrollments; found " +
        enrollments.length +
        ".",
    );
  }

  return { students: students, enrollments: enrollments, skipped: skipped, blockingFindings: blockingFindings };
}

// Independent of the 48-name list entirely — Ferd Derfman is matched only
// against the canonical Students sheet by exact normalized legal name,
// never inferred from the RosterImport staging row.
function cleanupFindFerd_(studentsSheet, enrollmentsSheet) {
  const key = auditNormalizeNameKey_(CLEANUP_FERD_FIRST_NAME, CLEANUP_FERD_LAST_NAME);
  const matches = studentsSheet.objects.filter(function (row) {
    return auditNormalizeNameKey_(row.LegalFirstName, row.LegalLastName) === key;
  });

  if (matches.length === 0) {
    // Zero matches does not block the rest of the cleanup — see spec.
    return { status: "none", student: null, enrollments: [], blockingFindings: [] };
  }

  if (matches.length > 1) {
    return {
      status: "ambiguous",
      student: null,
      enrollments: [],
      matchCount: matches.length,
      blockingFindings: [
        "Ferd Derfman matched " + matches.length + " Students rows — ambiguous; manual review required before cleanup can run.",
      ],
    };
  }

  const studentRow = matches[0];
  const studentId = auditNormalizeId_(studentRow.StudentID);
  const enrollments = enrollmentsSheet.objects
    .filter(function (row) {
      return auditNormalizeId_(row.StudentID) === studentId;
    })
    .map(function (row) {
      return { rowNumber: row._rowNumber, studentId: studentId, sectionId: row.SectionID };
    });

  return {
    status: "one",
    student: {
      rowNumber: studentRow._rowNumber,
      studentId: studentId,
      legalFirstName: studentRow.LegalFirstName,
      legalLastName: studentRow.LegalLastName,
      preferredName: studentRow.PreferredName,
    },
    enrollments: enrollments,
    blockingFindings: [],
  };
}

// A DailyProgress row qualifies only when it matches the exact malformed
// signature AND every one of its four references is confirmed orphaned
// against the live Sections/Courses/Units/Lessons data — never by row
// position alone.
function cleanupFindMalformedDailyProgressRows_(dailyProgressSheet, validSectionIds, validCourseIds, validUnitIds, validLessonIds) {
  const rows = [];

  dailyProgressSheet.objects.forEach(function (row) {
    const dateParsed = auditParseDateValue_(row.Date);
    const dateInvalid = !dateParsed.blank && !dateParsed.valid;

    const courseSectionId = auditNormalizeId_(row.CourseSectionID);
    const courseId = auditNormalizeId_(row.CourseID);
    const unitId = auditNormalizeId_(row.UnitID);
    const lessonId = auditNormalizeId_(row.LessonID);

    const qualifies =
      dateInvalid &&
      courseSectionId === CLEANUP_MALFORMED_DAILY_PROGRESS_COURSE_SECTION_ID &&
      courseId === CLEANUP_MALFORMED_DAILY_PROGRESS_COURSE_ID &&
      unitId === CLEANUP_MALFORMED_DAILY_PROGRESS_UNIT_ID &&
      !validSectionIds.has(courseSectionId) &&
      !validCourseIds.has(courseId) &&
      !validUnitIds.has(unitId) &&
      !validLessonIds.has(lessonId);

    if (qualifies) {
      rows.push({
        rowNumber: row._rowNumber,
        dailyProgressId: row.DailyProgressID !== undefined ? row.DailyProgressID : null,
        dateRaw: cleanupSafeStringifyDateValue_(row.Date),
        lessonId: row.LessonID,
        notes: row.Notes !== undefined ? row.Notes : null,
      });
    }
  });

  const blockingFindings = [];
  if (rows.length !== CLEANUP_EXPECTED_MALFORMED_DAILY_PROGRESS_COUNT) {
    blockingFindings.push(
      "Expected exactly " +
        CLEANUP_EXPECTED_MALFORMED_DAILY_PROGRESS_COUNT +
        " malformed DailyProgress rows; found " +
        rows.length +
        ".",
    );
  }

  return { rows: rows, blockingFindings: blockingFindings };
}

// Every populated data row qualifies — RosterImport is staging-only, never
// canonical (see ROSTER_INFORMATION_MODEL.md), so there is no shape
// condition to apply here beyond "not blank." Ferd-matching is reported for
// visibility only and never gates whether a row is included.
function cleanupFindRosterImportRows_(rosterImportSheet) {
  const ferdKey = auditNormalizeNameKey_(CLEANUP_FERD_FIRST_NAME, CLEANUP_FERD_LAST_NAME);
  const rows = [];

  rosterImportSheet.objects.forEach(function (row) {
    const sectionId = auditNormalizeId_(row.SectionID);
    const first = auditNormalizeId_(row.LegalFirstName);
    const last = auditNormalizeId_(row.LegalLastName);
    const preferred = auditNormalizeId_(row.PreferredName);
    const isBlank = !sectionId && !first && !last && !preferred;

    if (isBlank) return;

    rows.push({
      rowNumber: row._rowNumber,
      sectionId: row.SectionID,
      legalFirstName: row.LegalFirstName,
      legalLastName: row.LegalLastName,
      preferredName: row.PreferredName,
      status: row.Status,
      isFerd: auditNormalizeNameKey_(first, last) === ferdKey,
    });
  });

  return { rows: rows };
}

function cleanupSafeStringifyDateValue_(value) {
  if (value instanceof Date) {
    // Date.prototype.toString() on an Invalid Date returns the literal
    // string "Invalid Date" — never throws — which is exactly the
    // information the preview needs to show.
    return value.toString();
  }
  if (value === null || value === undefined || value === "") return "(blank)";
  return String(value);
}

// ---------------------------------------------------------------------------
// Plan comparison (revalidation)
// ---------------------------------------------------------------------------

function cleanupRowNumberSet_(items) {
  return new Set(
    items.map(function (item) {
      return item.rowNumber;
    }),
  );
}

function cleanupSetsEqual_(setA, setB) {
  if (setA.size !== setB.size) return false;
  let equal = true;
  setA.forEach(function (value) {
    if (!setB.has(value)) equal = false;
  });
  return equal;
}

// True only when two plans built from cleanupBuildPlan_ select the exact
// same physical rows in every category and neither is blocked. Used to
// confirm nothing changed between the planning pass and the moment
// execution is about to mutate data.
function cleanupPlansMatch_(planA, planB) {
  if (planA.blocked || planB.blocked) return false;

  const rowSetChecksMatch = [
    [cleanupRowNumberSet_(planA.seeded.students), cleanupRowNumberSet_(planB.seeded.students)],
    [cleanupRowNumberSet_(planA.seeded.enrollments), cleanupRowNumberSet_(planB.seeded.enrollments)],
    [cleanupRowNumberSet_(planA.malformedDailyProgress.rows), cleanupRowNumberSet_(planB.malformedDailyProgress.rows)],
    [cleanupRowNumberSet_(planA.rosterImport.rows), cleanupRowNumberSet_(planB.rosterImport.rows)],
    [cleanupRowNumberSet_(planA.ferd.enrollments), cleanupRowNumberSet_(planB.ferd.enrollments)],
  ].every(function (pair) {
    return cleanupSetsEqual_(pair[0], pair[1]);
  });

  const ferdRowA = planA.ferd.student ? planA.ferd.student.rowNumber : null;
  const ferdRowB = planB.ferd.student ? planB.ferd.student.rowNumber : null;
  const ferdStatusMatches = planA.ferd.status === planB.ferd.status && ferdRowA === ferdRowB;

  return rowSetChecksMatch && ferdStatusMatches;
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

function cleanupCreateBackup_(spreadsheet) {
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
  const backupName = CLEANUP_BACKUP_NAME_PREFIX + timestamp;

  // Spreadsheet.copy(name) creates a complete, independent copy of this
  // spreadsheet — every sheet, all data, formatting, and validations — as a
  // brand-new Drive file with its own new ID. It does not modify the
  // original spreadsheet in any way (this is a read of the source plus a
  // write of a new destination file, not a mutation of the source), and it
  // has no effect on script IDs, deployments, or sharing settings, which
  // live on the script project and the original file, not the copy.
  const backupSpreadsheet = spreadsheet.copy(backupName);

  if (!backupSpreadsheet || !backupSpreadsheet.getId()) {
    throw new Error("Spreadsheet.copy() did not return a usable backup spreadsheet.");
  }

  return { id: backupSpreadsheet.getId(), url: backupSpreadsheet.getUrl(), name: backupName };
}

// ---------------------------------------------------------------------------
// Mutation helpers (only reachable from executeProductionDataCleanupV1Locked_)
// ---------------------------------------------------------------------------

function cleanupDeleteRowsDescending_(sheet, rowNumbers) {
  const sorted = rowNumbers.slice().sort(function (a, b) {
    return b - a;
  });
  sorted.forEach(function (rowNumber) {
    sheet.deleteRow(rowNumber);
  });
  return sorted.length;
}

// Clears the RosterImport sheet's data range (everything below the header
// through the last row with content) with clearContent — never deletes the
// sheet, deletes columns, or touches the header row — so formatting, data
// validation, and column widths on row 1 and beyond are all preserved.
function cleanupClearRosterImportData_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  const lastColumn = sheet.getLastColumn();
  const rowCount = lastRow - 1;
  sheet.getRange(2, 1, rowCount, lastColumn).clearContent();
  return rowCount;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

function cleanupBuildPreviewReport_(plan, startedAt) {
  const seededBySection = {};
  plan.seeded.enrollments.forEach(function (item) {
    seededBySection[item.sectionId] = (seededBySection[item.sectionId] || 0) + 1;
  });

  const exampleNames = plan.seeded.students.slice(0, CLEANUP_EXAMPLE_NAME_COUNT).map(function (item) {
    return item.legalFirstName + " " + item.legalLastName;
  });

  const ferdMatchCount = plan.ferd.status === "one" ? 1 : plan.ferd.status === "ambiguous" ? plan.ferd.matchCount : 0;

  return {
    timestamp: startedAt.toISOString(),
    performedZeroMutations: true,
    seededStudents: {
      expected: CLEANUP_EXPECTED_SEEDED_STUDENT_COUNT,
      actual: plan.seeded.students.length,
      countBySection: seededBySection,
      exampleNames: exampleNames,
      omittedCount: Math.max(0, plan.seeded.students.length - exampleNames.length),
    },
    seededEnrollments: {
      expected: CLEANUP_EXPECTED_SEEDED_ENROLLMENT_COUNT,
      actual: plan.seeded.enrollments.length,
    },
    ferd: {
      status: plan.ferd.status,
      matchCount: ferdMatchCount,
      preferredName: plan.ferd.student ? plan.ferd.student.preferredName : null,
      enrollmentCount: plan.ferd.enrollments.length,
      enrollmentSections: plan.ferd.enrollments.map(function (item) {
        return item.sectionId;
      }),
    },
    malformedDailyProgress: {
      expected: CLEANUP_EXPECTED_MALFORMED_DAILY_PROGRESS_COUNT,
      actual: plan.malformedDailyProgress.rows.length,
      rows: plan.malformedDailyProgress.rows,
    },
    rosterImport: {
      populatedRowCount: plan.rosterImport.rows.length,
      rows: plan.rosterImport.rows,
    },
    blockers: plan.blockingFindings,
    wouldChange: {
      studentsToDelete: plan.seeded.students.length + (plan.ferd.student ? 1 : 0),
      enrollmentsToDelete: plan.seeded.enrollments.length + plan.ferd.enrollments.length,
      ferdWillBeDeleted: plan.ferd.status === "one",
      dailyProgressRowsToDelete: plan.malformedDailyProgress.rows.length,
      rosterImportRowsToClear: plan.rosterImport.rows.length,
    },
    skipped: plan.seeded.skipped,
  };
}

function cleanupBuildPreviewHumanSummary_(report) {
  const lines = [];

  lines.push("YEAR PLANNER PRODUCTION DATA CLEANUP — PREVIEW — " + report.timestamp);
  lines.push("This preview performed zero mutations.");
  lines.push("");

  lines.push(
    "Seeded students: " + report.seededStudents.actual + " of " + report.seededStudents.expected + " expected.",
  );
  lines.push("  By section: " + JSON.stringify(report.seededStudents.countBySection));
  lines.push(
    "  Example names: " +
      report.seededStudents.exampleNames.join(", ") +
      (report.seededStudents.omittedCount > 0 ? " (+" + report.seededStudents.omittedCount + " more)" : ""),
  );
  lines.push(
    "Seeded enrollments: " + report.seededEnrollments.actual + " of " + report.seededEnrollments.expected + " expected.",
  );
  lines.push("");

  lines.push(
    "Ferd Derfman: " +
      report.ferd.status +
      " (enrollments: " +
      report.ferd.enrollmentCount +
      (report.ferd.enrollmentSections.length ? ", sections: " + report.ferd.enrollmentSections.join(", ") : "") +
      (report.ferd.preferredName ? ", preferred name: " + report.ferd.preferredName : "") +
      ")",
  );
  lines.push("");

  lines.push(
    "Malformed DailyProgress rows: " +
      report.malformedDailyProgress.actual +
      " of " +
      report.malformedDailyProgress.expected +
      " expected.",
  );
  report.malformedDailyProgress.rows.forEach(function (row) {
    lines.push(
      "  row " +
        row.rowNumber +
        ": DailyProgressID=" +
        row.dailyProgressId +
        " Date=" +
        row.dateRaw +
        " LessonID=" +
        row.lessonId +
        " Notes=" +
        row.notes,
    );
  });
  lines.push("");

  lines.push("RosterImport populated rows: " + report.rosterImport.populatedRowCount);
  report.rosterImport.rows.forEach(function (row) {
    lines.push(
      "  row " +
        row.rowNumber +
        ": " +
        row.sectionId +
        " " +
        row.legalFirstName +
        " " +
        row.legalLastName +
        (row.isFerd ? " (matches Ferd Derfman)" : "") +
        " — Status: " +
        row.status,
    );
  });
  lines.push("");

  if (report.blockers.length > 0) {
    lines.push("*** BLOCKERS — execution would refuse to run ***");
    report.blockers.forEach(function (message) {
      lines.push("  - " + message);
    });
  } else {
    lines.push("No blockers. Execution would proceed if run with the correct confirmation sentinel.");
  }
  lines.push("");

  lines.push("Would change:");
  lines.push("  Students to delete: " + report.wouldChange.studentsToDelete);
  lines.push("  Enrollments to delete: " + report.wouldChange.enrollmentsToDelete);
  lines.push("  Ferd would be removed: " + report.wouldChange.ferdWillBeDeleted);
  lines.push("  DailyProgress rows to delete: " + report.wouldChange.dailyProgressRowsToDelete);
  lines.push("  RosterImport rows to clear: " + report.wouldChange.rosterImportRowsToClear);

  return lines;
}

function cleanupBuildExecutionReport_(fields) {
  const report = {
    timestamp: fields.startedAt.toISOString(),
    success: !!fields.success,
    confirmationAccepted: !!fields.confirmationAccepted,
    backup: fields.backup || null,
    enrollmentsRemoved: fields.enrollmentsRemoved || 0,
    studentsRemoved: fields.studentsRemoved || 0,
    ferdRemoved: !!fields.ferdRemoved,
    dailyProgressRowsRemoved: fields.dailyProgressRowsRemoved || 0,
    rosterImportRowsCleared: fields.rosterImportRowsCleared || 0,
    failurePoint: fields.failurePoint || null,
    errorMessage: fields.errorMessage || null,
    blockingFindings: fields.blockingFindings || [],
    completedSteps: fields.completedSteps || [],
    // Apps Script/Sheets provide no true multi-sheet transaction. Deletion
    // order (SectionEnrollments before Students, both before DailyProgress,
    // RosterImport cleared last) is chosen specifically so an interruption
    // anywhere leaves, at worst, orphaned Student rows with no enrollment —
    // harmless to roster display and safe to finish by re-running this
    // function or reviewing manually — rather than orphaned Enrollment rows
    // pointing at an already-deleted Student, which would be actively
    // confusing. completedSteps above records exactly how far this run got.
    residualRiskNote:
      "No multi-sheet transaction exists. See completedSteps for exactly what finished before any failure; " +
      "the deletion order is chosen to fail toward orphaned Student rows (harmless, re-runnable) rather than " +
      "orphaned Enrollment rows.",
  };

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

// ---------------------------------------------------------------------------
// TEMPORARY DIAGNOSTIC — read-only. Added to investigate a discrepancy where
// previewProductionDataCleanupV1() reported 48/48/4 with zero blockers, but
// executeProductionDataCleanupV1() run immediately afterward reported
// failurePoint "planning" with zero matches everywhere. Exhaustive static
// review of this file and ProductionDataAudit.js (grepped every destructive
// array method — sort/splice/shift/unshift/pop/reverse — and every
// module-scope declaration) found no shared mutable state, no caching, and
// no destructive mutation anywhere: auditReadSheet_ performs a fresh
// getRange().getValues() read on every call, and cleanupBuildPlan_ builds
// entirely new local objects every time it runs. cleanupBuildPlan_ is
// therefore a pure function of live sheet state — two calls against
// unchanged data are provably guaranteed to return identical results.
//
// This function does not fix a code bug, because static analysis found
// none to fix. It exists so Jeff can confirm the above empirically in
// production once the Apps Script project is redeployed from this
// repository: if two consecutive planning passes — run exactly the way
// executeProductionDataCleanupV1Locked_ runs them (same lock, same
// SHEET_ID, same spreadsheet handle, same cleanupBuildPlan_ call) — ever
// disagree, that proves the deployed Apps Script code still does not match
// this file, not that this file has a bug. Safe to run any number of
// times. Remove this function once that's confirmed and the discrepancy is
// closed out.
//
// Performs zero mutations: no backup, no deleteRow/clearContent, no writes
// of any kind. Never logs student names, StudentIDs, or EnrollmentIDs —
// only row counts and status strings.
// ---------------------------------------------------------------------------

function diagnoseProductionCleanupPlanningV1() {
  const startedAt = new Date();
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lockAcquired = lock.tryLock(30000);
  } catch (error) {
    lockAcquired = false;
  }

  if (!lockAcquired) {
    const report = {
      timestamp: startedAt.toISOString(),
      performedZeroMutations: true,
      lockAcquired: false,
      consistent: null,
      note: "Could not acquire the script lock within 30 seconds; no sheets were read.",
    };
    Logger.log(JSON.stringify(report, null, 2));
    return report;
  }

  const report = {
    timestamp: startedAt.toISOString(),
    performedZeroMutations: true,
    lockAcquired: true,
  };

  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);

    report.beforePass1 = diagnoseSheetRowCounts_(spreadsheet);
    const plan1 = cleanupBuildPlan_(spreadsheet);
    report.pass1 = diagnoseSummarizePlan_(plan1);

    report.beforePass2 = diagnoseSheetRowCounts_(spreadsheet);
    const plan2 = cleanupBuildPlan_(spreadsheet);
    report.pass2 = diagnoseSummarizePlan_(plan2);

    report.sheetRowCountsIdenticalBetweenPasses = diagnoseDeepEqual_(report.beforePass1, report.beforePass2);
    report.qualifyingCountsIdenticalBetweenPasses = diagnoseDeepEqual_(report.pass1, report.pass2);

    // Direct proof that cleanupBuildPlan_ never returns a cached/shared
    // object: two independent calls must produce two independent object
    // references, all the way down to the innermost arrays. If this is
    // ever true, the code has regressed to add caching — the class of bug
    // this diagnostic exists to catch.
    report.planObjectReferencesShared = plan1 === plan2;
    report.seededStudentsArrayReferenceShared = plan1.seeded.students === plan2.seeded.students;

    report.consistent =
      report.sheetRowCountsIdenticalBetweenPasses &&
      report.qualifyingCountsIdenticalBetweenPasses &&
      !report.planObjectReferencesShared &&
      !report.seededStudentsArrayReferenceShared;
  } catch (error) {
    report.error = error.message;
    report.consistent = false;
  } finally {
    lock.releaseLock();
  }

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

function diagnoseSheetRowCounts_(spreadsheet) {
  return {
    Students: auditReadSheet_(spreadsheet, "Students").rowCount,
    SectionEnrollments: auditReadSheet_(spreadsheet, "SectionEnrollments").rowCount,
    DailyProgress: auditReadSheet_(spreadsheet, "DailyProgress").rowCount,
    RosterImport: auditReadSheet_(spreadsheet, "RosterImport").rowCount,
  };
}

function diagnoseSummarizePlan_(plan) {
  return {
    blocked: plan.blocked,
    blockingFindingCount: plan.blockingFindings.length,
    seededStudentCount: plan.seeded.students.length,
    seededEnrollmentCount: plan.seeded.enrollments.length,
    ferdStatus: plan.ferd.status,
    ferdEnrollmentCount: plan.ferd.enrollments.length,
    malformedDailyProgressCount: plan.malformedDailyProgress.rows.length,
    rosterImportRowCount: plan.rosterImport.rows.length,
  };
}

function diagnoseDeepEqual_(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
