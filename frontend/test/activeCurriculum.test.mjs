import assert from "node:assert/strict";
import test from "node:test";

import {
  getActiveCurriculum,
  sortLessons,
  sortUnits,
} from "../src/utils/plannerUtils.js";
import {
  getCourseNavigation,
  getCourseStatus,
} from "../src/utils/courseCurriculumModel.js";
import {
  getSectionForecast,
  getSectionTimeline,
} from "../src/utils/forecastModel.js";
import { getPlanningModel } from "../src/utils/planningModel.js";

const units = [
  { UnitID: "OLD", CourseID: "IM1", SortOrder: 1, IsArchived: true, RequiredDays: 50, OptionalDays: 5 },
  { UnitID: "M8-1", CourseID: "M8", SortOrder: 1, RequiredDays: 4, OptionalDays: 1 },
  { UnitID: "NEW-1", CourseID: "IM1", SortOrder: 1, IsArchived: "false", RequiredDays: 5, OptionalDays: 1 },
  { UnitID: "NEW-2", CourseID: "IM1", SortOrder: 2, IsArchived: "", RequiredDays: 6, OptionalDays: 2 },
];

const lessons = [
  { LessonID: "OLD-L1", UnitID: "OLD", CourseID: "IM1", SortOrder: 1, PlannedDays: 40 },
  { LessonID: "NEW-L1", UnitID: "NEW-1", CourseID: "IM1", SortOrder: 1, PlannedDays: 1 },
  { LessonID: "NEW-L2", UnitID: "NEW-1", CourseID: "IM1", SortOrder: 2, PlannedDays: 1 },
  { LessonID: "NEW-L3", UnitID: "NEW-2", CourseID: "IM1", SortOrder: 1, PlannedDays: 1 },
  { LessonID: "M8-L1", UnitID: "M8-1", CourseID: "M8", SortOrder: 1, PlannedDays: 1 },
];

test("canonical selector recognizes repository boolean values and preserves order", () => {
  const truthy = [true, "true", "TRUE", "TrUe"];
  const falseLike = [undefined, null, "", false, "false", 0, 1, "1", "yes"];
  const lifecycleUnits = [
    ...falseLike.map((IsArchived, index) => ({ UnitID: `A${index}`, IsArchived })),
    ...truthy.map((IsArchived, index) => ({ UnitID: `X${index}`, IsArchived })),
  ];
  const lifecycleLessons = lifecycleUnits.map((unit, index) => ({
    LessonID: `L${index}`,
    UnitID: unit.UnitID,
  }));
  const unitsSnapshot = structuredClone(lifecycleUnits);
  const lessonsSnapshot = structuredClone(lifecycleLessons);

  const selected = getActiveCurriculum(lifecycleUnits, lifecycleLessons);

  assert.deepEqual(selected.activeUnits.map((unit) => unit.UnitID), falseLike.map((_, index) => `A${index}`));
  assert.deepEqual(selected.activeLessons.map((lesson) => lesson.UnitID), selected.activeUnits.map((unit) => unit.UnitID));
  assert.deepEqual(lifecycleUnits, unitsSnapshot);
  assert.deepEqual(lifecycleLessons, lessonsSnapshot);
  assert.notEqual(selected.activeUnits, lifecycleUnits);
  assert.notEqual(selected.activeLessons, lifecycleLessons);
});

test("active filtering precedes sorting and retains established active ordering", () => {
  const selected = getActiveCurriculum(units, lessons);
  assert.deepEqual(sortUnits(selected.activeUnits).map((unit) => unit.UnitID), ["M8-1", "NEW-1", "NEW-2"]);
  assert.deepEqual(
    sortLessons(selected.activeLessons.filter((lesson) => lesson.CourseID === "IM1"), selected.activeUnits)
      .map((lesson) => lesson.LessonID),
    ["NEW-L1", "NEW-L2", "NEW-L3"],
  );
});

test("course status and global/current-next navigation ignore archived curriculum", () => {
  const progress = [
    { CourseID: "IM1", LessonID: "OLD-L1", Finished: true, DayFraction: 10 },
    { CourseID: "IM1", LessonID: "NEW-L1", Finished: true, DayFraction: 1 },
  ];
  const status = getCourseStatus("IM1", units, lessons, progress);
  const navigation = getCourseNavigation("IM1", units, lessons, progress);

  assert.equal(status.completedCount, 1);
  assert.equal(status.plannedDaysCompleted, 1);
  assert.equal(status.actualDays, 1);
  assert.equal(status.variance, 0);
  assert.equal(status.currentLesson.LessonID, "NEW-L2");
  assert.equal(navigation.currentUnit.UnitID, "NEW-1");
  assert.equal(navigation.currentLesson.LessonID, "NEW-L2");
  assert.equal(navigation.nextLesson.LessonID, "NEW-L3");
  assert.ok(navigation.courseLessons.every((lesson) => lesson.UnitID !== "OLD"));
});

test("forecast calculations and timelines ignore archived units and lessons", () => {
  const section = { SectionID: "S1", CourseID: "IM1" };
  const forecast = getSectionForecast({
    section,
    units,
    lessons,
    dailyProgress: [],
    getProgressForSection: () => [
      { LessonID: "OLD-L1", DayFraction: 20, Finished: true },
      { LessonID: "NEW-L1", DayFraction: 1, Finished: true },
    ],
  });
  const timeline = getSectionTimeline(forecast, units, lessons);

  assert.equal(forecast.bufferDays, 3);
  assert.equal(forecast.actualDays, 1);
  assert.equal(forecast.currentLesson.LessonID, "NEW-L2");
  assert.equal(forecast.totalLessons, 3);
  assert.equal(timeline.totalRequiredDays, 11);
  assert.deepEqual(timeline.courseUnits.map((unit) => unit.UnitID), ["NEW-1", "NEW-2"]);
});

test("planning shelves ignore archived curriculum while historical IDs remain resolvable", () => {
  const extraActiveLessons = Array.from({ length: 9 }, (_, index) => ({
    LessonID: `SHELF-${index + 1}`,
    UnitID: "NEW-1",
    CourseID: "IM1",
    SortOrder: index + 3,
  }));
  const allLessons = [...lessons, ...extraActiveLessons];
  const navigation = getCourseNavigation("IM1", units, allLessons, []);
  const model = getPlanningModel({
    planningSections: [],
    planningNavigationByCourse: { IM1: navigation },
    selectedCourseId: "IM1",
    units,
    lessons: allLessons,
    referenceDate: new Date(2026, 7, 3),
  });

  assert.ok(model.shelf.items.every((item) => item.id !== "OLD-L1"));
  assert.equal(units.find((unit) => unit.UnitID === "OLD")?.IsArchived, true);
  assert.equal(allLessons.find((lesson) => lesson.LessonID === "OLD-L1")?.UnitID, "OLD");
});

test("active Lesson Session choices exclude archived lessons for both IM1 and Math 8", () => {
  const { activeUnits, activeLessons } = getActiveCurriculum(units, lessons);
  const im1Choices = sortLessons(
    activeLessons.filter((lesson) => lesson.CourseID === "IM1"),
    activeUnits.filter((unit) => unit.CourseID === "IM1"),
  );
  const math8Choices = sortLessons(
    activeLessons.filter((lesson) => lesson.CourseID === "M8"),
    activeUnits.filter((unit) => unit.CourseID === "M8"),
  );

  assert.deepEqual(im1Choices.map((lesson) => lesson.LessonID), ["NEW-L1", "NEW-L2", "NEW-L3"]);
  assert.deepEqual(math8Choices.map((lesson) => lesson.LessonID), ["M8-L1"]);
});
