const SHEET_ID = "1JkdZiffYVbPbiOlOUzl36udBqpEpKOD_DL1UEvBvjwo";

function doGet(e) {
  const data = {
    settings: getSheetData("Settings"),
    courses: getSheetData("Courses"),
    units: getSheetData("Units"),
    yearPlan: getSheetData("YearPlan"),
    schoolCalendar: getSheetData("SchoolCalendar"),
    lessons: getSheetData("Lessons"),
    dailyProgress: getSheetData("DailyProgress"),
    schedulePatterns: getSheetData("SchedulePatterns"),
    sections: getSheetData("Sections"),
    sectionPacing: getSheetData("SectionPacing"),
    lastUpdated: new Date().toISOString(),
  };

  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function isActiveRosterValue(value) {
  return value === true || String(value).trim().toLowerCase() === "true";
}

function compareRosterText(left, right) {
  return String(left || "")
    .trim()
    .toLocaleLowerCase()
    .localeCompare(
      String(right || "")
        .trim()
        .toLocaleLowerCase(),
    );
}

// Internal-only assembly for a future authenticated transport. doGet never
// calls this function because the deployed web app permits anonymous access.
function getSectionRoster(sectionId) {
  const emptyRoster = {
    sectionId: sectionId || "",
    sectionName: "",
    courseId: "",
    courseName: "",
    sortMode: "LastName",
    columns: ["", "", "", "", ""],
    students: [],
  };

  if (!sectionId) return emptyRoster;

  const sections = getSheetData("Sections");
  const section = sections.find((item) => item.SectionID === sectionId);

  if (!section) return emptyRoster;

  const courses = getSheetData("Courses");
  const course = courses.find((item) => item.CourseID === section.CourseID);
  const settings = getSheetData("RosterSettings").find(
    (item) => item.SectionID === sectionId,
  );
  const requestedSortMode = String(
    (settings && settings.SortMode) || "",
  ).trim();
  const sortMode = requestedSortMode === "FirstName" ? "FirstName" : "LastName";
  const columns = [1, 2, 3, 4, 5].map((number) =>
    String((settings && settings[`Column${number}Label`]) || "").trim(),
  );
  const studentsById = new Map(
    getSheetData("Students")
      .filter((student) => isActiveRosterValue(student.Active))
      .map((student) => [student.StudentID, student]),
  );
  const includedStudentIds = new Set();
  const rosterStudents = getSheetData("SectionEnrollments")
    .filter(
      (enrollment) =>
        enrollment.SectionID === sectionId &&
        isActiveRosterValue(enrollment.Active),
    )
    .map((enrollment) => studentsById.get(enrollment.StudentID))
    .filter(Boolean)
    .filter((student) => {
      if (includedStudentIds.has(student.StudentID)) return false;
      includedStudentIds.add(student.StudentID);
      return true;
    })
    .map((student) => {
      const preferredName = String(student.PreferredName || "").trim();
      const displayFirstName =
        preferredName || String(student.LegalFirstName || "").trim();
      const lastName = String(student.LegalLastName || "").trim();

      return {
        studentId: String(student.StudentID || ""),
        displayFirstName,
        lastName,
        displayName:
          sortMode === "FirstName"
            ? `${displayFirstName} ${lastName}`.trim()
            : [lastName, displayFirstName].filter(Boolean).join(", "),
      };
    });

  rosterStudents.sort((left, right) => {
    const comparisons =
      sortMode === "FirstName"
        ? [
            compareRosterText(left.displayFirstName, right.displayFirstName),
            compareRosterText(left.lastName, right.lastName),
          ]
        : [
            compareRosterText(left.lastName, right.lastName),
            compareRosterText(left.displayFirstName, right.displayFirstName),
          ];

    return (
      comparisons.find((value) => value !== 0) ||
      compareRosterText(left.studentId, right.studentId)
    );
  });

  return {
    sectionId,
    sectionName: String(section.SectionName || section.Period || sectionId),
    courseId: String(section.CourseID || ""),
    courseName: String(
      (course && (course.CourseName || course.ShortName)) || "",
    ),
    sortMode,
    columns,
    students: rosterStudents,
  };
}

// Manual development helper. It never runs from doGet/doPost, refuses to
// overwrite roster records, and intentionally seeds only the four approved
// Version 1 teaching sections. Review the target spreadsheet before invoking.
function setupRosterSheetsV1() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    throw new Error("Roster setup is already running. Try again later.");
  }

  try {
    return setupRosterSheetsV1Locked();
  } finally {
    lock.releaseLock();
  }
}

