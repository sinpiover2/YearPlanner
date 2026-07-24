# Sprint 5.6 — Architecture Reconciliation Analysis

**Target Document:** `docs/Architecture/ENACTMENT_MODEL.md`
**Type:** Analysis only — no architecture edits were made as part of this report.

---

## 1. Overall Assessment

`ENACTMENT_MODEL.md` is a strong, well-organized document. It correctly establishes the three-layer model (Teaching Episode / Episode Placement / Placement Enactment), the two canonical enactment records (Session Enactment, Placement Enactment), the single-entry-point principle (Post-Class Debrief), and the non-negotiable separation of planning truth from enacted truth. Its ownership table, invariants, and Version 1 boundary are genuinely useful and largely consistent with `TEACHING_EPISODE_MODEL.md` and `LESSON_PLANNER_INFORMATION_MODEL.md`.

However, it has not fully kept pace with the sibling documents that were reconciled more recently (`TEACHING_EPISODE_MODEL.md`, `LESSON_PLANNER_INFORMATION_MODEL.md`, and especially the just-reconciled `TEACHING_LIFECYCLE_DIAGRAM.md`). Three classes of drift stand out:

- It still uses containment-style diagrams in one place where the rest of the family has moved to explicit reference-only notation.
- It attributes a few fields to the wrong layer relative to `TEACHING_EPISODE_MODEL.md`'s ratified decisions (EM-3, EM-14).
- It does not acknowledge — and none of the sibling documents acknowledge — that this whole document family has quietly inverted `INFORMATION_MODEL.md`/`SUITE_ARCHITECTURE.md`'s claim that **Today** is the canonical owner of the Enacted Curriculum.

None of this is severe, and much of it is the normal residue of an amendment-driven ("append-only") documentation style. But it means the document is not yet fully internally reconciled with its own family, and the family as a whole has an unacknowledged conflict with the suite-level Information Model.

---

## 2. Architectural Inconsistencies

### 2.1 Today's ownership of "Enacted Curriculum" contradicts this document's Ownership section (highest priority)

`INFORMATION_MODEL.md` (Domain 2) states: *"The Today subsystem is the canonical owner of the Enacted Curriculum,"* and lists Instructional Event, Lesson Completion, Instructional Notes, and Section-Specific Instructional Adjustment as Today-owned, Today-authored. `SUITE_ARCHITECTURE.md` and `UNITS_ARCHITECTURE.md` restate this identically ("Today... owns: instructional events, lesson completion, partial completion, instructional notes, section-specific instructional adjustments").

`ENACTMENT_MODEL.md`'s own "Ownership" section says the opposite: *"Today may surface the current lesson and provide an entry point into the Post-Class Debrief. Today does not independently record enacted instruction. It reads the same enacted record as every other workspace."* This matches `LESSON_PLANNER_INFORMATION_MODEL.md`, `TEACHING_EPISODE_MODEL.md`, and `TEACHING_LIFECYCLE_DIAGRAM.md` — Lesson Planner, not Today, is the sole author of enacted truth.

This is a real, unresolved conflict between two canonical documents (`INFORMATION_MODEL.md`/`SUITE_ARCHITECTURE.md` vs. the Lesson Planner/Enactment family), not something introduced by this reconciliation — but `ENACTMENT_MODEL.md` is the document that most explicitly asserts the newer position, and it does so without acknowledging that it contradicts `INFORMATION_MODEL.md` Domain 2. `TODAY_ARCHITECTURE.md` (the concrete Today spec) already agrees with `ENACTMENT_MODEL.md` — Today there is a navigation/status hub, not a recorder — so the drift is isolated to `INFORMATION_MODEL.md`/`SUITE_ARCHITECTURE.md` having gone stale relative to three other canonical documents.

**Canonical source for the correct model:** `ENACTMENT_MODEL.md` "Canonical Entry Point" + `TEACHING_LIFECYCLE_DIAGRAM.md` "Architectural Invariant."

### 2.2 Episode Placement is credited with fields it does not own

In "Layer 2 — Episode Placement," `ENACTMENT_MODEL.md` lists these as "examples of placement information": *lesson session, section, planned order, planned duration, planned date, source placement, carry-forward relationship.*

Per `TEACHING_EPISODE_MODEL.md` (EM-3, ratified), Episode Placement owns only: a reference to one Teaching Episode, an order index, and a nullable carry-origin. Per EM-14, **duration is authored on the Teaching Episode**, not the placement. Per EM-2/LESSON_SESSION.md, **section and date belong to the Lesson Session envelope**, not the placement. So "planned duration," "planned date," and "section" are misattributed to Layer 2 here.

