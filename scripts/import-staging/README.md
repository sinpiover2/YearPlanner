# Amplify IM1 Staged Importer

Read-only pipeline that turns `Curriculm/M1/IM1_Curriculum_Extraction.md`
into a machine-readable staging artifact, validates it, and previews what an
eventual write to Year Planner's `Units`/`Lessons` sheets would do — without
writing anything, anywhere.

Governed by `docs/Architecture/CURRICULUM_INFORMATION_MODEL.md` (the
architectural decisions) and
`docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` (§7, D-4) — this
directory implements the "staged intermediate artifact" both documents call
for, plus (as of Sprint 4) a local simulation of the guarded, write-capable
Apps Script importer that eventually consumes it.

**No production execution has occurred.** Everything in this directory and
in `apps-script-planning/AmplifyIm1Importer.js` has been proven only against
local fixtures and in-memory fakes (`fake-spreadsheet.mjs`). The real
`executeAmplifyIm1Import()` has never been invoked against the production
spreadsheet, and no Apps Script deployment (`clasp push`) has happened. See
the implementation spec's Sprint 4 section, "Known limitations," for exactly
what remains before a real read-only production preview is authorized.

**Stated precisely:** ready for a controlled read-only production audit
after checkpointing; not yet authorized for production execution.

## Files

| File | Purpose |
|---|---|
| `amplify-im1-source.mjs` | Hand-transcribed copy of the extraction document's Instructional Items tables. The one place a human re-reads the source; everything downstream is generated from this. |
| `generate-artifact.mjs` | Deterministically builds `data/import-staging/amplify-im1.json` from the source transcription. No network, no PDF parsing. |
| `validate-artifact.mjs` | Structural, ID-collision, literal-Type, ordering/placement, and completeness checks against an artifact. |
| `build-import-plan.mjs` | Given an artifact and a destination snapshot (Units/Lessons rows), classifies every unit/item as `create` / `source-update` / `no-op` / `blocked`. Pure function — no writes, no side effects. |
| `preview.mjs` | CLI: reads the artifact, validates it, builds a plan, prints a human-readable summary and (optionally) a JSON report. |
| `test.mjs` | Lightweight tests (Node's built-in `node:test` + `node:assert/strict` — no new dependency). |
| `fixtures/empty-destination.json` | Simulated destination with no existing Amplify rows — everything should classify as `create`. |
| `fixtures/representative-destination.json` | Simulated destination exercising every plan branch: exact match, title mismatch, duplicate ID, cross-course ID collision, and teacher-owned-field protection. |
| `generate-apps-script-payload.mjs` | Deterministically builds `apps-script-planning/AmplifyIm1ImportData.js` from the canonical JSON artifact (Sprint 4). |
| `fake-spreadsheet.mjs` | Minimal in-memory `SpreadsheetApp`/`LockService` fakes used only for local simulation — never touches a real spreadsheet (Sprint 4). |
| `importer.test.mjs` | Loads `apps-script-planning/AmplifyIm1Importer.js` via Node's `require()` (see that file's `module.exports` guard) and runs the full parity/safety-failure/idempotence test matrix against the fakes above (Sprint 4). |

## Regenerating the artifact

```bash
node scripts/import-staging/generate-artifact.mjs
```

Re-running this against an unchanged extraction document produces a
byte-identical file (idempotent — verify with `--check`, which exits
non-zero if regenerating would change anything):

```bash
node scripts/import-staging/generate-artifact.mjs --check
```

If the extraction document changes, re-transcribe `amplify-im1-source.mjs`
by hand — do not attempt to auto-parse the Markdown (see
`AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` §7 for why).

## Running a preview

```bash
# Against an empty destination (everything should be a "create")
node scripts/import-staging/preview.mjs --destination scripts/import-staging/fixtures/empty-destination.json

# Against a destination with existing rows (exercises update/no-op/blocked)
node scripts/import-staging/preview.mjs --destination scripts/import-staging/fixtures/representative-destination.json

# Write the full JSON report somewhere instead of only printing a summary
node scripts/import-staging/preview.mjs --destination <path> --out /tmp/report.json
```

This sprint intentionally does not read production Sheets — the destination
is always a fixture file in the same shape `getSheetData()` returns
(`docs/Reference/SHEET_STRUCTURE.md`). Pointing `--destination` at a real
export of production data would work mechanically, but is out of scope here.

## Running the tests

```bash
node --test scripts/import-staging/test.mjs
node --test scripts/import-staging/importer.test.mjs
```

## Generating and checking the Apps Script payload (Sprint 4)

```bash
node scripts/import-staging/generate-apps-script-payload.mjs
node scripts/import-staging/generate-apps-script-payload.mjs --check
```

The generated `apps-script-planning/AmplifyIm1ImportData.js` embeds the same
JSON already in `data/import-staging/amplify-im1.json` — never hand-edit
that generated file. `--check` fails if the two have drifted apart (e.g. the
canonical artifact was regenerated but the Apps Script payload wasn't).

`apps-script-planning/AmplifyIm1Importer.js` is the guarded, write-capable
importer that consumes this payload. It has never been run against a real
spreadsheet — `importer.test.mjs` exercises it entirely against the fakes in
`fake-spreadsheet.mjs`. See
`docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`'s Sprint 4
section for the full guarded-write-sequence design, and
`apps-script-planning/AMPLIFY_IM1_IMPORTER_README.md` for operator-facing
usage once a later sprint authorizes a real preview.

## ID scheme

- Unit: `AMP-IM1-U{n}` (`n` = Amplify's own unit number, 1–7 — matches the
  `M1.N` numbering used throughout the extraction).
- Fixed-placement item: `AMP-IM1-U{n}-I{order}` (two-digit, e.g. `-I01`).
- Flexible-placement item (no `SortOrder`, e.g. `Investigate`):
  `AMP-IM1-U{n}-F{index}`.

These IDs are deliberately **distinct** from the existing placeholder seed
`UnitID`s in production (`IM1-U1`…`IM1-U8`) — Extraction Note #1 already
found those don't correspond 1:1 to Amplify's real units by number. Mapping
a staging ID onto a final production ID (if the two are ever reconciled) is
an importer-phase decision, not made by this sprint.

## Field ownership (enforced by `build-import-plan.mjs`)

Publisher-owned (safe to propose updating): `UnitName`, item `Title`,
`Type`, `Description`/summary, `SortOrder`, `PlacementRule`, `IsOptional`.

Teacher-owned (never written, never overwritten): Unit `RequiredDays` /
`OptionalDays` (once a Unit row exists — see D-2/D-5), Lesson `PlannedDays`,
`TeacherNotes`, `PrimaryLink`. An update is only proposed
(`source-update`) when none of these are populated on the destination row;
otherwise the item is `blocked` with `reasons: ["preserve-teacher-fields"]`
and must be reviewed manually.
