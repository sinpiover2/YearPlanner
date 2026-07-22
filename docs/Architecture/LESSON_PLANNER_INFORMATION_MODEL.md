# Lesson Planner Information Model

**Document Status:** Foundational Architecture
**Purpose:** Define the information model for Lesson Planner before interface implementation.

**Authoritative Architecture** (read these first; this document is reconciled with them and does not restate them in full):

- `TEACHING_WORKFLOW.md`
- `TEACHING_LIFECYCLE_DIAGRAM.md`
- `POST_CLASS_DEBRIEF.md`
- `TEACHING_EPISODE_MODEL.md`
- `ENACTMENT_MODEL.md`

Where this document and those documents ever appear to conflict, the documents above win.

---

# Purpose

Lesson Planner is the live teaching workspace.

It is the interface between Year Planner and the realities of the classroom.

It answers one question:

> **How do I teach this class well?**

Lesson Planner is where instructional planning becomes instructional execution, and where instructional execution becomes recorded history through the Post-Class Debrief.

It is not a lesson document.

It is not a gradebook.

It is not an attendance system.

It is not a replacement for district software.

It is the operational workspace used before, during, and immediately after teaching.

---

# Core Philosophy

Lesson Planner is not organized around documents.

It is organized around teaching.

Teaching unfolds as an ordered sequence of durable instructional content, planned into sessions and taught from paper.

Lesson Planner exists to organize and prepare that sequence before class, and to turn what actually happened into durable history afterward, through the Post-Class Debrief.

See `TEACHING_WORKFLOW.md` for the complete lifecycle this supports.

---

# Paper-First Teaching

This is a hard boundary, not a preference.

- Software supports **preparation** before class.
- The teacher **teaches from paper** during class.
- Software is **not required** during instruction.
- Enacted truth is entered **afterward**, through the Post-Class Debrief.

The teacher does not open a laptop mid-lesson to mark an episode complete. During class, the printed lesson is the teaching interface, and small handwritten marks (a line where class stopped, a circled episode, a quick note) are the only "recording" that happens in the moment. Those marks are temporary working memory, not a database.

Everything digital and durable about what happened is entered afterward, in one sitting, through the Post-Class Debrief (`POST_CLASS_DEBRIEF.md`). This is the single entry point for enacted teaching truth (see `ENACTMENT_MODEL.md`, "Canonical Entry Point"). No other workspace, and no in-class interaction, independently authors enacted history.

---

# Relationship to the Suite

Each workspace owns a different horizon of teaching.

| Workspace | Teacher Question |
|-----------|------------------|
| Forecast | Am I OK? |
| Units | Where am I in the curriculum? |
| Today | What am I teaching today? |
| Lesson Planner | How do I teach this class well? |

Year Planner determines **what** is being taught.

Lesson Planner determines **how** that lesson unfolds, and owns the record of how it actually went.

Forecast, Units, Today, and Planning consume enacted and derived information from Lesson Planner's Post-Class Debrief. They do not maintain competing records of what happened (see Ownership, below).

---

# Relationship to Today

Today determines the instructional context before Lesson Planner opens.

It provides:

- course
- section
- period
- instructional date
- unit
- lesson
- meeting start time
- meeting end time

Meeting times are determined by the active school calendar and schedule pattern. They may vary because of:

- block schedules
- minimum days
- late-start schedules
- assemblies
- testing schedules
- special events

Selecting **Start Lesson** creates or opens the correct **Lesson Session** automatically.

Lesson Planner should never ask the teacher to reselect information that Today already knows.

Today ends when the teacher chooses what to teach. Lesson Planner begins when teaching begins.

Today also surfaces the entry point into the Post-Class Debrief, but it does not independently record enacted instruction — it reads the same enacted record every other workspace reads.

---

# The Layered Model

`LESSON_PLANNER_INFORMATION_MODEL.md` previously stated:

> *"Everything hangs from a Lesson Session."*

**This statement is superseded.** A Lesson Session references an ordered sequence of episodes; it does not own them by containment. A chunk of teaching that can move from Tuesday to Wednesday cannot be owned by Tuesday — if it were, leaving Tuesday would destroy it, and Tuesday would lose the record that it was ever planned there.

The current model has five layers. Full rationale, invariants, and open questions live in `TEACHING_EPISODE_MODEL.md` and `ENACTMENT_MODEL.md`; this section states only what Lesson Planner needs to hold as true.

