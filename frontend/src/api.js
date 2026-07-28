const API_URL =
  "https://script.google.com/macros/s/AKfycbz8lBGl75prYnpy9YT32XK2bVgUaZi96zl8NbQw6n7E-PSx7SIT6mP79-McBfrVvBhA/exec";

// Required for every write action (see apps-script-planning/Code.js,
// isAuthorizedWrite_). Reads (fetchPlannerData) stay anonymous — only writes
// are gated. Sourced from an env var, never committed, so the token can be
// rotated without a code change. See frontend/.env.example.
const WRITE_TOKEN = import.meta.env.VITE_PLANNING_WRITE_TOKEN ?? "";

export async function fetchPlannerData() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch planner data");
  }

  return response.json();
}

// Single write path for every planning mutation. "Content-Type:
// text/plain;charset=utf-8" keeps the request a CORS "simple request" (Apps
// Script does not implement doOptions, so a preflight-triggering
// Content-Type like application/json would break the request entirely).
// Every caller gets the same behavior: a real, readable response, and a
// thrown Error whenever the write did not actually succeed server-side —
// there is no fire-and-forget path left for any planning write.
async function postPlanningAction(action, payload, failureMessage) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action,
      token: WRITE_TOKEN,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(failureMessage);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || failureMessage);
  }

  return data;
}

export async function saveDailyProgress(progress) {
  return postPlanningAction(
    "saveDailyProgress",
    progress,
    "Failed to save progress",
  );
}

export async function addLesson(lesson) {
  const data = await postPlanningAction(
    "addLesson",
    lesson,
    "Failed to add lesson",
  );

  return data.lesson;
}

export async function updateLesson(lesson) {
  return postPlanningAction("updateLesson", lesson, "Failed to update lesson");
}

export async function deleteLesson(payload) {
  return postPlanningAction(
    "deleteLesson",
    payload,
    "Failed to delete lesson",
  );
}

export async function reorderLessons({ unitId, orderedLessonIds }) {
  return postPlanningAction(
    "reorderLessons",
    { unitId, orderedLessonIds },
    "Failed to reorder lessons",
  );
}