**Canonical source:** `TEACHING_EPISODE_MODEL.md` EM-3, EM-14.

### 2.3 "Data Relationships" diagrams use containment notation the family has deprecated

```text
Lesson Session
        │
        ├── Episode Placement
        │       └── Teaching Episode
        │
        ├── Session Enactment
                ├── Session Note
                └── Placement Enactment
                        ├── Episode Placement
                        ...
```

This tree notation visually depicts Lesson Session *containing* Episode Placement *containing* Teaching Episode, and Placement Enactment *containing* Episode Placement. `TEACHING_EPISODE_MODEL.md` EM-2 explicitly retires this containment model ("a Lesson Session references an ordered sequence of episodes; it does not own them by containment"), and `TEACHING_LIFECYCLE_DIAGRAM.md` replaced containment trees with explicit "referenced by" arrows for exactly this reason. `ENACTMENT_MODEL.md` still uses the older tree style in its first diagram (a second, "alternative" diagram below it gets the reference direction right, but the document doesn't say which is authoritative — see §7 below).

**Canonical source:** `TEACHING_EPISODE_MODEL.md` EM-2; `TEACHING_LIFECYCLE_DIAGRAM.md` "The Planning Chain."

---

## 3. Terminology Review

- **No deprecation table.** `LESSON_PLANNER_INFORMATION_MODEL.md` and `TEACHING_LIFECYCLE_DIAGRAM.md` both carry an explicit "Deprecated — do not use" table mapping old terms to new ones. `ENACTMENT_MODEL.md` has none, despite being the document that most directly supersedes `INFORMATION_MODEL.md` Domain 2's terms (Instructional Event, Lesson Completion, Instructional Notes, Section-Specific Instructional Adjustment). Recommend adding one, explicitly mapping those terms onto Session Enactment / Placement Enactment / Session Note / carry-forward.
- **"Layer 1" examples blur content with content's *attachments*.** The Teaching Episode examples list — "explanation, activity, discussion, worked example, assessment, **deliverable**, **materials**, **durable teaching notes**" — presents Deliverables, Materials, and Episode Notes as if they were themselves instances of a Teaching Episode. Elsewhere (`TEACHING_EPISODE_MODEL.md`, `LESSON_PLANNER_INFORMATION_MODEL.md`) these are explicitly things a Teaching Episode *owns/carries*, not co-equal examples of it. Minor but real ambiguity.
- **Lifecycle phase vocabulary not adopted.** `TEACHING_WORKFLOW.md`, `POST_CLASS_DEBRIEF.md`, and `TEACHING_LIFECYCLE_DIAGRAM.md` all use the named phases Expedition / Put-In / Rapids / Campfire / Assimilation / Next Expedition as shared vocabulary. `ENACTMENT_MODEL.md`'s "Enactment Defined" diagram describes the same flow in generic prose without naming the phases. Not wrong, just out of step with the now-standard vocabulary.
- **"Instructional Knowledge" not used.** `TEACHING_LIFECYCLE_DIAGRAM.md` names the accumulation of Episode Notes over time as "Instructional Knowledge" (a first-class Assimilation-phase output). `ENACTMENT_MODEL.md` describes the same accumulation under "Episode Notes" without using that term, so a reader has to infer the equivalence.

---

## 4. Ownership / Reference / Containment Review

| Object | ENACTMENT_MODEL.md treatment | Consistent with canonical docs? |
|---|---|---|
| Teaching Episode | Owns durable content; enacted status never here | Yes |
| Episode Placement | Owns "lesson session, section, planned order, **planned duration**, **planned date**, source placement, carry-forward" | **No** — duration belongs to the episode (EM-14); section/date belong to the Lesson Session envelope (EM-2, LESSON_SESSION.md) |
| Lesson Session | Referenced-to via placements (mostly consistent) | Mostly, but see the containment-tree diagram in §2.3 |
| Session Enactment | Owns session-level facts + Session Note | Yes |
| Placement Enactment | Owns status/waterline/reason for one placement | Yes |
| Episode Note | Belongs to Teaching Episode | Yes |
| DailyProgress | Explicitly non-canonical, migration-only | Yes, and well-handled |

A second ambiguity worth flagging: `TEACHING_EPISODE_MODEL.md`'s header calls `ENACTMENT_MODEL.md` "the broader enactment architecture" that it (TEACHING_EPISODE_MODEL) is merely "a focused view" of — while `ENACTMENT_MODEL.md` itself says "The Enactment Model **depends on** the three-layer Teaching Episode Model." These aren't strictly contradictory (one can be broader in scope while depending on the other's foundational definitions), but the two documents never state their relationship from the same direction, which makes the dependency graph hard to read at a glance.

Separately, `ARCHITECTURE_INDEX.md` — the document the reconciliation workflow says to "start from" — lists no entry for `ENACTMENT_MODEL.md`, `TEACHING_EPISODE_MODEL.md`, `LESSON_PLANNER_INFORMATION_MODEL.md`, `TEACHING_LIFECYCLE_DIAGRAM.md`, `POST_CLASS_DEBRIEF.md`, or `TEACHING_WORKFLOW.md` at all — the entire Lesson Planner/Enactment family is invisible from the canonical map. (The index's Subsystems section also still marks `TODAY_ARCHITECTURE.md` and `FORECAST_ARCHITECTURE.md` as "(future)" though both already exist.) This is not `ENACTMENT_MODEL.md`'s defect to fix, but it's the reason a reader following the prescribed workflow ("start from ARCHITECTURE_INDEX.md") would never discover this document.

---

## 5. Lifecycle Review

- **Planning truth / enacted truth:** correctly and clearly separated; matches the family.
- **Instructional knowledge:** present in substance (Episode Notes) but not named as such — see Terminology.
- **Derived information:** well handled, including the important non-negotiable that derived progress must be reproducible from canonical enactment data (Rule 7).
- **Carry-forward:** correctly modeled as dual-write / two-truths, matching EM-5 and the Lifecycle Diagram's Carry-Forward section — including correctly leaving Q-EN-3/Q-EM-3's representation question open in both places.
- **Post-Class Debrief:** correctly treated as the sole entry point, matching the Architectural Invariant in `TEACHING_LIFECYCLE_DIAGRAM.md`.

No missing lifecycle relationships were found beyond the terminology-naming gaps already noted.

---

## 6. Missing Concepts

- **Phase vocabulary** (Expedition/Put-In/Rapids/Campfire/Assimilation) — present everywhere else in the family, absent here. Would improve cross-document navigability if adopted, but is not required for correctness.
- **"Instructional Knowledge" as a named output** of Episode Notes, to align with `TEACHING_LIFECYCLE_DIAGRAM.md`'s Assimilation-phase terminology.

Nothing else from the canonical set was found materially missing; the document's scope (session/placement enactment mechanics) is otherwise complete.

---

## 7. Redundant or Duplicate Material

`ENACTMENT_MODEL.md` restates, largely independently, behavior that `TEACHING_EPISODE_MODEL.md` §2 and §5 already define in more detail and with EM-numbered ratification:

- Bump/carry-forward mechanics (EM-5, EM-12) are re-described in ENACTMENT_MODEL's "Carried Forward" and "Carry-Forward" sections, with slightly different phrasing and without cross-referencing the EM numbers.
- Skip (EM-11) is re-described in "Skipped" and "Skip" with no cross-reference.
- Split (EM-9) and Merge (EM-10) are re-described in "Split" and "Merge" with no cross-reference, and with less precision than the EM-9/EM-10 walk-throughs (e.g., ENACTMENT_MODEL's Split section doesn't mention lineage IDs or Q-EM-5).
- Section independence is stated almost verbatim in both documents.

Per `ARCHITECTURE_DOCUMENT_STANDARDS.md` ("Cross-reference, don't duplicate"), this creates two independently-maintained tellings of the same behaviors, which is exactly the drift risk that produced the original "Instructional Segment" vs. "LessonSessionItem" ambiguity `TEACHING_EPISODE_MODEL.md` had to resolve. The two "Data Relationships" diagrams at the end of `ENACTMENT_MODEL.md` are also somewhat redundant with each other (a containment-styled tree followed by an "alternative relational view" that corrects it) — see §2.3.

The "Notes Model" (Session Notes / Episode Notes / Section-Specific Episode Knowledge) duplicates the "Reflections" section of `LESSON_PLANNER_INFORMATION_MODEL.md` almost point-for-point, including the identical guidance not to build a third contextual-knowledge category in V1.

---

## 8. Open Questions

`ENACTMENT_MODEL.md` documents Q-EN-1 through Q-EN-10.

- **Q-EN-1** (when Session Enactment is created) — genuinely open; no conflicting information elsewhere. Recommend: remain unresolved.
- **Q-EN-2** (`planned` as stored status vs. absence-of-record) — genuinely open. Recommend: remain unresolved.
- **Q-EN-3** (carried-forward representation) — correctly kept open and consistently cross-referenced by `TEACHING_EPISODE_MODEL.md` (EM-5 note) and `TEACHING_LIFECYCLE_DIAGRAM.md`. This is the one open question the family handles well. Recommend: remain unresolved, keep as-is.
- **Q-EN-4** (waterline representation) — closely related to `TEACHING_EPISODE_MODEL.md`'s Q-EM-3 ("waterline granularity: per-episode or per-Block"), but the two are not cross-linked, and different resolution of each independently could produce an inconsistent model. Recommend: clarify by cross-referencing Q-EN-4 ↔ Q-EM-3 so they are resolved together.
- **Q-EN-5** (are Episode Placements duplicated by section, or shared with section-specific enactments) — this appears to already be answered by `TEACHING_EPISODE_MODEL.md` EM-7 ("a Lesson Session is one section's one meeting"), which implies each section already has its own placements by construction. Recommend: clarify — likely should be marked resolved (pointing to EM-7) rather than left open, or explicitly explain what residual ambiguity EM-7 doesn't cover.
- **Q-EN-6** (DailyProgress → Enactment mapping) — genuinely open, consistent with the "Migration Principle" section. Recommend: remain unresolved.
- **Q-EN-7** (exact facts Forecast needs) — genuinely open, and arguably belongs partly to `FORECAST_ARCHITECTURE.md`'s scope once that document matures. Recommend: remain unresolved here, but note it should be picked up jointly when Forecast's architecture is next reconciled.
- **Q-EN-8** (auto-create vs. propose carry-forward placements) — related to `TEACHING_EPISODE_MODEL.md` Q-EM-4 (does skip auto-offer carry-forward), but scoped more broadly (all incomplete statuses, not just skip). Recommend: cross-link so they aren't resolved inconsistently.
- **Q-EN-9** (revising enactment after tomorrow's planning has consumed it) — genuinely open. Recommend: remain unresolved.
- **Q-EN-10** (which session facts deserve structured fields vs. free text) — this reads more like an implementation/schema-design question than an architectural ownership question. Recommend: consider whether it belongs in an implementation-decisions log (e.g., alongside `LESSON_SESSION_IMPLEMENTATION_DECISIONS.md`) rather than the architecture document, per `ARCHITECTURE_DOCUMENT_STANDARDS.md`'s "not implementation logs" guidance — but this is a judgment call, not a required move.

---

## 9. Recommended Editing Plan

### Required

1. Correct the Episode Placement field list in "Layer 2" — remove "planned duration" (owned by Teaching Episode per EM-14) and "section"/"planned date" (owned by the Lesson Session envelope per EM-2), or explicitly reconcile the discrepancy with `TEACHING_EPISODE_MODEL.md` if some broader meaning was intended.
2. Replace the containment-tree "Data Relationships" diagram with reference-style notation consistent with `TEACHING_LIFECYCLE_DIAGRAM.md`'s "Planning Chain," and remove or merge the redundant "alternative relational view" so there is one authoritative diagram.
3. Explicitly acknowledge, somewhere in the document (e.g., in "Ownership" or a new short note), that this model supersedes `INFORMATION_MODEL.md` Domain 2's assignment of Enacted Curriculum ownership to Today — even if resolving `INFORMATION_MODEL.md`/`SUITE_ARCHITECTURE.md` itself is out of scope for this edit, the conflict should not go unflagged in the one document most directly built on top of it.

### Recommended

4. Add a "Deprecated — do not use" terminology table (matching the style of `LESSON_PLANNER_INFORMATION_MODEL.md` / `TEACHING_LIFECYCLE_DIAGRAM.md`) mapping `INFORMATION_MODEL.md`'s Instructional Event / Lesson Completion / Instructional Notes / Section-Specific Instructional Adjustment onto this document's terms.
5. Trim the duplicated bump/skip/split/merge/section-independence narrative in favor of cross-references to `TEACHING_EPISODE_MODEL.md` §2/§5 (EM-5, EM-9, EM-10, EM-11), keeping only what is genuinely session/enactment-specific here.
6. Cross-link Q-EN-4 ↔ Q-EM-3 and Q-EN-8 ↔ Q-EM-4; reconsider whether Q-EN-5 is already answered by EM-7.
7. Fix the "Layer 1" example list so Deliverables/Materials/Episode Notes read as things the Teaching Episode owns rather than co-equal examples of it.
8. Adopt the Expedition/Put-In/Rapids/Campfire/Assimilation phase names and the term "Instructional Knowledge" where this document currently uses generic equivalents, for cross-document consistency.
9. Reconsider the "Draft Architecture" status label given how heavily three other canonical documents now depend on this one as settled.

### Optional

10. Repair the character-encoding corruption (garbled arrows and bullets rendered as `?`/`�`) that runs throughout the file — purely a hygiene issue, not architectural.
11. Consider moving the "Suggested Conceptual Fields" (ID-suffixed field lists) to an implementation-decisions document rather than the architecture document, or trim it to conceptual categories only.
12. Consider relocating Q-EN-10 to an implementation-decisions log.