function setupRosterSheetsV1Locked() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const schemas = {
    Students: [
      "StudentID",
      "LegalFirstName",
      "LegalLastName",
      "PreferredName",
      "Active",
    ],
    SectionEnrollments: [
      "EnrollmentID",
      "SectionID",
      "StudentID",
      "Active",
      "StartDate",
      "EndDate",
    ],
    RosterSettings: [
      "SectionID",
      "SortMode",
      "Column1Label",
      "Column2Label",
      "Column3Label",
      "Column4Label",
      "Column5Label",
    ],
  };
  const sheetStates = {};

  // Complete validation happens before the first workbook mutation.
  Object.keys(schemas).forEach((sheetName) => {
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheetStates[sheetName] = { sheet: null, hadHeaders: false };
      return;
    }

    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    if (lastRow === 0 && lastColumn === 0) {
      sheetStates[sheetName] = { sheet, hadHeaders: false };
      return;
    }

    if (lastColumn !== schemas[sheetName].length) {
      throw new Error(
        `${sheetName} has ${lastColumn} columns; expected exactly ${schemas[sheetName].length}.`,
      );
    }

    const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

    if (existingHeaders.join("|") !== schemas[sheetName].join("|")) {
      throw new Error(
        `${sheetName} headers do not match the Version 1 schema.`,
      );
    }

    if (lastRow > 1) {
      throw new Error(`${sheetName} already contains roster records.`);
    }

    sheetStates[sheetName] = { sheet, hadHeaders: true };
  });

  const approvedSections = ["M8-P2", "M8-P3", "IM1-P5", "IM1-P6"];
  const validSectionIds = new Set(
    getSheetData("Sections").map((section) => section.SectionID),
  );

  approvedSections.forEach((sectionId) => {
    if (!validSectionIds.has(sectionId)) {
      throw new Error(
        `Cannot seed roster: section ${sectionId} does not exist.`,
      );
    }
  });

  const fictionalStudents = [
    ["Avery", "Bennett", ""],
    ["Jordan", "Calder", "Jordy"],
    ["Mina", "Delgado", ""],
    ["Theo", "Ellison", "Teddy"],
    ["Nora", "Farrell", ""],
    ["Elias", "Gupta", "Eli"],
    ["Sofia", "Hollis", ""],
    ["Marcus", "Ibarra", "Marc"],
    ["Leila", "Jensen", ""],
    ["Dante", "Kim", ""],
    ["Ruby", "Lawson", "Rue"],
    ["Owen", "Mendoza", ""],
    ["Camila", "Navarro", "Cami"],
    ["Felix", "Okafor", ""],
    ["Priya", "Patel", ""],
    ["Quentin", "Reyes", "Quinn"],
    ["Amara", "Sato", ""],
    ["Jonah", "Turner", "Jo"],
    ["Iris", "Usman", ""],
    ["Miles", "Vega", ""],
    ["Elena", "Wolfe", "Lena"],
    ["Zane", "Xu", ""],
    ["Maeve", "Young", ""],
    ["Caleb", "Zamora", "Cal"],
    ["Talia", "Archer", "Tali"],
    ["Ronan", "Brooks", ""],
    ["Keira", "Chandra", ""],
    ["Desmond", "Doyle", "Des"],
    ["Freya", "Espinoza", ""],
    ["Gavin", "Foster", ""],
    ["Hana", "Griffin", ""],
    ["Isaac", "Huang", "Ike"],
    ["Jade", "Ingram", ""],
    ["Kai", "Jefferson", ""],
    ["Lucia", "Kaur", "Lucy"],
    ["Noel", "Lang", ""],
    ["Orla", "Mercer", ""],
    ["Parker", "Nolan", "Park"],
    ["Reina", "Owens", ""],
    ["Silas", "Price", ""],
    ["Uma", "Quintero", ""],
    ["Victor", "Russell", "Vic"],
    ["Willa", "Shah", ""],
    ["Xavier", "Tran", "Xavi"],
    ["Yara", "Underwood", ""],
    ["Beckett", "Valdez", "Beck"],
    ["Cleo", "Ward", ""],
    ["Darius", "Yoon", ""],
  ];
  const studentRows = [];
  const enrollmentRows = [];

  approvedSections.forEach((sectionId, sectionIndex) => {
    fictionalStudents
      .slice(sectionIndex * 12, sectionIndex * 12 + 12)
      .forEach(([firstName, lastName, preferredName]) => {
        const studentId = `STU-${Utilities.getUuid()}`;
        const enrollmentId = `ENR-${Utilities.getUuid()}`;
        studentRows.push([studentId, firstName, lastName, preferredName, true]);
        enrollmentRows.push([enrollmentId, sectionId, studentId, true, "", ""]);
      });
  });
  const settingsRows = approvedSections.map((sectionId) => [
    sectionId,
    "LastName",
    "",
    "",
    "",
    "",
    "",
  ]);
  const rowsBySheet = {
    Students: studentRows,
    SectionEnrollments: enrollmentRows,
    RosterSettings: settingsRows,
  };
  const createdSheetNames = [];

  // Apps Script has no cross-sheet transaction. If any write fails, newly
  // created sheets are deleted and pre-existing sheets are restored to their
  // validated empty/header-only state before the error is rethrown.
  try {
    Object.keys(schemas).forEach((sheetName) => {
      const state = sheetStates[sheetName];

      if (!state.sheet) {
        state.sheet = ss.insertSheet(sheetName);
        createdSheetNames.push(sheetName);
      }

      if (!state.hadHeaders) {
        state.sheet
          .getRange(1, 1, 1, schemas[sheetName].length)
          .setValues([schemas[sheetName]]);
      }
    });

    Object.keys(rowsBySheet).forEach((sheetName) => {
      const rows = rowsBySheet[sheetName];
      sheetStates[sheetName].sheet
        .getRange(2, 1, rows.length, schemas[sheetName].length)
        .setValues(rows);
    });
  } catch (error) {
    const rollbackErrors = [];

    Object.keys(sheetStates).forEach((sheetName) => {
      const state = sheetStates[sheetName];

      if (!state.sheet) return;

      try {
        if (createdSheetNames.includes(sheetName)) {
          ss.deleteSheet(state.sheet);
        } else if (state.hadHeaders) {
          const dataRowCount = state.sheet.getMaxRows() - 1;
          if (dataRowCount > 0) {
            state.sheet
              .getRange(2, 1, dataRowCount, schemas[sheetName].length)
              .clearContent();
          }
        } else {
          state.sheet.clearContents();
        }
      } catch (rollbackError) {
        rollbackErrors.push(`${sheetName}: ${rollbackError.message}`);
      }
    });

    if (rollbackErrors.length > 0) {
      throw new Error(
        `${error.message} Rollback was incomplete: ${rollbackErrors.join("; ")}`,
      );
    }

    throw error;
  }

  return { ok: true, students: studentRows.length, sections: approvedSections };
}

