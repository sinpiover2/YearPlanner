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

## Upcoming Milestone

### Classroom Communication MVP

A teacher can:

- finish planning a week
- generate AI-assisted weekly communication
- review and edit the generated draft
- copy the finished communication into the school's existing Monday Manager

No duplicate lesson entry required.

This is a future milestone, not a completed one.

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