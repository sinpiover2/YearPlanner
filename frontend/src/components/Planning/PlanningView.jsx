import { useMemo } from "react";
import PlanningGrid from "./PlanningGrid";
import PlanningHeader from "./PlanningHeader";
import UnitShelf from "./UnitShelf";

function PlanningView({
  planningModel,
  activeLessonContext,
  onOpenLessonSession,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
}) {
  const { title, schoolDaysLabel, weekDays, sections, sessions, shelf } =
    planningModel;

  const sessionList = useMemo(() => Object.values(sessions), [sessions]);

  const selectedSession =
    sessionList.find(
      (session) =>
        session.id === activeLessonContext?.sessionId,
    ) ??
    sessionList[0] ??
    null;

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
    </section>
  );
}

export default PlanningView;
