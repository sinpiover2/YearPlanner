# Lesson Session Composer Specification

**Document Status:** Approved design target — pending four blocking decisions (Section 15)
**Phase:** Lesson Session editing surface implementation
**Audience:** Implementation partner. This document is self-contained; no prior conversation context is required.
**Companion document:** `PLANNING_WORKSPACE.md` (the board this surface opens from; shared vocabulary is defined in both)

---

# 1. Purpose

The Lesson Session composer is the editing surface for one LessonSession — one real class meeting of one section on one date.

Its governing idea:

> **A Lesson Session is not written. It is composed.**

The teacher assembles instruction from reusable building blocks — linked curriculum items, routines, assessments, discussions, their own activities — on a vertical time canvas where a block's physical height is its estimated minutes. The mental model is closer to arranging a Keynote deck or editing a timeline than editing a document. The period's fixed length is a visible wall the teacher composes against, not a number they read.

This surface is deliberately the opposite mental mode from the Planning board. Planning arranges closed session objects across a horizontal week; the composer opens one session into blocks on vertical time. The mode switch should be felt before it is understood.

A pedagogical note that motivates the geometry: problem-based curricula (Amplify and the Illustrative Mathematics lineage, with roots in Freudenthal-style realistic mathematics education) are built on a launch → investigate → synthesize arc. The most common failure of such lessons under time pressure is the silent squeezing of synthesis. Proportional block heights make time allocation visible at a glance — a four-minute discussion block *looks* thin. The composer shows the squeeze. It never says "protect your synthesis." Awareness, not advice.

---

# 2. Fixed Architecture Context

- The suite's four workspaces are Today, Planning, Units, Forecast. **Lesson Session is not a workspace.**
- The composer opens from exactly two places:
  1. **Planning** — clicking a session card opens the composer as a right-side sheet over the dimmed but visible week grid.
  2. **Today** — the Start Lesson action resolves today's instructional context, finds or creates the correct LessonSession, and opens the composer with no reselection of course, section, period, date, meeting time, unit, or lesson. Today already knows these; the composer inherits them.
- One LessonSession, two workflow contexts (weekly planning, daily teaching). These are presentation contexts of the same object, never separate records. This spec covers the **planning presentation**. Daily-teaching chrome reductions (larger type, muted editing affordances, enacted logging) are a later spec; the boundary is noted in Section 13.
- Curriculum items are **linked to Units, never copied**. Deliverables are durable objects authored once and published many times. Output channels (Monday Manager, print views) consume; they never author.

---

# 3. Vocabulary

- **Block** — one ordered instructional event in the session. The unit of composition.
- **Frame cap** — a block belonging to the section's recurring frame (see companion spec, Section 8), rendered compressed and muted at the canvas's top and bottom.
- **Core block** — any non-frame block; the distinctive substance of the session.
- **Canvas** — the vertical time area where blocks stack.
- **Open slot** — unallocated minutes, rendered as a dashed slot in sequence position.
- **Time ruler** — the clock-time scale at the canvas's left edge.
- **Palette** — the right-rail source of insertable blocks (Unit / Routines / Mine).
- **Tomorrow zone** — the drop target representing this section's next meeting.

---

# 4. Component Tree

```
LessonSessionComposer
│
├── SessionHeader
│   ├── Identity            ("Math 8 · Period 2" + state dot)
│   ├── ContextLine         (weekday, date, meeting time, 🔗 unit · lesson)
│   ├── CapacityReadout     ("47 of 55 min", muted)
│   ├── PrintButton         ("Lesson sheet")
│   └── OverflowMenu        (duplicate session, clear, delete, frame settings*)
│
├── ComposerBody
│   ├── TimeRuler           (clock labels at fixed intervals; end-of-period line)
│   ├── BlockCanvas
│   │   ├── FrameCap × n    (compressed; top and bottom)
│   │   ├── CoreBlock × n   (proportional height; selectable)
│   │   │   ├── BlockHeader (type/link glyph + title + minutes + [selected: verb icons])
│   │   │   ├── BlockNotes  (teacher note text, optional)
│   │   │   ├── BlockChips  (materials, deliverable, note indicators)
│   │   │   └── ResizeHandle (bottom edge; selected only)
│   │   └── OpenSlot × n    ("8 min open · drop a block or press /")
│   └── RightRail
│       ├── Palette         (tabs: Unit | Routines | Mine)
│       ├── CollectedPanel  ("Collected from blocks": materials + print counts)
│       ├── TomorrowZone    (next meeting; drag target for bump)
│       └── KeyHints        (muted, two lines)
│
└── SlashMenu               (inline insert menu; appears at an open slot or cursor)

*frame settings entry point depends on blocking decision D2
```

