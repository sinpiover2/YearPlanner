export const LESSON_SESSION_STORAGE_KEY = "year-planner.lesson-session.prototype.v2";

const NEUTRAL_TITLE = "Lesson";
const DEFAULT_EPISODE_TITLE = "Welcome";

export function getLessonSessionStorageKey(sessionId) {
  return sessionId
    ? `${LESSON_SESSION_STORAGE_KEY}.${sessionId}`
    : LESSON_SESSION_STORAGE_KEY;
}

export function getLessonSessionState(sessionId) {
  if (typeof window === "undefined" || !sessionId) return null;

  try {
    const stored = window.localStorage.getItem(
      getLessonSessionStorageKey(sessionId),
    );

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function getAllLessonSessionStates() {
  if (typeof window === "undefined") return [];

  const prefix = `${LESSON_SESSION_STORAGE_KEY}.`;
  const entries = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(prefix)) continue;

    try {
      const state = JSON.parse(window.localStorage.getItem(key));
      entries.push({ sessionId: key.slice(prefix.length), state });
    } catch {
      // One malformed draft must not hide every other deliverable.
    }
  }

  return entries;
}

export function updateLessonSessionEpisode(sessionId, episodeId, patch) {
  const state = getLessonSessionState(sessionId);
  if (!state || !Array.isArray(state.episodes)) return false;

  const episodeExists = state.episodes.some((episode) => episode.id === episodeId);
  if (!episodeExists) return false;

  const nextState = {
    ...state,
    episodes: state.episodes.map((episode) =>
      episode.id === episodeId ? { ...episode, ...patch } : episode,
    ),
  };

  window.localStorage.setItem(
    getLessonSessionStorageKey(sessionId),
    JSON.stringify(nextState),
  );
  return true;
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
  const state = getLessonSessionState(sessionId);
  const planned = hasAuthoredContent(state);

  return {
    planned,
    title: planned ? getAuthoredTitle(state) ?? NEUTRAL_TITLE : null,
    state: state?.state ?? null,
    episodes: Array.isArray(state?.episodes) ? state.episodes : [],
    curriculumLessonId:
      state?.curriculumLessonId ??
      state?.episodes?.find((episode) => episode.curriculumLessonId)
        ?.curriculumLessonId ??
      null,
  };
}
