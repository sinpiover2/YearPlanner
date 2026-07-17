import UnitsView from "./UnitsView";
import ForecastView from "./ForecastView";
import PlanningView from "./PlanningView";
import LessonSessionView from "./LessonSessionView";

function WorkspaceHost({
  activeView,
  unitsWorkspaceModel,
  forecastWorkspaceModel,
  planningWorkspaceModel,
  lessonSessionWorkspaceModel,
}) {
  if (activeView === "planning") {
    return <PlanningView {...planningWorkspaceModel} />;
  }

  if (activeView === "lesson") {
    return (
      <LessonSessionView
        key={
          lessonSessionWorkspaceModel.activeLessonContext?.sessionId ??
          "lesson-session-prototype"
        }
        {...lessonSessionWorkspaceModel}
      />
    );
  }

  if (activeView === "units") {
    return <UnitsView {...unitsWorkspaceModel} />;
  }

  if (activeView === "forecast") {
    return <ForecastView {...forecastWorkspaceModel} />;
  }

  return null;
}

export default WorkspaceHost;
