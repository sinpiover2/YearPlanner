import { buildLessonPrintPayload } from "./lessonPrintPayload";

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

function formatDayLabel(date) {
  return date ? DAY_LABEL_FORMATTER.format(date) : "";
}

// Resolves one teaching day's parent-facing content for a single section.
// Reuses buildLessonPrintPayload — the same filtering "Print lesson" and
// "Print Day" already use — so a day only appears here if it has real
// authored content, and only title/deliverable text is read. Block text
// (the teacher's instructional detail and private notes) is never touched.
function buildDayEntry({ day, section, sessions, courseLabel, curriculumLessons }) {
  const session = sessions[`${section.id}-${day.key}`];
  if (!session?.planned) return null;

  const payload = buildLessonPrintPayload({
    sectionLabel: section.label,
    courseLabel,
    unitLabel: session.unitLabel,
    episodes: session.episodes,
    curriculumLessons,
  });

  if (!payload.episodes.length) return null;

  const deliverables = payload.episodes
    .filter((episode) => episode.isDeliverable)
    .map((episode) => episode.title)
    .filter(Boolean);

  const title =
    (session.title && session.title !== "Lesson" ? session.title : null) ??
    session.curriculumLabel ??
    null;

  if (!title && !deliverables.length) return null;

  return {
    dayKey: day.key,
    label: formatDayLabel(day.date),
    title,
    deliverables,
  };
}

// Builds the Weekly Communication draft for one section across the
// currently displayed Planning week. Reads only what Planning and Lesson
// Session already hold — no new data model, no re-entry.
export function buildWeeklyCommunicationDraft({
  section,
  weekTitle,
  weekDays,
  sessions,
  courseLabel,
  curriculumLessons,
}) {
  const teachingDays = (weekDays ?? []).filter((day) => !day.shoulder);

  const days = teachingDays
    .map((day) =>
      buildDayEntry({ day, section, sessions, courseLabel, curriculumLessons }),
    )
    .filter(Boolean);

  return {
    sectionLabel: section?.label ?? "",
    weekTitle: weekTitle ?? "",
    days,
    text: formatWeeklyCommunicationText({
      sectionLabel: section?.label,
      weekTitle,
      days,
    }),
  };
}

// Plain text only, deliberately unstyled, so it pastes cleanly into Monday
// Manager or any other communication tool without cleanup.
export function formatWeeklyCommunicationText({ sectionLabel, weekTitle, days }) {
  if (!days?.length) return "";

  const lines = [];
  const heading = [sectionLabel, weekTitle].filter(Boolean).join(" — ");

  if (heading) {
    lines.push(heading, "");
  }

  days.forEach((day, index) => {
    if (index > 0) lines.push("");
    lines.push(day.label);
    if (day.title) lines.push(day.title);
    day.deliverables.forEach((deliverable) => {
      lines.push(`Due: ${deliverable}`);
    });
  });

  return lines.join("\n");
}
