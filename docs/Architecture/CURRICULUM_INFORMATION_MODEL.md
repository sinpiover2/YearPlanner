# Curriculum Information Model — Instructional Items

**Document Status:** Canonical Architecture Standard
**Amends:** `INFORMATION_MODEL.md` (the `Lesson` entry within the Planned Curriculum domain), `UNITS_ARCHITECTURE.md` ("Lesson Sequence")
**Relates to:** `docs/Architecture/ARCHITECTURE_RECONCILIATION_SUMMARY.md`, `docs/Reference/SHEET_STRUCTURE.md`, `docs/Reference/API_REFERENCE.md`, `FORECAST_ARCHITECTURE.md`, `LESSON_SESSION.md`, `TEACHING_EPISODE_MODEL.md`
**Implementation history:** `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`
**Origin:** Established from the Amplify IM1 curriculum extraction (`Curriculm/M1/IM1_Curriculum_Extraction.md`), the Curriculum Completeness Review, and the Curriculum Information Model Review.

> This standard is self-contained and permanent. Publisher-specific implementations must conform to it without requiring knowledge of the work that established it.

---

## 1. Standard Status

**This document is the canonical standard for curriculum information in Year Planner.**

It defines the permanent boundary between publisher curriculum, teacher planning data, and enacted Lesson Sessions. The completeness or readiness of any particular publisher dataset is an implementation concern tracked in its implementation specification, not a condition on this standard's authority.

---

## 2. Problem Statement

Year Planner's implicit model, since its first curriculum data existed, has been:

```text
Unit → Lesson → Lesson Session
```

Every row in the `Lessons` sheet was assumed to be the same kind of thing: a traditional, single-session, content-bearing lesson.

Extracting Integrated Math 1 directly from Amplify's own PDFs — the first time this course's curriculum was verified against its actual publisher source rather than pasted or assumed text — showed this assumption does not hold.

**`Type` is publisher-neutral.** It stores the literal type supplied by the curriculum source; it is not an Amplify-specific enumeration. The following Amplify IM1 values are examples of the broader rule that a Unit may contain several kinds of Instructional Item sharing one sequence:

- **Meet & Greet** (Unit 1 only; no publisher type label at all)
- **Pre-Unit Check**
- **Explore**
- **Lesson**
- **Practice** / **Practice Day**
- **Mid-Unit Check** / **Sub-Unit Quiz**
- **Performance Task** / **Assessment**
- **Reflection** / **Unit Synthesis and Reflection**
- **Investigate** (no fixed sequence position at all)
- future publisher-defined types not yet seen

The two-name pairs above (e.g. "Practice" / "Practice Day") are not two different things — they are the same conceptual role recorded under two different literal labels, because this extraction's own methodology changed partway through (see `IM1_Curriculum_Extraction.md`, Extraction Notes #10, #17). **The literal publisher term and the conceptual role are deliberately kept distinct in this standard** — consumer logic should be able to reason about the role ("this is the unit's summative assessment") independent of which literal string a given publisher or unit used to say so.

The verified model is:

```text
Unit → Instructional Item → Lesson Session
```

A Lesson is one Instructional Item type among several. It is not the category itself.

---

## 3. Canonical Concepts

### Unit

A coherent publisher curriculum body with identity (`UnitID`, `UnitNumber`, `UnitTitle`), ordering (`SortOrder`), an explanatory purpose (`UnitPurpose`), and an overall teacher planning budget (`RequiredDays`, `OptionalDays`). Unchanged from `UNITS_ARCHITECTURE.md` and `INFORMATION_MODEL.md` — this standard does not revise Unit.

### Instructional Item

A publisher-defined curriculum element belonging to a Unit. It may be instructional, diagnostic, practice-oriented, assessment-oriented, or reflective in purpose; it may be required or optional; it may occupy a fixed position in the unit's sequence or, in the publisher's own design, no fixed position at all.

