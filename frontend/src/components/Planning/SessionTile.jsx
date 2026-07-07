function SessionTile({ session }) {
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
    <button className={`planning-session-card ${session.status}`} type="button">
      <span className="session-card-meta">
        <span className="session-card-identity">{session.sectionLabel || "Session"}</span>
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
