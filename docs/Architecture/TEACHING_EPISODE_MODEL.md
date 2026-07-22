# Teaching Episode Model — Information-Model Amendment

**Document Status:** Foundational Architecture · Amendment (append-only)
**Amends:** `LESSON_PLANNER.md`, `LESSON_PLANNER_INFORMATION_MODEL.md`
**See also:** `ENACTMENT_MODEL.md` — defines the broader enactment architecture (Session Enactment, the Post-Class Debrief, and full Placement Enactment detail). This document is a focused view of the Teaching Episode → Episode Placement → Placement Enactment chain, not a supersession of that document.
**Purpose:** Establish the **Teaching Episode** as the durable, portable, first-class object of Lesson Planner, and define how episodes are placed in sessions, how enacted truth is recorded, and how episodes move, reuse, split, merge, and skip without corrupting instructional history.

> This amendment is self-contained. It assumes no knowledge of the conversation that produced it.

---

## 0. Why this amendment exists

`LESSON_PLANNER_INFORMATION_MODEL.md` states that *everything inside Lesson Planner hangs from a Lesson Session* — the session **contains** its instructional segments by ownership.

Authentic classroom practice contradicts strict containment. The following are normal, required behaviors, not edge cases:

- Overplan and bump several teaching chunks to a later day.
- Partially complete a chunk and continue it next meeting.
- Have different sections finish in different places.
- Reuse a warm-up across sections.
- Split one chunk into two.
- Merge two chunks into one.
- Skip a chunk during instruction.

A chunk that can move from Tuesday to Wednesday **cannot be owned by Tuesday** — if it were, leaving Tuesday would destroy it, and Tuesday would lose the record that it was ever planned there.

This amendment resolves the contradiction by **refining containment into reference** and by **separating three things that the current model conflates**: the durable content, its placement in a session, and the enacted status of that placement.

**Superseded statement (recorded, not deleted, per append-only culture):**
> *"Everything inside Lesson Planner hangs from a Lesson Session."*
> — refined by **EM-2**: a Lesson Session **references** an ordered sequence of episodes; it does not **contain** them by ownership. The session still owns its envelope (see EM-15).

---

## 1. The three layers (the core distinction)

Every reader of this document must hold these three layers apart. Most modeling errors in this domain come from collapsing two of them. This section describes these three layers as they relate to Teaching Episodes; the full enactment architecture — including Session Enactment and the Post-Class Debrief that creates both Session and Placement Enactments — is defined in `ENACTMENT_MODEL.md`.

| Layer | Object | Answers | Portable? | Where enacted truth lives |
|---|---|---|---|---|
| **1. Content** | **Teaching Episode** | *What is this piece of teaching?* | **Yes** — travels intact | never here |
| **2. Placement** | **Episode Placement** | *Where does this episode sit, and how did it get here?* | per session | never here |
| **3. Enactment** | **Placement Enactment** | *What happened to this episode in **this** session?* | never — stays behind | **here, and only here** |

Stated as one sentence:

> **A Teaching Episode is durable content. An Episode Placement is a session's ordered reference to that content. A Placement Enactment is the enacted truth of that one reference, recorded through the Post-Class Debrief. Content travels; enacted truth does not.**

*Terminology note: this layer was previously named "Placement Status" in this document. It is renamed to **Placement Enactment** for consistency with `ENACTMENT_MODEL.md` and `LESSON_PLANNER_INFORMATION_MODEL.md`, which use that name for the same object. The status values and behavior below are unchanged.*

### Layer 1 — Teaching Episode (durable content)

The authored, movable unit of teaching. A teacher-chosen chunk of classroom experience — a number talk, a launch, a full test day. Granularity is the teacher's; the system never imposes a rhythm.

A Teaching Episode owns:

- title
- pedagogical phase / logistics type (see Q-EM-7)
- its **interior outline** — an ordered list of **Blocks** (see §7)
- authored **estimated duration** (EM-14)
- **learning-target** references
- **deliverables** (first-class objects; own lifecycle)
- **materials**, **misconceptions**, and other summoned supports
- **Episode Note** (durable reflection that travels with the episode — distinct from the Session Note; see EM-15, Q-EM-8)
- **provenance / curriculum attachment** (EM-16)
- **lineage** links for split/merge (EM-9, EM-10)

