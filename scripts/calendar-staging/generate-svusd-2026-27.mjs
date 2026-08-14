import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SOURCE = {
  district: "Scotts Valley Unified School District",
  title: "2026-2027 Student Calendar",
  approved: "2026-02-10",
  firstStudentDay: "2026-08-06",
  lastStudentDay: "2027-05-27",
};

export const NON_STUDENT_RANGES = [
  ["2026-09-07", "2026-09-07", "Labor Day"],
  ["2026-10-09", "2026-10-09", "Professional Development Day"],
  ["2026-10-12", "2026-10-12", "Indigenous Peoples Day"],
  ["2026-11-11", "2026-11-11", "Veterans Day"],
  ["2026-11-23", "2026-11-27", "Thanksgiving Break"],
  ["2026-12-21", "2027-01-01", "Winter Break"],
  ["2027-01-15", "2027-01-15", "Professional Development Day"],
  ["2027-01-18", "2027-01-18", "Martin Luther King Jr. Day"],
  ["2027-02-12", "2027-02-15", "Presidents Day Break"],
  ["2027-03-12", "2027-03-12", "Non-Student / Non-Staff Day"],
  ["2027-03-15", "2027-03-15", "Non-Student / Non-Staff Day"],
  ["2027-04-05", "2027-04-12", "Spring Break"],
];

const NOTES = new Map([
  ["2026-08-06", "First Student Day - Full Day"],
  ["2026-11-06", "SVMS End of Trimester 1"],
  ["2027-02-19", "SVMS End of Trimester 2"],
  ["2027-05-27", "Last Student Day; SVMS End of Trimester 3"],
]);

function date(value) {
  return new Date(`${value}T12:00:00Z`);
}

function key(value) {
  return value.toISOString().slice(0, 10);
}

function eachDate(first, last, callback) {
  for (const current = date(first); current <= date(last); current.setUTCDate(current.getUTCDate() + 1)) {
    callback(current);
  }
}

export function buildCalendar() {
  const closures = new Map();
  for (const [first, last, event] of NON_STUDENT_RANGES) {
    eachDate(first, last, (current) => {
      const weekday = current.getUTCDay();
      if (weekday >= 1 && weekday <= 5) closures.set(key(current), event);
    });
  }

  const rows = [];
  let schoolDay = 0;
  eachDate(SOURCE.firstStudentDay, SOURCE.lastStudentDay, (current) => {
    const weekday = current.getUTCDay();
    if (weekday === 0 || weekday === 6) return;
    const dateKey = key(current);
    const event = closures.get(dateKey) || "";
    if (!event) schoolDay += 1;
    rows.push({
      Date: dateKey,
      InstructionalDay: event ? "FALSE" : "TRUE",
      SchoolDay: event ? "" : String(schoolDay),
      DayType: event ? "No School" : "Regular",
      Event: event,
      Notes: NOTES.get(dateKey) || "",
    });
  });
  return rows;
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function toCsv(rows) {
  const headers = ["Date", "InstructionalDay", "SchoolDay", "DayType", "Event", "Notes"];
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const output = path.resolve(path.dirname(currentFile), "../../data/calendar-staging/svusd-2026-27.csv");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const rows = buildCalendar();
  fs.writeFileSync(output, toCsv(rows));
  console.log(JSON.stringify({ output, rows: rows.length, instructionalDays: rows.filter((row) => row.InstructionalDay === "TRUE").length }));
}
