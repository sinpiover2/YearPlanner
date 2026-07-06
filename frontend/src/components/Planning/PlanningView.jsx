import PlanningGrid from "./PlanningGrid";
import PlanningHeader from "./PlanningHeader";
import UnitShelf from "./UnitShelf";

function PlanningView({ planningModel }) {
  const { title, schoolDaysLabel, weekDays, sections, sessions, shelf } =
    planningModel;

  return (
    <section className="workspace-panel planning-workspace">
      <PlanningHeader title={title} schoolDaysLabel={schoolDaysLabel} />

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
