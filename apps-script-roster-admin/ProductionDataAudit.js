// Read-only production data audit for the shared Year Planner spreadsheet.
//
// Administrative, teacher-triggered tool: run auditProductionDataV1() directly
// from the Apps Script editor's Run button while signed into the district
// account. There is no doGet/doPost route and no frontend integration — this
// file is never reachable from the deployed web apps.
//
// Every function in this file performs SpreadsheetApp reads only
// (getSheets/getName/getLastRow/getLastColumn/getRange().getValues()) plus
// pure JavaScript aggregation. Nothing here calls setValue, setValues,
// appendRow, deleteRow, deleteRows, clear, clearContent, insertSheet, copy,
// moveTo, or any other mutating Spreadsheet/Drive method — see the
// Validation section of the PR description for the line-by-line check.
//
// SHEET_ID, ROSTER_SCHEMAS, and isActiveRosterValue_ are defined in Code.js
// and reused here (same Apps Script project, shared global namespace).

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AUDIT_EXPECTED_SHEET_NAMES = [
  "Settings",
  "Courses",
  "Sections",
  "Units",
  "Lessons",
  "DailyProgress",
  "SchoolCalendar",
  "SchedulePatterns",
  "Students",
  "SectionEnrollments",
  "RosterSettings",
  "RosterImport",
  "YearPlan",
];

// Sheets the dependency-check and integrity-check sections below cannot
// meaningfully evaluate without. Missing one of these produces a clear,
// itemized critical finding (see auditBuildReport_) rather than an
// uncaught exception — the rest of the audit still runs and returns.
// Settings, SchoolCalendar, SchedulePatterns, RosterImport, and YearPlan are
// deliberately excluded: the task's own report structure treats those as
// "does it exist" questions, not hard requirements.
const AUDIT_REQUIRED_SHEET_NAMES = [
  "Courses",
  "Sections",
  "Units",
  "Lessons",
  "DailyProgress",
  "Students",
  "SectionEnrollments",
  "RosterSettings",
];

const AUDIT_SEEDED_SECTION_IDS = ["M8-P2", "M8-P3", "IM1-P5", "IM1-P6"];

// Caps curriculumReview.units/lessons.items — see auditReferenceCountMap_
// and auditBuildUnitsReview_/auditBuildLessonsReview_. Generous for any
// realistic single-teacher, two-course curriculum; exists only to bound
// worst-case JSON/Logger output size against a corrupted or runaway sheet.
const AUDIT_MAX_CURRICULUM_ITEMS = 300;

// Exact fictional-roster seed list, copied from setupRosterSheetsV1Locked_ in
// apps-script-planning/Code.js — a separate Apps Script project, so this
// cannot be imported; it is duplicated here on purpose. Only first/last name
// are needed for name-key matching (see auditNormalizeNameKey_). Keep this in
// sync if the seeder's list ever changes.
const AUDIT_FICTIONAL_STUDENT_NAMES = [
  ["Avery", "Bennett"],
  ["Jordan", "Calder"],
  ["Mina", "Delgado"],
  ["Theo", "Ellison"],
  ["Nora", "Farrell"],
  ["Elias", "Gupta"],
  ["Sofia", "Hollis"],
  ["Marcus", "Ibarra"],
  ["Leila", "Jensen"],
  ["Dante", "Kim"],
  ["Ruby", "Lawson"],
  ["Owen", "Mendoza"],
  ["Camila", "Navarro"],
  ["Felix", "Okafor"],
  ["Priya", "Patel"],
  ["Quentin", "Reyes"],
  ["Amara", "Sato"],
  ["Jonah", "Turner"],
  ["Iris", "Usman"],
  ["Miles", "Vega"],
  ["Elena", "Wolfe"],
  ["Zane", "Xu"],
  ["Maeve", "Young"],
  ["Caleb", "Zamora"],
  ["Talia", "Archer"],
  ["Ronan", "Brooks"],
  ["Keira", "Chandra"],
  ["Desmond", "Doyle"],
  ["Freya", "Espinoza"],
  ["Gavin", "Foster"],
  ["Hana", "Griffin"],
  ["Isaac", "Huang"],
  ["Jade", "Ingram"],
  ["Kai", "Jefferson"],
  ["Lucia", "Kaur"],
  ["Noel", "Lang"],
  ["Orla", "Mercer"],
  ["Parker", "Nolan"],
  ["Reina", "Owens"],
  ["Silas", "Price"],
  ["Uma", "Quintero"],
  ["Victor", "Russell"],
  ["Willa", "Shah"],
  ["Xavier", "Tran"],
  ["Yara", "Underwood"],
  ["Beckett", "Valdez"],
  ["Cleo", "Ward"],
  ["Darius", "Yoon"],
];

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

// Safe to run any number of times: every operation below is a read.
//
// Lock scope, precisely: LockService.getScriptLock() is per-Apps-Script-
// *project* mutual exclusion, not per-spreadsheet. It only prevents overlap
// with other functions in *this* project that also take the script lock —
// today that's setupRosterImportSheetV1/importRosterFromStaging in
// RosterImport.js. It does NOT prevent overlap with apps-script-planning
// (a separate Apps Script project with its own separate lock domain —
// saveDailyProgress/addLesson/deleteLesson/setupRosterSheetsV1 there take no
// lock shared with this one), and it does NOT block manual edits made
// directly in the Sheets UI. Taken here purely so a run doesn't read a
// half-written state if it happens to overlap a real roster import — never
// to protect a write of its own, since this function makes none. If the
// lock is already held, the audit waits up to 5s, then proceeds anyway
// rather than hanging; meta.lockAcquired records which happened. Holding it
// here blocks importRosterFromStaging's own 30s tryLock for at most the few
// seconds this audit's reads take — not a meaningful disruption to normal
// roster operations.
function auditProductionDataV1() {
  const startedAt = new Date();
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    lockAcquired = lock.tryLock(5000);
  } catch (error) {
    lockAcquired = false;
  }

  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const report = auditBuildReport_(spreadsheet, startedAt, lockAcquired);
    const humanReadable = auditBuildHumanReadableSummary_(report);

    Logger.log(humanReadable.join("\n"));
    Logger.log("\n----- STRUCTURED REPORT (JSON) -----\n");
    Logger.log(JSON.stringify(report, null, 2));

    return report;
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

