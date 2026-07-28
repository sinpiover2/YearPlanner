const SHEET_ID = "1JkdZiffYVbPbiOlOUzl36udBqpEpKOD_DL1UEvBvjwo";

const ROSTER_SCHEMAS = {
  Sections: [
    "SectionID",
    "CourseID",
    "SectionName",
    "Period",
    "BlockGroup",
    "SortOrder",
    "Active",
  ],
  Courses: ["CourseID", "CourseName", "ShortName", "Active", "SortOrder"],
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
  // Teacher-facing staging sheet for RosterImport.js. Not a canonical roster
  // sheet — Status is written by the importer, never read as input.
  RosterImport: [
    "SectionID",
    "LegalFirstName",
    "LegalLastName",
    "PreferredName",
    "Status",
  ],
};

function doGet(e) {
  const sectionId = normalizeSectionId_(
    e && e.parameter && e.parameter.sectionId,
  );
  const sessionDate = normalizeSessionDate_(
    e && e.parameter && e.parameter.sessionDate,
  );
  const template = HtmlService.createTemplateFromFile("RosterPrint");

  template.roster = sectionId ? getSectionRoster_(sectionId) : emptyRoster_("");
  template.sessionDate = sessionDate;
  template.formattedSessionDate = formatSessionDate_(sessionDate);

  return template
    .evaluate()
    .setTitle("Student Roster")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// Combined print entry point used by both "Print lesson" and "Print Day" in
// the frontend. The lesson plan(s) (no roster/student data) arrive as POST
// form fields rather than query parameters because they can exceed URL
// length limits and must never appear in browser/server request logs as a
// query string. This page owns rendering every lesson + roster pair so
// student data never has to reach the frontend. Any per-entry failure
// renders a single explicit error state for that entry rather than a
// partial or misleadingly blank roster.
function doPost(e) {
  const params = (e && e.parameter) || {};

  // Roster-only multi-section print used by "Print Rosters" in the
  // frontend Planning toolbar. Kept as a separate branch (rather than
  // folded into the lesson+roster shape below) so a standalone roster
  // request can never accidentally carry or require lesson content.
  if (params.sectionIds) {
    return buildRosterOnlyPrint_(params);
  }

  const template = HtmlService.createTemplateFromFile("CombinedPrint");

  const requests = params.payloads
    ? parsePrintRequests_(params.payloads)
    : [
        {
          sectionId: params.sectionId,
          sessionDate: params.sessionDate,
          lessonPayload: params.lessonPayload,
          sortBy: params.sortBy,
        },
      ];

  template.entries = requests.map(buildPrintEntry_);

  return template
    .evaluate()
    .setTitle("Lesson and Roster Print")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// Parses the "payloads" field used by "Print Day": a JSON array of
// { sectionId, sessionDate, lessonPayload } requests, one per Lesson
// Session meeting that day. A malformed array yields a single error entry
// rather than throwing, matching doPost's existing failure handling.
function parsePrintRequests_(rawPayloads) {
  try {
    const parsed = JSON.parse(rawPayloads);
    return Array.isArray(parsed) && parsed.length ? parsed : [{}];
  } catch (error) {
    return [{}];
  }
}

// Builds one printable lesson + roster pair, the single unit CombinedPrint
// repeats for every request. Never throws: any failure is captured as an
// entry-level errorMessage so one bad entry cannot break the rest of the
// document.
function buildPrintEntry_(request) {
  const errors = [];
  let sectionId = "";
  let sessionDate = "";

  try {
    sectionId = normalizeSectionId_(request && request.sectionId);
  } catch (error) {
    errors.push("This print request has an invalid section.");
  }

  try {
    sessionDate = normalizeSessionDate_(request && request.sessionDate);
  } catch (error) {
    errors.push("This print request has an invalid session date.");
  }

  if (!sectionId) {
    errors.push(
      "This print request is missing the section for this lesson session.",
    );
  }

  let lesson = null;
  const lessonPayload = request && request.lessonPayload;

  if (!lessonPayload) {
    errors.push("This print request is missing the lesson plan content.");
  } else {
    try {
      lesson = normalizeLessonPayload_(
        typeof lessonPayload === "string"
          ? JSON.parse(lessonPayload)
          : lessonPayload,
      );
    } catch (error) {
      errors.push("The lesson plan could not be read for this print request.");
    }
  }

  let roster = emptyRoster_(sectionId);

  if (sectionId) {
    try {
      roster = getSectionRoster_(sectionId, request && request.sortBy);
    } catch (error) {
      errors.push("The roster could not be loaded for this section.");
    }
  }

  return {
    sessionDate: sessionDate,
    formattedSessionDate: formatSessionDate_(sessionDate),
    lesson: lesson,
    roster: roster,
    errorMessage: errors.join(" "),
  };
}

// Renders one or more blank student rosters with no lesson content, in the
// order the sectionIds were posted. Shares getSectionRoster_ and the
// RosterSection/RosterStyles partials with the lesson+roster print above so
// the two documents render identical roster pages from one canonical
// renderer.
function buildRosterOnlyPrint_(params) {
  const sectionIds = parseSectionIds_(params.sectionIds);
  const sessionDate = normalizeSessionDate_(params.sessionDate);
  const formattedSessionDate = formatSessionDate_(sessionDate);
  const sortBy = params.sortBy;
  const template = HtmlService.createTemplateFromFile("RosterPrintMulti");

  template.entries = sectionIds.map((sectionId) =>
    buildRosterOnlyEntry_(sectionId, sessionDate, formattedSessionDate, sortBy),
  );

  return template
    .evaluate()
    .setTitle("Student Rosters")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// Parses the "sectionIds" field: a JSON array of section ID strings, one per
// requested roster. A malformed or empty array yields a single error entry
// rather than throwing, matching parsePrintRequests_'s failure handling.
function parseSectionIds_(rawSectionIds) {
  try {
    const parsed = JSON.parse(rawSectionIds);
    return Array.isArray(parsed) && parsed.length ? parsed : [null];
  } catch (error) {
    return [null];
  }
}

// Builds one printable roster entry. Never throws: any failure is captured
// as an entry-level errorMessage so one bad section cannot break the rest of
// the document. A section with zero active students is not an error here —
// RosterSection.html already renders an explicit "No roster is available"
// state for it rather than a blank page.
function buildRosterOnlyEntry_(rawSectionId, sessionDate, formattedSessionDate, sortBy) {
  const errors = [];
  let sectionId = "";

  try {
    sectionId = normalizeSectionId_(rawSectionId);
  } catch (error) {
    errors.push("This print request has an invalid section.");
  }

  if (!sectionId) {
    errors.push("This print request is missing a section.");
  }

  let roster = emptyRoster_(sectionId);

  if (sectionId) {
    try {
      roster = getSectionRoster_(sectionId, sortBy);
    } catch (error) {
      errors.push("The roster could not be loaded for this section.");
    }
  }

  return {
    sessionDate: sessionDate,
    formattedSessionDate: formattedSessionDate,
    roster: roster,
    errorMessage: errors.join(" "),
  };
}

// Defensively normalizes the posted lesson JSON so a malformed or
// unexpected shape can never throw mid-template-render. Mirrors the shape
// produced by the frontend's buildLessonPrintPayload().
function normalizeLessonPayload_(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid lesson payload.");
  }

  const episodes = Array.isArray(raw.episodes) ? raw.episodes : [];
  const connectedLessons = Array.isArray(raw.connectedLessons)
    ? raw.connectedLessons.map((label) => String(label || "")).filter(Boolean)
    : [];

  return {
    sectionLabel: String(raw.sectionLabel || ""),
    courseLabel: String(raw.courseLabel || ""),
    unitLabel: String(raw.unitLabel || ""),
    connectedLessons,
    episodes: episodes.map((episode) => ({
      title: String((episode && episode.title) || "Teaching Episode"),
      isDeliverable: Boolean(episode && episode.isDeliverable),
      curriculumLabel: String((episode && episode.curriculumLabel) || ""),
      blocks: (Array.isArray(episode && episode.blocks)
        ? episode.blocks
        : []
      )
        .map((block) => ({
          type: String((block && block.type) || "text"),
          text: String((block && block.text) || ""),
        }))
        .filter((block) => block.text.trim()),
    })),
  };
}

// Standard Apps Script HTML Service include helper: evaluates a template
// partial with the given variables in scope so roster rendering logic and
// markup live in one place (RosterSection.html) instead of being duplicated
// across RosterPrint.html and CombinedPrint.html.
function include_(filename, templateData) {
  const partial = HtmlService.createTemplateFromFile(filename);

  Object.keys(templateData || {}).forEach((key) => {
    partial[key] = templateData[key];
  });

  return partial.evaluate().getContent();
}

function normalizeSectionId_(value) {
  const sectionId = String(value || "").trim();

  if (!sectionId) return "";
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(sectionId)) {
    throw new Error("Invalid section ID.");
  }

  return sectionId;
}

function normalizeSessionDate_(value) {
  const sessionDate = String(value || "").trim();

  if (!sessionDate) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    throw new Error("Invalid session date.");
  }

  const parts = sessionDate.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);

  if (
    date.getFullYear() !== parts[0] ||
    date.getMonth() !== parts[1] - 1 ||
    date.getDate() !== parts[2]
  ) {
    throw new Error("Invalid session date.");
  }

  return sessionDate;
}

