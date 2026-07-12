# Teaching Episode Model — Information-Model Amendment

**Document Status:** Foundational Architecture · Amendment (append-only)
**Amends:** `LESSON_PLANNER.md`, `LESSON_PLANNER_INFORMATION_MODEL.md`
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

Every reader of this document must hold these three layers apart. Most modeling errors in this domain come from collapsing two of them.

| Layer | Object | Answers | Portable? | Where enacted truth lives |
|---|---|---|---|---|
| **1. Content** | **Teaching Episode** | *What is this piece of teaching?* | **Yes** — travels intact | never here |
| **2. Placement** | **Episode Placement** | *Where does this episode sit, and how did it get here?* | per session | never here |
| **3. Status** | **Placement Status** | *What happened to this episode in **this** session?* | never — stays behind | **here, and only here** |

Stated as one sentence:

> **A Teaching Episode is durable content. An Episode Placement is a session's ordered reference to that content. A Placement Status is the enacted truth of that one reference. Content travels; status does not.**

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
- **episode-level reflection** (travels with the episode — distinct from session reflection; see EM-15, Q-EM-8)
- **provenance / curriculum attachment** (EM-16)
- **lineage** links for split/merge (EM-9, EM-10)

A Teaching Episode **does not know** which session it is in, what order it sits in, or whether it was taught. Those facts are not properties of the teaching; they are properties of an occasion.

### Layer 2 — Episode Placement (placement in a session)

A per-session record that points a Lesson Session at one Teaching Episode. It owns:

- reference to exactly one Teaching Episode
- **order index** within that session
- **carry-origin** — nullable reference to the placement this one continues from (see EM-8; this field distinguishes continuation from deliberate reuse)
- **content relationship** — shared reference to the episode unless this placement has been explicitly detached into a derived episode (EM-17)

One Teaching Episode may be referenced by **many** placements across sections and days. A placement references exactly **one** episode. Reused placements share episode content until the teacher explicitly detaches one use.

### Layer 3 — Placement Status (enacted status of the placement)

The enacted truth of a single placement — the only layer that records what happened. One status per placement:

- `planned` — placed, not yet taught
- `reached` — taught to completion here
- `partial` — begun, not finished (optional within-episode waterline; see EM-6, Q-EM-3)
- `skipped` — deliberately omitted here (distinct from not-reached; EM-11)
- `carried-forward` — the bell rang before this was reached and its continuation was placed elsewhere (EM-5)

Status **never** lives on the episode content. Editing an episode's content **never** rewrites the status of any past placement. This is the invariant that keeps history honest (see §12).

---

## 2. Ratified decisions

Each decision is stated with rationale and a data-provenance tag: **[exists]**, **[derivable]**, or **[new]** (requires new data model). Numbering is namespaced `EM-n` to avoid collision with the existing `D`/`DR`/`Q` series; slot into `LESSON_PLANNER_DECISIONS.md` at integration.

**EM-1 — The Teaching Episode is the durable authored object.**
The unit a teacher builds, reads, revises, and reuses is the episode, not the lesson document and not the session. **[new]** for identity; the fields it carries mostly **[exist]** as today's "Instructional Segment."

**EM-2 — A Lesson Session is a dated instructional envelope that references an ordered sequence of Episode Placements.**
It does not own episodes by containment. It owns its meeting identity and its whole-session reflection (EM-15). **[new]** (reference relationship replaces containment).

**EM-3 — Episode Placement is the per-session record of an episode's position and origin.**
Order index plus carry-origin. It is the reconciliation of the ambiguous "LessonSessionItem" (see §6). **[new]**

**EM-4 — Placement Status carries all enacted truth, and lives only on the placement.**
No enacted status is ever stored on episode content. **[new]**

**EM-5 — Bumping is a dual write.**
Moving an unreached (or partial) episode from session S? to S?:
1. **S? retains its placement.** Its status becomes `carried-forward` (or `partial` + carried-forward). The placement is **not** deleted. S? still shows the episode was planned there and the bell arrived first.
2. **S? receives a new placement** referencing the **same** Teaching Episode, with `carry-origin` = the S? placement, status `planned`.
3. **The episode content is unchanged and shared.** One episode, two placements, two independent statuses.
This preserves evidence of earlier work rather than making the prior day look as though the episode never existed. **[new]**