function auditBuildReport_(spreadsheet, startedAt, lockAcquired) {
  const presentSheetNames = spreadsheet.getSheets().map(function (sheet) {
    return sheet.getName();
  });

  const missingExpectedSheetNames = AUDIT_EXPECTED_SHEET_NAMES.filter(function (name) {
    return presentSheetNames.indexOf(name) === -1;
  });
  const unexpectedSheetNames = presentSheetNames.filter(function (name) {
    return AUDIT_EXPECTED_SHEET_NAMES.indexOf(name) === -1;
  });

  const sheets = {};
  AUDIT_EXPECTED_SHEET_NAMES.forEach(function (name) {
    try {
      sheets[name] = auditReadSheet_(spreadsheet, name);
    } catch (error) {
      sheets[name] = { present: false, name: name, error: error.message };
    }
  });

  const additionalSheetsDetail = unexpectedSheetNames.map(function (name) {
    try {
      const result = auditReadSheet_(spreadsheet, name);
      return { name: name, rowCount: result.rowCount, headers: result.headers };
    } catch (error) {
      return { name: name, error: error.message };
    }
  });

  const criticalFindings = AUDIT_REQUIRED_SHEET_NAMES
    .filter(function (name) {
      return !sheets[name].present;
    })
    .map(function (name) {
      const detail = sheets[name].error
        ? "could not be read (" + sheets[name].error + ")"
        : "was not found";
      return "Required sheet '" + name + "' " + detail + ". Checks depending on it were skipped.";
    });

  // --- Dependency checks -----------------------------------------------
  const validCourseIds = sheets.Courses.present ? auditBuildIdSet_(sheets.Courses.objects, "CourseID") : new Set();
  const validSectionIds = sheets.Sections.present ? auditBuildIdSet_(sheets.Sections.objects, "SectionID") : new Set();
  const validUnitIds = sheets.Units.present ? auditBuildIdSet_(sheets.Units.objects, "UnitID") : new Set();
  const validLessonIds = sheets.Lessons.present ? auditBuildIdSet_(sheets.Lessons.objects, "LessonID") : new Set();
  const validStudentIds = sheets.Students.present ? auditBuildIdSet_(sheets.Students.objects, "StudentID") : new Set();

  const fk = function (sourceSheet, sourceField, validIdSet, targetSheetName, targetPresent) {
    if (!sourceSheet.present) {
      return { checked: false, reason: "Source sheet missing." };
    }
    return auditEvaluateForeignKey_(
      sourceSheet.objects,
      sourceField,
      sourceSheet.headers,
      validIdSet,
      targetSheetName,
      targetPresent,
    );
  };

  const dependencyChecks = {
    sectionsCourseId: fk(sheets.Sections, "CourseID", validCourseIds, "Courses", sheets.Courses.present),
    unitsCourseId: fk(sheets.Units, "CourseID", validCourseIds, "Courses", sheets.Courses.present),
    lessonsCourseId: fk(sheets.Lessons, "CourseID", validCourseIds, "Courses", sheets.Courses.present),
    lessonsUnitId: fk(sheets.Lessons, "UnitID", validUnitIds, "Units", sheets.Units.present),
    dailyProgressCourseSectionId: fk(
      sheets.DailyProgress,
      "CourseSectionID",
      validSectionIds,
      "Sections",
      sheets.Sections.present,
    ),
    dailyProgressCourseId: fk(sheets.DailyProgress, "CourseID", validCourseIds, "Courses", sheets.Courses.present),
    dailyProgressUnitId: fk(sheets.DailyProgress, "UnitID", validUnitIds, "Units", sheets.Units.present),
    dailyProgressLessonId: fk(sheets.DailyProgress, "LessonID", validLessonIds, "Lessons", sheets.Lessons.present),
    sectionEnrollmentsSectionId: fk(
      sheets.SectionEnrollments,
      "SectionID",
      validSectionIds,
      "Sections",
      sheets.Sections.present,
    ),
    sectionEnrollmentsStudentId: fk(
      sheets.SectionEnrollments,
      "StudentID",
      validStudentIds,
      "Students",
      sheets.Students.present,
    ),
    rosterSettingsSectionId: fk(
      sheets.RosterSettings,
      "SectionID",
      validSectionIds,
      "Sections",
      sheets.Sections.present,
    ),
  };

  // --- Per-sheet summaries ------------------------------------------------
  const sheetSummaries = {
    Settings: auditBuildSheetSummary_(sheets.Settings, null, [], {}),
    Courses: auditBuildSheetSummary_(
      sheets.Courses,
      "CourseID",
      [],
      sheets.Courses.present
        ? {
            courseIds: auditDistinctValues_(sheets.Courses.objects, "CourseID", sheets.Courses.headers, 50),
            activeSummary: auditCountByActive_(sheets.Courses.objects, "Active", sheets.Courses.headers),
          }
        : {},
    ),
    Sections: auditBuildSheetSummary_(
      sheets.Sections,
      "SectionID",
      [dependencyChecks.sectionsCourseId],
      sheets.Sections.present
        ? {
            sectionIds: auditDistinctValues_(sheets.Sections.objects, "SectionID", sheets.Sections.headers, 50),
            activeSummary: auditCountSectionsActive_(sheets.Sections.objects, sheets.Sections.headers),
            blockGroups: auditDistinctValues_(sheets.Sections.objects, "BlockGroup", sheets.Sections.headers, 50),
          }
        : {},
    ),
    Units: auditBuildSheetSummary_(
      sheets.Units,
      "UnitID",
      [dependencyChecks.unitsCourseId],
      sheets.Units.present
        ? { unitCountByCourseId: auditCountByField_(sheets.Units.objects, "CourseID", sheets.Units.headers) }
        : {},
    ),
    Lessons: auditBuildSheetSummary_(
      sheets.Lessons,
      "LessonID",
      [dependencyChecks.lessonsCourseId, dependencyChecks.lessonsUnitId],
      sheets.Lessons.present
        ? { lessonCountByCourseId: auditCountByField_(sheets.Lessons.objects, "CourseID", sheets.Lessons.headers) }
        : {},
    ),
    DailyProgress: auditBuildSheetSummary_(
      sheets.DailyProgress,
      "DailyProgressID",
      [
        dependencyChecks.dailyProgressCourseSectionId,
        dependencyChecks.dailyProgressCourseId,
        dependencyChecks.dailyProgressUnitId,
        dependencyChecks.dailyProgressLessonId,
      ],
      {},
    ),
    // SchoolCalendar/SchedulePatterns get no generic primaryId check here —
    // their proper normalized-date/day-of-week duplicate checks live in
    // configuration.schoolCalendar / configuration.schedulePatterns below,
    // where dates are compared by formatted day key rather than raw
    // stringified Date objects.
    SchoolCalendar: auditBuildSheetSummary_(sheets.SchoolCalendar, null, [], {}),
    SchedulePatterns: auditBuildSheetSummary_(sheets.SchedulePatterns, null, [], {}),
    Students: auditBuildSheetSummary_(
      sheets.Students,
      "StudentID",
      [],
      sheets.Students.present
        ? { activeSummary: auditCountByActive_(sheets.Students.objects, "Active", sheets.Students.headers) }
        : {},
    ),
    SectionEnrollments: auditBuildSheetSummary_(
      sheets.SectionEnrollments,
      "EnrollmentID",
      [dependencyChecks.sectionEnrollmentsSectionId, dependencyChecks.sectionEnrollmentsStudentId],
      sheets.SectionEnrollments.present
        ? {
            activeSummary: auditCountByActive_(
              sheets.SectionEnrollments.objects,
              "Active",
              sheets.SectionEnrollments.headers,
            ),
          }
        : {},
    ),
    RosterSettings: auditBuildSheetSummary_(
      sheets.RosterSettings,
      "SectionID",
      [dependencyChecks.rosterSettingsSectionId],
      sheets.RosterSettings.present
        ? {
            sectionIds: auditDistinctValues_(
              sheets.RosterSettings.objects,
              "SectionID",
              sheets.RosterSettings.headers,
              50,
            ),
          }
        : {},
    ),
    RosterImport: auditBuildSheetSummary_(sheets.RosterImport, null, [], {}),
    YearPlan: auditBuildSheetSummary_(sheets.YearPlan, null, [], {}),
  };

  return {
    meta: {
      spreadsheetName: spreadsheet.getName(),
      spreadsheetId: SHEET_ID,
      timestamp: startedAt.toISOString(),
      lockAcquired: lockAcquired,
      sheetNamesPresent: presentSheetNames,
      unexpectedSheetNames: unexpectedSheetNames,
      missingExpectedSheetNames: missingExpectedSheetNames,
      additionalSheetsDetail: additionalSheetsDetail,
      criticalFindings: criticalFindings,
    },
    sheets: sheetSummaries,
    dependencyChecks: dependencyChecks,
    fictionalRosterDetection: auditBuildFictionalRosterReport_(sheets.Students, sheets.SectionEnrollments),
    dailyProgress: auditBuildDailyProgressChecks_(sheets.DailyProgress, dependencyChecks),
    curriculumReview: {
      units: auditBuildUnitsReview_(sheets.Units, sheets.Lessons, sheets.DailyProgress),
      lessons: auditBuildLessonsReview_(sheets.Lessons, sheets.DailyProgress),
    },
    configuration: {
      schoolCalendar: auditBuildSchoolCalendarChecks_(sheets.SchoolCalendar),
      schedulePatterns: auditBuildSchedulePatternsChecks_(sheets.SchedulePatterns, sheets.Sections),
      settings: auditBuildGenericConfigSummary_(sheets.Settings),
      yearPlan: auditBuildGenericConfigSummary_(sheets.YearPlan),
      rosterImport: auditBuildRosterImportChecks_(sheets.RosterImport),
    },
  };
}

