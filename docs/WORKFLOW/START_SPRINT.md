# Start Sprint

## Sprint 6.7 Objective

**Primary objective:** Extract and import the Amplify Math 8 curriculum
using the proven curriculum import workflow
(`docs/Development/CURRICULUM_IMPORT_WORKFLOW.md`), generalized from the
Amplify IM1 pipeline built in Sprints 6.1–6.6. This is an intentional pivot:
Sprint 6.7 applies the now-documented, reusable process to a second
curriculum rather than continuing to chase Amplify IM1's own remaining
production steps.

**Amplify IM1's production import is not finished** — the `Lessons` schema
migration (`Type`/`PlacementRule`) and the Amplify IM1 importer itself
remain structurally complete and locally tested only, never deployed or
executed. `UnitsArchiveMigration.js` was the one piece of that pipeline
successfully deployed and executed in Sprint 6.6 (the `IsArchived` column
exists on the live `Units` sheet and all 9 legacy `IM1-U0`…`IM1-U8` units
are archived, confirmed by `verifyUnitsArchiveMigration()`:
`archivedCount: 9`). Finishing IM1's import is deferred, not abandoned — see
`docs/History/SPRINT_HANDOFF_6.6.md`'s Remaining Priorities before deciding
whether to interleave it with Math 8 work or complete it afterward.

### Sprint 6.7 Startup Record — 2026-08-01

**Status:** COMMITTED only when this startup record is committed. No Math 8
extraction, staging, importer, deployment, or production-data work is part of
this startup task.

**Working context before implementation:**

- **Terminal:** PROJECT for source inspection and documentation; BUILD for the
  health-check build; GIT for status and the documentation-only commit
- **Deployment:** not required
- **Apps Script project:** none
- **Browser testing:** application startup/HTTP response only; no curriculum UI
  behavior exists to test yet
- **GitHub push:** not required; stop after the local commit
- **Stopping point:** the first Math 8 extraction task is precisely bounded and
  documented below, before any extraction file or importer code is created

**Repository and application health:**

- Branch `main`; after `git fetch origin`, `main...origin/main` is `0 0`
  (neither ahead nor behind).
- The working tree contains only the pre-existing untracked
  `Curriculm/M1/Unit */Screenshots/` directories and `Curriculm/M8/`; these are
  source assets, remain untouched, and must not be staged or committed.
- `npm run build` from `frontend/` passes.
- The Vite development server starts successfully at `127.0.0.1:5173` and
  returns HTTP 200; it was stopped after the check.
- The five relevant local import/migration test files pass: 180 tests, 0
  failures.
- The observed state matches `SPRINT_HANDOFF_6.6.md` except for one favorable
  source-material update: Math 8 source files are now present.

**Math 8 source inventory:**

- `Curriculm/M8/` contains Unit 1 through Unit 8.
- Every unit contains one PDF (`Unit N.pdf`) and a corresponding screenshot
  set: Unit 1 has 22 PNGs; Unit 2, 18; Unit 3, 21; Unit 4, 22; Unit 5, 23;
  Unit 6, 18; Unit 7, 22; Unit 8, 24 (170 PNGs total).
- Unit 2 also contains `.DS_Store`; it is not curriculum source.
- No normalized Math 8 extraction document, source transcription, staged JSON
  artifact, Math 8 fixtures, or course-level source/index file is present.
- The available unit PDFs and screenshots appear sufficient to begin a
  unit-by-unit extraction. They do not by themselves establish whether there
  are additional publisher materials outside these eight unit sets; do not
  claim course completeness until that is confirmed.

**First bounded extraction task:**

Create the normalized Markdown extraction for **Math 8 Unit 1 only**, using
`Curriculm/M8/Unit 1/Unit 1.pdf` and all 22 Unit 1 screenshots as the paired
authoritative source. In one reviewable unit section:

1. Record the exact unit title, overview/purpose, sub-unit names and ranges,
   and any stated required/optional day totals.
2. Transcribe every instructional item in publisher order with its literal
   source type/label, title, subtitle, optional status and basis, and source
   summary/tagline. Do not assign IDs or schema mappings yet.
3. Record whether each item is fixed-position or publisher-flexible without
   inferring placement from visual order.
4. Mark every missing field as either `Confirmed absent` or `Not found in what
   was reviewable`; never infer values from IM1 or another Math 8 unit.
5. Re-validate the completed Unit 1 section against both the PDF and every
   screenshot before beginning Unit 2 or any staging transcription.

Directly observed Unit 1 terminology that must be preserved literally and
verified across the complete source includes `Explore`, `Lesson`, `Practice
Day`, `Sub-Unit Quiz`, `Performance Task`, and `Unit Synthesis and Reflection`.
The source also includes optionality expressed in prose/badges (for example,
`Getting to Know Each Other`, `Explore: Tessellations`, and Lesson 1 are marked
optional), sub-unit ranges that include practice/quiz components, and language
such as `End-of-Unit Assessment` inside supporting text even where the visible
card is titled `Performance Task`. The extraction must capture the publisher's
actual label and treat these as evidence questions, not normalize them to the
IM1 vocabulary.

