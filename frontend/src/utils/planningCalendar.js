import { isTrue } from "./plannerUtils";

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "numeric",
  day: "numeric",
});

const TITLE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const WEEKDAY_NAME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
});

const ISO_DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;

// School-calendar dates arrive from the API as ISO strings (a Sheets Date
// cell serialized with a timezone offset baked in, e.g.
// "2026-08-06T07:00:00.000Z" for Pacific midnight). Slicing the date
// prefix directly reads the calendar's intended day regardless of the
// viewer's browser timezone. Never round-trip these through `new
// Date(value)` + local getters or `toISOString()` — both can shift the
// day depending on where the code runs.
function toDateKey(value) {
  if (value instanceof Date) {
    return formatLocalKey(value);
  }

  if (typeof value === "string") {
    const match = value.match(ISO_DATE_PREFIX);
    if (match) return match[1];
  }

  return formatLocalKey(new Date(value));
}

function formatLocalKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekdayName(dateKey) {
  return WEEKDAY_NAME_FORMATTER.format(dateKeyToLocalDate(dateKey));
}

function toDate(value = new Date()) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const parsed = new Date(value);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getMonday(date) {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
}

function formatDayLabel(date) {
  return DAY_LABEL_FORMATTER.format(date);
}

// SchoolCalendar.SchoolDay is the authoritative official school-session
// number (e.g. 23) — it is read directly, never re-derived by counting rows.
function parseSchoolDayNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Map<dateKey, calendarEntry> — one pass over SchoolCalendar, sorted
// chronologically.
export function buildCalendarIndex(schoolCalendar = []) {
  const sorted = schoolCalendar
    .map((row) => ({ row, dateKey: toDateKey(row.Date) }))
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));

  const byDateKey = new Map();

  sorted.forEach(({ row, dateKey }) => {
    byDateKey.set(dateKey, {
      dateKey,
      instructionalDay: isTrue(row.InstructionalDay),
      dayType: row.DayType || null,
      event: row.Event || null,
      notes: row.Notes || null,
      schoolDayNumber: parseSchoolDayNumber(row.SchoolDay),
    });
  });

  return byDateKey;
}

// Map<DayOfWeek, patternRow> for O(1) weekday lookups.
export function buildScheduleIndex(schedulePatterns = []) {
  const byWeekday = new Map();

  schedulePatterns.forEach((row) => {
    byWeekday.set(row.DayOfWeek, row);
  });

  return byWeekday;
}

function sectionMeetsOnDate(section, dateKey, calendarEntry, scheduleIndex) {
  if (!calendarEntry?.instructionalDay) return false;

  const pattern = scheduleIndex.get(getWeekdayName(dateKey));
  if (!pattern) return false;

  return isTrue(pattern[section.BlockGroup]);
}

// Map<SectionID, Map<dateKey, courseSessionNumber>> — computed once across
// the whole school year so rendering never re-derives session numbers by
// re-scanning the calendar.
export function buildSectionMeetingMaps(sections = [], calendarIndex, scheduleIndex) {
  const orderedDateKeys = [...calendarIndex.keys()];
  const meetingMaps = new Map();

  sections.forEach((section) => {
    const sectionMeetings = new Map();
    let sessionCounter = 0;

    orderedDateKeys.forEach((dateKey) => {
      const calendarEntry = calendarIndex.get(dateKey);

      if (sectionMeetsOnDate(section, dateKey, calendarEntry, scheduleIndex)) {
        sessionCounter += 1;
        sectionMeetings.set(dateKey, sessionCounter);
      }
    });

    meetingMaps.set(section.SectionID, sectionMeetings);
  });

  return meetingMaps;
}

function buildSchoolDaysLabel(teachingDays) {
  const instructionalCount = teachingDays.filter(
    (day) => day.instructionalDay,
  ).length;

  if (instructionalCount === 0) {
    return "No school days this week";
  }

  const base = `${instructionalCount} school day${instructionalCount === 1 ? "" : "s"} this week`;

  const notableDay = teachingDays.find(
    (day) => !day.instructionalDay && day.event,
  );

  if (!notableDay) return base;

  const weekdayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(notableDay.date);

  return `${base} · ${notableDay.event} ${weekdayName}`;
}

export function getPlanningWeek({
  referenceDate = new Date(),
  calendarIndex = new Map(),
} = {}) {
  const today = toDate(new Date());
  const monday = getMonday(toDate(referenceDate));

  const weekDates = [
    addDays(monday, -3),
    monday,
    addDays(monday, 1),
    addDays(monday, 2),
    addDays(monday, 3),
    addDays(monday, 4),
    addDays(monday, 7),
  ];

  const weekDays = weekDates.map((date, index) => {
    const key = formatLocalKey(date);
    const calendarEntry = calendarIndex.get(key) ?? null;

    return {
      key,
      date,
      label: formatDayLabel(date),
      shoulder: index === 0 || index === 6,
      active: key === formatLocalKey(today),
      calendarEntry,
      instructionalDay: calendarEntry?.instructionalDay ?? false,
      schoolDayNumber: calendarEntry?.schoolDayNumber ?? null,
      event: calendarEntry?.event ?? null,
      notes: calendarEntry?.notes ?? null,
      dayType: calendarEntry?.dayType ?? null,
    };
  });

  const teachingDays = weekDays.filter((day) => !day.shoulder);

  return {
    title: `Week of ${TITLE_FORMATTER.format(monday)}`,
    schoolDaysLabel: buildSchoolDaysLabel(teachingDays),
    weekStart: monday,
    previousWeekDate: addDays(monday, -7),
    nextWeekDate: addDays(monday, 7),
    weekDays,
    teachingDays,
  };
}
