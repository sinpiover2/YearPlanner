# Lesson Planner — Day 1 Interaction Specification

**Document Status:** Interaction Specification · Day 1 scope · **Revision 2**
**Depends on:** `TEACHING_EPISODE_MODEL.md` (ratified, incl. **EM-17**), `LESSON_PLANNER.md`, `LESSON_PLANNER_INTERACTION.md`, `LESSON_PLANNER_INFORMATION_MODEL.md`
**Does not change:** the information model. Where this spec touches an open model question, it says so explicitly (§11).

> Self-contained. Assumes no knowledge of the conversation that produced it.

**Goal.** By the first day of school in August, a teacher can plan, teach from, revise, and carry forward a real lesson without fighting the software.

**Decision numbering.** `LP1-n` = ratified Day 1 interaction decisions. `Q-LP1-n` = unresolved, needs prototype testing. Provenance tags: **[exists]**, **[derivable]**, **[new]**.

### Revision 2 — what changed and why

| # | Change | Reason |
|---|---|---|
| 1 | Day 1's cross-section action is renamed **Copy to another section**. Reuse/Detach/Bump vocabulary defined precisely (§0). **Q-EM-6 is NOT resolved as clone. EM-17 stands.** | Revision 1 operationally reversed a ratified decision by scoping it away. A Day 1 scope limit must not masquerade as a model resolution. |
| 2 | A **Deliverable is a durable shared domain object**. An episode **references** deliverables; it does not own their identity or lifecycle. | Episode-ownership would break deliverable identity as soon as two episodes reference the same handout. |
| 3 | **Episode-level Reflection is deferred.** Day 1 permits an ordinary episode **note** (`/note`) with no claim that it is a durable portable Reflection object. Whole-session reflection remains Day 1. | Q-EM-8 is unresolved; the spec must not ratify portable episode reflection ahead of the model. |
| 4 | **Derived wall-clock times are removed from Day 1.** Authored durations remain. | Clock time is derived and belongs to Today. It is not needed to teach from a lesson. |

---

## 0. Vocabulary (normative — use these four words exactly)

These four operations are distinct. Conflating any two of them corrupts either instructional history or curriculum identity.

| Term | Definition | Episodes involved | Placements | Day 1? |
|---|---|---|---|---|
| **Copy** | Create an **independent duplicate** episode. The duplicate has its own identity and its own content. No shared future; edits never propagate. | 2 episodes | 1 each | **Yes** |
| **Reuse** | **One shared** Teaching Episode referenced by **multiple placements**. Edits to the shared content propagate to every use, until detached (**EM-17**). | 1 episode | many | Soon after |
| **Detach** | Create an **independent derived episode** from one shared use, with lineage preserved. The escape valve from Reuse. | 1 → 2 episodes | that placement re-points | Soon after |
| **Bump** | **Continue the same episode** in another session, preserving the origin placement and its status (dual write, **EM-5**). | 1 episode | +1 (carry-origin set) | **Yes** |

**Note on Bump vs. Reuse.** Both produce a second placement of the *same* episode. They are distinguished, in data and in the interface, only by the **carry-origin** link (**EM-8**): a bump's destination placement points back at its origin; a reuse's placements do not. This is why bump and reuse must *feel* different (§6, §7) even though the mechanism is identical.

**Day 1 restriction (LP1-15).** The only cross-section action shipped on Day 1 is **Copy to another section**. This is a **scope limit, not a model decision**. EM-17 — *reuse is shared until explicitly detached* — remains ratified and unaltered. Q-EM-6 remains **open**. Day 1 simply does not yet ship a gesture that *creates* a shared reuse; the model continues to permit and intend it, and §7 specifies the behavior for when it arrives.

---

## 1. The interaction model in one page

Three model layers, three interaction surfaces. **No layer borrows another's surface.** This single mapping generates every decision below.

| Model layer | Surface | Job |
|---|---|---|
| **Teaching Episode** (durable content) | **the body** — an outliner | composing: writing what happens |
| **Episode Placement** (per-session reference) | **the spine** — a movable line | arranging: scanning, sequencing, moving |
| **Placement Status** (enacted truth) | **geometry on the spine** | recording: what happened here |

Stated as rules:

