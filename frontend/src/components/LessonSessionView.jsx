import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "year-planner.lesson-session.prototype.v2";
const LEGACY_STORAGE_KEY = "year-planner.lesson-session-items.prototype.v1";
const COLLAPSED_BLOCKS_STORAGE_KEY =
  "year-planner.lesson-session.collapsed-blocks.v1";

const SUPPORT_TYPES = [
  { type: "learning", label: "Learning", glyph: "◎" },
  { type: "deliverable", label: "Deliverable", glyph: "▢" },
  { type: "materials", label: "Materials", glyph: "◇" },
];

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
    ...overrides,
  };
}

function createEpisode(overrides = {}) {
  return {
    id: createId("episode"),
    title: "",
    minutes: null,
    blocks: [createBlock()],
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
    episodes: [
      createEpisode({
        id: "prototype-welcome",
        title: "Welcome students and check permission slips.",
        minutes: 4,
        blocks: [
          createBlock({
            text: "Settle the room and clear logistics before instruction begins.",
          }),
        ],
      }),
      createEpisode({
        id: "prototype-explore",
        title: "Students create multistep transformations.",
        minutes: 25,
        blocks: [
          createBlock({
            text: "Amplify 1.3 — Creating Multistep Transformations",
          }),
          createBlock({
            type: "learning",
            text: "I can visualize multistep transformations.",
            depth: 1,
          }),
          createBlock({
            type: "learning",
            text: "I can describe multistep transformations verbally.",
            depth: 1,
          }),
          createBlock({
            type: "materials",
            text: "Patty paper and transformation grids",
            depth: 1,
          }),
        ],
      }),
      createEpisode({
        id: "prototype-synthesize",
        title: "Students explain one transformation sequence verbally.",
        minutes: 12,
        blocks: [
          createBlock({
            text: "Use two contrasting student examples.",
          }),
        ],
      }),
      createEpisode({
        id: "prototype-assess",
        title: "Students complete a short exit ticket.",
        minutes: 6,
        blocks: [
          createBlock({
            text: "One visualizing item and one verbal-description item.",
          }),
        ],
      }),
    ],
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
              }))
            : [createBlock()],
      }))
    : [];

  return {
    episodes: episodes.length ? episodes : [createEpisode()],
    deliverables: Array.isArray(value.deliverables)
      ? value.deliverables.map((deliverable) => ({
          id: deliverable.id || createId("deliverable"),
          title: deliverable.title ?? "",
          originatingEpisodeId: deliverable.originatingEpisodeId ?? null,
        }))
      : [],
  };
}

function loadCollapsedBlockIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(
      COLLAPSED_BLOCKS_STORAGE_KEY,
    );

    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Could not load collapsed outline branches.", error);
    return [];
  }
}

function loadInitialState() {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const current = window.localStorage.getItem(STORAGE_KEY);

    if (current) {
      return normalizeStoredState(JSON.parse(current));
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

function LessonSessionView({ activeLessonContext }) {
  const {
    state: plannerState,
    setState: setPlannerState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoableState(loadInitialState);
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
  const [collapsedBlockIds, setCollapsedBlockIds] = useState(
    loadCollapsedBlockIds,
  );
  const inputRefs = useRef(new Map());

  const { episodes, deliverables } = plannerState;

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
    (total, episode) => {
      const manualMinutes = Number(episode.minutes);

      return (
        total +
        (Number.isFinite(manualMinutes) && manualMinutes > 0
          ? manualMinutes
          : estimateEpisodeMinutes(episode.blocks))
      );
    },
    0,
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerState));
    } catch (error) {
      console.warn("Could not save the local Lesson Planner draft.", error);
    }
  }, [plannerState]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        COLLAPSED_BLOCKS_STORAGE_KEY,
        JSON.stringify(collapsedBlockIds),
      );
    } catch (error) {
      console.warn("Could not save collapsed outline branches.", error);
    }
  }, [collapsedBlockIds]);

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

  function addEpisode(afterIndex = episodes.length - 1) {
    const episode = createEpisode();

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
          <h2>Build the lesson in teaching episodes.</h2>
          <p>
            Arrange the chunks. Open one when you want to think inside it.
          </p>
        </div>

        {activeLessonContext?.lessonId ? (
          <div className="lesson-context-pill">
            {activeLessonContext.lessonId}
          </div>
        ) : null}
      </header>

      <div className="episode-stack">
        {episodes.map((episode, episodeIndex) => {
          const isOpen = openEpisodeIds.has(episode.id);
          const isEditingTitle = editingTitleId === episode.id;
          const isEditingDuration =
            editingDurationId === episode.id;
          const hasDeliverable = episode.blocks.some(
            (block) => block.type === "deliverable",
          );

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
                      {episode.title || "Untitled teaching episode"}
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
                        <button
                          className="episode-delete-action"
                          type="button"
                          onClick={() => deleteEpisode(episode.id)}
                        >
                          Delete episode
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {isOpen ? (
                <div className="episode-body">
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
                        block.type === "deliverable" ? (
                          <button
                            className="episode-block-glyph episode-block-type-toggle"
                            type="button"
                            title={
                              block.type === "text"
                                ? "Change to learning target"
                                : block.type === "learning"
                                  ? "Change to deliverable"
                                  : "Change to ordinary outline"
                            }
                            aria-label={
                              block.type === "text"
                                ? "Change this outline line to a learning target"
                                : block.type === "learning"
                                  ? "Change this learning target to a deliverable"
                                  : "Change this deliverable to an ordinary outline line"
                            }
                            onClick={() =>
                              toggleBlockType(episode.id, blockIndex)
                            }
                          >
                            {block.type === "learning"
                              ? "◎"
                              : block.type === "deliverable"
                                ? "▢"
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
              ) : null}
            </article>
          );
        })}

        <button
          className="add-episode-button"
          type="button"
          onClick={() => addEpisode()}
        >
          + Teaching episode
        </button>
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
    </section>
  );
}

export default LessonSessionView;
