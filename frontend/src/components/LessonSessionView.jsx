import { useEffect, useState } from "react";

const LESSON_SESSION_STORAGE_KEY =
  "year-planner.lesson-session-items.prototype.v1";

const defaultSessionItems = [
  {
    id: "prototype-welcome",
    action: "Welcome students and check permission slips.",
    phase: "Warm-up",
    type: "Admin",
    minutes: 4,
    notes:
      "Settle the room and clear the logistics before instruction begins.",
    detail: "Settle the room and clear the logistics before instruction begins.",
    learningTargets: [],
    moves: ["Keep this brief.", "Do not let logistics consume the launch."],
    evidence: [],
  },
  {
    id: "prototype-explore",
    action: "Students create multistep transformations.",
    phase: "Explore",
    type: "Instruction",
    minutes: 25,
    notes: "Amplify 1.3 · Creating Multistep Transformations",
    detail: "Amplify 1.3 · Creating Multistep Transformations",
    learningTargets: [
      "I can visualize multistep transformations.",
      "I can describe multistep transformations verbally.",
    ],
    moves: [
      "Ask students to predict the final image before calculating.",
      "Have partners describe the transformation sequence out loud.",
    ],
    evidence: ["Notebook work", "Verbal descriptions during pair share"],
  },
  {
    id: "prototype-synthesize",
    action: "Students explain one transformation sequence verbally.",
    phase: "Synthesize",
    type: "Instruction",
    minutes: 12,
    notes: "Use two contrasting student examples.",
    detail: "Use two contrasting student examples.",
    learningTargets: [
      "I can describe multistep transformations verbally.",
    ],
    moves: ["Press for sequence language: first, then, finally."],
    evidence: ["Whole-class discussion"],
  },
  {
    id: "prototype-assess",
    action: "Students complete a short exit ticket.",
    phase: "Assess",
    type: "Assessment",
    minutes: 6,
    notes: "One visualizing item and one verbal description item.",
    detail: "One visualizing item and one verbal description item.",
    learningTargets: [],
    moves: ["Collect before dismissal."],
    evidence: ["Exit ticket"],
  },
];