// ---------------------------------------------------------------------------
// Sheet reading (read-only)
// ---------------------------------------------------------------------------

function auditReadSheet_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    return { present: false, name: sheetName };
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow === 0 || lastColumn === 0) {
    return {
      present: true,
      name: sheetName,
      headers: [],
      rawRows: [],
      objects: [],
      rowCount: 0,
      duplicateHeaders: [],
    };
  }

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(function (header) {
    return String(header);
  });
  const rawRows = values.slice(1);
  const objects = auditRowsToObjects_(headers, rawRows);

  return {
    present: true,
    name: sheetName,
    headers: headers,
    rawRows: rawRows,
    objects: objects,
    rowCount: objects.length,
    duplicateHeaders: auditFindDuplicateHeaders_(headers),
  };
}

// Two columns sharing a header name silently collapse into one object key
// in auditRowsToObjects_ (the later column always overwrites the earlier
// one) — every field-based check downstream (primary IDs, foreign keys,
// content indicators) becomes unreliable for the shadowed column. Surfaced
// explicitly rather than left to manifest as an unexplained wrong value
// somewhere else in the report.
function auditFindDuplicateHeaders_(headers) {
  const counts = {};
  headers.forEach(function (header) {
    counts[header] = (counts[header] || 0) + 1;
  });
  return Object.keys(counts).filter(function (header) {
    return counts[header] > 1;
  });
}

// _rowNumber is the physical sheet row (header is row 1, so the first data
// row is 2) — kept on every object so downstream checks can point Jeff at an
// exact row without needing to re-derive it from array position.
function auditRowsToObjects_(headers, rawRows) {
  return rawRows.map(function (rowArray, index) {
    const item = { _rowNumber: index + 2 };
    headers.forEach(function (header, columnIndex) {
      item[header] = rowArray[columnIndex];
    });
    return item;
  });
}

// ---------------------------------------------------------------------------
// Generic value helpers
// ---------------------------------------------------------------------------

function auditIsBlank_(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function auditNormalizeId_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

function auditNormalizeNameKey_(firstName, lastName) {
  return auditNormalizeId_(firstName).toLocaleLowerCase() + "|" + auditNormalizeId_(lastName).toLocaleLowerCase();
}

function auditParseDateValue_(value) {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return { blank: false, valid: false, dateKey: null };
    return {
      blank: false,
      valid: true,
      dateKey: Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd"),
    };
  }

  if (auditIsBlank_(value)) return { blank: true, valid: false, dateKey: null };

  // A genuinely date-formatted Sheets cell always arrives above as a JS
  // Date; a bare number or boolean reaching here means a non-date value was
  // typed into a date column. new Date(45123) or new Date(true) would
  // otherwise "succeed" by reinterpreting it as a millisecond offset,
  // silently misclassifying garbage input as a valid (wildly wrong) date —
  // reject those types outright rather than only trusting new Date() on
  // whatever was handed in.
  if (typeof value !== "string") {
    return { blank: false, valid: false, dateKey: null };
  }

  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return { blank: false, valid: false, dateKey: null };

  return {
    blank: false,
    valid: true,
    dateKey: Utilities.formatDate(parsed, Session.getScriptTimeZone(), "yyyy-MM-dd"),
  };
}

function auditParseNumber_(value) {
  if (auditIsBlank_(value)) return { blank: true, valid: false, number: null };

  const number = Number(value);
  if (!isFinite(number)) return { blank: false, valid: false, number: null };

  return { blank: false, valid: true, number: number };
}

// ---------------------------------------------------------------------------
// Generic sheet-summary helpers
// ---------------------------------------------------------------------------

function auditBuildIdSet_(objects, field) {
  const set = new Set();
  objects.forEach(function (row) {
    const value = auditNormalizeId_(row[field]);
    if (value) set.add(value);
  });
  return set;
}

