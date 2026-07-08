function SessionTile({ session, selected = false, onSelect }) {
  if (!session) {
    return (
      <button className="planning-session-card empty" type="button">
        <span>Open time</span>
      </button>
    );
  }

  const usedPercent = Math.min(100, (session.used / session.minutes) * 100);
  const hasOpenTime = Boolean(session.open);

  return (
    <button
      className={[
        "planning-session-card",
        session.status,
        selected ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      onClick={() => onSelect?.(session)}
      aria-pressed={selected}
    >
      <span className="session-card-meta">
        <span className="session-status-dot" aria-label={session.status} />
      </span>

      <strong className="session-card-title">
        <span className="session-link-glyph">↗</span>
        {session.title}
      </strong>

      <span className="session-composition-bar">
        <span style={{ width: `${usedPercent}%` }} />
      </span>

      {(hasOpenTime || session.needs?.length) ? (
        <span className="session-card-footer">
          <span>{session.open}</span>
          {session.needs?.length ? (
            <span>{session.needs.join(" · ")}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

export default SessionTile;