---

# 5. Data Model Assumptions

Provenance discipline: *exists*, *derivable*, or *requires new data model*. Third-category fields cannot ship without the matching blocking decision.

## 5.1 LessonSession (consumed and edited)

| Field | Provenance |
|---|---|
| Identity (course, section, period, date) | Exists |
| meetingStart / meetingEnd / meetingMinutes | Derivable — calendar/schedule resolution subsystem (D5) |
| Linked unit · lesson context line | Exists as concept; cardinality per D1 |
| Ordered blocks | Exists (Instructional Segments) |
| State (draft / planned / prepared) | Derivation open (companion spec Q1); composer displays, may set prepared-relevant flags |

## 5.2 Block

| Field | Provenance |
|---|---|
| id, order, title | Exists |
| kind: frame \| core | Requires new data model (D2) |
| type: curriculum \| routine \| discussion \| practice \| assessment \| deliverable-bearing \| custom | Partially exists; type vocabulary must be enumerated (drives glyphs and convert menu) |
| curriculumRef (for linked blocks) | Exists as concept; link-not-copy is settled |
| estimatedMinutes | Exists as optional; becomes load-bearing (D3) |
| notes (teacher-facing) | Exists |
| materials[] | Exists |
| deliverableRef | Exists as concept (Deliverable is a durable object; authored here, published elsewhere) |
| carryForward / bump history | Requires new data model (bump must record origin for future enacted flow; see 13) |

## 5.3 Palette sources

| Tab | Source | Provenance |
|---|---|---|
| Unit | Unplaced curriculum items in unit order (same queue as the Unit Shelf; must be the same data, not a parallel computation) | Derivable |
| Routines | Section/teacher routine library | Requires new data model (D2 adjacency) |
| Mine | Teacher-created reusable activities | Requires new data model |

## 5.4 Collected panel

Materials and print counts are **pure aggregations** of block-level data. The panel authors nothing. Print quantities require roster size — a read-only logistics use of roster data, consistent with the suite's roster boundary (roster supports teaching logistics; it is not a student information system).

---

# 6. Canvas Rules

1. **Scale.** Height is linear in minutes: a constant px-per-minute within a session, chosen so the full period fits the sheet without internal scrolling in the common case (≈6 px/min for a 55-minute period). The scale is per-session, recomputed for shortened days; the ruler always tells the truth.
2. **Ruler.** Clock times (resolved meeting start/end from D5) at readable intervals; a hairline **end-of-period rule** marks the final minute.
3. **Minimum block height** ≈18px. Blocks whose proportional height falls below it render at the minimum in a compressed single-line style (the frame-cap style). The ruler remains truthful; compressed blocks simply stop shrinking.
4. **Open slots** render in sequence position at proportional height, dashed border, with the text `N min open · drop a block or press /`. Zero open time renders nothing — absence is the reward state.
5. **Over-capacity.** If composed minutes exceed the period, blocks continue past the end-of-period rule and the header readout states the overage (`61 of 55 min`). Never compress blocks to force a fit, and never block the state — the teacher may intentionally overplan. Beyond a cap (~15 min overage) the excess renders symbolically rather than proportionally (an angled-cut edge and a count), mirroring the suite's Forecast overflow principle: rare extremes must not distort the common case. Exact symbolic treatment is Q2.
6. **Unsized blocks** (pending D3): render at the type-default height with the minutes label shown as `~N`, visually identical otherwise. If D3 lands on required-with-defaults, this state exists only transiently.

---

# 7. Block Anatomy

## 7.1 Core block (resting)

- Header row: type or link glyph + title (medium weight) left; minutes right.
- Optional notes line(s): teacher-facing, secondary color, plain prose.
- Optional chip row: materials (`graph paper`), deliverable (`HW set B`), note indicator.
- No borders heavier than hairline; surface one step above the canvas.

## 7.2 Core block (selected)

