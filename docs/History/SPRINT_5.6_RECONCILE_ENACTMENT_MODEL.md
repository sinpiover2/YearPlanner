# Sprint 5.6 — Reconcile Enactment Model

Do not restate these instructions. Begin the work immediately after reading the required documents.

Follow:

- `docs/WORKFLOW/START_SPRINT.md`
- the Architecture Reconciliation Workflow in `docs/WORKFLOW/DEVELOPMENT_WORKFLOW.md`
- `docs/Architecture/ARCHITECTURE_DOCUMENT_STANDARDS.md`

## Task

Reconcile:

`docs/Architecture/ENACTMENT_MODEL.md`

with the current canonical architecture.

This is a documentation-only architecture change.

Do not modify application code, Apps Script, tests, data files, or unrelated documentation.

Do not commit or push.

## Read First

Read these documents completely before editing:

- `docs/Architecture/ARCHITECTURE_INDEX.md`
- `docs/Architecture/ARCHITECTURE_DOCUMENT_STANDARDS.md`
- `docs/Architecture/LESSON_PLANNER_INFORMATION_MODEL.md`
- `docs/Architecture/TEACHING_EPISODE_MODEL.md`
- `docs/Architecture/TEACHING_LIFECYCLE_DIAGRAM.md`
- `docs/Architecture/ENACTMENT_MODEL.md`

Read directly referenced architecture documents only when needed to verify terminology, ownership, lifecycle, or unresolved questions.

Treat the architecture documents—not the implementation—as canonical.

## Scope

Modify only:

`docs/Architecture/ENACTMENT_MODEL.md`

Do not modify:

- `INFORMATION_MODEL.md`
- `SUITE_ARCHITECTURE.md`
- `TODAY_ARCHITECTURE.md`
- `ARCHITECTURE_INDEX.md`
- any other architecture document

The stale suite-level claim that Today owns enacted curriculum will be reconciled separately. Do not add language saying that `ENACTMENT_MODEL.md` supersedes `INFORMATION_MODEL.md`.

## Required Corrections

### 1. Correct Episode Placement ownership

In the Layer 2 description, remove or correct any claim that Episode Placement owns:

- section
- planned date
- planned duration

Use the canonical ownership model:

```text
Teaching Episode
    owns planned duration

Lesson Session
    owns the section/date/session envelope

Episode Placement
    references one Teaching Episode
    owns its order within one Lesson Session
    may carry nullable carry-origin / lineage information
```

Preserve any other placement fields only when supported by the canonical documents.

### 2. Replace containment-style relationship diagrams

Remove or rewrite diagrams that visually imply:

- Lesson Session contains Teaching Episodes
- Episode Placement contains Teaching Episode
- Session Enactment is contained by Lesson Session
- Placement Enactment contains Episode Placement

Use explicit ownership and reference notation.

The authoritative chains should communicate:

```text
Lesson Session
    owns an ordered collection of Episode Placements

Episode Placement
    references one Teaching Episode

Session Enactment
    references one Lesson Session

Placement Enactment
    references one Episode Placement
    participates in or references one Session Enactment
```

Keep one authoritative relationship diagram. Remove or merge redundant alternative diagrams.

### 3. Remove duplicated behavior specifications

Trim independent re-descriptions of:

- bump
- carry-forward
- skip
- split
- merge
- section independence

Keep only the enactment-specific meaning needed by this document.

Cross-reference the relevant ratified decisions in `TEACHING_EPISODE_MODEL.md`, including as appropriate:

- EM-5
- EM-9
- EM-10
- EM-11
- EM-12

Do not create a second behavioral specification.

## Recommended Corrections

### 4. Add a deprecated terminology table

Add a concise `Deprecated — do not use` table consistent with sibling architecture documents.

Map stale suite-level terms to the current enacted model where the mapping is supported, including:

- Instructional Event
- Lesson Completion
- Instructional Notes
- Section-Specific Instructional Adjustment

