export const LESSON_SESSION_STORAGE_KEY = "year-planner.lesson-session.prototype.v2";

const NEUTRAL_TITLE = "Lesson";
const DEFAULT_EPISODE_TITLE = "Welcome";

export function getLessonSessionStorageKey(sessionId) {
  return sessionId
    ? `${LESSON_SESSION_STORAGE_KEY}.${sessionId}`
    : LESSON_SESSION_STORAGE_KEY;
}

function readStoredState(sessionId) {
  if (typeof window === "undefined" || !sessionId) return null;

  try {
    const stored = window.localStorage.getItem(
      getLessonSessionStorageKey(sessionId),
    );

    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function hasAuthoredContent(state) {
  if (!state || !Array.isArray(state.episodes)) return false;

  if (state.deliverables?.length) return true;

  if (state.episodes.length > 1) return true;

  return state.episodes.some((episode) =>
    episode.blocks?.some((block) => block.text?.trim()),
  );
}

function getAuthoredTitle(state) {
  const authoredEpisode = state?.episodes?.find(
    (episode) =>
      episode.title?.trim() && episode.title.trim() !== DEFAULT_EPISODE_TITLE,
  );

  return authoredEpisode?.title.trim() ?? null;
}

// A Lesson Session is "planned" only once the teacher has actually authored
// something in it — merely opening a never-planned session persists its
// blank default state, which must not read back as planned. The title shown
// is whatever the teacher actually wrote, never a projected curriculum name.
export function getLessonSessionSummary(sessionId) {
  const state = readStoredState(sessionId);
  const planned = hasAuthoredContent(state);

  return {
    planned,
    title: planned ? getAuthoredTitle(state) ?? NEUTRAL_TITLE : null,
    curriculumLessonId:
      state?.curriculumLessonId ??
      state?.episodes?.find((episode) => episode.curriculumLessonId)
        ?.curriculumLessonId ??
      null,
  };
}
