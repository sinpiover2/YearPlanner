# Curriculum Information Model — Instructional Items

**Document Status:** Foundational Architecture · Decision Record
**Amends:** `INFORMATION_MODEL.md` (the `Lesson` entry within the Planned Curriculum domain), `UNITS_ARCHITECTURE.md` ("Lesson Sequence")
**Relates to:** `docs/Reference/SHEET_STRUCTURE.md`, `docs/Reference/API_REFERENCE.md`, `FORECAST_ARCHITECTURE.md`, `LESSON_SESSION.md`, `TEACHING_EPISODE_MODEL.md`
**Established by:** Sprint 6.1 — Amplify IM1 curriculum extraction (`Curriculm/M1/IM1_Curriculum_Extraction.md`), the Curriculum Completeness Review, and the Curriculum Information Model Review.

> This record is self-contained. It assumes no knowledge of the sprint that produced it.

---

## 1. Decision Status

**The curriculum information model described here is stable enough to begin importer design.**

This is not a claim that curriculum data is complete. Required/Optional Days are confirmed for one of seven extracted units; per-item planned days are confirmed absent from the publisher source for all seven. Forecast cannot be trusted against imported data until that gap closes. Design and data-readiness are separate questions — this record settles the first, not the second.

---

## 2. Problem Statement

Year Planner's implicit model, since its first curriculum data existed, has been:

```text
Unit → Lesson → Lesson Session
```

Every row in the `Lessons` sheet was assumed to be the same kind of thing: a traditional, single-session, content-bearing lesson.

Extracting Integrated Math 1 directly from Amplify's own PDFs — the first time this course's curriculum was verified against its actual publisher source rather than pasted or assumed text — showed this assumption does not hold. A single Amplify unit contains, by publisher design, several different kinds of element sharing one sequence:

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

The two-name pairs above (e.g. "Practice" / "Practice Day") are not two different things — they are the same conceptual role recorded under two different literal labels, because this extraction's own methodology changed partway through (see `IM1_Curriculum_Extraction.md`, Extraction Notes #10, #17). **The literal publisher term and the conceptual role are deliberately kept distinct in this record** — importer logic should be able to reason about the role ("this is the unit's summative assessment") independent of which literal string a given publisher or unit used to say so.

The verified model is:

```text
Unit → Instructional Item → Lesson Session
```

A Lesson is one Instructional Item type among several. It is not the category itself.

---

## 3. Canonical Concepts

### Unit

A coherent publisher curriculum body with identity (`UnitID`, `UnitNumber`, `UnitTitle`), ordering (`SortOrder`), an explanatory purpose (`UnitPurpose`), and an overall teacher planning budget (`RequiredDays`, `OptionalDays`). Unchanged from `UNITS_ARCHITECTURE.md` and `INFORMATION_MODEL.md` — this record does not revise Unit.

### Instructional Item

A publisher-defined curriculum element belonging to a Unit. It may be instructional, diagnostic, practice-oriented, assessment-oriented, or reflective in purpose; it may be required or optional; it may occupy a fixed position in the unit's sequence or, in the publisher's own design, no fixed position at all.

**A Lesson is one Instructional Item type — the one this system has, until now, treated as the only type.** Every other type carries the same structural shape (title, order or lack of it, a short outcome/summary) but a different pedagogical role.

### Lesson Session

A teacher-owned enactment of curriculum on one real section, one real date. Unchanged in ownership or authority from `LESSON_SESSION.md`: it remains "the teacher's complete plan for one class period," not a mirror of publisher structure.

A Lesson Session **may connect to** an Instructional Item — today, via the single `curriculumLessonId` reference implemented in `lessonSessionStorage.js`/`planningModel.js` — but the two are not the same entity, and the connection has never been, and does not become, mandatory or exclusive. A session may contain one or more teacher-authored episodes regardless of whether, or how, it references publisher content. The session remains the unit of actual teaching, printing, and classroom use — nothing here changes that.

---

## 4. Existing Storage Decision

**The `Lessons` sheet keeps its name.** No table rename is required for the initial importer.

Architecturally, its records should be understood as the **Instructional Items store** — the physical name is a historical artifact of when Lesson was believed to be the only kind of row; the conceptual model has moved past that without requiring the storage layer to move with it immediately.

**Benefit:** every existing reader of `Lessons` (`api.js`, `planningModel.js`, `forecastModel.js`, `lessonPrintPayload.js`, the Apps Script `addLesson`/`updateLesson`/`deleteLesson`/`reorderLessons` actions) keeps working unmodified. **Tradeoff:** the physical name will continue to under-describe what the table actually holds, for as long as this decision stands. That mismatch is accepted deliberately, not overlooked — renaming the sheet is listed under Non-Decisions (§14), not ruled out permanently.

