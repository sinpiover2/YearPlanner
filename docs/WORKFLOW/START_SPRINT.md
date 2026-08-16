# Start Sprint

## Sprint 7.0 Objective

**Primary objective:** Reflect on the classroom-ready Year Planner, review the
teacher's accumulated notes against the live product and permanent design
principles, then produce a prioritized, evidence-based implementation plan.

This is a review and planning sprint first. Notes are observations and candidate
work, not automatically approved requirements. Do not begin feature
implementation until the notes have been clarified, grouped, prioritized, and
the sprint scope has been explicitly approved.

## Current Sprint Checkpoint

Integrated Math 1 and Math 8 now use the same Units presentation. Production
contains source-grounded unit purposes and lesson goals for all 164 active IM1
items, with one planned day per item. Planning displays only teacher-authored
Lesson Sessions; imported `SectionPacing` projections remain data for Forecast
and do not appear as scheduled commitments in Planning.

The teacher's working observations are currently in the protected, uncommitted
`Notes` section of `docs/Development/VERSION_1_TASK_BOARD.md`. Preserve the file
exactly until the teacher reviews those notes in conversation.

## Working Context

- **Terminal:** PROJECT for inspection and note synthesis; BUILD only if a
  later approved scope changes code; GIT only for reviewed commits and pushes.
- **Deployment:** not required for reflection, prioritization, or planning.
- **Apps Script project:** none during the review phase.
- **Browser testing:** use the live application to confirm observations when
  useful; do not mutate production merely to test an idea.
- **GitHub push:** required only for reviewed planning/handoff documentation or
  a separately approved implementation slice.
- **Stopping point:** present the categorized notes, proposed priorities,
  dependencies, and recommended sprint scope; wait for explicit approval before
  implementation.

## First-Hour Plan

1. Read Layer 1 of `docs/History/SPRINT_HANDOFF_6.9.md` and preserve every
   dirty or untracked file listed there.
2. Run the Sprint Startup Project Health Check and reconcile repository,
   production, and documentation state before planning.
3. Read the teacher's notes in `VERSION_1_TASK_BOARD.md` without editing them.
4. Review the notes with the teacher one topic at a time; clarify the observed
   problem, desired outcome, frequency, and classroom impact.
5. Group the reviewed notes into bugs, workflow friction, enhancements,
   research/design questions, and longer-term ideas.
6. Compare each candidate with the live product and relevant architecture;
   identify dependencies, conflicts, and the smallest useful slice.
7. Propose a ranked backlog and one focused sprint goal with acceptance
   criteria. Stop for explicit approval before implementation.

## Success Criteria

- Every teacher note is preserved and assigned a clear category and disposition.
- Bugs and classroom-blocking friction are distinguished from feature ideas.
- Priorities reflect classroom impact, frequency, risk, dependencies, and
  implementation effort rather than note order.
- Any conflict with a core product principle is surfaced before scope approval.
- The selected sprint is small enough to verify as a complete teacher workflow.
- No code, production data, or deployment changes occur before the review and
  prioritization decision is complete.

## Permanent References

- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Architecture/PRINCIPLES.md`
- `docs/Architecture/SUITE_ARCHITECTURE.md`
- `docs/Architecture/SECTION_PACING.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
