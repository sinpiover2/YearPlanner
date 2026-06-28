import { Fragment } from "react";
import { getSectionTimeline } from "../App";
import { getCourseLabel, formatDays } from "../utils/plannerUtils";

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
        <h3>Year Timeline</h3>
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

          return (
            <Fragment
              key={`timeline-group-${
                section.SectionID || `${section.CourseID}-${section.Period}`
              }`}
            >
              {isFirstCourseRow && (
                <div className="unit-timeline-course-row">
                  <strong>{getCourseLabel(section.CourseID)}</strong>
                  <span aria-hidden="true" />
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

                <div
                  className={`unit-timeline-track course-${section.CourseID || "unknown"}`}
                >
                  <span
                    className="timeline-track-break winter-break"
                    aria-hidden="true"
                  />
                  <span
                    className="timeline-track-break spring-break"
                    aria-hidden="true"
                  />

                  {(() => {
                    let consumedRequiredDays = 0;

                    return timeline.courseUnits.map((unit) => {
                      const requiredDays = Number(unit.RequiredDays || 0);
                      const widthPercent =
                        timeline.totalTimelineDays > 0
                          ? (requiredDays / timeline.totalTimelineDays) * 100
                          : 0;

                      const completedInUnit = Math.min(
                        Math.max(
                          Number(timeline.completedRequiredDays || 0) -
                            consumedRequiredDays,
                          0,
                        ),
                        requiredDays,
                      );

                      const completedPercent =
                        requiredDays > 0
                          ? (completedInUnit / requiredDays) * 100
                          : 0;

                      consumedRequiredDays += requiredDays;

                      return (
                        <div
                          className="unit-timeline-block"
                          key={`${section.SectionID}-${unit.UnitID}`}
                          style={{ width: `${widthPercent}%` }}
                          title={`U${unit.UnitNumber}: ${unit.UnitTitle} · ${requiredDays} required days`}
                        >
                          <span
                            className="unit-timeline-block-fill"
                            style={{ width: `${completedPercent}%` }}
                            aria-hidden="true"
                          />
                          <span>U{unit.UnitNumber}</span>
                        </div>
                      );
                    });
                  })()}

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
                    className="unit-timeline-end-marker"
                    style={{ left: `${timeline.endPositionPercent}%` }}
                    title="Required finish"
                    aria-label="Required finish"
                  />

                  {(() => {
                    const projectedMarkerLeft =
                      timeline.projectedFinishPercent === null
                        ? null
                        : timeline.endPositionPercent === null
                          ? timeline.projectedFinishPercent
                          : Math.max(
                              timeline.projectedFinishPercent,
                              timeline.endPositionPercent,
                            );

                    // Keep the projected marker at the required finish when the plan is on time or early.
                    return projectedMarkerLeft === null ? null : (
                      <div
                        className="unit-timeline-projected-marker"
                        style={{ left: `${projectedMarkerLeft}%` }}
                        title="Projected finish"
                        aria-label="Projected finish"
                      />
                    );
                  })()}

                  <div
                    className="unit-timeline-marker"
                    style={{ left: `${timeline.currentPositionPercent}%` }}
                    title="Current position"
                    aria-label="Current position"
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
          Current
        </span>

        <span>
          <i className="legend-end-dot" />
          Required finish
        </span>

        <span>
          <i className="legend-projected-dot" />
          Projected finish
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