function auditPrimaryIdSummary_(objects, fieldName, headers) {
  if (!fieldName) {
    return { checked: false, reason: "No known primary ID field for this sheet." };
  }
  if (headers.indexOf(fieldName) === -1) {
    return { checked: false, reason: "Column '" + fieldName + "' is not present in this sheet." };
  }

  const counts = {};
  let blankCount = 0;

  objects.forEach(function (row) {
    const value = auditNormalizeId_(row[fieldName]);
    if (!value) {
      blankCount += 1;
      return;
    }
    counts[value] = (counts[value] || 0) + 1;
  });

  const duplicateValues = Object.keys(counts).filter(function (value) {
    return counts[value] > 1;
  });

  return {
    checked: true,
    field: fieldName,
    blankCount: blankCount,
    duplicateCount: duplicateValues.length,
    duplicateExamples: duplicateValues.slice(0, 10),
  };
}

function auditBlankRowSummary_(rawRows) {
  const blankRowNumbers = [];
  rawRows.forEach(function (rowArray, index) {
    const isBlank = rowArray.every(function (cell) {
      return auditIsBlank_(cell);
    });
    if (isBlank) blankRowNumbers.push(index + 2);
  });

  return { count: blankRowNumbers.length, exampleRowNumbers: blankRowNumbers.slice(0, 10) };
}

function auditEvaluateForeignKey_(sourceObjects, sourceField, sourceHeaders, validIdSet, targetSheetName, targetPresent) {
  if (sourceHeaders.indexOf(sourceField) === -1) {
    return { checked: false, reason: "Column '" + sourceField + "' not present in source sheet." };
  }
  if (!targetPresent) {
    return { checked: false, reason: "Referenced sheet '" + targetSheetName + "' is missing." };
  }

  let blankCount = 0;
  let orphanCount = 0;
  const orphanExamples = [];

  sourceObjects.forEach(function (row) {
    const value = auditNormalizeId_(row[sourceField]);
    if (!value) {
      blankCount += 1;
      return;
    }
    if (!validIdSet.has(value)) {
      orphanCount += 1;
      if (orphanExamples.length < 5) {
        orphanExamples.push({ rowNumber: row._rowNumber, value: value });
      }
    }
  });

  return {
    checked: true,
    sourceField: sourceField,
    targetSheet: targetSheetName,
    blankCount: blankCount,
    orphanCount: orphanCount,
    orphanExamples: orphanExamples,
  };
}

function auditCountByField_(objects, field, headers) {
  if (headers.indexOf(field) === -1) return { checked: false };

  const counts = {};
  objects.forEach(function (row) {
    const value = auditNormalizeId_(row[field]) || "(blank)";
    counts[value] = (counts[value] || 0) + 1;
  });

  return { checked: true, counts: counts };
}

function auditCountByActive_(objects, field, headers) {
  if (headers.indexOf(field) === -1) return { checked: false };

  let activeCount = 0;
  let inactiveOrBlankCount = 0;

  objects.forEach(function (row) {
    if (isActiveRosterValue_(row[field])) {
      activeCount += 1;
    } else {
      inactiveOrBlankCount += 1;
    }
  });

  return { checked: true, activeCount: activeCount, inactiveOrBlankCount: inactiveOrBlankCount };
}

// Sections.Active specifically must NOT use auditCountByActive_'s blank-is-
// inactive rule above. frontend/src/utils/forecastModel.js treats a blank
// Sections.Active as ACTIVE by default:
//   section.Active === undefined || section.Active === "" || isTrue(section.Active)
// Reusing the stricter Students/SectionEnrollments/Courses convention here
// would report a blank-Active section as inactive when the live app is
// actually treating it as active — a real, misleading mismatch, not a
// stylistic one.
function auditCountSectionsActive_(objects, headers) {
  if (headers.indexOf("Active") === -1) return { checked: false };

  let activeCount = 0;
  let inactiveCount = 0;

  objects.forEach(function (row) {
    const value = row.Active;
    const isActive = value === undefined || value === "" || isActiveRosterValue_(value);
    if (isActive) {
      activeCount += 1;
    } else {
      inactiveCount += 1;
    }
  });

  return { checked: true, activeCount: activeCount, inactiveCount: inactiveCount };
}

function auditDistinctValues_(objects, field, headers, limit) {
  if (headers.indexOf(field) === -1) return { checked: false };

  const set = new Set();
  objects.forEach(function (row) {
    const value = auditNormalizeId_(row[field]);
    if (value) set.add(value);
  });

  const values = Array.from(set).sort();

  return { checked: true, count: values.length, values: values.slice(0, limit || 50) };
}

function auditBuildSheetSummary_(sheetResult, primaryIdField, foreignKeyEntries, contentIndicators) {
  if (!sheetResult.present) {
    // error is set only when the sheet exists but reading it threw (see the
    // per-sheet try/catch in auditBuildReport_) — surfaced here so that
    // failure reason isn't silently dropped from the report.
    return { present: false, error: sheetResult.error || null };
  }

  return {
    present: true,
    rowCount: sheetResult.rowCount,
    headers: sheetResult.headers,
    duplicateHeaders: sheetResult.duplicateHeaders,
    primaryId: auditPrimaryIdSummary_(sheetResult.objects, primaryIdField, sheetResult.headers),
    blankRows: auditBlankRowSummary_(sheetResult.rawRows),
    foreignKeys: foreignKeyEntries || [],
    contentIndicators: contentIndicators || {},
  };
}

// ---------------------------------------------------------------------------
// Fictional roster detection
// ---------------------------------------------------------------------------

