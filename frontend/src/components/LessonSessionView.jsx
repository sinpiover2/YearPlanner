import { useState } from "react";

function LessonSessionView({ activeLessonContext }) {
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [openItemIndex, setOpenItemIndex] = useState(1);

  const sessionItems = [
    {
      action: "Welcome students and check permission slips.",
      phase: "Warm-up",
      type: "Admin",
      minutes: 4,
      detail: "Settle the room and clear the logistics before instruction begins.",
      targets: [],
      moves: ["Keep this brief.", "Do not let logistics consume the launch."],
      evidence: [],
    },
    {
      action: "Students create multistep transformations.",
      phase: "Explore",
      type: "Instruction",
      minutes: 25,
      detail: "Amplify 1.3 · Creating Multistep Transformations",
      targets: [
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
      action: "Students explain one transformation sequence verbally.",
      phase: "Synthesize",
      type: "Instruction",
      minutes: 12,
      detail: "Use two contrasting student examples.",
      targets: ["I can describe multistep transformations verbally."],
      moves: ["Press for sequence language: first, then, finally."],
      evidence: ["Whole-class discussion"],
    },
    {
      action: "Students complete a short exit ticket.",
      phase: "Assess",
      type: "Assessment",
      minutes: 6,
      detail: "One visualizing item and one verbal description item.",
      targets: [],
      moves: ["Collect before dismissal."],
      evidence: ["Exit ticket"],
    },
  ];

  return (
    <section className="workspace-panel lesson-session-workspace">
      <header className="workspace-header lesson-session-header">
        <div>
          <p className="eyebrow">Lesson Planner</p>
          <h2>Teach from actions, not categories.</h2>
          <p>
            Build a calm class session from mental checkpoints: what students do,
            why it matters, how you will teach it, and what evidence you need.
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

          return (
            <article className="session-item" key={item.action}>
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
                      defaultValue={item.action}
                      autoFocus
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
                      {item.action}
                    </button>
                  )}

                  <button
                    className="session-item-meta-button"
                    type="button"
                    onClick={() => setOpenItemIndex(isOpen ? null : index)}
                  >
                    {item.phase} · {item.type} · {item.minutes} min
                  </button>
                </div>
              </div>

              {isOpen ? (
                <div className="session-item-body">
                  <section>
                    <h4>Why</h4>
                    <p>{item.detail}</p>
                    {item.targets.length ? (
                      <ul>
                        {item.targets.map((target) => (
                          <li key={target}>{target}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>

                  <section>
                    <h4>Teacher Moves</h4>
                    <ul>
                      {item.moves.map((move) => (
                        <li key={move}>{move}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h4>Evidence</h4>
                    {item.evidence.length ? (
                      <ul>
                        {item.evidence.map((evidence) => (
                          <li key={evidence}>{evidence}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No evidence attached yet.</p>
                    )}
                  </section>
                </div>
              ) : null}
            </article>
          );
        })}

        <button className="add-session-item-button" type="button">
          + Add Session Item
        </button>
      </div>
    </section>
  );
}

export default LessonSessionView;
