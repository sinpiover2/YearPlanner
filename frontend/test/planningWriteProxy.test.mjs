import assert from "node:assert/strict";
import test from "node:test";

import { createPlanningWriteHandler } from "../netlify/functions/planning-write.mjs";

const request = (body = { action: "updateLesson", lessonId: "L1" }) =>
  new Request("https://year-planner.test/.netlify/functions/planning-write", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://year-planner.test",
    },
    body: JSON.stringify(body),
  });

const environment = {
  PLANNING_TEACHER_EMAIL: "teacher@svusd.org",
  PLANNING_WRITE_TOKEN: "server-only-token",
};

test("planning proxy rejects an unauthenticated request", async () => {
  const handler = createPlanningWriteHandler({
    getCurrentUser: async () => null,
    verifyOrigin: () => {},
    getEnvironment: () => environment,
  });

  const response = await handler(request());
  assert.equal(response.status, 401);
});

test("planning proxy rejects a signed-in but unapproved account", async () => {
  const handler = createPlanningWriteHandler({
    getCurrentUser: async () => ({ email: "other@svusd.org" }),
    verifyOrigin: () => {},
    getEnvironment: () => environment,
  });

  const response = await handler(request());
  assert.equal(response.status, 403);
});

test("planning proxy rejects an untrusted origin", async () => {
  const handler = createPlanningWriteHandler({
    getCurrentUser: async () => ({ email: "teacher@svusd.org" }),
    verifyOrigin: () => {
      throw new Error("wrong origin");
    },
    getEnvironment: () => environment,
  });

  const response = await handler(request());
  assert.equal(response.status, 403);
});

test("planning proxy adds the server token only after authorization", async () => {
  let forwarded;
  const handler = createPlanningWriteHandler({
    getCurrentUser: async () => ({ email: "TEACHER@svusd.org" }),
    verifyOrigin: () => {},
    getEnvironment: () => environment,
    fetchImpl: async (url, options) => {
      forwarded = { url, options };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.match(forwarded.url, /^https:\/\/script\.google\.com\/macros\/s\//);
  assert.deepEqual(JSON.parse(forwarded.options.body), {
    action: "updateLesson",
    lessonId: "L1",
    token: "server-only-token",
  });
});

test("planning proxy refuses unsupported actions", async () => {
  const handler = createPlanningWriteHandler({
    getCurrentUser: async () => ({ email: "teacher@svusd.org" }),
    verifyOrigin: () => {},
    getEnvironment: () => environment,
  });

  const response = await handler(request({ action: "deleteEverything" }));
  assert.equal(response.status, 400);
});
