# Architecture Reconciliation Summary

## Purpose

Year Planner's architecture accumulated competing descriptions of the same ideas over time — different documents used different names for the same object, some implied containment where the model now uses reference, and enacted instruction was described inconsistently across workspaces.

The reconciliation effort existed to establish **one coherent architectural model**, not several overlapping ones. Its goal was not to invent new architecture, but to align existing documents so that a single reading of the canonical set produces a single, non-contradictory picture of the system.

---

## Major Outcomes

- **Teaching Episode** is now the reusable, portable unit of instructional content. It is durable — it travels intact across sessions, sections, and years — and never carries enacted status.
- **Episode Placement** is the planning relationship that connects a Teaching Episode to one Lesson Session: an ordered reference, not a copy of the content.
- **Session Enactment** and **Placement Enactment** replace the older, conflated "Instructional Event" model. Session-level facts (interruptions, session notes) and placement-level outcomes (`reached` / `partial` / `skipped` / `carried-forward`) are now distinct records at distinct layers.
- The **Post-Class Debrief** is the canonical, sole entry point for enacted teaching truth. No workspace and no in-class interaction independently authors enacted history.
- **Planned Curriculum**, **Enacted Curriculum**, and **Interpretation** are confirmed as three separate information domains, each with exactly one canonical owner (Units, Lesson Planner, and Forecast respectively).
- The **paper-first teaching workflow** is confirmed as a hard architectural boundary: software supports preparation and recording, but teaching itself happens from paper, without required software interaction.
- The **whitewater metaphor** (Expedition → Put-In → Rapids → Campfire → Assimilation → Next Expedition) is confirmed as the shared lifecycle vocabulary for how information moves through the suite over time.
- **Lesson Planner** is confirmed as the canonical owner of the Enacted Curriculum, recorded through the Post-Class Debrief. Today consumes that record for orientation; it does not own or author it.

---

## Canonical Architecture Documents

**Core architecture** — read these first; they define the suite's shared philosophy and information model.

- `CLAUDE.md`
- `CLAUDE_CONTEXT_FULL.md`
- `SUITE_ARCHITECTURE.md`
- `INFORMATION_MODEL.md`

**Supporting architecture** — how individual workspaces present and use the shared model.

- `TODAY_ARCHITECTURE.md`
- `UNITS_ARCHITECTURE.md`
- `LESSON_PLANNER_INFORMATION_MODEL.md`

**Reference models** — detailed object and lifecycle models that the supporting architecture depends on.

- `TEACHING_EPISODE_MODEL.md`
- `ENACTMENT_MODEL.md`
- `POST_CLASS_DEBRIEF.md`
- `TEACHING_LIFECYCLE_DIAGRAM.md`

---

## Architecture Principles

The following principles are now applied consistently across the reconciled documents:

- **Single canonical ownership.** Every piece of information has exactly one owner. Other subsystems may consume it; none may maintain a competing record.
- **Reference instead of containment.** A Lesson Session references an ordered sequence of Episode Placements; it does not own the Teaching Episodes those placements point to. Content that can move cannot be owned by the container it moves out of.
- **Reusable instructional knowledge.** Teaching Episodes and their Episode Notes are durable and portable, independent of any single session, section, or year.
- **Separation of planning, teaching, and recording.** Planning truth (intent) and enacted truth (what happened) are never merged. Teaching itself is a distinct, software-free act between the two.
- **Paper-first classroom workflow.** The printed lesson is the teaching interface. Software involvement is concentrated before and after class, never during it.
- **Workspace responsibility boundaries.** Each application owns one professional question and one perspective. Features belong to the workspace whose question they answer, not wherever is convenient to build them.

---

## Documents Intentionally Left Unreconciled

Several older Lesson Planner and Forecast design documents (for example, earlier drafts describing Lesson Planner interaction, work modes, and lesson session composition) have not yet been reconciled against the current model. They were deferred intentionally: they represent prior design exploration, not the current architecture, and reconciling them was outside the scope of this effort.

These documents are not archived and remain in the repository. Readers should treat the canonical documents listed above as authoritative wherever the two disagree.

---

## Future Cleanup

Remaining work, at a high level:

- Archive documents that are fully superseded by the reconciled model.
- Reconcile the peripheral Lesson Planner and Forecast design documents against the current canonical set.
- Consolidate terminology further where deprecated terms still appear outside the documents that already track them.

This work should extend the reconciled model, not redefine it.

---

## Reading Order

New contributors should read in this order:

1. `CLAUDE.md`
2. `CLAUDE_CONTEXT_FULL.md`
3. `SUITE_ARCHITECTURE.md`
4. `INFORMATION_MODEL.md`
5. Workspace architecture — `TODAY_ARCHITECTURE.md`, `UNITS_ARCHITECTURE.md`
6. Lesson Planner architecture — `LESSON_PLANNER_INFORMATION_MODEL.md`
7. Reference models — `TEACHING_EPISODE_MODEL.md`, `ENACTMENT_MODEL.md`, `POST_CLASS_DEBRIEF.md`, `TEACHING_LIFECYCLE_DIAGRAM.md`

---

## Status

The architecture reconciliation is considered **complete for the core architecture** listed above.

Future work should extend or simplify this architecture rather than redefine it.
