# ENACTMENT_MODEL.md

# Enactment Model

**Status:** Foundational Architecture — core ownership and object model ratified; bounded open questions remain (see "Open Questions")

**Purpose:** Define how Year Planner records, stores, and derives what actually happened during instruction.

**Related Documents**

- TEACHING_WORKFLOW.md
- TEACHING_LIFECYCLE_DIAGRAM.md
- POST_CLASS_DEBRIEF.md
- TEACHING_EPISODE_MODEL.md
- LESSON_SESSION.md
- LESSON_PLANNER_INFORMATION_MODEL.md
- INFORMATION_MODEL.md
- TODAY_ARCHITECTURE.md
- UNITS_ARCHITECTURE.md
- FORECAST_ARCHITECTURE.md

---

# Terminology

Terminology used elsewhere for enacted-instruction concepts maps onto this document's terms as follows. This is a terminology correspondence only; it does not restate or resolve ownership as described in `INFORMATION_MODEL.md`.

**Deprecated — do not use for new material:**

| Old term | Read instead as |
|---|---|
| Instructional Event | No single replacement — read as whichever fits context: `Teaching Episode` (the reusable planned content), `Episode Placement` (that content scheduled within a Lesson Session), `Session Enactment` (the enacted record for the Lesson Session), or `Placement Enactment` (the enacted result for one Episode Placement) |
| Lesson Completion | Placement Enactment status (`reached` / `partial` / `skipped`) |
| Instructional Notes | Session Note (session-specific) or Episode Note (episode-specific), depending on content |
| Section-Specific Instructional Adjustment | a carry-forward, skip, split, or merge recorded through the Post-Class Debrief |

These are terminology correspondences, not one-to-one field mappings — some old terms cover ground that this model splits across more than one object.

---

# Purpose

Year Planner must preserve a clear distinction between:

- what the teacher intended to teach
- what actually happened during instruction
- what the teacher learned from the experience
- what the software derives from that record

This document defines the architecture of enacted instruction.

It establishes:

- the canonical source of enacted truth
- the objects that store enacted information
- the relationship between session-level and episode-level facts
- the role of the Post-Class Debrief
- the relationship between enacted facts and derived progress
- which workspaces may author enacted information
- which workspaces may only read it

---

# Fundamental Principle

> The teacher records experience.
>
> The software derives metrics.

The teacher should not be asked to calculate instructional progress, pacing, or completion percentages.

The teacher records what happened.

Year Planner interprets that record and updates the rest of the system.

---

# Enactment Defined

Enactment is the transition from planned instruction to recorded instructional reality.

Before teaching, the system contains intention.

After teaching, the system contains history.

```text
Planned Lesson Session
        |
        v
Printed Lesson
        |
        v
Teach from Paper
        |
        v
Post-Class Debrief
        |
        v
Recorded Enactment
        |
        v
Derived Progress
```

Enactment does not occur when the lesson is planned.

Enactment does not occur when the lesson is printed.

Enactment occurs when the teacher records what happened after instruction.

This flow corresponds to the Put-In, Rapids, Campfire, and Assimilation phases described in `TEACHING_LIFECYCLE_DIAGRAM.md`.

---

# Canonical Entry Point

The Post-Class Debrief is the single entry point for enacted teaching truth.

```text
Paper observations
        |
        v
Post-Class Debrief
        |
        v
Canonical enacted record
```

Other workspaces may display enacted information.

They do not independently author it.

This prevents multiple workspaces from maintaining conflicting versions of classroom reality.

---

# Ownership

## Lesson Planner

Lesson Planner owns the Post-Class Debrief workflow.

It is the interface through which the teacher records:

- where instruction stopped
- which episodes were reached
- which episodes were partially completed
- which episodes were skipped
- which episodes must carry forward
- session-specific notes
- durable episode notes
- relevant session conditions

Lesson Planner owns the recording workflow.

It does not own every piece of stored information.

Each recorded fact is written to its proper domain object.

---

## Today

Today may surface the current lesson and provide an entry point into the Post-Class Debrief.