**EM-6 — Partial completion is a status, optionally with a within-episode waterline.**
An episode may be `partial`: begun, not finished. The status may carry a pointer to how far the interior got (the "waterline"). Whether partial completion *splits* the episode or merely *marks* a waterline that carries the whole episode forward is open (Q-EM-1). **[new]**

**EM-7 — Progress is independent per section because a Lesson Session is one section's one meeting.**
Section A's Tuesday session and Section B's Tuesday session are distinct envelopes. They may reference the **same** episodes (reuse, EM-8), but each placement carries its own status. Section A reaching an episode has no effect on Section B's placement of it. **[derivable]** from EM-2/EM-3 once sessions are per-section.

**EM-8 — Reuse and movement both create additional placements, but their intent remains distinct and explicit.**
- **Reuse** (for example, one warm-up across three sections): multiple placements reference one shared Teaching Episode, each with `carry-origin = null`. All are deliberate first-class uses; none is a remnant.
- **Movement / bump**: the destination placement references the continuing Teaching Episode, sets `carry-origin` to the origin placement, and the origin is marked `carried-forward`.

The reason an additional placement exists is always legible from data, never guessed. Reuse begins shared and may later detach under EM-17. **[new]**

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

**EM-15 — Whole-session reflection stays on the Lesson Session envelope; episode reflection stays on the episode.**
Two reflection homes, deliberately separate:
- **Session reflection** — about *this meeting* (this section, this date). Non-portable. Lives on the envelope.
- **Episode reflection** — about *this piece of teaching*. Portable. Travels with the episode.
The session envelope also owns the meeting identity handed down by Today (course, section, date, period). The "lesson" is the envelope plus its referenced episodes — the collection claim (EM-2) is true of the lesson's **body**, not its **envelope**. **[exists]** as concepts; **[new]** as an explicit split.

**EM-16 — Provenance and curriculum attachment live on episode content and travel with it.**
Learning-target references, deliverable references, materials, and the Planned-Curriculum-Lesson link are properties of the Teaching Episode. When an episode is bumped or reused, these travel automatically because they are part of the content, not the placement. Split and merge propagate them per EM-9/EM-10. A moving episode never loses its curriculum meaning. **[exists]** for the links; **[new]** for the travel-with-content guarantee.

**EM-17 — Reuse is shared until explicitly detached.**
Reusing an episode creates another placement that references the same Teaching Episode. Shared edits therefore propagate to every placement using that episode.

When one section or occasion needs a variation, the teacher may **detach** that placement. Detaching:

1. creates a new Teaching Episode with a new durable identity;
2. copies the current content of the shared source episode;
3. preserves a `derived-from` lineage reference to the source;
4. redirects only the selected placement to the new episode; and
5. leaves all other placements attached to the original shared episode.

Detachment is explicit, not silently triggered by typing. When editing shared content, the interaction must make the scope clear and offer the teacher a meaningful choice such as **Edit all uses** or **Detach this use**. This preserves compose-once reuse without surprising propagation or accidental divergence. **[new]**

**EM-18 — Deliverable is a durable shared domain object, not an episode-owned text field.**
A Deliverable represents evidence students produce or demonstrate. It has an identity and lifecycle independent of the interface in which it was first created.

A Teaching Episode may reference zero or more Deliverables. Lesson Planner may create a Deliverable while the teacher authors an episode, but Lesson Planner does not exclusively own it. A future gradebook may reference the same Deliverable, and it may also create or reference Deliverables that were never authored in Lesson Planner.

At minimum, a Deliverable requires:

- durable identity
- title
- optional description
- provenance
- optional learning-target references
- optional originating Teaching Episode reference

The future gradebook occurrence — section, assignment date, due date, category, scoring configuration, and student results — is a separate object and is not defined by this amendment. A Deliverable is not automatically graded, and a gradebook entry is not required to originate in Lesson Planner. **[new]**

---

## 3. Object shape (relationship summary)

```text
LessonSession  (envelope — dated, per-section)
  ??? meeting identity        (from Today: course, section, date, period)   [exists]
  ??? session reflection       (non-portable)                                [exists]
  ??? ordered [ EpisodePlacement ]                                           [new]
         ??? order index                                                     [new]
         ??? carry-origin  ? EpisodePlacement | null                         [new]
         ??? PlacementStatus  (planned | reached | partial | skipped |
         ?                     carried-forward  [+ optional waterline])      [new]
         ??? ? TeachingEpisode  (durable content, shared)                    [new id]
                 ??? title                                                   [exists]
                 ??? phase / type                                            [exists ? split, Q-EM-7]
                 ??? estimated duration                                      [exists]
                 ??? ordered [ Block ]  (interior outline)                   [exists as notes]
                 ??? learning-target refs                                    [exists]
                 ??? [ Deliverable ]  (first-class)                          [exists ? new lifecycle]
                 ??? materials / misconceptions / supports                   [exists]
                 ??? episode reflection  (portable)                          [derivable]
                 ??? provenance / curriculum link                            [exists]
                 ??? lineage  (split/merge parents)                          [new]
```

