import assert from "node:assert/strict";
import test from "node:test";

import {
  buildForecastModel,
  getSectionForecast,
  getSectionTimeline,
} from "../src/utils/forecastModel.js";
import { getForecastCardSummary } from "../src/utils/forecastCardUtils.js";
import { getProjectedUnits } from "../src/utils/plannerUtils.js";

const section = { SectionID: "S1", CourseID: "IM1", Period: 1, Active: true };
const units = [
  { UnitID: "U1", CourseID: "IM1", UnitNumber: 1, SortOrder: 1, RequiredDays: 4, OptionalDays: 0 },
  { UnitID: "U2", CourseID: "IM1", UnitNumber: 2, SortOrder: 2, RequiredDays: 6, OptionalDays: 2 },
];
const lessons = [
  { LessonID: "L1", UnitID: "U1", CourseID: "IM1", SortOrder: 1, LessonNumber: 1, PlannedDays: 1 },
  { LessonID: "L2", UnitID: "U1", CourseID: "IM1", SortOrder: 2, LessonNumber: 2, PlannedDays: 1 },
  { LessonID: "L3", UnitID: "U2", CourseID: "IM1", SortOrder: 1, LessonNumber: 3, PlannedDays: 2 },
];
const progress = [
  { CourseSectionID: "S1", LessonID: "L1", DayFraction: 1.5, Finished: true },
];
const getProgressForSection = (entries, selected) =>
  entries.filter((entry) => entry.CourseSectionID === selected.SectionID);

function forecast(overrides = {}) {
  return getSectionForecast({
    section,
    units: overrides.units ?? units,
    lessons: overrides.lessons ?? lessons,
    dailyProgress: overrides.progress ?? progress,
    getProgressForSection,
  });
}

test("fully planned forecast retains established calculations and explicit optional zero", () => {
  const result = forecast();
  assert.equal(result.dataComplete, true);
  assert.equal(result.actualDays, 1.5);
  assert.equal(result.plannedDaysCompleted, 1);
  assert.equal(result.variance, 0.5);
  assert.equal(result.bufferDays, 2);
  assert.equal(result.currentUnitOptionalDays, 0);
  assert.equal(result.state, "Monitoring");
  assert.ok(Number.isFinite(result.projectedFinishPercent));
});

test("unknown and invalid planning values withhold dependent forecast interpretation", () => {
  for (const [RequiredDays, planningState] of [["", "incomplete"], [0, "invalid"], ["bad", "invalid"]]) {
    const changedUnits = units.map((unit, index) => index === 1 ? { ...unit, RequiredDays } : unit);
    const result = forecast({ units: changedUnits });
    assert.equal(result.dataComplete, false);
    assert.equal(result.planningState, planningState);
    assert.equal(result.actualDays, 1.5);
    assert.equal(result.currentLesson.LessonID, "L2");
    for (const key of ["variance", "forecastShift", "projectedFinishVariance", "projectedFinishPercent", "bufferUsed", "bufferRemaining", "projectionState"]) {
      assert.equal(result[key], null, key);
    }
    assert.equal(result.state, "Pacing unavailable");
    assert.equal(result.recoverabilityMessage, null);
  }
});

test("unknown or invalid completed PlannedDays never becomes zero", () => {
  for (const PlannedDays of ["", 0, -1, 0.75, "bad", Infinity]) {
    const changedLessons = lessons.map((lesson, index) => index === 0 ? { ...lesson, PlannedDays } : lesson);
    const result = forecast({ lessons: changedLessons });
    assert.equal(result.plannedDaysCompleted, null);
    assert.equal(result.variance, null);
    assert.equal(result.dataComplete, false);
  }
});

test("partial known totals are retained as metadata but not presented as complete", () => {
  const result = forecast({ units: [units[0], { ...units[1], RequiredDays: "", OptionalDays: "" }] });
  assert.equal(result.requiredDays.total, 4);
  assert.equal(result.requiredDays.complete, false);
  assert.equal(result.optionalDays.total, 0);
  assert.equal(result.optionalDays.complete, false);
  assert.equal(result.bufferDays, null);
});

test("timeline withholds normalized geometry when totals or preceding durations are unresolved", () => {
  const incompleteUnits = [units[0], { ...units[1], RequiredDays: "" }];
  const unitForecast = forecast({ units: incompleteUnits });
  const unitTimeline = getSectionTimeline(unitForecast, incompleteUnits, lessons);
  assert.equal(unitTimeline.dataComplete, false);
  assert.equal(unitTimeline.totalTimelineDays, null);
  assert.equal(unitTimeline.currentPositionPercent, null);

  const changedLessons = lessons.map((lesson, index) => index === 0 ? { ...lesson, PlannedDays: "" } : lesson);
  const lessonForecast = forecast({ lessons: changedLessons });
  const lessonTimeline = getSectionTimeline(lessonForecast, units, changedLessons);
  assert.equal(lessonTimeline.completedRequiredDays, null);
  assert.equal(lessonTimeline.currentPositionPercent, null);
});

test("forecast cards withhold pace, projection, runway, flexibility, and recommendations", () => {
  for (const [RequiredDays, wording] of [["", "Planning days incomplete"], [0, "Planning data invalid"]]) {
    const result = forecast({ units: [units[0], { ...units[1], RequiredDays }] });
    const summary = getForecastCardSummary(result);
    assert.equal(summary.state, "Pacing unavailable");
    assert.equal(summary.incompleteDataText, wording);
    assert.equal(summary.paceText, "Pacing unavailable");
    assert.equal(summary.runway, null);
    assert.equal(summary.projection, null);
    assert.equal(summary.flexibility, null);
    assert.equal(summary.recommendation, null);
    assert.match(summary.currentLessonText, /Lesson 2/);
  }
});

test("projected dates are valid only through the first unresolved Unit duration", () => {
  const calendar = Array.from({ length: 12 }, (_, index) => ({ Date: `D${index + 1}`, InstructionalDay: true }));
  const projected = getProjectedUnits([
    { ...units[0], RequiredDays: 2 },
    { ...units[1], RequiredDays: "" },
    { UnitID: "U3", CourseID: "IM1", SortOrder: 3, RequiredDays: 2 },
  ], calendar);
  assert.deepEqual([projected[0].projectedStart, projected[0].projectedEnd], ["D1", "D2"]);
  assert.equal(projected[1].projectedStart, null);
  assert.equal(projected[2].projectedStart, null);
});

test("forecast workspace reports incomplete/invalid data and does not mutate inputs", () => {
  const changedUnits = [units[0], { ...units[1], RequiredDays: "" }];
  const snapshots = [structuredClone(changedUnits), structuredClone(lessons), structuredClone(progress)];
  const model = buildForecastModel({ sections: [section], units: changedUnits, lessons, dailyProgress: progress, getProgressForSection });
  assert.equal(model.overallForecastMessage, "Planning days incomplete.");
  assert.match(model.overallForecastDetail, /Pacing unavailable/);
  assert.deepEqual(changedUnits, snapshots[0]);
  assert.deepEqual(lessons, snapshots[1]);
  assert.deepEqual(progress, snapshots[2]);
});