Today does not independently record enacted instruction.

It reads the same enacted record as every other workspace.

---

## Units

Units reads derived instructional position and completion.

Units does not maintain a separate progress record.

---

## Forecast

Forecast reads derived pacing and projected completion.

Forecast does not author enacted instruction.

---

## Planning

Planning reads enacted history when preparing future sessions.

Planning may create new placements or move carried-forward work.

Planning does not rewrite the history of what already happened.

---

# Three Layers of Instruction

The Enactment Model depends on the three-layer Teaching Episode Model.

## Layer 1 — Teaching Episode

Durable instructional content.

Examples:

- explanation
- activity
- discussion
- worked example
- assessment

A Teaching Episode may also own or carry deliverables, materials, and durable teaching notes (Episode Notes) as attached information. These describe what the episode carries, not additional examples of the episode itself.

The Teaching Episode answers:

> What is this piece of instruction?

Enacted status never lives on the Teaching Episode.

---

## Layer 2 — Episode Placement

A specific use of a Teaching Episode within a Lesson Session.

The Episode Placement answers:

> Where was this episode planned to occur?

Episode Placement owns:

- a reference to exactly one Teaching Episode
- its order index within that Lesson Session
- carry-origin — a nullable reference to the placement it continues from (this is what distinguishes a bump from a reuse)

Episode Placement does not own section, instructional date, or planned duration:

- section and instructional date belong to the Lesson Session envelope that holds the placement
- planned duration is authored on the Teaching Episode and travels with it

A Teaching Episode may have many placements.

Each placement has its own enacted outcome.

---

## Layer 3 — Placement Enactment

The recorded outcome of a specific Episode Placement.

The Placement Enactment answers:

> What happened to this placed episode during this session?

This is the canonical home of episode-level enacted truth.

---

# Canonical Enactment Objects

Enacted instruction is stored through two coordinated kinds of records:

1. Session Enactment
2. Placement Enactment

They describe different levels of the same teaching event.

---

# Session Enactment

A Session Enactment is the recorded after-class account of one Lesson Session for one section on one instructional date.

It represents the session-level envelope around what happened.

## Session Enactment records

- lesson session
- section
- instructional date
- debrief timestamp
- overall session note
- usable instructional time, when meaningful
- interruptions or unusual conditions, when meaningful
- optional summary of where the class ended
- completion state of the debrief
- author or teacher identity, when needed

## Session Enactment does not record

- the durable content of a Teaching Episode
- episode-level completion as one flat session percentage
- forecast calculations
- unit completion percentages
- future planning decisions
- student-level assessment data

---

# Is Session Enactment a Stored Object?

Yes.

A Session Enactment is a stored record because session-level facts require a durable home.

However, it is not the sole container of enacted truth.

Episode-level outcomes belong to Placement Enactments.

The Session Enactment and its Placement Enactments together form the complete enacted record.

```text
Session Enactment          (owns these fields directly)
        |
        +--- Session facts
        +--- Session note

Placement Enactment        (one per Episode Placement, referencing
                             this Session Enactment — not owned by it)
        +--- Placement A outcome
        +--- Placement B outcome
        +--- Placement C outcome
```

---

# Placement Enactment

A Placement Enactment records what happened to one Episode Placement during one Session Enactment.

It belongs to the placement, not to the reusable Teaching Episode.

## Canonical statuses

- `planned`
- `reached`
- `partial`
- `skipped`
- `carried-forward`

These statuses describe the enacted outcome of the placement.

---

# Status Definitions

## Planned

The episode was part of the plan, but no enacted outcome has yet been recorded.

This is a pre-debrief state.

A completed Post-Class Debrief should normally leave no relevant placement in an unresolved planned state.

---

## Reached

The planned instructional work was substantially completed in this placement.

Reached does not require perfection.

It means the episode fulfilled its intended instructional role sufficiently that the teacher does not need to continue the same placement later.

---

## Partial

The episode began but was not substantially completed.

A partial enactment may include an optional waterline describing where work stopped.

