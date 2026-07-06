import TodayView from "./TodayView";
import UnitsView from "./UnitsView";
import ForecastView from "./ForecastView";
import TeacherDeskView from "./TeacherDeskView";
import LessonSessionView from "./LessonSessionView";
import PlanningView from "./PlanningView";

function WorkspaceHost({
  activeView,
  todayWorkspaceModel,
  unitsWorkspaceModel,
  forecastWorkspaceModel,
  teacherDeskWorkspaceModel,
  lessonSessionWorkspaceModel,
  planningWorkspaceModel,
}) {
  if (activeView === "today") {
    return <TodayView {...todayWorkspaceModel} />;
  }

  if (activeView === "teacherDesk") {
    return <TeacherDeskView {...teacherDeskWorkspaceModel} />;
  }

  if (activeView === "planning") {
    return <PlanningView {...planningWorkspaceModel} />;
  }

  if (activeView === "lessonSession") {
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
