import assert from "node:assert/strict";
import test from "node:test";

import {
  getCourseNavigation,
  getCourseStatus,
  getSidebarCoursePresentation,
} from "../src/utils/courseCurriculumModel.js";
import {
  getOptionalDaysPresentation,
  getUnitPlanningModel,
  getUnitPlanningPresentation,
} from "../src/utils/unitUtils.js";

const units = [
  { UnitID: "U1", CourseID: "IM1", UnitNumber: 1, SortOrder: 1, RequiredDays: 4, OptionalDays: 0 },
  { UnitID: "U2", CourseID: "IM1", UnitNumber: 2, SortOrder: 2, RequiredDays: 6, OptionalDays: 2 },
];
const lessons = [
  { LessonID: "L1", UnitID: "U1", CourseID: "IM1", SortOrder: 1, PlannedDays: 1 },
  { LessonID: "L2", UnitID: "U1", CourseID: "IM1", SortOrder: 2, PlannedDays: 1 },
];
const progress = [
  { CourseID: "IM1", UnitID: "U1", LessonID: "L1", DayFraction: 1, Finished: true },
];

test("fully planned Unit presentation retains numeric semantics", () => {
  const presentation = getUnitPlanningPresentation(getUnitPlanningModel(progress, units[0]));
  assert.deepEqual(presentation, {
    daysLabel: "1/4 days · 3 remaining",
    daysAccessibleLabel: null,
    status: "in-progress",
    statusLabel: null,
    progressPercent: 25,
    progressLabel: "25% complete",
    requiredDaysLabel: "4",
  });
});

test("unknown and invalid RequiredDays suppress numeric planning claims but retain actuals", () => {
  const unknown = getUnitPlanningPresentation(getUnitPlanningModel(progress, { ...units[0], RequiredDays: "" }));
  const invalid = getUnitPlanningPresentation(getUnitPlanningModel(progress, { ...units[0], RequiredDays: 0 }));

  assert.equal(unknown.daysLabel, "1 logged · Not planned");
  assert.equal(unknown.progressPercent, null);
  assert.equal(unknown.status, null);
  assert.equal(unknown.progressLabel, "Not planned");
  assert.equal(invalid.daysLabel, "1 logged · Invalid value");
  assert.equal(invalid.progressPercent, null);
  assert.equal(invalid.status, null);
});

test("compact unknown Unit planning uses the canonical dash with accessible wording", () => {
  const presentation = getUnitPlanningPresentation(
    getUnitPlanningModel(progress, { ...units[0], RequiredDays: "" }),
    { compact: true },
  );

  assert.equal(presentation.daysLabel, "1 logged · —");
  assert.equal(presentation.daysAccessibleLabel, "1 logged · Not planned");
});

test("optional zero remains distinct from unknown and invalid", () => {
  assert.equal(getOptionalDaysPresentation(getUnitPlanningModel([], units[0])), "0d buffer");
  assert.equal(getOptionalDaysPresentation(getUnitPlanningModel([], { ...units[0], OptionalDays: "" })), "Buffer not planned");
  assert.equal(getOptionalDaysPresentation(getUnitPlanningModel([], { ...units[0], OptionalDays: -1 })), "Invalid buffer value");
});

test("fully planned Sidebar retains numeric progress, pace, zero buffer, lesson count, and navigation", () => {
  const status = getCourseStatus("IM1", units, lessons, progress);
  const navigation = getCourseNavigation("IM1", units, lessons, progress);
  const presentation = getSidebarCoursePresentation(status, navigation);

  assert.equal(presentation.paceLabel, "On pace");
  assert.equal(presentation.progressPercent, 50);
  assert.equal(presentation.unitDaysLabel, "1 of 2 days in unit");
  assert.equal(presentation.bufferLabel, "2d buffer");
  assert.equal(status.completedCount, 1);
  assert.equal(navigation.currentLesson.LessonID, "L2");
  assert.equal(navigation.previousLesson.LessonID, "L1");
});

test("Sidebar preserves an explicit all-zero optional buffer", () => {
  const zeroBufferUnits = units.map((unit) => ({ ...unit, OptionalDays: 0 }));
  const status = getCourseStatus("IM1", zeroBufferUnits, lessons, progress);
  const navigation = getCourseNavigation("IM1", zeroBufferUnits, lessons, progress);

  assert.equal(getSidebarCoursePresentation(status, navigation).bufferLabel, "0d buffer");
});

test("incomplete required-day aggregation exposes known days without numeric progress", () => {
  const incompleteUnits = [{ ...units[0] }, { ...units[1], RequiredDays: "", OptionalDays: "" }];
  const status = getCourseStatus("IM1", incompleteUnits, lessons, progress);
  const navigation = getCourseNavigation("IM1", incompleteUnits, lessons, progress);
  const presentation = getSidebarCoursePresentation(status, navigation);

  assert.equal(presentation.progressPercent, null);
  assert.equal(presentation.unitDaysLabel, "1 logged");
  assert.equal(presentation.requiredDaysLabel, "4 known days");
  assert.equal(presentation.planningLabel, "Planning incomplete");
  assert.equal(presentation.bufferLabel, "Buffer not planned");
  assert.doesNotMatch(presentation.unitDaysLabel, /of 0|%/);
});

test("incomplete or invalid completed-lesson plans suppress variance and pace", () => {
  for (const PlannedDays of ["", 0, "bad"]) {
    const incompleteLessons = [{ ...lessons[0], PlannedDays }, lessons[1]];
    const status = getCourseStatus("IM1", units, incompleteLessons, progress);
    const navigation = getCourseNavigation("IM1", units, incompleteLessons, progress);
    const presentation = getSidebarCoursePresentation(status, navigation);

    assert.equal(presentation.paceAvailable, false);
    assert.equal(presentation.paceLabel, "Pacing unavailable");
    assert.equal(presentation.pacingPlanningLabel, "Planning days incomplete");
    assert.doesNotMatch(presentation.paceLabel, /ahead|behind|On pace|recoverable/i);
  }
});

test("presentation helpers do not mutate inputs", () => {
  const status = getCourseStatus("IM1", units, lessons, progress);
  const navigation = getCourseNavigation("IM1", units, lessons, progress);
  const statusSnapshot = structuredClone(status);
  const navigationSnapshot = structuredClone(navigation);

  getSidebarCoursePresentation(status, navigation);
  assert.deepEqual(status, statusSnapshot);
  assert.deepEqual(navigation, navigationSnapshot);
});
