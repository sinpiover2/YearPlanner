import assert from "node:assert/strict";
import test from "node:test";

import {
  getCourseNavigation,
  getCourseStatus,
} from "../src/utils/courseCurriculumModel.js";
import { getUnitPlanningModel } from "../src/utils/unitUtils.js";

const completeUnits = [
  {
    UnitID: "U1",
    CourseID: "M8",
    SortOrder: 1,
    RequiredDays: 4,
    OptionalDays: 0,
  },
  {
    UnitID: "U2",
    CourseID: "M8",
    SortOrder: 2,
    RequiredDays: " 6 ",
    OptionalDays: 2,
  },
];

const completeLessons = [
  {
    LessonID: "L1",
    UnitID: "U1",
    CourseID: "M8",
    SortOrder: 1,
    PlannedDays: 1,
  },
  {
    LessonID: "L2",
    UnitID: "U1",
    CourseID: "M8",
    SortOrder: 2,
    PlannedDays: " 1.5 ",
  },
  {
    LessonID: "L3",
    UnitID: "U2",
    CourseID: "M8",
    SortOrder: 1,
    PlannedDays: 2,
  },
];

test("known Unit planning values calculate remaining days and progress", () => {
  const unit = completeUnits[0];
  const progress = [
    { UnitID: "U1", DayFraction: 1 },
    { UnitID: "U1", DayFraction: 0.5 },
    { UnitID: "U1", DayFraction: "invalid" },
    { UnitID: "U1", DayFraction: Infinity },
    { UnitID: "U2", DayFraction: 10 },
  ];
  const unitSnapshot = structuredClone(unit);
  const progressSnapshot = structuredClone(progress);

  assert.deepEqual(getUnitPlanningModel(progress, unit), {
    requiredDays: { state: "known", value: 4 },
    optionalDays: { state: "known", value: 0 },
    actualDays: 1.5,
    actualDayValues: {
      total: 1.5,
      count: 4,
      knownCount: 2,
      unknownCount: 0,
      invalidCount: 2,
      empty: false,
      complete: false,
      hasInvalidValues: true,
    },
    requiredDaysComplete: true,
    optionalDaysComplete: true,
    hasInvalidRequiredDays: false,
    hasInvalidOptionalDays: false,
    hasInvalidPlanningDays: false,
    requiredDayStatus: "in-progress",
    remainingRequiredDays: 2.5,
    progressPercent: 38,
  });
  assert.deepEqual(unit, unitSnapshot);
  assert.deepEqual(progress, progressSnapshot);
});

test("Unit and course models share safe actual-day totals and quality metadata", () => {
  const values = [
    1.25,
    " 2.5 ",
    0,
    "",
    "   ",
    null,
    undefined,
    true,
    false,
    [],
    [1],
    {},
    { value: 1 },
    Symbol("days"),
    1n,
    "bad",
    NaN,
    Infinity,
    -Infinity,
    -0.5,
  ];
  const progress = values.map((DayFraction) => ({
    CourseID: "M8",
    UnitID: "U1",
    LessonID: "L1",
    DayFraction,
  }));
  const originalEntries = [...progress];
  const originalValues = progress.map((entry) => entry.DayFraction);
  let unitModel;
  let courseModel;

  assert.doesNotThrow(() => {
    unitModel = getUnitPlanningModel(progress, completeUnits[0]);
    courseModel = getCourseStatus(
      "M8",
      completeUnits,
      completeLessons,
      progress,
    );
  });

  const expectedMetadata = {
    total: 3.75,
    count: 20,
    knownCount: 3,
    unknownCount: 4,
    invalidCount: 13,
    empty: false,
    complete: false,
    hasInvalidValues: true,
  };
  assert.equal(unitModel.actualDays, 3.75);
  assert.deepEqual(unitModel.actualDayValues, expectedMetadata);
  assert.equal(courseModel.actualDays, 3.75);
  assert.equal(courseModel.planning.actualDays, 3.75);
  assert.deepEqual(courseModel.planning.actualDayValues, expectedMetadata);
  assert.equal(courseModel.planning.hasInvalidValues, true);
  assert.deepEqual(progress, originalEntries);
  assert.deepEqual(
    progress.map((entry) => entry.DayFraction),
    originalValues,
  );
});

test("Unit calculations are withheld for blank, null, and undefined RequiredDays", () => {
  for (const RequiredDays of ["", "   ", null, undefined]) {
    const model = getUnitPlanningModel(
      [{ UnitID: "U1", DayFraction: 1 }],
      { UnitID: "U1", RequiredDays, OptionalDays: "" },
    );

    assert.deepEqual(model.requiredDays, { state: "unknown", value: null });
    assert.deepEqual(model.optionalDays, { state: "unknown", value: null });
    assert.equal(model.actualDays, 1);
    assert.equal(model.requiredDaysComplete, false);
    assert.equal(model.optionalDaysComplete, false);
    assert.equal(model.remainingRequiredDays, null);
    assert.equal(model.progressPercent, null);
    assert.equal(model.requiredDayStatus, null);
    assert.equal(model.hasInvalidPlanningDays, false);
  }
});