A partial episode may later create a new carried-forward placement.

The original placement remains partial as historical truth.

---

## Skipped

The teacher intentionally chose not to teach the episode in this placement.

Skipped is not the same as running out of time.

Examples:

- no longer needed
- replaced by a different activity
- intentionally omitted
- unsuitable for that section
- deferred indefinitely

A skipped placement remains part of the historical record.

---

## Carried Forward

The episode was not completed in this placement and instructional work should continue in a later placement.

Carried-forward indicates a planning consequence.

It should normally create or identify a new Episode Placement in a future Lesson Session.

The original placement remains part of history.

The new placement represents future intention.

---

# Partial and Carried-Forward Are Distinct

A partial outcome describes what happened.

A carried-forward placement describes what happens next.

They should not be collapsed into one fact.

Example:

```text
Original Placement
Status: partial
Waterline: completed example 2

New Placement
Source: original placement
Purpose: continue remaining work
Status: planned
```

The original placement is never rewritten as though it occurred tomorrow.

History remains attached to the session in which it happened.

Future work receives a new placement.

---

# The Bell Line

The bell line is a teacher-facing way to describe where instruction stopped.

It may be recorded as:

- the final reached placement
- a partial placement
- a waterline within a partial episode
- a combination of placement outcomes

The bell line is useful as an interaction model.

It is not necessarily a separate canonical database object.

The durable source of truth is the set of Placement Enactments.

The software may derive a session stopping point from them.

---

# Waterline

A waterline records how far the teacher progressed inside a partially enacted Teaching Episode.

It is optional.

Possible representations include:

- block identifier
- line-item identifier
- sequence position
- brief text description
- structured fraction of the episode

The waterline belongs to the Placement Enactment.

It does not modify the durable Teaching Episode.

Example:

```text
Teaching Episode:
Solving two-step equations

Placement Enactment:
Status: partial
Waterline: completed guided examples; independent practice not started
```

---

# Notes Model

The system must preserve two different kinds of reflection.

They have different owners and different lifetimes.

---

# Session Notes

A Session Note belongs to the Session Enactment.

It records information that is primarily true about this class period.

Examples:

- fire drill shortened the period
- students were unusually distracted
- technology failed
- discussion took longer because of a school event
- Period 2 needed more settling time
- class ended five minutes early

Session Notes are:

- section-specific
- date-specific
- non-portable
- historical

They remain with the session in which they were recorded.

---

# Episode Notes

An Episode Note belongs to the Teaching Episode.

It records durable teaching knowledge about the instructional content itself.

Examples:

- use the visual model before introducing notation
- this prompt produces stronger discussion
- students commonly confuse the two representations
- prepare a larger version of the diagram
- allow at least fifteen minutes for this activity
- the second example is unnecessary

Episode Notes are:

- reusable
- portable
- durable
- available in future placements
- potentially useful across sections and years

An Episode Note does not belong only to the session in which the insight was discovered.

Episode Notes are the primary source of what `TEACHING_LIFECYCLE_DIAGRAM.md` calls Instructional Knowledge — the durable teaching knowledge that accumulates across sessions and years.

---

# Section-Specific Episode Knowledge

Some insights relate to an episode but apply only to a particular section or cohort.

This creates a third possible category:

- durable episode knowledge
- limited to a defined context

Version 1 does not need a complex contextual knowledge model.

Until such a model is justified, the teacher should choose between:

- Session Note when the observation is primarily about that class period or section
- Episode Note when the observation should travel with the instructional content

The system should not force false precision.

---

# Planning Truth and Enacted Truth

Planning and enactment must remain distinct.

## Planning Truth

Records what the teacher intended to do.

Examples:

- planned episode order
- planned duration
- planned materials
- planned lesson date

## Enacted Truth

Records what actually happened.

Examples:

- episode reached
- episode partial
- episode skipped
- session interrupted
- usable time reduced

Enacted truth must not overwrite planning truth.

The system should preserve both so the teacher can compare intention with reality.

---

# Historical Immutability

