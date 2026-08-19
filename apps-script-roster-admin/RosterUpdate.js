// Authenticated roster round trip: export CSV, preview every proposed change,
// then explicitly apply. This file is part of the MYSELF-only roster project;
// no student data crosses the anonymous Year Planner API.

const ROSTER_UPDATE_HEADERS = [
  "Action",
  "EnrollmentID",
  "StudentID",
  "LegalFirstName",
  "LegalLastName",
  "PreferredName",
  "SectionID",
];
const ROSTER_UPDATE_CONFIRMATION = "APPLY ROSTER CHANGES";
const ROSTER_UPDATE_BACKUP_PREFIX = "Year Planner Database — pre-roster-update ";

function getRosterUpdateTemplate() {
  const snapshot = rosterUpdateReadSnapshot_();
  const activeStudents = new Map(
    snapshot.students
      .filter(function (student) { return isActiveRosterValue_(student.Active); })
      .map(function (student) { return [String(student.StudentID), student]; }),
  );
  const rows = snapshot.enrollments
    .filter(function (enrollment) { return isActiveRosterValue_(enrollment.Active); })
    .map(function (enrollment) {
      const student = activeStudents.get(String(enrollment.StudentID));
      if (!student) return null;
      return [
        "KEEP",
        enrollment.EnrollmentID,
        student.StudentID,
        student.LegalFirstName,
        student.LegalLastName,
        student.PreferredName,
        enrollment.SectionID,
      ];
    })
    .filter(Boolean)
    .sort(function (left, right) {
      return compareRosterText_(left[6], right[6]) ||
        compareRosterText_(left[4], right[4]) ||
        compareRosterText_(left[3], right[3]);
    });

  return {
    filename: "year-planner-rosters.csv",
    csv: rosterUpdateToCsv_([ROSTER_UPDATE_HEADERS].concat(rows)),
    sections: snapshot.sections
      .filter(function (section) { return isActiveRosterValue_(section.Active); })
      .map(function (section) {
        return {
          sectionId: String(section.SectionID),
          label: String(section.SectionName || section.Period || section.SectionID),
        };
      }),
  };
}

function previewRosterUpdateCsv(csvText) {
  const snapshot = rosterUpdateReadSnapshot_();
  const plan = rosterUpdateBuildPlan_(csvText, snapshot);
  return rosterUpdatePublicPlan_(plan, rosterUpdateFingerprint_(snapshot));
}

function applyRosterUpdateCsv(csvText, expectedFingerprint, confirmation) {
  if (confirmation !== ROSTER_UPDATE_CONFIRMATION) {
    throw new Error('Type "' + ROSTER_UPDATE_CONFIRMATION + '" to confirm.');
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error("Another roster operation is running. Try again.");

  try {
    let snapshot = rosterUpdateReadSnapshot_();
    if (rosterUpdateFingerprint_(snapshot) !== expectedFingerprint) {
      throw new Error("The roster changed after preview. Preview the file again before applying it.");
    }

    let plan = rosterUpdateBuildPlan_(csvText, snapshot);
    if (!plan.ok) throw new Error("The uploaded roster has blocking problems. Nothing was changed.");
    if (!plan.changes.length) return { ok: true, applied: 0, message: "No changes to apply." };

    const spreadsheet = snapshot.spreadsheet;
    const backup = spreadsheet.copy(
      ROSTER_UPDATE_BACKUP_PREFIX + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss"),
    );

    // Re-read after the backup copy: a direct Sheets edit does not share this
    // script lock, so the fingerprint must still match at the last safe point.
    snapshot = rosterUpdateReadSnapshot_();
    if (rosterUpdateFingerprint_(snapshot) !== expectedFingerprint) {
      throw new Error("The roster changed while the backup was being created. Nothing was applied.");
    }
    plan = rosterUpdateBuildPlan_(csvText, snapshot);
    if (!plan.ok) throw new Error("The roster file no longer validates. Nothing was applied.");

    rosterUpdateExecutePlan_(plan, snapshot);
    return {
      ok: true,
      applied: plan.changes.length,
      summary: plan.summary,
      backupUrl: backup.getUrl(),
      message: plan.changes.length + " roster change(s) applied.",
    };
  } finally {
    lock.releaseLock();
  }
}

function rosterUpdateReadSnapshot_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  return {
    spreadsheet: spreadsheet,
    sections: readRosterSheet_(spreadsheet, "Sections"),
    students: readRosterSheet_(spreadsheet, "Students"),
    enrollments: readRosterSheet_(spreadsheet, "SectionEnrollments"),
  };
}

