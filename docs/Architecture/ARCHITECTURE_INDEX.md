# Architecture Index

## Philosophy

- SUITE_ARCHITECTURE.md

Defines the overall philosophy and responsibilities of the Year Planner Suite.

---

## Information

- INFORMATION_MODEL.md

Defines the instructional information model shared across the suite.

- CURRICULUM_INFORMATION_MODEL.md

Amends INFORMATION_MODEL.md's `Lesson` entry and UNITS_ARCHITECTURE.md's "Lesson Sequence": establishes `Unit → Instructional Item → Lesson Session` as the canonical curriculum model, with Lesson as one Instructional Item type among several. Established by the Amplify IM1 curriculum extraction. See `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` for the implementation specification that follows from this decision record.

---

## Subsystems

- UNITS_ARCHITECTURE.md
- FORECAST_ARCHITECTURE.md *(future)*
- TODAY_ARCHITECTURE.md *(future)*
- LESSON_PLANNER_ARCHITECTURE.md *(future)*

Each document explains how one subsystem presents and uses the shared information model.