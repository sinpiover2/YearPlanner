# Curriculum Import Workflow
**Year Planner — Canonical Process for Importing Any Curriculum**

---

## Purpose

Year Planner imports curriculum from outside publishers (Amplify Math 1, Amplify Math 8, and any future adoption) into the `Units`/`Lessons` schema that Planning, Forecast, and Units all read from.

This document describes the canonical, repeatable process for that kind of import — not any single curriculum's implementation. It exists so that importing the next curriculum does not require rediscovering what was learned building and running the first one.

Use this document whenever a new curriculum needs to enter Year Planner. A curriculum-specific implementation (its extraction file, its importer module, its field mappings) is expected to differ every time; the shape of the process should not.

---

## Design Philosophy

A curriculum import is not a data migration in the ordinary sense. It introduces publisher-authored content into a system whose primary author is the teacher, and it must do so without ever putting teacher-authored work at risk.

Three commitments follow directly from `PROJECT_CONTEXT.md`'s Curriculum Philosophy and govern every step below:

- Imported curriculum must never overwrite teacher work.
- Imported curriculum must always be additive.
- Superseded curriculum is archived, never silently migrated or deleted, unless the correspondence between old and new records is proven — not assumed.

A curriculum import is also, functionally, a production data migration against a live spreadsheet a teacher is actively using. It inherits every discipline that implies: preview before writing, an explicit confirmation before any write, a backup before any mutation, and verification after every write. See `DEVELOPMENT_WORKFLOW.md`'s Guarded Production Migration Execution Procedure for the mechanics that every step below relies on.

---

## Guiding Principles

- **Extraction is its own deliverable, not a step inside importer code.** The publisher's source material must be turned into a reviewable, correctable artifact before any import logic is written against it. Writing the importer first and "figuring out the data as you go" produces an importer that encodes undetected extraction mistakes.
- **Absence must remain absence.** When a publisher source does not specify something — a day count, a sequence position, a field this course's material simply omits — record it as unknown. Never infer it from a sibling unit, a pattern, or a plausible default. A filled-in guess is indistinguishable from real source data once it's written down, and there is no way to later tell the two apart.
- **Publisher-owned and teacher-owned information are different kinds of data and must never be merged into one write.** Every field entering the schema has exactly one owner. Publisher-owned fields (title, type, sequence, description) are safe to overwrite on a corrected re-import. Teacher-owned fields (day estimates, notes, links, logged progress) are never written by an importer, under any circumstance, once populated.
- **Every production-facing step is guarded.** Nothing writes to the live spreadsheet without a read-only preview first, an explicit confirmation, a backup, and a post-write verification. A step that "seems safe" still follows the guard — the guard is what makes it safe, not the operator's judgment about the specific run.
- **The import must be deterministic and repeatable.** Re-running the same extraction through the same pipeline must produce byte-identical output. Re-running the same guarded import against an unchanged destination must be a safe no-op, not a duplicate write.
- **Uncertain correspondence is resolved by archiving, not by forcing a decision.** When it isn't proven that an old record and a new record represent the same thing, do not delete the old one and do not migrate its data onto the new one. Make the old record inactive by default and leave it fully intact.

---

## Overall Workflow

### 1. Obtain the authoritative curriculum source

Identify the publisher's own material — official unit guides, lesson documents, PDFs, or other primary source — as the single source of truth for this import. Do not substitute a summary, a third party's interpretation, or a prior course's structure for the publisher's own material, even when it looks similar.

Record exactly which files or pages were used. A later question about "does the import match the source" must be answerable by pointing at a specific artifact, not memory.

### 2. Extract the source into normalized Markdown

Transcribe the source into a structured, human-readable Markdown document — one file per course, organized by the source's own unit/lesson structure. This document, not the source PDFs themselves, becomes what every later step reads.

Every unit's source is its own contract. One unit may give per-item day counts; another may give only a unit-level total; another may give neither. Record what each unit actually provides. Do not normalize the differences away by filling gaps to match a sibling unit's shape.

