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

```js
// From the Apps Script editor, after reviewing a preview report:
executeAmplifyIm1Import(previewReport.confirmationRequired);
```

- The confirmation string must match **exactly** — it's derived from the
  artifact's own content hash plus unit/item counts, so a stale one (from a
  previous artifact version) will never accidentally work.
- Calling `executeAmplifyIm1Import()` with no argument always refuses —
  there is no default/placeholder value to accidentally trigger a write.
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