**A Lesson is one Instructional Item type — the one this system has, until now, treated as the only type.** Every other type carries the same structural shape (title, order or lack of it, a short outcome/summary) but a different pedagogical role.

### Lesson Session

A teacher-owned enactment of curriculum on one real section, one real date. Unchanged in ownership or authority from `LESSON_SESSION.md`: it remains "the teacher's complete plan for one class period," not a mirror of publisher structure.

A Lesson Session **may connect to** an Instructional Item — today, via the single `curriculumLessonId` reference implemented in `lessonSessionStorage.js`/`planningModel.js` — but the two are not the same entity, and the connection has never been, and does not become, mandatory or exclusive. A session may contain one or more teacher-authored episodes regardless of whether, or how, it references publisher content. The session remains the unit of actual teaching, printing, and classroom use — nothing here changes that.

---

## 4. Existing Storage Rule

**The `Lessons` sheet keeps its name.** Conformance to this standard does not require a table rename.

Architecturally, its records should be understood as the **Instructional Items store** — the physical name is a historical artifact of when Lesson was believed to be the only kind of row; the conceptual model has moved past that without requiring the storage layer to move with it immediately.

**Benefit:** every existing reader of `Lessons` (`api.js`, `planningModel.js`, `forecastModel.js`, `lessonPrintPayload.js`, the Apps Script `addLesson`/`updateLesson`/`deleteLesson`/`reorderLessons` actions) keeps working unmodified. **Tradeoff:** the physical name will continue to under-describe what the table actually holds for as long as this rule stands. That mismatch is accepted deliberately, not overlooked — renaming the sheet is listed under Out of Scope (§14), not ruled out permanently.

---

## 5. Type Rule

**Instructional Item `Type` is a first-class, publisher-neutral field.** It preserves source terminology for curricula from Amplify or any other publisher.

Architectural intent:

- **Preserve the publisher's literal type value.** Do not normalize source terminology during import — "Sub-Unit Quiz" is recorded as "Sub-Unit Quiz," not silently rewritten to a house term, even where a conceptual role (§2) is also inferable.
- **Existing rows remain backward compatible** by defaulting to `Lesson` where type is absent — every row imported or authored before this rule existed is a Lesson, and stays one without any migration step.
- **Consumers must handle unknown future types safely.** A type this standard has never seen must not crash Forecast, Planning, or Print — at minimum it must degrade to being treated as an ordinary Lesson-like row rather than being rejected or corrupting a computation.

The canonical field name is `Type`. This name describes the system concept; its stored values remain literal publisher terminology.

---

## 6. Ordering Rule

Most Instructional Items have fixed order — a `SortOrder`/`LessonNumber` position within their Unit, exactly as today.

**Some publisher items intentionally have no fixed sequence position.** Amplify's own "Investigate" items (seen in two of seven extracted units) are explicitly described in the source as usable "anytime in this course after [a given lesson]" — not merely unscheduled, but designed to be schedule-independent.

**The model must support unordered or flexible-placement items without inventing a false `SortOrder`.** Assigning such an item a fabricated position would misrepresent the publisher's own design and would corrupt any consumer that treats `SortOrder` as a literal teaching sequence (Forecast's "current lesson" walk, Planning's shelf).

Fixed-sequence consumers (Forecast's pacing walk, Planning's lesson shelf) must **explicitly exclude or separately present** items with no fixed order, rather than silently sorting them into a position nobody assigned. This standard does not prescribe the presentation — only that silent, invented placement is the one outcome ruled out.

---

## 7. Optionality Rule

Three distinct meanings of "optional" exist in this system today, and must not be conflated:

1. **Unit-level `OptionalDays`** — a quantity: teacher pacing/schedule capacity built into a Unit's timeline (buffer days), consumed by Forecast's buffer math.
2. **Item-level optionality** — a boolean: whether a specific publisher Instructional Item may be skipped without consequence (e.g. an optional Explore or Pre-Unit Check). **The existing `IsOptional` field on `Lessons` represents this meaning.**
3. **Internal activity choice** — an item may itself be required while its own interior offers optional sub-activities (e.g. "Unit Synthesis and Reflection," which is always present but internally offers six activities of which the teacher selects one or two). This third meaning is not currently represented anywhere in the schema, and this standard does not introduce a representation for it — it is named here only so it is not mistaken for meaning 2.