Derived, never stored on the episode:
```text
per-episode clock start/end   =  meeting start (Today)  +  ? durations   [derivable]
planned-vs-available gap      =  ? durations  ?  meeting length          [derivable]
```

---

## 4. Invariants (must always hold)

These are the safety rails. A violation is a defect regardless of how convenient it looks.

1. **Enacted status never lives on episode content.** It lives only on a placement.
2. **Editing episode content never alters any past placement's status.** History is immutable through content edits.
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

**Reuse a warm-up.** One warm-up episode; three sections' sessions each hold a placement with `carry-origin = null`. Editing the shared warm-up propagates to all three. If Period 5 needs a variation, the teacher chooses **Detach this use**. A new episode is created with `derived-from` lineage to the original, and only Period 5's placement is redirected.

**Split during instruction.** Episode 3 half-taught. Split ? 3a (taught, `reached`/`partial`, origin placement) and 3b (remainder, new episode, carried forward). Both inherit provenance; lineage links to 3.

**Merge.** Episodes 2 and 3 merged into one; interior Blocks concatenated; curriculum attachments unioned; lineage records both. Status reconciliation per Q-EM-2.

**Skip.** Episode 5 deliberately omitted today → `skipped`. Not an error, not auto-carried. The teacher may later carry it forward under EM-12.

**Create a deliverable in Lesson Planner.** While authoring an Exit Ticket episode, the teacher identifies “Sequence Log” as evidence students will produce. Lesson Planner creates a durable Deliverable and the episode references it. A future gradebook may later create a Gradebook Entry that references that Deliverable, but no gradebook record is required merely because the Deliverable exists.

**Create a gradebook-only item.** A semester assessment or externally assigned task may be created directly in the future gradebook without a Lesson Planner origin. It may still be represented as a Deliverable, but its originating-episode reference is null.

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
- **Q-EM-4 — Skip ? carry-forward.** Does a `skipped` episode auto-offer carry-forward, or stay put until the teacher acts? Affects EM-11/EM-12.
- **Q-EM-5 — Split/merge identity.** New IDs for all children with lineage links, or does one child retain the parent ID? Affects EM-9/EM-10 and any external references to episode IDs.
- **Q-EM-6 — RESOLVED by EM-17: reuse is shared until explicitly detached.** Multiple placements reference one episode by default. Detachment creates a new episode with preserved lineage and redirects only the selected placement.
- **Q-EM-7 — Interior taxonomy & support placement.** Split of `phase` (pedagogical) from `type` (logistics); and whether supports are typed Blocks or separate episode-level attachments. Folds into the existing item-taxonomy item.
- **Q-EM-8 — Episode reflection under movement.** Does episode-level reflection travel with a bumped episode? If an episode is partially taught across two sessions, where does its reflection attach — to the content or to each placement? Affects EM-15.
- **Q-EM-9 — Deliverable lifecycle boundary.** Which fields belong to the durable Deliverable itself, and which belong only to a future Gradebook Entry or student-submission record? EM-18 installs the identity seam but deliberately defers gradebook workflow, scoring, categories, due-date policy, and student-result modeling.
- **Q-EM-10 — Deliverable reuse and revision.** When the same Deliverable is referenced by multiple episodes or gradebook entries, do edits propagate directly, use versioning, or require an explicit detach/derive action comparable to EM-17? Resolve before cross-workspace deliverable editing is built.

---

## 9. What this amendment does **not** change

- The Planned / Enacted / Interpretation domain boundaries stand; this amendment refines *where* enacted truth is recorded, not the domains.
- Curriculum protection stands: session changes remain default-owned by the Lesson Session; curriculum improvement remains an explicit, intentional action.
- Today remains the owner of meeting identity and clock time.
- The interaction model is **not** decided here. Spine/body geometry, the bump gesture, waterline rendering, and the summon mechanism are decisions-log / interaction items, proposed separately.