| Layer | Object | Answers | Portable? | Owns enacted truth? |
|---|---|---|---|---|
| 1. Content | **Teaching Episode** | What is this piece of teaching? | Yes — travels intact | No |
| 2. Placement | **Episode Placement** | Where does this episode sit in a session, and how did it get here? | Per session | No |
| 3. Container | **Lesson Session** | Which dated, per-section meeting is this? | No | No |
| 4. Session outcome | **Session Enactment** | What happened in this meeting overall? | No | Session-level facts |
| 5. Placement outcome | **Placement Enactment** | What happened to this specific placed episode? | No | Episode-level facts |

Stated as one sentence:

> **A Teaching Episode is durable content. An Episode Placement is a session's ordered reference to that content. A Lesson Session is the dated envelope holding those placements. A Session Enactment records what happened in the meeting. A Placement Enactment records what happened to one placed episode. Content travels; enacted truth does not.**

## Teaching Episode

The authored, movable unit of teaching — a teacher-chosen chunk of classroom experience (a number talk, a launch, a full test day). Granularity is the teacher's; the system never imposes a rhythm.

Owns:

- title, pedagogical phase / logistics type
- its interior outline (an ordered list of Blocks)
- authored estimated duration
- learning-target references
- deliverables (see Deliverables and Materials, below)
- materials, misconceptions, and other supports
- durable **Episode Notes** (see Reflections, below)
- provenance / curriculum attachment
- lineage links from split or merge

A Teaching Episode does not know which session it is in, what order it sits in, or whether it was taught. Those are facts about an occasion, not about the teaching itself. Enacted status never lives here.

**Deprecates:** "Instructional Segment." Where older material used that term for the movable teaching chunk, read it as Teaching Episode.

## Episode Placement

A per-session record that points a Lesson Session at one Teaching Episode. Owns:

- reference to exactly one Teaching Episode
- order index within the session
- carry-origin — a nullable reference to the placement this one continues from, which is what distinguishes a bump from a reuse

One Teaching Episode may be referenced by many placements, across sections and across days. A placement references exactly one episode. Reuse (e.g., one warm-up across three sections) and movement (a bump to tomorrow) are the same mechanism — a second placement of one episode — distinguished only by whether `carry-origin` is set.

**Deprecates:** the ambiguous older "LessonSessionItem," which conflated the movable chunk with the session's ordered entry. See `TEACHING_EPISODE_MODEL.md` §6 for the full naming reconciliation.

## Lesson Session

A dated, per-section instructional envelope. It represents one specific class meeting:

```text
Math 8
Period 2
September 14, 2026
9:40-10:35

Unit 2
Lesson 3.2
```

The Lesson Session owns:

- meeting identity (course, section, date, period — handed down by Today)
- its ordered sequence of Episode Placements (by reference, not containment)
- whole-session reflection (see Reflections, below)

The "lesson" is the envelope plus its referenced episodes. That collection relationship is true of the session's body, not of ownership over the episodes' content.

## Session Enactment and Placement Enactment

These are the two enacted-truth objects, and they are the only place enacted truth lives. Both are created through the Post-Class Debrief, never authored independently elsewhere.

- **Session Enactment** — the recorded, after-class account of one Lesson Session: session note, usable time, interruptions, debrief completion state. Section-specific, date-specific, non-portable.
- **Placement Enactment** — the recorded outcome of one Episode Placement: `planned`, `reached`, `partial`, `skipped`, or `carried-forward`, with an optional waterline.

Full field-level detail, status definitions, and the bell-line and waterline concepts live in `ENACTMENT_MODEL.md`. This document only needs the ownership boundary: Lesson Planner hosts the workflow that produces these records (the Post-Class Debrief); it does not scatter their fields across other objects.

---

# Planning Truth and Enacted Truth

These must never be confused, and enacted truth must never overwrite planning truth.

**Planning truth** — what the teacher intended:

- planned date
- planned episode sequence
- planned duration
- planned materials
- intended instructional work

**Enacted truth** — what actually happened, recorded through the Post-Class Debrief:

- reached / partial / skipped
- stopping point or waterline
- session conditions
- session notes
- carry-forward consequence

When instruction diverges from the plan, the system keeps both records side by side rather than editing the plan to match reality. A bump, split, merge, or carry-forward creates new planning objects; it never rewrites what a past placement's enactment says happened. See "Preserving Historical Truth," below.