// Matches only by exact (LegalFirstName, LegalLastName) against the 48-name
// seed list, then classifies each match's *enrollment shape* — never by
// StudentID/EnrollmentID prefix, which setupRosterSheetsV1Locked_ and the
// real RosterImport.js importer both generate identically (STU-<uuid>,
// ENR-<uuid>) and therefore cannot distinguish fictional from real.
function auditBuildFictionalRosterReport_(students, sectionEnrollments) {
  if (!students.present) {
    return { checked: false, reason: "Students sheet missing." };
  }

  const studentsByNameKey = {};
  students.objects.forEach(function (row) {
    const key = auditNormalizeNameKey_(row.LegalFirstName, row.LegalLastName);
    if (!studentsByNameKey[key]) studentsByNameKey[key] = [];
    studentsByNameKey[key].push(row);
  });

  const enrollmentsByStudentId = {};
  if (sectionEnrollments.present) {
    sectionEnrollments.objects.forEach(function (row) {
      const studentId = auditNormalizeId_(row.StudentID);
      if (!studentId) return;
      if (!enrollmentsByStudentId[studentId]) enrollmentsByStudentId[studentId] = [];
      enrollmentsByStudentId[studentId].push(row);
    });
  }

  const seededSectionSet = new Set(AUDIT_SEEDED_SECTION_IDS);
  const matches = [];
  let namesWithNoMatch = 0;
  let namesWithMultipleMatches = 0;
  let seededShapeStudentCount = 0;
  let seededShapeEnrollmentCount = 0;
  let nonSeededShapeStudentCount = 0;
  let studentsWithNonSeededEnrollments = 0;

  AUDIT_FICTIONAL_STUDENT_NAMES.forEach(function (pair) {
    const key = auditNormalizeNameKey_(pair[0], pair[1]);
    const matchedRows = studentsByNameKey[key] || [];

    if (matchedRows.length === 0) {
      namesWithNoMatch += 1;
      return;
    }
    if (matchedRows.length > 1) {
      namesWithMultipleMatches += 1;
    }

    matchedRows.forEach(function (studentRow) {
      const studentId = auditNormalizeId_(studentRow.StudentID);
      const enrollments = enrollmentsByStudentId[studentId] || [];

      const fitsSeededShape =
        enrollments.length > 0 &&
        enrollments.every(function (enrollment) {
          return (
            seededSectionSet.has(auditNormalizeId_(enrollment.SectionID)) &&
            auditIsBlank_(enrollment.StartDate) &&
            auditIsBlank_(enrollment.EndDate)
          );
        });

      // Exact logical complement of fitsSeededShape's per-enrollment test
      // (De Morgan), so this is derived rather than recomputed with a
      // second pass over the same enrollments. A zero-enrollment student is
      // neither "fits" nor "has a bad enrollment" — that distinction is
      // already visible via enrollmentCount: 0 on the match record below.
      const hasNonSeededEnrollment = enrollments.length > 0 && !fitsSeededShape;

      if (fitsSeededShape) {
        seededShapeStudentCount += 1;
        seededShapeEnrollmentCount += enrollments.length;
      } else {
        nonSeededShapeStudentCount += 1;
      }

      if (hasNonSeededEnrollment) studentsWithNonSeededEnrollments += 1;

      // Name + section summary only — StudentID/EnrollmentID intentionally
      // omitted (not needed to confirm a match; rowNumber is enough to
      // locate the row for manual review).
      matches.push({
        legalFirstName: studentRow.LegalFirstName,
        legalLastName: studentRow.LegalLastName,
        rowNumber: studentRow._rowNumber,
        active: isActiveRosterValue_(studentRow.Active),
        enrollmentCount: enrollments.length,
        enrollmentSections: enrollments.map(function (enrollment) {
          return enrollment.SectionID;
        }),
        fitsSeededShape: fitsSeededShape,
        hasNonSeededEnrollment: hasNonSeededEnrollment,
        ambiguousNameMatch: matchedRows.length > 1,
      });
    });
  });

  return {
    checked: true,
    seedListSize: AUDIT_FICTIONAL_STUDENT_NAMES.length,
    seededSectionIds: AUDIT_SEEDED_SECTION_IDS,
    namesWithNoMatch: namesWithNoMatch,
    namesWithMultipleMatches: namesWithMultipleMatches,
    matchedStudentCount: matches.length,
    seededShapeStudentCount: seededShapeStudentCount,
    seededShapeEnrollmentCount: seededShapeEnrollmentCount,
    nonSeededShapeStudentCount: nonSeededShapeStudentCount,
    studentsWithNonSeededEnrollments: studentsWithNonSeededEnrollments,
    matches: matches,
  };
}

// ---------------------------------------------------------------------------
// DailyProgress checks
// ---------------------------------------------------------------------------

function auditBuildDailyProgressChecks_(dailyProgress, dependencyChecks) {
  if (!dailyProgress.present) return { present: false };

  const headers = dailyProgress.headers;
  const hasNotes = headers.indexOf("Notes") !== -1;
  const hasDate = headers.indexOf("Date") !== -1;

  let testMarkerCount = 0;
  let blankDateCount = 0;
  let invalidDateCount = 0;
  let earliestDateKey = null;
  let latestDateKey = null;

  dailyProgress.objects.forEach(function (row) {
    if (hasNotes && String(row.Notes || "").trim() === "Test from Apps Script") {
      testMarkerCount += 1;
    }

    if (hasDate) {
      const parsed = auditParseDateValue_(row.Date);
      if (parsed.blank) {
        blankDateCount += 1;
      } else if (!parsed.valid) {
        invalidDateCount += 1;
      } else {
        if (earliestDateKey === null || parsed.dateKey < earliestDateKey) earliestDateKey = parsed.dateKey;
        if (latestDateKey === null || parsed.dateKey > latestDateKey) latestDateKey = parsed.dateKey;
      }
    }
  });

  return {
    present: true,
    totalRowCount: dailyProgress.rowCount,
    notesColumnPresent: hasNotes,
    testMarkerRowCount: hasNotes ? testMarkerCount : null,
    dateColumnPresent: hasDate,
    blankDateCount: hasDate ? blankDateCount : null,
    invalidDateCount: hasDate ? invalidDateCount : null,
    dateRange: hasDate ? { earliest: earliestDateKey, latest: latestDateKey } : null,
    countsByCourseSectionId: auditCountByField_(dailyProgress.objects, "CourseSectionID", headers),
    countsByUnitId: auditCountByField_(dailyProgress.objects, "UnitID", headers),
    orphanedCourseSectionId: dependencyChecks.dailyProgressCourseSectionId,
    orphanedCourseId: dependencyChecks.dailyProgressCourseId,
    orphanedUnitId: dependencyChecks.dailyProgressUnitId,
    orphanedLessonId: dependencyChecks.dailyProgressLessonId,
  };
}

// ---------------------------------------------------------------------------
// Curriculum (Units / Lessons) human-review lists
// ---------------------------------------------------------------------------

// Wraps auditCountByField_ (already used for the report's own countsBy*
// fields) for internal id -> reference-count lookups, instead of each
// caller hand-rolling its own forEach/counts-map loop. `available` is false
// when the sheet or the id column itself is missing — distinct from "zero
// references found" — so a caller can report "couldn't check" rather than a
// silently misleading 0 for every row.
function auditReferenceCountMap_(sheetResult, field) {
  if (!sheetResult.present) return { available: false, counts: {} };
  const result = auditCountByField_(sheetResult.objects, field, sheetResult.headers);
  return result.checked ? { available: true, counts: result.counts } : { available: false, counts: {} };
}

