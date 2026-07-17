const PRINT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatPrintDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day
    ? PRINT_DATE_FORMATTER.format(new Date(year, month - 1, day))
    : value;
}

function getLessonLabel(lesson) {
  return [lesson?.LessonNumber, lesson?.LessonTitle]
    .filter(Boolean)
    .join(" ");
}

function getEpisodeLesson(episode, curriculumLessons) {
  const lessonId =
    episode.curriculumLessonId ??
    episode.blocks?.find((block) => block.sourceLessonId)?.sourceLessonId;
  return curriculumLessons.find((lesson) => lesson.LessonID === lessonId) ?? null;
}

function hasPrintableEpisodeContent(episode) {
  const authoredTitle = episode.title?.trim();

  return Boolean(
    (authoredTitle && authoredTitle !== "Welcome") ||
      episode.isDeliverable ||
      episode.curriculumLessonId ||
      episode.blocks?.some(
        (block) => block.text?.trim() || block.sourceLessonId,
      ),
  );
}

function LessonSessionPrintView({
  session,
  state,
  curriculumLessons = [],
  courseLabel,
}) {
  const episodes = (state?.episodes ?? []).filter(hasPrintableEpisodeContent);
  const connectedLessons = [
    ...new Map(
      episodes
        .map((episode) => getEpisodeLesson(episode, curriculumLessons))
        .filter(Boolean)
        .map((lesson) => [lesson.LessonID, lesson]),
    ).values(),
  ];

  return (
    <section className="lesson-session-static-print">
      <header className="lesson-session-static-print-header">
        <div>
          <h1>{session.sectionLabel}</h1>
          <p>{[courseLabel, session.unitLabel].filter(Boolean).join(" · ")}</p>
        </div>
        <p>{formatPrintDate(session.dayKey ?? session.date)}</p>
      </header>

      {connectedLessons.length ? (
        <p className="lesson-session-static-print-context">
          Curriculum · {connectedLessons.map(getLessonLabel).join(" · ")}
        </p>
      ) : null}

      <div className="lesson-session-static-print-episodes">
        {episodes.map((episode) => {
          const curriculumLesson = getEpisodeLesson(
            episode,
            curriculumLessons,
          );
          const blocks = (episode.blocks ?? []).filter((block) =>
            block.text?.trim(),
          );

          return (
            <article className="lesson-session-static-print-episode" key={episode.id}>
              <h2>
                {episode.title?.trim() || "Teaching Episode"}
                {episode.isDeliverable ? (
                  <span className="episode-deliverable-badge">Deliverable</span>
                ) : null}
              </h2>

              {curriculumLesson ? (
                <p className="lesson-session-static-print-curriculum">
                  Curriculum · {getLessonLabel(curriculumLesson)}
                </p>
              ) : null}

              {blocks.length ? (
                <ul>
                  {blocks.map((block) => (
                    <li className={`is-${block.type || "text"}`} key={block.id}>
                      <span aria-hidden="true">
                        {block.type === "learning"
                          ? "◎"
                          : block.type === "deliverable"
                            ? "▢"
                            : block.type === "materials"
                              ? "◇"
                              : "•"}
                      </span>
                      <span>{block.text}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default LessonSessionPrintView;
