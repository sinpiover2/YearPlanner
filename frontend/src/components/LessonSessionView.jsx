import { useEffect, useRef, useState } from "react";
import { LESSON_SESSION_STORAGE_KEY } from "../utils/lessonSessionStorage";
import { buildLessonPrintPayload } from "../utils/lessonPrintPayload";

const STORAGE_KEY = LESSON_SESSION_STORAGE_KEY;
const LEGACY_STORAGE_KEY = "year-planner.lesson-session-items.prototype.v1";
const COLLAPSED_BLOCKS_STORAGE_KEY =
  "year-planner.lesson-session.collapsed-blocks.v1";
const EPISODE_CLIPBOARD_STORAGE_KEY =
  "year-planner.lesson-session.episode-clipboard.v1";
// Authenticated roster Apps Script web app. It owns the combined print
// document (lesson + roster) so student data never has to reach this
// frontend; see apps-script-roster/ and docs/Architecture/ROSTER_INFORMATION_MODEL.md.
const COMBINED_PRINT_URL =
  "https://script.google.com/a/macros/scottsvalleyusd.org/s/AKfycbz3pelDrU-DTrDmIp4KDt3LAYIOv263Z7ijAgCBAEX2CykwmCDLFzV2EZkX4rftq4TU/exec";

function getSessionStorageKey(baseKey, sessionId) {
  return sessionId ? `${baseKey}.${sessionId}` : baseKey;
}

// Navigates to the authenticated roster Apps Script via a hidden form POST
// (not fetch) so the lesson payload never has to fit in a URL and no CORS
// exception is needed — it's a normal top-level browser navigation. The
// Apps Script renders lesson + roster as one document and prints once there.
function submitCombinedPrintRequest({ sectionId, sessionDate, lessonPayload }) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = COMBINED_PRINT_URL;
  form.target = "_blank";
  form.style.display = "none";

  const fields = {
    sectionId,
    sessionDate,
    lessonPayload: JSON.stringify(lessonPayload),
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

const SUPPORT_TYPES = [
  { type: "learning", label: "Learning", glyph: "◎" },
  { type: "deliverable", label: "Deliverable", glyph: "▢" },
  { type: "materials", label: "Materials", glyph: "◇" },
];

// Lightweight starting points for a new Teaching Episode. Each one only
// supplies a suggested title — selecting one creates a normal episode via
// the same pipeline as "+ Teaching episode" always used. Nothing about the
// template is kept afterward; there is no link back to this list.
const EPISODE_TEMPLATES = [
  { key: "blank", label: "Blank Episode", title: "" },
  { key: "welcome", label: "Welcome", title: "Welcome" },
  { key: "warm-up", label: "Warm-up", title: "Warm-up" },
  { key: "mini-lesson", label: "Mini Lesson", title: "Mini Lesson" },
  { key: "investigation", label: "Investigation", title: "Investigation" },
  { key: "practice", label: "Practice", title: "Practice" },
  { key: "exit-ticket", label: "Exit Ticket", title: "Exit Ticket" },
  { key: "reflection", label: "Reflection", title: "Reflection" },
];

const SESSION_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

function formatSessionDate(value) {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return SESSION_DATE_FORMATTER.format(
    new Date(year, month - 1, day),
  );
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createBlock(overrides = {}) {
  return {
    id: createId("block"),
    type: "text",
    text: "",
    depth: 0,
    deliverableId: null,
    sourceLessonId: null,
    sourceField: null,
    ...overrides,
  };
}

function normalizeOutcomeText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

const DEFAULT_EPISODE_TITLE_DISPLAY = "Untitled Teaching Episode";

function isDefaultEpisodeTitle(title) {
  const trimmed = title?.trim() ?? "";
  return trimmed === "" || trimmed === DEFAULT_EPISODE_TITLE_DISPLAY;
}

function buildEpisodeTitleFromLesson(lesson) {
  if (!lesson) return "";

  const numberPart = lesson.LessonNumber
    ? String(lesson.LessonNumber).trim()
    : "";
  const titlePart = lesson.LessonTitle?.trim() ?? "";
  const providerPart = lesson.Provider?.trim() ?? "";

  const namePart =
    [numberPart, titlePart].filter(Boolean).join(" ") || "Untitled lesson";

  return providerPart ? `${namePart} (${providerPart})` : namePart;
}

function createBlankEpisode() {
  return {
    id: createId("episode"),
    title: "",
    minutes: null,
    curriculumLessonId: null,
    isDeliverable: false,
    blocks: [createBlock()],
  };
}

function createEpisode(overrides = {}) {
  return {
    ...createBlankEpisode(),
    ...overrides,
  };
}

function migrateLegacyItem(item) {
  const blocks = [];

  if (item.notes?.trim() || item.detail?.trim()) {
    blocks.push(
      createBlock({
        text: item.notes?.trim() || item.detail?.trim() || "",
      }),
    );
  }

  for (const target of item.learningTargets ?? []) {
    if (target?.trim()) {
      blocks.push(
        createBlock({
          type: "learning",
          text: target.trim(),
          depth: 1,
        }),
      );
    }
  }

  for (const move of item.moves ?? []) {
    if (move?.trim()) {
      blocks.push(
        createBlock({
          text: move.trim(),
          depth: 1,
        }),
      );
    }
  }

  for (const evidence of item.evidence ?? []) {
    if (evidence?.trim()) {
      blocks.push(
        createBlock({
          type: "deliverable",
          text: evidence.trim(),
          depth: 1,
        }),
      );
    }
  }

  return createEpisode({
    id: item.id || createId("episode"),
    title: item.action ?? "",
    minutes:
      Number.isFinite(Number(item.minutes)) && Number(item.minutes) > 0
        ? Number(item.minutes)
        : null,
    blocks: blocks.length ? blocks : [createBlock()],
  });
}

function createDefaultState() {
  return {
    curriculumLessonId: null,
    episodes: [createEpisode({ title: "Welcome" })],
    deliverables: [],
  };
}

function normalizeStoredState(value) {
  if (!value || typeof value !== "object") {
    return createDefaultState();
  }

  const episodes = Array.isArray(value.episodes)
    ? value.episodes.map((episode) => ({
        id: episode.id || createId("episode"),
        title: episode.title ?? "",
        curriculumLessonId: episode.curriculumLessonId ?? null,
        isDeliverable: Boolean(episode.isDeliverable),
        minutes:
          Number.isFinite(Number(episode.minutes)) &&
          Number(episode.minutes) > 0
            ? Number(episode.minutes)
            : null,
        blocks:
          Array.isArray(episode.blocks) && episode.blocks.length
            ? episode.blocks.map((block) => ({
                id: block.id || createId("block"),
                type: block.type || "text",
                text: block.text ?? "",
                depth: block.depth === 1 ? 1 : 0,
                deliverableId: block.deliverableId ?? null,
                sourceLessonId: block.sourceLessonId ?? null,
                sourceField: block.sourceField ?? null,
              }))
            : [createBlock()],
      }))
    : [];

  return {
    // Legacy: only an explicitly saved session-level value is kept here.
    // Per-episode connections are never aggregated back up into this field,
    // since episodes may now legitimately connect to different lessons.
    curriculumLessonId: value.curriculumLessonId ?? null,
    episodes: episodes.length
      ? episodes
      : [createEpisode()],
    deliverables: Array.isArray(value.deliverables)
      ? value.deliverables.map((deliverable) => ({
          id: deliverable.id || createId("deliverable"),
          title: deliverable.title ?? "",
          originatingEpisodeId: deliverable.originatingEpisodeId ?? null,
        }))
      : [],
  };
}

function loadCollapsedBlockIds(sessionId) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(
      getSessionStorageKey(COLLAPSED_BLOCKS_STORAGE_KEY, sessionId),
    );

    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not load collapsed outline branches.", error);
    return [];
  }
}