- **The spine is the movable unit. The body is the thinking environment.**
- **The card contributes only a spine and a reading line. Everything else is outline.** The moment a metadata bar, a toolbar, or a status chip bolts onto the spine, the design has regressed into a form.
- **Status is geometry, never color.** Color is reserved for severity, and nothing in normal planning or teaching is severity.
- **Overplanning is abundance, not shortfall.** Unreached episodes are the intended surplus. Nothing counts incompletes at the teacher.
- **Content travels; status does not.** Bumping preserves the origin's evidence.
- **Empty never renders.** No labeled section exists before it holds something.

---

## 2. Authentic workflow walkthrough

Real lesson: **Math 8 · Period 2 · Tue Sep 15 · Unit 1, Lesson 1.3 — Creating Multistep Transformations** (CCSS 8.G.A.2). Seven episodes; the teacher deliberately plans ~60 min of work into a 45-min period.

### 1. Open a Lesson Session
Today hands over the meeting identity (course, section, date, period, meeting length). Lesson Planner **never re-asks** for it. The session opens directly into the collapsed episode stack — no landing screen, no "no lesson selected," no explanatory panel. If the session is new and empty, the surface is a single empty spine with the cursor already in it. **[exists]**

### 2. Scan the collapsed stack
Seven spines, read top to bottom as an outline. Each spine: title, authored duration. Nothing else at rest. The stack reads as *the shape of the lesson*, not as a set of objects to manage. **[new]**

### 3. Create a Teaching Episode
From the last spine, `Cmd+Enter` creates a new episode below and places the cursor in its title. No dialog, no type-picker, no "choose a phase" step. Creation is a keystroke; categorization is optional and later (*teachers first build the lesson, then enrich it*). **[new]**

### 4. Name it and begin writing immediately
Teacher types `Investigation — Map the tile onto its neighbor`. `Enter` drops the cursor into the body's first outline line. Title → writing is one keystroke, no mode change, no "add notes" button. **[new]** — see **Q-LP1-1**.

### 5. Add outline lines inside the episode
The body is a Workflowy-style outline of Blocks:
```
Patty paper over the grid — slide the base tile onto its neighbor
  Record each move as an ordered sequence
  Two moves before anyone names a rule
Circulate: translate-then-rotate vs. rotate-then-translate
```
`Enter` = new sibling line. `Tab` = indent. `Shift+Tab` = outdent. This is writing, not filling. **[new]**

### 6. Summon a Learning Target
`/` at the start of an empty line → a quiet inline menu (learning · deliverable · materials · misconception · note). Choose **learning**, type or pick `8.G.A.2 — describe a sequence of rigid motions that carries one figure onto another`. It renders as a child line with a quiet glyph, *not* as a section with a header. Before this moment, no "Learning" label existed anywhere on screen. **[new]**

### 7. Create or reference a durable Deliverable
`/deliverable` → the menu lists existing deliverables (to **reference**) above *create new*. Teacher creates `Sequence Log`. A **durable Deliverable object** is created in the shared deliverable domain; the episode holds a **reference** to it, rendered as a child line: `▢ Sequence Log · collect`.
Because the episode's *reference* is part of its content, the reference travels when the episode is bumped or copied — but the Deliverable's identity and lifecycle live in the deliverable domain, not inside the episode. Two episodes may reference the same Deliverable. **[new]**

### 8. Add Materials and a Misconception only when needed
Same `/` gesture. `/materials` → `patty paper · gridded transparencies · Desmos "Tile Moves" scr. 3`. `/misconception` → `"order doesn't matter" — have a pair test reflect-then-rotate both ways`. Each appears as one child line. The supports the teacher *didn't* summon have no representation on screen at all.

### 9. Collapse without losing context
`Escape` collapses the episode back to its spine. The body recedes; nothing is lost. Collapse is not a summary state — it *is* the home state. **[new]**

### 10. Reorder episodes as chunks
Drag the spine, or `Cmd+↑ / Cmd+↓`. The episode moves whole — its outline, supports, and deliverable references travel with it, because the spine *is* the episode. Reordering is normal planning, not correction. **[new]**