---

# Ownership

| Information | Owner |
|---|---|
| Durable instructional content | Teaching Episode |
| Durable Episode Notes | Teaching Episode |
| Planned position and order within a session | Episode Placement |
| The planned session container | Lesson Session |
| Session-level facts and Session Notes | Session Enactment |
| Outcome of one specific Episode Placement | Placement Enactment |
| The Post-Class Debrief interaction | Lesson Planner |
| Derived progress, pacing, and forecasts | Computed — not owned by any authoring workspace |

Units, Forecast, Today, and Planning **consume** enacted and derived information. They do not maintain competing records of what happened or what was completed. If a number describing instructional progress appears in more than one place, it must be computed from the same canonical Session Enactment / Placement Enactment records, not re-entered.

---

# Teaching Episode Operations

Instructional momentum is more important than document editing. Episode and placement operations should eventually support:

- add, delete, reorder, duplicate, collapse, expand
- bump to tomorrow (creates a new placement with `carry-origin` set; the origin placement is marked `carried-forward`, not deleted)
- reuse in another section or lesson (a new placement, `carry-origin` null)
- split (divides one episode into two, preserving lineage)
- merge (combines two episodes into one, preserving lineage)
- mark reached, partial, or skipped (recorded through the Post-Class Debrief, not mid-class)
- save as reusable

These operations mirror how experienced teachers actually adapt lessons, and they are the reason the episode/placement split exists at all: a chunk that moves, repeats, splits, or merges cannot be modeled as something a single session owns outright. See `TEACHING_EPISODE_MODEL.md` §5 for full behavior walk-throughs.

---

# Before Class

Before class, Lesson Planner should answer:

> **What do I need in order to teach this class well?**

Typical information includes:

