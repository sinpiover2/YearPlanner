function SessionTile({ session }) {
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

export default SessionTile;