// doGet remains fully anonymous (ANYONE_ANONYMOUS in appsscript.json) — the
// deployment's access level is one setting for the whole web app, so reads
// cannot be made anonymous while writes require auth at the deployment
// level. Write authorization is therefore enforced here, in application
// code, via a shared token every write action must present. See
// docs/Architecture/WRITE_PATH_INVENTORY.md and
// docs/Architecture/SPRINT_6_0_ARCHITECTURE.md, "Security."
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);

  if (!isAuthorizedWrite_(payload)) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Unauthorized" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  if (payload.action === "saveDailyProgress") {
    return saveDailyProgress(payload);
  }

  if (payload.action === "addLesson") {
    return addLesson(payload);
  }

  if (payload.action === "updateLesson") {
    return updateLesson(payload);
  }

  if (payload.action === "updateUnitPlanning") {
    return updateUnitPlanning(payload);
  }

  if (payload.action === "deleteLesson") {
    return deleteLesson(payload);
  }

  if (payload.action === "reorderLessons") {
    return reorderLessons(payload);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: false, error: "Unknown action" }),
  ).setMimeType(ContentService.MimeType.JSON);
}

// Every write action must present the shared token configured in this
// project's Script Properties (Apps Script editor -> Project Settings ->
// Script Properties -> key "WRITE_TOKEN"). An unconfigured token fails
// closed rather than falling back to open access. This is a shared-secret
// mitigation, not per-user authentication — see WRITE_PATH_INVENTORY.md's
// "Remaining risks" note for what it does and doesn't guarantee.
function isAuthorizedWrite_(payload) {
  const expectedToken = PropertiesService.getScriptProperties().getProperty(
    "WRITE_TOKEN",
  );

  if (!expectedToken) {
    return false;
  }

  return typeof payload.token === "string" && payload.token === expectedToken;
}

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) return [];

  const headers = values[0];

  return values.slice(1).map((row) => {
    const item = {};

    headers.forEach((header, index) => {
      item[header] = row[index];
    });

    return item;
  });
}