**Existing tools to reuse after the extraction is validated:**

- Extraction shape/reference only: `Curriculm/M1/IM1_Curriculum_Extraction.md`
- Manual source transcription pattern:
  `scripts/import-staging/amplify-im1-source.mjs`
- Deterministic artifact generation and drift check:
  `scripts/import-staging/generate-artifact.mjs` (`--check`)
- Structural/semantic validation:
  `scripts/import-staging/validate-artifact.mjs`
- Destination classification: `scripts/import-staging/build-import-plan.mjs`
- Read-only fixture preview: `scripts/import-staging/preview.mjs`
- Shared fixtures/fakes and parity coverage:
  `scripts/import-staging/fixtures/`, `scripts/import-staging/fake-spreadsheet.mjs`,
  `scripts/import-staging/test.mjs`, and
  `scripts/import-staging/importer.test.mjs`
- Apps Script payload-generation pattern, only after staging is approved:
  `scripts/import-staging/generate-apps-script-payload.mjs`
- Guarded preview/execute/verify implementation precedent, not a file to copy
  or rename blindly: `apps-script-planning/AmplifyIm1Importer.js`

These are publisher-neutral process precedents whose current filenames,
constants, expected counts, known-type lists, IDs, course metadata, and
operator text are IM1-specific. Reuse their phase boundaries and safety
properties; do not redesign the pipeline and do not adapt code until the Math
8 extraction has been completed and source-validated.

**Open evidence questions before staging:**

- Are Units 1–8 the complete authoritative Math 8 course, or is a separate
  course overview/index or additional unit source still missing?
- What literal item types occur across all eight units, and do any items have
  publisher-defined flexible placement comparable to (but not assumed from)
  IM1 `Investigate` items?
- Does Math 8 state unit day budgets or per-item duration anywhere in each
  unit source, and is any apparent absence confirmed or merely not yet found?
- Is `End-of-Unit Assessment` a distinct instructional item/type anywhere, or
  only supporting language around `Performance Task`/reflection materials?
- Does the optional `Getting to Know Each Other` card have an explicit
  publisher type, or only a title and optional marker?
- Which Math 8 fields belong in the eventual publisher/teacher ownership map?
  Decide from the validated Math 8 extraction and current schema evidence,
  not from IM1 similarity alone.

---

## 1. Read the Handoff (under 60 seconds)

- [x] Read the latest sprint handoff — Layer 1 (60-Second Startup) only
- [x] Read `docs/Development/CURRICULUM_IMPORT_WORKFLOW.md` before beginning
      any Math 8 extraction work — it is the canonical process this sprint
      follows, not a reference to consult after the fact
- [x] Confirm today's sprint goal

---

## 2. Orient

- [x] Review DEVELOPMENT_WORKFLOW.md for any process changes since last sprint
- [x] Review CLASSROOM_READINESS.md — the current execution document — for the active priority
- [x] Review PROJECT_MILESTONES.md for the current long-term target
- [x] Review the workflow improvements recorded in the previous sprint's retrospective

---

## 2a. If This Sprint Includes Architecture Work

Not applicable to this documentation-only startup task; no architecture work
is authorized.

- [ ] Identify the canonical architecture documents that govern the area being changed (start from `ARCHITECTURE_INDEX.md`)
- [ ] Perform reconciliation before editing — see the Architecture Reconciliation Workflow in DEVELOPMENT_WORKFLOW.md
- [ ] Do not make architecture changes before that review is complete

---

## 3. Verify Repository

- [x] git status reviewed; only protected, pre-existing untracked source assets
- [x] Determine current branch
- [x] If not on main, determine whether the sprint branch should be merged before starting new work
- [x] main up to date
- [x] Review recent commits if needed

---

## 4. Open Development Environment

- [x] 🟩 DEV server launched and health-checked, then stopped
- [x] 🟨 BUILD terminal ready
- [x] 🔵 PROJECT terminal ready
- [x] 🔴 GIT terminal ready

---

## 5. Validate Build

- [x] npm run build passes
- [x] Launch local application
- [x] Confirm current stopping point

---

## 6. Begin Work

- [x] Execute the startup portion of the First-Hour Plan; extraction itself is
      the next bounded task

---

## Implementation Status Tracking

Track every unit of work with one of the following statuses:

- **PLANNED** — scoped, not yet started
- **IMPLEMENTED** — working tree only; not yet verified
- **BUILT** — production build passes
- **BROWSER TESTED** — verified in a running browser
- **DEPLOYED** — deployed to the relevant environment (e.g. Apps Script)
- **COMMITTED** — committed to git
- **PUSHED** — pushed to GitHub

IMPLEMENTED means working tree only. It is not considered complete until the appropriate verification steps (BUILT, BROWSER TESTED, DEPLOYED, as applicable) are finished.

---

## Principle

These workflow documents are living documents.

Every sprint should be easier to start than the last one. If anything in this checklist caused friction today, improve the document before ending the sprint — not "next time."
