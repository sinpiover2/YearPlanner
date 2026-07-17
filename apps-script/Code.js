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
    lastUpdated: new Date().toISOString(),
  };

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);

  if (payload.action === "saveDailyProgress") {
    return saveDailyProgress(payload);
  }

  if (payload.action === "addLesson") {
    return addLesson(payload);
  }

  if (payload.action === "updateLesson") {
    return updateLesson(payload);
  }

  if (payload.action === "deleteLesson") {
    return deleteLesson(payload);
  }

  if (payload.action === "moveLesson") {
    return moveLesson(payload);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: "Unknown action" }))
    .setMimeType(ContentService.MimeType.JSON);
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function addLesson(payload) {
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
    PlannedDays: Number(payload.plannedDays || 1),
    KeyOutcome: payload.keyOutcome || "",
    PrimaryLink: payload.primaryLink || "",
    Description: "",
    TeacherNotes: "",
  };

  const row = headers.map((header) =>
    rowObject[header] !== undefined ? rowObject[header] : "",
  );

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, lessonId }))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateLesson(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Lessons");

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const lessonIdIndex = headers.indexOf("LessonID");

  const rowIndex = values.findIndex((row, index) => {
    return index > 0 && row[lessonIdIndex] === payload.lessonId;
  });

  if (rowIndex === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Lesson not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const updates = {
    LessonTitle: payload.lessonTitle,
    PlannedDays: Number(payload.plannedDays || 1),
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

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteLesson(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Lessons");

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const lessonIdColumn = headers.indexOf("LessonID");

  for (let row = values.length - 1; row >= 1; row--) {
    if (values[row][lessonIdColumn] === payload.lessonId) {
      sheet.deleteRow(row + 1);
      break;
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function moveLesson(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Lessons");

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const lessonIdIndex = headers.indexOf("LessonID");
  const unitIdIndex = headers.indexOf("UnitID");
  const sortOrderIndex = headers.indexOf("SortOrder");
  const lessonNumberIndex = headers.indexOf("LessonNumber");

  const unitRows = values
    .map((row, index) => ({ row, sheetRow: index + 1 }))
    .filter((item, index) => {
      return index > 0 && item.row[unitIdIndex] === payload.unitId;
    })
    .sort((a, b) => {
      return Number(a.row[sortOrderIndex]) - Number(b.row[sortOrderIndex]);
    });

  const currentIndex = unitRows.findIndex((item) => {
    return item.row[lessonIdIndex] === payload.lessonId;
  });

  if (currentIndex === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Lesson not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const targetIndex =
    payload.direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= unitRows.length) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, skipped: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const current = unitRows[currentIndex];
  const target = unitRows[targetIndex];

  const currentSortOrder = current.row[sortOrderIndex];
  const targetSortOrder = target.row[sortOrderIndex];

  sheet
    .getRange(current.sheetRow, sortOrderIndex + 1)
    .setValue(targetSortOrder);

  sheet
    .getRange(target.sheetRow, sortOrderIndex + 1)
    .setValue(currentSortOrder);

  if (lessonNumberIndex !== -1) {
    const currentLessonNumber = current.row[lessonNumberIndex];
    const targetLessonNumber = target.row[lessonNumberIndex];

    sheet
      .getRange(current.sheetRow, lessonNumberIndex + 1)
      .setValue(targetLessonNumber);

    sheet
      .getRange(target.sheetRow, lessonNumberIndex + 1)
      .setValue(currentLessonNumber);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
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