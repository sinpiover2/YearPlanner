import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateActualDayValues,
  aggregatePlanningDayValues,
  formatPlanningDayValue,
  formatPlanningDayValueCompact,
  formatDays,
  getCompactPlanningDayDisplay,
  parseOptionalDays,
  parseActualDays,
  parsePlannedDays,
  parsePlanningDayValue,
  parseRequiredDays,
} from "../src/utils/plannerUtils.js";

test("actual-day parser accepts nonnegative finite values without rounding", () => {
  for (const [value, expected] of [
    [0, 0],
    [1.23456789, 1.23456789],
    [" 2.75 ", 2.75],
  ]) {
    assert.deepEqual(parseActualDays(value), {
      state: "known",
      value: expected,
    });
  }

  for (const value of [null, undefined, "", " \t\n "]) {
    assert.deepEqual(parseActualDays(value), {
      state: "unknown",
      value: null,
    });
  }
});

test("actual-day parser safely rejects unsupported, non-finite, and negative values", () => {
  const invalidValues = [
    true,
    false,
    [],
    [1],
    {},
    { value: 1 },
    Symbol("days"),
    1n,
    "not a number",
    NaN,
    Infinity,
    -Infinity,
    -0.5,
    " -2 ",
  ];

  for (const value of invalidValues) {
    assert.doesNotThrow(() => parseActualDays(value));
    const parsed = parseActualDays(value);
    assert.equal(parsed.state, "invalid");
    assert.equal(parsed.raw, value);
  }
});

test("actual-day aggregation sums only known values and reports data quality", () => {
  const values = [
    1.23456789,
    " 2.75 ",
    0,
    "",
    null,
    undefined,
    true,
    [],
    {},
    Symbol("days"),
    1n,
    "bad",
    NaN,
    Infinity,
    -Infinity,
    -1,
  ];
  const originalValues = [...values];

  assert.deepEqual(aggregateActualDayValues(values), {
    total: 3.98456789,
    count: 16,
    knownCount: 3,
    unknownCount: 3,
    invalidCount: 10,
    empty: false,
    complete: false,
    hasInvalidValues: true,
  });
  assert.deepEqual(values, originalValues);
});

test("generic parser distinguishes unknown, known, and invalid values", () => {
  for (const value of [null, undefined, "", "   ", "\t\n"]) {
    assert.deepEqual(parsePlanningDayValue(value), {
      state: "unknown",
      value: null,
    });
  }

  for (const [value, expected] of [
    [0, 0],
    ["0", 0],
    [2.5, 2.5],
    [-2, -2],
    [" 3.5 ", 3.5],
    ["-1", -1],
  ]) {
    assert.deepEqual(parsePlanningDayValue(value), {
      state: "known",
      value: expected,
    });
  }
});

test("generic parser rejects unsupported and non-finite values without coercion", () => {
  const invalidValues = [
    "one",
    NaN,
    Infinity,
    -Infinity,
    true,
    false,
    [],
    [1],
    {},
    { value: 1 },
    1n,
    Symbol("days"),
  ];

  for (const value of invalidValues) {
    const parsed = parsePlanningDayValue(value);
    assert.equal(parsed.state, "invalid");
    assert.equal(parsed.raw, value);
  }
});

test("RequiredDays policy permits only positive values", () => {
  assert.deepEqual(parseRequiredDays(null), { state: "unknown", value: null });
  assert.deepEqual(parseRequiredDays(1), { state: "known", value: 1 });
  assert.deepEqual(parseRequiredDays(" 2.5 "), { state: "known", value: 2.5 });
  assert.deepEqual(parseRequiredDays(0), { state: "invalid", raw: 0 });
  assert.deepEqual(parseRequiredDays(-1), { state: "invalid", raw: -1 });
});

