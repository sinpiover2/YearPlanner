# Planning Workspace Specification

**Document Status:** Approved design target — pending four blocking decisions (Section 14)
**Phase:** Planning workspace implementation
**Audience:** Implementation partner. This document is self-contained; no prior conversation context is required.
**Companion document:** `LESSON_SESSION_COMPOSER.md` (the editing surface that opens from this workspace)

---

# 1. Purpose

The Planning workspace is the weekly authoring environment of the Year Planner suite.

It answers one teacher question:

> **What is my teaching week?**

It replaces a legacy FileMaker weekly planner used daily for many years. The legacy system's proven strength — the entire week visible at once, with each class meeting's instructional sequence readable without opening anything — must be preserved. Its weaknesses — every field permanently visible whether or not it has content, decorative color, chrome outweighing instruction — must not be.

Planning is where the teacher **arranges teaching across time**. It is deliberately a different mental mode from the Lesson Session composer, where the teacher **composes one class**. Planning shows sessions as closed objects moving through a horizontal week; the composer opens one session into editable blocks on a vertical time canvas. Do not blur these modes: session contents are never edited in place on the board.

---

# 2. Fixed Architecture Context

The suite has four top-level workspaces. This is settled and must not change.

| Workspace | Teacher question |
|---|---|
| Today | What am I teaching today? |
| Planning | What is my teaching week? |
| Units | Where am I in the curriculum? |
| Forecast | Am I OK? |

**Lesson Session is not a workspace.** It is a domain object (one real class meeting) that opens from Today (via Start Lesson) or from Planning (by opening a session card). See `LESSON_SESSION_COMPOSER.md`.

Governing suite principles that constrain this spec:

- **Awareness, not advice.** Planning reveals reality and consequences; it never recommends.
- **Calm by default.** Most weeks are normal. The interface is quiet unless something genuinely needs attention.
- **Geometry before color.** Shape and position carry state. Color is reserved exclusively for genuine severity.
- **Stable layout.** Teachers build spatial memory. The grid never rearranges, compresses, or reflows in response to data or focus. (A focus-day layout with an enlarging active column was explicitly considered and **rejected** for this reason. Do not reintroduce it.)
- **Authored once, reused everywhere.** Curriculum items are linked to Units, never copied. Instructional content is authored in Lesson Sessions and consumed by output channels.

---

# 3. Vocabulary

Terms used normatively throughout this spec and the companion spec.

- **LessonSession** — one scheduled meeting of one section on one instructional day. The only object cards represent.
- **Block** (InstructionalBlock) — one ordered instructional event inside a LessonSession (Welcome, Amplify 3.3, Practice, Exit ticket). Called "Instructional Segment" in older suite documents; same object.
- **Frame** — the recurring bookend blocks a section's sessions share (e.g., Welcome, Homework review at the start; Exit routine at the end). See Section 8.
- **Composition bar** — a thin horizontal bar on each card showing how the period's minutes are allocated across blocks. It shows *plan composition*, never *progress*. (Percentage-progress fills were rejected elsewhere in the suite; this is a different semantic and must not drift into a progress meter.)
- **Open time** — minutes in a session's period not yet allocated to any block.
- **State dot** — the single geometric readiness indicator on each card. See Section 7.4.
- **Unit Shelf** — the pinned dock of placeable items (upcoming curriculum lessons, routines, assessments, teacher activities). See Section 9.
- **Shoulder days** — the last school day before the displayed week and the first school day after it, shown as slim slivers.

---

# 4. Component Tree

