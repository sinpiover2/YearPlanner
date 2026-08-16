# DEVELOPMENT_WORKFLOW

## Purpose

This document defines how Year Planner is developed.

It is not a coding standard or architecture document. Instead, it describes the development process that keeps the project organized, predictable, and focused on building the right product.

> We optimize for building the right product, not merely finishing the next feature.

The workflow itself is considered part of the project and should improve as we learn.

---

# Repository

Repository:

- Year Planner

Primary Branch:

- `main`

Technology:

- React + Vite
- Google Apps Script
- Google Sheets

Primary verification command:

```bash
npm run build
```

---

# Terminal Workflow

Development uses four dedicated terminal windows.

Each window has one responsibility.

## ?? DEV SERVER

Purpose:

Run the application.

Typical commands:

```bash
npm run dev
```

Never use this window for builds or Git.

---

## ?? BUILD

Purpose:

Verify production builds.

Typical commands:

```bash
npm run build
```

This window is only for build verification.

---

## ?? PROJECT

Purpose:

Inspect the project and implement changes.

Typical commands:

```bash
git status

grep

sed

cat

code
```

This is the working window.

---

## ?? GIT

Purpose:

Version control.

Typical commands:

```bash
git status

git add

git commit

git push

git log --oneline -5
```

This window should only be used for Git operations.

---

# Sprint Workflow

Every sprint follows the same sequence.

```
Plan

?

Implement

?

Verify

?

Design Review

?

Architecture Review

?

Documentation Review (if needed)

?

Commit

?

Push
```

Before starting Implement, state:

- **Terminal** — which of the four windows (DEV / BUILD / PROJECT / GIT) this work runs in
- **Deployment** — required or not
- **Apps Script project** — which one, if any
- **Browser testing** — required or not
- **GitHub push** — required or not
- **Stopping point** — where to pause and wait for user verification

Stating these up front prevents mid-task confusion about where work is happening and when to check in.

---

# Apps Script Deployment: Planning Write Authorization

`apps-script-planning` writes (`saveDailyProgress`, `addLesson`,
`updateLesson`, `deleteLesson`, `reorderLessons`) require a `token` field
matching the `WRITE_TOKEN` Script Property (see
`docs/Reference/API_REFERENCE.md`, "Write authorization"). This rollout
touches two independently-deployed systems — the Apps Script backend and the
frontend build — that must agree on the same secret. Use this procedure
whenever the token needs to be set for the first time, rotated, or the
authorization check itself changes.

## Procedure

1. **Generate a token**, e.g. `openssl rand -hex 32`. Treat it as a secret —
   never commit it.
2. **Set the `WRITE_TOKEN` Script Property** on the `apps-script-planning`
   project: Apps Script editor → Project Settings → Script Properties → add
   `WRITE_TOKEN` with the generated value. This has no effect yet — the
   currently-deployed backend doesn't read it until step 5.
3. **Configure the frontend token.** Copy `frontend/.env.example` to
   `frontend/.env` (or `.env.local`) and set `VITE_PLANNING_WRITE_TOKEN` to
   the same value generated in step 1.
4. **Build and deploy the frontend** (`npm run build` from `frontend/`, then
   publish `dist/`). Do this *before* the backend enforces the token — the
   currently-live backend ignores the extra `token` field on every request,
   so deploying the new frontend early is harmless and writes keep
   succeeding normally in the meantime.
5. **Push the updated Apps Script code** (`clasp push` from
   `apps-script-planning/`), **create a new version, and update the
   existing web app deployment to that version** — a new version alone does
   not move a `USER_DEPLOYING`/`MYSELF` deployment's execution to it (see
   `LESSONS_LEARNED.md`, Sprint 5.9). This is the step where token
   enforcement actually goes live.
6. **Reload any already-open browser tabs.** A tab that loaded the frontend
   before step 4 has no token and will see every write rejected with
   `Unauthorized` until it's refreshed.
