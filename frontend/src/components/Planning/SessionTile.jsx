function SessionTile({ session, selected = false, onSelect }) {
  if (!session) {
    return (
      <button className="planning-session-card empty" type="button">
        <span>Open time</span>
      </button>
    );
  }

  const episodes = session.episodes ?? [];
  const previewEpisodes = episodes.slice(0, 3);
  const remainingEpisodeCount = Math.max(episodes.length - 3, 0);
  const hiddenDeliverable = episodes
    .slice(3)
    .some((episode) => episode.isDeliverable);

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
          <span className="session-card-identity">
            <strong className="session-card-title">{session.title}</strong>
            <span
              className={[
                "session-status-dot",
                session.state ? `state-${session.state}` : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={session.state ?? "Planned"}
            />
          </span>

          {session.curriculumLabel ? (
            <span className="session-card-curriculum">
              Curriculum · {session.curriculumLabel}
            </span>
          ) : null}

          {previewEpisodes.length ? (
            <span className="session-episode-preview">
              {previewEpisodes.map((episode, index) => (
                <span
                  className="session-episode-preview-line"
                  key={episode.id ?? index}
                >
                  <span>{episode.title?.trim() || "Untitled episode"}</span>
                  {episode.isDeliverable ? (
                    <span
                      className="session-episode-deliverable"
                      aria-label="Deliverable"
                      title="Deliverable"
                    />
                  ) : null}
                </span>
              ))}

              {remainingEpisodeCount ? (
                <span className="session-episode-preview-line is-overflow">
                  <span>+{remainingEpisodeCount} more</span>
                  {hiddenDeliverable ? (
                    <span
                      className="session-episode-deliverable"
                      aria-label="Deliverable in remaining episodes"
                      title="Deliverable"
                    />
                  ) : null}
                </span>
              ) : null}
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
