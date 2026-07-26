# SPRINT 5.8 HANDOFF
**Year Planner — Weekly Communication MVP (July 2026)**

---

# Layer 1 — 60-Second Startup

## Executive Summary

Weekly Communication shipped as an MVP: a teacher can generate a deterministic, plain-text weekly draft directly from lesson sessions already authored in Planning, review it, and copy it into Monday Manager — no duplicate entry, nothing sent automatically. Planning also received a visual refinement pass toward a warm, quiet, typography-first "paper planner" language, plus a bounded native date picker for direct week navigation. The project is healthy, the build is clean, and this sprint's work is fully implemented and verified but **deliberately uncommitted** — see Current Repository State.

## Current Project Status

**All three of the project's August 1 Success Criteria are now met** (`docs/Development/CLASSROOM_READINESS.md`):

✓ Plan an instructional week.
✓ Teach from printed lesson plans.
✓ Generate weekly communication without retyping lesson information.

This does not mean Version 1 is finished — it means the workflow now *works end to end*. The remaining gap is *trust*: Planning, Forecast, and Weekly Communication are currently reasoning about working data, not the verified official school calendar and curriculum. That gap is Sprint 5.9's entire scope (see Sprint 5.9 Objective below).

## Current Repository State

- Branch: `main`
- `origin/main`: up to date as of sprint start (0 ahead / 0 behind)
- Working tree: **not clean** — this sprint's entire change set is uncommitted by design; nothing has been committed, pushed, or deployed
- `npm run build`: passes
- No Apps Script, API, persistence, or data-model changes — this was a frontend-and-documentation-only sprint

**Modified (10 files):**
- `frontend/src/App.css`
- `frontend/src/App.jsx`
- `frontend/src/components/Planning/PlanningHeader.jsx`
- `frontend/src/components/Planning/PlanningView.jsx`
- `frontend/src/utils/planningModel.js`
- `docs/Development/CLASSROOM_READINESS.md`
- `docs/Development/PROJECT_CONTEXT.md`
- `docs/History/PROJECT_MILESTONES.md`
- `docs/WORKFLOW/LESSONS_LEARNED.md`
- `docs/WORKFLOW/START_SPRINT.md`

**New (3 files):**
- `frontend/src/components/Planning/WeeklyCommunicationPanel.jsx`
- `frontend/src/utils/weeklyCommunication.js`
- `docs/History/SPRINT_HANDOFF_5.8.md` (this document)

## Recent Commits (before this sprint's work)

```
9755eac Define Weekly Communication architecture
7104ebc Allow curriculum attachments across course units
937dea0 Update project documentation for Sprint 5.7 completion
f5a4e68 Complete Sprint 5.7 planning responsiveness
977b889 Complete core architecture reconciliation
```

## Sprint 5.9 Objective

**Primary objective: Real Data** (`docs/Development/CLASSROOM_READINESS.md`, Section A).

Import and verify the official 2026–2027 school calendar, full curriculum for both courses, and student rosters when available, so Planning, Forecast, and Weekly Communication are reasoning about the actual school year rather than working data. This is the largest remaining gap between "the workflow works" and "the workflow is trustworthy for daily use." (Matches `docs/WORKFLOW/START_SPRINT.md`.)

## Recommended First-Hour Tasks for Sprint 5.9

1. `git status --short` and `git diff --stat` — confirm the repository state above still matches; nothing else should have touched this working tree since.
2. Skim the diff yourself before committing — everything above has been build- and browser-verified, but review is still yours to do. Do this **before** starting any new work — an uncommitted diff this size is itself a small risk (see Risks).
3. Commit and push.
4. Read `docs/Development/CLASSROOM_READINESS.md`, Section A, in full — it's short, and it's the actual scope of Sprint 5.9, not just this handoff's summary of it.
5. Before importing anything, read `docs/Architecture/PLANNING_WORKSPACE.md`, Section 14, item **D5** (see Architecture Decisions below) — real data work is likely to hit this gap directly, and it's better to know that going in than to discover it mid-import.

## Permanent Reference

- `docs/Development/PROJECT_CONTEXT.md` — mission, philosophy, workflow. Unchanged this sprint.
- `docs/Development/CLASSROOM_READINESS.md` — the current execution document; Section A is Sprint 5.9's actual scope.
- `docs/Architecture/PLANNING_WORKSPACE.md`, Section 15 — Weekly Communication's architecture. Unchanged this sprint; this sprint implemented what it already specified, it did not redesign it.

---

# Layer 2 — Reference

## What Shipped During Sprint 5.8