function rosterUpdateBuildPlan_(csvText, snapshot) {
  const parsed = Utilities.parseCsv(String(csvText || "").replace(/^\uFEFF/, ""));
  const errors = [];
  if (!parsed.length || !rosterUpdateArraysEqual_(parsed[0], ROSTER_UPDATE_HEADERS)) {
    return rosterUpdateBlockedPlan_(["The CSV headers do not match the exported template."]);
  }

  const validSections = new Set(snapshot.sections
    .filter(function (section) { return isActiveRosterValue_(section.Active); })
    .map(function (section) { return String(section.SectionID); }));
  const studentsById = new Map(snapshot.students.map(function (student, index) {
    return [String(student.StudentID), { record: student, rowNumber: index + 2 }];
  }));
  const enrollmentsById = new Map(snapshot.enrollments.map(function (enrollment, index) {
    return [String(enrollment.EnrollmentID), { record: enrollment, rowNumber: index + 2 }];
  }));
  const seenEnrollmentIds = new Set();
  const proposedNames = new Map();
  const plannedNameChanges = new Set();
  const changes = [];

  parsed.slice(1).forEach(function (values, index) {
    const rowNumber = index + 2;
    if (values.every(function (value) { return !String(value || "").trim(); })) return;
    if (values.length !== ROSTER_UPDATE_HEADERS.length) {
      errors.push("Row " + rowNumber + ": expected " + ROSTER_UPDATE_HEADERS.length + " columns.");
      return;
    }
    const row = {};
    ROSTER_UPDATE_HEADERS.forEach(function (header, column) { row[header] = String(values[column] || "").trim(); });
    row.Action = row.Action.toUpperCase();

    if (["KEEP", "ADD", "REMOVE"].indexOf(row.Action) === -1) {
      errors.push("Row " + rowNumber + ': Action must be KEEP, ADD, or REMOVE.');
      return;
    }
    if (!row.LegalFirstName || !row.LegalLastName) {
      errors.push("Row " + rowNumber + ": legal first and last names are required.");
      return;
    }

    if (row.Action === "ADD") {
      if (row.StudentID || row.EnrollmentID) errors.push("Row " + rowNumber + ": ADD rows must leave IDs blank.");
      if (!validSections.has(row.SectionID)) errors.push("Row " + rowNumber + ": unknown SectionID " + row.SectionID + ".");
      if (!row.StudentID && !row.EnrollmentID && validSections.has(row.SectionID)) {
        changes.push({ type: "add", row: row, description: "Add " + rosterUpdateName_(row) + " to " + row.SectionID });
      }
      return;
    }

    const studentEntry = studentsById.get(row.StudentID);
    const enrollmentEntry = enrollmentsById.get(row.EnrollmentID);
    if (!studentEntry || !enrollmentEntry || String(enrollmentEntry.record.StudentID) !== row.StudentID) {
      errors.push("Row " + rowNumber + ": IDs do not match a current student enrollment.");
      return;
    }
    if (!isActiveRosterValue_(enrollmentEntry.record.Active)) {
      errors.push("Row " + rowNumber + ": this enrollment is no longer active.");
      return;
    }
    if (seenEnrollmentIds.has(row.EnrollmentID)) {
      errors.push("Row " + rowNumber + ": duplicate EnrollmentID " + row.EnrollmentID + ".");
      return;
    }
    seenEnrollmentIds.add(row.EnrollmentID);

    const nameKey = [row.LegalFirstName, row.LegalLastName, row.PreferredName].join("|");
    if (proposedNames.has(row.StudentID) && proposedNames.get(row.StudentID) !== nameKey) {
      errors.push("Row " + rowNumber + ": the same student has conflicting names.");
      return;
    }
    proposedNames.set(row.StudentID, nameKey);

    if (row.Action === "REMOVE") {
      changes.push({ type: "remove", studentRow: studentEntry.rowNumber, enrollmentRow: enrollmentEntry.rowNumber, row: row,
        description: "Remove " + rosterUpdateName_(row) + " from " + enrollmentEntry.record.SectionID });
      return;
    }
    if (!validSections.has(row.SectionID)) {
      errors.push("Row " + rowNumber + ": unknown SectionID " + row.SectionID + ".");
      return;
    }

    const student = studentEntry.record;
    if (!plannedNameChanges.has(row.StudentID) && ["LegalFirstName", "LegalLastName", "PreferredName"].some(function (field) { return String(student[field] || "").trim() !== row[field]; })) {
      changes.push({ type: "update-name", studentRow: studentEntry.rowNumber, row: row,
        description: "Update name for " + rosterUpdateName_(student) + " to " + rosterUpdateName_(row) });
      plannedNameChanges.add(row.StudentID);
    }
    if (String(enrollmentEntry.record.SectionID) !== row.SectionID) {
      changes.push({ type: "move", enrollmentRow: enrollmentEntry.rowNumber, studentId: row.StudentID, row: row,
        description: "Move " + rosterUpdateName_(row) + " from " + enrollmentEntry.record.SectionID + " to " + row.SectionID });
    }
  });

  // Every active enrollment must remain represented. This catches truncated
  // or accidentally filtered exports, but does not treat omission as removal.
  snapshot.enrollments.filter(function (item) { return isActiveRosterValue_(item.Active); }).forEach(function (item) {
    if (!seenEnrollmentIds.has(String(item.EnrollmentID))) {
      errors.push("Active enrollment " + item.EnrollmentID + " is missing. Export a fresh complete template; missing rows are never removals.");
    }
  });

  const summary = { additions: 0, removals: 0, moves: 0, nameChanges: 0 };
  changes.forEach(function (change) {
    if (change.type === "add") summary.additions += 1;
    if (change.type === "remove") summary.removals += 1;
    if (change.type === "move") summary.moves += 1;
    if (change.type === "update-name") summary.nameChanges += 1;
  });
  return { ok: errors.length === 0, errors: errors, changes: changes, summary: summary };
}