### 11. Plan beyond the available class time
Durations sum to 60 min against a 45-min meeting. **Correct and expected.** No warning, no red, no "over by 15 min." At most, a whisper-quiet geometric mark where cumulative durations cross the meeting length — a **tide line**, not a barrier (LP1-7). Below it: simply more spines. A full bank of good work. **[derivable]** from durations.

### 12. Teach from the lesson
**Teaching view** (LP1-14): the same stack in larger type, episode outlines visible, deliverables marked, no editing chrome, one tap to record an outcome. Shows **episode order, authored duration, lesson content, deliverables**. **No wall-clock times.** Prints to the same layout — the primary user teaches from paper. **[new]**

### 13. Mark one episode complete
Tap the spine's status mark → `reached`. Geometry firms (filled mark, slightly stronger weight). No color, no checkmark celebration, no progress bar. **[new]**

### 14. Partially complete another
Mark `partial`. Geometry: half-filled mark. Day 1 stores partial as an **episode-level status only** — no within-episode waterline (Q-EM-3, deferred). The whole episode carries forward with its `partial` origin status intact. **[new]**

### 15. Skip one deliberately
Mark `skipped`. Geometry: hollow mark, spine receded. A deliberate choice, visually distinct from *ran out of time*, and **not an error**. It does not auto-carry-forward (Q-EM-4, resolved for Day 1: the teacher acts). **[new]**

### 16. Bump one or several episodes into the next Lesson Session
Bell rings after episode 5. Teacher multi-selects spines 6–8 (`Shift+click`, or `Shift+↑/↓`) and hits **Bump** (`Cmd+B`, or drags to the tomorrow drop target). For each: the origin placement is **retained** with status `carried-forward`; a new `planned` placement is created in the destination session referencing the **same episode**, with `carry-origin` set. Nothing is rebuilt. The episodes arrive whole. **[new]**

### 17. See the origin trace and destination continuity — without warnings
**Origin trace.** Today's session does *not* go blank where 6–8 were. Each remains as a **ghosted spine** — receded weight, title still legible — reading `carried to Wed`. Yesterday looks like a day where real teaching was planned and the bell came first, which is the truth.
**Destination whisper.** Tomorrow's stack shows each episode with a faint `from Tue` on the spine. Not a badge. Not a color. A whisper.
No error language appears anywhere in this flow. The word "incomplete" does not exist in the product. **[new]**

### 18. Copy an episode to another section
Teacher wants the same warm-up in Periods 4 and 6. From the episode's `···` → **Copy to another section** → pick sections. Each target section receives an **independent duplicate episode** with its own identity, content, placement, and status. Edits do not propagate between copies. Section progress is independent for free (EM-7).
The action is named **Copy**, not *Reuse*, because that is precisely what it does. **Reuse** (one shared episode, many placements, edits propagating until detached — **EM-17**) is a distinct, ratified capability arriving after Day 1. **[new · LP1-15]**

### 19. Edit shared content
**Not available on Day 1.** With Copy, each section's episode is independent; editing Period 2's warm-up does not touch Period 4's. When true **Reuse** ships, editing shared content presents the *Edit all uses / Detach this use* choice specified in §7. Nothing built on Day 1 blocks it: the model already permits many placements → one episode.

### 20. Detach one section's use and revise it independently
**Not applicable on Day 1**, because Copy produces already-independent episodes. **Detach** is the escape valve from **Reuse** and ships with it (§7).

### 21. Add an episode note
`/note` inside an episode → `patty paper made the order-matters point land; 15 min was tight`. On Day 1 this is an **ordinary Block of type note**. It is **not** a durable portable Reflection object, and the spec makes no claim about how it behaves under bump or copy beyond travelling as ordinary episode content.
**Episode-level Reflection as a first-class portable object is deferred** pending **Q-EM-8** (where reflection attaches when an episode is taught across two sessions). Day 1 must not ratify portable episode reflection ahead of the model. **[new — deliberately weak claim]**

### 22. Add whole-session reflection
One quiet line at the foot of the session — *about this meeting*: `P2 needed more launch time than P4 will`. Lives on the **session envelope** (EM-15), non-portable, never travels. Appears only when the teacher reaches for it; no empty reflection box sits waiting. **[exists]**