7. **Verify one Planning write succeeds** — e.g. log a Daily Progress entry
   or edit a lesson title — and confirm it still shows the change after a
   page reload, to confirm the actual Sheets write, not just an optimistic
   UI update.

## Why this order matters

Steps 2–4 are safe to do in advance because the *currently-deployed*
backend does not check the token yet — nothing is enforced until step 5.
Doing them first means step 5 is the only moment enforcement turns on, and
the frontend already satisfies it at that moment, so there is no outage
window for anyone loading the app fresh.

Reversing the order — deploying the new `Code.js` before the Script
Property is set, or before the frontend has a matching token — makes every
Planning write fail closed for every user until the rest of the rollout
catches up. This is a safe failure (an unconfigured or mismatched token
always rejects rather than falling back to open access), but it is a real,
entirely avoidable outage. The only unavoidable disruption is step 6: a tab
already open before the frontend was redeployed will need a reload no
matter what order the other steps happen in.

---

# Guarded Production Migration Execution Procedure

Every guarded Apps Script migration in this codebase (`AmplifyIm1Importer.js`,
`LessonsSchemaMigration.js`, `LegacyIm1CleanupMigration.js`,
`UnitsArchiveMigration.js`, and any future one) follows the same
preview/execute/verify shape with a disarmed editor wrapper. Use this
sequence whenever actually running one of them against production — not just
reading its own README, which documents the mechanics but not the full
sequence around it.

1. **Preview.** Run the read-only preview function first, always. Review
   `plan.blocked`, every `blocked` action, and every warning before
   considering execution.
2. **Execute.** Open the migration's `...FromEditor()` wrapper, temporarily
   replace its placeholder confirmation string with the real phrase, save,
   run once, and immediately copy the complete logged report
   (`writesOccurred`, `errorStage`, `backup.id`/`backup.url`). Do not rerun on
   ambiguity or failure.
3. **Verify.** Run the migration's standalone `verify...()` function and
   confirm its report matches what the execute report claimed — do not treat
   "no exception was thrown" as sufficient confirmation by itself (see
   `LESSONS_LEARNED.md`, Sprint 6.6: a JS function that returns normally is
   reported by the Apps Script editor as "Execution completed" regardless of
   what the returned value says, including a refusal).
4. **Restore the editor placeholder.** Put the placeholder confirmation
   string back on the wrapper's `CONFIRMATION` line and save again, in the
   same sitting as step 2 — the live Apps Script HEAD must never be left
   armed with the real phrase.
5. **`clasp pull`.** Pull the now-restored, placeholder-only source back into
   the repository from Apps Script HEAD. The editor session in steps 2–4
   edited the live script directly, not through `clasp push`, so the
   repository's copy is stale until this step.
6. **Verify repository cleanliness.** Run `git status` / `git diff` on the
   pulled files. The only expected diff is whatever the migration module
   itself legitimately changed this sprint (if any) — confirm no stray armed
   confirmation phrase, no unrelated formatting churn from `clasp pull`, and
   no leftover generated-file drift before committing.

Skipping steps 4–6 leaves either the real confirmation phrase live in
production (a single accidental Run click away from re-executing) or the
repository silently out of sync with what Apps Script actually runs.

## Temporary Source-Push Arming

When a live preview, execute, or verify wrapper is unconditionally
`DISARMED` and the function cannot be invoked through `clasp run`, use a
two-push ceremony instead of editing Apps Script HEAD by hand:

1. Confirm local committed source and Apps Script HEAD are byte-identical,
   the intended wrapper is disarmed, and the working-tree diff is understood.
2. Remove only that wrapper's single unconditional `DISARMED` throw. Do not
   change the underlying preview, execute, or verification logic.
3. Perform one ordinary, non-force `clasp push`, then pull into an isolated
   temporary directory and confirm the remote diff is exactly the authorized
   one-line arming change.
4. Invoke only the authorized function, exactly the authorized number of
   times, and preserve its complete report before doing anything else.
