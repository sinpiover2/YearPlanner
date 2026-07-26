import { Fragment } from "react";
import SessionTile from "./SessionTile";

const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

// "Mon 3" — short weekday plus day-of-month, no month/comma. Computed here
// (not in planningCalendar.js) since it's a header-display concern only;
// day.label / day.date remain the source of truth.
function formatShortDayLabel(date) {
  return `${WEEKDAY_SHORT_FORMATTER.format(date)} ${date.getDate()}`;
}

// "Math 8" / "P1" — the label already arrives as one string (e.g.
// "Math 8 P1"); split on the last space so the period code sits on its own
// line without needing a separate field in the data model.
function splitSectionLabel(label) {
  const lastSpace = label.lastIndexOf(" ");
  if (lastSpace === -1) return [label, null];
  return [label.slice(0, lastSpace), label.slice(lastSpace + 1)];
}

function PlanningGrid({
  weekDays,
  sections,
  sessions,
  selectedDayKey,
  selectedSessionId,
  onSelectDay,
  onSelectSession,
}) {
  const teachingDays = weekDays.filter((day) => !day.shoulder);

  return (
    <div className="planning-week-grid">
      <div
        className="planning-corner"
        style={{ gridColumn: 1, gridRow: 1 }}
      />

      {teachingDays.map((day, dayIndex) => (
        <button
          type="button"
          className={[
            "planning-day-heading",
            day.active ? "active" : "",
            day.key === selectedDayKey ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={day.key}
          style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
          onClick={() => onSelectDay?.(day.key)}
          aria-pressed={day.key === selectedDayKey}
        >
          {formatShortDayLabel(day.date)}
          {day.alert ? <span className="planning-day-alert">•</span> : null}
        </button>
      ))}

      {sections.map((section, sectionIndex) => {
        const [sectionCourse, sectionPeriod] = splitSectionLabel(
          section.label,
        );

        return (
          <Fragment key={section.id}>
            <div
              className="planning-section-label"
              key={`${section.id}-label`}
              style={{ gridColumn: 1, gridRow: sectionIndex + 2 }}
            >
              <span className="planning-section-course">{sectionCourse}</span>
              {sectionPeriod ? (
                <span className="planning-section-period">
                  {sectionPeriod}
                </span>
              ) : null}
            </div>

            {teachingDays.map((day, dayIndex) => {
              const session = section.isPlaceholder
                ? null
                : sessions[`${section.id}-${day.key}`];

              return (
                <div
                  className={[
                    "planning-cell",
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
                  {section.isPlaceholder ? null : (
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
        );
      })}
    </div>
  );
}

export default PlanningGrid;
