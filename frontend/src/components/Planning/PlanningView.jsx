import PlanningGrid from "./PlanningGrid";
import PlanningHeader from "./PlanningHeader";
import UnitShelf from "./UnitShelf";

function PlanningView({
  planningModel,
  onPreviousWeek,
  onNextWeek,
  onJumpToToday,
}) {
  const { title, schoolDaysLabel, weekDays, sections, sessions, shelf } =
    planningModel;

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
        />

        <UnitShelf shelf={shelf} />
      </div>
    </section>
  );
}

export default PlanningView;
