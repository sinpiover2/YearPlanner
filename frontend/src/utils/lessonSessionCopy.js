export function getLessonSessionCopyTargets({
  sessions,
  sourceSessionId,
  sourceCourseId,
}) {
  if (!sourceSessionId || !sourceCourseId) return [];

  return Object.values(sessions ?? {})
    .filter(
      (session) =>
        session.id !== sourceSessionId &&
        session.courseId === sourceCourseId,
    )
    .sort((a, b) => {
      if (a.dayKey !== b.dayKey) {
        return a.dayKey < b.dayKey ? -1 : 1;
      }

      return a.sectionLabel.localeCompare(b.sectionLabel);
    });
}

export function createIndependentLessonSessionCopy(sourceState, createId) {
  const episodeIdMap = new Map();
  const deliverableIdMap = new Map();

  sourceState.episodes.forEach((episode) => {
    episodeIdMap.set(episode.id, createId("episode"));
  });

  sourceState.deliverables.forEach((deliverable) => {
    deliverableIdMap.set(deliverable.id, createId("deliverable"));
  });

  return {
    curriculumLessonId: sourceState.curriculumLessonId ?? null,
    episodes: sourceState.episodes.map((episode) => ({
      ...episode,
      id: episodeIdMap.get(episode.id),
      blocks: episode.blocks.map((block) => ({
        ...block,
        id: createId("block"),
        deliverableId: block.deliverableId
          ? deliverableIdMap.get(block.deliverableId) ?? null
          : null,
      })),
    })),
    deliverables: sourceState.deliverables.map((deliverable) => ({
      ...deliverable,
      id: deliverableIdMap.get(deliverable.id),
      originatingEpisodeId: deliverable.originatingEpisodeId
        ? episodeIdMap.get(deliverable.originatingEpisodeId) ?? null
        : null,
    })),
  };
}