```
PlanningWorkspace
│
├── WeekHeader
│   ├── PrevWeekButton
│   ├── WeekLabel                ("Week of Sep 14")
│   ├── NextWeekButton
│   ├── JumpToDateButton         (opens date picker)
│   └── WeekMeta                 ("School days 4–8 of 180", right-aligned, muted)
│
├── WeekGrid
│   ├── ShoulderColumn (leading) (previous school day)
│   ├── DayColumn × 5            (Mon–Fri, or the section schedule's meeting days)
│   │   ├── DayHeader            (weekday + date; optional severity dot)
│   │   └── SessionStack         (SessionCards in period order)
│   │       ├── SessionCard      (one per LessonSession)
│   │       └── EmptySlot        (one per schedulable, unfilled meeting)
│   └── ShoulderColumn (trailing) (next school day)
│
├── UnitShelf
│   ├── ShelfPeekRow             (always visible, single row)
│   │   ├── ExpandChevron
│   │   ├── UnitLabel            ("UNIT 2")
│   │   ├── ShelfChip × 2–3      (next unplaced items, draggable)
│   │   ├── CategoryLinks        (Routines · Mine · Assessments)
│   │   └── ShelfMeta            ("6 left · 8 open days", muted)
│   └── ShelfTray                (expanded state; categorized chip groups)
│
└── SessionSheet                 (LessonSessionComposer presented as a right-side
                                  sheet over a dimmed but visible grid;
                                  see LESSON_SESSION_COMPOSER.md)
```

---

# 5. Data Model Assumptions

This spec consumes data; it does not define storage. Provenance is stated per the suite's discipline: every field is *exists today*, *derivable*, or *requires new data model*. Fields in the third category cannot ship without the corresponding blocking decision (Section 14).

## 5.1 LessonSession (consumed)

| Field | Provenance |
|---|---|
| course, section, period, instructionalDate | Exists (identity fields) |
| meetingStart, meetingEnd, meetingMinutes | Derivable — **from calendar/schedule resolution subsystem** (Section 14, D5) |
| linked curriculum item(s) | Exists as concept; cardinality unresolved (Section 14, D1) |
| ordered blocks | Exists (Instructional Segments) |
| state (draft / planned / prepared / completed) | Partially derivable; derivation rule is an open question (Section 13, Q1) |
| readiness flags (printNeeded, materialsUnresolved) | Requires new data model (readiness is produced by the composer; consumed here) |
| frame reference or frame-modified flag | Requires new data model (Section 14, D2) |

## 5.2 Block (consumed for the composition bar only)

Planning needs, per block: `kind` (frame | core), `estimatedMinutes`. Duration is currently optional in the suite information model; the composition bar makes it load-bearing (Section 14, D3).

## 5.3 ShelfItem

| Field | Provenance |
|---|---|
| Upcoming curriculum lessons in unit order, with placed/unplaced status | Derivable from Units + existing sessions |
| Routines, teacher activities, assessments | Requires new data model for teacher-owned reusable blocks (overlaps D2) |
| "N left · M open days" counts | Derivable — **must come from the shared pacing engine** (Section 14, D4) |

## 5.4 Schedule facts

Day headers, no-class days, shortened periods (e.g., a 40-minute assembly day), and shoulder-day identification all come from the calendar/schedule resolution subsystem (D5). Planning never computes these locally.

---

# 6. Layout and Grid Rules

1. The grid is **stable**. Column count, column order, and column widths are fixed for a given schedule. Nothing enlarges on focus, hover, or data conditions.
2. Columns, left to right: leading shoulder sliver · the week's meeting days in calendar order · trailing shoulder sliver.
3. Shoulder slivers are ~24px: vertical date label plus one state dot per session that day, at ~50% opacity. Hovering a sliver shows a read-only summary popover; slivers are not drop targets and their sessions do not render as cards.
4. Within a day, sessions stack in **period order**, one card per LessonSession. Ordering never varies.
5. Every schedulable meeting without a session renders an **EmptySlot** (dashed border) showing available minutes and, when the shelf has a next unplaced curriculum item for that section, a quiet ghost action: `+ 3.4 next`. One click places that item (as a link) and creates the session.
6. A day the section does not meet renders a muted dashed slot labeled with the reason when known (`no class`, `assembly`).
7. Today's column receives a **stable, date-driven** surface tint (one elevation step) and a weighted header. This is the only column differentiation permitted.
8. Card heights may vary with content (chips row present or absent) but cards never expand in place. Rich detail lives in the composer sheet.

