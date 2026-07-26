# Project Milestones

**Purpose**

This document records the major milestones in the evolution of the Year Planner project.

Unlike sprint history, this is **not** a detailed development log. It captures only the significant architectural, functional, and project milestones that define the application's evolution.

When an important capability or architectural shift is completed, add it here.

---

# Milestones

---

## 2026-07-23 � Core Architecture Reconciliation Complete

**Commit:** `977b889`

The Year Planner architecture was reconciled into a single coherent model.

### Major Outcomes

- Established a single canonical ownership model.
- Defined the separation between:
  - Planned Curriculum
  - Enacted Curriculum
  - Interpretation
- Established Lesson Planner as the canonical owner of the Enacted Curriculum.
- Confirmed Units as the owner of the Planned Curriculum.
- Confirmed Forecast as the owner of Interpretation.
- Confirmed Today as the operational workspace that consumes, but does not own, curriculum information.
- Standardized architectural terminology around:
  - Teaching Episode
  - Episode Placement
  - Session Enactment
  - Placement Enactment
- Replaced the legacy Instructional Event model.
- Established the Post-Class Debrief as the canonical entry point for recording classroom reality.
- Documented the architecture with a permanent Architecture Reconciliation Summary.
- Aligned all core architecture documents under a single consistent model.

### Significance

This milestone marks the completion of the project's core architectural foundation.

Future architectural work should extend and refine this model rather than redefine it.

Development focus now returns to implementing classroom functionality on top of this stable foundation.

---

## 2026-07-25 — Weekly Communication MVP Complete

**Commit:** _to be filled in when this work is committed_

Weekly Communication shipped as a thin output utility owned by Planning, exactly as scoped in `docs/Architecture/PLANNING_WORKSPACE.md`, Section 15, and `docs/Development/CLASSROOM_READINESS.md`, Section F.

### Major Outcomes

- A teacher can finish planning a week in Planning, generate a deterministic, template-based weekly communication draft, review it, and manually copy it into the school's existing Monday Manager — with no duplicate lesson entry and nothing sent or published automatically.
- The draft generator reuses Planning's existing session/episode data and the same content filter `buildLessonPrintPayload` already used for "Print lesson," rather than introducing a parallel data path — so a day only appears in the draft if it has real authored content, and only titles/deliverables are read (teacher notes and block detail are never surfaced).
- All three of the "August 1 Success Criteria" recorded in `CLASSROOM_READINESS.md` are now met: plan an instructional week, teach from printed lesson plans, and generate weekly communication without retyping lesson information.
- Alongside the MVP, Planning received a visual refinement toward a calmer, warm-neutral, typography-first "paper planner" language, plus a bounded date picker for direct week navigation built on Planning's existing calendar model.
- AI-assisted drafting remains explicitly deferred, per the original scoping — not built, not scheduled.

### Significance

This closes the last of the three August 1 success criteria defined for Version 1. The classroom-readiness focus now shifts from "can the core workflow do this at all" to hardening what exists — real data import and end-to-end classroom validation are the natural next gates (see `docs/Development/CLASSROOM_READINESS.md`, Sections A and E).

---

## Future Milestones

Examples of future milestones include:

- First complete Post-Class Debrief workflow
- First full Teaching Episode implementation
- First classroom pilot
- First semester used in production
- Major forecasting improvements
- Major print workflow milestones
- Significant performance improvements
- Major architectural extensions (when appropriate)
```