function createSessionItemId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.randomUUID
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `session-item-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function normalizeSessionItem(item) {
  return {
    id: item.id || createSessionItemId(),
    action: item.action ?? "",
    phase: item.phase ?? "Plan",
    type: item.type ?? "Instruction",
    minutes: item.minutes ?? 5,
    notes: item.notes ?? item.detail ?? "",
    detail: item.detail ?? "",
    learningTargets: Array.isArray(item.learningTargets)
      ? item.learningTargets
      : [],
    moves: Array.isArray(item.moves) ? item.moves : [],
    evidence: Array.isArray(item.evidence) ? item.evidence : [],
  };
}

function loadSessionItems() {
  if (typeof window === "undefined") {
    return defaultSessionItems;
  }

  try {
    const storedItems = window.localStorage.getItem(
      LESSON_SESSION_STORAGE_KEY,
    );

    if (!storedItems) {
      return defaultSessionItems;
    }

    const parsedItems = JSON.parse(storedItems);

    if (!Array.isArray(parsedItems)) {
      return defaultSessionItems;
    }

    return parsedItems.map(normalizeSessionItem);
  } catch (error) {
    console.warn("Could not load the local Lesson Planner draft.", error);
    return defaultSessionItems;
  }
}

function LessonSessionView({ activeLessonContext }) {
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [openItemIndex, setOpenItemIndex] = useState(1);
  const [sessionItems, setSessionItems] = useState(loadSessionItems);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LESSON_SESSION_STORAGE_KEY,
        JSON.stringify(sessionItems),
      );
    } catch (error) {
      console.warn("Could not save the local Lesson Planner draft.", error);
    }
  }, [sessionItems]);

  return (
    <section className="workspace-panel lesson-session-workspace">
      <header className="workspace-header lesson-session-header">
        <div>
          <p className="eyebrow">Lesson Planner</p>
          <h2>Teach from actions, not categories.</h2>
          <p>
            Build a calm class session from mental checkpoints: what students
            do, why it matters, how you will teach it, and what evidence you
            need.
          </p>
        </div>

        <div className="lesson-context-pill">
          {activeLessonContext?.lessonId || "No lesson selected yet"}
        </div>
      </header>

      <div className="lesson-session-outline">
        {sessionItems.map((item, index) => {
          const isEditing = editingItemIndex === index;
          const isOpen = openItemIndex === index || isEditing;
          const notesPreview = item.notes?.trim();

          return (
            <article className="session-item" key={item.id}>
              <div className="session-item-topline">
                <button
                  className="session-item-index"
                  type="button"
                  onClick={() => setOpenItemIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  {index}
                </button>

                <div className="session-item-summary">
                  {isEditing ? (
                    <input
                      className="session-item-action-input"
                      value={item.action}
                      placeholder="What happens next?"
                      autoFocus
                      onChange={(event) => {
                        setSessionItems((items) =>
                          items.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...currentItem,
                                  action: event.target.value,
                                }
                              : currentItem,
                          ),
                        );
                      }}
                      onBlur={() => setEditingItemIndex(null)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          setEditingItemIndex(null);
                        }

                        if (event.key === "Escape") {
                          setEditingItemIndex(null);
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="session-item-action-button"
                      type="button"
                      onClick={() => setEditingItemIndex(index)}
                    >
                      {item.action || "Untitled teaching step"}
                    </button>
                  )}

                  {!isOpen && notesPreview ? (
                    <button
                      className="session-item-notes-preview"
                      type="button"
                      onClick={() => setOpenItemIndex(index)}
                    >
                      {notesPreview}
                    </button>
                  ) : null}

                  <button
                    className="session-item-meta-button"
                    type="button"
                    onClick={() => setOpenItemIndex(isOpen ? null : index)}
                  >
                    {item.phase} · {item.type} · {item.minutes} min
                  </button>
                </div>
              </div>

              <div
                className="session-item-controls"
                aria-label="Session item controls"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSessionItems((items) => {
                      if (index === 0) return items;

                      const nextItems = [...items];
                      const [movedItem] = nextItems.splice(index, 1);
                      nextItems.splice(index - 1, 0, movedItem);
                      return nextItems;
                    });

                    setOpenItemIndex(Math.max(0, index - 1));
                    setEditingItemIndex(null);
                  }}
                  disabled={index === 0}
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSessionItems((items) => {
                      if (index === items.length - 1) return items;

                      const nextItems = [...items];
                      const [movedItem] = nextItems.splice(index, 1);
                      nextItems.splice(index + 1, 0, movedItem);
                      return nextItems;
                    });

                    setOpenItemIndex(index + 1);
                    setEditingItemIndex(null);
                  }}
                  disabled={index === sessionItems.length - 1}
                >
                  ↓
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSessionItems((items) =>
                      items.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    );
                    setOpenItemIndex(null);
                    setEditingItemIndex(null);
                  }}
                >
                  Delete
                </button>
              </div>

              {isOpen ? (
                <div className="session-item-body">
                  <section className="session-item-notes-section">
                    <h4>What happens</h4>

                    <textarea
                      className="session-item-notes-input"
                      value={item.notes ?? ""}
                      placeholder="Write what you want to remember, say, ask, or do..."
                      rows={3}
                      onChange={(event) => {
                        setSessionItems((items) =>
                          items.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...currentItem,
                                  notes: event.target.value,
                                }
                              : currentItem,
                          ),
                        );
                      }}
                    />
                  </section>

                  <section>
                    <h4>Learning</h4>

                    <ul className="session-item-learning-list">
                      {(item.learningTargets ?? []).map(
                        (target, targetIndex) => (
                          <li key={targetIndex}>
                            <input
                              className="session-item-quiet-input"
                              value={target}
                              placeholder="I can..."
                              onChange={(event) => {
                                setSessionItems((items) =>
                                  items.map(
                                    (currentItem, itemIndex) =>
                                      itemIndex === index
                                        ? {
                                            ...currentItem,
                                            learningTargets:
                                              currentItem.learningTargets.map(
                                                (
                                                  currentTarget,
                                                  currentTargetIndex,
                                                ) =>
                                                  currentTargetIndex ===
                                                  targetIndex
                                                    ? event.target.value
                                                    : currentTarget,
                                              ),
                                          }
                                        : currentItem,
                                  ),
                                );
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                            />
                          </li>
                        ),
                      )}
                    </ul>

                    <button
                      className="session-item-add-link"
                      type="button"
                      onClick={() => {
                        setSessionItems((items) =>
                          items.map((currentItem, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...currentItem,
                                  learningTargets: [
                                    ...(currentItem.learningTargets ?? []),
                                    "I can ",
                                  ],
                                }
                              : currentItem,
                          ),
                        );
                      }}
                    >
                      + Add Learning Target
                    </button>
                  </section>

                  {item.moves.length ? (
                    <section>
                      <h4>Teacher Moves</h4>
                      <ul>
                        {item.moves.map((move, moveIndex) => (
                          <li key={`${item.id}-move-${moveIndex}`}>
                            {move}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {item.evidence.length ? (
                    <section>
                      <h4>Evidence</h4>
                      <ul>
                        {item.evidence.map(
                          (evidence, evidenceIndex) => (
                            <li
                              key={`${item.id}-evidence-${evidenceIndex}`}
                            >
                              {evidence}
                            </li>
                          ),
                        )}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}

        <button
          className="add-session-item-button"
          type="button"
          onClick={() => {
            const newIndex = sessionItems.length;

            setSessionItems((items) => [
              ...items,
              {
                id: createSessionItemId(),
                action: "",
                phase: "Plan",
                type: "Instruction",
                minutes: 5,
                notes: "",
                detail: "",
                learningTargets: [],
                moves: [],
                evidence: [],
              },
            ]);

            setOpenItemIndex(newIndex);
            setEditingItemIndex(newIndex);
          }}
        >
          + Next Teaching Step
        </button>
      </div>
    </section>
  );
}

export default LessonSessionView;
