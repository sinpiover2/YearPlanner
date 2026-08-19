import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ',') { row.push(cell); cell = ""; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const context = {
  Utilities: { parseCsv },
  isActiveRosterValue_: (value) => value === true || String(value).toLowerCase() === "true",
  compareRosterText_: (left, right) => String(left).localeCompare(String(right)),
};
vm.createContext(context);
vm.runInContext(
  readFileSync(new URL("../RosterUpdate.js", import.meta.url), "utf8"),
  context,
);

const headers = "Action,EnrollmentID,StudentID,LegalFirstName,LegalLastName,PreferredName,SectionID";
function snapshot() {
  return {
    sections: [
      { SectionID: "M8-P2", Active: true },
      { SectionID: "M8-P3", Active: true },
    ],
    students: [
      { StudentID: "STU-1", LegalFirstName: "Avery", LegalLastName: "Bennett", PreferredName: "", Active: true },
      { StudentID: "STU-2", LegalFirstName: "Mina", LegalLastName: "Delgado", PreferredName: "Mimi", Active: true },
    ],
    enrollments: [
      { EnrollmentID: "ENR-1", StudentID: "STU-1", SectionID: "M8-P2", Active: true },
      { EnrollmentID: "ENR-2", StudentID: "STU-2", SectionID: "M8-P3", Active: true },
    ],
  };
}
function plan(lines) {
  return context.rosterUpdateBuildPlan_([headers, ...lines].join("\n"), snapshot());
}

test("unchanged complete export is valid and produces no changes", () => {
  const result = plan([
    "KEEP,ENR-1,STU-1,Avery,Bennett,,M8-P2",
    "KEEP,ENR-2,STU-2,Mina,Delgado,Mimi,M8-P3",
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.changes), []);
});

test("move and name edit are separately visible in preview", () => {
  const result = plan([
    "KEEP,ENR-1,STU-1,Avery,Bennett,Ave,M8-P3",
    "KEEP,ENR-2,STU-2,Mina,Delgado,Mimi,M8-P3",
  ]);
  assert.equal(result.ok, true);
  assert.deepEqual(Array.from(result.changes, (change) => change.type), ["update-name", "move"]);
  assert.equal(result.summary.moves, 1);
  assert.equal(result.summary.nameChanges, 1);
});

test("removal must be explicit", () => {
  const explicit = plan([
    "REMOVE,ENR-1,STU-1,Avery,Bennett,,M8-P2",
    "KEEP,ENR-2,STU-2,Mina,Delgado,Mimi,M8-P3",
  ]);
  assert.equal(explicit.ok, true);
  assert.equal(explicit.summary.removals, 1);

  const omitted = plan(["KEEP,ENR-1,STU-1,Avery,Bennett,,M8-P2"]);
  assert.equal(omitted.ok, false);
  assert.match(omitted.errors.join(" "), /missing/);
});

test("addition requires blank IDs and a known section", () => {
  const result = plan([
    "KEEP,ENR-1,STU-1,Avery,Bennett,,M8-P2",
    "KEEP,ENR-2,STU-2,Mina,Delgado,Mimi,M8-P3",
    "ADD,,,Jordan,Calder,,M8-P2",
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.summary.additions, 1);

  const bad = plan([
    "KEEP,ENR-1,STU-1,Avery,Bennett,,M8-P2",
    "KEEP,ENR-2,STU-2,Mina,Delgado,Mimi,M8-P3",
    "ADD,ENR-X,,Jordan,Calder,,UNKNOWN",
  ]);
  assert.equal(bad.ok, false);
});

test("altered and duplicate enrollment IDs block the batch", () => {
  const altered = plan([
    "KEEP,ENR-X,STU-1,Avery,Bennett,,M8-P2",
    "KEEP,ENR-2,STU-2,Mina,Delgado,Mimi,M8-P3",
  ]);
  assert.equal(altered.ok, false);

  const duplicate = plan([
    "KEEP,ENR-1,STU-1,Avery,Bennett,,M8-P2",
    "KEEP,ENR-1,STU-1,Avery,Bennett,,M8-P2",
    "KEEP,ENR-2,STU-2,Mina,Delgado,Mimi,M8-P3",
  ]);
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.errors.join(" "), /duplicate/);
});