---

# 7. Session Card Anatomy

Cards are closed objects. They are scannable in one saccade and are never edited inline.

## 7.1 The five slots (top to bottom, fixed order)

| Slot | Content | Presence |
|---|---|---|
| 1. Identity | Section tag (`M8 · P2`, muted, letter-spaced) left; state dot right | Always |
| 2. Title | The session's core content name, with a link glyph folded into the title when the core is a linked curriculum item (`🔗 3.3 Intercepts`) | Always |
| 3. Extras | Chips for **non-frame, non-core** items only (assessment tag, lab, deliverable such as `HW set B`) | Only when such items exist |
| 4. Composition bar | See 7.3 | Always |
| 5. Footer | Left: open-time text (`8 min open`) **only when open time > 0**. Right: attention glyphs **only while their condition is true** | Only when at least one element is true |

Most cards therefore render three rows. A fully composed, fully prepared session with no extras shows: identity, title, bar — and a filled dot. **Absence is the reward state.**

## 7.2 Chip rules

- Chips name nouns, never sentences.
- The frame never appears as a chip (Section 8).
- The core curriculum item never appears as a chip; it is the title.
- Deliverables (homework, quiz) may appear as chips; these reference Deliverable objects authored in the session, not free text.

## 7.3 Composition bar

- Height 5px, full card width, 1px gaps between segments, 2.5px outer radius.
- Segment vocabulary: **frame segments** = light neutral (border-strong tone); **core segments** = mid neutral (text-muted tone); adjacent core segments are distinguished by the 1px gap and a one-step opacity alternation, never by hue; **open time** = transparent with a dashed 1px border.
- Segment widths are proportional to `estimatedMinutes` over `meetingMinutes`.
- The bar is **composition, not progress**. It must never encode percent-complete, enacted time, or pace. No fill animation.
- No persistent legend anywhere in the workspace (Tufte rule inherited from the suite's timeline decisions: direct labeling over legends; where segments are too small to label, the vocabulary is taught once via first-run hint and hover tooltip, then trusted).

## 7.4 State dot vocabulary

| Geometry | Meaning |
|---|---|
| Filled dot | Prepared (composed; all readiness flags clear) |
| Thick-stroke hollow dot | Planned (composed; readiness flags outstanding or open time above threshold) |
| Thin-stroke hollow dot | Draft (session exists; composition incomplete) |
| Filled dot at 50% opacity | Completed (past sessions; shoulder slivers and past days of the current week) |

Exact derivation of draft vs planned is open (Q1). The geometry vocabulary itself is settled.

## 7.5 Attention glyphs

- Small muted icons, footer-right, shown **only while the condition is true**: lesson sheet / copies not printed (printer glyph), materials unresolved (paperclip glyph).
- No success glyphs, no checkmarks, no green — ever.
- A **modified frame** (this session deviates from the section's standard frame) earns one small `⟳` glyph here. A standard frame is silent (Section 8).

## 7.6 Severity color

- Exactly one color exists on this board: a small amber dot beside a day header whose resolved schedule deviates from the normal pattern (assembly, minimum day, testing).
- Amber marks **schedule severity only**. It never marks pacing, readiness, or lateness — those are Forecast's and the dots' jobs respectively.
- Card surfaces, chips, bars, and dots are neutral in all states.

---

# 8. The Frame

The frame is the answer to visual repetition. Nearly every session in a section begins and ends the same way (Welcome, Homework review … Exit routine). The legacy system paid for this in ink daily; this system does not.

**Normative rule — frame silence:**

> A session whose frame matches the section's standard frame renders the frame as geometry only: the light end-cap segments of the composition bar. No frame text, no frame chip, no frame rows appear on the card. A session whose frame has been modified for that day earns one `⟳` glyph in the footer. Frame *contents* remain fully real per session and are viewed and edited only in the composer.

This is the deviation-governs-visibility principle: what is identical every day has earned near-invisibility; only difference gets ink.

The frame's data representation (per-section template that stamps copies vs. live reference that propagates edits) is **blocking decision D2** and is deliberately not decided in this spec.

---

# 9. Unit Shelf

The shelf is the placement mechanism: the queue of things not yet on the calendar, dealt onto the week.

## 9.1 Placement and states

- **Pinned bottom dock.** Two states only: **peek** (single ~36px row, always visible) and **tray** (expanded upward, categorized).
- Auto-hide and floating-palette variants were considered and **rejected**: auto-hide breaks the spatial stability the grid is built on; floating occludes drop targets.
- Peek row contents, left to right: expand chevron · unit label · the next 2–3 **unplaced** items for the currently relevant unit as draggable chips · category links (Routines · Mine · Assessments) · pacing meta (`6 left · 8 open days`, muted).
- The tray expands on chevron click or on hovering the peek row during an active chip drag. It collapses automatically after a successful placement and on `Esc`.
- The shelf never overlaps cards in peek state and never exceeds ~40% of viewport height in tray state.

## 9.2 Shelf semantics

- Curriculum chips are **references to Units items**. Placing one creates a linked block (and a session if the slot was empty). Nothing is copied; a curriculum revision in Units propagates.
- Placing a chip removes it from the unplaced queue; unscheduling (dragging a linked core block back to the shelf inside the composer, or deleting the session) returns it.
- The queue is ordered by unit sequence. The shelf never reorders itself for any other reason.
- The pacing meta is awareness only (raw counts, no judgment) and must be computed by the shared pacing engine (D4), not locally.

---

# 10. Interaction Rules

## 10.1 Pointer

| Gesture | Result |
|---|---|
| Click a session card | Opens the composer as a right-side sheet; grid remains visible, dimmed |
| Click an EmptySlot ghost action | Places the named next curriculum item, creates the session |
| Drag a session card to another day (same section row) | Reschedules the session; drop targets highlight with a dashed outline |
| Drag a session card across sections | **Disallowed**; card snaps back with a brief shake; no dialog |
| Drag a shelf chip onto an EmptySlot | Creates the session with that item as core |
| Drag a shelf chip onto an existing card | Appends the item as a block at the end of that session's core |
| Drag a card to a shoulder sliver | Disallowed (slivers are read-only) |

Drops onto days whose resolved minutes are shorter than the session's composed minutes are permitted; the card immediately shows the resulting open-time deficit via the bar and footer (awareness, not prevention).

## 10.2 Keyboard

| Key | Action |
|---|---|
| ← → ↑ ↓ | Move card focus through the grid (day-major, period-minor) |
| Enter | Open focused session in the composer sheet |
| ⌘← / ⌘→ | Previous / next week |
| ⌘J | Jump to date |
| P | Toggle focused card's next unplaced ghost placement (same as clicking the ghost) |
| Esc | Close sheet / collapse tray |

## 10.3 Navigation

- Previous/next week always moves exactly one week; jump-to-date lands the week containing the chosen date.
- Week changes preserve scroll position and focus column index where possible (spatial memory).

---

# 11. Visual Rules

- Neutral palette throughout; the amber schedule dot is the only chromatic element (7.6).
- Typography: two weights only (regular, medium). Card title ~13px medium; identity/meta 11px muted with slight letter-spacing; no all-caps except the shelf's small section labels.
- Borders: hairline (0.5px) default; the focused/next-relevant card may carry a 1px stronger border; nothing heavier.
- Corner radius: 10px cards, 6px chips.
- No shadows, gradients, badges, progress rings, or decorative icons. Every mark must carry state.
- Whitespace creates hierarchy before borders do.
- Empty is quiet: an unremarkable week shows mostly three-row cards with filled dots and an empty footer band. Silence is correct.

---

# 12. Out of Scope

- Editing block contents on the board (composer's job).
- Any pacing interpretation, warnings, or recommendations (Forecast's job).
- Curriculum browsing or revision (Units' job).
- Enacted/teaching-time behavior — marking complete, logging, reflection (daily mode; see companion spec's boundary note).
- Monday Manager or any publication surface.

---

# 13. Open Questions (non-blocking)

1. **Q1 — State derivation.** Is draft vs planned derived (e.g., open time above a threshold, or no core item) or teacher-set? Proposal: derived, with the rule stated in one sentence in the UI tooltip. Needs ratification.
2. **Q2 — Dense schedules.** With 5–6 sections meeting daily, cards compress vertically. Likely answer: cards keep anatomy but slot 3 (extras) collapses to glyphs at a density breakpoint. Needs a mockup pass before implementation of that breakpoint.
3. **Q3 — Vocabulary teaching.** First-run hint vs hover tooltips as the mechanism replacing legends. Either is acceptable; pick one and be consistent with the composer.
4. **Q4 — Multi-week jump ergonomics.** Whether jump-to-date also offers "start of unit" anchors. Nice-to-have; defer.

---

# 14. Blocking Decisions Before Build

Implementation of this workspace must not begin until these are decided and recorded. Each is a suite-level architecture question that this design *assumes an answer to*; building on an unstated assumption would harden it silently.

- **D1 — Curriculum lesson ↔ LessonSession cardinality.** This design displays sessions like `3.3 Intercepts` followed by `3.3 finish` (one curriculum lesson spanning two meetings) and sessions containing multiple curriculum items. That requires many-to-many between curriculum lessons and sessions, which contradicts any one-to-one assumption elsewhere. Resolve the cardinality and the identity of the linkage before building cards or shelf placement.
- **D2 — SessionFrame provenance and ownership.** Template-stamp (copies at session creation; edits don't propagate) vs live reference (edits propagate; per-session overrides create the `⟳` state). Frames are teacher-owned, so the curriculum linked-not-copied ruling does not automatically transfer. Also decide where frames are authored (composer? a section settings surface?). The frame-silence rule (Section 8) is settled either way.
- **D3 — Duration becomes load-bearing.** The composition bar requires `estimatedMinutes` on every block. Decide: type-level defaults (proposal: Welcome 3, Homework review 7, Exit routine 5, Discussion 10, curriculum core inherits an estimate from Units or defaults to the period's remaining minutes) plus a defined degraded rendering for genuinely unsized blocks. Whatever is decided must match the composer spec exactly.
- **D4 — Shared pacing engine.** The shelf's `N left · M open days` must come from the same computation Forecast uses, or the two surfaces will eventually disagree on core facts — a trust failure. Name the engine, its owner, and its API before wiring the shelf meta. If undecided at build time, ship the shelf without the meta rather than computing it locally.
- **D5 — Calendar/schedule resolution owner.** Meeting times, shortened days, no-class days, shoulder-day identity, and "next meeting of this section" all come from schedule resolution, which the suite has identified as load-bearing and currently unowned. Planning must consume it, never reimplement it.

A sixth, softer flag: the suite already carries a naming collision ("Year Planner" as suite vs application). "Planning" as a workspace name alongside "Lesson Planner" as a suite document term is a cousin of that collision. Not blocking, but worth resolving in the same pass.

---

# Definition of Done

The Planning workspace is complete when a teacher can, without instruction: read the readiness of the whole week from the dot column in under two seconds; see the shape of every session from the bars without reading; place the next curriculum lesson in one click or one drag; open any session into the composer in one action; and end an ordinary planning pass having read almost no text — because on an ordinary week, there is almost nothing that needs saying.
