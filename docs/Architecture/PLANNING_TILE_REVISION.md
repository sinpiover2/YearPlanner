# Planning Tile Revision

**Status:** Accepted design proposal for implementation.

This document refines the Session Tile defined in `PLANNING_WORKSPACE.md`.
After implementation and validation in classroom use, the accepted portions
should be merged into `PLANNING_WORKSPACE.md`, after which this document may
be archived or removed.

# Planning Session Tile — Revision and Signal Contract

**Document status:** Design-ratified changes to `PLANNING_WORKSPACE.md` Section 7. Ready for implementation.
**Audience:** Implementation partner. Self-contained; no prior conversation context required.
**Scope:** The visual and semantic definition of the SessionCard ("tile") in the Planning workspace. No data-model change. No new interaction. No editing, drag, or expansion is introduced here.
**Supersedes:** `PLANNING_WORKSPACE.md` §7.1 (slot list), §7.3 (composition bar), §7.4 (state dot), and narrows §7.5 (attention glyphs). Adds §7.7 (episode preview).

---

## 1. Decision log (append-only)

Provenance tags: `[exists]` uses data already present · `[derivable]` computed from existing data · `[new]` requires new data · `[reversal]` reverses a prior ratified decision · `[revision]` redefines a prior ratified decision · `[scope]` limits scope without changing the model.

- **PT-1 `[reversal]` — Composition bar removed from Planning tiles.**
  The 5px segmented composition bar (§7.3) is removed from the tile entirely. Rationale: it was ratified as *composition* (minute allocation), not progress, but it reintroduces a horizontal proportional element the product owner has chosen not to carry on the week grid. Reversal is deliberate and recorded. The composer (`LESSON_SESSION_COMPOSER.md`) may still own per-episode duration; this decision only removes the bar from the Planning surface. **Cost, named:** the tile no longer shows *proportion at a glance* (one activity filling the period vs. several balanced). That capability is not among the tile's scan goals, so the loss is accepted, not patched.

- **PT-2 `[relaxation]` — D3 relaxed for the Planning surface.**
  D3 ("duration becomes load-bearing") required `estimatedMinutes` on *every* block *because the composition bar rendered them*. With PT-1, the Planning tile needs only the session's **aggregate open-time total**, not per-episode minutes. Per-episode duration may remain the composer's concern. D3 is therefore no longer forced by Planning; it should be re-scoped to the composer before build.

- **PT-3 `[new]` — Core-episode preview replaces the "extras" chip row (supersedes §7.1 slot 3).**
  The ad-hoc "extras chips" row becomes a structured, ordered preview of the session's **core** Teaching Episodes. Same underlying objects; no data-model change. Definition in §4.

- **PT-4 `[clarification]` — Preview lines represent the actual episode sequence only.**
  The number of preview lines is **never** a proxy for authored-ness, readiness, or completeness. A prepared lesson may have one episode; a draft may have several placeholder episodes. Preview lines answer *"what is the sequence?"* and nothing else.

- **PT-5 `[revision]` — State dot redefined to two live states plus a past state (supersedes §7.4).**
  Readiness is carried **only** by the state dot, driven **only** by `session.state`. The prior four-state vocabulary (filled / thick-hollow / thin-hollow / faded) collapsed the draft↔planned distinction into two hollow strokes that are not legible without a legend. That distinction moves to the footer (where it is text). Definition in §3.1.

- **PT-6 `[new]` — Deliverable square marker.**
  A small hollow square, inline on an episode line, marks that the episode assigns a Deliverable. The deliverable flag already exists in the Lesson Planner model (`[exists]`). Definition in §3.2.

- **PT-7 `[scope]` — Footer glyph set reduced to the printer glyph for now.**
  Of the attention glyphs in §7.5, only the printer glyph ships on the first tile. It earns inclusion because printing is a real, batchable, pre-class workflow (the workspace already exposes "Print Day"). The materials glyph and the modified-frame `⟳` glyph remain defined but are gated behind their owning decisions (materials data; D2 frame provenance) and do not render until those resolve.

