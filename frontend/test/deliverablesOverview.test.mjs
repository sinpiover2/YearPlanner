import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDeliverablesOverview,
  getNextInstructionalDate,
  resolveSessionIdentity,
} from "../src/utils/deliverablesOverview.js";

const sections = [
  { SectionID: "M8-P1", SectionName: "Math 8 P1", Period: 1 },
  { SectionID: "IM1-P5", SectionName: "Math 1 P5", Period: 5 },
];

test("next instructional date skips weekends and non-school days", () => {
  const calendar = [
    { Date: "2026-08-21T07:00:00.000Z", InstructionalDay: true },
    { Date: "2026-08-22T07:00:00.000Z", InstructionalDay: false },
    { Date: "2026-08-24T07:00:00.000Z", InstructionalDay: true },
  ];
  assert.equal(getNextInstructionalDate("2026-08-21", calendar), "2026-08-24");
});

test("session identity safely handles section IDs containing hyphens", () => {
  const identity = resolveSessionIdentity("IM1-P5-2026-08-19", sections);
  assert.equal(identity.section.SectionID, "IM1-P5");
  assert.equal(identity.dateKey, "2026-08-19");
});

test("overview includes only marked past deliverables and groups by class", () => {
  const result = buildDeliverablesOverview({
    sections,
    todayKey: "2026-08-21",
    limit: 10,
    sessionStates: [
      {
        sessionId: "M8-P1-2026-08-18",
        state: { episodes: [
          { id: "e1", title: "Practice 1", isDeliverable: true, deliverableDueDate: "2026-08-20", enteredInSynergy: true },
          { id: "e2", title: "Teacher demo", isDeliverable: false },
        ] },
      },
      {
        sessionId: "IM1-P5-2026-08-22",
        state: { episodes: [{ id: "e3", title: "Future quiz", isDeliverable: true }] },
      },
    ],
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].sectionId, "M8-P1");
  assert.equal(result[0].items[0].effectiveDate, "2026-08-20");
  assert.equal(result[0].items[0].dateSource, "Due date");
  assert.equal(result[0].items[0].enteredInSynergy, true);
});

test("blank due dates fall back to lesson date and per-class limit is enforced", () => {
  const result = buildDeliverablesOverview({
    sections,
    todayKey: "2026-08-21",
    limit: 1,
    sessionStates: [
      { sessionId: "M8-P1-2026-08-18", state: { episodes: [{ id: "a", title: "Older", isDeliverable: true }] } },
      { sessionId: "M8-P1-2026-08-20", state: { episodes: [{ id: "b", title: "Newer", isDeliverable: true }] } },
    ],
  });
  assert.equal(result[0].items.length, 1);
  assert.equal(result[0].items[0].title, "Newer");
  assert.equal(result[0].items[0].dateSource, "Lesson date");
});
