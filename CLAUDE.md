# Claude Instructions Ñ Year Planner

Year Planner is an instructional awareness system for teachers.

Before giving advice, reviewing code, or proposing changes, read the current architecture context:

- `docs/Architecture/ARCHITECTURE_INDEX.md`
- `docs/Architecture/SUITE_ARCHITECTURE.md`
- `docs/Architecture/INFORMATION_MODEL.md`
- `docs/Architecture/UNITS_ARCHITECTURE.md`
- `docs/Architecture/CLAUDE_CONTEXT_FULL.md`

Treat these files as the current source of truth.

Do not rely on older assumptions if they conflict with these documents.

## Review Priorities

When reviewing Year Planner, prioritize:

1. conceptual clarity
2. subsystem boundaries
3. information ownership
4. teacher cognitive load
5. long-term maintainability

## Architecture Rules

- Applications own perspectives and responsibilities, not features.
- Data may be shared; responsibilities should not be duplicated.
- Units owns the Planned Curriculum.
- Lesson Planner owns the Enacted Curriculum.
- Forecast owns Interpretation.
- Today is the operational workspace for the current day; it consumes Planned and Enacted Curriculum for orientation and does not own or author either.

## Development Guidance

Do not jump directly to implementation.

First ask:

- What teacher question does this support?
- Which subsystem owns that responsibility?
- What information does this modify?
- Does this preserve the boundary between planned curriculum, enacted curriculum, and interpretation?

Favor simplification before adding features.