# Amplify IM1 Staged Importer

Read-only pipeline that turns `Curriculm/M1/IM1_Curriculum_Extraction.md`
into a machine-readable staging artifact, validates it, and previews what an
eventual write to Year Planner's `Units`/`Lessons` sheets would do — without
writing anything, anywhere.

Governed by `docs/Architecture/CURRICULUM_INFORMATION_MODEL.md` (the
architectural decisions) and
`docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` (§7, D-4) — this
directory implements the "staged intermediate artifact" both documents call
for. **Nothing here writes to a spreadsheet.** There is no execute mode, no
Apps Script call, no confirmation token — that is deliberately out of scope
for this sprint (see the spec's Sprint Progress section).

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
```

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
