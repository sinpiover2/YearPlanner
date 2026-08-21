import { toDateKey } from "./planningCalendar.js";

export function getNextInstructionalDate(dateKey, schoolCalendar = []) {
  return (
    schoolCalendar
      .filter((day) => {
        const active = day.InstructionalDay === true ||
          String(day.InstructionalDay).toLowerCase() === "true";
        return active && toDateKey(day.Date) > dateKey;
      })
      .map((day) => toDateKey(day.Date))
      .sort()[0] ?? null
  );
}

export function resolveSessionIdentity(sessionId, sections = []) {
  const section = sections.find((candidate) =>
    sessionId.startsWith(`${candidate.SectionID}-`),
  );
  if (!section) return null;

  const dateKey = sessionId.slice(String(section.SectionID).length + 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  return { section, dateKey };
}

export function buildDeliverablesOverview({
  sessionStates = [],
  sections = [],
  todayKey,
  limit = 10,
}) {
  const groups = sections.map((section) => ({
    sectionId: section.SectionID,
    sectionLabel: section.SectionName || section.Period || section.SectionID,
    period: section.Period ?? null,
    items: [],
  }));
  const groupBySectionId = new Map(groups.map((group) => [group.sectionId, group]));

  sessionStates.forEach(({ sessionId, state }) => {
    const identity = resolveSessionIdentity(sessionId, sections);
    if (!identity) return;
    const group = groupBySectionId.get(identity.section.SectionID);

    (state?.episodes ?? []).forEach((episode) => {
      if (!episode.isDeliverable || !episode.title?.trim()) return;
      const dueDate = episode.deliverableDueDate || null;
      const effectiveDate = dueDate || identity.dateKey;
      if (effectiveDate > todayKey) return;

      group.items.push({
        id: `${sessionId}:${episode.id}`,
        sessionId,
        episodeId: episode.id,
        title: episode.title.trim(),
        lessonDate: identity.dateKey,
        dueDate,
        effectiveDate,
        dateSource: dueDate ? "Due date" : "Lesson date",
        enteredInSynergy: Boolean(episode.enteredInSynergy),
      });
    });
  });

  groups.forEach((group) => {
    group.items.sort((left, right) =>
      right.effectiveDate.localeCompare(left.effectiveDate) ||
      right.lessonDate.localeCompare(left.lessonDate) ||
      left.title.localeCompare(right.title),
    );
    if (Number.isFinite(limit)) group.items = group.items.slice(0, limit);
  });

  return groups.filter((group) => group.items.length > 0);
}