### 23. Print / calm teaching view
One layout serves both screen-during-class and print:
- episode order (the stack, in sequence)
- authored durations
- episode outlines (visible — during teaching you need the content, not spines)
- deliverables, plainly marked
- generous margins; no interactive chrome
**No wall-clock times.** Derived clock time may be added later, through Today, if it proves useful in practice. It is not required to teach from a lesson. **[new]**

---

## 3. Collapsed episode spine — exact contents

Everything below is what remains **visible at rest**. Anything not named here does not appear.

| Element | At rest? | Notes |
|---|---|---|
| **Title** | ✅ always | The one thing that must always be readable. Never truncated to fit chrome. |
| **Duration** | ✅ **only if authored** | No default duration is ever displayed. A repeated "5 min" down the stack is furniture pretending to be information. **[LP1-1]** |
| **Phase / type** | ✅ **only if authored** | Optional. Most episodes carry none on Day 1. Never auto-assigned. **[LP1-2]** |
| **Learning preview** | ❌ | Would double spine height and pull the stack back toward cards-with-metadata. Open the episode to see its target. **[LP1-3]** |
| **Deliverable glyph** | ✅ **one quiet glyph** (`▢`), if the episode references a deliverable | The single preview exception, retained. Justification: during teaching and printing, *what students turn in* must be scannable without expanding. Glyph only — no title, no due date. **[LP1-4]** |
| **Status geometry** | ✅ if not `planned` | Leading-edge mark: `planned` = thin hollow · `reached` = filled · `partial` = half-filled · `skipped` = hollow, spine receded · `carried-forward` = ghosted spine + trace text. **No color, ever.** **[LP1-5]** |
| **Expand/collapse affordance** | ❌ at rest → on hover/focus | Quiet disclosure triangle in the left gutter. Clicking the title also expands. **[LP1-6]** |
| **Drag handle** | ❌ at rest → on hover/focus | Left gutter. Whole-spine drag also works. |
| **Hover/focus controls** | ❌ at rest → `···` on hover | Overflow only: copy to another section, duplicate, delete. Bump lives in multi-select and keyboard, not per-spine chrome. |
| **Tide line** | ✅ when overplanned | Hairline where cumulative durations cross the meeting length. Geometry only. No label like "over by 15 min." **[LP1-7]** |

**LP1-8 — No index numbers.** Numbers imply fixedness; reordering is the normal state. A bullet, or nothing.

---

## 4. Expanded episode body — how it stays an outliner

**LP1-9 — The body is an outline of Blocks. Nothing else.**

- **Where typing begins.** Expanding places the cursor at the end of the last Block (or in the first empty Block if the episode is new). No click to "enter edit mode." **There is no edit mode.** Reading and writing are the same surface.
- **Indentation.** `Tab` / `Shift+Tab`. Day 1 supports **two levels**. Deeper nesting is deferred — genuinely wanted, but deserves architectural design, not a casual `Tab` handler.
- **Empty state.** A new episode's body is **one empty line with a cursor in it**. Not a prompt. Not a placeholder. Not "What happens?" A blinking cursor is a complete and honest invitation.
- **Support rendering.** Every support — learning, deliverable reference, materials, misconception, note — renders as **a child line with a leading glyph**, in the same outline stream as the teacher's writing. Never a section. Never a header. Never a bordered box.
  - `◎` learning · `▢` deliverable · `◇` materials · `△` misconception · `✎` note
  - Glyphs carry the type. **No ALL-CAPS labels. No field names.** A tiny type word may appear on hover/focus for learnability (**Q-LP1-2**).
- **Existing supports** sit in the outline in the order summoned, visually subordinate to the teacher's prose, because *authored content outranks interface furniture*.
- **No toolbars.** No formatting bar, no per-episode action row, no character counters. Ever.
- **No empty sections.** If an episode has no misconception, the word "misconception" appears nowhere on screen.

**LP1-10 — The `/` summon gesture.**
`/` at the **start of an empty Block** opens a small inline menu at the caret: `learning · deliverable · materials · misconception · note`. Typing filters. `Enter` selects. `Escape` dismisses and leaves a plain empty Block. `/` mid-line is a literal slash (teachers write fractions and dates).
Discoverability is a real risk: a first-time teacher will not guess `/`. Mitigation: a single, dismissible-forever hint line beneath the first episode a teacher ever creates. Not a permanent legend. Not a right rail. **Q-LP1-3** flags whether `/` alone suffices or needs a hover `+` companion.