test("Unit model exposes invalid RequiredDays and OptionalDays independently", () => {
  for (const RequiredDays of [0, "bad", Infinity, -Infinity, NaN]) {
    const model = getUnitPlanningModel([], {
      UnitID: "U1",
      RequiredDays,
      OptionalDays: -1,
    });

    assert.equal(model.requiredDays.state, "invalid");
    assert.equal(model.optionalDays.state, "invalid");
    assert.equal(model.requiredDaysComplete, false);
    assert.equal(model.optionalDaysComplete, false);
    assert.equal(model.hasInvalidRequiredDays, true);
    assert.equal(model.hasInvalidOptionalDays, true);
    assert.equal(model.hasInvalidPlanningDays, true);
    assert.equal(model.remainingRequiredDays, null);
    assert.equal(model.progressPercent, null);
    assert.equal(model.requiredDayStatus, null);
  }
});

test("course planning reports known totals and complete variance", () => {
  const progress = [
    {
      CourseID: "M8",
      UnitID: "U1",
      LessonID: "L1",
      DayFraction: 1.5,
      Finished: true,
    },
    {
      CourseID: "M8",
      UnitID: "U1",
      LessonID: "L2",
      DayFraction: 2,
      Finished: true,
    },
  ];
  const status = getCourseStatus("M8", completeUnits, completeLessons, progress);

  assert.deepEqual(status.planning.requiredDays, {
    total: 10,
    count: 2,
    knownCount: 2,
    unknownCount: 0,
    invalidCount: 0,
    empty: false,
    complete: true,
    hasInvalidValues: false,
  });
  assert.equal(status.planning.optionalDays.total, 2);
  assert.equal(status.planning.optionalDays.complete, true);
  assert.equal(status.planning.completedPlannedDays.total, 2.5);
  assert.equal(status.planning.completedPlannedDays.complete, true);
  assert.equal(status.planning.variance, 1);
  assert.equal(status.planning.complete, true);
  assert.equal(status.actualDays, 3.5);
  assert.equal(status.completedCount, 2);
  assert.equal(status.variance, 1);
});

test("course Unit totals expose unknown and invalid counts without losing known totals", () => {
  const units = [
    ...completeUnits,
    {
      UnitID: "U3",
      CourseID: "M8",
      SortOrder: 3,
      RequiredDays: "",
      OptionalDays: null,
    },
    {
      UnitID: "U4",
      CourseID: "M8",
      SortOrder: 4,
      RequiredDays: 0,
      OptionalDays: "invalid",
    },
  ];
  const status = getCourseStatus("M8", units, completeLessons, []);

  assert.equal(status.planning.requiredDays.total, 10);
  assert.equal(status.planning.requiredDays.unknownCount, 1);
  assert.equal(status.planning.requiredDays.invalidCount, 1);
  assert.equal(status.planning.requiredDays.complete, false);
  assert.equal(status.planning.optionalDays.total, 2);
  assert.equal(status.planning.optionalDays.unknownCount, 1);
  assert.equal(status.planning.optionalDays.invalidCount, 1);
  assert.equal(status.planning.optionalDays.complete, false);
  assert.equal(status.planning.unitDaysComplete, false);
  assert.equal(status.planning.complete, false);
  assert.equal(status.planning.hasInvalidValues, true);
});

test("completed lesson variance is withheld for unknown or invalid PlannedDays", () => {
  for (const PlannedDays of ["", null, undefined, 0, "bad", Infinity, NaN]) {
    const lessons = completeLessons.map((lesson, index) =>
      index === 0 ? { ...lesson, PlannedDays } : lesson,
    );
    const progress = [
      {
        CourseID: "M8",
        LessonID: "L1",
        DayFraction: 1,
        Finished: true,
      },
    ];
    const status = getCourseStatus("M8", completeUnits, lessons, progress);

    assert.equal(status.actualDays, 1);
    assert.equal(status.completedCount, 1);
    assert.equal(status.planning.completedPlannedDays.complete, false);
    assert.equal(status.planning.variance, null);
    assert.equal(
      status.planning.completedPlannedDays.invalidCount,
      PlannedDays === "" || PlannedDays === null || PlannedDays === undefined
        ? 0
        : 1,
    );
  }
});

test("current Unit variance is withheld while navigation remains deterministic", () => {
  const lessons = completeLessons.map((lesson) => ({
    ...lesson,
    PlannedDays: "",
  }));
  const units = completeUnits.map((unit) => ({
    ...unit,
    RequiredDays: "",
    OptionalDays: "",
  }));
  const progress = [
    {
      CourseID: "M8",
      UnitID: "U1",
      LessonID: "L1",
      DayFraction: 1,
      Finished: true,
    },
  ];
  const unitsSnapshot = structuredClone(units);
  const lessonsSnapshot = structuredClone(lessons);
  const progressSnapshot = structuredClone(progress);
  const navigation = getCourseNavigation("M8", units, lessons, progress);

  assert.equal(navigation.currentLesson.LessonID, "L2");
  assert.equal(navigation.previousLesson.LessonID, "L1");
  assert.equal(navigation.nextLesson.LessonID, "L3");
  assert.equal(navigation.totalLessonsInUnit, 2);
  assert.equal(navigation.completedInUnit, 1);
  assert.equal(navigation.actualDays, 1);
  assert.equal(navigation.planning.plannedDays.unknownCount, 2);
  assert.equal(navigation.planning.variance, null);
  assert.equal(navigation.planning.complete, false);
  assert.deepEqual(units, unitsSnapshot);
  assert.deepEqual(lessons, lessonsSnapshot);
  assert.deepEqual(progress, progressSnapshot);
});