---

## 5. Type Decision

**Instructional Item Type must become a first-class field.** This is the one structural gap every other finding in this record traces back to.

Architectural intent:

- **Preserve the publisher's literal type value.** Do not normalize source terminology during import — "Sub-Unit Quiz" is recorded as "Sub-Unit Quiz," not silently rewritten to a house term, even where a conceptual role (§2) is also inferable.
- **Existing rows remain backward compatible** by defaulting to `Lesson` where type is absent — every row imported or authored before this decision existed is a Lesson, and stays one without any migration step.
- **Consumers must handle unknown future types safely.** A type this record has never seen must not crash Forecast, Planning, or Print — at minimum it must degrade to being treated as an ordinary Lesson-like row rather than being rejected or corrupting a computation.

This record does **not** decide the field's column name. If a name is needed for discussion, `Type` is the natural candidate given it's already the column header used throughout `IM1_Curriculum_Extraction.md` — but that is an implementation recommendation, not this architectural decision, and remains open per §14.

---

## 6. Ordering Decision

Most Instructional Items have fixed order — a `SortOrder`/`LessonNumber` position within their Unit, exactly as today.

**Some publisher items intentionally have no fixed sequence position.** Amplify's own "Investigate" items (seen in two of seven extracted units) are explicitly described in the source as usable "anytime in this course after [a given lesson]" — not merely unscheduled, but designed to be schedule-independent.

**The model must support unordered or flexible-placement items without inventing a false `SortOrder`.** Assigning such an item a fabricated position would misrepresent the publisher's own design and would corrupt any consumer that treats `SortOrder` as a literal teaching sequence (Forecast's "current lesson" walk, Planning's shelf).

Fixed-sequence consumers (Forecast's pacing walk, Planning's lesson shelf) must **explicitly exclude or separately present** items with no fixed order, rather than silently sorting them into a position nobody assigned. This record does not prescribe the presentation — only that silent, invented placement is the one outcome ruled out.

---

## 7. Optionality Decision

Three distinct meanings of "optional" exist in this system today, and must not be conflated:

1. **Unit-level `OptionalDays`** — a quantity: teacher pacing/schedule capacity built into a Unit's timeline (buffer days), consumed by Forecast's buffer math.
2. **Item-level optionality** — a boolean: whether a specific publisher Instructional Item may be skipped without consequence (e.g. an optional Explore or Pre-Unit Check). **The existing `IsOptional` field on `Lessons` represents this meaning.**
3. **Internal activity choice** — an item may itself be required while its own interior offers optional sub-activities (e.g. "Unit Synthesis and Reflection," which is always present but internally offers six activities of which the teacher selects one or two). This third meaning is not currently represented anywhere in the schema, and this record does not introduce a representation for it — it is named here only so it is not mistaken for meaning 2.

These three do not currently collide in code, but nothing prevents future confusion between them without this record naming them separately.

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

## 9. PlannedDays Decision

`PlannedDays` is **teacher planning metadata, not publisher curriculum data.**

It is not reliably available from the Amplify source PDFs — confirmed absent, unit by unit, throughout `IM1_Curriculum_Extraction.md`. No unit in the extraction has it; this is not a gap in extraction effort, it is an absence in what Amplify publishes at this granularity.