These three do not currently collide in code, but nothing prevents future confusion between them without this standard naming them separately.

---

## 8. Publisher Data vs. Teacher Planning Data

A firm boundary, restated because the extraction work made its absence costly (the original, non-PDF Unit 1/2 data blurred it — see `IM1_Curriculum_Extraction.md`, Extraction Notes #14, #17):

**Publisher-owned** (recorded only where the source actually states it):
- Unit identity and title
- Unit purpose
- Instructional Item title
- Publisher type (literal terminology)
- Publisher sequence position, or an explicit flexible-placement rule
- Summary or outcome text
- Item-level optionality

**Teacher-owned:**
- `RequiredDays`, `OptionalDays`
- Per-item `PlannedDays`
- Teacher Notes
- Planning adjustments
- Actual Lesson Sessions and their episode structure
- Progress and enactment history

Publisher material may, in principle, include its own pacing guidance somewhere in its documents. Where it does not — as is the case for per-item day costs throughout this extraction — **Year Planner must not invent the missing value and record it as if the publisher had stated it.** A gap stays a gap until a teacher fills it.

---

## 9. PlannedDays Rule

`PlannedDays` is **teacher planning metadata, not publisher curriculum data.**

It is not reliably available from the Amplify source PDFs — confirmed absent, unit by unit, throughout `IM1_Curriculum_Extraction.md`. No unit in the extraction has it; this is not a gap in extraction effort, it is an absence in what Amplify publishes at this granularity.

**Source ingestion must not represent an inferred value as publisher-authored truth.** `PlannedDays` remains unresolved by default. Any initialization requires explicit teacher approval and must remain distinguishable from the publisher import itself. This standard does not select a final allocation algorithm.

---

## 10. Forecast Implications

`forecastModel.js` currently depends on, unconditionally:
- Unit `RequiredDays`
- Unit `OptionalDays`
- Instructional Item (`Lessons`-row) `PlannedDays`
- `DailyProgress` completion data

Every one of these is read through `Number(x || 0)` — a missing or unverified value is silently coerced to zero rather than surfaced as unknown. Concretely: a Unit imported without a confirmed day count does not error or warn; it contributes **zero** to the course's total timeline, which understates every other unit's percent-complete and buffer math course-wide. The same coercion applies to per-item `PlannedDays`, which — per §9 — is currently absent for every extracted unit; Forecast's variance calculation (`actualDays − plannedDaysCompleted`) is therefore currently meaningless for any of this extraction's content, not merely incomplete.

**Architectural expectation:** unknown planning values must not silently masquerade as real zero-day values. Consumers must expose incomplete inputs or decline to calculate from them; continuity arithmetic may not present an inferred zero as confirmed teacher planning data.

---

## 11. Planning Implications

`planningModel.js` currently presents every `Lessons` row for a Unit as a single ordered shelf, with no type filtering — because no type currently exists to filter on.

Future consumption must become **type-aware and order-aware**. Examples, not a prescription:
- fixed Instructional Items continue to appear in sequence, as Lessons do today;
- optional items may be visually distinguished once §7's item-level `IsOptional` is actually read by this code path (it exists in the schema and is unused today);
- flexible-placement items (§6) require a separate presentation or insertion mechanism rather than a shelf position;
- unknown types must degrade safely (§5) rather than breaking the shelf.

This standard does not prescribe a full interface redesign — only that the single-ordered-shelf assumption no longer matches what a Unit can contain.

---

## 12. Lesson Session Boundary

Lesson Sessions remain teacher-owned, exactly as `LESSON_SESSION.md` establishes. Nothing in this standard changes that ownership, and nothing in this standard should be read as forcing a one-to-one relationship between one Instructional Item, one date, and one session.

`TEACHING_EPISODE_MODEL.md` describes a future architecture — Teaching Episodes, Episode Placements, Placement Enactments, split/merge, carry-forward — under which a teacher could split an item across sessions, combine multiple items into one session, skip an optional item, revisit an item, or teach supporting episodes the publisher curriculum never defined. **That document is documented future architecture, not current behavior.** As actually implemented today, a Lesson Session is a flat array of episodes in `localStorage`, keyed by section and date, with at most one optional `curriculumLessonId` reference used solely for print/Weekly-Communication citation. Today's implementation already permits multiple episodes per session and does not require a session to reference any curriculum row at all — but the richer behaviors described in `TEACHING_EPISODE_MODEL.md` (carry-forward, split, merge, reuse across sections) are not built, and this standard does not claim otherwise.

---

## 13. Model Requirements

**Required model capabilities:**
- First-class Instructional Item Type (§5)
- Truthful support for both fixed and flexible placement (§6)
- Explicit treatment of unknown planning-day values, replacing silent zero-coercion (§10)

**Recommended but separable** (improves the model, not a blocker):
- Activate item-level optionality (`IsOptional`) in actual Planning and Forecast behavior — the field already exists and is already populated by the extraction; only the consuming code is missing
- Improve naming clarity between "Lessons" (the sheet) and "Instructional Items" (the concept) where it aids future contributors, without renaming the sheet itself
- Visually distinguish item types once Type exists

**Future model extensions:**
- Dedicated modeling for orientation-style content with no publisher type at all (e.g. "Meet & Greet") — Year Planner's existing teacher-authored `U0` unit pattern already covers this need in practice
- Richer placement rules beyond "fixed" and "flexible"
- The fuller Teaching Episode architecture in `TEACHING_EPISODE_MODEL.md`
- A publisher-specific normalization layer, if a future curriculum's terminology turns out to need one

---

## 14. Out of Scope

This standard explicitly does not decide:
- Exact schema migration steps
- Exact `PlannedDays` allocation rule
- Final Planning UI behavior by item type
- Whether the `Lessons` sheet will ever be renamed
- The full Teaching Episode architecture (owned by `TEACHING_EPISODE_MODEL.md` and `ENACTMENT_MODEL.md`, unamended by this standard)
- Production import timing

---

## 15. Consequences

**Benefits:**
- Faithful representation of real publisher curricula, verified against source rather than assumed
- Backward-compatible evolution — existing rows and existing consumers keep working under a `Lesson` default
- Clearer separation of publisher truth from teacher planning data
- Publisher-specific implementations can proceed without schema guesswork
- Future curricula (other Amplify courses, other publishers) can introduce new item types safely, without another architectural review

**Tradeoffs:**
- The physical sheet name (`Lessons`) remains less precise than the conceptual model (Instructional Items) for as long as §4 stands
- Every consumer of curriculum data must become type-aware, not just importer code
- Flexible-placement items require handling that fixed-sequence-only code does not currently have
- Forecast cannot be trusted against any imported unit until teacher planning values (§9, §10) are supplied

**Risks:**
- Treating missing day values as real zeros (§10) — the single highest-severity risk identified, because it fails silently
- Normalizing publisher terminology too early, before a stable house vocabulary is actually needed (§2, §5)
- Forcing unordered items into false sequence positions (§6)
- Mistaking `TEACHING_EPISODE_MODEL.md`'s aspirational architecture for what is currently implemented (§12) — this standard deliberately keeps the two apart

---

## 16. Implementation Constraints

- Implementations must preserve unknown planning values rather than silently converting them to zero or inventing publisher data. Any design that coerces an unconfirmed day count or absent `PlannedDays` into a real number without identifying it as inferred violates §8, §9, and §10.
- Publisher-specific import readiness, production prerequisites, rollout history, and validation results belong in the applicable implementation specification. For Amplify IM1, see `docs/Development/AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md`.
- Conformance to this standard does not itself authorize a production import or a production-data change.