- Border strengthens by one step; nothing else moves.
- The header's right side gains the **verb icons** (in order): duplicate, split, convert, bump. Minutes remain visible beside them.
- A 30px **resize handle** appears centered on the bottom edge.
- Exactly one block is selected at a time; clicking the canvas background deselects. Unselected blocks never show verbs — the canvas at rest is calm.

## 7.3 Frame caps

- Compressed single-line style on the canvas's quiet surface (one step below core blocks): repeat glyph + name (+ today's specifics, e.g., `Homework review · set A`) + minutes.
- Frame caps are real blocks: clicking one selects and expands it inline for editing today's contents. Editing contents does not by itself constitute frame modification; structural changes (add/remove/replace a frame block, change its minutes beyond its default) set the session's frame-modified state (`⟳` on the board card). The precise modification rule depends on D2 and must be stated in one sentence when D2 resolves.

## 7.4 Type glyph vocabulary

One outline glyph per block type (link = linked curriculum, repeat = routine, speech = discussion, book = practice/homework-bearing, checklist = assessment, bulb = teacher activity). Glyphs are monochrome; type is never encoded by color.

---

# 8. Interaction Inventory

## 8.1 Insert

| Path | Behavior |
|---|---|
| Drag from palette | Chip drags onto the canvas; a live insertion line shows the drop position; the block lands with its type-default minutes; open time recomputes |
| Slash menu | `/` at an open slot or with a block selected opens an inline menu filtered by context: the unit's next unplaced item first, then routines, then types; typing filters; Enter inserts at the cursor position |
| Ghost affordance | An open slot's `press /` text is a click target for the same menu |

Inserting a linked curriculum item consumes it from the unplaced queue (shared with the Unit Shelf — same queue, same data).

## 8.2 Manipulate

| Verb | Trigger | Behavior |
|---|---|---|
| Reorder | Drag block; or ⌥↑ / ⌥↓ | Ordered-list move; heights and open slots reflow; frame caps are position-locked to their ends |
| Resize | Drag bottom handle | Snaps to whole minutes; adjacent open time absorbs or supplies the delta; resizing cannot push other blocks' minutes |
| Duplicate | Verb icon or ⌘D | Inserts a copy below; linked blocks duplicate the link, never the content |
| Split | Verb icon | Divides one block into two at a chosen minute split (inline two-value control); both halves keep the source link and title with `· part 1 / part 2` suffixes; notes stay with part 1 |
| Convert | Verb icon | Changes block type (e.g., practice → assessment); title, notes, minutes, materials persist; a linked curriculum block cannot convert away from linked — unlink is an explicit separate action with a confirmation |
| Bump | Verb icon, ⌘B, or drag onto the Tomorrow zone | Moves the block to this section's next meeting (resolved via D5), appended before that session's closing frame cap; creates that session if absent; records carry-forward origin |
| Delete | ⌫ with selection | Removes the block; a linked item returns to the unplaced queue; single-level undo required |

## 8.3 Keyboard map

| Key | Action |
|---|---|
| ↑ ↓ | Move selection |
| ⌥↑ ⌥↓ | Reorder selected block |
| / | Insert menu |
| ⌘D | Duplicate |
| ⌘B | Bump to tomorrow |
| ⌫ | Delete selected |
| Esc | Deselect; then close sheet |
| ⌥→ / ⌥← | Next / previous session in teaching order (weekly-planning flow: compose Monday, hop to Tuesday) |

A full session should be composable without the pointer.

## 8.4 Explicitly not interactions

No rich-text editing surface, no free-form page layout, no styling controls. Notes are plain text. The composer is not a document editor; if a control would make sense in a word processor and nowhere else, it does not belong here.

---

# 9. Palette

- Three tabs: **Unit** (unplaced curriculum items in unit order, next item visually leading), **Routines**, **Mine** (teacher-created reusable activities; assessments live under Unit when curriculum-provided, under Mine when teacher-made).
- Items are draggable chips with type glyphs; the Unit tab's first item carries a muted `next` tag.
- The palette lists at most ~6 items per tab with a quiet `more…` expansion; it is a dealing surface, not a browser. Full curriculum browsing is Units' job — the palette must never grow into a second curriculum navigator.

---

# 10. Collected Panel and Tomorrow Zone

