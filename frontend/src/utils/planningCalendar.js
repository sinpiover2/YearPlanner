const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "numeric",
  day: "numeric",
});

const TITLE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

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

function formatDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date) {
  return DAY_LABEL_FORMATTER.format(date);
}

export function getPlanningWeek(referenceDate = new Date()) {
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

  const weekDays = weekDates.map((date, index) => ({
    key: formatDayKey(date),
    date,
    label: formatDayLabel(date),
    shoulder: index === 0 || index === 6,
    active: formatDayKey(date) === formatDayKey(today),
  }));

  const teachingDays = weekDays.filter((day) => !day.shoulder);

  return {
    title: `Week of ${TITLE_FORMATTER.format(monday)}`,
    schoolDaysLabel: "School days pending calendar integration",
    weekStart: monday,
    previousWeekDate: addDays(monday, -7),
    nextWeekDate: addDays(monday, 7),
    weekDays,
    teachingDays,
  };
}
