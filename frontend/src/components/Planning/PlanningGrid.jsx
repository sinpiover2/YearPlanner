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
  return (
    <div className="planning-week-grid">
      <div className="planning-corner" />

      {weekDays.map((day) => {
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

      {sections.map((section) => (
        <Fragment key={section.id}>
          <div className="planning-section-label" key={`${section.id}-label`}>
            {section.label}
          </div>

          {weekDays.map((day) => {
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