// No fictional marker exists for Units or Lessons — every row was hand-typed
// or created through the real "Add Lesson" UI. This produces a structural
// list only (IDs, counts, titles) so Jeff can tell real curriculum from
// exploratory test records by reading it directly; it deliberately omits
// Description/TeacherNotes/KeyOutcome/PrimaryLink content. Capped at
// AUDIT_MAX_CURRICULUM_ITEMS with explicit truncation metadata rather than
// an unbounded dump — see that constant's comment.
function auditBuildUnitsReview_(units, lessons, dailyProgress) {
  if (!units.present) return { present: false };

  const lessonCounts = auditReferenceCountMap_(lessons, "UnitID");
  const dailyProgressCounts = auditReferenceCountMap_(dailyProgress, "UnitID");

  const allItems = units.objects.map(function (row) {
    const unitId = auditNormalizeId_(row.UnitID);
    return {
      UnitID: row.UnitID,
      CourseID: row.CourseID,
      UnitNumber: row.UnitNumber !== undefined ? row.UnitNumber : null,
      title: row.UnitTitle !== undefined ? row.UnitTitle : null,
      requiredDays: row.RequiredDays !== undefined ? row.RequiredDays : null,
      optionalDays: row.OptionalDays !== undefined ? row.OptionalDays : null,
      lessonCount: lessonCounts.counts[unitId] || 0,
      dailyProgressReferenceCount: dailyProgressCounts.counts[unitId] || 0,
      rowNumber: row._rowNumber,
    };
  });

  return {
    present: true,
    count: allItems.length,
    displayedCount: Math.min(allItems.length, AUDIT_MAX_CURRICULUM_ITEMS),
    truncated: allItems.length > AUDIT_MAX_CURRICULUM_ITEMS,
    lessonCountAvailable: lessonCounts.available,
    dailyProgressReferenceCountAvailable: dailyProgressCounts.available,
    items: allItems.slice(0, AUDIT_MAX_CURRICULUM_ITEMS),
  };
}

function auditBuildLessonsReview_(lessons, dailyProgress) {
  if (!lessons.present) return { present: false };

  const dailyProgressCounts = auditReferenceCountMap_(dailyProgress, "LessonID");

  const allItems = lessons.objects.map(function (row) {
    const lessonId = auditNormalizeId_(row.LessonID);
    return {
      LessonID: row.LessonID,
      CourseID: row.CourseID,
      UnitID: row.UnitID,
      LessonNumber: row.LessonNumber !== undefined ? row.LessonNumber : null,
      SortOrder: row.SortOrder !== undefined ? row.SortOrder : null,
      title: row.LessonTitle !== undefined ? row.LessonTitle : null,
      dailyProgressReferenceCount: dailyProgressCounts.counts[lessonId] || 0,
      rowNumber: row._rowNumber,
    };
  });

  return {
    present: true,
    count: allItems.length,
    displayedCount: Math.min(allItems.length, AUDIT_MAX_CURRICULUM_ITEMS),
    truncated: allItems.length > AUDIT_MAX_CURRICULUM_ITEMS,
    dailyProgressReferenceCountAvailable: dailyProgressCounts.available,
    items: allItems.slice(0, AUDIT_MAX_CURRICULUM_ITEMS),
  };
}

// ---------------------------------------------------------------------------
// Configuration checks: SchoolCalendar, SchedulePatterns, Settings, YearPlan,
// RosterImport
// ---------------------------------------------------------------------------

function auditBuildSchoolCalendarChecks_(schoolCalendar) {
  if (!schoolCalendar.present) return { present: false };

  const headers = schoolCalendar.headers;
  const hasDate = headers.indexOf("Date") !== -1;
  const hasInstructionalDay = headers.indexOf("InstructionalDay") !== -1;
  const hasSchoolDay = headers.indexOf("SchoolDay") !== -1;

  const dateKeyCounts = {};
  let blankDateCount = 0;
  let invalidDateCount = 0;
  let earliestDateKey = null;
  let latestDateKey = null;
  const instructionalDayCounts = {};
  const schoolDayNumbers = [];
  let schoolDayNonNumericCount = 0;
  let schoolDayBlankCount = 0;

  schoolCalendar.objects.forEach(function (row) {
    if (hasDate) {
      const parsed = auditParseDateValue_(row.Date);
      if (parsed.blank) {
        blankDateCount += 1;
      } else if (!parsed.valid) {
        invalidDateCount += 1;
      } else {
        dateKeyCounts[parsed.dateKey] = (dateKeyCounts[parsed.dateKey] || 0) + 1;
        if (earliestDateKey === null || parsed.dateKey < earliestDateKey) earliestDateKey = parsed.dateKey;
        if (latestDateKey === null || parsed.dateKey > latestDateKey) latestDateKey = parsed.dateKey;
      }
    }

    if (hasInstructionalDay) {
      const label = auditIsBlank_(row.InstructionalDay)
        ? "(blank)"
        : String(isActiveRosterValue_(row.InstructionalDay));
      instructionalDayCounts[label] = (instructionalDayCounts[label] || 0) + 1;
    }

    if (hasSchoolDay) {
      const parsedNumber = auditParseNumber_(row.SchoolDay);
      if (parsedNumber.blank) {
        schoolDayBlankCount += 1;
      } else if (!parsedNumber.valid) {
        schoolDayNonNumericCount += 1;
      } else {
        schoolDayNumbers.push(parsedNumber.number);
      }
    }
  });

  const duplicateDates = Object.keys(dateKeyCounts).filter(function (key) {
    return dateKeyCounts[key] > 1;
  });

  let schoolDayDuplicateCount = 0;
  let schoolDayGapCount = 0;

  if (hasSchoolDay && schoolDayNumbers.length > 0) {
    const occurrences = {};
    schoolDayNumbers.forEach(function (number) {
      occurrences[number] = (occurrences[number] || 0) + 1;
    });
    schoolDayDuplicateCount = Object.keys(occurrences).filter(function (number) {
      return occurrences[number] > 1;
    }).length;

    const uniqueSorted = Object.keys(occurrences)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });

    for (let i = 1; i < uniqueSorted.length; i += 1) {
      if (uniqueSorted[i] - uniqueSorted[i - 1] > 1) schoolDayGapCount += 1;
    }
  }

  return {
    present: true,
    rowCount: schoolCalendar.rowCount,
    dateColumnPresent: hasDate,
    earliestDate: earliestDateKey,
    latestDate: latestDateKey,
    duplicateDateCount: duplicateDates.length,
    duplicateDateExamples: duplicateDates.slice(0, 10),
    blankDateCount: blankDateCount,
    invalidDateCount: invalidDateCount,
    instructionalDayColumnPresent: hasInstructionalDay,
    instructionalDayValueCounts: instructionalDayCounts,
    schoolDayColumnPresent: hasSchoolDay,
    schoolDayBlankCount: schoolDayBlankCount,
    schoolDayNonNumericCount: schoolDayNonNumericCount,
    schoolDayDuplicateValueCount: schoolDayDuplicateCount,
    schoolDayGapCount: schoolDayGapCount,
  };
}

