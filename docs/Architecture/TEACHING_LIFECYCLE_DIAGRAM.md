# TEACHING_LIFECYCLE_DIAGRAM.md

# Teaching Lifecycle Diagram

**Status:** Living Architecture Diagram

**Purpose:** Provide a one-page view of how information flows through Year Planner over the complete lifecycle of teaching.

This document is a lifecycle and information-flow overview. It does not define objects, fields, or statuses in detail — it cross-references the documents that do.

Related Documents

- TEACHING_WORKFLOW.md
- POST_CLASS_DEBRIEF.md
- LESSON_PLANNER_INFORMATION_MODEL.md
- TEACHING_EPISODE_MODEL.md
- ENACTMENT_MODEL.md

---

# Terminology

This document uses the terminology defined in `LESSON_PLANNER_INFORMATION_MODEL.md`, `TEACHING_EPISODE_MODEL.md`, and `ENACTMENT_MODEL.md`. Where an older version of this diagram used different names, read them as follows.

**Deprecated — do not use for new material:**

| Old term | Read instead as |
|---|---|
| Placement Status | Placement Enactment |
| Teaching Truth | Enacted Truth |
| Analytical Truth | Derived Information (Derived Progress and Analysis) |
| Session History | Instructional Knowledge (see Assimilation, below) |

---

# Philosophy

Year Planner is not a collection of disconnected workspaces.

It is one continuous lifecycle.

Each workspace exists to support one phase of teaching.

Information informs later phases as the lifecycle proceeds — it does not move between phases as though the same record relocates. Each phase creates its own record and references what came before.

Knowledge accumulates over time.

---

# The Teaching Lifecycle

```text
                         CURRICULUM
                              |
                              v
                     Curriculum Lessons
                              |
                              v
                     Teaching Episodes
                              |
                              v
================================================================
                        EXPEDITION
              Long-term curriculum planning
================================================================
                              |
                              v
                         Forecast
                              |
                              v
                            Units
                              |
                              v
                          Planning
                              |
                              v
                     Episode Placements
              (ordered, within a Lesson Session)
                              |
                              v
                       Lesson Planner
================================================================
                          PUT-IN
                   Prepare today's lesson
================================================================
                              |
                              v
                        Print Lesson
                              |
                              v
================================================================
                           RAPIDS
                     Teach from Paper
================================================================
                              |
                              v
                    Paper Observations
        (marks, a stopping point, quick notes — not stored)
                              |
                              v
================================================================
                          CAMPFIRE
                    Post-Class Debrief
          (the sole digital entry point for enacted truth)
================================================================
                              |
               +--------------+---------------+
               |                               |
               v                               v
        Session Enactment              Placement Enactments
     (this meeting, overall)         (one per Episode Placement)
               |                               |
               v                               v
         Session Note                planned / reached / partial
     (-> Session Enactment)          (waterline optional) / skipped /
                                       carried-forward
                                                |
                                                v
                                          Episode Notes
                                       (-> Teaching Episode)
               |                               |
               +--------------+---------------+
                              |
                              v
================================================================
                        ASSIMILATION
           Software derives information automatically
================================================================
                              |
               +--------------+---------------+
               |                               |
               v                               v
     Derived Progress and Analysis      Instructional Knowledge
   (from Session Enactment +              (accumulates across
      Placement Enactments)                sessions and years)
               |                               |
        +------+------+                        |
        |             |                        |
        v             v                        v
      Units       Forecast          informs future Planning and
                                          Lesson Planner use
                              |
                              v
================================================================
                     NEXT EXPEDITION
             Tomorrow's planning begins here
================================================================
```

---

# The Planning Chain

The visible planning chain, in reference order:

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

A Lesson Session owns an ordered collection of Episode Placements by reference, not by containment of their underlying content. Episode Placements reference exactly one Teaching Episode each; a Teaching Episode may be referenced by many placements. Full detail: `LESSON_PLANNER_INFORMATION_MODEL.md`, `TEACHING_EPISODE_MODEL.md`.

Enacted truth is a separate chain that references, rather than nests inside, the planning chain:

```text
Lesson Session
        ^
        | referenced by
        |
Session Enactment       (recorded after-class account of that session)
        |
        | referenced by
        v
Placement Enactment     (recorded outcome of one Episode Placement)
```

