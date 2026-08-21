# Start Sprint

## Sprint 7.1 Objective

**Primary objective:** Stabilize the safety boundary around the live Year
Planner before expanding features: review and approve secure production access,
rotate the browser-exposed planning write credential, and design durable Lesson
Session persistence and recovery.

This remains a review-first sprint. Do not change authentication, production
data, or Lesson Session persistence until the teacher has reviewed the tradeoffs
through short lettered choices and explicitly approved the smallest safe slice.

## Current Sprint Checkpoint

Sprint 7.0 shipped cross-day plan reuse, the guarded roster spreadsheet
round-trip, and the Synergy Deliverables utility with assignment-first entry.
Fifty Lesson Sessions were recovered after browser storage appeared empty. The
Netlify project is now public for classroom access, but its Vite bundle contains
the current planning write token. The public planning read feed does not include
student rosters, but the client-shipped token is not an adequate authorization
boundary for a public frontend.

## Working Context

- **Start with safety decisions, not implementation.** Present the access and
  persistence choices in the teacher's lettered-choice protocol.
- **Production URL:** `https://boisterous-yeot-16920e.netlify.app/`; do not
  share it until the write boundary is corrected.
- **Recovery assets:** the validated 50-session recovery JSON is in Downloads;
  a LevelDB snapshot and generated recovery JSON remain under untracked `tmp/`.
- **Protected work:** preserve the unrelated tracked BUILD_LOG edit and all
  untracked Obsidian, curriculum screenshot/source, asset, Netlify metadata,
  and recovery files listed in the Sprint 7.0 handoff.
- **Deployment:** no production access or token change before explicit teacher
  approval; rotate the planning token as part of any approved security fix.

## First-Hour Plan

1. Read Layer 1 of `docs/History/SPRINT_HANDOFF_7.0.md` and verify branch,
   origin parity, production URL, and protected dirty files.
2. Explain the current public-frontend/write-token risk in plain language and
   offer short choices: temporarily re-private, add identity-aware access, or
   another explicitly reviewed boundary.
3. Choose and define one secure-access slice, including credential rotation,
   acceptance criteria, rollback, and classroom-browser verification.
4. Review the durable Lesson Session need separately: canonical server store,
   local offline cache, visible save state, conflict policy, and export/restore.
5. Approve at most one implementation slice before changing code or production.

## Success Criteria

- The production frontend no longer relies on a browser-visible token as its
  authorization boundary.
- Any exposed planning token is rotated after the new boundary is live.
- The teacher can still open Year Planner reliably in the SVUSD browser.
- A reviewed durable-persistence design exists for Lesson Sessions, with an
  explicit source of truth and recovery path.
- No recovered lesson data or protected local files are lost.

## Permanent References

- `docs/Development/PROJECT_CONTEXT.md`
- `docs/Architecture/PRINCIPLES.md`
- `docs/Architecture/LESSON_PLANNER_INFORMATION_MODEL.md`
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
- `docs/WORKFLOW/LESSONS_LEARNED.md`