function formatSessionDate_(sessionDate) {
  if (!sessionDate) return "";

  const parts = sessionDate.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    "EEEE, MMMM d, yyyy",
  );
}

function emptyRoster_(sectionId) {
  return {
    sectionId: sectionId || "",
    sectionName: "",
    courseId: "",
    courseName: "",
    sortMode: "LastName",
    columns: ["", "", "", "", ""],
    students: [],
  };
}

function isActiveRosterValue_(value) {
  return value === true || String(value).trim().toLowerCase() === "true";
}

function compareRosterText_(left, right) {
  return String(left || "")
    .trim()
    .toLocaleLowerCase()
    .localeCompare(
      String(right || "")
        .trim()
        .toLocaleLowerCase(),
    );
}

// Canonical roster sort order, shared by every print path (standalone
// Print Rosters, Print lesson, Print Day). "last"/"first" is a per-print
// request choice from the frontend, not a spreadsheet setting — an
// unrecognized or missing value always falls back to "last" so existing
// callers that don't send sortBy keep today's behavior.
function normalizeRosterSortBy_(value) {
  return String(value || "").trim().toLowerCase() === "first" ? "first" : "last";
}

function getSectionRoster_(sectionId, sortBy) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sections = readRosterSheet_(spreadsheet, "Sections");
  const courses = readRosterSheet_(spreadsheet, "Courses");
  const students = readRosterSheet_(spreadsheet, "Students");
  const enrollments = readRosterSheet_(spreadsheet, "SectionEnrollments");
  const settingsRows = readRosterSheet_(spreadsheet, "RosterSettings");
  const section = sections.find((item) => item.SectionID === sectionId);
  const roster = emptyRoster_(sectionId);

  if (!section) return roster;

  const course = courses.find((item) => item.CourseID === section.CourseID);
  const settings = settingsRows.find((item) => item.SectionID === sectionId);
  const sortMode = normalizeRosterSortBy_(sortBy) === "first" ? "FirstName" : "LastName";
  const columns = [1, 2, 3, 4, 5].map((number) =>
    String((settings && settings[`Column${number}Label`]) || "").trim(),
  );
  const studentsById = new Map(
    students
      .filter((student) => isActiveRosterValue_(student.Active))
      .map((student) => [student.StudentID, student]),
  );
  const includedStudentIds = new Set();
  const rosterStudents = enrollments
    .filter(
      (enrollment) =>
        enrollment.SectionID === sectionId &&
        isActiveRosterValue_(enrollment.Active),
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
            compareRosterText_(left.displayFirstName, right.displayFirstName),
            compareRosterText_(left.lastName, right.lastName),
          ]
        : [
            compareRosterText_(left.lastName, right.lastName),
            compareRosterText_(left.displayFirstName, right.displayFirstName),
          ];

    return (
      comparisons.find((value) => value !== 0) ||
      compareRosterText_(left.studentId, right.studentId)
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

function readRosterSheet_(spreadsheet, sheetName) {
  const expectedHeaders = ROSTER_SCHEMAS[sheetName];
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!expectedHeaders || !sheet) {
    throw new Error(`Required roster sheet unavailable: ${sheetName}.`);
  }

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
      describeRosterSchemaMismatch_(sheetName, expectedHeaders, actualHeaders),
    );
  }

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();

  return values.slice(1).map((row) => {
    const item = {};

    expectedHeaders.forEach((header, index) => {
      item[header] = row[index];
    });

    return item;
  });
}

// TEMP DIAGNOSTIC: reports header-level detail only (never student row data)
// for a roster sheet schema mismatch. Remove once the SectionEnrollments
// schema issue is confirmed and fixed.
function describeRosterSchemaMismatch_(sheetName, expectedHeaders, actualHeaders) {
  const missingHeaders = expectedHeaders.filter(
    (header) => actualHeaders.indexOf(header) === -1,
  );
  const unexpectedHeaders = actualHeaders.filter(
    (header) => expectedHeaders.indexOf(header) === -1,
  );
  const orderDiffers =
    missingHeaders.length === 0 &&
    unexpectedHeaders.length === 0 &&
    actualHeaders.some((header, index) => header !== expectedHeaders[index]);

  return [
    `Roster sheet schema mismatch: ${sheetName}.`,
    `Expected headers: [${expectedHeaders.join(", ")}].`,
    `Actual headers: [${actualHeaders.join(", ")}].`,
    `Missing headers: [${missingHeaders.join(", ") || "none"}].`,
    `Unexpected headers: [${unexpectedHeaders.join(", ") || "none"}].`,
    `Order differs: ${orderDiffers}.`,
  ].join(" ");
}
