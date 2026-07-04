# Information Flow

**Document Status:** Foundational Architecture  
**Purpose:** Define how instructional information is created, owned, and consumed throughout the Year Planner Suite.

---

# Purpose

The Year Planner Suite is built on a simple principle:

> **Instructional information should be authored once and reused many times.**

Every piece of instructional information should have a single source of truth.

Other applications consume that information for their own purpose rather than maintaining duplicate planning systems.

This document defines those ownership boundaries.

---

# First Principle

## Outputs Are Not Authors

Planning occurs where instructional work is created.

Downstream applications should never become parallel planning systems.

Instead, they should consume existing instructional information and present it for a particular audience or task.

This keeps the system coherent while eliminating duplicate entry.

---

# Information Flow

Instructional information flows through the suite.

```text
Forecast
        ?
        ? Strategic awareness
        ?

Units
        ?
        ? Instructional intent
        ?

Today
        ?
        ? Operational selection
        ?

Lesson Planner
        ?
        ? Daily instructional record
        ?

Output Channels
        ?
        ??? Monday Manager
        ??? Print Views
        ??? Parent Communication
        ??? Substitute Plans
        ??? LMS Export
        ??? Future AI Summaries
```

Information generally moves in one direction.

Later work may enrich earlier planning, but ownership remains unchanged.

---

# Source of Truth

Every kind of instructional information should have one owner.

| Information | Source of Truth |
|--------------|-----------------|
| Strategic pacing | Forecast |
| Forecast interpretation | Forecast |
| Curriculum structure | Units |
| Unit purpose | Units |
| Learning outcomes | Units / Lessons |
| Current instructional context | Today |
| Daily instructional sequence | Lesson Planner |
| Agenda | Lesson Planner |
| Materials | Lesson Planner |
| Teacher reminders | Lesson Planner |
| Homework | Lesson Planner |
| Student deliverables | Lesson Planner |
| Lesson reflections | Lesson Planner |
| Publishable student work | Lesson Planner |

Ownership should never be ambiguous.

---

# Lesson Planner

Lesson Planner is the operational source of truth for daily instruction.

It authors the instructional record for each class period.

Some information remains private to the teacher.

Examples:

- instructional notes
- timing
- classroom organization
- reminders
- reflections

Some information is intended for publication.

Examples:

- homework
- classwork
- student deliverables
- links
- due dates
- weekly summaries

The distinction between private and publishable information should be explicit within the data model.

---

# Temporary vs Permanent Information

Not every piece of instructional information deserves permanent storage.

Lesson Planner should distinguish between working memory and institutional memory.

## Temporary Working Information

Examples:

- handwritten notes
- reminders for today's class
- timing adjustments
- temporary observations
- whiteboard sketches

These support today's instruction and may never become part of the permanent instructional record.

The software should not encourage unnecessary documentation.

---

## Permanent Instructional Knowledge

Examples:

- lesson improvements
- reusable teaching notes
- curriculum revisions
- publishable student work
- instructional reflections

These improve future teaching and should become part of the instructional record.

The software should make preserving valuable instructional knowledge effortless.

---

# Output Channels

Output channels consume instructional information.

They do not author it.

Examples include:

- Monday Manager
- Daily printouts
- Student weekly summaries
- Parent communication
- Substitute plans
- LMS exports
- Future AI summaries

Output channels should remain presentation-oriented.

They should never require duplicate planning.

---

# Monday Manager

Monday Manager is not a planning application.

It is a beautifully formatted publication.

Its question is:

> **What do students need to do this week?**

Its responsibility is to communicate student-facing instructional work clearly.

It derives its information from Lesson Planner.

It does not maintain a separate planning workflow.

---

# Artificial Intelligence

Artificial intelligence assists the teacher.

It does not replace the teacher as author.

AI may help:

- transcribe
- summarize
- organize
- suggest
- publish

Instructional authorship always remains with the teacher.

---

# Implications

This architecture produces several important consequences.

- Teachers enter instructional information once.
- Every instructional artifact has one owner.
- Output channels remain simple.
- Duplicate planning systems are avoided.
- Future integrations become significantly easier because they consume a shared instructional record.
- When a downstream tool appears to require editing, first ask whether that information should instead be authored upstream.

---

# Architectural Test

Whenever a new feature is proposed, ask:

1. Where should this information be authored?
2. Who owns this information?
3. Is this creating a second planning system?
4. Should this instead be another output channel?

If those questions cannot be answered clearly, the architecture should be reconsidered before implementation.

---

# Working Rule

> **Lesson Planner authors.**

> **Output channels publish.**