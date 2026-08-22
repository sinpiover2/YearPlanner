import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDeliverablesAssignmentOverview,
  buildDeliverablesOverview,
  getNextInstructionalDate,
  getSynergyStatus,
  getSynergyStatusPatch,
  resolveSessionIdentity,
} from "../src/utils/deliverablesOverview.js";

const sections = [
  { SectionID: "M8-P1", SectionName: "Math 8 P1", CourseID: "M8", Period: 1 },
  { SectionID: "IM1-P5", SectionName: "Math 1 P5", CourseID: "IM1", Period: 5 },
];

test("next instructional date skips weekends and non-school days", () => {
  const calendar = [
    { Date: "2026-08-21T07:00:00.000Z", InstructionalDay: true },
    { Date: "2026-08-22T07:00:00.000Z", InstructionalDay: false },
    { Date: "2026-08-24T07:00:00.000Z", InstructionalDay: true },
  ];
  assert.equal(getNextInstructionalDate("2026-08-21", calendar), "2026-08-24");
});

test("Synergy status defaults to will-record and preserves both explicit outcomes", () => {
  assert.equal(getSynergyStatus({}), "will-record");
  assert.equal(getSynergyStatus({ enteredInSynergy: true }), "recorded");
  assert.equal(getSynergyStatus({ skipSynergy: true }), "not-recorded");
  assert.deepEqual(getSynergyStatusPatch("will-record"), {
    enteredInSynergy: false,
    skipSynergy: false,
  });
  assert.deepEqual(getSynergyStatusPatch("recorded"), {
    enteredInSynergy: true,
    skipSynergy: false,
  });
  assert.deepEqual(getSynergyStatusPatch("not-recorded"), {
    enteredInSynergy: false,
    skipSynergy: true,
  });
});

test("assignment overview groups exact titles by course and orders period rows", () => {
  const classGroups = buildDeliverablesOverview({
    sections: [
      ...sections,
      { SectionID: "M8-P3", SectionName: "Math 8 P3", CourseID: "M8", Period: 3 },
    ],
    todayKey: "2026-08-21",
    limit: 10,
    sessionStates: [
      { sessionId: "M8-P3-2026-08-20", state: { episodes: [{ id: "p3", title: "Transformers", isDeliverable: true, blocks: [{ type: "learning", text: "I can describe a transformation." }] }] } },
      { sessionId: "M8-P1-2026-08-21", state: { episodes: [{ id: "p1", title: "Transformers", isDeliverable: true, blocks: [{ type: "learning", text: "I can describe a transformation." }, { type: "learning", text: "I can justify my answer." }] }] } },
      { sessionId: "IM1-P5-2026-08-19", state: { episodes: [{ id: "im1", title: "Transformers", isDeliverable: true }] } },
    ],
  });
  const result = buildDeliverablesAssignmentOverview(classGroups);

  assert.deepEqual(result.map((course) => course.courseLabel), ["Math 1", "Math 8"]);
  assert.equal(result[1].assignments[0].title, "Transformers");
  assert.deepEqual(result[1].assignments[0].items.map((item) => item.period), [1, 3]);
  assert.equal(result[1].assignments[0].mostRecentDate, "2026-08-21");
  assert.deepEqual(result[1].assignments[0].learningGoals, [
    "I can describe a transformation.",
    "I can justify my answer.",
  ]);
});

test("assignment overview does not merge differently-cased or differently-named titles", () => {
  const result = buildDeliverablesAssignmentOverview([{
    courseId: "M8", courseLabel: "Math 8", items: [
      { title: "Transformers", effectiveDate: "2026-08-20", period: 1, sectionLabel: "P1" },
      { title: "transformers", effectiveDate: "2026-08-20", period: 2, sectionLabel: "P2" },
    ],
  }]);
  assert.equal(result[0].assignments.length, 2);
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
          { id: "e1", title: "Practice 1", isDeliverable: true, deliverableDueDate: "2026-08-20", enteredInSynergy: true, blocks: [
            { type: "learning", text: " I can explain my reasoning. " },
            { type: "learning", text: "I can explain my reasoning." },
            { type: "text", text: "Teacher note" },
          ] },
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
  assert.equal(result[0].items[0].skipSynergy, false);
  assert.equal(result[0].items[0].synergyStatus, "recorded");
  assert.deepEqual(result[0].items[0].learningGoals, ["I can explain my reasoning."]);
});

test("not-graded deliverables remain visible in class and assignment overviews", () => {
  const classGroups = buildDeliverablesOverview({
    sections,
    todayKey: "2026-08-21",
    limit: 10,
    sessionStates: [{
      sessionId: "M8-P1-2026-08-20",
      state: { episodes: [{
        id: "practice",
        title: "Ungraded practice",
        isDeliverable: true,
        skipSynergy: true,
      }] },
    }],
  });

  assert.equal(classGroups[0].items[0].skipSynergy, true);
  const assignments = buildDeliverablesAssignmentOverview(classGroups);
  assert.equal(assignments[0].assignments[0].title, "Ungraded practice");
  assert.equal(assignments[0].assignments[0].items[0].skipSynergy, true);
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