function rosterUpdateExecutePlan_(plan, snapshot) {
  const studentsSheet = snapshot.spreadsheet.getSheetByName("Students");
  const enrollmentsSheet = snapshot.spreadsheet.getSheetByName("SectionEnrollments");
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const studentHeaders = ROSTER_SCHEMAS.Students;
  const enrollmentHeaders = ROSTER_SCHEMAS.SectionEnrollments;

  plan.changes.filter(function (change) { return change.type === "update-name"; }).forEach(function (change) {
    ["LegalFirstName", "LegalLastName", "PreferredName"].forEach(function (field) {
      studentsSheet.getRange(change.studentRow, studentHeaders.indexOf(field) + 1).setValue(change.row[field]);
    });
  });
  plan.changes.filter(function (change) { return change.type === "remove" || change.type === "move"; }).forEach(function (change) {
    enrollmentsSheet.getRange(change.enrollmentRow, enrollmentHeaders.indexOf("Active") + 1).setValue(false);
    enrollmentsSheet.getRange(change.enrollmentRow, enrollmentHeaders.indexOf("EndDate") + 1).setValue(today);
  });
  plan.changes.filter(function (change) { return change.type === "add"; }).forEach(function (change) {
    const studentId = "STU-" + Utilities.getUuid();
    studentsSheet.appendRow([studentId, change.row.LegalFirstName, change.row.LegalLastName, change.row.PreferredName, true]);
    enrollmentsSheet.appendRow(["ENR-" + Utilities.getUuid(), change.row.SectionID, studentId, true, today, ""]);
  });
  plan.changes.filter(function (change) { return change.type === "move"; }).forEach(function (change) {
    enrollmentsSheet.appendRow(["ENR-" + Utilities.getUuid(), change.row.SectionID, change.studentId, true, today, ""]);
  });
}

function rosterUpdateFingerprint_(snapshot) {
  const data = {
    sections: snapshot.sections.map(function (row) { return [row.SectionID, row.Active]; }),
    students: snapshot.students.map(function (row) { return [row.StudentID, row.LegalFirstName, row.LegalLastName, row.PreferredName, row.Active]; }),
    enrollments: snapshot.enrollments.map(function (row) { return [row.EnrollmentID, row.SectionID, row.StudentID, row.Active, row.StartDate, row.EndDate]; }),
  };
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(data));
  return bytes.map(function (value) { return (value + 256).toString(16).slice(-2); }).join("");
}

function rosterUpdatePublicPlan_(plan, fingerprint) {
  return { ok: plan.ok, errors: plan.errors, changes: plan.changes.map(function (change) {
    return { type: change.type, description: change.description };
  }), summary: plan.summary, fingerprint: fingerprint, confirmationPhrase: ROSTER_UPDATE_CONFIRMATION };
}
function rosterUpdateBlockedPlan_(errors) { return { ok: false, errors: errors, changes: [], summary: { additions: 0, removals: 0, moves: 0, nameChanges: 0 } }; }
function rosterUpdateArraysEqual_(left, right) { return left.length === right.length && left.every(function (value, i) { return String(value) === right[i]; }); }
function rosterUpdateName_(row) { return [String(row.LegalFirstName || ""), String(row.LegalLastName || "")].join(" ").trim(); }
function rosterUpdateToCsv_(rows) { return rows.map(function (row) { return row.map(rosterUpdateCsvCell_).join(","); }).join("\r\n"); }
function rosterUpdateCsvCell_(value) { const text = String(value == null ? "" : value); return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; }
