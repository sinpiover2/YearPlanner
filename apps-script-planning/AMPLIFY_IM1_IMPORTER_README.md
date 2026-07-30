# Amplify IM1 Importer — Operations Notes

Guarded, write-capable importer for the Amplify IM1 curriculum staging
artifact. Full design rationale lives in
`docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`'s Sprint 4
section — this file is the short version for whoever is about to actually
run something.

**Status: never run against production.** Every guarantee this importer
makes has been proven in local simulation only
(`scripts/import-staging/importer.test.mjs`, against in-memory fakes). No
Apps Script deployment has happened. Do not treat "the code exists and its
tests pass" as "this has been used against the real spreadsheet."

**Stated precisely:** ready for a controlled read-only production audit
after checkpointing; not yet authorized for production execution.

## Files

- `AmplifyIm1Importer.js` — the importer itself (preview/execute/verify).
- `AmplifyIm1ImportData.js` — **generated, do not hand-edit.** Regenerate
  with `node scripts/import-staging/generate-apps-script-payload.mjs` from
  the repository root, after regenerating
  `data/import-staging/amplify-im1.json` if the source curriculum changed.

## Before running anything for real

1. This has not been deployed. `clasp push` has not been run for this
   project this sprint.
2. The production Lessons sheet is missing the `Type` and `PlacementRule`
   columns `previewAmplifyIm1Import()` requires. Adding them is a separate,
   explicit, reviewed schema-migration step — this importer will correctly
   refuse (`blocked`) rather than add them itself.
3. Run `previewAmplifyIm1Import()` first, always. It is fully read-only:
   no sheet is modified, no backup is created, no confirmation is required.
   Review its `plan` — especially `plan.blocked`, every `blocked` action,
   and every `title-mismatch-warning` — before considering execution.

## Running execute (once authorized)

**Selecting `executeAmplifyIm1Import` from the editor's function dropdown
and clicking Run does not work** — Apps Script's Run button always calls
the selected function with zero arguments, so this always passes
`confirmation` as `undefined`, which always refuses. That refusal is
correct and intentional; it is simply not how you invoke the real run.

**The editor also does not reliably display a function's returned value**
— only "Execution started" / "Execution completed." A wrapper that only
returned the report would leave the operator with no visible confirmation
of what happened, including no visible backup ID/URL if a write partially
failed.

To actually execute, use the dedicated wrapper,
`executeAmplifyIm1ImportFromEditor()`, which follows
`LessonsSchemaMigration.js`'s `executeLessonsTypePlacementRuleMigrationFromEditor()`
pattern exactly:

1. Open `AmplifyIm1Importer.js` in the Apps Script editor.
2. Locate `executeAmplifyIm1ImportFromEditor()`.
3. Temporarily replace the placeholder
   (`"REPLACE_WITH_EXACT_AUTHORIZATION_PHRASE_BEFORE_RUNNING"`) on its
   `CONFIRMATION` line with the exact authorization phrase — copied from a
   preview report's `confirmationRequired` field, or from
   `AMPLIFY_IM1_IMPORT_METADATA.confirmationPhrase` in
   `AmplifyIm1ImportData.js`.
4. Save the project.
5. Select `executeAmplifyIm1ImportFromEditor` from the function dropdown.
6. Run it once.
7. Immediately copy the complete logged JSON report, especially:
   `writesOccurred`, `errorStage` (`null` means the run completed
   successfully), `backup.id`, `backup.url`.
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
save again, in one sitting.

**The underlying guarded function, `executeAmplifyIm1Import(confirmation)`,
remains the authoritative implementation.** The wrapper exists only because
the Apps Script Run button cannot pass arguments to the function it calls,
and because a function's returned object is not reliably visible in the
editor unless explicitly logged. The wrapper adds no import logic of its
own — it is a thin adapter (see `amplifyIm1RunEditorWrapper_` in
`AmplifyIm1Importer.js`) that calls the guarded function, logs its result,
and returns that same result unchanged.

- The confirmation string must match **exactly** — it's derived from the
  artifact's own content hash plus unit/item counts, so a stale one (from a
  previous artifact version) will never accidentally work.
- Calling `executeAmplifyIm1Import()` directly with no argument always
  refuses — there is no default/placeholder value on that function itself
  to accidentally trigger a write. The wrapper adds an intentional
  invocation path; it does not change this.
- A backup (a full spreadsheet copy) is created before any write. Its ID and
  URL are in the returned report's `backup` field.
- If `report.errorStage` is non-null, treat `report.backup` as the
  authoritative recovery path. Nothing is rolled back automatically.

## Verifying afterward

```js
verifyAmplifyIm1Import();
```

Read-only. Reports `errors`, `checkedUnitCount`, `checkedItemCount`, and
`knownStaleCount` (rows intentionally left stale to protect teacher-authored
data — not a failure).

## Safety properties (see the implementation spec for how each is tested)

- Exact confirmation match; no default; stale confirmations fail automatically.
- Refuses on: unsupported schema version, tampered payload hash, missing
  sheet/column, duplicate ID, cross-course ID collision, blocked plan,
  backup failure, lock-acquisition failure, state changed between planning
  and execution.
- Never writes `PlannedDays`, `TeacherNotes`, `PrimaryLink`, or
  `LessonNumber` to an existing row.
- Never assigns a fixed `SortOrder` to a flexible-placement item.
- Idempotent: rerunning against an already-imported state produces no-ops.