---

## 5. Keyboard grammar

Design target: **a teacher plans an entire lesson without touching the mouse.**

| Key | Context | Behavior | Confidence |
|---|---|---|---|
| `Enter` | in title | **Move to body, first Block** *(recommended prototype behavior)* | needs testing (**Q-LP1-1**) |
| `Enter` | in a Block | New sibling Block below | high |
| `Shift+Enter` | in a Block | Soft line break within the Block | high |
| `Tab` | in a Block | Indent one level (max 2 on Day 1) | high |
| `Shift+Tab` | in a Block | Outdent one level | high |
| `Escape` | in body | Collapse episode, focus its spine | high |
| `Escape` | in `/` menu | Dismiss menu, leave plain Block | high |
| `Cmd/Ctrl+Enter` | anywhere in an episode | **Create the next episode** below, cursor in its title | high |
| `↑ / ↓` | in body | Move between Blocks (caret-aware) | high |
| `↑ / ↓` | on a spine | Move between spines | high |
| `Backspace` | start of an **empty** Block | Delete the Block, join to previous | high |
| `Backspace` | start of the **only, empty** Block | Do **not** delete the episode. Requires explicit delete. | high — protects authored work |
| `/` | start of an empty Block | Open summon menu | needs testing (**Q-LP1-3**) |
| `Cmd/Ctrl+↑ / ↓` | on a spine | **Reorder** the focused episode | high |
| `Shift+↑ / ↓` | on a spine | Extend multi-select | medium |
| `Cmd/Ctrl+B` | on selected spine(s) | **Bump** to next session | needs testing (**Q-LP1-4**) |
| `Cmd/Ctrl+Z` | anywhere | Undo — **including undoing a bump as one atomic action** | high — non-negotiable |

**The critical ambiguity — `Enter` in the title (Q-LP1-1).** Workflowy semantics say `Enter` = *next sibling*. Writing semantics say `Enter` = *drop into the body and start writing*. Both are defensible; they cannot both be `Enter`. **Recommended prototype behavior: title-`Enter` → body**, with `Cmd+Enter` creating the next episode — matching the observed authoring sequence (*create action → write what happens*). **Must be tested against real planning before ratification.**

---

## 6. Bumping and carry-forward

Sunsama is the behavioral reference — not for drag-and-drop, but for the felt sense that **unfinished work moves forward naturally, is never rebuilt, and never becomes an error, while the prior day keeps its evidence.**

**LP1-11 — Bump is a dual write (EM-5), never a move.**
Origin placement: retained, status → `carried-forward`. Destination: new `planned` placement, **same episode**, `carry-origin` set. The episode is *continued, not copied* — which is what makes it "not rebuilt."

**Single-episode bump.** Focus a spine → `Cmd+B`; or drag to the tomorrow drop target; or `···` → *Move to tomorrow*.

**Multi-select bump.** `Shift+click` or `Shift+↑/↓` selects a contiguous run (the common case: everything below the bell). One `Cmd+B` bumps them all, preserving relative order in the destination.