Once a Session Enactment has been recorded, its history should not be silently rewritten by future planning actions.

Allowed corrections include:

- correcting an accidental entry
- adding a forgotten note
- fixing an incorrect status
- clarifying a waterline

Future planning actions must not alter the historical meaning of the original session.

Examples:

- moving unfinished work creates a new placement
- reusing an episode creates a new placement
- splitting an episode creates related future content or placements
- skipping an episode records a skipped outcome rather than deleting its history

---

# Debrief Completion

A Post-Class Debrief may have a completion state.

Suggested states:

- `not-started`
- `in-progress`
- `complete`

This state belongs to the Session Enactment.

It answers:

> Has the teacher finished recording what happened in this session?

It does not answer:

> Was the lesson itself completed?

A complete debrief may record that much of the lesson was not completed.

---

# Minimal Debrief Record

The system should allow an extremely small enacted record.

For a routine class, the teacher may need to record only:

- the stopping point
- any partial placement
- any carry-forward consequence

No note should be required.

No interruption should be required.

No duration should be required.

No reflection prompt should be required.

Silence is valid data when nothing unusual needs preservation.

---

# Expanded Debrief Record

When the session warrants more detail, the teacher may also record:

- session note
- episode note
- usable minutes
- interruption
- reason for skipping
- partial waterline
- carry-forward guidance

The expanded record should remain optional.

---

# Derived Progress

Progress is not a separate teacher-authored truth.

Progress is derived from enacted placements.

The software may derive:

- current curriculum position
- completed instructional episodes
- partially completed episodes
- remaining work
- unit progress
- instructional days used
- pacing status
- projected completion
- section divergence
- carry-forward workload

The teacher should not need to enter these calculations manually.

---

# Daily Progress

The current system may contain a `DailyProgress` record or sheet.

This should be treated as an implementation mechanism, not as the long-term conceptual source of truth.

The architecture should move toward:

```text
Session Enactment
        +
Placement Enactments
        |
        v
Derived Progress
```

During migration, DailyProgress may continue to exist as:

- a projection of enactment data
- a compatibility record
- a derived write for existing Forecast and Units logic
- a temporary persistence layer

It must not become an independent second source of enacted truth.

---

# Migration Principle

Until Forecast and Units read directly from the Enactment Model, the Post-Class Debrief may perform a controlled dual write.

Example:

```text
Teacher saves Post-Class Debrief
        |
        +--- Write canonical Session Enactment
        +--- Write canonical Placement Enactments
        +--- Update compatibility DailyProgress record
```

The compatibility write must be derived from the canonical enactment record.

It should not require separate teacher input.

The long-term goal is to remove the compatibility dependency once downstream systems use the Enactment Model directly.

---

# Instructional Days

The teacher records what happened.

The software determines how that event affects instructional-day accounting.

Possible derived rules may consider:

- whether instruction occurred
- which placements were reached
- whether the session was substantially disrupted
- whether only a fraction of the planned lesson was enacted
- whether different sections diverged

The specific pacing formula belongs in the pacing or forecast architecture.

It does not belong in the teacher's debrief interaction.

---

# Section Independence

Enactment is section-specific: each Lesson Session belongs to one section's one meeting, so its Placement Enactments are independent of every other section's (`TEACHING_EPISODE_MODEL.md`, EM-7). One section's progress must never silently change another section's history. See `TEACHING_EPISODE_MODEL.md` §5, "Different sections," for the full walk-through.

---

# Reuse and Enactment

A Teaching Episode may be reused across sections, dates, units, and school years; each reuse is a new Episode Placement (`TEACHING_EPISODE_MODEL.md`, EM-8, defines the reuse mechanism itself). Each placement receives its own, independent Placement Enactment. Durable Episode Notes travel with the Teaching Episode; Session Notes and placement outcomes do not.

---

# Carry-Forward

