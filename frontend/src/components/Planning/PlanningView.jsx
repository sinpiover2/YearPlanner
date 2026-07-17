import { useEffect, useMemo, useState } from "react";
import PlanningGrid from "./PlanningGrid";
import PlanningHeader from "./PlanningHeader";
import UnitShelf from "./UnitShelf";
import LessonSessionPrintView from "../LessonSessionPrintView";
import { getLessonSessionState } from "../../utils/lessonSessionStorage";

function PlanningView({
  planningModel,
  activeLessonContext,
  onOpenLessonSession,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
  curriculumLessons,
  courseLabel,
}) {
  const { title, schoolDaysLabel, weekDays, sections, sessions, shelf } =
    planningModel;

  const sessionList = useMemo(() => Object.values(sessions), [sessions]);
  const [printDaySessions, setPrintDaySessions] = useState(null);

  const selectedSession =
    sessionList.find(
      (session) =>
        session.id === activeLessonContext?.sessionId,
    ) ??
    sessionList[0] ??
    null;

  const selectedDayKey =
    activeLessonContext?.date ??
    selectedSession?.dayKey ??
    weekDays.find((day) => !day.shoulder)?.key ??
    null;

  const printableDaySessions = sections
    .map((section) => sessions[`${section.id}-${selectedDayKey}`])
    .filter((session) => session?.planned)
    .map((session) => ({
      session,
      state: getLessonSessionState(session.id),
    }))
    .filter(({ state }) => state);

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
        onJumpToToday={onJumpToToday}
        onPrintDay={() => setPrintDaySessions(printableDaySessions)}
        canPrintDay={printableDaySessions.length > 0}
      />

      <div className="planning-board">
        <PlanningGrid
          weekDays={weekDays}
          sections={sections}
          sessions={sessions}
          selectedSessionId={selectedSession?.id}
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