function loadInitialState(sessionId) {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const storageKey = getSessionStorageKey(STORAGE_KEY, sessionId);
    const current = window.localStorage.getItem(storageKey);

    if (current) {
      return normalizeStoredState(JSON.parse(current));
    }

    if (sessionId) {
      return createDefaultState();
    }

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);

    if (legacy) {
      const legacyItems = JSON.parse(legacy);

      if (Array.isArray(legacyItems)) {
        return {
          episodes: legacyItems.map(migrateLegacyItem),
          deliverables: [],
        };
      }
    }
  } catch (error) {
    console.warn("Could not load the local Lesson Planner draft.", error);
  }

  return createDefaultState();
}

function useUndoableState(initializer) {
  const [state, setState] = useState(initializer);
  const pastRef = useRef([]);
  const futureRef = useRef([]);

  function setUndoableState(updater, options = {}) {
    const { record = true } = options;

    setState((current) => {
      const next =
        typeof updater === "function" ? updater(current) : updater;

      if (Object.is(next, current)) {
        return current;
      }

      if (record) {
        pastRef.current.push(current);

        if (pastRef.current.length > 100) {
          pastRef.current.shift();
        }

        futureRef.current = [];
      }

      return next;
    });
  }

  function undo() {
    setState((current) => {
      const previous = pastRef.current.pop();

      if (!previous) {
        return current;
      }

      futureRef.current.push(current);
      return previous;
    });
  }

  function redo() {
    setState((current) => {
      const next = futureRef.current.pop();

      if (!next) {
        return current;
      }

      pastRef.current.push(current);
      return next;
    });
  }

  return {
    state,
    setState: setUndoableState,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}

function estimateEpisodeMinutes(blocks) {
  const estimate = blocks.reduce((total, block) => {
    if (!block.text?.trim()) {
      return total;
    }

    if (block.type === "learning") {
      return total;
    }

    if (block.type === "deliverable") {
      return total + 1;
    }

    return total + (block.depth === 1 ? 1 : 2);
  }, 0);

  return Math.max(estimate, 1);
}

function getDisplayedEpisodeMinutes(episode) {
  const manualMinutes = Number(episode.minutes);

  return Number.isFinite(manualMinutes) && manualMinutes > 0
    ? manualMinutes
    : estimateEpisodeMinutes(episode.blocks);
}

function LessonSessionView({
  activeLessonContext,
  curriculumLessons,
  copyTargets,
  getOutcomeList,
  courseLabel,
  unitLabel,
}) {
  const {
    state: plannerState,
    setState: setPlannerState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoableState(() =>
    loadInitialState(activeLessonContext?.sessionId),
  );
  const [openEpisodeIds, setOpenEpisodeIds] = useState(() => {
    const initialId =
      plannerState.episodes[1]?.id ??
      plannerState.episodes[0]?.id ??
      null;

    return initialId ? new Set([initialId]) : new Set();
  });
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [pendingBlockFocusId, setPendingBlockFocusId] = useState(null);
  const [editingDurationId, setEditingDurationId] = useState(null);
  const [durationDraft, setDurationDraft] = useState("");
  const [slashMenu, setSlashMenu] = useState(null);
  const [episodeMenuId, setEpisodeMenuId] = useState(null);
  const [curriculumChooserEpisodeId, setCurriculumChooserEpisodeId] =
    useState(null);
  const [isAddEpisodeCurriculumPickerOpen, setIsAddEpisodeCurriculumPickerOpen] =
    useState(false);
  const [isAddEpisodeMenuOpen, setIsAddEpisodeMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [hasEpisodeClipboard, setHasEpisodeClipboard] = useState(() => {
    if (typeof window === "undefined") return false;

    return Boolean(
      window.localStorage.getItem(EPISODE_CLIPBOARD_STORAGE_KEY),
    );
  });
  const [collapsedBlockIds, setCollapsedBlockIds] = useState(() =>
    loadCollapsedBlockIds(activeLessonContext?.sessionId),
  );
  const inputRefs = useRef(new Map());
  const addEpisodeMenuRef = useRef(null);

  const { curriculumLessonId, episodes, deliverables } = plannerState;
  // Legacy: earlier versions attached a curriculum lesson to the whole
  // Lesson Session. Connections are now made per Teaching Episode; this
  // session-level value is kept only so older saved plans still show a
  // header pill. Nothing writes to it anymore.
  const attachedCurriculumLesson =
    curriculumLessons.find(
      (lesson) => lesson.LessonID === curriculumLessonId,
    ) ?? null;

  const canPrintLesson = Boolean(
    activeLessonContext?.sectionId && activeLessonContext?.date,
  );

  function handlePrintLesson() {
    if (!canPrintLesson) return;

    const lessonPayload = buildLessonPrintPayload({
      sectionLabel: activeLessonContext.sectionLabel,
      courseLabel,
      unitLabel,
      episodes,
      curriculumLessons,
    });

    submitCombinedPrintRequest({
      sectionId: activeLessonContext.sectionId,
      sessionDate: activeLessonContext.date,
      lessonPayload,
    });
  }

  const activeDeliverableCount = new Set(
    episodes.flatMap((episode) =>
      episode.blocks
        .filter(
          (block) =>
            block.type === "deliverable" &&
            block.deliverableId,
        )
        .map((block) => block.deliverableId),
    ),
  ).size;

  const hasEstimatedDurations = episodes.some(
    (episode) =>
      !Number.isFinite(Number(episode.minutes)) ||
      Number(episode.minutes) <= 0,
  );

  const totalDisplayedMinutes = episodes.reduce(
    (total, episode) => total + getDisplayedEpisodeMinutes(episode),
    0,
  );

  const cumulativeMinutesByEpisodeId = new Map();
  episodes.reduce((runningTotal, episode) => {
    const nextTotal = runningTotal + getDisplayedEpisodeMinutes(episode);
    cumulativeMinutesByEpisodeId.set(episode.id, nextTotal);
    return nextTotal;
  }, 0);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getSessionStorageKey(
          STORAGE_KEY,
          activeLessonContext?.sessionId,
        ),
        JSON.stringify(plannerState),
      );
    } catch (error) {
      console.warn("Could not save the local Lesson Planner draft.", error);
    }
  }, [activeLessonContext?.sessionId, plannerState]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getSessionStorageKey(
          COLLAPSED_BLOCKS_STORAGE_KEY,
          activeLessonContext?.sessionId,
        ),
        JSON.stringify(collapsedBlockIds),
      );
    } catch (error) {
      console.warn("Could not save collapsed outline branches.", error);
    }
  }, [activeLessonContext?.sessionId, collapsedBlockIds]);

  useEffect(() => {
    if (!isAddEpisodeMenuOpen) return undefined;

    function closeAddEpisodeMenu() {
      if (addEpisodeMenuRef.current) {
        addEpisodeMenuRef.current.open = false;
      }

      setIsAddEpisodeCurriculumPickerOpen(false);
    }

    function handlePointerDown(event) {
      if (!addEpisodeMenuRef.current?.contains(event.target)) {
        closeAddEpisodeMenu();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeAddEpisodeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddEpisodeMenuOpen]);

  useEffect(() => {
    if (!episodeMenuId) return undefined;

    function closeEpisodeMenu(event) {
      if (
        event.type === "keydown" &&
        event.key !== "Escape"
      ) {
        return;
      }

      if (
        event.type === "pointerdown" &&
        event.target.closest(".episode-overflow")
      ) {
        return;
      }

      setEpisodeMenuId(null);
    }

    window.addEventListener("pointerdown", closeEpisodeMenu);
    window.addEventListener("keydown", closeEpisodeMenu);

    return () => {
      window.removeEventListener("pointerdown", closeEpisodeMenu);
      window.removeEventListener("keydown", closeEpisodeMenu);
    };
  }, [episodeMenuId]);

  useEffect(() => {
    if (!pendingBlockFocusId) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const input = inputRefs.current.get(pendingBlockFocusId);

      if (!input) return;

      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
      setPendingBlockFocusId(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingBlockFocusId, openEpisodeIds, editingTitleId]);

  useEffect(() => {
    function handleUndoRedo(event) {
      const modifier = event.metaKey || event.ctrlKey;

      if (!modifier || event.key.toLowerCase() !== "z") {
        return;
      }

      const activeElement = document.activeElement;
      const tagName = activeElement?.tagName;

      // Inputs and textareas retain their normal native text undo.
      if (
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        activeElement?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    window.addEventListener("keydown", handleUndoRedo);

    return () => {
      window.removeEventListener("keydown", handleUndoRedo);
    };
  }, [undo, redo]);

  function createIndependentPlannerCopy(sourceState) {
    const episodeIdMap = new Map();
    const deliverableIdMap = new Map();

    sourceState.episodes.forEach((episode) => {
      episodeIdMap.set(episode.id, createId("episode"));
    });

    sourceState.deliverables.forEach((deliverable) => {
      deliverableIdMap.set(
        deliverable.id,
        createId("deliverable"),
      );
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

  function copyPlanToSession(target) {
    const destinationKey = getSessionStorageKey(
      STORAGE_KEY,
      target.sessionId,
    );
    const existingDraft = window.localStorage.getItem(destinationKey);

    if (
      existingDraft &&
      !window.confirm(
        `${target.sectionLabel} already has a saved lesson plan. Replace it?`,
      )
    ) {
      return;
    }

    try {
      const copiedState = createIndependentPlannerCopy(plannerState);

      window.localStorage.setItem(
        destinationKey,
        JSON.stringify(copiedState),
      );
      window.localStorage.setItem(
        getSessionStorageKey(
          COLLAPSED_BLOCKS_STORAGE_KEY,
          target.sessionId,
        ),
        JSON.stringify([]),
      );

      setCopyStatus(`Copied to ${target.sectionLabel}.`);
    } catch (error) {
      console.warn("Could not copy the Lesson Session plan.", error);
      setCopyStatus("The lesson plan could not be copied.");
    }
  }

  function copyEpisodeToClipboard(episode) {
    const referencedDeliverableIds = new Set(
      episode.blocks
        .map((block) => block.deliverableId)
        .filter(Boolean),
    );

    const clipboardPayload = {
      version: 1,
      episode,
      deliverables: plannerState.deliverables.filter((deliverable) =>
        referencedDeliverableIds.has(deliverable.id),
      ),
    };

    try {
      window.localStorage.setItem(
        EPISODE_CLIPBOARD_STORAGE_KEY,
        JSON.stringify(clipboardPayload),
      );
      setHasEpisodeClipboard(true);
      setCopyStatus(`Copied episode: ${episode.title || "Untitled episode"}.`);
      setEpisodeMenuId(null);
    } catch (error) {
      console.warn("Could not copy the teaching episode.", error);
      setCopyStatus("The teaching episode could not be copied.");
    }
  }

  function pasteEpisodeFromClipboard() {
    try {
      const stored = window.localStorage.getItem(
        EPISODE_CLIPBOARD_STORAGE_KEY,
      );

      if (!stored) {
        setHasEpisodeClipboard(false);
        setCopyStatus("No copied episode is available.");
        return;
      }

      const payload = JSON.parse(stored);
      const sourceEpisode = payload?.episode;
      const sourceDeliverables = Array.isArray(payload?.deliverables)
        ? payload.deliverables
        : [];

      if (!sourceEpisode || !Array.isArray(sourceEpisode.blocks)) {
        throw new Error("Invalid episode clipboard payload.");
      }

      const pastedEpisodeId = createId("episode");
      const deliverableIdMap = new Map(
        sourceDeliverables.map((deliverable) => [
          deliverable.id,
          createId("deliverable"),
        ]),
      );

      const pastedEpisode = {
        ...sourceEpisode,
        id: pastedEpisodeId,
        blocks: sourceEpisode.blocks.map((block) => ({
          ...block,
          id: createId("block"),
          deliverableId: block.deliverableId
            ? deliverableIdMap.get(block.deliverableId) ?? null
            : null,
        })),
      };

      const pastedDeliverables = sourceDeliverables.map((deliverable) => ({
        ...deliverable,
        id: deliverableIdMap.get(deliverable.id),
        originatingEpisodeId: pastedEpisodeId,
      }));

      setPlannerState((current) => ({
        ...current,
        episodes: [...current.episodes, pastedEpisode],
        deliverables: [
          ...current.deliverables,
          ...pastedDeliverables,
        ],
      }));

      setOpenEpisodeIds((current) => {
        const next = new Set(current);
        next.add(pastedEpisodeId);
        return next;
      });

      setCopyStatus(
        `Pasted episode: ${pastedEpisode.title || "Untitled episode"}.`,
      );
    } catch (error) {
      console.warn("Could not paste the teaching episode.", error);
      setCopyStatus("The copied teaching episode could not be pasted.");
    }
  }

  function updateEpisode(
    episodeId,
    updater,
    options = {},
  ) {
    setPlannerState(
      (current) => ({
        ...current,
        episodes: current.episodes.map((episode) =>
          episode.id === episodeId ? updater(episode) : episode,
        ),
      }),
      options,
    );
  }

  function focusBlock(blockId) {
    setPendingBlockFocusId(blockId);
  }

  function beginDurationEdit(episode) {
    setDurationDraft(
      Number.isFinite(Number(episode.minutes)) && Number(episode.minutes) > 0
        ? String(episode.minutes)
        : "",
    );
    setEditingDurationId(episode.id);
  }

  function commitDurationEdit(episodeId) {
    const parsedMinutes = Number.parseInt(durationDraft, 10);
    const minutes =
      Number.isFinite(parsedMinutes) && parsedMinutes > 0
        ? parsedMinutes
        : null;

    updateEpisode(episodeId, (episode) => ({
      ...episode,
      minutes,
    }));

    setEditingDurationId(null);
    setDurationDraft("");
  }

  function cancelDurationEdit() {
    setEditingDurationId(null);
    setDurationDraft("");
  }

  function addEpisode(afterIndex = episodes.length - 1, options = {}) {
    const { title = "", curriculumLessonId = null } = options;
    const episode = createEpisode({ title, curriculumLessonId });

    setPlannerState((current) => {
      const nextEpisodes = [...current.episodes];
      nextEpisodes.splice(afterIndex + 1, 0, episode);

      return {
        ...current,
        episodes: nextEpisodes,
      };
    });

    setOpenEpisodeIds((current) => {
      const next = new Set(current);
      next.add(episode.id);
      return next;
    });
    setEditingTitleId(episode.id);
  }

  // Creates a new episode already connected to a curriculum lesson, via the
  // same addEpisode pipeline as any other creation path. There is no
  // existing episode/title to confirm overwriting, so this never shows the
  // "replace the title?" prompt that changing an existing episode's lesson
  // does.
  function addEpisodeFromCurriculumLesson(lesson) {
    if (!lesson) return;

    addEpisode(undefined, {
      title: buildEpisodeTitleFromLesson(lesson),
      curriculumLessonId: lesson.LessonID,
    });

    setIsAddEpisodeCurriculumPickerOpen(false);
  }

  function moveEpisode(index, direction) {
    const destination = index + direction;

    if (destination < 0 || destination >= episodes.length) return;

    setPlannerState((current) => {
      const nextEpisodes = [...current.episodes];
      const [episode] = nextEpisodes.splice(index, 1);
      nextEpisodes.splice(destination, 0, episode);

      return {
        ...current,
        episodes: nextEpisodes,
      };
    });
  }

  function deleteEpisode(episodeId) {
    setPlannerState((current) => {
      const nextEpisodes = current.episodes.filter(
        (episode) => episode.id !== episodeId,
      );

      return {
        ...current,
        episodes: nextEpisodes.length ? nextEpisodes : [createEpisode()],
      };
    });

    setOpenEpisodeIds((current) => {
      const next = new Set(current);
      next.delete(episodeId);
      return next;
    });

    if (editingTitleId === episodeId) {
      setEditingTitleId(null);
    }

    setEpisodeMenuId(null);
  }

  function chooseLessonForEpisode(episodeId, lesson) {
    const episode = episodes.find((item) => item.id === episodeId);

    if (!episode || !lesson) return;

    const generatedTitle = buildEpisodeTitleFromLesson(lesson);
    const shouldReplaceTitle = isDefaultEpisodeTitle(episode.title)
      ? true
      : window.confirm(
          "Replace the current episode title with the lesson title?",
        );

    setPlannerState((current) => ({
      ...current,
      episodes: current.episodes.map((item) =>
        item.id === episodeId
          ? {
              ...item,
              curriculumLessonId: lesson.LessonID,
              title: shouldReplaceTitle ? generatedTitle : item.title,
            }
          : item,
      ),
    }));

    setCurriculumChooserEpisodeId(null);
    setEpisodeMenuId(null);
  }

  function removeLessonConnection(episodeId) {
    setPlannerState((current) => ({
      ...current,
      episodes: current.episodes.map((item) => {
        if (item.id !== episodeId) return item;

        const attachedLesson = curriculumLessons.find(
          (lesson) => lesson.LessonID === item.curriculumLessonId,
        );
        const generatedTitle = attachedLesson
          ? buildEpisodeTitleFromLesson(attachedLesson)
          : null;
        const shouldClearTitle =
          generatedTitle && item.title.trim() === generatedTitle.trim();

        return {
          ...item,
          curriculumLessonId: null,
          title: shouldClearTitle ? "" : item.title,
        };
      }),
    }));

    setEpisodeMenuId(null);
  }

  function toggleEpisodeDeliverable(episodeId) {
    setPlannerState((current) => ({
      ...current,
      episodes: current.episodes.map((episode) =>
        episode.id === episodeId
          ? { ...episode, isDeliverable: !episode.isDeliverable }
          : episode,
      ),
    }));

    setEpisodeMenuId(null);
  }

  function importCurriculumContent(episodeId, lesson) {
    const episode = episodes.find((item) => item.id === episodeId);

    if (!episode || !lesson) return;

    const existingProvenance = new Set(
      episode.blocks
        .filter((block) => block.sourceLessonId === lesson.LessonID)
        .map((block) => block.sourceField),
    );

    const candidates = [];

    const description = lesson.Description?.trim();

    if (description && !existingProvenance.has("description")) {
      candidates.push(
        createBlock({
          text: description,
          type: "text",
          sourceLessonId: lesson.LessonID,
          sourceField: "description",
        }),
      );
    }

    const seenOutcomeKeys = new Set();

    for (const outcome of getOutcomeList(lesson.KeyOutcome)) {
      const normalized = normalizeOutcomeText(outcome);

      if (!normalized || seenOutcomeKeys.has(normalized)) continue;

      seenOutcomeKeys.add(normalized);

      const sourceField = `outcome:${normalized}`;

      if (existingProvenance.has(sourceField)) continue;

      candidates.push(
        createBlock({
          text: outcome,
          type: "learning",
          sourceLessonId: lesson.LessonID,
          sourceField,
        }),
      );
    }

    const teacherNotes = lesson.TeacherNotes?.trim();

    if (teacherNotes && !existingProvenance.has("teacherNotes")) {
      candidates.push(
        createBlock({
          text: teacherNotes,
          type: "text",
          sourceLessonId: lesson.LessonID,
          sourceField: "teacherNotes",
        }),
      );
    }

    if (!candidates.length) {
      setEpisodeMenuId(null);
      return;
    }

    const isUntouchedStarterBlock = (block) =>
      block.text === "" &&
      block.type === "text" &&
      block.depth === 0 &&
      block.deliverableId === null &&
      !block.sourceLessonId;

    setPlannerState((current) => ({
      ...current,
      episodes: current.episodes.map((item) => {
        if (item.id !== episodeId) return item;

        const blocks =
          item.blocks.length === 1 &&
          isUntouchedStarterBlock(item.blocks[0])
            ? candidates
            : [...item.blocks, ...candidates];

        return { ...item, blocks };
      }),
    }));

    setEpisodeMenuId(null);
    setOpenEpisodeIds((current) => {
      const next = new Set(current);
      next.add(episodeId);
      return next;
    });
  }

  function splitBlockAtCaret(
    episodeId,
    blockIndex,
    selectionStart,
    selectionEnd,
  ) {
    const episode = episodes.find((item) => item.id === episodeId);
    const block = episode?.blocks[blockIndex];

    if (!block) return;

    const before = block.text.slice(0, selectionStart);
    const after = block.text.slice(selectionEnd);
    const newBlock = {
      ...createBlock(),
      text: after,
      depth: block.depth,
    };

    setPlannerState((current) => ({
      ...current,
      episodes: current.episodes.map((item) => {
        if (item.id !== episodeId) return item;

        const nextBlocks = [...item.blocks];

        nextBlocks[blockIndex] = {
          ...nextBlocks[blockIndex],
          text: before,
        };

        nextBlocks.splice(blockIndex + 1, 0, newBlock);

        return {
          ...item,
          blocks: nextBlocks,
        };
      }),
    }));

    window.requestAnimationFrame(() => {
      const input = inputRefs.current.get(newBlock.id);

      if (!input) return;

      input.focus();
      input.setSelectionRange(0, 0);
    });
  }

  function addBlockAfter(episodeId, blockIndex, block = createBlock()) {
    updateEpisode(episodeId, (episode) => {
      const nextBlocks = [...episode.blocks];
      nextBlocks.splice(blockIndex + 1, 0, block);

      return {
        ...episode,
        blocks: nextBlocks,
      };
    });

    focusBlock(block.id);
  }

  function selectSupport(episodeId, blockIndex, supportType) {
    const blockId = episodes
      .find((episode) => episode.id === episodeId)
      ?.blocks[blockIndex]?.id;

    if (!blockId) return;

    if (supportType === "deliverable") {
      const deliverableId = createId("deliverable");

      setPlannerState((current) => ({
        episodes: current.episodes.map((episode) =>
          episode.id === episodeId
            ? {
                ...episode,
                blocks: episode.blocks.map((block, index) =>
                  index === blockIndex
                    ? {
                        ...block,
                        type: "deliverable",
                        text: "",
                        depth: 1,
                        deliverableId,
                      }
                    : block,
                ),
              }
            : episode,
        ),
        deliverables: [
          ...current.deliverables,
          {
            id: deliverableId,
            title: "",
            originatingEpisodeId: episodeId,
          },
        ],
      }));
    } else {
      updateEpisode(episodeId, (episode) => ({
        ...episode,
        blocks: episode.blocks.map((block, index) =>
          index === blockIndex
            ? {
                ...block,
                type: supportType,
                text: "",
                depth: 1,
                deliverableId: null,
              }
            : block,
        ),
      }));
    }

    setSlashMenu(null);
    focusBlock(blockId);
  }

  function blockHasChildren(blocks, blockIndex) {
    return (
      blocks[blockIndex]?.depth === 0 &&
      blocks[blockIndex + 1]?.depth === 1
    );
  }

  function toggleBlockCollapsed(blockId) {
    setCollapsedBlockIds((current) =>
      current.includes(blockId)
        ? current.filter((id) => id !== blockId)
        : [...current, blockId],
    );
  }

  function getHiddenBlockIds(blocks) {
    const hiddenIds = new Set();
    let parentIsCollapsed = false;

    blocks.forEach((block) => {
      if (block.depth === 0) {
        parentIsCollapsed = collapsedBlockIds.includes(block.id);
        return;
      }

      if (parentIsCollapsed) {
        hiddenIds.add(block.id);
      }
    });

    return hiddenIds;
  }

  function getBlockRange(blocks, blockIndex) {
    const block = blocks[blockIndex];

    if (!block || block.depth === 1) {
      return { start: blockIndex, end: blockIndex + 1 };
    }

    let end = blockIndex + 1;

    while (end < blocks.length && blocks[end].depth === 1) {
      end += 1;
    }

    return { start: blockIndex, end };
  }

  function moveBlock(episodeId, blockIndex, direction) {
    updateEpisode(episodeId, (episode) => {
      const blocks = [...episode.blocks];
      const current = blocks[blockIndex];

      if (!current) return episode;

      if (current.depth === 1) {
        const parentIndex = blocks
          .slice(0, blockIndex)
          .map((block) => block.depth)
          .lastIndexOf(0);

        const actualParentIndex =
          parentIndex === -1 ? -1 : parentIndex;

        if (actualParentIndex === -1) return episode;

        const siblingIndexes = [];

        for (
          let index = actualParentIndex + 1;
          index < blocks.length && blocks[index].depth === 1;
          index += 1
        ) {
          siblingIndexes.push(index);
        }

        const siblingPosition = siblingIndexes.indexOf(blockIndex);
        const targetPosition = siblingPosition + direction;

        if (
          siblingPosition === -1 ||
          targetPosition < 0 ||
          targetPosition >= siblingIndexes.length
        ) {
          return episode;
        }

        const targetIndex = siblingIndexes[targetPosition];
        [blocks[blockIndex], blocks[targetIndex]] = [
          blocks[targetIndex],
          blocks[blockIndex],
        ];

        return { ...episode, blocks };
      }

      const currentRange = getBlockRange(blocks, blockIndex);

      if (direction < 0) {
        if (currentRange.start === 0) return episode;

        let previousStart = currentRange.start - 1;

        while (
          previousStart > 0 &&
          blocks[previousStart].depth === 1
        ) {
          previousStart -= 1;
        }

        const branch = blocks.splice(
          currentRange.start,
          currentRange.end - currentRange.start,
        );

        blocks.splice(previousStart, 0, ...branch);
      } else {
        if (currentRange.end >= blocks.length) return episode;

        const nextRange = getBlockRange(blocks, currentRange.end);
        const branch = blocks.splice(
          currentRange.start,
          currentRange.end - currentRange.start,
        );

        const insertionIndex =
          nextRange.end - branch.length;

        blocks.splice(insertionIndex, 0, ...branch);
      }

      return { ...episode, blocks };
    });
  }

  function joinWithPreviousBlock(episodeId, blockIndex) {
    if (blockIndex === 0) return;

    const episode = episodes.find((item) => item.id === episodeId);
    if (!episode) return;

    const previous = episode.blocks[blockIndex - 1];
    const current = episode.blocks[blockIndex];

    if (!previous || !current) return;
    if (previous.depth !== current.depth) return;

    const caret = previous.text.length;
    const previousId = previous.id;

    setPlannerState((state) => ({
      ...state,
      episodes: state.episodes.map((item) => {
        if (item.id !== episodeId) return item;

        const nextBlocks = [...item.blocks];

        nextBlocks[blockIndex - 1] = {
          ...nextBlocks[blockIndex - 1],
          text: previous.text + current.text,
        };

        nextBlocks.splice(blockIndex, 1);

        return {
          ...item,
          blocks: nextBlocks,
        };
      }),
    }));

    window.requestAnimationFrame(() => {
      const input = inputRefs.current.get(previousId);

      if (!input) return;

      input.focus();
      input.setSelectionRange(caret, caret);
    });
  }

  function deleteBlock(episodeId, blockIndex) {
    setPlannerState((current) => {
      const episode = current.episodes.find(
        (item) => item.id === episodeId,
      );

      if (!episode) return current;

      if (episode.blocks.length === 1) {
        return {
          ...current,
          episodes: current.episodes.map((item) =>
            item.id === episodeId
              ? {
                  ...item,
                  blocks: [
                    {
                      ...item.blocks[0],
                      type: "text",
                      text: "",
                      depth: 0,
                      deliverableId: null,
                    },
                  ],
                }
              : item,
          ),
        };
      }

      const range = getBlockRange(episode.blocks, blockIndex);
      const removedBlocks = episode.blocks.slice(
        range.start,
        range.end,
      );

      const removedDeliverableIds = new Set(
        removedBlocks
          .map((block) => block.deliverableId)
          .filter(Boolean),
      );

      const nextBlocks = episode.blocks.filter(
        (_, index) => index < range.start || index >= range.end,
      );

      return {
        episodes: current.episodes.map((item) =>
          item.id === episodeId
            ? {
                ...item,
                blocks: nextBlocks.length
                  ? nextBlocks
                  : [createBlock()],
              }
            : item,
        ),
        deliverables: current.deliverables.filter(
          (deliverable) =>
            !removedDeliverableIds.has(deliverable.id),
        ),
      };
    });
  }

  function toggleBlockType(episodeId, blockIndex) {
    setPlannerState((current) => {
      const episode = current.episodes.find(
        (item) => item.id === episodeId,
      );

      const block = episode?.blocks[blockIndex];

      if (!episode || !block) {
        return current;
      }

      let nextType = "text";

      if (block.type === "text") {
        nextType = "learning";
      } else if (block.type === "learning") {
        nextType = "deliverable";
      } else if (block.type === "deliverable") {
        nextType = "materials";
      }

      // Keep the same Deliverable identity when the teacher cycles away
      // from Deliverable and later cycles back.
      let deliverableId = block.deliverableId ?? null;
      let nextDeliverables = current.deliverables;

      if (nextType === "deliverable" && !deliverableId) {
        deliverableId = createId("deliverable");

        nextDeliverables = [
          ...current.deliverables,
          {
            id: deliverableId,
            title: block.text,
            originatingEpisodeId: episodeId,
          },
        ];
      }

      const nextEpisodes = current.episodes.map((item) =>
        item.id === episodeId
          ? {
              ...item,
              blocks: item.blocks.map((currentBlock, index) =>
                index === blockIndex
                  ? {
                      ...currentBlock,
                      type: nextType,
                      deliverableId,
                    }
                  : currentBlock,
              ),
            }
          : item,
      );

      // Remove duplicate orphan Deliverables produced by the earlier bug.
      // A retained dormant ID still counts as referenced.
      const referencedDeliverableIds = new Set(
        nextEpisodes.flatMap((item) =>
          item.blocks
            .map((currentBlock) => currentBlock.deliverableId)
            .filter(Boolean),
        ),
      );

      return {
        episodes: nextEpisodes,
        deliverables: nextDeliverables.filter((deliverable) =>
          referencedDeliverableIds.has(deliverable.id),
        ),
      };
    });
  }

  function updateBlockText(episodeId, blockIndex, value) {
    updateEpisode(episodeId, (episode) => {
      const nextBlocks = episode.blocks.map((block, index) =>
        index === blockIndex ? { ...block, text: value } : block,
      );

      return {
        ...episode,
        blocks: nextBlocks,
      };
    }, { record: false });

    const episode = episodes.find((current) => current.id === episodeId);
    const block = episode?.blocks[blockIndex];

    if (block?.type === "deliverable" && block.deliverableId) {
      setPlannerState((current) => ({
        ...current,
        deliverables: current.deliverables.map((deliverable) =>
          deliverable.id === block.deliverableId
            ? { ...deliverable, title: value }
            : deliverable,
        ),
      }));
    }
  }

  return (
    <section className="workspace-panel lesson-session-workspace">
      <header className="workspace-header lesson-session-header">
        <div>
          <p className="eyebrow">Lesson Planner</p>

          {activeLessonContext?.sessionId ? (
            <>
              <h2>{activeLessonContext.sectionLabel}</h2>
              <p className="lesson-session-date">
                {formatSessionDate(activeLessonContext.date)}
              </p>
            </>
          ) : (
            <>
              <h2>Build the lesson in teaching episodes.</h2>
              <p>
                Arrange the chunks. Open one when you want to think inside it.
              </p>
            </>
          )}
        </div>

        {activeLessonContext?.sessionId ? (
          <div className="lesson-session-header-actions">
            <p className="lesson-session-print-summary">
              {formatSessionDate(activeLessonContext.date)} · plan{" "}
              {hasEstimatedDurations ? "~" : ""}
              {totalDisplayedMinutes}m
            </p>

            {attachedCurriculumLesson ? (
              <span className="lesson-context-pill">
                Curriculum · {attachedCurriculumLesson.LessonTitle || "Untitled lesson"}
              </span>
            ) : null}

            <div className="lesson-session-utility-group">
              <button
                type="button"
                className="lesson-session-utility-button is-primary"
                disabled={!canPrintLesson}
                title={
                  canPrintLesson
                    ? undefined
                    : "Print lesson is unavailable because the section or session date is missing."
                }
                onClick={handlePrintLesson}
              >
                Print lesson
              </button>

              {copyTargets?.length ? (
                <details className="lesson-session-copy-menu">
                  <summary className="lesson-session-utility-button">
                    Copy plan to…
                  </summary>

                  <div className="lesson-session-copy-options">
                    {copyTargets.map((target) => (
                      <button
                        type="button"
                        key={target.id}
                        onClick={(event) => {
                          copyPlanToSession({
                            sessionId: target.id,
                            sectionId: target.sectionId,
                            sectionLabel: target.sectionLabel,
                            date: target.dayKey,
                          });
                          event.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                        }}
                      >
                        <strong>{target.sectionLabel}</strong>
                        <span>{formatSessionDate(target.dayKey)}</span>
                      </button>
                    ))}
                  </div>
                </details>
              ) : (
                <span className="lesson-session-copy-unavailable">
                  No sibling session available
                </span>
              )}
            </div>

            {copyStatus ? (
              <span
                className="lesson-session-copy-status"
                role="status"
              >
                {copyStatus}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="lesson-session-print-layout">
      <div className="lesson-session-print-plan">
      <div className="episode-stack">
        {episodes.map((episode, episodeIndex) => {
          const isOpen = openEpisodeIds.has(episode.id);
          const isEditingTitle = editingTitleId === episode.id;
          const isEditingDuration =
            editingDurationId === episode.id;
          const hasDeliverable = episode.blocks.some(
            (block) => block.type === "deliverable",
          );
          const episodeCurriculumLessonId =
            episode.curriculumLessonId ??
            episode.blocks.find((block) => block.sourceLessonId)
              ?.sourceLessonId ??
            null;
          const episodeCurriculumLesson = episodeCurriculumLessonId
            ? curriculumLessons.find(
                (lesson) =>
                  lesson.LessonID === episodeCurriculumLessonId,
              ) ?? null
            : null;
          const episodeCurriculumOutcomes = episodeCurriculumLesson
            ? getOutcomeList(episodeCurriculumLesson.KeyOutcome)
              : [];

          return (
            <article
              className={`teaching-episode${isOpen ? " is-open" : ""}`}
              key={episode.id}
            >
              <div className="episode-spine">
                <button
                  className="episode-disclosure"
                  type="button"
                  aria-label={isOpen ? "Collapse episode" : "Expand episode"}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenEpisodeIds((current) => {
                      const next = new Set(current);

                      if (next.has(episode.id)) {
                        next.delete(episode.id);
                      } else {
                        next.add(episode.id);
                      }

                      return next;
                    })
                  }
                >
                  {isOpen ? "▾" : "▸"}
                </button>

                <div className="episode-spine-main">
                  <span className="episode-title-print">
                    {episode.title || DEFAULT_EPISODE_TITLE_DISPLAY}
                    {episode.isDeliverable ? (
                      <span className="episode-deliverable-badge">
                        Deliverable
                      </span>
                    ) : null}
                  </span>
                  {isEditingTitle ? (
                    <input
                      className="episode-title-input"
                      value={episode.title}
                      autoFocus
                      onChange={(event) =>
                        updateEpisode(
                          episode.id,
                          (current) => ({
                            ...current,
                            title: event.target.value,
                          }),
                          { record: false },
                        )
                      }
                      onBlur={() => setEditingTitleId(null)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          (event.metaKey || event.ctrlKey)
                        ) {
                          event.preventDefault();
                          addEpisode(episodeIndex);
                          return;
                        }

                        if (event.key === "Enter") {
                          event.preventDefault();
                          setEditingTitleId(null);
                          setOpenEpisodeIds((current) => {
                            const next = new Set(current);
                            next.add(episode.id);
                            return next;
                          });
                          focusBlock(episode.blocks[0].id);
                          return;
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          setEditingTitleId(null);
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="episode-title-button"
                      type="button"
                      onClick={() => {
                        if (!isOpen) {
                          setOpenEpisodeIds((current) => {
                            const next = new Set(current);
                            next.add(episode.id);
                            return next;
                          });
                          focusBlock(episode.blocks[0].id);
                          return;
                        }

                        setEditingTitleId(episode.id);
                      }}
                    >
                      {episode.title || DEFAULT_EPISODE_TITLE_DISPLAY}
                      {episode.isDeliverable ? (
                        <span className="episode-deliverable-badge">
                          Deliverable
                        </span>
                      ) : null}
                    </button>
                  )}

                  <div className="episode-spine-meta">
                    {hasDeliverable ? (
                      <span
                        className="episode-deliverable-mark"
                        title="Includes a deliverable"
                      >
                        ▢
                      </span>
                    ) : null}
                    {isEditingDuration ? (
                      <span className="episode-duration-editor">
                        <input
                          className="episode-duration-input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={durationDraft}
                          autoFocus
                          aria-label="Episode duration in minutes"
                          onFocus={(event) => event.currentTarget.select()}
                          onChange={(event) => {
                            const digitsOnly =
                              event.target.value.replace(/[^0-9]/g, "");
                            setDurationDraft(digitsOnly);
                          }}
                          onBlur={() =>
                            commitDurationEdit(episode.id)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitDurationEdit(episode.id);
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelDurationEdit();
                            }
                          }}
                        />
                        <span aria-hidden="true">m</span>
                      </span>
                    ) : (
                      <button
                        className={`episode-duration-button${
                          episode.minutes ? "" : " is-estimated"
                        }`}
                        type="button"
                        aria-label={
                          episode.minutes
                            ? `Edit ${episode.minutes} minute duration`
                            : `Edit estimated ${estimateEpisodeMinutes(
                                episode.blocks,
                              )} minute duration`
                        }
                        title={
                          episode.minutes
                            ? "Edit duration"
                            : "Estimated duration — click to override"
                        }
                        onClick={() => beginDurationEdit(episode)}
                      >
                        {episode.minutes
                          ? `${episode.minutes}m`
                          : `≈${estimateEpisodeMinutes(
                              episode.blocks,
                            )}m`}
                      </button>
                    )}

                  </div>
                </div>

                <div
                  className={`episode-hover-controls${
                    episodeMenuId === episode.id
                      ? " has-open-menu"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-label="Move episode up"
                    disabled={episodeIndex === 0}
                    onClick={() => moveEpisode(episodeIndex, -1)}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    aria-label="Move episode down"
                    disabled={episodeIndex === episodes.length - 1}
                    onClick={() => moveEpisode(episodeIndex, 1)}
                  >
                    ↓
                  </button>

                  <div className="episode-overflow">
                    <button
                      type="button"
                      aria-label="Episode actions"
                      aria-expanded={episodeMenuId === episode.id}
                      onClick={() =>
                        setEpisodeMenuId((current) =>
                          current === episode.id ? null : episode.id,
                        )
                      }
                    >
                      ···
                    </button>

                    {episodeMenuId === episode.id ? (
                      <div className="episode-overflow-menu">
                        <div className="episode-menu-section-label">
                          Curriculum lesson
                        </div>

                        {curriculumChooserEpisodeId === episode.id ? (
                          curriculumLessons.length ? (
                            <div className="episode-curriculum-options">
                              {curriculumLessons.map((lesson) => {
                                const isAttached =
                                  lesson.LessonID ===
                                  episodeCurriculumLessonId;

                                return (
                                  <button
                                    className={
                                      isAttached ? "is-selected" : ""
                                    }
                                    type="button"
                                    key={lesson.LessonID}
                                    onClick={() =>
                                      chooseLessonForEpisode(
                                        episode.id,
                                        lesson,
                                      )
                                    }
                                  >
                                    <span
                                      className="episode-curriculum-option-mark"
                                      aria-hidden="true"
                                    >
                                      {isAttached ? "●" : "○"}
                                    </span>

                                    <span>
                                      <strong>
                                        Lesson {lesson.LessonNumber}
                                      </strong>
                                      <span>
                                        {lesson.LessonTitle ||
                                          "Untitled lesson"}
                                      </span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="episode-menu-empty">
                              No lessons are available in this unit.
                            </p>
                          )
                        ) : (
                          <div className="episode-menu-actions">
                            {episodeCurriculumLesson ? (
                              <span className="episode-menu-empty">
                                {episodeCurriculumLesson.LessonTitle ||
                                  "Untitled lesson"}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() =>
                                setCurriculumChooserEpisodeId(episode.id)
                              }
                            >
                              {episodeCurriculumLesson
                                ? "Change Lesson…"
                                : "Choose Lesson…"}
                            </button>

                            {episodeCurriculumLesson ? (
                              <button
                                type="button"
                                onClick={() =>
                                  removeLessonConnection(episode.id)
                                }
                              >
                                Remove Lesson Connection
                              </button>
                            ) : null}
                          </div>
                        )}

                        <div className="episode-menu-actions">
                          <button
                            className="episode-copy-action"
                            type="button"
                            onClick={() =>
                              copyEpisodeToClipboard(episode)
                            }
                          >
                            Copy episode
                          </button>

                          <button
                            className="episode-mark-deliverable-action"
                            type="button"
                            onClick={() =>
                              toggleEpisodeDeliverable(episode.id)
                            }
                          >
                            {episode.isDeliverable
                              ? "Unmark as Deliverable"
                              : "Mark as Deliverable"}
                          </button>

                          {episodeCurriculumLesson ? (
                            <button
                              className="episode-import-curriculum-action"
                              type="button"
                              onClick={() =>
                                importCurriculumContent(
                                  episode.id,
                                  episodeCurriculumLesson,
                                )
                              }
                            >
                              Import curriculum content
                            </button>
                          ) : null}

                          <div className="episode-menu-divider" />

                          <button
                            className="episode-delete-action"
                            type="button"
                            onClick={() => deleteEpisode(episode.id)}
                          >
                            Delete episode
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <span className="episode-elapsed-print" aria-hidden="true">
                {String(
                  cumulativeMinutesByEpisodeId.get(episode.id),
                ).padStart(2, "0")}
              </span>

              <div
                className={`episode-body${isOpen ? "" : " is-collapsed"}`}
              >
                  {episodeCurriculumLesson ? (
                    <details className="episode-curriculum-reference">
                      <summary>
                        Curriculum · {episodeCurriculumLesson.LessonTitle}
                      </summary>

                      <div className="episode-curriculum-reference-body">
                        <p className="episode-curriculum-identity">
                          Unit {episodeCurriculumLesson.UnitID?.replace(/.*U/, "")} ·
                          Lesson {episodeCurriculumLesson.LessonNumber}
                        </p>

                        {episodeCurriculumLesson.Description ? (
                          <div>
                            <h3>Description</h3>
                            <p>{episodeCurriculumLesson.Description}</p>
                          </div>
                        ) : null}

                        {episodeCurriculumOutcomes.length ? (
                          <div>
                            <h3>Key outcomes</h3>
                            <ul>
                              {episodeCurriculumOutcomes.map((outcome) => (
                                <li key={outcome}>{outcome}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {episodeCurriculumLesson.TeacherNotes ? (
                          <div>
                            <h3>Teacher notes</h3>
                            <p>{episodeCurriculumLesson.TeacherNotes}</p>
                          </div>
                        ) : null}

                        {episodeCurriculumLesson.PrimaryLink ? (
                          <a
                            href={episodeCurriculumLesson.PrimaryLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open curriculum source ↗
                          </a>
                        ) : null}
                      </div>
                    </details>
                  ) : null}

                  {(() => {
                    const hiddenBlockIds = getHiddenBlockIds(
                      episode.blocks,
                    );

                    return episode.blocks.map((block, blockIndex) => {
                      if (hiddenBlockIds.has(block.id)) {
                        return null;
                      }

                      const support = SUPPORT_TYPES.find(
                        (item) => item.type === block.type,
                      );
                      const hasChildren = blockHasChildren(
                        episode.blocks,
                        blockIndex,
                      );
                      const isBlockCollapsed =
                        collapsedBlockIds.includes(block.id);

                      return (
                      <div
                        className={`episode-block depth-${block.depth}${
                          block.type !== "text" ? " is-support" : ""
                        }`}
                        key={block.id}
                      >
                        <div className="episode-block-leading">
                          {hasChildren ? (
                            <button
                              className="episode-block-branch-toggle"
                              type="button"
                              aria-label={
                                isBlockCollapsed
                                  ? "Expand nested outline lines"
                                  : "Collapse nested outline lines"
                              }
                              aria-expanded={!isBlockCollapsed}
                              title={
                                isBlockCollapsed
                                  ? "Expand branch"
                                  : "Collapse branch"
                              }
                              onClick={() =>
                                toggleBlockCollapsed(block.id)
                              }
                            >
                              {isBlockCollapsed ? "▸" : "▾"}
                            </button>
                          ) : (
                            <span
                              className="episode-block-branch-spacer"
                              aria-hidden="true"
                            />
                          )}

                        {block.type === "text" ||
                        block.type === "learning" ||
                        block.type === "deliverable" ||
                        block.type === "materials" ? (
                          <button
                            className="episode-block-glyph episode-block-type-toggle"
                            type="button"
                            title={
                              block.type === "text"
                                ? "Change to learning target"
                                : block.type === "learning"
                                  ? "Change to deliverable"
                                  : block.type === "deliverable"
                                    ? "Change to materials"
                                    : "Change to ordinary outline"
                            }
                            aria-label={
                              block.type === "text"
                                ? "Change this outline line to a learning target"
                                : block.type === "learning"
                                  ? "Change this learning target to a deliverable"
                                  : block.type === "deliverable"
                                    ? "Change this deliverable to materials"
                                    : "Change these materials to an ordinary outline line"
                            }
                            onClick={() =>
                              toggleBlockType(episode.id, blockIndex)
                            }
                          >
                            {block.type === "learning"
                              ? "◎"
                              : block.type === "deliverable"
                                ? "▢"
                                : block.type === "materials"
                                  ? "◇"
                                  : "•"}
                          </button>
                        ) : (
                          <span className="episode-block-glyph">
                            {support?.glyph ?? "•"}
                          </span>
                        )}
                        </div>

                        <textarea
                          ref={(node) => {
                            if (node) {
                              inputRefs.current.set(block.id, node);
                            } else {
                              inputRefs.current.delete(block.id);
                            }
                          }}
                          className="episode-block-input"
                          rows={1}
                          value={block.text}
                          placeholder=""
                          onChange={(event) => {
                            const value = event.target.value;

                            updateBlockText(
                              episode.id,
                              blockIndex,
                              value === "/" ? "" : value,
                            );

                            if (value === "/" && block.text === "") {
                              setSlashMenu({
                                episodeId: episode.id,
                                blockIndex,
                              });
                            }
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" &&
                              (event.metaKey || event.ctrlKey)
                            ) {
                              event.preventDefault();
                              addEpisode(episodeIndex);
                              return;
                            }

                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              splitBlockAtCaret(
                                episode.id,
                                blockIndex,
                                event.currentTarget.selectionStart ?? 0,
                                event.currentTarget.selectionEnd ?? 0,
                              );
                              return;
                            }

                            if (event.key === "Tab") {
                              event.preventDefault();

                              updateEpisode(episode.id, (current) => ({
                                ...current,
                                blocks: current.blocks.map(
                                  (currentBlock, index) =>
                                    index === blockIndex
                                      ? {
                                          ...currentBlock,
                                          depth: event.shiftKey ? 0 : 1,
                                        }
                                      : currentBlock,
                                ),
                              }));

                              return;
                            }

                            if (
                              event.key === "Backspace" &&
                              event.currentTarget.selectionStart === 0 &&
                              event.currentTarget.selectionEnd === 0
                            ) {
                              event.preventDefault();

                              if (block.text.length === 0) {
                                deleteBlock(episode.id, blockIndex);
                              } else {
                                joinWithPreviousBlock(
                                  episode.id,
                                  blockIndex,
                                );
                              }

                              return;
                            }

                            if (
                              event.key === "ArrowUp" &&
                              !event.metaKey &&
                              !event.ctrlKey &&
                              !event.altKey
                            ) {
                              const visibleBlocks = episode.blocks.filter(
                                (currentBlock) =>
                                  !hiddenBlockIds.has(currentBlock.id),
                              );
                              const visibleIndex = visibleBlocks.findIndex(
                                (currentBlock) =>
                                  currentBlock.id === block.id,
                              );
                              const previousBlock =
                                visibleBlocks[visibleIndex - 1];

                              if (previousBlock) {
                                event.preventDefault();
                                const input = inputRefs.current.get(
                                  previousBlock.id,
                                );

                                if (input) {
                                  input.focus();
                                  const end = input.value.length;
                                  input.setSelectionRange(end, end);
                                }
                              }

                              return;
                            }

                            if (
                              event.key === "ArrowDown" &&
                              !event.metaKey &&
                              !event.ctrlKey &&
                              !event.altKey
                            ) {
                              const visibleBlocks = episode.blocks.filter(
                                (currentBlock) =>
                                  !hiddenBlockIds.has(currentBlock.id),
                              );
                              const visibleIndex = visibleBlocks.findIndex(
                                (currentBlock) =>
                                  currentBlock.id === block.id,
                              );
                              const nextBlock =
                                visibleBlocks[visibleIndex + 1];

                              if (nextBlock) {
                                event.preventDefault();
                                const input = inputRefs.current.get(
                                  nextBlock.id,
                                );

                                if (input) {
                                  input.focus();
                                  input.setSelectionRange(0, 0);
                                }
                              }

                              return;
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              setSlashMenu(null);
                              setOpenEpisodeIds((current) => {
                                const next = new Set(current);
                                next.delete(episode.id);
                                return next;
                              });
                              return;
                            }

                            if (
                              event.key === "ArrowUp" &&
                              (event.metaKey || event.ctrlKey)
                            ) {
                              event.preventDefault();
                              moveEpisode(episodeIndex, -1);
                            }

                            if (
                              event.key === "ArrowDown" &&
                              (event.metaKey || event.ctrlKey)
                            ) {
                              event.preventDefault();
                              moveEpisode(episodeIndex, 1);
                            }
                          }}
                        />

                        <span className="episode-block-text-print">
                          {block.text}
                        </span>

                        <div className="episode-block-controls">
                          <button
                            type="button"
                            aria-label="Move outline line up"
                            title="Move up"
                            onClick={() =>
                              moveBlock(episode.id, blockIndex, -1)
                            }
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            aria-label="Move outline line down"
                            title="Move down"
                            onClick={() =>
                              moveBlock(episode.id, blockIndex, 1)
                            }
                          >
                            ↓
                          </button>

                          <button
                            className="episode-block-delete"
                            type="button"
                            aria-label="Delete outline line"
                            title="Delete line"
                            onClick={() =>
                              deleteBlock(episode.id, blockIndex)
                            }
                          >
                            ×
                          </button>
                        </div>

                        {slashMenu?.episodeId === episode.id &&
                        slashMenu?.blockIndex === blockIndex ? (
                          <div
                            className="episode-slash-menu"
                            role="menu"
                            aria-label="Add supporting content"
                          >
                            {SUPPORT_TYPES.map((item) => (
                              <button
                                type="button"
                                role="menuitem"
                                key={item.type}
                                onMouseDown={(event) =>
                                  event.preventDefault()
                                }
                                onClick={() =>
                                  selectSupport(
                                    episode.id,
                                    blockIndex,
                                    item.type,
                                  )
                                }
                              >
                                <span>{item.glyph}</span>
                                {item.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      );
                    });
                  })()}
              </div>
            </article>
          );
        })}

        <div className="episode-add-controls">
          <details
            ref={addEpisodeMenuRef}
            className="episode-add-menu"
            onToggle={(event) => {
              setIsAddEpisodeMenuOpen(event.currentTarget.open);

              if (!event.currentTarget.open) {
                setIsAddEpisodeCurriculumPickerOpen(false);
              }
            }}
          >
            <summary className="add-episode-button">
              + Add Episode
            </summary>

            <div className="episode-add-menu-options">
              {isAddEpisodeCurriculumPickerOpen ? (
                <>
                  <div className="episode-menu-section-label">
                    Attach Curriculum Lesson
                  </div>

                  {curriculumLessons.length ? (
                    <div className="episode-curriculum-options">
                      {curriculumLessons.map((lesson) => (
                        <button
                          type="button"
                          key={lesson.LessonID}
                          onClick={(event) => {
                            addEpisodeFromCurriculumLesson(lesson);
                            event.currentTarget
                              .closest("details")
                              ?.removeAttribute("open");
                          }}
                        >
                          <span
                            className="episode-curriculum-option-mark"
                            aria-hidden="true"
                          >
                            ○
                          </span>

                          <span>
                            <strong>Lesson {lesson.LessonNumber}</strong>
                            <span>
                              {lesson.LessonTitle || "Untitled lesson"}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="episode-menu-empty">
                      No lessons are available in this unit.
                    </p>
                  )}

                  <div className="episode-menu-actions">
                    <button
                      type="button"
                      onClick={(event) =>
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open")
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(event) => {
                      addEpisode(undefined, { title: "" });
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                    }}
                  >
                    New Blank Episode
                  </button>

                  <div className="episode-menu-divider" />

                  <div className="episode-add-menu-section-label">
                    Templates
                  </div>

                  {EPISODE_TEMPLATES.slice(1).map((template) => (
                    <button
                      type="button"
                      key={template.key}
                      onClick={(event) => {
                        addEpisode(undefined, { title: template.title });
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                      }}
                    >
                      {template.label}
                    </button>
                  ))}

                  <div className="episode-menu-divider" />

                  <button
                    type="button"
                    onClick={() => setIsAddEpisodeCurriculumPickerOpen(true)}
                  >
                    Attach Lesson…
                  </button>
                </>
              )}
            </div>
          </details>

          {hasEpisodeClipboard ? (
            <button
              className="paste-episode-button"
              type="button"
              onClick={pasteEpisodeFromClipboard}
            >
              Paste copied episode
            </button>
          ) : null}
        </div>
      </div>

      <div className="lesson-summary-row">
        <span className="lesson-summary-label">
          {hasEstimatedDurations ? "Estimated total" : "Total"}
        </span>

        <span className="lesson-summary-minutes">
          {hasEstimatedDurations ? "≈" : ""}
          {totalDisplayedMinutes}m
        </span>
      </div>

      <div className="lesson-draft-footer">
        <p className="lesson-draft-status">
          Saved locally · {episodes.length} episodes ·{" "}
          {activeDeliverableCount} deliverables
        </p>

        <div className="lesson-history-controls">
          <button
            type="button"
            disabled={!canUndo}
            title="Undo"
            aria-label="Undo last structural change"
            onClick={undo}
          >
            ↶ Undo
          </button>

          <button
            type="button"
            disabled={!canRedo}
            title="Redo"
            aria-label="Redo last structural change"
            onClick={redo}
          >
            Redo ↷
          </button>
        </div>
      </div>
      </div>

      <aside
        className="lesson-session-print-notes"
        aria-label="Handwritten notes"
      >
        <svg
          className="lesson-session-print-notes-grid"
          aria-hidden="true"
          focusable="false"
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="lesson-session-notes-dot-grid"
              width="17pt"
              height="17pt"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1pt" cy="1pt" r="0.75pt" fill="#9ea4ac" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#lesson-session-notes-dot-grid)"
          />
        </svg>
        <h3>Notes</h3>
      </aside>
      </div>
    </section>
  );
}

export default LessonSessionView;