Carry-forward connects enacted history to future planning: it preserves what happened (the original Placement Enactment; see "Partial and Carried-Forward Are Distinct," above) while creating a new Episode Placement for the remaining work. The dual-write mechanics are defined in `TEACHING_EPISODE_MODEL.md`, EM-5 and EM-12. From the enactment side, a carry-forward action must: preserve the original Placement Enactment unchanged, retain provenance linking the new placement to the original, avoid duplicating durable episode content, and allow future adjustment without rewriting history.

---

# Skip

See "Skipped," under Status Definitions, above, and `TEACHING_EPISODE_MODEL.md`, EM-11, for the full behavior. A skipped placement is never deleted, and skipping never automatically triggers carry-forward — carrying a skipped episode forward remains a distinct teacher action.

---

# Split

Splitting a partially enacted episode is a planning operation, defined in `TEACHING_EPISODE_MODEL.md`, EM-9. Recording the partial outcome that motivated the split is a separate enactment operation, already covered under "Partial," above. The two may happen in sequence, but they remain conceptually distinct: enactment records what happened before the split; planning decides what the split produces.

---

# Merge

Merging is defined in `TEACHING_EPISODE_MODEL.md`, EM-10. From the enactment side, the guarantee is the same as for every other planning action: the original Placement Enactments are never rewritten by a later merge.

---

# Corrections

Teachers must be able to correct an enacted record.

Corrections should be explicit and limited.

Examples:

- change reached to partial
- add a forgotten session note
- correct the waterline
- remove an accidental episode note
- fix the instructional date

The system may eventually retain edit history.

Version 1 does not require a full audit log unless implementation or institutional requirements make it necessary.

---

# Data Relationships

The authoritative shape of these relationships is defined in `TEACHING_LIFECYCLE_DIAGRAM.md`, "The Planning Chain." It is reproduced here for convenience, not restated independently:

```text
Teaching Episode        (durable content)
        |
        | referenced by
        v
Episode Placement       (this session's ordered use of that content)
        |
        | held in the ordered sequence owned by
        v
Lesson Session           (dated, per-section envelope)
```

Enacted truth is a separate chain that references, rather than nests inside, the planning chain:

```text
Lesson Session
        ^
        | referenced by
        |
Session Enactment       (recorded after-class account of that session;
                          owns the Session Note)
        |
        | referenced by
        v
Placement Enactment     (recorded outcome of one Episode Placement;
                          owns status, waterline, reason)
```

A Lesson Session owns its ordered collection of Episode Placements by reference, not by containment of the Teaching Episodes those placements point to. A Session Enactment references the Lesson Session it accounts for and owns its own Session Note; it is not contained by the Lesson Session. A Placement Enactment references the Episode Placement it describes and belongs to one Session Enactment; it owns its own status, waterline, and reason. Neither enactment record is a child of the object it references.

---

# Suggested Conceptual Fields

These fields are conceptual.

They do not yet prescribe a final storage schema.

## Session Enactment

```text
SessionEnactmentID
LessonSessionID
SectionID
InstructionalDate
DebriefStatus
DebriefedAt
UsableMinutes
SessionNote
CreatedAt
UpdatedAt
```

## Placement Enactment

```text
PlacementEnactmentID
SessionEnactmentID
EpisodePlacementID
Status
WaterlineType
WaterlineValue
Reason
CreatedAt
UpdatedAt
```

## Episode Note

```text
EpisodeNoteID
TeachingEpisodeID
Note
CreatedFromSessionEnactmentID
CreatedAt
UpdatedAt
```

The provenance field allows future-you to know where the insight originated without making the note session-owned.

---

# Source of Truth Rules

## Rule 1

Teaching Episode owns durable instructional content.

## Rule 2

Episode Placement owns planned position within a Lesson Session.

## Rule 3

Placement Enactment owns the outcome of that placement.

## Rule 4

Session Enactment owns session-level facts and notes.

## Rule 5

Teaching Episode owns durable episode notes.

## Rule 6

Forecast, Units, Today, and Planning read enacted truth.

They do not maintain competing enacted records.

## Rule 7

Derived progress must be reproducible from canonical enactment data.

## Rule 8

Future planning never silently rewrites enacted history.

---