test("OptionalDays policy permits zero and positive values", () => {
  assert.deepEqual(parseOptionalDays(""), { state: "unknown", value: null });
  assert.deepEqual(parseOptionalDays(0), { state: "known", value: 0 });
  assert.deepEqual(parseOptionalDays("0"), { state: "known", value: 0 });
  assert.deepEqual(parseOptionalDays(1.25), { state: "known", value: 1.25 });
  assert.deepEqual(parseOptionalDays(-0.5), {
    state: "invalid",
    raw: -0.5,
  });
});

test("PlannedDays policy requires positive half-day increments", () => {
  assert.deepEqual(parsePlannedDays(undefined), {
    state: "unknown",
    value: null,
  });
  assert.deepEqual(parsePlannedDays(0.5), { state: "known", value: 0.5 });
  assert.deepEqual(parsePlannedDays(" 2 "), { state: "known", value: 2 });
  assert.deepEqual(parsePlannedDays(0), { state: "invalid", raw: 0 });
  assert.deepEqual(parsePlannedDays(-0.5), {
    state: "invalid",
    raw: -0.5,
  });
  assert.deepEqual(parsePlannedDays(0.75), {
    state: "invalid",
    raw: 0.75,
  });
});

test("aggregation reports complete, incomplete, invalid, and empty sets", () => {
  assert.deepEqual(aggregatePlanningDayValues([1, "2", 0]), {
    total: 3,
    count: 3,
    knownCount: 3,
    unknownCount: 0,
    invalidCount: 0,
    empty: false,
    complete: true,
    hasInvalidValues: false,
  });

  assert.deepEqual(aggregatePlanningDayValues([1, "", null]), {
    total: 1,
    count: 3,
    knownCount: 1,
    unknownCount: 2,
    invalidCount: 0,
    empty: false,
    complete: false,
    hasInvalidValues: false,
  });

  assert.deepEqual(aggregatePlanningDayValues([1, "bad", undefined]), {
    total: 1,
    count: 3,
    knownCount: 1,
    unknownCount: 1,
    invalidCount: 1,
    empty: false,
    complete: false,
    hasInvalidValues: true,
  });

  assert.deepEqual(aggregatePlanningDayValues([]), {
    total: 0,
    count: 0,
    knownCount: 0,
    unknownCount: 0,
    invalidCount: 0,
    empty: true,
    complete: false,
    hasInvalidValues: false,
  });
});

test("aggregation accepts a named field policy", () => {
  assert.deepEqual(aggregatePlanningDayValues([0, 1, ""], parseRequiredDays), {
    total: 1,
    count: 3,
    knownCount: 1,
    unknownCount: 1,
    invalidCount: 1,
    empty: false,
    complete: false,
    hasInvalidValues: true,
  });
});

test("formatters preserve known zero and provide accessible compact wording", () => {
  const knownZero = parseOptionalDays(0);
  const unknown = parseOptionalDays("");
  const invalid = parseOptionalDays("bad");

  assert.equal(formatPlanningDayValue(knownZero), "0");
  assert.equal(formatPlanningDayValue(unknown), "Not planned");
  assert.equal(formatPlanningDayValue(invalid), "Invalid value");
  assert.equal(formatPlanningDayValueCompact(knownZero), "0");
  assert.equal(formatPlanningDayValueCompact(unknown), "—");
  assert.equal(formatPlanningDayValueCompact(invalid), "Invalid value");
  assert.deepEqual(getCompactPlanningDayDisplay(unknown), {
    text: "—",
    accessibleText: "Not planned",
  });
});

test("day formatting preserves zero and does not present missing or invalid data as zero", () => {
  assert.equal(formatDays(0), "0");
  assert.equal(formatDays(null), "—");
  assert.equal(formatDays("bad"), "—");
});

test("parsing and aggregation do not mutate inputs", () => {
  const invalidObject = { nested: { days: 2 } };
  const values = [invalidObject, " 1.5 ", null];
  const snapshot = structuredClone(values);

  const parsed = parsePlanningDayValue(invalidObject);
  const aggregate = aggregatePlanningDayValues(values);

  assert.equal(parsed.raw, invalidObject);
  assert.equal(aggregate.total, 1.5);
  assert.deepEqual(values, snapshot);
});
