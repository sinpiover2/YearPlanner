import assert from "node:assert/strict";
import test from "node:test";
import { buildCalendar, NON_STUDENT_RANGES, SOURCE, toCsv } from "./generate-svusd-2026-27.mjs";

const rows = buildCalendar();
const byDate = new Map(rows.map((row) => [row.Date, row]));

test("official calendar has 180 sequential student days", () => {
  const instructional = rows.filter((row) => row.InstructionalDay === "TRUE");
  assert.equal(instructional.length, 180);
  assert.deepEqual(instructional.map((row) => Number(row.SchoolDay)), Array.from({ length: 180 }, (_, index) => index + 1));
  assert.equal(instructional[0].Date, SOURCE.firstStudentDay);
  assert.equal(instructional.at(-1).Date, SOURCE.lastStudentDay);
});

test("weekends are omitted and every district closure is non-instructional", () => {
  assert.equal(rows.length, 211);
  for (const row of rows) {
    const weekday = new Date(`${row.Date}T12:00:00Z`).getUTCDay();
    assert.ok(weekday >= 1 && weekday <= 5);
  }
  for (const [first, last] of NON_STUDENT_RANGES) {
    for (const current = new Date(`${first}T12:00:00Z`); current <= new Date(`${last}T12:00:00Z`); current.setUTCDate(current.getUTCDate() + 1)) {
      const weekday = current.getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      const row = byDate.get(current.toISOString().slice(0, 10));
      assert.equal(row.InstructionalDay, "FALSE");
      assert.equal(row.SchoolDay, "");
    }
  }
});

test("SVMS-specific dated markers are preserved without inventing TBD events", () => {
  assert.equal(byDate.get("2026-11-06").Notes, "SVMS End of Trimester 1");
  assert.equal(byDate.get("2027-02-19").Notes, "SVMS End of Trimester 2");
  assert.match(byDate.get("2027-05-27").Notes, /SVMS End of Trimester 3/);
  assert.doesNotMatch(toCsv(rows), /CAASPP|Back to School Night|Open House/);
});
