function SessionTile({ session, selected = false, onSelect }) {
  if (!session) {
    return (
      <button className="planning-session-card empty" type="button">
        <span>Open time</span>
      </button>
    );
  }

  if (!session.planned) {
    return (
      <button
        className={[
          "planning-session-card",
          "unplanned",
          selected ? "selected" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="button"
        onClick={() => onSelect?.(session)}
        aria-pressed={selected}
      >
        {session.scheduledLabel ? (
          <>
            <span className="session-card-scheduled-label">Scheduled</span>
            <strong className="session-card-scheduled-title">
              {session.scheduledLabel}
            </strong>
            <span className="session-card-create">+ Plan lesson</span>
          </>
        ) : (
          <span className="session-card-create">+ Lesson</span>
        )}
        {selected ? (
          <span className="session-selected-tick" aria-hidden="true" />
        ) : null}
      </button>
    );
  }

  const episodes = session.episodes ?? [];
  const deliverableEpisodes = episodes.filter(
    (episode) => episode.isDeliverable && episode.title?.trim(),
  );
  const totalMinutes = episodes.reduce(
    (sum, episode) => sum + (Number(episode.minutes) || 0),
    0,
  );

  return (
    <button
      className={[
        "planning-session-card",
        "planned",
        selected ? "selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      type="button"
      onClick={() => onSelect?.(session)}
      aria-pressed={selected}
    >
      <span className="session-card-identity">
        <strong className="session-card-title">{session.title}</strong>
        {totalMinutes > 0 ? (
          <span className="session-card-duration">{totalMinutes}m</span>
        ) : null}
      </span>

      {selected ? (
        <span className="session-selected-tick" aria-hidden="true" />
      ) : null}

      {session.curriculumLabel ? (
        <span className="session-card-curriculum">
          Curriculum · {session.curriculumLabel}
        </span>
      ) : null}

      {session.scheduledLabel ? (
        <span className="session-card-scheduled">
          Scheduled · {session.scheduledLabel}
        </span>
      ) : null}

      {deliverableEpisodes.length ? (
        <span className="session-deliverable-group">
          <span className="session-deliverable-label">Deliverable</span>
          <span className="session-deliverable-name">
            {deliverableEpisodes
              .map((episode) => episode.title.trim())
              .join(", ")}
          </span>
        </span>
      ) : null}
    </button>
  );
}

export default SessionTile;