- instructional sequence (the session's ordered Episode Placements)
- lesson goals
- materials, links, handouts
- warm-up, homework review
- teacher reminders
- groups
- roster reference
- publishable student work

Preparation should remain lightweight. Lesson Planner is not intended to become a lesson-writing application.

---

# During Class

During instruction, the software stays out of the teacher's way entirely.

The teacher teaches from the printed lesson. Expected paper annotations include a stopping point, arrows, circles, check marks, reminders, and brief observations. These marks are temporary memory — not a record the teacher is expected to enter into software while class is in session.

Lesson Planner does not ask the teacher to record what actually happened during class. That recording happens afterward, through the Post-Class Debrief.

---

# Post-Class Debrief

Immediately after class, Lesson Planner hosts the Post-Class Debrief — the single entry point for enacted teaching truth.

This is where paper observations become durable digital record:

- where instruction stopped
- which placements were reached, partial, or skipped
- which episodes must carry forward
- session-specific notes (-> Session Enactment)
- durable episode notes (-> Teaching Episode)
- relevant session conditions

Completing the debrief writes the canonical Session Enactment and Placement Enactment records and, through them, updates the rest of the Year Planner ecosystem (Units, Forecast, Today) without asking the teacher to compute anything.

Full design principles — reflection not administration, capture only what matters, derive everything possible, support imperfect memory — live in `POST_CLASS_DEBRIEF.md` and are not repeated here.

---

# Temporary vs Permanent Information

Not every instructional thought deserves permanent storage.

Lesson Planner distinguishes between working memory and instructional memory.

## Temporary Working Information

Examples:

- handwritten notes
- quick reminders
- timing changes
- whiteboard sketches
- today's observations
- paper annotations

These support today's teaching. Many never need to become permanent records. The software should respect that reality.

## Permanent Instructional Knowledge

Examples:

- lesson improvements
- reusable teaching ideas
- recurring misconceptions
- curriculum revisions
- episode reflection (see Reflections)
- publishable student work

These improve future teaching, and become durable through the Post-Class Debrief. The software should make preserving them effortless.

---

# Reflections

The system preserves two different kinds of reflection, with different owners and different lifetimes. There is no single, undifferentiated "reflection" field.

## Session Note (-> Session Enactment)

Primarily true about this class period: this section, this date.

Examples: a fire drill shortened the period, the class was unusually distracted, technology failed, this section needed more settling time.

Section-specific, date-specific, non-portable, historical. It stays with the session in which it was recorded.

## Episode Note (-> Teaching Episode)

Durable teaching knowledge about the instructional content itself.

Examples: use the visual model before introducing notation, this prompt produces stronger discussion, students commonly confuse the two representations, allow at least fifteen minutes for this activity.

Reusable, portable, durable, available in future placements, potentially useful across sections and years.

When an insight is specific to one section but should travel with the episode's future teaching, the teacher chooses whichever of the two is the closer fit. Version 1 does not need a third, contextual-knowledge category (see `ENACTMENT_MODEL.md`, "Section-Specific Episode Knowledge").

---

# Derived Progress

The teacher records enacted facts. The teacher never computes progress by hand.

The software derives:

- current curriculum position
- completed and remaining work
- unit progress
- pacing status
- projected completion
- section divergence
- carry-forward workload

`DailyProgress` may continue to exist as an implementation mechanism during migration — a projection of enactment data, a compatibility write for existing Forecast and Units logic. It is not, and must not become, an independent conceptual source of truth. The canonical source is always Session Enactment plus Placement Enactment. See `ENACTMENT_MODEL.md`, "Daily Progress" and "Migration Principle."

---

# Section Independence

Each section may enact the same planned content differently. Two sections working from the same Lesson Session plan can diverge:

```text
Period 2                    Period 3
Episode A: reached          Episode A: reached
Episode B: reached          Episode B: partial
Episode C: partial          Episode C: planned
```

The shared Teaching Episodes remain the same object. The Episode Placements and their Placement Enactments are section-specific. One section's recorded history must never silently change another section's history.

---

# Preserving Historical Truth

Carry-forward, reuse, split, and merge all create new planning objects or relationships. None of them rewrite what a past placement's enactment says happened.

- **Bumping** an unreached or partial episode marks the origin placement `carried-forward` (it is not deleted) and creates a new placement in a future session referencing the same episode.
- **Reusing** an episode across sections or lessons creates a new placement with no carry-origin; it does not clone or overwrite the original.
- **Splitting** a partially taught episode produces two episodes with a lineage link; the taught portion's enactment stands as recorded.
- **Merging** two episodes combines their content going forward without altering either original placement's recorded outcome.

Future planning always begins from what the record shows already happened. It never edits that record to make an earlier session look different than it was.

---

# Deliverables and Materials

Deliverables and materials that are reusable instructional content belong to the **Teaching Episode**, not to the Lesson Session or the Episode Placement — because they need to travel intact when an episode is bumped, reused, split, or merged (see `TEACHING_EPISODE_MODEL.md`, EM-16). A Lesson Session or Episode Placement may hold contextual overrides or session-specific additions (e.g., "print extra copies for Period 4 today"), but it is not the sole or primary owner of reusable content.

A Deliverable represents student-facing work carried by a Teaching Episode. Examples:

- Lesson 1.2
- Practice Set A
- Exit Ticket
- Homework
- Project Milestone
- Quiz
- Reading Assignment

Deliverables are not simply text. They are durable instructional objects capable of flowing to multiple destinations without being recreated:

- Monday Manager
- Student weekly summaries
- LMS
- Gradebook
- Parent communication
- Future analytics

Early implementation does not need to support every destination. The information model should preserve those future possibilities.

A Deliverable should eventually include:

- title
- description
- originating Teaching Episode
- assigned date and due date (session-specific, resolved through the Episode Placement that assigns it)
- publishable status
- completion status
- optional grading status
- optional resource link

Working principle:

> **Student work should not be modeled as disposable text. It should be modeled as an instructional object capable of traveling throughout the system.**

---

# Teacher Information

Teacher-facing information remains private unless explicitly published. Examples:

- agenda notes
- instructional reminders
- anticipated misconceptions
- materials
- reflection notes (session or episode — see Reflections)
- grouping notes
- planning notes

Teacher information exists to support instruction.

---

# Student Observations

Lesson Planner may support lightweight observations about individual students:

- learning observations
- follow-up reminders
- grouping considerations
- AI-transcribed notes

These observations support teaching. They are not official student records. Sensitive or permanent student information belongs in district systems.

---

# Roster Boundary

Lesson Planner may use roster information for classroom workflow:

- printable rosters
- planning sheets
- group reference
- material distribution
- seating reference

Lesson Planner should not become:

- attendance software
- gradebook
- discipline system
- library system
- SIS replacement

Working rule:

> **Roster information supports teaching logistics. It does not become a student information system.**

---

# Seating and Groups

Future classroom-management features may include seating reference, table assignments, partner assignments, groups, and printable seating charts. These should be modeled as classroom organization rather than graphics — a visual seating chart is one presentation of that model. This work remains outside the initial implementation.

---

# Print Views

Printing is a first-class output. Many teachers — including the primary user of this project — teach from printed lesson sheets. This is the paper-first boundary described above, made concrete.

A print view may include:

- course, section, meeting time
- instructional sequence (rendered from that session's Episode Placements)
- roster
- agenda
- deliverables
- materials
- generous note space

The printout is an output. It is not the source of truth. Handwritten notes remain temporary unless intentionally preserved through the Post-Class Debrief.

---

# Output Channels

Lesson Planner authors instructional work. Output channels publish it:

- Monday Manager
- daily class sheets
- student weekly summaries
- substitute plans
- parent communication
- LMS exports
- AI summaries

Output channels should never require duplicate planning.

---

# Monday Manager

Monday Manager is not a planning application. It is a beautifully formatted publication. Its question:

> **What do students need to do this week?**

It consumes publishable instructional information (deliverables) from Teaching Episodes via Lesson Planner. It should never become another planning workspace.

---

# Artificial Intelligence

Artificial intelligence assists the teacher. It does not replace the teacher as author, and it must never become the source of enacted truth (`ENACTMENT_MODEL.md`, "Future AI Role").

AI may help:

- transcribe
- summarize
- organize
- categorize
- suggest
- publish

Instructional judgment, and confirmation of what actually happened, always remain with the teacher.

---

# Explicitly Out of Scope

Lesson Planner will not replace district systems. It will not include:

- official attendance
- gradebook
- discipline management
- library management
- official student records

These boundaries intentionally prevent the accumulation of unrelated responsibilities that developed within the legacy FileMaker system.

---

# FileMaker Legacy

The previous FileMaker system represents decades of instructional experience. It is not a model to recreate. It is evidence to study.

The goal is not to preserve the FileMaker application. The goal is to preserve the teaching intelligence that evolved inside it.

Working principle:

> **Respect evolved workflows. Refactor their implementation.**

For every legacy workflow ask:

1. What teaching problem did this solve?
2. Why did it survive?
3. Does that teaching problem still exist?
4. What is the cleanest modern solution?

---

# Terminology

Prefer, consistently:

- Teaching Episode
- Episode Placement
- Lesson Session
- Session Enactment
- Placement Enactment
- Post-Class Debrief
- Session Note
- Episode Note
- planning truth
- enacted truth
- derived progress

**Deprecated — do not use for new material:**

| Old term | Read instead as |
|---|---|
| Instructional Segment | Teaching Episode |
| Lesson Completion | Placement Enactment status (`reached` / `partial` / `skipped`) |
| Instructional Event | Teaching Episode, or its Placement Enactment, depending on context |
| "LessonSessionItem" | Episode Placement (or Teaching Episode, if it referred to the movable content — see `TEACHING_EPISODE_MODEL.md` §6) |

---

# Object Relationships

```text
Teaching Episode  (durable content; shared across placements)
        |
        v
Episode Placement  (one session's ordered reference to that content)
        |
        v
Lesson Session  (dated, per-section envelope referencing placements)
        |
        v
Session Enactment  (recorded after-class account of the session)
        |
        +--- Session Note
        +--- Placement Enactment  (per placement: status, waterline, reason)
```

A Lesson Session references its Episode Placements; it does not contain them by ownership. Content (Teaching Episode) travels across placements and sessions. Enacted truth (Session Enactment, Placement Enactment) never does — it stays with the session and placement where it happened.

Full schema-level detail is intentionally not duplicated here; see `TEACHING_EPISODE_MODEL.md` §3 and `ENACTMENT_MODEL.md`, "Data Relationships."

---

# Working Definition

Lesson Planner is the live teaching workspace.

A Teaching Episode is durable, portable instructional content. An Episode Placement is one session's planned use of that content. A Lesson Session is the dated, per-section envelope that references an ordered sequence of placements.

Before class, Lesson Planner organizes and prepares that sequence, and produces the printed lesson the teacher actually teaches from. During class, the software steps aside entirely. After class, the Post-Class Debrief records what happened as a Session Enactment and its Placement Enactments — the one path through which enacted truth enters the system — from which the rest of the Year Planner ecosystem derives progress, pacing, and forecasts.