A Teaching Episode **does not know** which session it is in, what order it sits in, or whether it was taught. Those facts are not properties of the teaching; they are properties of an occasion.

### Layer 2 — Episode Placement (placement in a session)

A per-session record that points a Lesson Session at one Teaching Episode. It owns:

- reference to exactly one Teaching Episode
- **order index** within that session
- **carry-origin** — nullable reference to the placement this one continues from (see EM-8; this single field is what distinguishes movement from reuse)

One Teaching Episode may be referenced by **many** placements (across sections, across days). A placement references exactly **one** episode.

### Layer 3 — Placement Enactment (enacted outcome of the placement)

A Placement Enactment is the enacted truth of a single placement — the only layer that records what happened. It is a distinct record, created and updated only through the Post-Class Debrief (see `ENACTMENT_MODEL.md`, "Canonical Entry Point"), that references the Episode Placement it describes. It is enacted truth, not a mutable field embedded on the Episode Placement itself. One status per placement:

- `planned` — placed, not yet taught
- `reached` — taught to completion here
- `partial` — begun, not finished (optional within-episode waterline; see EM-6, Q-EM-3)
- `skipped` — deliberately omitted here (distinct from not-reached; EM-11)
- `carried-forward` — the bell rang before this was reached and its continuation was placed elsewhere (EM-5)

Enacted status never lives on the episode content. Editing an episode's content never rewrites a past placement's Placement Enactment. This is the invariant that keeps history honest (see §12).

---

## 2. Ratified decisions

Each decision is stated with rationale and a data-provenance tag: **[exists]**, **[derivable]**, or **[new]** (requires new data model). Numbering is namespaced `EM-n` to avoid collision with the existing `D`/`DR`/`Q` series; slot into `LESSON_PLANNER_DECISIONS.md` at integration.

**EM-1 — The Teaching Episode is the durable authored object.**
The unit a teacher builds, reads, revises, and reuses is the episode, not the lesson document and not the session. **[new]** for identity; the fields it carries mostly **[exist]** as today's "Instructional Segment."

**EM-2 — A Lesson Session is a dated instructional envelope that references an ordered sequence of Episode Placements.**
It does not own episodes by containment. It owns its meeting identity and its ordered Episode Placements; the Session Note belongs to the Session Enactment, not the envelope (EM-15; see `ENACTMENT_MODEL.md`). **[new]** (reference relationship replaces containment).

**EM-3 — Episode Placement is the per-session record of an episode's position and origin.**
Order index plus carry-origin. It is the reconciliation of the ambiguous "LessonSessionItem" (see §6). **[new]**

**EM-4 — Placement Enactment carries all enacted truth, and is created only through the Post-Class Debrief.**
No enacted status is ever stored on episode content, and no enacted status is stored as a mutable field on the Episode Placement itself. A Placement Enactment is a distinct enacted-truth record referencing its Episode Placement (see `ENACTMENT_MODEL.md`). **[new]**

**EM-5 — Bumping is a dual write.**
Moving an unreached (or partial) episode from session S₁ to S₂:
1. **S₁ retains its placement.** Its status becomes `carried-forward` (or `partial` + carried-forward). The placement is **not** deleted. S₁ still shows the episode was planned there and the bell arrived first.
2. **S₂ receives a new placement** referencing the **same** Teaching Episode, with `carry-origin` = the S₁ placement, status `planned`.
3. **The episode content is unchanged and shared.** One episode, two placements, two independent statuses.
This preserves evidence of earlier work rather than making the prior day look as though the episode never existed. **[new]**

*Note: whether `carried-forward` is best represented as its own status value (as used above) or as an outcome plus a separate carry-forward consequence (e.g., `partial` plus a distinct carry-forward relationship) is an open question tracked as Q-EN-3 in `ENACTMENT_MODEL.md`. This document preserves the behavior described above; the representation is not settled by this amendment.*

