import { useMemo } from "react";
import PlanningGrid from "./PlanningGrid";
import PlanningHeader from "./PlanningHeader";
import UnitShelf from "./UnitShelf";

function PlanningView({
  planningModel,
  activeLessonContext,
  setActiveLessonContext,
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
        session.lessonId === activeLessonContext?.lessonId &&
        session.sectionId === activeLessonContext?.sectionId,
    ) ??
    sessionList[0] ??
    null;

  function handleSelectSession(session) {
    if (!session) return;

    setActiveLessonContext({
      lessonId: session.lessonId,
      sectionId: session.sectionId,
      unitId: session.unitId,
      source: "planning",
    });
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