**The importer must not represent an inferred value as publisher-authored truth.** Depending on later product decisions, importer design may:
- leave `PlannedDays` unresolved pending teacher input,
- provide an explicit, teacher-approved default (e.g. an even split of a Unit's `RequiredDays` across its Lesson-type items),
- or introduce a separate initialization step distinct from import itself.

This record does not select among those options — no confirmed product decision exists yet for the final allocation algorithm, and choosing one is out of scope here.

---

## 10. Forecast Implications

`forecastModel.js` currently depends on, unconditionally:
- Unit `RequiredDays`
- Unit `OptionalDays`
- Instructional Item (`Lessons`-row) `PlannedDays`
- `DailyProgress` completion data

Every one of these is read through `Number(x || 0)` — a missing or unverified value is silently coerced to zero rather than surfaced as unknown. Concretely: a Unit imported without a confirmed day count does not error or warn; it contributes **zero** to the course's total timeline, which understates every other unit's percent-complete and buffer math course-wide. The same coercion applies to per-item `PlannedDays`, which — per §9 — is currently absent for every extracted unit; Forecast's variance calculation (`actualDays − plannedDaysCompleted`) is therefore currently meaningless for any of this extraction's content, not merely incomplete.

**Architectural expectation:** unknown planning values must not silently masquerade as real zero-day values. This record does not implement a fix — only records that the current `|| 0` behavior is a known, load-bearing risk that must be addressed (by validation, by refusing to forecast a unit with unconfirmed totals, or by another mechanism) before Forecast is turned on for imported content.

---

## 11. Planning Implications

`planningModel.js` currently presents every `Lessons` row for a Unit as a single ordered shelf, with no type filtering — because no type currently exists to filter on.

Future consumption must become **type-aware and order-aware**. Examples, not a prescription:
- fixed Instructional Items continue to appear in sequence, as Lessons do today;
- optional items may be visually distinguished once §7's item-level `IsOptional` is actually read by this code path (it exists in the schema and is unused today);
- flexible-placement items (§6) require a separate presentation or insertion mechanism rather than a shelf position;
- unknown types must degrade safely (§5) rather than breaking the shelf.

This record does not prescribe a full interface redesign — only that the single-ordered-shelf assumption no longer matches what a Unit can contain.

---

## 12. Lesson Session Boundary

Lesson Sessions remain teacher-owned, exactly as `LESSON_SESSION.md` establishes. Nothing in this record changes that ownership, and nothing in this record should be read as forcing a one-to-one relationship between one Instructional Item, one date, and one session.

`TEACHING_EPISODE_MODEL.md` describes a future architecture — Teaching Episodes, Episode Placements, Placement Enactments, split/merge, carry-forward — under which a teacher could split an item across sessions, combine multiple items into one session, skip an optional item, revisit an item, or teach supporting episodes the publisher curriculum never defined. **That document is documented future architecture, not current behavior.** As actually implemented today, a Lesson Session is a flat array of episodes in `localStorage`, keyed by section and date, with at most one optional `curriculumLessonId` reference used solely for print/Weekly-Communication citation. Today's implementation already permits multiple episodes per session and does not require a session to reference any curriculum row at all — but the richer behaviors described in `TEACHING_EPISODE_MODEL.md` (carry-forward, split, merge, reuse across sections) are not built, and this record does not claim otherwise.

---

## 13. Minimum Required Evolution

**Essential** (required before importer implementation):
- First-class Instructional Item Type (§5)
- Truthful support for both fixed and flexible placement (§6)
- Explicit treatment of unknown planning-day values, replacing silent zero-coercion (§10)

**Recommended but separable** (improves the model, not a blocker):
- Activate item-level optionality (`IsOptional`) in actual Planning and Forecast behavior — the field already exists and is already populated by the extraction; only the consuming code is missing
- Improve naming clarity between "Lessons" (the sheet) and "Instructional Items" (the concept) where it aids future contributors, without renaming the sheet itself
- Visually distinguish item types once Type exists

**Future** (not needed for initial curriculum import):
- Dedicated modeling for orientation-style content with no publisher type at all (e.g. "Meet & Greet") — Year Planner's existing teacher-authored `U0` unit pattern already covers this need in practice
- Richer placement rules beyond "fixed" and "flexible"
- The fuller Teaching Episode architecture in `TEACHING_EPISODE_MODEL.md`
- A publisher-specific normalization layer, if a future curriculum's terminology turns out to need one

---

## 14. Non-Decisions

This record explicitly does not decide:
- Exact importer implementation
- Exact schema migration steps
- Exact `PlannedDays` allocation rule
- Final Planning UI behavior by item type
- Whether the `Lessons` sheet will ever be renamed
- The full Teaching Episode architecture (owned by `TEACHING_EPISODE_MODEL.md` and `ENACTMENT_MODEL.md`, unamended by this record)
- Production import timing

---

## 15. Consequences

**Benefits:**
- Faithful representation of real publisher curricula, verified against source rather than assumed
- Backward-compatible evolution — existing rows and existing consumers keep working under a `Lesson` default
- Clearer separation of publisher truth from teacher planning data
- Importer design can proceed without schema guesswork
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
- Mistaking `TEACHING_EPISODE_MODEL.md`'s aspirational architecture for what is currently implemented (§12) — this record deliberately keeps the two apart

---

## 16. Import-Readiness Decision

- **The information model is stable enough to begin importer specification and design.**
- **A trusted production import remains blocked by unresolved teacher planning data** — specifically, confirmed Unit day budgets for six of seven extracted units, and per-item `PlannedDays` for all seven.
- **Importer design must preserve unknown values rather than silently converting them to zero or inventing source data.** Any design that coerces an unconfirmed day count or an absent `PlannedDays` into a real number without flagging it as inferred violates §8, §9, and §10 of this record.

---

## 17. Sprint 1 Implementation Note (Addendum, append-only)

The five decisions this record left open in `AMPLIFY_IM1_IMPORT_IMPLEMENTATION_SPEC.md` §14 have been approved:

- **D-1:** Optional instructional items do not block Forecast progression.
- **D-2:** Teacher planning-day entry lives in the Units workspace.
- **D-3:** Instructional Item Type will be shown subtly in Units and Planning — not initially in Forecast or print. (Not yet implemented; see below.)
- **D-4:** Curriculum import will use a staged intermediate artifact, followed by preview, guarded execution, and verification.
- **D-5:** `PlannedDays` remains unknown by default. Any initialization requires explicit teacher approval — never a silent system default.

**Implementation Sprint 1 is complete**, scoped narrowly to the backward-compatible schema contract and read compatibility this record's §5, §6, and §13 (Essential) called for — no importer, no production data, no user-visible behavior change:

- `Type` is now supported end-to-end as a backward-compatible concept: `getItemType()` (`plannerUtils.js`) defaults blank/missing to `Lesson`; `addLesson` (`apps-script-planning/Code.js`) writes a `Type` value for new rows, inert until a `Type` column physically exists on the sheet.
- `PlacementRule` support (`getPlacementRule()`, `hasFixedPlacement()`) was added to `plannerUtils.js`, unused by any consumer yet — ready for Sprint 2 to wire into Forecast's and Planning's sequence-walking logic (§6).
- The `LessonNumber`/`SortOrder` conflation described in this record's §2 was corrected in `apps-script-planning/Code.js`: `deleteLesson` and `reorderLessons` now renumber only `SortOrder`; `LessonNumber` is preserved as stable publisher identity.
- A `parseKnownNumber()` helper was added to distinguish a genuinely unknown planning value from a real zero (§10), with `TODO(Sprint 2)` markers left at every current silent-zero call site in `forecastModel.js`/`plannerUtils.js` — none of that arithmetic was changed yet.

This addendum does not amend any numbered section above — it records that the open decisions have been closed and that the first, narrowest slice of Essential work (§13) has shipped. The remaining Essential and all Recommended/Future work in §13 remains open.

---

## 18. Sprint 2 Implementation Note (Addendum, append-only)

**Implementation Sprint 2 is complete** — the Essential work from §13 that Sprint 1 left open is now shipped, plus the D-3 Recommended item (Type display), all conditional on data that doesn't exist in current classroom rows yet:

- `getSequencedItems()` (`plannerUtils.js`) is now the one path both Forecast (`forecastModel.js`) and Planning (`planningModel.js`) use to walk curriculum in order — flexible-placement items are excluded from the computed fixed sequence before sorting, never given a fabricated `SortOrder`, satisfying §6 in full. No alternate interface for flexible items exists yet in either consumer — a flexible item is excluded, not given anywhere else to appear.
- Forecast's current-item selection now honors D-1: an unfinished item that `isOptionalItem()` reports as optional no longer blocks progression.
- **§10's silent-zero risk is addressed by making the fallback detectable, not by removing the fallback.** Every remaining `Number(x || 0)` site flagged in Sprint 1 now reads through `parseKnownNumber()` first, so an unknown value is recognized as unknown before anything else happens with it. Forecast returns an explicit `dataComplete` flag from that detection, surfaced in the UI as a short factual note when `false`. The arithmetic that actually produces the totals still falls back to `0` for an unknown value (`parseKnownNumber(x) ?? 0`) — the same continuity fallback as before — so the numbers themselves are unchanged; what changed is that a consumer can now tell when a number rests on that fallback. **Forecast's arithmetic has not been redesigned to propagate `null` through its calculations**; that remains open.
- Type is now visible, subtly, in Units (`LessonTable.jsx`) and in the one Planning surface that's actually rendered today — the curriculum citation label in `SessionTile.jsx`, built by `planningModel.js`'s `getCurriculumLessonLabel()` — D-3, implemented for that surface. The Planning "shelf" `getPlanningModel()` also computes (now Type-aware too) is **not currently rendered by any component** — confirmed by inspection, so that half of the change is inert data, not a second visible surface, until some future sprint renders it. Not yet visible in Forecast or print, per D-3's own scope.

None of this is visible for any row in current production data — no Math 8 or IM1 lesson currently has a non-default `Type`, an `IsOptional` flag, or an unconfirmed day budget, so every new conditional stays dormant until Sprint 3's import actually introduces rows that trigger it. This was verified against a non-production fixture set covering all nine Amplify item types plus legacy, unknown-type, and incomplete-data cases (19 checks, all passing) — not against production data, and not by a live browser session (this environment's only installed browser is an outdated Chrome 83 beta that cannot parse this app's modern JS; a genuine environment limitation, not a defect in the change).

The remaining Essential item from §13 — the importer itself — propagating nullable values through Forecast's arithmetic end-to-end, and all Recommended/Future items not covered above remain open for Sprint 3.