**EM-6 — Partial completion is a status, optionally with a within-episode waterline.**
An episode may be `partial`: begun, not finished. The status may carry a pointer to how far the interior got (the "waterline"). Whether partial completion *splits* the episode or merely *marks* a waterline that carries the whole episode forward is open (Q-EM-1). **[new]**

**EM-7 — Progress is independent per section because a Lesson Session is one section's one meeting.**
Section A's Tuesday session and Section B's Tuesday session are distinct envelopes. They may reference the **same** episodes (reuse, EM-8), but each placement carries its own status. Section A reaching an episode has no effect on Section B's placement of it. **[derivable]** from EM-2/EM-3 once sessions are per-section.

**EM-8 — Reuse and movement are the same mechanism (a second placement of one episode) distinguished only by the carry-origin link.**
- **Reuse** (e.g. one warm-up across three sections): multiple placements of one episode, each `carry-origin = null`. All are first-class intended uses; none is a remnant.
- **Movement / bump**: the destination placement has `carry-origin` set to the origin placement, and the origin is marked `carried-forward`.
The reason a second placement exists is therefore always legible from data, never guessed. Whether reuse shares one content object or clones it is open and consequential (Q-EM-6). **[new]**

**EM-9 — Split divides one episode into two, with lineage preserved.**
Splitting produces two episodes. Each child inherits the parent's provenance and curriculum attachment (EM-16) and records a lineage link to the parent. Typical instructional case: the taught portion stays as `reached`/`partial` on its origin placement; the untaught remainder becomes a new episode eligible for carry-forward. Identity rules for the children are open (Q-EM-5). **[new]**

**EM-10 — Merge combines two episodes into one, with lineage preserved.**
The merged episode's interior is the concatenation of the parents' Blocks; curriculum attachments union; lineage records both parents. Reconciling conflicting placement statuses on merge is open (Q-EM-2). **[new]**

**EM-11 — Skip is a status distinct from not-reached, and is never an error.**
`skipped` means the teacher deliberately chose not to teach the episode in this session. It is different from `carried-forward` (ran out of time). A skip does not automatically carry forward; carry-forward remains a separate teacher action (EM-12, Q-EM-4). **[new]**

**EM-12 — Carry-forward is a teacher action that produces a continuation placement, available from any incomplete status.**
`planned`, `partial`, and `skipped` placements can all be carried forward. Carry-forward is the dual write of EM-5; it is never automatic and never silent about the origin. **[new]**

**EM-13 — Overplanning is a valid and expected state, never an error or a severity condition.**
The sum of an envelope's planned episode durations may exceed the meeting length **by design** — a full bank of meaningful work prevents idle time. Unreached episodes at the bell are the **intended surplus**, not a shortfall. Therefore: no red, no warning badge, no "incomplete" count, no severity signal of any kind attaches to overplanning or to unreached episodes. Any awareness of the planned-vs-available gap is **geometry, not color**, and whisper-quiet (consistent with *color encodes severity only* and *silence is a reward*). **[derivable]** from durations (EM-14); **[new]** as an explicit non-severity rule.

**EM-14 — Estimated duration is authored on the episode; clock time is derived and owned elsewhere.**
Each episode carries an authored estimated duration. Wall-clock times (start/end per episode) are **derived** from the meeting start (supplied by Today) plus cumulative durations, and belong to Today/Forecast — **never** stored on the episode. Because episodes move and overplanning is expected, stored clock stamps would be fiction. This resolves the standing "does a clock column belong in Lesson Planner" question: no. Duration: **[exists]**. Derived clock time: **[derivable]**.

**EM-15 — The Session Note belongs to the Session Enactment; the Episode Note stays on the episode.**
Two reflection homes, deliberately separate:
- **Session Note** — about *this meeting* (this section, this date). Non-portable, historical. It belongs to the Session Enactment, created through the Post-Class Debrief (see `ENACTMENT_MODEL.md`) — not to the Lesson Session envelope itself.
- **Episode Note** — about *this piece of teaching*. Portable. Travels with the episode.
The Lesson Session envelope owns the meeting identity handed down by Today (course, section, date, period) and its ordered Episode Placements; it does not itself hold the Session Note. The "lesson" is the envelope plus its referenced episodes — the collection claim (EM-2) is true of the lesson's **body**, not its **envelope**. **[exists]** as concepts; **[new]** as an explicit split.

