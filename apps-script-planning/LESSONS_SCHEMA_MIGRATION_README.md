# Lessons Schema Migration — Operations Notes

Guarded, narrowly-scoped Apps Script migration that adds two columns —
`Type` and `PlacementRule` — to the production `Lessons` sheet. This is the
single largest remaining prerequisite before a real
`previewAmplifyIm1Import()` run can pass schema validation for Lessons (see
`docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`'s Sprint 4/5
sections). Full design rationale lives in that document's Sprint 6.2
section — this file is the short version for whoever is about to actually
run something.

**Status: never run against production.** Every guarantee this migration
makes has been proven in local simulation only
(`scripts/import-staging/lessons-schema-migration.test.mjs`, against
in-memory fakes). No Apps Script deployment has happened. Do not treat "the
code exists and its tests pass" as "this has been used against the real
spreadsheet."

**Stated precisely:** ready for a controlled read-only production preview
after checkpointing; not yet authorized for production execution.

## Why a separate file

`apps-script-planning/LessonsSchemaMigration.js` is deliberately its own
file — not folded into `Code.js` or `AmplifyIm1Importer.js`. A schema
migration and a curriculum-row importer are different kinds of operation
with different blast radii, and this file must remain independently
reviewable and removable without touching either of those. It never adds,
edits, or reads a curriculum row, and never opens or touches the `Units`
sheet at all.

## What this migration does and does not do

Does:
- Adds exactly two new columns, `Type` and `PlacementRule`, to `Lessons`,
  immediately after `SortOrder`.
- Leaves every existing `Lessons` cell — including every original header
  and every data row — exactly as it was, in its original column-by-name
  position.
- Leaves the two new columns blank on every existing row.

Does not:
- Add, edit, or delete any curriculum row (`Lessons` or `Units`).
- Touch the `Units` sheet in any way.
- Run the Amplify IM1 importer's preview or execute path.
- Deploy a new Apps Script version.

## Original vs. approved final schema

Original (audited, Sprint 5):

```
LessonID, UnitID, CourseID, LessonNumber, LessonTitle, PlannedDays,
SortOrder, KeyOutcome, Description, PrimaryLink, TeacherNotes, IsOptional
```

Approved final (after this migration runs):

```
LessonID, UnitID, CourseID, LessonNumber, LessonTitle, PlannedDays,
SortOrder, Type, PlacementRule, KeyOutcome, Description, PrimaryLink,
TeacherNotes, IsOptional
```

## Files

- `LessonsSchemaMigration.js` — the migration itself (preview/execute/verify).

## Before running anything for real

This is a checklist, not a suggestion — stop at the first item you cannot
confirm.

