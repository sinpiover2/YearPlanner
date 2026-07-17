import { useEffect, useMemo, useState } from "react";
import PlanningGrid from "./PlanningGrid";
import PlanningHeader from "./PlanningHeader";
import UnitShelf from "./UnitShelf";
import LessonSessionPrintView from "../LessonSessionPrintView";
import { getLessonSessionState } from "../../utils/lessonSessionStorage";

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
  const { title, schoolDaysLabel, weekDays, sections, sessions, shelf } =
    planningModel;

  const sessionList = useMemo(() => Object.values(sessions), [sessions]);
  const [printDaySessions, setPrintDaySessions] = useState(null);

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

  useEffect(() => {
    if (!printDaySessions) return undefined;

    const frame = window.requestAnimationFrame(() => window.print());
    const clearPrintPacket = () => setPrintDaySessions(null);
    window.addEventListener("afterprint", clearPrintPacket, { once: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", clearPrintPacket);
    };
  }, [printDaySessions]);

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
        onPrintDay={() => setPrintDaySessions(printableDaySessions)}
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

        <UnitShelf shelf={shelf} />
      </div>

      {printDaySessions ? (
        <div className="planning-day-print-packet" aria-hidden="true">
          {printDaySessions.map(({ session, state }, index) => (
            <div
              className="planning-day-print-session"
              key={session.id}
              data-print-index={index}
            >
              <LessonSessionPrintView
                session={session}
                state={state}
                curriculumLessons={curriculumLessons}
                courseLabel={courseLabel}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default PlanningView;
