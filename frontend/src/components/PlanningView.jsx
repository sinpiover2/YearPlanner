import { Fragment } from "react";

function SessionCard({ session }) {
  if (!session) {
    return (
      <button className="planning-session-card empty">
        <span>Open time</span>
      </button>
    );
  }

  const usedPercent = Math.min(100, (session.used / session.minutes) * 100);

  return (
    <button className={`planning-session-card ${session.status}`}>
      <span className="session-card-meta">
        <span>{session.core ? "·" : "↗"}</span>
        <span>{session.status}</span>
        <span className="session-status-dot" />
      </span>

      <strong>{session.title}</strong>

      {session.chips?.length ? (
        <span className="session-chip-row">
          {session.chips.map((chip) => (
            <span className="session-chip" key={chip}>
              {chip}
            </span>
          ))}
        </span>
      ) : null}

      <span className="session-composition-bar">
        <span style={{ width: `${usedPercent}%` }} />
      </span>

      <span className="session-card-footer">
        <span>
          {session.open || `${session.used} of ${session.minutes} min`}
        </span>
        {session.needs?.length ? (
          <span>{session.needs.join(" · ")}</span>
        ) : null}
      </span>
    </button>
  );
}

function PlanningView({ planningModel }) {
  const { title, schoolDaysLabel, weekDays, sections, sessions, shelf } =
    planningModel;

  return (
    <section className="workspace-panel planning-workspace">
      <header className="planning-header">
        <div className="planning-title-group">
          <p className="eyebrow">Planning</p>
          <h2>{title}</h2>
        </div>

        <div className="planning-controls">
          <button>‹</button>
          <button>Jump</button>
          <button>›</button>
        </div>

        <p className="planning-school-days">{schoolDaysLabel}</p>
      </header>

      <div className="planning-board">
        <div className="planning-week-grid">
          <div className="planning-corner" />

          {weekDays.map((day) => (
            <div
              className={[
                "planning-day-heading",
                day.shoulder ? "shoulder" : "",
                day.active ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={day.key}
            >
              {day.label}
              {day.alert ? <span className="planning-day-alert">•</span> : null}
            </div>
          ))}

          {sections.map((section) => (
            <Fragment key={section.id}>
              <div
                className="planning-section-label"
                key={`${section.id}-label`}
              >
                {section.label}
              </div>

              {weekDays.map((day) => {
                const session = sessions[`${section.id}-${day.key}`];

                return (
                  <div
                    className={["planning-cell", day.shoulder ? "shoulder" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    key={`${section.id}-${day.key}`}
                  >
                    <SessionCard session={session} />
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>

        <footer className="unit-shelf">
          <button className="unit-shelf-toggle">⌃</button>
          <span className="unit-shelf-label">{shelf.unitLabel}</span>

          <div className="unit-shelf-items">
            {shelf.items.map((item) => (
              <button className="unit-shelf-item" key={item.id}>
                {item.title}
              </button>
            ))}
          </div>

          <span className="unit-shelf-summary">{shelf.summary}</span>
        </footer>
      </div>
    </section>
  );
}

export default PlanningView;
