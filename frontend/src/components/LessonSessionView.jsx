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

function LessonSessionView({ activeLessonContext }) {
  const [plannerState, setPlannerState] = useState(loadInitialState);
  const [openEpisodeId, setOpenEpisodeId] = useState(
    plannerState.episodes[1]?.id ?? plannerState.episodes[0]?.id ?? null,
  );
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [slashMenu, setSlashMenu] = useState(null);
  const [episodeMenuId, setEpisodeMenuId] = useState(null);
  const [collapsedBlockIds, setCollapsedBlockIds] = useState(
    loadCollapsedBlockIds,
  );
  const inputRefs = useRef(new Map());

  const { episodes, deliverables } = plannerState;

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

  function updateEpisode(episodeId, updater) {
    setPlannerState((current) => ({
      ...current,
      episodes: current.episodes.map((episode) =>
        episode.id === episodeId ? updater(episode) : episode,
      ),
    }));
  }

  function focusBlock(blockId) {
    window.requestAnimationFrame(() => {
      inputRefs.current.get(blockId)?.focus();
    });
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

    setOpenEpisodeId(episode.id);
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

    if (openEpisodeId === episodeId) {
      setOpenEpisodeId(null);
    }

    if (editingTitleId === episodeId) {
      setEditingTitleId(null);
    }

    setEpisodeMenuId(null);
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
    updateEpisode(episodeId, (episode) => ({
      ...episode,
      blocks: episode.blocks.map((block, index) => {
        if (index !== blockIndex) return block;

        if (block.type === "text") {
          return {
            ...block,
            type: "learning",
            deliverableId: null,
          };
        }

        if (block.type === "learning") {
          return {
            ...block,
            type: "text",
            deliverableId: null,
          };
        }

        return block;
      }),
    }));
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
    });

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
          const isOpen = openEpisodeId === episode.id;
          const isEditingTitle = editingTitleId === episode.id;
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
                    setOpenEpisodeId(isOpen ? null : episode.id)
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
                        updateEpisode(episode.id, (current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      onBlur={() => setEditingTitleId(null)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          setEditingTitleId(null);
                          setOpenEpisodeId(episode.id);
                          focusBlock(episode.blocks[0].id);
                        }

                        if (
                          event.key === "Enter" &&
                          (event.metaKey || event.ctrlKey)
                        ) {
                          event.preventDefault();
                          addEpisode(episodeIndex);
                        }

                        if (event.key === "Escape") {
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
                          setOpenEpisodeId(episode.id);
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
                    {episode.minutes ? (
                      <span>{episode.minutes} min</span>
                    ) : null}

                    {hasDeliverable ? (
                      <span
                        className="episode-deliverable-mark"
                        title="Includes a deliverable"
                      >
                        ▢
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="episode-hover-controls">
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
                        block.type === "learning" ? (
                          <button
                            className="episode-block-glyph episode-block-type-toggle"
                            type="button"
                            title={
                              block.type === "learning"
                                ? "Change to ordinary outline"
                                : "Change to learning target"
                            }
                            aria-label={
                              block.type === "learning"
                                ? "Change this learning target to an ordinary outline line"
                                : "Change this outline line to a learning target"
                            }
                            onClick={() =>
                              toggleBlockType(episode.id, blockIndex)
                            }
                          >
                            {block.type === "learning" ? "◎" : "•"}
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
                              addBlockAfter(episode.id, blockIndex);
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

                            if (event.key === "Escape") {
                              event.preventDefault();
                              setSlashMenu(null);
                              setOpenEpisodeId(null);
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

      <p className="lesson-draft-status">
        Saved locally · {episodes.length} episodes · {deliverables.length}{" "}
        deliverables
      </p>
    </section>
  );
}

export default LessonSessionView;
