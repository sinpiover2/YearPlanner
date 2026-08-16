import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import {
  getPlanningModel,
} from "../src/utils/planningModel.js";

const lesson = {
  LessonID: "AMP-M8-U1-I05",
  UnitID: "AMP-M8-U1",
  CourseID: "M8",
  LessonCode: "1.5",
  LessonTitle: "Turtle Crossing",
  ItemType: "Lesson",
  SortOrder: 5,
};

test("planning ignores projected SectionPacing until a lesson session is authored", () => {
  const model = getPlanningModel({
    planningSections: [
      {
        SectionID: "M8-P1",
        SectionName: "Math 8 P1",
        CourseID: "M8",
        Period: 1,
        BlockGroup: "GroupA",
      },
    ],
    planningNavigationByCourse: {
      M8: {
        currentUnit: {
          UnitID: "AMP-M8-U1",
          UnitNumber: "U1",
          UnitTitle: "Rigid Transformations",
        },
        currentLesson: lesson,
      },
    },
    selectedCourseId: "M8",
    units: [
      {
        UnitID: "AMP-M8-U1",
        CourseID: "M8",
        UnitNumber: "U1",
        UnitTitle: "Rigid Transformations",
        SortOrder: 1,
      },
    ],
    lessons: [lesson],
    schoolCalendar: [
      {
        Date: "2026-08-10T07:00:00.000Z",
        InstructionalDay: true,
        SchoolDay: 3,
      },
    ],
    schedulePatterns: [{ DayOfWeek: "Monday", GroupA: true }],
    sectionPacing: [
      {
        PacingID: "M8-P1|2026-08-10|1",
        SectionID: "M8-P1",
        PlannedDate: "2026-08-10T07:00:00.000Z",
        Sequence: 1,
        LessonID: lesson.LessonID,
        Locked: false,
      },
    ],
    referenceDate: new Date(2026, 7, 10),
  });

  const session = model.sessions["M8-P1-2026-08-10"];
  assert.equal(session.planned, false);
  assert.equal(session.title, null);
  assert.equal(session.scheduledLabel, undefined);
  assert.equal(session.scheduledItems, undefined);
});

test("read-only planning API includes SectionPacing", async () => {
  const source = await readFile(
    new URL("../../apps-script-planning/Code.js", import.meta.url),
    "utf8",
  );
  const context = {
    ContentService: {
      MimeType: { JSON: "JSON" },
      createTextOutput: (text) => ({
        text,
        setMimeType() {
          return this;
        },
      }),
    },
    console,
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  context.getSheetData = (name) =>
    name === "SectionPacing" ? [{ PacingID: "P1" }] : [];

  const payload = JSON.parse(context.doGet({}).text);
  assert.deepEqual(payload.sectionPacing, [{ PacingID: "P1" }]);
});