1. **Deployment.** This has not been deployed. `clasp push` has not been
   run for this file. A real run requires either the Apps Script editor
   (signed into the correct district account) or an explicitly-authorized
   API-Executable deployment — `clasp run` does **not** work without one;
   do not assume it does (see Sprint 5's audit: `clasp run` was attempted
   once against a harmless function and failed with "Script function not
   found... make sure script is deployed as API executable").
2. **Identity.** Confirm you are signed into the authorized school account,
   that `clasp show-authorized-user` (or the editor's own account
   indicator) matches, that the Apps Script project is `apps-script-planning`
   (not a copy or a different project), and that `SHEET_ID` resolves to the
   real, single production Year Planner spreadsheet — not a test or backup
   copy.
3. **Quiet window.** Run only when no one is actively using the live
   classroom frontend or editing the spreadsheet directly. **The script
   lock this migration takes does NOT block a concurrent classroom write.**
   `Code.js`'s `addLesson`/`updateLesson`/`deleteLesson`/`reorderLessons` —
   the functions the live frontend actually calls — acquire no lock at all
   (confirmed by inspection; see "Locking and concurrency" below). A
   concurrent edit during the run is mitigated by the revalidation pass and
   post-write verification (see below), which fail safely rather than
   silently succeeding, but "fails safely" still means the run failed and
   must be investigated — it is not a substitute for actually running
   during a quiet window.
4. **Preview first, always.** Run `previewLessonsTypePlacementRuleMigration()`
   before anything else. It is fully read-only: no column is inserted, no
   cell is edited, no backup is created, no lock is held. Review its
   `classification.state` — it must read `"migration-required"` — before
   considering execution.
5. If `classification.state` is anything other than `"migration-required"`
   or `"already-complete"`, do not proceed. Read `classification.reasons`
   and resolve the underlying schema problem manually first; this migration
   deliberately refuses rather than guessing.
6. **Manual inspection beyond headers.** This migration validates the
   header row and cell values only. Before running execute, manually open
   the real Lessons sheet and check for: any merged cell spanning columns
   G:H (the SortOrder/KeyOutcome boundary, where the two new columns are
   inserted), an active filter or filter view, any protected range or
   protected-sheet setting, and any formula anywhere in the workbook that
   references a Lessons column via `INDIRECT()` with a hardcoded column
   letter (a plain cell-reference formula like `=Lessons!H5` auto-adjusts
   correctly when columns are inserted — this is guaranteed spreadsheet
   behavior — but an `INDIRECT("Lessons!H5")` string does **not** auto-adjust
   and will silently point at the wrong column after this migration runs).
   None of this is something the migration's code can detect for you — see
   "Real Google Sheets behavior" below for why.
7. Copy the exact `confirmationRequired` string from the preview report.
8. Immediately after execute returns, run `verifyLessonsTypePlacementRuleMigration()`
   and read its `errors` array.
9. **Record the backup ID and URL** from `report.backup` somewhere durable
   (not just the Apps Script execution log, which rotates) before doing
   anything else.
10. If `report.errorStage` is non-null, or verification reports anything
    other than `valid: true`, **stop immediately.** Do not re-run. Do not
    attempt to manually finish or fix the sheet. Treat the backup as the
    authoritative recovery path and investigate before doing anything else
    — see "Partial-failure states" below for what each stage means.

## Running execute (once authorized)

**Selecting `executeLessonsTypePlacementRuleMigration` from the editor's
function dropdown and clicking Run does not work** — Apps Script's Run
button always calls the selected function with zero arguments, so this
always passes `confirmation` as `undefined`, which always refuses (confirmed
against production in Sprint 6.3A/6.3B). That refusal is correct and
intentional; it is simply not how you invoke the real run.

**The editor also does not display a function's returned value** — only
"Execution started" / "Execution completed" (also confirmed against
production, Sprint 6.3B). A wrapper that only returned the report would
leave the operator with no visible confirmation of what happened — including
no visible backup ID if a mutation partially failed — so the wrapper below
explicitly logs the full report before returning it.

To actually execute, use the dedicated wrapper,
`executeLessonsTypePlacementRuleMigrationFromEditor()`, which follows
`apps-script-roster-admin/ProductionDataCleanup.js`'s
`executeProductionDataCleanupV1()` pattern:

1. Open `LessonsSchemaMigration.gs` in the Apps Script editor.
2. Locate `executeLessonsTypePlacementRuleMigrationFromEditor()`.
3. Temporarily replace the placeholder
   (`"REPLACE_WITH_EXACT_AUTHORIZATION_PHRASE_BEFORE_RUNNING"`) on its
   `CONFIRMATION` line with the exact authorization phrase — copied from a
   preview report's `confirmationRequired` field, or from
   `LESSONS_MIGRATION_CONFIRMATION_PHRASE` at the top of this file.
4. Save the project.
5. Select the wrapper (`executeLessonsTypePlacementRuleMigrationFromEditor`)
   from the function dropdown.
6. Run it once.
7. Immediately copy the complete logged JSON report, especially:
   `writesOccurred`, `errorStage` (the actual success/failure signal — this
   report has no separate `success` field; `errorStage: null` means the run
   completed successfully), `backup.id`, `backup.url`.
8. Do not rerun on ambiguity or failure.
9. Restore the placeholder immediately after capturing the report.
10. Save again.
11. Later, push the placeholder version from the repository back to Apps
    Script HEAD so HEAD is not left armed with the real phrase.

**Editing the placeholder is itself part of the explicit production
authorization ceremony** — the deliberate source edit is the confirmation
act, not the click on Run. Running the wrapper unedited (placeholder still
in place) refuses exactly like clicking Run on the guarded function itself,
because the placeholder is a value that will *never* accidentally equal the
real phrase — it is not a hardcoded copy of it, and must never become one.

**The wrapper is unsafe to leave armed with the real phrase.** Between step
3 and step 9, the live Apps Script HEAD source contains the real
confirmation phrase in cleartext, callable by a single Run click with no
further confirmation. Minimize that window: edit, save, run once, restore,
save again, in one sitting — and always follow step 11 before ending the
session, so the repository's own (placeholder-only) version of this file is
what HEAD reflects afterward.

**The underlying guarded function, `executeLessonsTypePlacementRuleMigration(confirmation)`,
remains the authoritative implementation.** The wrapper exists only because
the Apps Script Run button cannot pass arguments to the function it calls,
and because a function's returned object is not reliably visible in the
editor unless explicitly logged. The wrapper adds no migration logic of its
own — it is a thin adapter (see `lessonsMigrationRunEditorWrapper_` in
`LessonsSchemaMigration.js`) that calls the guarded function, logs its
result, and returns that same result unchanged.

- The confirmation string must match **exactly** — `===`, no trimming, no
  case-folding, no boolean/truthy acceptance.
- Calling `executeLessonsTypePlacementRuleMigration()` directly with no
  argument always refuses — there is no default/placeholder value on that
  function itself to accidentally trigger a write. The wrapper adds an
  intentional invocation path; it does not change this.
- A backup (a full spreadsheet copy) is created before any mutation. Its ID
  and URL are in the returned report's `backup` field.
- If `report.errorStage` is non-null, treat `report.backup` as the
  authoritative recovery path (when present). Nothing is rolled back
  automatically.
- Running this a second time against an already-migrated sheet is a
  successful no-op (`alreadyComplete: true`, `writesOccurred: false`,
  `backup: null` — no second backup is created).

## Verifying afterward

```js
verifyLessonsTypePlacementRuleMigration();
```

Read-only. Reports whether the current schema exactly matches the approved
final header order, and whether the new `Type`/`PlacementRule` columns are
currently blank on every row. It has no memory of a specific execute run —
it evaluates the current state fresh every time it's called, the same
honest limitation `verifyAmplifyIm1Import()` documents for itself.

## Confirmation phrase

`MIGRATE_LESSONS_SCHEMA_ADD_TYPE_AND_PLACEMENTRULE_V1`

Chosen over a row-count-suffixed form (e.g.
`MIGRATE_LESSONS_ADD_TYPE_PLACEMENTRULE_55_ROWS`) deliberately: the row
count can legitimately change before this migration is ever authorized to
run, and a phrase derived from a value that can drift would either go stale
for no real reason or invite hand-editing the row count to match — neither
is desirable for a high-friction confirmation string. This phrase is not a
secret; it is shown directly in the preview report's
`confirmationRequired` field.

## Safety properties (see the implementation spec for how each is tested)

- Exact confirmation match; no default; a stale or generic confirmation
  fails automatically.
- Refuses on: missing `Lessons` sheet, missing original header, duplicate
  header (including a duplicated `Type` or `PlacementRule`), blank header,
  only one of `Type`/`PlacementRule` present (partially complete — never
  guesses the other column), unexpected header order, an extra unknown
  column (whether the schema is otherwise pre- or post-migration shaped),
  lock-acquisition failure, backup failure, schema state changed between
  the planning and revalidation passes.
- Column insertion only — never a whole-sheet rewrite. Every original cell
  keeps its original header-name alignment; only `Type` and `PlacementRule`
  are ever written, and only in the header row.
- Post-write verification compares a full pre-migration snapshot (every
  original field, every row, in row order) against the post-migration
  state and makes the run unsuccessful if anything differs — row
  reordering, a value shifted to the wrong header, or a nonblank value
  appearing under a new column are all detected the same way a changed
  `LessonID` would be. Never silently reports success on a mismatch.
- Idempotent: rerunning against an already-migrated sheet produces a
  successful no-op with no second backup. Rerunning after a *failed*
  partial write (columns physically inserted but never labeled) is
  correctly blocked as `unexpected` — it is never silently "finished" on
  a second attempt.
- `writesOccurred`/`columnsInserted` are only ever `true` once the actual
  mutating calls have returned — and are set *before* the subsequent
  `flush()` call, specifically so a `flush()` failure (which cannot undo an
  already-completed mutation) is never mis-reported as "no writes
  happened."
- Never touches the `Units` sheet.
- `verifyLessonsTypePlacementRuleMigration()` never writes, never creates a
  backup, and never acquires a lock — confirmed by inspection (it calls
  only read methods) and by a dedicated test that overrides `copy()` to
  throw if ever called during a verify pass.

## Locking and concurrency — what the script lock does *not* cover

`LockService.getScriptLock()` provides mutual exclusion only against other
code in this same Apps Script project (`apps-script-planning`) that also
explicitly acquires it. **`Code.js`'s `addLesson`, `updateLesson`,
`deleteLesson`, and `reorderLessons` — the functions the live classroom
frontend actually calls on every "Add Lesson" / edit / delete / reorder
action — acquire no lock at all.** This was confirmed by direct inspection,
not assumed. That means:

- The lock does **not** block a concurrent classroom write during this
  migration's execute run. It only blocks another *migration* run (or
  another future guarded function in this project that also takes the
  lock) from overlapping.