5. Restore the local file byte-for-byte to committed source immediately and
   perform the second ordinary, non-force `clasp push`.
6. Pull remotely again into an isolated directory and confirm complete parity
   with committed source and that every live-facing wrapper is `DISARMED`.

Treat the two pushes as one transaction. The work is not complete when the
function finishes; it is complete only after restoration and remote parity
are proven. A failed or ambiguous invocation never authorizes a retry.

---

# Definition of Done

A sprint is complete only when all of the following are true.

- Feature behaves correctly.
- Production build succeeds.
- User interface has been reviewed.
- Architecture has been reviewed.
- Documentation has been updated if necessary.
- Changes are committed.
- Changes are pushed to GitHub.

---

# Design Review

Every sprint ends with stepping back from the code and evaluating the experience.

Questions:

- Does this reduce cognitive load?
- Does this answer **"Am I OK?"** more quickly?
- Does anything attract unnecessary attention?
- Can anything be removed?
- Does the interface feel calmer?

The visual experience is as important as the technical implementation.

---

# Visual UI Validation

Visual changes follow this process:

- Verify the live application.
- Compare against the intended design.
- Identify the owning component responsible for the visible appearance.
- Prefer one authoritative visual change rather than multiple compensating tweaks.
- Validate across all major application views before accepting the change.

## Cross-Workspace Meaning Check

When data owned by one workspace is displayed in another, verify the meaning of
the presentation as well as the technical read/write boundary.

- Forecast projections must not look like teacher-authored Planning commitments.
- Planning content must not imply that a lesson was saved when no Lesson Session exists.
- Actual progress must not be inferred from either a projection or a plan.
- Labels such as `Scheduled`, `Planned`, and `Completed` require corresponding
  persisted records, not merely related source data.

Add a regression test for the empty/unpersisted state whenever a new
cross-workspace read is introduced. A read-only integration can still violate
the information architecture through misleading presentation.

---

# Architecture Review

Every sprint ends with reviewing the design of the system.

Questions:

- Did we duplicate logic?
- Can anything be simplified?
- Is there a better abstraction?
- Can code be removed?
- Are the architecture documents still accurate?

The goal is continuous simplification.

---

# Architecture Reconciliation Workflow

Architecture documents (`docs/Architecture/`) are the canonical model of the system. Changing them is a distinct process from implementing code, and the two phases are never collapsed into one step. See `ARCHITECTURE_DOCUMENT_STANDARDS.md` for what makes an architecture document correct.

Use this workflow whenever a sprint changes an architecture document, not just when it changes code that an architecture document describes.

1. **Identify the canonical documents.** Determine which documents in `docs/Architecture/` govern the area being changed. Start from `ARCHITECTURE_INDEX.md`.
2. **Read without editing.** Read the target document(s) fully before proposing any change.
3. **Produce a reconciliation analysis only.** Write out what is inconsistent, outdated, or in conflict — without touching the document yet.
4. **Review every proposed change.** Walk through each proposed change individually rather than approving the analysis as a block.
5. **Approve or reject each recommendation.**
6. **Generate one complete implementation prompt.** Following the Prompt Revisions standard below, produce a single, self-contained prompt covering all approved changes.
7. **Apply the approved changes.**
8. **Perform a QA review.** Re-read the edited document for internal consistency and terminology drift before moving on.
9. **Commit only after the document is internally consistent.**

Architectural review and implementation are intentionally separate phases. Do not begin editing an architecture document while still analyzing it — the analysis must be reviewable on its own before any text changes.

---

# Coding Principles

The following principles guide implementation.

- Simplicity beats cleverness.
- Prefer removing code over adding code.
- Calm is a feature.
- Components should have one responsibility.
- Architecture should reflect the design philosophy.
- Information always flows:

```
Reality

?

Consequence

?

Recommendation
```

---

# Protect Existing Work

Before making a scoped code change:

