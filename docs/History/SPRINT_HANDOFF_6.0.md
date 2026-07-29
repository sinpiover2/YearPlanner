# SPRINT 6.0 HANDOFF
**Year Planner — Secure Planning Write Authorization (July 2026)**

---

# Layer 1 — 60-Second Startup

## Executive Summary

Sprint 6.0 closed the anonymous-write security hole in `apps-script-planning`: every planning write (`saveDailyProgress`, `addLesson`, `updateLesson`, `deleteLesson`, `reorderLessons`) now requires a shared `WRITE_TOKEN`, checked server-side in `doPost`, failing closed when unconfigured. Reads remain fully anonymous — the Apps Script deployment's access level is one setting for the whole web app, so per-operation authorization has to live in application code, not the deployment. Alongside the security fix, this sprint also fixed a pre-existing write-reliability defect: three write actions (`updateLesson`, `deleteLesson`, `saveDailyProgress`) used `mode: "no-cors"`, which made every server-side failure invisible to the frontend. All five planning writes now go through one shared `postPlanningAction` helper using a real, readable `fetch()` with a preflight-safe `Content-Type`, so a failed write throws and surfaces instead of silently succeeding. The orphaned, unused `moveLesson` Apps Script action was also retired. The project is healthy, `npm run build` passes, and this sprint's work is fully implemented, committed, and pushed — see Current Repository State.

**This document also closes a bookkeeping gap:** no handoff had been written since Sprint 5.8 (Jul 25) — the roster-workflow sprint that followed it (informally "Sprint 5.9" per `PROJECT_CONTEXT.md`) shipped without one, and Sprint 6.0 itself completed without one until now.

## Current Project Status

`docs/Architecture/SPRINT_6_0_ARCHITECTURE.md`, written at the start of this sprint, scoped "Protect Teacher Work" into four ordered phases: **Security → Write Reliability → Backup/Versioning → Cross-Device Synchronization**. Sprint 6.0 completed **Security in full** and **one item of Write Reliability** (removing `mode: "no-cors"` from the three functions that had it). It did **not** complete the rest of Write Reliability (a `LockService` concurrency guard on `Lessons`/`DailyProgress` mutations, visible signal for local-save failures, a multi-tab conflict guard for Lesson Session drafts) or either of the remaining two phases (the canonical Session Enactment / Placement Enactment store; promoting Teaching Episode content from sole-custody-`localStorage` to a synced cache). "Protect Teacher Work" is meaningfully advanced, not finished — see Known Issues.

## Current Repository State