- The lock does **not** block a human editing the sheet directly in the
  Google Sheets UI, ever — this is a documented limitation
  `ProductionDataAudit.js`/`ProductionDataCleanup.js` already state for
  themselves, and it applies identically here.
- Mitigation, not prevention: the revalidation pass (re-reads the schema
  and row count immediately before mutating) and the post-write
  verification (compares a snapshot taken at the revalidation read against
  the post-migration state) together mean a genuine concurrent write is
  very likely to be *detected* — either aborting before any mutation
  (`errorStage: "revalidation"`) or reporting an unsuccessful run
  afterward (`errorStage: "post-write-verification"`) — rather than being
  silently accepted. Neither path prevents the underlying race; both fail
  safely in the sense of never reporting false success. This is why running
  during an actual quiet window (see the checklist above) still matters —
  detection is not the same as prevention.

## Real Google Sheets behavior — verified vs. unverified

This distinguishes what is guaranteed by documented Apps Script/Sheets
semantics, what was confirmed by inspecting this repository, and what
remains genuinely unverified because no real spreadsheet has been touched.

**Guaranteed by Sheets semantics (not independently re-tested this
sprint, but standard, documented spreadsheet behavior):**
- `Spreadsheet.copy(name)` creates a complete, independent copy — every
  sheet, all data, formatting, formulas, protections, filters, notes, and
  validations — as a new Drive file, never a mutation of the source.