function saveDailyProgress(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("DailyProgress");

  sheet.appendRow([
    payload.date,
    payload.courseSectionId,
    payload.courseId,
    payload.unitId,
    payload.lessonId,
    payload.dayFraction,
    payload.finished,
    payload.notes || "",
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function parsePlannedDaysForWrite_(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return { ok: true, value: "" };
  }

  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;

  if (
    !Number.isFinite(number) ||
    number <= 0 ||
    !Number.isInteger(number / 0.5)
  ) {
    return {
      ok: false,
      error:
        "Planned days must be blank or a positive number in 0.5-day increments.",
    };
  }

  return { ok: true, value: number };
}

function planningErrorResponse_(message) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: false, error: message }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function parseUnitDaysForWrite_(value, fieldName, allowZero) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return { ok: true, value: "" };
  }

  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;
  const validMinimum = allowZero ? number >= 0 : number > 0;

  if (!Number.isFinite(number) || !validMinimum) {
    const requirement = allowZero
      ? "blank, zero, or a positive number"
      : "blank or a positive number";
    return { ok: false, error: `${fieldName} must be ${requirement}.` };
  }

  return { ok: true, value: number };
}

function updateUnitPlanning(payload) {
  const requiredDays = parseUnitDaysForWrite_(
    payload.requiredDays,
    "Required days",
    false,
  );
  if (!requiredDays.ok) return planningErrorResponse_(requiredDays.error);

  const optionalDays = parseUnitDaysForWrite_(
    payload.optionalDays,
    "Optional days",
    true,
  );
  if (!optionalDays.ok) return planningErrorResponse_(optionalDays.error);

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Units");
  if (!sheet) return planningErrorResponse_("Units sheet not found.");

  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const requiredHeaders = [
    "UnitID",
    "CourseID",
    "RequiredDays",
    "OptionalDays",
  ];
  const missingHeaders = requiredHeaders.filter(
    (header) => headers.indexOf(header) === -1,
  );
  const duplicateHeaders = requiredHeaders.filter(
    (header) => headers.indexOf(header) !== headers.lastIndexOf(header),
  );

  if (missingHeaders.length > 0 || duplicateHeaders.length > 0) {
    return planningErrorResponse_(
      `Units schema is incompatible. Missing: ${missingHeaders.join(", ") || "none"}; duplicate: ${duplicateHeaders.join(", ") || "none"}.`,
    );
  }

  const requiredDaysIndex = headers.indexOf("RequiredDays");
  const optionalDaysIndex = headers.indexOf("OptionalDays");
  if (optionalDaysIndex !== requiredDaysIndex + 1) {
    return planningErrorResponse_(
      "Units schema is incompatible. RequiredDays and OptionalDays must be adjacent in canonical order.",
    );
  }

  const unitIdIndex = headers.indexOf("UnitID");
  const courseIdIndex = headers.indexOf("CourseID");
  const matches = values
    .map((row, index) => ({ row, index }))
    .filter(
      ({ row, index }) =>
        index > 0 &&
        row[unitIdIndex] === payload.unitId &&
        row[courseIdIndex] === payload.courseId,
    );

  if (matches.length !== 1) {
    return planningErrorResponse_(
      `Expected exactly one Unit row for ${payload.courseId}/${payload.unitId}; found ${matches.length}.`,
    );
  }

  const rowNumber = matches[0].index + 1;
  sheet
    .getRange(rowNumber, requiredDaysIndex + 1, 1, 2)
    .setValues([[requiredDays.value, optionalDays.value]]);

  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      unitId: payload.unitId,
      requiredDays: requiredDays.value,
      optionalDays: optionalDays.value,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function addLesson(payload) {
  const plannedDays = parsePlannedDaysForWrite_(payload.plannedDays);
  if (!plannedDays.ok) return planningErrorResponse_(plannedDays.error);

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Lessons");

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const unitIdIndex = headers.indexOf("UnitID");

  const unitLessons = values.slice(1).filter((row) => {
    return row[unitIdIndex] === payload.unitId;
  });

  const nextLessonNumber = unitLessons.length + 1;
  const lessonId = `${payload.unitId}-L${nextLessonNumber}`;

  const rowObject = {
    LessonID: lessonId,
    CourseID: payload.courseId,
    UnitID: payload.unitId,
    LessonNumber: nextLessonNumber,
    SortOrder: nextLessonNumber,
    LessonTitle: payload.lessonTitle,
    PlannedDays: plannedDays.value,
    KeyOutcome: payload.keyOutcome || "",
    PrimaryLink: payload.primaryLink || "",
    Description: "",
    TeacherNotes: "",
    // A teacher-added lesson is always a traditional, fixed-sequence Lesson —
    // see docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §5. Only takes
    // effect once a "Type" column actually exists on the sheet; harmless
    // no-op otherwise, since the row-building step below only writes values
    // for headers that are physically present.
    Type: payload.type || "Lesson",
  };

  const row = headers.map((header) =>
    rowObject[header] !== undefined ? rowObject[header] : "",
  );

  sheet.appendRow(row);

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, lessonId, lesson: rowObject }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function updateLesson(payload) {
  const plannedDays = parsePlannedDaysForWrite_(payload.plannedDays);
  if (!plannedDays.ok) return planningErrorResponse_(plannedDays.error);

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Lessons");

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const lessonIdIndex = headers.indexOf("LessonID");

  const rowIndex = values.findIndex((row, index) => {
    return index > 0 && row[lessonIdIndex] === payload.lessonId;
  });

  if (rowIndex === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Lesson not found" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const updates = {
    LessonTitle: payload.lessonTitle,
    PlannedDays: plannedDays.value,
    KeyOutcome: payload.keyOutcome || "",
    PrimaryLink: payload.primaryLink || "",
    TeacherNotes: payload.teacherNotes || "",
  };

  Object.keys(updates).forEach((key) => {
    const columnIndex = headers.indexOf(key);

    if (columnIndex !== -1) {
      sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(updates[key]);
    }
  });

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function deleteLesson(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Lessons");

  if (!sheet) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Lessons sheet not found." }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const lessonIdIndex = headers.indexOf("LessonID");
  const unitIdIndex = headers.indexOf("UnitID");
  const sortOrderIndex = headers.indexOf("SortOrder");

  const missingRequiredHeaders = [
    ["LessonID", lessonIdIndex],
    ["UnitID", unitIdIndex],
    ["SortOrder", sortOrderIndex],
  ]
    .filter(([, index]) => index === -1)
    .map(([name]) => name);

  if (missingRequiredHeaders.length > 0) {
    return ContentService.createTextOutput(
      JSON.stringify({
        ok: false,
        error: `Lessons sheet is missing required column(s): ${missingRequiredHeaders.join(", ")}.`,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const rowIndex = values.findIndex(
    (row, index) => index > 0 && row[lessonIdIndex] === payload.lessonId,
  );

  if (rowIndex === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Lesson not found" }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const unitId = values[rowIndex][unitIdIndex];

  sheet.deleteRow(rowIndex + 1);

  const remainingRows = sheet.getDataRange().getValues().slice(1);

  const unitRowsInOrder = remainingRows
    .filter((row) => row[unitIdIndex] === unitId)
    .sort((a, b) => Number(a[sortOrderIndex]) - Number(b[sortOrderIndex]));

  const positionByLessonId = new Map(
    unitRowsInOrder.map((row, index) => [row[lessonIdIndex], index + 1]),
  );

  // SortOrder (physical position) is renumbered to close the gap left by the
  // deleted row. LessonNumber is deliberately left untouched — it is the
  // publisher's own lesson identity, not a derived position, and must remain
  // stable across deletes/reorders of other rows. See
  // docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §2 ("LessonNumber").
  const updatedRows = remainingRows.map((row) => {
    if (row[unitIdIndex] !== unitId) return row;

    const newPosition = positionByLessonId.get(row[lessonIdIndex]);
    const updatedRow = row.slice();
    updatedRow[sortOrderIndex] = newPosition;

    return updatedRow;
  });

  if (updatedRows.length > 0) {
    sheet.getRange(2, 1, updatedRows.length, headers.length).setValues(updatedRows);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function reorderErrorResponse(message) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: false, error: message }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function reorderLessons(payload) {
  const unitId = payload.unitId;
  const orderedLessonIds = payload.orderedLessonIds;

  if (!unitId || typeof unitId !== "string") {
    return reorderErrorResponse("unitId is required.");
  }

  if (!Array.isArray(orderedLessonIds)) {
    return reorderErrorResponse("orderedLessonIds must be an array.");
  }

  if (new Set(orderedLessonIds).size !== orderedLessonIds.length) {
    return reorderErrorResponse("orderedLessonIds contains duplicate lesson IDs.");
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Lessons");

  if (!sheet) {
    return reorderErrorResponse("Lessons sheet not found.");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const lessonIdIndex = headers.indexOf("LessonID");
  const unitIdIndex = headers.indexOf("UnitID");
  const sortOrderIndex = headers.indexOf("SortOrder");

  const missingRequiredHeaders = [
    ["LessonID", lessonIdIndex],
    ["UnitID", unitIdIndex],
    ["SortOrder", sortOrderIndex],
  ]
    .filter(([, index]) => index === -1)
    .map(([name]) => name);

  if (missingRequiredHeaders.length > 0) {
    return reorderErrorResponse(
      `Lessons sheet is missing required column(s): ${missingRequiredHeaders.join(", ")}.`,
    );
  }

  const unitLessonIds = new Set(
    values
      .slice(1)
      .filter((row) => row[unitIdIndex] === unitId)
      .map((row) => row[lessonIdIndex]),
  );

  if (unitLessonIds.size !== orderedLessonIds.length) {
    return reorderErrorResponse(
      "orderedLessonIds does not match the current lessons in this unit.",
    );
  }

  const invalidId = orderedLessonIds.find((id) => !unitLessonIds.has(id));

  if (invalidId) {
    return reorderErrorResponse(
      `Lesson ${invalidId} does not belong to unit ${unitId}.`,
    );
  }

  const positionByLessonId = new Map(
    orderedLessonIds.map((lessonId, index) => [lessonId, index + 1]),
  );

  // SortOrder follows the teacher's chosen order. LessonNumber is
  // deliberately left untouched — a reorder changes teaching sequence, not
  // the publisher's own lesson identity. See
  // docs/Architecture/CURRICULUM_INFORMATION_MODEL.md, §2 ("LessonNumber").
  const updatedRows = values.slice(1).map((row) => {
    if (row[unitIdIndex] !== unitId) return row;

    const newPosition = positionByLessonId.get(row[lessonIdIndex]);
    const updatedRow = row.slice();
    updatedRow[sortOrderIndex] = newPosition;

    return updatedRow;
  });

  sheet.getRange(2, 1, updatedRows.length, headers.length).setValues(updatedRows);

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function testSaveDailyProgress() {
  const result = saveDailyProgress({
    date: new Date().toISOString(),
    courseSectionId: "M8-P1",
    courseId: "M8",
    unitId: "M8-U1",
    lessonId: "M8-U1-L1",
    dayFraction: 1,
    finished: true,
    notes: "Test from Apps Script",
  });

  Logger.log(result.getContent());
}

function showSpreadsheetUrl() {
  Logger.log(SpreadsheetApp.openById(SHEET_ID).getUrl());
}
