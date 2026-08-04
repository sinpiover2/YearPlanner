# Amplify Math 8 importer core

This repository contains a deterministic schema-`2.0.0` Apps Script payload and a guarded, locally simulated importer core for the `amplify-m8` profile. It has no armed live spreadsheet entry point: preview, execute, editor-wrapper, and verification entry points explicitly throw `DISARMED`.

## Files

- `AmplifyM8ImportData.js` is generated from `data/import-staging/amplify-m8.json`; never hand-edit it.
- `AmplifyM8Importer.js` contains pure planning/verification logic plus the dependency-injected local execution sequence.
- `scripts/import-staging/amplify-m8-importer.test.mjs` runs only against in-memory spreadsheet and lock fakes.

Regenerate and verify the payload with:

```bash
node scripts/import-staging/generate-amplify-m8-apps-script-payload.mjs
node scripts/import-staging/generate-amplify-m8-apps-script-payload.mjs --check
```

## Enforced behavior

- Requires exactly one existing `Courses` row whose `CourseID` is exactly `M8` in the injected destination context. Other IDs, including `MATH8`, do not satisfy this identity requirement.
- The canonical `Courses` schema is `CourseID, CourseName, ShortName, Active, SortOrder`. The importer requires and projects only the exact `CourseID` header from `Courses`; it does not require, compare, or modify `CourseName` or `ShortName`, and display wording such as the artifact label `Math 8` does not gate identity.
- The future preview is still behind the unconditional `DISARMED` wrappers. Its dependency-injected core reads only `Courses`, `Units`, and `Lessons`, validates required headers before classification, and projects only the fields needed for identity, collision, protection, ownership, and plan classification.
- Preview performs no lock, backup, version, deployment, or spreadsheet mutation and always reports `writesOccurred: false`. Local tests—not live authorization—are the only supported way to invoke this core today.
- Matches only exact `AMP-M8-*` IDs; legacy `M8-U*` rows are outside the plan and are never written.
- Creates serialize supported nulls as blank cells. Updates contain only asserted, changed publisher fields; null and unresolved source fields never clear cells.
- `PlannedDays`, `TeacherNotes`, and `PrimaryLink` are teacher-owned. Any publisher difference on a row where any of them is populated blocks the import.
- Duplicate IDs, incompatible ID collisions, and placement changes requiring a structural clear block the import.
- Fixed items retain numeric `SortOrder` and no asserted placement rule; flexible items retain their exact placement rule and no fixed `SortOrder`.
- A full backup precedes writes; a lock, second planning pass, narrow field writes, and post-write verification guard the local simulation.

The generated metadata binds the payload to its exact artifact SHA-256, schema, profile, extraction hash, counts, and confirmation phrase. The phrase is `IMPORT_AMPLIFY_M8_<first 12 artifact-hash characters>_<unit count>_<item count>`.

No deployment or spreadsheet access is part of this implementation.