**EM-16 — Provenance and curriculum attachment live on episode content and travel with it.**
Learning-target references, deliverable objects, materials, and the Planned-Curriculum-Lesson link are properties of the Teaching Episode. When an episode is bumped or reused, these travel automatically because they are part of the content, not the placement. Split and merge propagate them per EM-9/EM-10. A moving episode never loses its curriculum meaning. **[exists]** for the links; **[new]** for travel-with-content guarantee.

---

## 3. Object shape (relationship summary)

```text
LessonSession  (envelope — dated, per-section)
  ├── meeting identity        (from Today: course, section, date, period)   [exists]
  ├── → SessionEnactment  (session-level facts and Session Note; created
  │     via the Post-Class Debrief — see `ENACTMENT_MODEL.md`)               [see ENACTMENT_MODEL.md]
  └── ordered [ EpisodePlacement ]                                           [new]
         ├── order index                                                     [new]
         ├── carry-origin  → EpisodePlacement | null                         [new]
         ├── → PlacementEnactment  (planned | reached | partial | skipped |
         │     carried-forward  [+ optional waterline]; created via the
         │     Post-Class Debrief — see `ENACTMENT_MODEL.md`)                [new]
         └── → TeachingEpisode  (durable content, shared)                    [new id]
                 ├── title                                                   [exists]
                 ├── phase / type                                            [exists → split, Q-EM-7]
                 ├── estimated duration                                      [exists]
                 ├── ordered [ Block ]  (interior outline)                   [exists as notes]
                 ├── learning-target refs                                    [exists]
                 ├── [ Deliverable ]  (first-class)                          [exists → new lifecycle]
                 ├── materials / misconceptions / supports                   [exists]
                 ├── Episode Note  (portable)                                [derivable]
                 ├── provenance / curriculum link                            [exists]
                 └── lineage  (split/merge parents)                          [new]
```

Derived, never stored on the episode:
```text
per-episode clock start/end   =  meeting start (Today)  +  Σ durations   [derivable]
planned-vs-available gap      =  Σ durations  −  meeting length          [derivable]
```

---

## 4. Invariants (must always hold)

These are the safety rails. A violation is a defect regardless of how convenient it looks.

1. **Enacted status never lives on episode content.** It lives only in a Placement Enactment, which references the placement it describes.
2. **Editing episode content never alters any past Placement Enactment.** History is immutable through content edits.
3. **Bumping never deletes the origin placement.** The origin is marked, not erased.
4. **One episode may have many placements; a placement has exactly one episode.**
5. **A moving episode never loses provenance or curriculum attachment.**
6. **No unreached, partial, skipped, or carried-forward state is ever rendered as severity (no color, no error).**
7. **Clock time is never stored on an episode.**

---

## 5. Behavior walk-throughs (for the relay to verify against)

**Overplan and bump.** Envelope holds 8 episodes summing to 60 min; meeting is 45 min. Expected. Bell rings after episode 5. Episodes 6–8: origin placements marked `carried-forward`; three new `planned` placements created in the next session, each `carry-origin` set, same content shared. Yesterday still shows 6–8 existed and were carried forward.

**Partial completion.** Episode 4 begun, not finished. Origin placement `partial` (+ waterline). Carried forward to next session as a new `planned` placement of the same episode (Q-EM-1 decides whether the remainder is a split or the whole episode with a waterline).

**Different sections.** Section A reaches episode 6; Section B reaches episode 4. Same episodes referenced by both sessions; A's and B's placements carry independent statuses. Neither affects the other.

**Reuse a warm-up.** One warm-up episode; three sections' sessions each hold a placement with `carry-origin = null`. Editing the shared warm-up's content propagates to all three **iff** reuse shares content (Q-EM-6, unresolved).

**Split during instruction.** Episode 3 half-taught. Split → 3a (taught, `reached`/`partial`, origin placement) and 3b (remainder, new episode, carried forward). Both inherit provenance; lineage links to 3.

