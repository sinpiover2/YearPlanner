import { Fragment } from "react";
import SessionTile from "./SessionTile";

function PlanningGrid({
  weekDays,
  sections,
  sessions,
  selectedDayKey,
  selectedSessionId,
  onSelectDay,
  onSelectSession,
}) {
  const selectedTeachingDayIndex = weekDays
    .filter((day) => !day.shoulder)
    .findIndex((day) => day.key === selectedDayKey);
  const selectedGridColumn =
    selectedTeachingDayIndex < 0 ? null : selectedTeachingDayIndex + 3;

  return (
    <div className="planning-week-grid">
      <div
        className="planning-corner"
        style={{ gridColumn: 1, gridRow: 1 }}
      />

      {weekDays.map((day, dayIndex) => {
        const DayHeading = day.shoulder ? "div" : "button";

        return (
          <DayHeading
            type={day.shoulder ? undefined : "button"}
            className={[
              "planning-day-heading",
              day.shoulder ? "shoulder" : "",
              day.active ? "active" : "",
              day.key === selectedDayKey ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={day.key}
            style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
            onClick={day.shoulder ? undefined : () => onSelectDay?.(day.key)}
            aria-pressed={day.shoulder ? undefined : day.key === selectedDayKey}
          >
            {day.shoulder ? (
              <span className="planning-shoulder-date">
                {day.label.replace(", ", "\n")}
              </span>
            ) : (
              <>
                {day.label}
                {day.alert ? <span className="planning-day-alert">•</span> : null}
              </>
            )}
          </DayHeading>
        );
      })}

      {selectedGridColumn && sections.length ? (
        <div
          className="planning-selected-day-column"
          style={{
            gridColumn: selectedGridColumn,
            gridRow: `1 / span ${sections.length + 1}`,
          }}
          aria-hidden="true"
        />
      ) : null}

      {sections.map((section, sectionIndex) => (
        <Fragment key={section.id}>
          <div
            className="planning-section-label"
            key={`${section.id}-label`}
            style={{ gridColumn: 1, gridRow: sectionIndex + 2 }}
          >
            {section.label}
          </div>

          {weekDays.map((day, dayIndex) => {
            const session = sessions[`${section.id}-${day.key}`];

            return (
              <div
                className={[
                  "planning-cell",
                  day.shoulder ? "shoulder" : "",
                  day.active ? "active-day" : "",
                  day.key === selectedDayKey ? "selected-day" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={`${section.id}-${day.key}`}
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: sectionIndex + 2,
                }}
              >
                {day.shoulder ? (
                  <span className="planning-shoulder-dot" />
                ) : (
                  <SessionTile
                    session={session}
                    selected={session?.id === selectedSessionId}
                    onSelect={onSelectSession}
                  />
                )}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

export default PlanningGrid;
