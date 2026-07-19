export function getLessonLabel(lesson) {
  return [lesson?.LessonNumber, lesson?.LessonTitle].filter(Boolean).join(" ");
}

export function getEpisodeLesson(episode, curriculumLessons) {
  const lessonId =
    episode.curriculumLessonId ??
    episode.blocks?.find((block) => block.sourceLessonId)?.sourceLessonId;
  return (
    curriculumLessons.find((lesson) => lesson.LessonID === lessonId) ?? null
  );
}

export function hasPrintableEpisodeContent(episode) {
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

// Smallest serializable representation of a Lesson Session needed to
// reproduce the existing lesson print page. Sent to the authenticated
// roster Apps Script so it can render page 1 of the combined print
// document; carries no roster/student data in either direction.
export function buildLessonPrintPayload({
  sectionLabel,
  courseLabel,
  unitLabel,
  episodes,
  curriculumLessons = [],
}) {
  const printableEpisodes = (episodes ?? []).filter(hasPrintableEpisodeContent);

  const connectedLessons = [
    ...new Map(
      printableEpisodes
        .map((episode) => getEpisodeLesson(episode, curriculumLessons))
        .filter(Boolean)
        .map((lesson) => [lesson.LessonID, lesson]),
    ).values(),
  ].map(getLessonLabel);

  return {
    sectionLabel: sectionLabel || "",
    courseLabel: courseLabel || "",
    unitLabel: unitLabel || "",
    connectedLessons,
    episodes: printableEpisodes.map((episode) => {
      const curriculumLesson = getEpisodeLesson(episode, curriculumLessons);

      return {
        title: episode.title?.trim() || "Teaching Episode",
        isDeliverable: Boolean(episode.isDeliverable),
        curriculumLabel: curriculumLesson ? getLessonLabel(curriculumLesson) : "",
        blocks: (episode.blocks ?? [])
          .filter((block) => block.text?.trim())
          .map((block) => ({
            type: block.type || "text",
            text: block.text,
          })),
      };
    }),
  };
}
