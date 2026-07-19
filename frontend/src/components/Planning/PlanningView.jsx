import { useEffect, useMemo } from "react";
import PlanningGrid from "./PlanningGrid";
import PlanningHeader from "./PlanningHeader";
import { getLessonSessionState } from "../../utils/lessonSessionStorage";
import { buildLessonPrintPayload } from "../../utils/lessonPrintPayload";
import { printLessonSessions } from "../../utils/combinedPrint";

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function PlanningView({
  planningModel,
  activeLessonContext,
  onOpenLessonSession,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
  curriculumLessons,
  courseLabel,
  selectedDayKey,
  onSelectDay,
}) {
  const { title, schoolDaysLabel, weekDays, sections, sessions } =
    planningModel;

  const sessionList = useMemo(() => Object.values(sessions), [sessions]);

  const selectedSession =
    sessionList.find(
      (session) =>
        session.id === activeLessonContext?.sessionId,
    ) ?? null;
  const selectedDay = weekDays.find((day) => day.key === selectedDayKey) ?? null;

  const printableDaySessions = sections
    .map((section) => sessions[`${section.id}-${selectedDayKey}`])
    .filter((session) => session?.planned)
    .map((session) => ({
      session,
      state: getLessonSessionState(session.id),
    }))
    .filter(({ state }) => state);

  useEffect(() => {
    const teachingDays = weekDays.filter((day) => !day.shoulder);

    onSelectDay((current) => {
      if (teachingDays.some((day) => day.key === current)) return current;

      const currentWeekday = current
        ? new Date(`${current}T00:00:00`).getDay()
        : null;

      return (
        teachingDays.find((day) => day.date.getDay() === currentWeekday)?.key ??
        teachingDays.find((day) => day.active)?.key ??
        teachingDays[0]?.key
      );
    });
  }, [onSelectDay, weekDays]);

  // Gathers every printable Lesson Session for the selected day and POSTs
  // them to the same Apps Script combined-print endpoint "Print lesson"
  // uses, so the browser opens exactly one printable document: lesson,
  // roster, lesson, roster, ... The Apps Script owns all HTML, CSS,
  // pagination, and roster lookup; React only builds the payloads.
  function handlePrintDay() {
    if (!printableDaySessions.length) return;

    const entries = printableDaySessions.map(({ session, state }) => ({
      sectionId: session.sectionId,
      sessionDate: session.dayKey,
      lessonPayload: buildLessonPrintPayload({
        sectionLabel: session.sectionLabel,
        courseLabel,
        unitLabel: session.unitLabel,
        episodes: state.episodes,
        curriculumLessons,
      }),
    }));

    printLessonSessions(entries);
  }

  function handleSelectSession(session) {
    if (!session) return;

    onSelectDay(session.dayKey);

    const lessonSessionContext = {
      sessionId: session.id,
      lessonId: session.lessonId,
      sectionId: session.sectionId,
      sectionLabel: session.sectionLabel,
      unitId: session.unitId,
      date: session.dayKey,
      title: session.title,
      source: "planning",
    };

    onOpenLessonSession?.(lessonSessionContext);
  }

  return (
    <section className="workspace-panel planning-workspace">
      <PlanningHeader
        title={title}
        schoolDaysLabel={schoolDaysLabel}
        onPreviousWeek={onPreviousWeek}
        onNextWeek={onNextWeek}
        onJumpToToday={() => {
          onSelectDay(getLocalDayKey());
          onJumpToToday();
        }}
        onPrintDay={handlePrintDay}
        canPrintDay={printableDaySessions.length > 0}
        printDayLabel={
          selectedDay
            ? new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
                selectedDay.date,
              )
            : "Day"
        }
      />

      <div className="planning-board">
        <PlanningGrid
          weekDays={weekDays}
          sections={sections}
          sessions={sessions}
          selectedDayKey={selectedDayKey}
          selectedSessionId={selectedSession?.id}
          onSelectDay={onSelectDay}
          onSelectSession={handleSelectSession}
        />
      </div>
    </section>
  );
}

export default PlanningView;