- Run `git status --short`.
- Inspect the existing diff for the target file.
- Treat all existing uncommitted changes as protected.
- Do not modify unrelated code.

After editing, show both:

- the complete file diff
- the diff for the requested function/section when practical

This prevents a scoped change from silently overwriting or reviewing away work that is already in progress.

---

# Git Standards

Each commit represents one logical feature or improvement.

Commit messages should describe what changed.

Good examples:

```
Add forecast runway visualization

Improve timeline orientation

Remove Year Outlook strip
```

Avoid vague commit messages such as:

```
More fixes

Updates

Misc changes
```

---

# AI Prompt Standard

Whenever ChatGPT prepares a prompt for Claude Code (CC), Claude Desktop (CD), or Codex/CP, it must always output exactly one Markdown code block.

- The code block must contain the complete prompt.
- No required instructions may appear outside the code block.
- The prompt must be immediately copy-and-paste ready.
- Any explanatory commentary belongs outside the code block and must never be required for successful execution.

---

# Prompt Revisions

Once a prompt has been generated, treat that prompt as disposable.

- If any revision is requested, regenerate the entire prompt as a new complete Markdown code block.
- Do not issue incremental edits such as "add this paragraph" or "replace this sentence."
- Every revision should produce one fresh, self-contained prompt that completely replaces the previous version.

---

# User Decision Points

Whenever ChatGPT or Claude Code needs a user decision to proceed, present it as a short, lettered multiple-choice question rather than an open-ended prompt.

- List options as A, B, C, ... — each answerable with a single letter.
- Clearly mark the recommended option and give a one-sentence reason why.
- Always include a final "Other" option for anything not listed.
- Keep the question itself short — the options carry the detail, not the preamble.

This keeps decision points fast to resolve without losing the option to go off-menu.

---

# Technical Lead Workflow

At the beginning of every sprint:

- Verify workspace.
- Verify repository status.
- Define sprint goal.
- Define success criteria.

At the end of every sprint:

- Lead design review.
- Lead architecture review.
- Review documentation changes.
- Verify build.
- Review commit before pushing.

This keeps the development process consistent without relying on memory.

---

# Sprint Startup Project Health Check

Purpose:

Before implementation begins, spend approximately one minute verifying that the project is in the expected state.

### Repository Health

- Correct branch
- Working tree clean
- Synchronized with origin/main

### Application Health

- Launch the application
- Verify it starts successfully
- Confirm the expected development/production environment

### Documentation Health

- Read Layer 1 of the current sprint handoff
- Verify the application's observed state matches the handoff
- Resolve documentation drift before implementation

### Sprint Alignment

- Confirm the sprint objective matches START_SPRINT.md
- Review any workflow documents referenced by the First Hour Plan

> Never begin implementation while the repository, application, and documentation disagree about the current project state.

---

# Continuous Workflow Improvement

The workflow is part of the project, and it should get better every sprint.

Whenever friction occurs during development, ask:

> Is this a one-time issue, or should the workflow prevent this forever?

Common sources of recurring friction:

- deployment confusion
- repeated manual work
- forgotten testing
- unclear terminal usage
- architectural rediscovery
- poor handoffs
- unnecessary backtracking

If it will happen again, fix the workflow documents before ending the sprint — not after. Update the document, adopt the improvement immediately, and use it starting next sprint.

For lessons worth preserving beyond the sprint that produced them, record them in LESSONS_LEARNED.md.

---

# Periodic Architecture Review

Approximately every 5�10 sprints, schedule an Architecture Review Sprint.

No new features are added.

Instead, ask:

- What can be simplified?
- What can be removed?
- What have we learned?
- Is the documentation still accurate?
- If we started today, would we build it this way?

Long-term quality comes from regularly re-evaluating earlier decisions.

---

# Guiding Principle

Every feature should help teachers answer one question:

> **Am I OK?**

If a feature does not make that answer faster, clearer, or calmer, it should be reconsidered.