Use canonical replacements such as:

- Session Enactment
- Placement Enactment
- Session Note
- Episode Note
- teacher-confirmed carry-forward

Do not imply that all old terms map one-to-one if they do not.

### 5. Correct the Teaching Episode examples

Rewrite the Layer 1 examples so that these are not presented as co-equal examples of a Teaching Episode:

- deliverables
- materials
- durable teaching notes

Clarify instead that a Teaching Episode may own or carry them.

### 6. Align lifecycle vocabulary

Where it improves clarity, adopt the shared lifecycle vocabulary:

- Expedition
- Put-In
- Rapids
- Campfire
- Assimilation
- Next Expedition

Do not force these labels into every section.

Use `Instructional Knowledge` for the durable knowledge accumulated through Episode Notes.

### 7. Cross-link related open questions

Add explicit cross-references:

- Q-EN-4 ↔ Q-EM-3
- Q-EN-8 ↔ Q-EM-4

For Q-EN-5, inspect EM-7 carefully.

Do not mark Q-EN-5 resolved unless the canonical text fully answers it. If residual ambiguity remains, clarify exactly what remains unresolved.

Do not resolve any open architectural question.

### 8. Reconsider document status

Review the current `Draft Architecture` label.

If the document is still draft because unresolved questions materially affect the model, keep the label.

If the core ownership and object model are ratified while only bounded questions remain open, update the status wording to reflect that accurately.

Do not claim finality beyond what the canonical documents support.

## Optional Hygiene

Perform these only if they are clearly safe and remain within the target file:

1. Repair visible character-encoding corruption such as garbled arrows or bullets.
2. Simplify implementation-shaped field lists into conceptual categories where appropriate.
3. Keep Q-EN-10 in place unless moving it is clearly required for document scope; do not create or edit an implementation-decisions document in this task.

## Preserve

Preserve these architectural principles:

- planning truth and enacted truth are separate
- Post-Class Debrief is the sole digital entry point for enacted truth
- Session Enactment and Placement Enactment are the canonical enacted records
- Session Note belongs to Session Enactment
- Episode Note belongs to Teaching Episode
- derived progress is reproducible from canonical enactment data
- carry-forward preserves both historical enacted truth and future planning truth
- Today may surface or navigate to enacted work but does not independently author enacted truth
- DailyProgress is migration-only and non-canonical
- unresolved questions remain unresolved

## Explicitly Do Not Do

Do not:

- add a statement that this document supersedes `INFORMATION_MODEL.md`
- reconcile the stale Today ownership claim in other documents
- update `ARCHITECTURE_INDEX.md`
- invent new architecture
- resolve Q-EN or Q-EM questions
- modify code
- commit
- push

## Validation

After editing:

1. Review the entire document for:
   - ownership
   - containment
   - references
   - derivation
   - lifecycle consistency
   - terminology consistency
   - duplicate specifications

2. Confirm:
   - Episode Placement no longer owns section, date, or planned duration.
   - There is one authoritative relationship diagram.
   - All relationship arrows distinguish ownership from references.
   - Behavior definitions defer to `TEACHING_EPISODE_MODEL.md`.
   - Session Note and Episode Note ownership remain correct.
   - Post-Class Debrief remains the sole digital entry point.
   - Open questions remain unresolved.
   - No claim was added that this document supersedes `INFORMATION_MODEL.md`.

3. Run:

```bash
git diff --check
```

4. Review:

```bash
git diff -- docs/Architecture/ENACTMENT_MODEL.md
```

5. Confirm no files other than the target were changed by this task.

## Completion Report

Report:

1. File modified.
2. Major architectural corrections.
3. How ownership and references are now represented.
4. Duplicate material removed or replaced by cross-references.
5. Terminology and lifecycle alignment changes.
6. Open-question cross-links added.
7. Whether the status label changed and why.
8. Result of `git diff --check`.
9. Confirmation no other files were modified by this task.
10. Confirmation nothing was committed or pushed.
