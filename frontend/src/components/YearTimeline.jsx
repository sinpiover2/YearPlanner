import { Fragment, useState } from "react";
import { getSectionTimeline } from "../App";
import {
  getCourseLabel,
  formatDays,
  getOutcomeList,
} from "../utils/plannerUtils";

function YearTimeline({
  forecastedSections,
  units,
  lessons,
  timelineSyncSummaries,
}) {
  const [selectedUnit, setSelectedUnit] = useState(null);

  const detailStatus = (() => {
    if (!selectedUnit) return "";

    if (Number(selectedUnit.remainingInUnit || 0) === 0) {
      return "Unit complete";
    }

    if (selectedUnit.forecastState === "On Track") {
      return "On pace";
    }

    if (
      selectedUnit.forecastState === "Monitoring" ||
      selectedUnit.forecastState === "Needs Attention"
    ) {
      return "Recoverable with attention";
    }

    if (selectedUnit.forecastState === "Buffer Exhausted") {
      return "Schedule adjustment needed";
    }

    return "Recoverable with attention";
  })();

  const detailStatusTone = (() => {
    if (!selectedUnit) return "monitoring";
    if (Number(selectedUnit.remainingInUnit || 0) === 0) return "on-track";

    if (selectedUnit.forecastState === "On Track") return "on-track";
    if (selectedUnit.forecastState === "Needs Attention") {
      return "needs-attention";
    }
    if (selectedUnit.forecastState === "Buffer Exhausted") {
      return "buffer-exhausted";
    }

    return "monitoring";
  })();

  const unitOutcomes = (() => {
    if (!selectedUnit) return [];

    const limitLength = (value, maxLength = 96) => {
      const normalized = String(value || "")
        .replace(/\s+/g, " ")
        .trim();
      if (normalized.length <= maxLength) return normalized;
      return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
    };

    const normalizeOutcomeField = (value) => {
      if (Array.isArray(value)) {
        return value
          .map((entry) => String(entry || "").trim())
          .filter(Boolean)
          .join("|");
      }

      return value;
    };

    const outcomes = lessons
      .filter((lesson) => lesson.UnitID === selectedUnit.UnitID)
      .flatMap((lesson) => {
        const outcomeCandidates = [
          lesson.KeyOutcome,
          lesson.keyOutcome,
          lesson.KeyOutcomes,
          lesson.keyOutcomes,
          lesson.Outcome,
          lesson.Outcomes,
          lesson.Objective,
          lesson.Objectives,
        ];

        return outcomeCandidates.flatMap((candidate) =>
          getOutcomeList(normalizeOutcomeField(candidate)),
        );
      })
      .map(limitLength)
      .filter(Boolean);

    return [...new Set(outcomes)].slice(0, 4);
  })();

  const unitPurpose = (() => {
    if (!selectedUnit) return "";

    const purposeCandidates = [
      selectedUnit.Purpose,
      selectedUnit.purpose,
      selectedUnit.UnitPurpose,
      selectedUnit.unitPurpose,
      selectedUnit.InstructionalPurpose,
      selectedUnit.instructionalPurpose,
    ];

    return purposeCandidates
      .map((value) => String(value || "").trim())
      .find(Boolean);
  })();

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
                          className={`unit-timeline-block ${
                            selectedUnit?.UnitID === unit.UnitID
                              ? "unit-timeline-selected"
                              : ""
                          }`}
                          key={`${section.SectionID}-${unit.UnitID}`}
                          style={{ width: `${widthPercent}%` }}
                          title={`U${unit.UnitNumber}: ${unit.UnitTitle}
                          Required: ${requiredDays} days
                          Completed here: ${completedInUnit} days
                          Remaining here: ${Math.max(0, requiredDays - completedInUnit)} days`}
                          onClick={() =>
                            setSelectedUnit({
                              ...unit,
                              section,
                              forecastState: forecast.state,
                              completedInUnit,
                              remainingInUnit: Math.max(
                                0,
                                requiredDays - completedInUnit,
                              ),
                            })
                          }
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
                    title={`Required finish: ${timeline.totalRequiredDays} required days`}
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
                        title={`Projected finish if current pace continues`}
                        aria-label="Projected finish"
                      />
                    );
                  })()}

                  <div
                    className="unit-timeline-marker"
                    style={{ left: `${timeline.currentPositionPercent}%` }}
                    title={`Current: ${timeline.completedRequiredDays} of ${timeline.totalRequiredDays} required days completed`}
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

      {selectedUnit && (
        <div className="timeline-detail-panel" aria-live="polite">
          <div className="timeline-detail-layout">
            <div className="timeline-detail-left-column">
              <div className="timeline-detail-panel-header">
                <strong>Selected Unit</strong>
                <button
                  type="button"
                  className="timeline-detail-clear"
                  onClick={() => setSelectedUnit(null)}
                >
                  Clear selection
                </button>
              </div>

              <dl className="timeline-detail-facts">
                <dt>Course</dt>
                <dd>{getCourseLabel(selectedUnit.section?.CourseID)}</dd>

                <dt>Period</dt>
                <dd>P{selectedUnit.section?.Period || "-"}</dd>

                <dt>Unit</dt>
                <dd>
                  U{selectedUnit.UnitNumber || "-"} —{" "}
                  {selectedUnit.UnitTitle || "-"}
                </dd>
              </dl>

              <div className="timeline-detail-divider" aria-hidden="true" />

              <div
                className="timeline-detail-stats"
                aria-label="Pacing summary"
              >
                <div className="timeline-detail-stat-card">
                  <span>Required</span>
                  <strong>{Number(selectedUnit.RequiredDays || 0)}</strong>
                </div>

                <div className="timeline-detail-stat-card">
                  <span>Completed</span>
                  <strong>{Number(selectedUnit.completedInUnit || 0)}</strong>
                </div>

                <div className="timeline-detail-stat-card">
                  <span>Remaining</span>
                  <strong>{Number(selectedUnit.remainingInUnit || 0)}</strong>
                </div>
              </div>

              <p
                className={`timeline-detail-status-pill ${detailStatusTone}`}
                aria-label={`Status: ${detailStatus}`}
              >
                {detailStatus}
              </p>
            </div>

            <div className="timeline-detail-right-column">
              <div className="timeline-detail-right-stack">
                {unitOutcomes.length > 0 && (
                  <section className="timeline-detail-section timeline-detail-outcomes">
                    <h4>Main outcomes</h4>
                    <ul>
                      {unitOutcomes.map((outcome, index) => (
                        <li key={`timeline-outcome-${index}`}>{outcome}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {unitPurpose && (
                  <section className="timeline-detail-section timeline-detail-purpose">
                    <h4>Purpose</h4>
                    <p>{unitPurpose}</p>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default YearTimeline;
