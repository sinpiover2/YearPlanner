import TodayView from "./TodayView";
import UnitsView from "./UnitsView";
import ForecastView from "./ForecastView";
import PlanningView from "./PlanningView";
import LessonSessionView from "./LessonSessionView";

function WorkspaceHost({
  activeView,
  todayWorkspaceModel,
  unitsWorkspaceModel,
  forecastWorkspaceModel,
  planningWorkspaceModel,
  lessonSessionWorkspaceModel,
}) {
  if (activeView === "today") {
    return <TodayView {...todayWorkspaceModel} />;
  }

  if (activeView === "planning") {
    return <PlanningView {...planningWorkspaceModel} />;
  }

  if (activeView === "lesson") {
    return <LessonSessionView {...lessonSessionWorkspaceModel} />;
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