- Branch: `main`
- `origin/main`: in sync — `HEAD` and `origin/main` are both `1f98b2f` (already pushed)
- Working tree: **clean**
- `npm run build`: passes (verified this session)
- Sprint 6.0 spans three commits, all `2026-07-28`:
  - `cd023ca` — moved `HANDOFF_PROTOCOL.md` from `docs/Development/` to `docs/WORKFLOW/` (housekeeping, no content change)
  - `e163ce7` — added `docs/Architecture/WRITE_PATH_INVENTORY.md` (the evidence base the sprint's architecture decisions were built on)
  - `1f98b2f` — "Sprint 6.0: secure planning write authorization" (the implementation commit: `apps-script-planning/Code.js`, `frontend/src/api.js`, `docs/Architecture/SPRINT_6_0_ARCHITECTURE.md` new, `docs/Reference/API_REFERENCE.md`, `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`, `docs/WORKFLOW/LESSONS_LEARNED.md`, `.gitignore`, `frontend/.env.example` new)

## Recent Commits

```
1f98b2f Sprint 6.0: secure planning write authorization
e163ce7 Document teacher-authored write paths
cd023ca Move handoff protocol into workflow documentation
faab34b Complete classroom roster workflow: printing, sorting, and docs
9337ae7 Add guarded production data cleanup
```

## Current Stopping Point

Sprint 6.0 (Security, fully, plus one Write Reliability fix) is complete, committed, and pushed. The remaining Write Reliability items and the entire Backup/Versioning and Cross-Device Synchronization phases from `SPRINT_6_0_ARCHITECTURE.md`'s own roadmap are open and unscheduled. Per teacher direction, the next sprint pivots away from continuing that roadmap and toward Real Data / curriculum import instead — a deliberate reprioritization, not a claim that Protect Teacher Work is done. See "Exact Recommended Next Sprint," below.

## First-Hour Plan for Next Session

1. Read this handoff's Layer 1 only.
2. Confirm `git status` clean and `origin/main` in sync — nothing should have touched this tree since.
3. Read `docs/Development/CLASSROOM_READINESS.md`, Section A (Real Data) — the actual scope of the next sprint.
4. **Before writing anything:** inspect the existing `IM1` Unit 1 row(s) in the `Units`/`Lessons` sheets. Do not assume they are placeholder data — the current seeded unit title, "Patterns and Sequences," already matches Amplify Math 1's own Unit M1.1 title, which may mean this is a refinement of existing data rather than a from-scratch import.
5. Follow the lean scope under "Exact Recommended Next Sprint," below — existing `Units`/`Lessons` columns only, no new entities.

## Permanent Reference

- `docs/Development/PROJECT_CONTEXT.md` — mission, philosophy, current priority order
- `docs/Development/CLASSROOM_READINESS.md`, Section A — Real Data, the next sprint's actual scope
- `docs/Architecture/SPRINT_6_0_ARCHITECTURE.md` — full risk analysis and the four-phase roadmap; phases 3–4 (and part of phase 2) remain open
- `docs/Architecture/WRITE_PATH_INVENTORY.md` — the write-path evidence base this sprint's decisions were built on

---

# Layer 2 — Reference

## What Shipped During Sprint 6.0

**Security.** `apps-script-planning`'s `doPost` now rejects any write whose `token` field doesn't match the `WRITE_TOKEN` Script Property, before any sheet is touched (`isAuthorizedWrite_`, fails closed when the property is unset). This applies uniformly to all five write actions. Reads (`doGet`) are unaffected and remain anonymous, because the deployment's access-level setting (`ANYONE_ANONYMOUS`) is one setting for the whole web app — there is no deployment-level way to make GET anonymous and POST authenticated, so authorization had to move into application code. The orphaned `moveLesson` action (unused by the shipped frontend, but a live mutation surface) was deleted rather than gated.

**Write reliability (partial).** `updateLesson`, `deleteLesson`, and `saveDailyProgress` previously used `fetch(..., { mode: "no-cors" })`, which makes the response opaque and defeats failure detection — `fetch()` only rejects on a network-level failure, never an application-level one, so a rejected or failed write still looked like success to the frontend. All five write actions now share one `postPlanningAction` helper in `frontend/src/api.js`: a real, readable `fetch()` with `Content-Type: text/plain;charset=utf-8` (a CORS "simple request," so no preflight `OPTIONS` is triggered against an Apps Script deployment that implements no `doOptions`), and a thrown `Error` whenever the write did not actually succeed server-side. There is no fire-and-forget planning write left.

**Configuration and deployment.** A `WRITE_TOKEN` Script Property was generated and set on `apps-script-planning`. The frontend was configured with a matching `VITE_PLANNING_WRITE_TOKEN` (via `frontend/.env`, gitignored; `frontend/.env.example` documents the variable). `apps-script-planning` was pushed and deployed as Version 26, with the existing web app deployment updated to run that version (not merely a new version created — `LESSONS_LEARNED.md`'s Sprint 5.9 entry is explicit that a new version alone does not move a `USER_DEPLOYING`/`MYSELF` deployment's execution). The production pipeline — React frontend (Netlify) → `apps-script-planning` → Google Sheets — was verified end to end after deployment: anonymous reads still succeed; a write without a valid token is rejected with `{ "ok": false, "error": "Unauthorized" }`; an authorized write succeeds and the change persists after a page reload (confirming the actual Sheets write, not just an optimistic UI update). Fictional/test data written during that verification pass was identified and removed from the production spreadsheet afterward.

## Documentation Updated This Sprint

- `docs/Architecture/SPRINT_6_0_ARCHITECTURE.md` — new. Pre-implementation risk analysis and the four-phase roadmap (Security → Write Reliability → Backup/Versioning → Cross-Device Sync) this sprint executed phase 1 of.
- `docs/Architecture/WRITE_PATH_INVENTORY.md` — new. The evidence base (every current write path, its risk, its current storage) the architecture decisions above were built on.
- `docs/Reference/API_REFERENCE.md` — added "Write authorization" and "Transport contract" sections describing the token requirement and the shared request/response shape.
- `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md` — added "Apps Script Deployment: Planning Write Authorization," the step-by-step procedure for setting or rotating `WRITE_TOKEN` across both independently-deployed systems without an outage window.
- `docs/WORKFLOW/LESSONS_LEARNED.md` — added the Sprint 6.0 entry (three lessons: deployment access level is all-or-nothing so authorization must live in application code; `no-cors` was never required against this deployment and silently defeats failure detection; validate write-reliability changes against a local mock of the real contract when the live endpoint is shared production data with no delete path).
- `docs/WORKFLOW/HANDOFF_PROTOCOL.md` — moved from `docs/Development/` to `docs/WORKFLOW/` (location fix; no content change).
- `docs/History/SPRINT_HANDOFF_6.0.md` — this document, new (written as a documentation-closeout task after the fact, alongside a correction to `START_SPRINT.md`'s stale pointer).

## Remaining Priorities (ranked)

1. **Curriculum Import — Amplify Math 1 Unit 1 Pilot** — see "Exact Recommended Next Sprint," below. Promoted ahead of the remaining Protect Teacher Work phases per teacher direction.
2. **Remaining Protect Teacher Work phases** (deferred, not abandoned) — `LockService` concurrency guard on `Lessons`/`DailyProgress` mutations; a visible signal for local-save failures; a multi-tab conflict guard for Lesson Session drafts; the canonical Session Enactment / Placement Enactment store (`ENACTMENT_MODEL.md`'s own Version 1 Boundary); promoting Teaching Episode content from sole-custody-`localStorage` to a synced cache. Full detail: `docs/Architecture/SPRINT_6_0_ARCHITECTURE.md`, "Recommended Sprint 6.0 Implementation Order."
3. **Classroom validation** (`CLASSROOM_READINESS.md` Section E) — unchanged from prior sprints.
4. **Performance and workflow polish** (Sections B, C, D) — unchanged.

## Known Issues, Limitations, and Non-Goals

- Sprint 6.0 completed only Security (in full) and one item of Write Reliability from `SPRINT_6_0_ARCHITECTURE.md`'s four-phase roadmap. Do not assume "Protect Teacher Work" is finished — `LockService`, local-save-failure visibility, the multi-tab guard, the Enactment store, and cross-device sync are all still open.
- The shared `WRITE_TOKEN` is a shared-secret mitigation, not per-user authentication — see `WRITE_PATH_INVENTORY.md` / `SPRINT_6_0_ARCHITECTURE.md`, "Security," for what it does and doesn't guarantee.
- Teaching Episode / Lesson Session content is still same-browser `localStorage` only — per `SPRINT_6_0_ARCHITECTURE.md` §3–4, this remains the single largest data-loss exposure in the system, unresolved until the Backup/Versioning and Cross-Device-Sync phases are built.
- The intervening roster-workflow sprint between 5.8 and 6.0 (informally "Sprint 5.9" per `PROJECT_CONTEXT.md`) also has no dedicated handoff document of its own — its outcomes are recorded only in `PROJECT_CONTEXT.md`'s "Current Project Snapshot" and `CLASSROOM_READINESS.md`. Not corrected by this task; flagged for awareness.

## Lessons

See `docs/WORKFLOW/LESSONS_LEARNED.md`, Sprint 6.0 entry, for the lessons that generalize beyond this sprint. No further additions were warranted during this documentation closeout — see the accompanying report for why.

## Exact Recommended Next Sprint

**Curriculum Import — Amplify Math 1 Unit 1 Pilot**

Lean scope, deliberately bounded:

- Use the existing `Units` and `Lessons` model as-is.
- Inspect the existing `IM1` Unit 1 data in the `Units`/`Lessons` sheets *before* writing anything — see First-Hour Plan, above.
- Import only the minimum planning information needed to make Amplify Math 1's Unit 1 usable in Planning, Forecast, and Units.
- No generic Curriculum Item model.
- No Assignment/Deliverable persistence layer.
- No Planning or Lesson Planner redesign.
- No schema expansion unless the existing fields prove genuinely inadequate once the pilot is attempted.