# Architectural Invariants

1. There is one entry path for enacted teaching truth.

2. Teaching occurs from paper, not through required software interaction.

3. The Post-Class Debrief records the transfer from paper memory to durable digital history.

4. Planning truth and enacted truth remain separate.

5. Episode-level outcomes live on Placement Enactments.

6. Session-level observations live on Session Enactments.

7. Durable teaching knowledge lives on Teaching Episodes.

8. Derived metrics are not independently teacher-authored.

9. Carry-forward creates future planning truth without erasing historical truth.

10. Enactment is section-specific.

11. Reused content receives new placements and new enactments.

12. Other workspaces observe enacted truth rather than duplicating it.

---

# Version 1 Boundary

Version 1 should implement only the smallest trustworthy enactment workflow.

Required:

- create or update a Session Enactment
- record placement outcomes
- record a partial stopping point
- support carried-forward work
- support optional Session Notes
- preserve section independence
- update existing progress consumers through a compatibility path

Deferred:

- AI-assisted debrief
- photo interpretation of paper annotations
- voice debrief
- automatic handwriting recognition
- sophisticated contextual episode knowledge
- full edit history
- analytics across school years
- automatic pedagogical recommendations
- student-level learning evidence

---

# Future AI Role

AI may eventually reduce the friction of creating enactment records.

Possible inputs include:

- spoken reflection
- photographed paper lesson
- typed conversation
- handwritten annotations
- pattern detection across past sessions

AI may propose:

- Placement Enactments
- Session Notes
- Episode Notes
- carry-forward actions
- possible durable insights

AI must not become the source of truth.

The teacher reviews and confirms the enacted record.

> AI augments reflection.
>
> The teacher remains the authority on what happened.

---

# Open Questions

## Q-EN-1

Should a Session Enactment be created automatically when a lesson is printed, when the instructional date arrives, or only when the debrief begins?

## Q-EN-2

Should `planned` be stored as a Placement Enactment status, or should the absence of an enactment record represent planned-but-unrecorded?

## Q-EN-3

Does `carried-forward` belong as a status on the original placement, or should the original outcome be `partial` or `not-reached` while a separate carry-forward relationship records the planning consequence?

The preferred direction is to preserve outcome and consequence separately.

## Q-EN-4

What is the smallest useful representation of a partial waterline?

Related: `TEACHING_EPISODE_MODEL.md` Q-EM-3 asks the adjacent question of whether the waterline is per-episode or per-Block. The two should be resolved together.

## Q-EN-5

When one lesson plan is used by multiple sections, are Episode Placements duplicated by section or shared with section-specific Placement Enactments?

**Resolved by `TEACHING_EPISODE_MODEL.md` EM-7.** Because a Lesson Session is one section's one meeting, each section using a shared lesson plan has its own Lesson Session and therefore its own Episode Placements — Episode Placements are duplicated by section, not shared behind section-specific Placement Enactments. The underlying Teaching Episode each placement references may still be shared (EM-8).

## Q-EN-6

How should the current DailyProgress sheet map onto Session Enactments and Placement Enactments during migration?

## Q-EN-7

What exact enacted facts are required for Forecast to calculate instructional days accurately?

## Q-EN-8

Should a completed debrief automatically create future carry-forward placements, or should it propose them for confirmation?

Related: `TEACHING_EPISODE_MODEL.md` Q-EM-4 asks the narrower version of this question for skipped placements specifically. The two should be resolved together.

## Q-EN-9

How should a teacher revise an enactment after tomorrow's planning has already consumed it?

## Q-EN-10

Which session facts are valuable enough to deserve structured fields rather than free-text notes?

---

# Guiding Principle

The Enactment Model preserves the difference between intention, experience, knowledge, and analysis.

The lesson plan records intention.

The paper supports experience.

The Post-Class Debrief records what happened.

Session Enactments preserve the class period.

Placement Enactments preserve the outcome of planned instructional work.

Teaching Episodes preserve durable knowledge.

The software derives progress and pacing.

The next plan begins from truth.