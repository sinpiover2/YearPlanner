import { getUser, verifyRequestOrigin } from "@netlify/identity";

const PLANNING_API_URL =
  "https://script.google.com/macros/s/AKfycbz8lBGl75prYnpy9YT32XK2bVgUaZi96zl8NbQw6n7E-PSx7SIT6mP79-McBfrVvBhA/exec";

const ALLOWED_ACTIONS = new Set([
  "saveDailyProgress",
  "addLesson",
  "updateLesson",
  "updateUnitPlanning",
  "deleteLesson",
  "reorderLessons",
]);

function jsonResponse(body, status) {
  return Response.json(body, { status });
}

export function createPlanningWriteHandler({
  getCurrentUser = getUser,
  verifyOrigin = verifyRequestOrigin,
  fetchImpl = fetch,
  getEnvironment = () => process.env,
} = {}) {
  return async function planningWrite(request) {
    if (request.method !== "POST") {
      return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
    }

    try {
      verifyOrigin(request);
    } catch {
      return jsonResponse({ ok: false, error: "Untrusted request origin" }, 403);
    }

    const user = await getCurrentUser();
    if (!user) {
      return jsonResponse({ ok: false, error: "Sign in required" }, 401);
    }

    const environment = getEnvironment();
    const approvedEmail = environment.PLANNING_TEACHER_EMAIL?.trim().toLowerCase();
    const writeToken = environment.PLANNING_WRITE_TOKEN;

    if (!approvedEmail || user.email?.trim().toLowerCase() !== approvedEmail) {
      return jsonResponse({ ok: false, error: "Account not authorized" }, 403);
    }

    if (!writeToken) {
      return jsonResponse({ ok: false, error: "Write service is not configured" }, 503);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: "Invalid JSON request" }, 400);
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return jsonResponse({ ok: false, error: "Invalid planning request" }, 400);
    }

    if (!ALLOWED_ACTIONS.has(payload.action)) {
      return jsonResponse({ ok: false, error: "Unsupported planning action" }, 400);
    }

    const upstreamResponse = await fetchImpl(PLANNING_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, token: writeToken }),
    });

    const responseBody = await upstreamResponse.text();
    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: { "Content-Type": "application/json;charset=utf-8" },
    });
  };
}

export default createPlanningWriteHandler();
