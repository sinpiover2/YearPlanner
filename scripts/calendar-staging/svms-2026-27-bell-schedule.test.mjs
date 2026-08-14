import assert from "node:assert/strict";
import test from "node:test";
import { BELL_SCHEDULE, MEETING_PATTERN } from "./generate-svms-2026-27-bell-schedule.mjs";
import { buildCalendar } from "./generate-svusd-2026-27.mjs";

const patternByDay = new Map(MEETING_PATTERN.map((row) => [row.DayOfWeek, row]));

test("verified weekly pattern includes every weekday", () => {
  assert.deepEqual([...patternByDay.keys()], ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  assert.equal(patternByDay.get("Monday").Period1, "TRUE");
  assert.equal(patternByDay.get("Monday").Period2, "FALSE");
  assert.equal(patternByDay.get("Tuesday").Period1, "FALSE");
  assert.equal(patternByDay.get("Tuesday").Period2, "TRUE");
  for (const weekday of ["Wednesday", "Thursday", "Friday"]) {
    for (let period = 1; period <= 6; period += 1) assert.equal(patternByDay.get(weekday)[`Period${period}`], "TRUE");
  }
});

test("bell entries preserve the exact published endpoints", () => {
  const find = (dayOfWeek, label) => BELL_SCHEDULE.find((row) => row.dayOfWeek === dayOfWeek && row.label === label);
  assert.deepEqual(find("Monday", "Period 1"), { dayOfWeek: "Monday", dayType: "Block Day - Odd Periods", label: "Period 1", startTime: "8:10 AM", endTime: "9:33 AM" });
  assert.equal(find("Wednesday", "Period 6").endTime, "12:30 PM");
  assert.equal(find("Friday", "Period 6").endTime, "2:40 PM");
});

test("instructional calendar rows carry the matching SVMS day type", () => {
  const calendar = buildCalendar();
  for (const row of calendar.filter((item) => item.InstructionalDay === "TRUE")) {
    const weekday = new Date(`${row.Date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
    assert.equal(row.DayType, patternByDay.get(weekday).DayType);
  }
  assert.equal(calendar.find((row) => row.Date === "2026-09-07").DayType, "No School");
});