function auditBuildSchedulePatternsChecks_(schedulePatterns, sections) {
  if (!schedulePatterns.present) return { present: false };

  const headers = schedulePatterns.headers;
  const hasDayOfWeek = headers.indexOf("DayOfWeek") !== -1;
  const blockGroupColumns = headers.filter(function (header) {
    return header !== "DayOfWeek";
  });

  const dayOfWeekCounts = {};
  if (hasDayOfWeek) {
    schedulePatterns.objects.forEach(function (row) {
      const value = auditNormalizeId_(row.DayOfWeek) || "(blank)";
      dayOfWeekCounts[value] = (dayOfWeekCounts[value] || 0) + 1;
    });
  }

  const duplicateDayOfWeekValues = Object.keys(dayOfWeekCounts).filter(function (value) {
    return dayOfWeekCounts[value] > 1;
  });

  let sectionBlockGroupsMissingFromPatterns = [];
  if (sections.present && sections.headers.indexOf("BlockGroup") !== -1) {
    const sectionBlockGroups = new Set();
    sections.objects.forEach(function (row) {
      const value = auditNormalizeId_(row.BlockGroup);
      if (value) sectionBlockGroups.add(value);
    });
    const blockGroupColumnSet = new Set(blockGroupColumns);
    sectionBlockGroupsMissingFromPatterns = Array.from(sectionBlockGroups).filter(function (blockGroup) {
      return !blockGroupColumnSet.has(blockGroup);
    });
  }

  return {
    present: true,
    rowCount: schedulePatterns.rowCount,
    dayOfWeekColumnPresent: hasDayOfWeek,
    dayOfWeekValues: Object.keys(dayOfWeekCounts),
    duplicateDayOfWeekValues: duplicateDayOfWeekValues,
    blockGroupColumns: blockGroupColumns,
    sectionBlockGroupsMissingFromPatterns: sectionBlockGroupsMissingFromPatterns,
  };
}

// Settings and YearPlan have no documented schema anywhere in the codebase
// (see ProductionDataAudit's PR description). This reports structure and, if
// the first column looks like a key/name/setting column, a short list of
// those values — never a full row dump, and never a value that isn't from a
// column that looks identifier-shaped.
function auditBuildGenericConfigSummary_(sheetResult) {
  if (!sheetResult.present) {
    return { present: false };
  }

  const headers = sheetResult.headers;
  let keySummary = { recognized: false };

  if (headers.length >= 1) {
    const firstHeader = String(headers[0] || "").toLowerCase();
    const looksLikeKeyColumn =
      firstHeader.indexOf("key") !== -1 || firstHeader.indexOf("name") !== -1 || firstHeader.indexOf("setting") !== -1;

    if (looksLikeKeyColumn) {
      const values = sheetResult.objects
        .map(function (row) {
          return auditNormalizeId_(row[headers[0]]);
        })
        .filter(Boolean);

      keySummary = {
        recognized: true,
        column: headers[0],
        values: values.slice(0, 10),
        truncated: values.length > 10,
      };
    }
  }

  return {
    present: true,
    rowCount: sheetResult.rowCount,
    headers: headers,
    keySummary: keySummary,
  };
}

function auditBuildRosterImportChecks_(rosterImport) {
  if (!rosterImport.present) return { present: false };

  const headers = rosterImport.headers;
  const hasStatus = headers.indexOf("Status") !== -1;
  const hasSectionId = headers.indexOf("SectionID") !== -1;

  let populatedRowCount = 0;
  let nonBlankStatusCount = 0;
  const sectionIdSet = new Set();

  rosterImport.objects.forEach(function (row) {
    const sectionId = hasSectionId ? auditNormalizeId_(row.SectionID) : "";
    const first = auditNormalizeId_(row.LegalFirstName);
    const last = auditNormalizeId_(row.LegalLastName);
    const preferred = auditNormalizeId_(row.PreferredName);
    const isRowBlank = !sectionId && !first && !last && !preferred;

    if (!isRowBlank) populatedRowCount += 1;
    if (hasStatus && !auditIsBlank_(row.Status)) nonBlankStatusCount += 1;
    if (sectionId) sectionIdSet.add(sectionId);
  });

  return {
    present: true,
    totalRowCount: rosterImport.rowCount,
    populatedRowCount: populatedRowCount,
    nonBlankStatusCount: hasStatus ? nonBlankStatusCount : null,
    distinctSectionIds: Array.from(sectionIdSet).sort(),
  };
}

// ---------------------------------------------------------------------------
// Human-readable summary
// ---------------------------------------------------------------------------