Session Enactment references the Lesson Session it accounts for; it does not live inside it. Full detail: `ENACTMENT_MODEL.md`.

---

# Carry-Forward

An incomplete Placement Enactment (`partial`, `skipped`, or `carried-forward`) can lead to a new Episode Placement in a future Lesson Session, referencing the same Teaching Episode.

```text
Placement Enactment              New Episode Placement
(original placement,        --->   (future Lesson Session,
 outcome recorded)                  same Teaching Episode)
```

The original Placement Enactment is never rewritten to reflect the future placement — it remains historical truth. Whether `carried-forward` is best represented as a status on the original placement, or as a separate consequence alongside a `partial`/`not-reached` outcome, is not settled by this document (Q-EN-3, `ENACTMENT_MODEL.md`).

---

# Information Ownership

Every type of information has one owner. This table distinguishes creation, ownership, what it references, and who consumes it.

| Information | Created During | Owned By | References | Consumed By |
|---|---|---|---|---|
| Curriculum Lessons | Expedition | Curriculum | — | Planning |
| Teaching Episode | Planning | Teaching Episode | curriculum lesson (provenance) | Lesson Planner |
| Episode Placement | Planning | Lesson Session (ordered reference) | Teaching Episode | Lesson Planner, Placement Enactment |
| Printed Lesson | Put-In | Paper | Lesson Session | Teacher |
| Paper Observations | Rapids | Paper (not stored) | — | Post-Class Debrief |
| Session Enactment | Campfire (Post-Class Debrief) | Session Enactment | Lesson Session | Entire system |
| Session Note | Campfire (Post-Class Debrief) | Session Enactment | — | Historical record |
| Placement Enactment | Campfire (Post-Class Debrief) | Placement Enactment | Episode Placement | Planning, Derived Progress and Analysis |
| Episode Note | Campfire (Post-Class Debrief) | Teaching Episode | — | Future teaching |
| Derived Progress and Analysis | Assimilation | Computed — not owned by an authoring workspace | Session Enactment, Placement Enactments | Units, Forecast |

---

# Sources of Truth

The system intentionally separates different kinds of truth.

## Planning Truth

What I intended to teach.

Produced during Planning.

---

## Enacted Truth

What actually happened.

Captured through the Post-Class Debrief, recorded as Session Enactment and Placement Enactments.

---

## Instructional Knowledge

What I learned as a teacher.

Accumulates over years, largely through durable Episode Notes.

---

## Derived Information (Derived Progress and Analysis)

What the software computes from Session Enactment and Placement Enactments.

Never manually entered.

---

# Design Principle

The teacher records experience.

The software derives meaning.

The software should never ask the teacher to perform calculations it can perform itself.

---

# The Role of Paper

Paper is the bridge between planning and reflection.

It is intentionally outside the software.

Planning produces paper.

Teaching happens on paper.

Reflection begins from paper.

Only the Post-Class Debrief converts paper observations into durable record — either durable enacted history (Session Enactment, Placement Enactments) or durable instructional knowledge (Episode Notes). Paper marks themselves are never a stored object, and no other workspace or in-class interaction independently creates that durable record.

---

# Architectural Invariant

Every piece of enacted instructional history enters the system through one path:

```text
Teach

|

Paper

|

Post-Class Debrief

|

Session Enactment + Placement Enactments

|

Derived Information

|

Planning
```

There is one source of enacted truth.

Every other workspace observes it.

None duplicate it.

---

# Open Questions Referenced Here (Not Resolved)

This document does not resolve the following; see the linked documents for current status.

- Q-EN-1, Q-EN-2, Q-EN-3, Q-EN-4, Q-EN-5, Q-EN-8 — `ENACTMENT_MODEL.md`, "Open Questions"
- Q-EM-1, Q-EM-3 — `TEACHING_EPISODE_MODEL.md`, "Open questions"

In particular, whether `carried-forward` is a status on the original placement or a separate consequence relationship (Q-EN-3) remains unresolved. The Carry-Forward relationship above reflects only that a future placement is created — it does not assert a representation.

---

# Guiding Principle

Year Planner exists to extend the teacher's memory across time.

It helps prepare before teaching.

It stays out of the way during teaching.

It faithfully remembers afterward.

Everything else is built on that foundation.