**Move to next session vs. a chosen session.** Day 1 ships **"move to next session"** — overwhelmingly the common case (tomorrow's meeting of *this same section*). "Move to a chosen future session" is a date-picker flow: **deferred** (§10).

**Partial completion.** A `partial` episode bumps like any other: origin keeps `partial`; destination receives the whole episode. Day 1 does **not** split taught from untaught (Q-EM-1 / Q-EM-3 remain open).

**Origin trace.** The bumped spine **stays** in today's stack as a ghost: receded weight, title legible, quiet trace `carried to Wed`. Today does not go blank. This is the visual form of *enacted truth is preserved*.

**Destination whisper.** In tomorrow's stack, the spine carries a faint `from Tue`. Not a badge. Not a chip. Not a color. A whisper the eye can skip.

**Tomorrow as a drop target.** Day 1: a **narrow peek rail** at the right edge showing the next session's stack — enough to receive a drag and to see what already waits there. Never a full multi-day planner. Lesson Planner composes *one* meeting; it needs only enough of the neighbor to receive a sweep. **Q-LP1-5**: persistent, or summoned on drag?

**Undo.** `Cmd+Z` reverses a bump as **one atomic action** — origin status restored, destination placement removed. A teacher who bumps six episodes and reconsiders must not undo six times. Non-negotiable for trust.

**Why none of this is failure.** Overplanning is deliberate pedagogy: idle time in a middle-school classroom becomes management time. Running the bank dry is the real failure; leaving good work on the table is the *designed outcome*. Therefore no count of unreached episodes, no "3 incomplete," no red, no amber, no warning icon, no "you didn't finish" language appears anywhere. **[LP1-12]**

---

## 7. Reuse, Detach, and Copy

### Day 1 — Copy only
**Copy to another section** creates an **independent duplicate episode** per target section. Own identity, own content, own placement, own status. Edits never propagate. Section progress is independent (EM-7).

**This is a Day 1 scope limit, not a model resolution.** **EM-17 stands: reuse is shared until explicitly detached.** **Q-EM-6 remains open.** Day 1 ships no gesture that *creates* a shared reuse; it does not deny that shared reuse is the intended capability. Copy is honest about what it does, requires no propagation machinery, and is forward-compatible — the model already permits many placements → one episode, so adding Reuse later adds a capability without unbuilding anything.

### After Day 1 — Reuse and Detach (specified now, built later)

**Communicating shared state.** A reused episode's spine carries a quiet lineage glyph (e.g. `⧉`), hover reading `used in P2, P4, P6`. No banner, no color.

**Editing shared content.** The choice appears **at the moment of the first edit**, not before — a two-option inline prompt at the caret:
- **Edit all uses** — a curriculum-quality improvement; propagate to every placement.
- **Detach this use** — this section's teaching diverges; create an independent derived episode here, with lineage preserved.

Default: **Edit all uses** (that is what reuse is *for*, per EM-17). The choice is remembered for the editing session, so it is asked once, not per keystroke.

**Detached lineage without clutter.** A detached episode retains a lineage link to its origin, visible only on hover / in overflow (`detached from P2 warm-up · Sep 15`). Lineage is *retrievable*, never *displayed at rest*.

**Why Reuse must not look like Bump.** Both create a second placement of one episode. Reuse reads as **deliberate repetition** — equal, present placements, no ghost, no whisper. Bump reads as **continuation** — origin ghost plus destination whisper. If they looked alike, a teacher could not distinguish *"I meant to teach this three times"* from *"I ran out of time."* Geometry must carry that difference, quietly.

---

## 8. Deliverables

**LP1-14 — A Deliverable is a durable shared domain object. An episode *references* it.**

A Teaching Episode may create or reference **zero or more** Deliverables. It **does not own their identity or lifecycle**. Deliverables live in a shared deliverable domain; two episodes (or two sections' episodes) may reference the same Deliverable. When an episode moves — bumped, copied, reordered — its **deliverable references travel with it**.

Day 1 minimum:
- **Create from within an episode.** `/deliverable` → name it → a durable Deliverable object is created in the deliverable domain, and the episode holds a reference to it.
- **Reference an existing deliverable.** Same gesture; the `/deliverable` menu lists existing deliverables above *create new*.
- **Promote authored text.** Select a written phrase (`Sequence Log`) → promote to a Deliverable. **Recommended, but deferred to "useful soon after"**: it matches how teachers actually notice deliverables (mid-sentence), but `/deliverable` meets the same need on Day 1 with far less mechanism. **Q-LP1-6.**
- **Optional collect timing.** `collect` / `next class` / a date / blank. **Blank is the default** — no due date is asserted on the teacher's behalf.
- **Teaching and print view.** Deliverables appear plainly — *what students turn in* must be scannable during class.
- **Identity preserved for the future.** Every Deliverable carries a stable ID and records its originating episode. **No gradebook complexity is exposed now** — no points, no grading status, no LMS fields, no publish toggle. The ID exists so those can arrive later without a migration.

---

## 9. State-by-state walkthrough (summary)

| State | What the teacher sees | Primary gesture |
|---|---|---|
| **Session opens** | Collapsed stack of spines. Nothing else. | scan |
| **Empty session** | One empty spine, cursor in it. | type |
| **Episode created** | Cursor in title. | type → `Enter` |
| **Body open** | Outline, cursor at last Block. | write |
| **Summoning support** | Inline menu at caret. | `/` |
| **Support attached** | One child line, glyph-led. | continue writing |
| **Collapsed** | Spine returns; body recedes. | `Escape` |
| **Reordering** | Spine lifts, stack parts. | drag / `Cmd+↑↓` |
| **Overplanned** | More spines below a quiet tide line. | *no action required* |
| **Teaching** | Larger type, outlines visible, deliverables marked, no clock. | tap status |
| **Bumping** | Spines lift toward the peek rail. | `Cmd+B` / drag |
| **Bumped (origin)** | Ghosted spine, `carried to Wed`. | *nothing* |
| **Bumped (destination)** | Whole episode, `from Tue` whisper. | *nothing* |
| **Copying to a section** | Independent duplicate appears in target. | `···` → Copy |
| **Session reflection** | One quiet line at the session's foot. | reach for it |

---

## 10. Day 1 scope table

| Capability | Verdict |
|---|---|
| Collapsed spine stack (title, authored duration only) | **Must work by Day 1** |
| Create episode; title → body in one keystroke | **Must work by Day 1** |
| Outline body: Blocks, `Enter`, 2-level `Tab`/`Shift+Tab` | **Must work by Day 1** |
| `/` summon: learning, deliverable, materials, misconception, note | **Must work by Day 1** |
| Deliverable as a durable **shared domain object**, referenced by episodes | **Must work by Day 1** |
| Reorder episodes (drag + `Cmd+↑↓`) | **Must work by Day 1** |
| Authored episode durations | **Must work by Day 1** |
| Overplanning with no severity signal; quiet tide line | **Must work by Day 1** |
| Status: reached / partial / skipped, as geometry | **Must work by Day 1** |
| Bump to next session (single + multi-select), dual write | **Must work by Day 1** |
| Origin ghost trace + destination whisper | **Must work by Day 1** |
| Atomic undo of a bump | **Must work by Day 1** |
| Teaching view + print: order, duration, content, deliverables | **Must work by Day 1** |
| Independent progress across sections | **Must work by Day 1** (free from the model) |
| **Copy to another section** (independent duplicate) | **Must work by Day 1** |
| Whole-session reflection (envelope) | **Must work by Day 1** |
| Ordinary episode **note** (`/note`, not a Reflection object) | **Must work by Day 1** |
| Trustworthy persistence | **Must work by Day 1** — trust precedes capability |
| **Reuse** (shared episode, many placements, EM-17) | Useful soon after |
| **Detach** (+ "Edit all uses / Detach this use" choice) | Useful soon after |
| Promote authored text → Deliverable | Useful soon after |
| Move to a *chosen* future session (date picker) | Useful soon after |
| Split / merge episodes | Useful soon after |
| Within-episode waterline (partial to a specific Block) | Useful soon after |
| Curriculum import from Units into a session | Useful soon after |
| Rich text (bold / italic / underline) | Useful soon after |
| **Episode-level Reflection as a durable portable object** | **Deferred — blocked on Q-EM-8** |
| **Derived wall-clock times (via Today)** | **Deferred — add only if proven useful** |
| Deep nesting (3+ levels) | Deliberately deferred — needs architecture |
| Curriculum publish-back from session → Units | Deliberately deferred |
| Gradebook, points, LMS export, publish toggles | Deliberately deferred |
| Student observations, seating, groups | Deliberately deferred |
| Backend persistence (Day 1 stays local) | Deliberately deferred |
| Episode library / reusable episode search | Deliberately deferred |

---

## 11. Model questions this spec touches

**EM-17 — preserved and unaltered.** *Reuse is shared until explicitly detached.* Day 1 ships **Copy** (an independent duplicate) as its only cross-section action. This is a **scope limit**. It does not resolve, weaken, or contradict EM-17.

**Q-EM-6 (reuse: shared content vs. clone) — remains OPEN.** Revision 1 of this spec incorrectly marked it "operationally resolved as clone." That was a scope decision improperly dressed as a model resolution, and it is withdrawn. The model continues to intend shared reuse; Day 1 simply does not ship the gesture that creates it.

**Q-EM-8 (episode reflection under movement) — remains OPEN, and Day 1 respects it.** Day 1 permits an ordinary episode **note** and makes **no claim** that it is a durable portable Reflection object. Episode-level Reflection as a first-class portable object is **deferred** until Q-EM-8 is resolved. Whole-session reflection (EM-15, envelope-owned, non-portable) ships on Day 1.

**EM-14 (duration authored; clock time derived and owned elsewhere) — honored by omission.** Day 1 ships authored durations and **no derived wall-clock times at all**. Teaching and print views show order, duration, content, and deliverables. Derived clock time may arrive later through Today, if it earns its place in practice.

**Q-EM-4 (skip → carry-forward) — resolved for Day 1:** skip does **not** auto-carry. The teacher acts.

**Still open, untouched, not blocking Day 1:** Q-EM-1 (partial: split vs. waterline), Q-EM-2 (merge status reconciliation), Q-EM-3 (waterline granularity), Q-EM-5 (split/merge identity), Q-EM-7 (phase/type taxonomy).

---

## 12. Five highest-risk interaction decisions requiring prototype testing

1. **`Enter` in the title (Q-LP1-1).** Body vs. next-episode. Sets the authoring rhythm at the very first keystroke a teacher ever types. Test by planning three real lessons and counting mouse reaches.
2. **`/` discoverability (Q-LP1-3).** The entire "no empty sections" philosophy rests on a gesture a first-time teacher cannot guess. If `/` isn't found, teachers will conclude the supports don't exist. Test with a teacher who has never seen the product.
3. **The bump gesture (Q-LP1-4).** Must feel like a light sweep forward — the *reward* for good overplanning — not an admission of failure. If it feels heavy or bureaucratic, the product's core pedagogical stance is undermined at the exact moment it matters most. Test at 2:55pm, tired, in a hurry.
4. **The tide line (Q-LP1-7).** Communicating "you have planned past the bell" as *abundance*, with geometry only and zero severity. Very easy to accidentally make this feel like a warning. Test by asking a teacher what it makes them *feel*.
5. **The origin ghost (LP1-11).** Does yesterday's ghosted spine read as *honest evidence* or as *clutter*? This is the whole Sunsama bet. If teachers reflexively want to dismiss the ghosts, the evidence-preservation model has an interaction problem worth discovering early.

---

## 13. First vertical implementation slice

**Slice: "Plan one real lesson, end to end, without the mouse."**

Build only:
- The collapsed spine stack (title + authored duration; hover-only chevron and drag handle).
- Create episode → title → `Enter` → body.
- Outline body: Blocks with `Enter`, `Tab`, `Shift+Tab` (2 levels), `Backspace`-join, `Escape` to collapse.
- `Cmd+Enter` → next episode. `Cmd+↑↓` → reorder.
- `/` summoning **three** support types only: **learning, deliverable, materials**. (Misconception and note follow immediately; three proves the gesture.)
- **Deliverable created as a durable shared domain object with a stable ID, referenced by the episode.** No due dates, no gradebook, no promotion-from-text.
- Local persistence that never loses work.

**Explicitly not in the slice:** bumping, status, teaching view, print, sections, copy, reuse, reflection, tide line, clock times.

**Why this slice.** It is the smallest thing that answers the two questions everything else depends on — *does the title → body → next-episode rhythm actually feel like writing?* and *is `/` discoverable?* — while producing a genuinely usable artifact: a real, complete lesson plan for a real class. If a teacher can plan Lesson 1.3 in this slice faster and more calmly than on paper, the interaction model is validated, and bumping, status, and teaching view become straightforward additions on a proven foundation. If they can't, everything downstream would have been built on sand.

**Note on the Deliverable in this slice.** Even though nothing in the slice *moves* an episode, the Deliverable must be built as a **referenced domain object with a stable ID from the first commit**. Building it as episode-owned text and refactoring later would break identity exactly when bump and copy arrive — the migration this design exists to avoid.

**Test protocol after the slice:** plan three authentic lessons. Count mouse reaches. Note every moment of hesitation. Harvest observations into research; promote only what is earned.