function auditBuildHumanReadableSummary_(report) {
  const lines = [];

  lines.push("YEAR PLANNER PRODUCTION DATA AUDIT — " + report.meta.timestamp);
  lines.push("Spreadsheet: " + report.meta.spreadsheetName + " (" + report.meta.spreadsheetId + ")");
  lines.push("Lock acquired for read consistency: " + report.meta.lockAcquired);
  lines.push("");

  if (report.meta.criticalFindings.length > 0) {
    lines.push("*** CRITICAL: REQUIRED SHEETS MISSING ***");
    report.meta.criticalFindings.forEach(function (message) {
      lines.push("  - " + message);
    });
    lines.push("");
  }

  lines.push("--- LIKELY SAFE CLEANUP CANDIDATES (still require manual confirmation) ---");
  if (report.fictionalRosterDetection.checked) {
    lines.push(
      "  Fictional roster: " +
        report.fictionalRosterDetection.seededShapeStudentCount +
        " of " +
        report.fictionalRosterDetection.matchedStudentCount +
        " name-matched students fit the exact seeded shape (" +
        report.fictionalRosterDetection.seededShapeEnrollmentCount +
        " enrollments).",
    );
  }
  if (report.dailyProgress.present) {
    lines.push("  DailyProgress rows marked 'Test from Apps Script': " + report.dailyProgress.testMarkerRowCount);
  }
  if (report.configuration.rosterImport.present) {
    lines.push(
      "  RosterImport populated staging rows (safe to clear before/after each real import): " +
        report.configuration.rosterImport.populatedRowCount,
    );
  }
  lines.push("");

  lines.push("--- DATA REQUIRING JEFF'S REVIEW ---");
  if (report.fictionalRosterDetection.checked) {
    lines.push(
      "  Name-matched students NOT fitting the seeded shape (do not remove automatically): " +
        report.fictionalRosterDetection.nonSeededShapeStudentCount,
    );
    lines.push(
      "  Seed names matched by more than one Students row: " + report.fictionalRosterDetection.namesWithMultipleMatches,
    );
    lines.push(
      "  Seeded-shape students that ALSO carry a non-seeded enrollment: " +
        report.fictionalRosterDetection.studentsWithNonSeededEnrollments,
    );
  }
  if (report.curriculumReview.units.present) {
    lines.push(
      "  Units on file: " +
        report.curriculumReview.units.count +
        " — see curriculumReview.units in the JSON report for the full per-unit list to review by content.",
    );
    if (report.curriculumReview.units.truncated) {
      lines.push(
        "    (list truncated to " +
          report.curriculumReview.units.displayedCount +
          " of " +
          report.curriculumReview.units.count +
          " in the JSON report)",
      );
    }
  }
  if (report.curriculumReview.lessons.present) {
    lines.push(
      "  Lessons on file: " + report.curriculumReview.lessons.count + " — see curriculumReview.lessons in the JSON report.",
    );
    if (report.curriculumReview.lessons.truncated) {
      lines.push(
        "    (list truncated to " +
          report.curriculumReview.lessons.displayedCount +
          " of " +
          report.curriculumReview.lessons.count +
          " in the JSON report)",
      );
    }
  }
  lines.push("");

  lines.push("--- CONFIGURATION THAT SHOULD BE PRESERVED ---");
  ["Courses", "Sections", "RosterSettings"].forEach(function (name) {
    const summary = report.sheets[name];
    lines.push("  " + name + ": " + (summary.present ? summary.rowCount + " row(s)." : "MISSING."));
  });
  if (report.configuration.schoolCalendar.present) {
    lines.push(
      "  SchoolCalendar: " +
        report.configuration.schoolCalendar.rowCount +
        " row(s), " +
        report.configuration.schoolCalendar.earliestDate +
        " to " +
        report.configuration.schoolCalendar.latestDate +
        ".",
    );
  }
  if (report.configuration.schedulePatterns.present) {
    lines.push("  SchedulePatterns: " + report.configuration.schedulePatterns.rowCount + " row(s).");
  }
  lines.push("");

  lines.push("--- DETECTED INTEGRITY PROBLEMS ---");
  let integrityProblemCount = 0;

  Object.keys(report.dependencyChecks).forEach(function (checkName) {
    const check = report.dependencyChecks[checkName];
    if (check.checked && (check.orphanCount > 0 || check.blankCount > 0)) {
      integrityProblemCount += 1;
      lines.push(
        "  " +
          checkName +
          ": " +
          check.blankCount +
          " blank, " +
          check.orphanCount +
          " orphaned reference(s) to " +
          check.targetSheet +
          ".",
      );
    }
  });

  Object.keys(report.sheets).forEach(function (name) {
    const summary = report.sheets[name];
    if (!summary.present) return;

    if (summary.duplicateHeaders && summary.duplicateHeaders.length > 0) {
      integrityProblemCount += 1;
      lines.push(
        "  " +
          name +
          ": duplicate column header(s) " +
          summary.duplicateHeaders.join(", ") +
          " — every other check on this sheet may be unreliable until this is fixed (the later column silently wins).",
      );
    }
    if (summary.primaryId && summary.primaryId.checked && summary.primaryId.duplicateCount > 0) {
      integrityProblemCount += 1;
      lines.push("  " + name + ": " + summary.primaryId.duplicateCount + " duplicate " + summary.primaryId.field + " value(s).");
    }
    if (summary.blankRows && summary.blankRows.count > 0) {
      integrityProblemCount += 1;
      lines.push("  " + name + ": " + summary.blankRows.count + " completely blank row(s) inside the data range.");
    }
  });

  if (report.dailyProgress.present) {
    if (report.dailyProgress.blankDateCount) {
      integrityProblemCount += 1;
      lines.push("  DailyProgress: " + report.dailyProgress.blankDateCount + " row(s) with a blank Date.");
    }
    if (report.dailyProgress.invalidDateCount) {
      integrityProblemCount += 1;
      lines.push("  DailyProgress: " + report.dailyProgress.invalidDateCount + " row(s) with an invalid Date.");
    }
  }

  if (report.configuration.schoolCalendar.present) {
    if (report.configuration.schoolCalendar.duplicateDateCount > 0) {
      integrityProblemCount += 1;
      lines.push(
        "  SchoolCalendar: " + report.configuration.schoolCalendar.duplicateDateCount + " duplicate date(s).",
      );
    }
    if (report.configuration.schoolCalendar.schoolDayGapCount > 0) {
      integrityProblemCount += 1;
      lines.push(
        "  SchoolCalendar: " + report.configuration.schoolCalendar.schoolDayGapCount + " gap(s) in SchoolDay numbering.",
      );
    }
  }

  if (integrityProblemCount === 0) {
    lines.push("  None detected.");
  }
  lines.push("");

  // "checked: false" (missing sheet/column) must never read as "zero
  // problems" — it means the check couldn't run at all, not that it ran and
  // passed. Enumerated separately so it can't be mistaken for the section
  // above.
  lines.push("--- UNABLE TO CHECK (not the same as zero problems) ---");
  let uncheckedCount = 0;

  Object.keys(report.dependencyChecks).forEach(function (checkName) {
    const check = report.dependencyChecks[checkName];
    if (!check.checked) {
      uncheckedCount += 1;
      lines.push("  " + checkName + ": " + check.reason);
    }
  });

  Object.keys(report.sheets).forEach(function (name) {
    const summary = report.sheets[name];
    if (!summary.present) return;
    if (summary.primaryId && !summary.primaryId.checked) {
      uncheckedCount += 1;
      lines.push("  " + name + " primary ID: " + summary.primaryId.reason);
    }
  });

  if (report.curriculumReview.units.present && !report.curriculumReview.units.lessonCountAvailable) {
    uncheckedCount += 1;
    lines.push("  Units lesson counts: Lessons sheet or its UnitID column is unavailable.");
  }
  if (report.curriculumReview.units.present && !report.curriculumReview.units.dailyProgressReferenceCountAvailable) {
    uncheckedCount += 1;
    lines.push("  Units DailyProgress reference counts: DailyProgress sheet or its UnitID column is unavailable.");
  }
  if (report.curriculumReview.lessons.present && !report.curriculumReview.lessons.dailyProgressReferenceCountAvailable) {
    uncheckedCount += 1;
    lines.push("  Lessons DailyProgress reference counts: DailyProgress sheet or its LessonID column is unavailable.");
  }

  if (uncheckedCount === 0) {
    lines.push("  Every dependency and primary-ID check above ran to completion.");
  }
  lines.push("");

  lines.push("--- UNKNOWNS ---");
  ["Settings", "YearPlan"].forEach(function (name) {
    const summary = report.sheets[name];
    lines.push(
      "  " +
        name +
        ": " +
        (summary.present
          ? "present, " + summary.rowCount + " row(s), no confirmed downstream usage found in code."
          : "not present."),
    );
  });
  if (report.meta.unexpectedSheetNames.length > 0) {
    lines.push("  Unexpected sheets found: " + report.meta.unexpectedSheetNames.join(", "));
  } else {
    lines.push("  No unexpected sheets found.");
  }

  return lines;
}