Distinguish two different kinds of "missing" explicitly, in the extraction itself:

- **Confirmed absent** — the source was fully reviewed and the field genuinely isn't there.
- **Not found in what was reviewable** — the field may exist, but the tooling or environment available during extraction could not confirm it (for example, a PDF that couldn't be rendered). Treat this as provisional, not as a confirmed absence, until someone can actually check the page.

### 3. Validate the extraction against the source

Before writing any import logic, re-check the extraction against the original source, unit by unit. Extraction is transcription, and transcription has an error rate — a field skimmed and reported "not provided" that in fact appears elsewhere on the same page is the most common failure mode, and it's caught by review, not by writing more code.

Fix the extraction document directly when a discrepancy is found. Do not carry a known extraction error forward into the importer and try to compensate for it in code.

### 4. Distinguish publisher-owned vs. teacher-owned information

Before designing any schema change or write path, produce an explicit field-by-field ownership map for every field the import will touch:

- **Publisher-owned** — sourced from the extraction, safe to write on create, safe to correct on a re-import (title, type, sequence position, description, and similar).
- **Teacher-owned** — never written by the importer, under any circumstance, once a row exists (day estimates, notes, links, logged progress, and similar).

This map is what every later guard enforces mechanically. Treat it as a design artifact worth reviewing on its own, separate from the code that implements it — a wrong ownership call here becomes a data-loss risk everywhere downstream.

### 5. Build deterministic import data

Generate a staged, machine-readable artifact (for example, a JSON file) from the validated extraction — never from the source PDFs directly, and never through logic that re-derives content from the extraction document by parsing prose. A hand-transcribed, reviewed table is more trustworthy than an automated parser guessing at a publisher's formatting.

The generator must be deterministic: running it again against an unchanged extraction document must produce byte-identical output, verifiable with a `--check`-style mode. Embed a hash of the extraction document's own content in the artifact so any future drift between the two is detectable, not assumed away.

Validate the artifact structurally before it's ever used for a preview: every required field present, no ID collisions, every item's sequencing information unambiguous (a fixed item has a position; a flexible item has a placement rule; never both, never neither).

### 6. Preview against production

Build a read-only preview that classifies every unit and item in the artifact against the real, current destination: `create` (doesn't exist yet), `source-update` (exists, publisher fields differ, no teacher-owned field is populated), `no-op` (already matches), or `blocked` (a teacher-owned field is populated where the diff lands, or a structural conflict exists). Never propose an update to a row carrying any populated teacher-owned field — that row is blocked, not merged.

This preview must be genuinely read-only, runnable at any time, and safe to run repeatedly. It performs zero writes, and its report should say so explicitly.

### 7. Execute the guarded import

Follow `DEVELOPMENT_WORKFLOW.md`'s Guarded Production Migration Execution Procedure exactly: preview, execute (with an exact-match confirmation phrase, never a default or a truthy check), verify, restore the editor's placeholder confirmation, sync the repository to match what actually ran, and confirm the repository is clean afterward.

Inside the execute step itself, the guarded write sequence should: validate the confirmation; acquire a lock; re-read and re-classify the destination immediately before writing (never trusting an earlier preview's snapshot); create a backup before any mutation; abort if the destination changed between the planning read and the write; write only the specific fields that actually changed, never a whole-row rewrite; and report an explicit, single-computed `success` signal that a disarmed editor wrapper can act on — see Safety Rules, below.

### 8. Verify the imported data

Run a standalone, read-only verification that re-classifies the current production state against the same artifact the execute step used, reusing the same classification logic rather than a second, hand-written comparison that could drift from it. Confirm every intended item actually landed, nothing regressed, and any row still `blocked` for a teacher-owned field is the expected, correct outcome — not an error.

Do not treat "the execute step returned without an exception" as sufficient confirmation by itself. Confirm the verification's own report.

### 9. Archive the previous curriculum rather than migrating or deleting it

If this import supersedes an existing curriculum in the schema, do not assume the old records and the new records correspond one-to-one. Verify the correspondence directly — by ID, by content, by whatever evidence actually exists — before treating any old record as replaced.

Where the correspondence is not proven for every record, do not force a migration or deletion decision. Add an explicit, own-purpose lifecycle field (not a reused field whose existing meaning is close but not identical) that marks the old curriculum inactive by default, while leaving it fully intact and queryable. This is a strictly safer fallback than migrating data that might not actually correspond, or deleting data that might still be needed.

### 10. Validate inside the Year Planner UI

Confirm the imported curriculum renders correctly in the running application — visible where it should be, hidden where archived, day counts and sequencing behaving as intended — against live production data, not just a passing build or test suite. A migration that is structurally correct in the spreadsheet can still be wrong in how the frontend interprets it; only the running UI proves the whole path end to end.

---

## Safety Rules

- **Preview before execute, always.** No guarded write function is ever called without first reviewing its own read-only preview's report.
- **Exact-match confirmation only.** No default parameter, no truthy check, no trimming or case-folding. A confirmation phrase that can be satisfied accidentally is not a confirmation.
- **Lock, then re-read, then write.** Never write based on a read taken before the lock was acquired.
- **Backup before mutation, every time.** A guarded write never mutates production without a backup already existing that could restore the prior state.
- **Teacher-owned fields are never written by an importer**, once a row exists — never merged, never partially updated alongside a publisher-field change on the same row.
- **A refusal must be impossible to mistake for success.** An Apps Script function that returns normally is reported by the editor as "Execution completed" regardless of what the returned value says. Every guarded execute report must carry one explicit `success` boolean, computed once from the report's own final state, and the interactive editor wrapper must log through every available logger and then throw when the outcome was not a genuine success — so a refusal is visibly reported as a failure, not read as a completed run.
- **Restore the disarmed state after every real run.** A guarded migration's editor wrapper carries a placeholder confirmation string during normal repository state. It is armed with the real phrase only for the duration of an actual execution, in the same sitting, and restored to the placeholder immediately after — the live source must never be left armed.
- **Sync the repository to match what actually executed.** An interactive execution against production happens directly against the live script, not through a normal code push. Pull the resulting source back into the repository afterward and confirm the only diff is the migration's own legitimate change — not a stray armed confirmation phrase, not unrelated drift.

---

## Repeatability Requirements

- Regenerating the staged artifact from an unchanged extraction document must produce byte-identical output.
- Re-running a completed guarded import against an already-imported destination must classify everything `no-op` and perform zero writes — no second backup, no duplicate rows.
- A structural change to the source data (not just a re-run) must be detectable — through a content hash embedded in the artifact and, where practical, a confirmation phrase derived from that hash — so a stale confirmation phrase can never be reused against changed content.
- Any consumer of the artifact (an Apps Script implementation and a Node-based implementation, for example) that duplicates the same decision logic must be tested against the same fixtures and asserted to produce identical output, so the two cannot silently diverge.

---

## Definition of Complete

A curriculum import is complete only when all of the following are true:

- The extraction has been validated against the original source, with every gap explicitly marked as confirmed-absent or not-yet-reviewable.
- The publisher-owned/teacher-owned field ownership map has been reviewed and is enforced by the guarded write path, not just documented.
- The staged artifact regenerates deterministically and passes structural validation.
- A real, read-only preview has been run against production and reviewed in full, including every blocked and warned item.
- The guarded execute step has actually run against production — not merely been built and tested against local fixtures — and its report shows a genuine `success` outcome with a real backup reference.
- A standalone verification has confirmed the post-import production state matches the artifact.
- Any superseded prior curriculum has been archived (not migrated, not deleted) unless a proven, record-level correspondence justified otherwise.
- The import has been validated inside the running Year Planner UI against live production data.
- The editor wrapper's confirmation has been restored to its placeholder, and the repository has been synced and confirmed clean against what actually executed.

A curriculum import that is structurally complete and locally tested, but has never actually run against production, is not complete under this definition — it is ready for the execution steps above, and should be described that way.