---

## 2. Revised tile anatomy (replaces §7.1)

The tile is a closed object: scannable in one glance, never edited inline. It renders in three rows, top to bottom.

| Row | Content | Presence |
|---|---|---|
| 1. Identity | Lesson title (left), with a link glyph folded in when the core is a linked curriculum item · **state dot** (right) | Always |
| 2. Episode preview | Up to 3 **core** Teaching Episodes in sequence order, each optionally carrying a deliverable square; plus a `+N more` line when core episodes exceed 3 | When ≥ 1 core episode exists |
| 3. Footer | Open-time text (left) · printer glyph (right) | When open time > 0 **or** a printable is unprinted |

Frame episodes (Welcome, Exit routine, etc.) never appear in Row 2 — frame silence (§8) is preserved by their **absence** from the preview, not by any geometry.

A prepared lesson with no open time and nothing to print renders **two rows and a filled dot**. Silence is the reward state.

> Open observation (not decided here): the live grid places section identity in the row rail (`MATH 8 P2`), which makes an on-card section tag redundant in that layout. Whether to drop it depends on a separate, undecided question — the grid's section-row orientation vs. the day-major orientation in the base spec. Flagged, not resolved.

---

## 3. Signal contract

Five signals. Each answers exactly one question. **No signal's meaning depends on another's.** This independence is the design; violating it (e.g., inferring readiness from line count) is a defect.

| Signal | Answers | Never encodes |
|---|---|---|
| State dot | Is this session ready? | sequence length, deliverables, open time |
| Preview lines | What is the episode sequence? | readiness, completeness |
| Square marker | Does this episode assign work? | readiness, timing |
| Footer text | How much of the period is open? | readiness on its own |
| Printer glyph | Is there something unprinted? | anything about lesson content |

### 3.1 State dot

- **Geometry:** 8px circle, right-aligned in Row 1, vertically centered to the title.
- **Two live states + one past state:**
  - **Filled** (solid, `--text-primary`) = **prepared**: `session.state == prepared` (composed, all readiness flags clear, open time ≤ threshold).
  - **Hollow** (transparent fill, 1px stroke `--text-secondary`) = **not yet prepared**: `session.state ∈ {draft, planned}`.
  - **Past** (solid, `--text-muted`) = **completed**: `session.state == completed`. Occurs only in past columns and shoulder slivers, so column context disambiguates it from a live filled dot.
- **Driven only by `session.state`.** The dot must be a pure function of session state — never computed from episode count, preview content, or deliverables.
- **Coherence property:** because *prepared* requires flags clear and no open time, a filled dot always coincides with an empty footer, and any footer content always coincides with a hollow dot. The fast glance (dot) and the detail (footer) agree by construction: solid dot ⇒ nothing left to do; hollow dot ⇒ the footer line states what remains.
- **Resolves Q1** in the derived direction: *prepared* is derivable (composed + flags clear + open ≤ threshold), so no manual "mark prepared" control is required.

### 3.2 Deliverable square

