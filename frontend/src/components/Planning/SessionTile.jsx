function SessionTile({ session, selected = false, onSelect }) {
  if (!session) {
    return (
      <button className="planning-session-card empty" type="button">
        <span>Open time</span>
      </button>
    );
  }

  return (
    <button
      className={[
        "planning-session-card",
        session.planned ? "planned" : "unplanned",
        selected ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      onClick={() => onSelect?.(session)}
      aria-pressed={selected}
    >
      {session.planned ? (
        <>
          <span className="session-card-meta">
            <span className="session-status-dot" aria-label="Planned" />
          </span>

          <strong className="session-card-title">{session.title}</strong>

          {session.curriculumLabel ? (
            <span className="session-card-curriculum">
              Curriculum · {session.curriculumLabel}
            </span>
          ) : null}
        </>
      ) : (
        <span className="session-card-create">+ Lesson</span>
      )}
    </button>
  );
}

export default SessionTile;