**Weekly Communication MVP.** `WeeklyCommunicationPanel.jsx` and `weeklyCommunication.js` add a modal, launched from Planning's header, that lets a teacher pick a section, generate a plain-text draft of the current week's authored lessons, and copy it to the clipboard. The draft builder reuses `buildLessonPrintPayload` — the same content filter "Print lesson" already trusts — so a day only appears if it has real authored content, and only titles and deliverables are read; block text and teacher notes are never surfaced. No new backend endpoint, no new data model, no roster data touched.

**Planning visual refinement.** Three passes, each catching a different class of issue:
1. Warm neutral palette, quiet session-card treatment (no hover-lift/shadow, "Open time" receding to plain italic text, a restrained blue tick replacing a heavier left-border for the selected state), and a lighter header hierarchy (primary week navigation vs. secondary Weekly Communication/Print links).
2. A pass against an explicit written information-hierarchy spec, which found real tier mismatches CSS alone hadn't caught — "Open time" was sized like tier-2 day headings instead of receding to tier 4; whitespace was tighter than the brief's "generous whitespace" called for.
3. A time-boxed "designer's final polish" pass, which found three smaller inconsistencies: a tier-2 label (course/period) colored like tier-3/4 supporting text, an eyebrow letter-spacing that had drifted from the app's existing convention, and a "+ Lesson" ghost action bolder than a receding element should be.

**Direct date navigation.** A bounded native `<input type="date">` styled as a "Jump to date" pill. Selecting any date — weekday, weekend, non-school day — navigates to the containing week via the same `planningReferenceDate` state Previous/Today/Next already share.

## Architecture Decisions That Matter Going Forward

These aren't just what happened — they're precedents future sprints should keep following, not just historical notes.

- **One content filter per judgment, reused, not re-derived.** Weekly Communication needed the same "does this day have real, authored content" judgment Print lesson already makes, so it calls `buildLessonPrintPayload` directly instead of writing a second filter. **Any future consumer of Planning's authored content (a future LMS export, a different communication channel, anything) should go through this same filter rather than inventing its own notion of "real content."** Two independent filters answering the same question is exactly how the print output and the communication draft would eventually disagree.
- **Calendar-derived facts are computed at the point of use, from the calendar index — never given their own storage.** The date picker's `min`/`max` bounds are computed inline in `planningModel.js` from the `calendarIndex` Planning already builds, not stored as a separate field. **This matters directly for Sprint 5.9:** real calendar import will touch this same `calendarIndex`/schedule-resolution code path. New calendar facts should extend that one computation, not fork a second source of calendar truth alongside it.
- **Restrained blue, not a border, is now the concrete precedent for "selected."** The suite's "geometry before color" rule was previously a written principle without much visible precedent in Planning; this sprint gave it one (a 2px tick, not a border or fill). Future selection-state work in Planning — and arguably other workspaces — should match this rather than reach for a heavier visual treatment.
- **D5 (calendar/schedule resolution owner) is still an open blocking decision, and Sprint 5.9 will likely hit it.** `docs/Architecture/PLANNING_WORKSPACE.md`, Section 14, D5 states: *"Meeting times, shortened days, no-class days, shoulder-day identity, and 'next meeting of this section' all come from schedule resolution, which the suite has identified as load-bearing and currently unowned. Planning must consume it, never reimplement it."* Nothing in Sprint 5.8 resolved this — it wasn't in scope. But Real Data (Sprint 5.9) means importing the actual calendar with its real minimum days, assemblies, and bell-schedule variations, which is exactly the data D5 is about. **Resolve or explicitly re-scope D5 before or during that import — don't let real data get imported into a subsystem the architecture itself says has no defined owner.**

## Documentation Updated This Sprint