- **Geometry:** 7px square, 1px stroke `--text-muted`, transparent fill, 1.5px corner radius.
- **Position:** right edge of the episode line it belongs to, in Row 2 only. Never in Row 1 (that space is the dot's).
- **Rule:** one marker per episode that assigns ≥ 1 Deliverable. It signals *presence*, not count; the count and detail live in the composer.
- **Overflow:** if a Deliverable-bearing episode is hidden under `+N more`, the `+N more` line carries one trailing square so the signal is never silently lost.

### 3.3 Footer

- **Left — open time:** `N min open` when the session's aggregate open time > 0. This text also distinguishes a wide-open draft from a nearly-full plan, which is the granularity removed from the dot in PT-5.
- **Right — printer glyph:** `ti-printer`, shown only when the session has a printable (lesson sheet or printable deliverable) that is not yet marked printed. If the session has no printables, the glyph never appears.
- The footer row renders only if at least one element is present.

### 3.4 Why no legend is required

Legend-free does not require that a stranger guess every glyph on first sight; it requires that each mark be **unambiguous and learnable in one exposure**. The contract guarantees this:

1. **Shape separates the families.** Circles are always readiness (session-level). Squares are always deliverables (episode-level). The two never share a shape.
2. **Position reinforces shape.** The circle lives only in Row 1; the square lives only on episode lines in Row 2. Even at small size they cannot be confused.
3. **One meaning per mark.** No glyph is overloaded. Fill vs. hollow is the only distinction the dot carries, and it maps to the most conventional reading available (solid = done, open = not yet).
4. **Text carries the subtle cases.** Anything finer than "ready / not ready" is stated in words in the footer, never asked of geometry.
5. **Taught once, then trusted.** The square's association ("assigns student work") is introduced by a first-run hint and repeated on hover, consistent with the workspace's existing rule that vocabulary is taught once rather than carried in a persistent legend.

---

## 4. Core-episode preview (new §7.7)

- **What shows:** the session's **core** Teaching Episodes, in sequence order. Frame episodes are excluded (frame silence).
- **How many:** up to **3** core episodes. If more exist, show the first 3 and a `+N more` line where `N` = remaining core episodes.
- **Placeholders show.** An episode that exists in the sequence but has no composed interior still appears as a line. It is part of the sequence; its emptiness is reflected by the **dot** (draft) and the **footer** (open time), not by hiding the line. This is the concrete meaning of PT-4.
- **Per line:** episode title (11px, `--text-secondary`), truncated with ellipsis when long. The preview is not the authored surface, so truncation here is acceptable; the full title lives in the composer.
- **Deliverable square** trails the line per §3.2.
- **No controls.** No add, reorder, drag, or expand. Clicking anywhere on the tile opens the composer (existing behavior); the preview itself has no affordances.

---

## 5. Section 7 diffs (explicit)

- **§7.1 — replaced** by §2 above (three-row anatomy; slot 3 "extras chips" → core-episode preview).
- **§7.3 — removed** (PT-1). Record as a deliberate reversal with the D3 relaxation (PT-2) noted alongside.
- **§7.4 — replaced** by §3.1 (two live states + past; readiness is dot-only, driven by `session.state`).
- **§7.5 — narrowed** by PT-7 (printer glyph only for now; materials and `⟳` defined but gated).
- **§7.7 — added:** the core-episode preview (§4).

---

## 6. Data and provenance

The tile consumes; it does not define storage.

| Field | Provenance |
|---|---|
| Lesson title, curriculum link | `[exists]` |
| `session.state` (draft / planned / prepared / completed) | `[derivable]` — drives the dot; derivation resolved per Q1 (§3.1) |
| Ordered core Teaching Episodes + titles | `[exists]` (Lesson Planner model) |
| Deliverable-present flag per episode | `[exists]` (Lesson Planner model) |
| Aggregate open-time total | `[derivable]` — session-level aggregate only; per-episode minutes not required by this surface (PT-2) |
| Printable-unprinted flag | `[new]` — required only if the printer glyph ships; gate the glyph on it |

---

## 7. Notes

- **Annotation vs. UI.** Labels used to describe tile states in mockups ("prepared · one episode," "draft · four episodes," etc.) are explanatory annotations only. They must not appear anywhere in the product UI.
- **Restraint over completeness.** The first tile ships one footer glyph (printer). Additional glyphs wait until their data and their usefulness are proven.

---

## Definition of done (tile)

A teacher can, without instruction: read every session's readiness from the dot column in one pass; read each lesson's episode sequence and see which episodes assign work, without opening anything; tell a wide-open draft from a nearly-ready plan from the footer text alone; and end an ordinary week having read almost nothing — because on an ordinary week, the dots are filled and the footers are silent.
