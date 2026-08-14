import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SOURCE = {
  school: "Scotts Valley Middle School",
  title: "2026-27 Bell Schedule",
  localFile: "Shared Resources/Extended - SVMS Bell Schedule 26.27.jpg",
};

const day = (dayOfWeek, dayType, entries) =>
  entries.map(([label, startTime, endTime]) => ({ dayOfWeek, dayType, label, startTime, endTime }));

export const BELL_SCHEDULE = [
  ...day("Monday", "Block Day - Odd Periods", [
    ["Period 1", "8:10 AM", "9:33 AM"], ["Break", "9:33 AM", "9:48 AM"],
    ["SSR", "9:51 AM", "10:23 AM"], ["Period 3", "10:26 AM", "11:49 AM"],
    ["Lunch", "11:49 AM", "12:19 PM"], ["Period 5", "12:22 PM", "1:45 PM"],
    ["ELT", "1:48 PM", "2:40 PM"],
  ]),
  ...day("Tuesday", "Block Day - Even Periods", [
    ["Period 2", "8:10 AM", "9:33 AM"], ["Break", "9:33 AM", "9:48 AM"],
    ["SSR", "9:51 AM", "10:23 AM"], ["Period 4", "10:26 AM", "11:49 AM"],
    ["Lunch", "11:49 AM", "12:19 PM"], ["Period 6", "12:22 PM", "1:45 PM"],
    ["ELT", "1:48 PM", "2:40 PM"],
  ]),
  ...day("Wednesday", "Short Day", [
    ["Period 1", "8:10 AM", "8:50 AM"], ["Period 2", "8:53 AM", "9:31 AM"],
    ["Period 3", "9:34 AM", "10:12 AM"], ["Break", "10:12 AM", "10:27 AM"],
    ["Period 4", "10:30 AM", "11:08 AM"], ["Period 5", "11:11 AM", "11:49 AM"],
    ["Period 6", "11:52 AM", "12:30 PM"],
  ]),
  ...["Thursday", "Friday"].flatMap((dayOfWeek) => day(dayOfWeek, "Full Day", [
    ["Period 1", "8:10 AM", "9:07 AM"], ["Period 2", "9:10 AM", "10:05 AM"],
    ["Break", "10:05 AM", "10:18 AM"], ["Period 3", "10:21 AM", "11:16 AM"],
    ["Period 4", "11:19 AM", "12:14 PM"], ["Lunch", "12:14 PM", "12:44 PM"],
    ["Period 5", "12:47 PM", "1:42 PM"], ["Period 6", "1:45 PM", "2:40 PM"],
  ])),
];

export const MEETING_PATTERN = [
  { DayOfWeek: "Monday", DayType: "Block Day - Odd Periods", Period1: "TRUE", Period2: "FALSE", Period3: "TRUE", Period4: "FALSE", Period5: "TRUE", Period6: "FALSE" },
  { DayOfWeek: "Tuesday", DayType: "Block Day - Even Periods", Period1: "FALSE", Period2: "TRUE", Period3: "FALSE", Period4: "TRUE", Period5: "FALSE", Period6: "TRUE" },
  { DayOfWeek: "Wednesday", DayType: "Short Day", Period1: "TRUE", Period2: "TRUE", Period3: "TRUE", Period4: "TRUE", Period5: "TRUE", Period6: "TRUE" },
  { DayOfWeek: "Thursday", DayType: "Full Day", Period1: "TRUE", Period2: "TRUE", Period3: "TRUE", Period4: "TRUE", Period5: "TRUE", Period6: "TRUE" },
  { DayOfWeek: "Friday", DayType: "Full Day", Period1: "TRUE", Period2: "TRUE", Period3: "TRUE", Period4: "TRUE", Period5: "TRUE", Period6: "TRUE" },
];

function csvCell(value) { return `"${String(value).replaceAll('"', '""')}"`; }
function toCsv(rows, headers) {
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")).join("\n")}\n`;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const outputDir = path.resolve(path.dirname(currentFile), "../../data/calendar-staging");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "svms-2026-27-bell-schedule.csv"), toCsv(BELL_SCHEDULE, ["dayOfWeek", "dayType", "label", "startTime", "endTime"]));
  fs.writeFileSync(path.join(outputDir, "svms-2026-27-meeting-pattern.csv"), toCsv(MEETING_PATTERN, ["DayOfWeek", "DayType", "Period1", "Period2", "Period3", "Period4", "Period5", "Period6"]));
  console.log(JSON.stringify({ bellEntries: BELL_SCHEDULE.length, meetingPatternRows: MEETING_PATTERN.length }));
}