- A plain formula cell reference to a Lessons column (e.g. `=Lessons!H5`),
  anywhere in the workbook, automatically updates to the new column letter
  when columns are inserted before it — this is standard spreadsheet
  insert-column behavior, not something this migration needs to handle.
- `insertColumnsAfter` shifts cell content, and Apps Script read calls
  within the *same script execution* always see prior writes from that
  same execution, regardless of whether `flush()` has been called yet.

**Confirmed by repository inspection (see "Consumer positional-assumption
review" in the implementation spec's Sprint 6.2A section):**
- Every Apps Script reader/writer of `Lessons` resolves columns by header
  name at call time (`headers.indexOf(...)`), never a fixed numeric
  position. The frontend consumes only header-keyed JSON objects. Nothing
  in this repository depends on a Lessons column's physical letter.

**Genuinely unverified — this migration cannot detect these, and neither
can any test against the local fake, which models cell values only:**
- Whether any filter, filter view, protected range, protected sheet,
  merged cell, named range, conditional formatting rule, note, comment,
  chart, or pivot table anywhere touching the Lessons sheet survives
  column insertion the way it's expected to. Most of these are documented
  to auto-adjust on structural changes in Google Sheets, but that has not
  been independently exercised against the real spreadsheet this sprint.
- Whether any formula anywhere in the workbook references a Lessons column
  via `INDIRECT()` with a hardcoded column letter — this specifically does
  **not** auto-adjust (a real, documented Sheets gotcha, distinct from a
  plain cell reference) and would silently break if such a formula exists.
- Real Apps Script quota/timeout behavior for `insertColumnsAfter` and
  `Spreadsheet.copy()` against the actual production spreadsheet's size.
- Whether `insertColumnsAfter` throws (rather than partially succeeding)
  when it encounters a range-level or sheet-level protection — this
  migration's guarded execute sequence handles either outcome safely
  (an exception is caught, `writesOccurred`/`columnsInserted` report
  accurately based on exactly how far execution got, and the backup is
  preserved as the recovery path either way), but which specific outcome
  occurs in practice has not been observed.

None of the unverified items above are things this migration's code can
resolve on its own without reading the real spreadsheet, which is outside
this sprint's authorization. They are exactly what step 6 of "Before
running anything for real" asks the operator to manually check first.

## Partial-failure states — what each `errorStage` means

| `errorStage` | Did any mutation happen? | What to do |
|---|---|---|
| `confirmation` | No | Re-copy the exact phrase from a fresh preview and retry. |
| `lock` | No | Another script execution is likely running; wait and retry. |
| `schema` | No | Read `classification.reasons`; resolve manually. Never retry blindly. |
| `backup` | No | Investigate the Drive/Sheets API error before retrying. |
| `revalidation` | No | Something changed the sheet between planning and mutation (see "Locking and concurrency"). Re-run preview to see current state. |
| `post-write-verification` | **Yes** — columns were inserted | Stop. Do not retry. Treat `report.backup` as authoritative; investigate the specific `verification.errors` before any further action. |
| `exception` | Maybe — check `report.columnsInserted`/`report.writesOccurred` on the returned report itself | Stop. Do not retry. If `report.backup` is present, treat it as authoritative. |

No automatic rollback exists for any of these. A failure after a backup
was created always means "the backup is the recovery path," never
"nothing happened" — even when `writesOccurred` is `false`, since a
mutating call can fail partway (see `columnsInserted` specifically, which
can be `true` even when the overall run still failed further down the
sequence).
