import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const curriculum = JSON.parse(fs.readFileSync(path.join(root, "data/import-staging/amplify-m8.json"), "utf8"));

export const SECTIONS = [
  { SectionID: "M8-P1", BlockGroup: "Odd" },
  { SectionID: "M8-P2", BlockGroup: "Even" },
  { SectionID: "M8-P3", BlockGroup: "Odd" },
];

const TITLE_CORRECTIONS = new Map([
  ["AMP-M8-U6-I12", "8.6 Practice Day 1"],
]);

function parseCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => {
    const cells = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else quoted = !quoted;
      } else if (character === "," && !quoted) {
        cells.push(value);
        value = "";
      } else value += character;
    }
    cells.push(value);
    return cells;
  });
}

function readCalendar() {
  const table = parseCsv(fs.readFileSync(path.join(root, "data/calendar-staging/svusd-2026-27.csv"), "utf8"));
  const headers = table[0];
  return table.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function sectionMeets(section, row) {
  if (row.InstructionalDay !== "TRUE") return false;
  const weekday = new Date(`${row.Date}T12:00:00Z`).getUTCDay();
  if ([3, 4, 5].includes(weekday)) return true;
  if (weekday === 1) return section.BlockGroup === "Odd";
  if (weekday === 2) return section.BlockGroup === "Even";
  return false;
}

export function getItems() {
  return curriculum.units.flatMap((unit) =>
    unit.items.map((item) => ({
      UnitID: unit.unitId,
      UnitNumber: unit.unitNumber,
      UnitTitle: unit.title,
      LessonID: item.itemId,
      SortOrder: item.order ?? "",
      Type: item.type || "Lesson",
      LessonTitle: TITLE_CORRECTIONS.get(item.itemId) || item.title || item.subtitle || item.itemId,
      IsOptional: item.isOptional === true,
      PlacementRule: item.placementRule || "",
    })),
  );
}

export function buildPacing() {
  const calendar = readCalendar();
  const allItems = getItems();
  const requiredItems = allItems.filter((item) => !item.IsOptional);
  const optionalItems = allItems.filter((item) => item.IsOptional);
  const assignments = [];
  const boundaries = [];
  const buffers = [];

  for (const section of SECTIONS) {
    const meetings = calendar.filter((row) => sectionMeets(section, row));
    requiredItems.forEach((item, index) => {
      const meeting = meetings[index];
      assignments.push({
        SectionID: section.SectionID,
        BlockGroup: section.BlockGroup,
        CourseSession: String(index + 1),
        Date: meeting.Date,
        SchoolDay: meeting.SchoolDay,
        DayType: meeting.DayType,
        UnitID: item.UnitID,
        UnitNumber: String(item.UnitNumber),
        UnitTitle: item.UnitTitle,
        LessonID: item.LessonID,
        SortOrder: String(item.SortOrder),
        Type: item.Type,
        LessonTitle: item.LessonTitle,
        PlannedDays: "1",
      });
    });

    for (const unit of curriculum.units) {
      const rows = assignments.filter((row) => row.SectionID === section.SectionID && row.UnitID === unit.unitId);
      boundaries.push({
        SectionID: section.SectionID,
        BlockGroup: section.BlockGroup,
        UnitID: unit.unitId,
        UnitNumber: String(unit.unitNumber),
        UnitTitle: unit.title,
        RequiredItems: String(rows.length),
        PlannedStartDate: rows[0].Date,
        PlannedEndDate: rows.at(-1).Date,
      });
    }

    meetings.slice(requiredItems.length).forEach((meeting, index) => buffers.push({
      SectionID: section.SectionID,
      BlockGroup: section.BlockGroup,
      BufferNumber: String(index + 1),
      Date: meeting.Date,
      SchoolDay: meeting.SchoolDay,
      DayType: meeting.DayType,
      Status: "UNASSIGNED BUFFER",
    }));
  }

  const unscheduled = [
    ...optionalItems.map((item) => ({
      Category: "Optional imported item",
      UnitID: item.UnitID,
      LessonID: item.LessonID,
      Type: item.Type,
      Title: item.LessonTitle,
      Reason: "Excluded from initial required-item sequence",
    })),
    ...curriculum.units.map((unit) => ({
      Category: "Additional assessment day",
      UnitID: unit.unitId,
      LessonID: "",
      Type: "Assessment Day",
      Title: `8.${unit.unitNumber} Additional Assessment Day`,
      Reason: "Outside initial sequence by explicit user decision",
    })),
  ];

  return { assignments, boundaries, buffers, unscheduled, requiredItems, optionalItems };
}

function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function toCsv(rows, headers) {
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`;
}

function write(name, rows, headers) {
  const output = path.join(root, "data/pacing-staging", name);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, toCsv(rows, headers));
  return output;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const result = buildPacing();
  const outputs = [
    write("m8-required-item-pacing-2026-27.csv", result.assignments, ["SectionID", "BlockGroup", "CourseSession", "Date", "SchoolDay", "DayType", "UnitID", "UnitNumber", "UnitTitle", "LessonID", "SortOrder", "Type", "LessonTitle", "PlannedDays"]),
    write("m8-unit-boundaries-2026-27.csv", result.boundaries, ["SectionID", "BlockGroup", "UnitID", "UnitNumber", "UnitTitle", "RequiredItems", "PlannedStartDate", "PlannedEndDate"]),
    write("m8-buffer-days-2026-27.csv", result.buffers, ["SectionID", "BlockGroup", "BufferNumber", "Date", "SchoolDay", "DayType", "Status"]),
    write("m8-unscheduled-items-2026-27.csv", result.unscheduled, ["Category", "UnitID", "LessonID", "Type", "Title", "Reason"]),
  ];
  console.log(JSON.stringify({ outputs, assignments: result.assignments.length, boundaries: result.boundaries.length, buffers: result.buffers.length, unscheduled: result.unscheduled.length }));
}
