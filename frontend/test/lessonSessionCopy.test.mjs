import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createIndependentLessonSessionCopy,
  getLessonSessionCopyTargets,
} from "../src/utils/lessonSessionCopy.js";

const sessions = {
  "M8-P1-2026-08-17": {
    id: "M8-P1-2026-08-17",
    courseId: "M8",
    sectionLabel: "Math 8 P1",
    dayKey: "2026-08-17",
  },
  "M8-P2-2026-08-18": {
    id: "M8-P2-2026-08-18",
    courseId: "M8",
    sectionLabel: "Math 8 P2",
    dayKey: "2026-08-18",
  },
  "M8-P3-2026-08-17": {
    id: "M8-P3-2026-08-17",
    courseId: "M8",
    sectionLabel: "Math 8 P3",
    dayKey: "2026-08-17",
  },
  "IM1-P5-2026-08-18": {
    id: "IM1-P5-2026-08-18",
    courseId: "IM1",
    sectionLabel: "Math 1 P5",
    dayKey: "2026-08-18",
  },
};

test("copy targets include same-course sessions across different days", () => {
  const targets = getLessonSessionCopyTargets({
    sessions,
    sourceSessionId: "M8-P1-2026-08-17",
    sourceCourseId: "M8",
  });

  assert.deepEqual(
    targets.map((target) => target.id),
    ["M8-P3-2026-08-17", "M8-P2-2026-08-18"],
  );
});

test("copy targets exclude the source and other courses", () => {
  const targets = getLessonSessionCopyTargets({
    sessions,
    sourceSessionId: "M8-P1-2026-08-17",
    sourceCourseId: "M8",
  });

  assert.equal(
    targets.some((target) => target.id === "M8-P1-2026-08-17"),
    false,
  );
  assert.equal(targets.some((target) => target.courseId === "IM1"), false);
});

test("copied plans preserve content while receiving independent identities", () => {
  const source = {
    curriculumLessonId: "M8-U1-L1",
    episodes: [
      {
        id: "episode-source",
        title: "Launch",
        curriculumLessonId: "M8-U1-L1",
        blocks: [
          {
            id: "block-source",
            type: "deliverable",
            text: "Activity cards",
            deliverableId: "deliverable-source",
          },
        ],
      },
    ],
    deliverables: [
      {
        id: "deliverable-source",
        title: "Activity cards",
        originatingEpisodeId: "episode-source",
      },
    ],
  };
  let nextId = 0;
  const copy = createIndependentLessonSessionCopy(
    source,
    (prefix) => `${prefix}-copy-${++nextId}`,
  );

  assert.equal(copy.curriculumLessonId, source.curriculumLessonId);
  assert.equal(copy.episodes[0].title, source.episodes[0].title);
  assert.equal(
    copy.episodes[0].curriculumLessonId,
    source.episodes[0].curriculumLessonId,
  );
  assert.notEqual(copy.episodes[0].id, source.episodes[0].id);
  assert.notEqual(copy.episodes[0].blocks[0].id, source.episodes[0].blocks[0].id);
  assert.notEqual(copy.deliverables[0].id, source.deliverables[0].id);
  assert.equal(
    copy.episodes[0].blocks[0].deliverableId,
    copy.deliverables[0].id,
  );
  assert.equal(
    copy.deliverables[0].originatingEpisodeId,
    copy.episodes[0].id,
  );

  copy.episodes[0].title = "Changed copy";
  assert.equal(source.episodes[0].title, "Launch");
});

test("plain arrow keys are not allowed to move focus out of outline text", async () => {
  const source = await readFile(
    new URL("../src/components/LessonSessionView.jsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /event\.key === "ArrowUp" &&\s*!event\.metaKey/,
  );
  assert.doesNotMatch(
    source,
    /event\.key === "ArrowDown" &&\s*!event\.metaKey/,
  );
});
