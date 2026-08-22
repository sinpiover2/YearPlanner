const READ_API_URL =
  "https://script.google.com/macros/s/AKfycbz8lBGl75prYnpy9YT32XK2bVgUaZi96zl8NbQw6n7E-PSx7SIT6mP79-McBfrVvBhA/exec";
const WRITE_API_URL = "/.netlify/functions/planning-write";

export function buildPlanningWritePayload(action, payload) {
  const safePayload = { ...payload };
  delete safePayload.action;
  delete safePayload.token;
  return { ...safePayload, action };
}

export async function fetchPlannerData() {
  const response = await fetch(READ_API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch planner data");
  }

  return response.json();
}

// Single write path for every planning mutation. The same-origin Netlify
// Function verifies the signed-in teacher and adds the Apps Script token on
// the server. No write credential is shipped to the browser.
export async function postPlanningAction(
  action,
  payload,
  failureMessage,
  { fetchImpl = fetch } = {},
) {
  const response = await fetchImpl(WRITE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPlanningWritePayload(action, payload)),
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

export async function updateUnitPlanning(unitPlanning) {
  return postPlanningAction(
    "updateUnitPlanning",
    unitPlanning,
    "Failed to update unit planning",
  );
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
