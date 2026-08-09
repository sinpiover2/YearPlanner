import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlanningWritePayload,
  postPlanningAction,
} from "../src/api.js";
import {
  buildUnitPlanningSubmission,
  saveUnitPlanningOptimistically,
  updateUnitPlanningRecords,
} from "../src/utils/unitPlanningMutation.js";

test("Unit planning form submission accepts documented decimal policies", () => {
  assert.deepEqual(buildUnitPlanningSubmission("12.25", "0.25"), {
    ok: true,
    value: { requiredDays: 12.25, optionalDays: 0.25 },
  });
  assert.equal(buildUnitPlanningSubmission(0, 0).ok, false);
  assert.equal(buildUnitPlanningSubmission(1, -0.25).ok, false);
});

test("planning write payload includes the canonical action and token", () => {
  assert.deepEqual(
    buildPlanningWritePayload(
      "updateUnitPlanning",
      {
        action: "wrong",
        token: "wrong",
        unitId: "AMP-M8-U1",
        courseId: "M8",
        requiredDays: 12,
        optionalDays: 0,
      },
      "expected-token",
    ),
    {
      action: "updateUnitPlanning",
      token: "expected-token",
      unitId: "AMP-M8-U1",
      courseId: "M8",
      requiredDays: 12,
      optionalDays: 0,
    },
  );
});

test("frontend planning request sends the canonical token and action", async () => {
  let recorded;
  const result = await postPlanningAction(
    "updateUnitPlanning",
    { unitId: "U1", courseId: "M8", requiredDays: 12, optionalDays: 0 },
    "failed",
    {
      token: "expected-token",
      fetchImpl: async (url, options) => {
        recorded = { url, options };
        return { ok: true, json: async () => ({ ok: true }) };
      },
    },
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(recorded.options.method, "POST");
  assert.deepEqual(JSON.parse(recorded.options.body), {
    unitId: "U1",
    courseId: "M8",
    requiredDays: 12,
    optionalDays: 0,
    action: "updateUnitPlanning",
    token: "expected-token",
  });
});

test("optimistic Unit updates use composite CourseID and UnitID identity", () => {
  const units = [
    { UnitID: "U1", CourseID: "M8", RequiredDays: "", OptionalDays: "" },
    { UnitID: "U1", CourseID: "IM1", RequiredDays: 9, OptionalDays: 1 },
  ];
  const updated = updateUnitPlanningRecords(
    units,
    { unitId: "U1", courseId: "M8" },
    { requiredDays: 12, optionalDays: 0 },
  );

  assert.deepEqual(updated[0], {
    UnitID: "U1",
    CourseID: "M8",
    RequiredDays: 12,
    OptionalDays: 0,
  });
  assert.strictEqual(updated[1], units[1]);
});

test("rejected Unit planning request rolls back only the exact composite identity", async () => {
  const original = {
    units: [
      { UnitID: "U1", CourseID: "M8", RequiredDays: "", OptionalDays: "" },
      { UnitID: "U1", CourseID: "IM1", RequiredDays: 9, OptionalDays: 1 },
    ],
  };
  let state = structuredClone(original);
  const setPlannerData = (updater) => {
    state = updater(state);
  };

  await assert.rejects(
    saveUnitPlanningOptimistically({
      unit: original.units[0],
      planning: { requiredDays: 12, optionalDays: 0 },
      setPlannerData,
      request: async () => {
        assert.equal(state.units[0].RequiredDays, 12);
        assert.equal(state.units[1].RequiredDays, 9);
        throw new Error("server refused");
      },
    }),
    /server refused/,
  );

  assert.deepEqual(state, original);
});
