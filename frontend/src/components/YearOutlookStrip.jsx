import { getCourseLabel } from "../App";

function YearOutlookStrip({ forecastedSections }) {
  if (forecastedSections.length === 0) return null;

  return (
    <div className="year-outlook-block">
      <div className="year-outlook-heading">
        <strong>Year Outlook</strong>
        <span>Quick scan by section</span>
      </div>

      <div className="year-outlook-strip" aria-label="Year outlook by section">
        {forecastedSections.map((forecast, index) => {
          const section = forecast.section ?? {};
          const stateClass = forecast.visualStateClass || "on-track";

          return (
            <div
              className={`year-outlook-segment ${stateClass}`}
              key={`outlook-${
                section.SectionID || `${section.CourseID}-${section.Period}`
              }`}
              title={`${getCourseLabel(section.CourseID)} Period ${
                section.Period || "—"
              }: ${forecast.state || "On Track"}`}
            >
              <span>
                {getCourseLabel(section.CourseID)} P{section.Period || "—"}
              </span>
              <strong>{forecast.state || "On Track"}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default YearOutlookStrip;