- `docs/Development/CLASSROOM_READINESS.md` — status line, Section F checklist checked off (one item explicitly left unverified — see Known Limitations), "Next Priority" repointed to Section A.
- `docs/Development/PROJECT_CONTEXT.md` — "Current Project Snapshot" and "Next Major Milestone" updated to reflect Weekly Communication's completion and Real Data as next.
- `docs/History/PROJECT_MILESTONES.md` — added a dated, completed milestone entry for Weekly Communication MVP (commit hash left as a placeholder until this work is actually committed).
- `docs/WORKFLOW/LESSONS_LEARNED.md` — added three lessons that generalize beyond this sprint (written-principle-over-mockup, sequential narrow polish passes, saying so when a referenced attachment doesn't arrive). Two draft lessons that just restated already-existing principles (reuse logic, avoid unnecessary storage) were cut in review and folded into Architecture Decisions above instead, per that document's own rule that a lesson mattering only once belongs in the handoff, not there.
- `docs/WORKFLOW/START_SPRINT.md` — the rolling "current sprint objective" field was advanced from Sprint 5.8 to Sprint 5.9 (Real Data), so the next session doesn't start from a stale pointer.
- `docs/WORKFLOW/END_SPRINT.md` — a "Sprint 5.8 Record" was drafted here in an earlier pass and then removed on review: it was pure sprint-log content duplicating this handoff, not a change to how future sprints are run. The file has a net-zero diff.
- `docs/History/SPRINT_HANDOFF_5.8.md` — this document, new.

## Remaining Priorities (ranked)

1. **Real Data** (`CLASSROOM_READINESS.md` Section A) — see Sprint 5.9 Objective above.
2. **Classroom validation** (Section E) — a full planning cycle exercising Forecast → Planning → Lesson Session → Print → **Weekly Communication** → Teach, end to end, with real data. This is also where the still-unverified "under one minute" Weekly Communication timing goal should get checked.
3. **Performance and workflow polish** (Sections B, C, D) — unchanged from prior sprints; not touched this sprint.

## Known Limitations

- **Lesson Session content is still same-browser localStorage** — a pre-existing, documented limitation (`CLASSROOM_READINESS.md` Section F), not solved or regressed by this sprint. See Risks below for why it matters now.
- **Header-to-grid left alignment**: the Planning header's title doesn't share a left edge with the week grid's day columns (the vertical section-label rail pushes day columns further right). Noticed during the polish pass; not fixed, because a real fix means changing the grid's column template — a structural change, out of scope for a polish pass. Worth a dedicated look, not an incidental one.
- **Weekly Communication's "under one minute" goal** hasn't been empirically timed against a real authored week — left unchecked in `CLASSROOM_READINESS.md` Section F, pending Section E classroom validation.
- **Print was not clicked during this sprint's automated browser verification** — it POSTs to the live production Apps Script combined-print endpoint, and verification deliberately avoided triggering real side effects against production. Confirmed by inspection instead; worth one manual click-test.
- Two unused CSS classes (`.session-chip-row` / `.session-chip`) predate this sprint and render nothing — left alone; not a visual-polish concern, not this sprint's scope to clean up.

## Intentional Deferrals

- **AI-assisted drafting** remains explicitly deferred — not built, not scheduled. Deterministic template generation only, as originally scoped in `docs/Architecture/PLANNING_WORKSPACE.md`, Section 15.
- **A new duration badge on session cards** (visible in an early design mockup) was deliberately not added — it would be a new visible feature, and this sprint's mandate was refinement of existing presentation, not new information.
- **Regrouping deliverables into their own labeled sub-section** (as an early mockup showed) was deliberately not done — it would require restructuring `SessionTile.jsx`'s render logic, not just CSS, conflicting with "refine through CSS, not behavior change."

## Risks

- **The uncommitted diff itself.** Everything in this sprint (10 modified + 3 new files) is sitting in the working tree, not committed. The longer that persists, the more likely an unrelated edit collides with it. Commit before starting new work, not after.
- **D5 is unresolved and Real Data will likely surface it.** If the calendar/schedule resolution subsystem genuinely has no defined owner, importing the real calendar (with real minimum days, assemblies, and bell-schedule exceptions) may expose gaps that look like data bugs but are actually the unresolved architecture question. Don't spend Sprint 5.9 debugging what is actually D5.
- **Weekly Communication reads Lesson Session content from same-browser localStorage.** This was a known, accepted limitation before this sprint and still is — but classroom validation (Section E) involves using the app across a real week, possibly across devices, which is exactly the condition that would expose it. Not a regression; still worth remembering going in.

## Success Criteria for Sprint 5.9

The three success criteria that governed Version 1 up to this point are now met (see Current Project Status above). For **Sprint 5.9 (Real Data)**, success looks like:

- The official 2026–2027 school calendar is imported, with holidays, breaks, minimum days, and bell-schedule patterns verified against the district's actual calendar — not the working data currently in the sheet.
- Session numbering and forecasting have been checked against that real calendar and produce correct results.
- Both courses' curricula (Math 8 and Integrated Math 1) are imported and verified — units, lessons, required instructional days, learning goals.
- D5 (calendar/schedule resolution ownership, above) is either resolved or explicitly and consciously re-scoped — not silently worked around.

Full detail and the complete checklist: `docs/Development/CLASSROOM_READINESS.md`, Section A. Don't restate it here as it changes; read it there.

## Lessons

See `docs/WORKFLOW/LESSONS_LEARNED.md`, Sprint 5.8 entry, for lessons that generalize beyond this sprint. The sprint-specific implementation choices that matter for *this* codebase going forward are in Architecture Decisions above, not there — per that document's own rule, a lesson that only mattered once belongs in the handoff, not in LESSONS_LEARNED.md.