- **Collected from blocks**: read-only aggregation of material chips across all blocks, deduplicated, with print-bearing items showing quantity from roster size (`Exit tickets · 32`). Clicking an entry highlights its source block. Authoring materials happens on blocks, never here.
- **Tomorrow zone**: a dashed card naming the section's next meeting (`Wed 16 · 3.3 finish` when that session exists; `Wed 16 · empty` when it does not). It is a live drop target for bump and a click-through to open that session. It renders nothing amber, nothing urgent — it is a place, not a warning.

---

# 11. Visual Rules

- Neutral palette; **no chromatic color anywhere in the composer**. Severity color is not needed here: the composer's job is composition, and schedule severity is already marked on the board's day header.
- Surfaces: canvas base < frame caps < core blocks (one hairline elevation step each); selected block gains only a stronger border.
- Typography: two weights; block titles ~13px medium; notes 12px secondary; ruler and minutes 11px muted. Sentence case throughout.
- No shadows, gradients, progress indicators, or decorative icons; every glyph carries type or state.
- Corner radius: 10px core blocks, 6px caps and chips.
- The canvas at rest (nothing selected) must read as a printed lesson sheet: sequence, minutes, materials — and nothing that looks like software.

---

# 12. Print

The Lesson sheet button produces the printable teaching document: identity line, meeting time, the block sequence with minutes, materials list, deliverables, and generous note space. Print is an output channel — it consumes the session and authors nothing. Layout details are a separate small spec; the button's presence and placement are fixed here because many experienced teachers teach from paper, and the printout must therefore be reachable in one action.

---

# 13. Boundary: Daily Teaching and the Enacted Flow

Start Lesson (from Today) opens this same composer for today's session. During and after teaching, the session will eventually accept enacted information — completed/skipped marks, actual timing, reflection — which flows uphill to update pacing and curriculum records. That flow is a named suite-level subsystem with its own unresolved contract. **This spec's composer writes planning-time data only.** The one exception already included is bump, which is a planning operation even when performed mid-day; its carry-forward record (5.2) is deliberately shaped so the enacted flow can later consume it. Do not add completion, logging, or reflection affordances under this spec.

---

# 14. Open Questions (non-blocking)

1. **Q1 — Split ergonomics.** Inline minute-split control vs drag-a-divider gesture. Either is buildable; pick after a prototype feel test.
2. **Q2 — Over-capacity symbolic treatment.** The angled-cut-plus-count proposal (6.5) needs one mockup pass.
3. **Q3 — Frame cap expansion behavior.** Expand in place (canvas grows) vs popover editing (canvas stable). In-place is more honest to the time metaphor; popover is more stable. Leaning in-place; confirm.
4. **Q4 — ⌥→ session order.** Teaching order across sections vs staying within one section's week. Proposal: teaching order (matches how weekends are actually planned).

---

# 15. Blocking Decisions Before Build

Shared with `PLANNING_WORKSPACE.md` — the two surfaces must resolve these identically, once, at the suite level:

- **D1 — Curriculum ↔ session cardinality.** The composer's split and bump verbs *manufacture* the many-to-many case (one curriculum lesson across two sessions) as a first-class operation. Resolve cardinality and link identity first.
- **D2 — SessionFrame provenance and ownership.** Stamp vs live reference; where frames are authored; the one-sentence frame-modification rule (7.3). The composer renders frames either way, but bump's "append before the closing frame cap" and the routines palette both depend on the answer.
- **D3 — Duration model.** Type-default minutes table and the unsized-block degraded state (6.6). Must match the Planning spec's composition bar exactly — same numbers, same source.
- **D5 — Calendar/schedule resolution owner.** Meeting times, the ruler, shortened-day rescaling, and the Tomorrow zone's "next meeting of this section" all consume schedule resolution. The composer must never compute schedule facts locally.

(D4, the shared pacing engine, does not bind the composer directly — the palette shows queue order, not pacing counts — but the Unit tab's unplaced queue must be the same data structure the Unit Shelf reads, or the two will drift.)

---

# Definition of Done

The composer is complete when a teacher opening a session immediately sees, without reading: what class this is, how the period's time is spent, where the open minutes are, and what still needs preparing — and when composing tomorrow's class from the palette, splitting an overrun lesson, and bumping its remainder to the next meeting each take a single gesture. The screen should feel like arranging instruction, and the finished canvas should look like the lesson sheet an experienced teacher would have written by hand — because it is one.