**Merge.** Episodes 2 and 3 merged into one; interior Blocks concatenated; curriculum attachments unioned; lineage records both. Status reconciliation per Q-EM-2.

**Skip.** Episode 5 deliberately omitted today → `skipped`. Not an error, not auto-carried. Teacher may later carry it forward (EM-12).

---

## 6. Naming reconciliation (resolving the LessonSessionItem / Block collision)

The term **"LessonSessionItem"** was used ambiguously to mean both the movable teaching chunk and a session's ordered entry. It is **retired**. Its two meanings are now distinct objects:

| Old / synonym term | Now | Meaning |
|---|---|---|
| "LessonSessionItem" (as the chunk), "Instructional Segment", session-level "line item" | **Teaching Episode** | durable, portable content (Layer 1) |
| "LessonSessionItem" (as the session's ordered entry) | **Episode Placement** | per-session reference + order + origin (Layer 2) |
| "Block", interior "line item", interior "timed line item" | **Block** | one line of an episode's interior outline (Layer 1's interior) |

Rule of thumb for the relay: **Episode** = the card. **Placement** = where the card sits in a day. **Block** = a line inside the card.

---

## 7. Interior of an episode (Blocks) — scope note

An episode's interior is an ordered list of **Blocks** (the outline the teacher writes down through). Supports (learning targets, deliverables, materials, misconceptions) attach to the **episode**, so they travel with it (EM-16). Whether a support is modeled as a typed Block or as a separate typed attachment on the episode is **not settled here** and is folded into the existing item-taxonomy open question (Q-EM-7). This amendment establishes only that the interior is ordered Blocks and that supports live at episode level, not at placement level.

---

## 8. Open questions (unresolved — resolve before build)

Namespaced `Q-EM-n`. These block implementation of the affected behavior only.

- **Q-EM-1 — Partial-completion mechanics.** Does `partial` + carry-forward *split* the episode (taught vs. remainder become two episodes) or carry the whole episode with a waterline pointer? Affects EM-6, EM-9.
- **Q-EM-2 — Merge status reconciliation.** When two placements with different statuses are merged, what status results, and what lineage is recorded? Affects EM-10.
- **Q-EM-3 — Waterline granularity.** Is the within-episode waterline per-episode only, or per-Block? Affects EM-6.
- **Q-EM-4 — Skip → carry-forward.** Does a `skipped` episode auto-offer carry-forward, or stay put until the teacher acts? Affects EM-11/EM-12.
- **Q-EM-5 — Split/merge identity.** New IDs for all children with lineage links, or does one child retain the parent ID? Affects EM-9/EM-10 and any external references to episode IDs.
- **Q-EM-6 — Reuse: shared content vs. clone.** *(Consequential — ties to sibling-section propagation / "compose once, apply to many.")* When one episode is reused across sections, is it one content object referenced by all placements (edits propagate) or a per-placement copy (edits diverge)? Recommendation to test, not yet ratified: **shared content by default** (that is the point of reuse), with per-placement content overrides deferred rather than designed in now. This is the single most important open question in the amendment.
- **Q-EM-7 — Interior taxonomy & support placement.** Split of `phase` (pedagogical) from `type` (logistics); and whether supports are typed Blocks or separate episode-level attachments. Folds into the existing item-taxonomy item.
- **Q-EM-8 — Episode Note under movement.** Does the Episode Note travel with a bumped episode? If an episode is partially taught across two sessions, where does its reflection attach — to the content (portable, as an Episode Note) or to each placement (per-occasion)? Affects EM-15.

---

## 9. What this amendment does **not** change

- The Planned / Enacted / Interpretation domain boundaries stand; this amendment refines *where* enacted truth is recorded, not the domains.
- Curriculum protection stands: session changes remain default-owned by the Lesson Session; curriculum improvement remains an explicit, intentional action.
- Today remains the owner of meeting identity and clock time.
- The interaction model is **not** decided here. Spine/body geometry, the bump gesture, waterline rendering, and the summon mechanism are decisions-log / interaction items, proposed separately.
