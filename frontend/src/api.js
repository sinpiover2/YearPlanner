const API_URL =
  "https://script.google.com/macros/s/AKfycbz8lBGl75prYnpy9YT32XK2bVgUaZi96zl8NbQw6n7E-PSx7SIT6mP79-McBfrVvBhA/exec";

export async function fetchPlannerData() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch planner data");
  }

  return response.json();
}

export async function saveDailyProgress(progress) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "saveDailyProgress",
      ...progress,
    }),
  });

  return { ok: true };
}

export async function addLesson(lesson) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "addLesson",
      ...lesson,
    }),
  });

  return { ok: true };
}

export async function updateLesson(lesson) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "updateLesson",
      ...lesson,
    }),
  });

  return { ok: true };
}

export async function deleteLesson(payload) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "deleteLesson",
      ...payload,
    }),
  });

  return { ok: true };
}

export async function moveLesson(payload) {
  await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({
      action: "moveLesson",
      ...payload,
    }),
  });

  return { ok: true };
}
