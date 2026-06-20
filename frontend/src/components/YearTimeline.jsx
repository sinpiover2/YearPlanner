import { Fragment } from "react";
import { getSectionTimeline, getCourseLabel, formatDays } from "../App";

function YearTimeline({
  forecastedSections,
  units,
  lessons,
  timelineSyncSummaries,
}) {
  if (forecastedSections.length === 0) return null;

  return (
    <section className="unit-timeline-section">
      <div className="unit-timeline-heading">
        <div>
          <h3>Year Timeline</h3>
          <p>Unit pacing by section. Cards below remain the decision layer.</p>
        </div>
      </div>

      <div className="timeline-axis" aria-hidden="true">
        <span>Aug</span>
        <span>Sep</span>
        <span>Oct</span>
        <span>Nov</span>
        <span>Dec</span>
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
      </div>

      <div className="unit-timeline-list">
        {forecastedSections.map((forecast, index) => {
          const timeline = getSectionTimeline(forecast, units, lessons);
          const section = timeline.section ?? {};
          const previousForecast = forecastedSections[index - 1];
          const isFirstCourseRow =
            previousForecast?.section?.CourseID !== section.CourseID;
          const courseSyncSummary = timelineSyncSummaries.find(
            (summary) => summary.courseId === section.CourseID,
          );

          return (
            <Fragment
              key={`timeline-group-${
                section.SectionID || `${section.CourseID}-${section.Period}`
              }`}
            >
              {isFirstCourseRow && (
                <div className="unit-timeline-course-row">
                  <strong>{getCourseLabel(section.CourseID)}</strong>
                  <span>{courseSyncSummary?.message}</span>
                </div>
              )}

              <div className="unit-timeline-row">
                <div className="unit-timeline-label">
                  <strong>P{section.Period || "—"}</strong>
                  <span>{forecast.state}</span>
                  <em className="unit-timeline-drift">
                    {forecast.variance === 0
                      ? "On pace"
                      : `${formatDays(Math.abs(forecast.variance))}d ${
                          forecast.variance > 0 ? "behind" : "ahead"
                        }`}
                  </em>
                </div>

                <div className="unit-timeline-track">
                  <span
                    className="timeline-track-break winter-break"
                    aria-hidden="true"
                  />
                  <span
                    className="timeline-track-break spring-break"
                    aria-hidden="true"
                  />

                  {timeline.courseUnits.map((unit) => {
                    const requiredDays = Number(unit.RequiredDays || 0);
                    const widthPercent =
                      timeline.totalTimelineDays > 0
                        ? (requiredDays / timeline.totalTimelineDays) * 100
                        : 0;

                    return (
                      <div
                        className="unit-timeline-block"
                        key={`${section.SectionID}-${unit.UnitID}`}
                        style={{ width: `${widthPercent}%` }}
                        title={`U${unit.UnitNumber}: ${unit.UnitTitle} · ${requiredDays} required days`}
                      >
                        <span>U{unit.UnitNumber}</span>
                      </div>
                    );
                  })}

                  {timeline.bufferDays > 0 && (
                    <div
                      className="unit-timeline-buffer"
                      style={{
                        width: `${
                          timeline.totalTimelineDays > 0
                            ? (timeline.bufferDays /
                                timeline.totalTimelineDays) *
                              100
                            : 0
                        }%`,
                      }}
                      title={`${timeline.bufferDays} buffer days`}
                    >
                      <span>buf</span>
                    </div>
                  )}

                  <div
                    className="unit-timeline-planned-marker"
                    style={{ left: `${timeline.expectedPositionPercent}%` }}
                    title="Expected pace line"
                    aria-label="Expected pace"
                  />

                  <div
                    className="unit-timeline-marker"
                    style={{ left: `${timeline.currentPositionPercent}%` }}
                    title="You are here"
                    aria-label="You are here"
                  />
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="unit-timeline-legend" aria-label="Timeline legend">
        <span>
          <i className="legend-dot" />
          You are here
        </span>

        <span>
          <i className="legend-planned-dot" />
          Expected pace
        </span>

        <span>
          <i className="legend-buffer" />
          Buffer days
        </span>
      </div>
    </section>
  );
}

export default YearTimeline;
