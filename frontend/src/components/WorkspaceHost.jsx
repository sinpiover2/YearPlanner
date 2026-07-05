import TodayView from "./TodayView";
import UnitsView from "./UnitsView";
import ForecastView from "./ForecastView";
import TeacherDeskView from "./TeacherDeskView";

function WorkspaceHost({
  activeView,
  todayWorkspaceModel,
  unitsWorkspaceModel,
  forecastWorkspaceModel,
  teacherDeskWorkspaceModel,
}) {
  if (activeView === "today") {
    return <TodayView {...todayWorkspaceModel} />;
  }

  if (activeView === "teacherDesk") {
    return <TeacherDeskView {...teacherDeskWorkspaceModel} />;
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
