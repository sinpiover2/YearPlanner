# LESSON_SESSION_IMPLEMENTATION_DECISIONS.md

# Purpose

This document records implementation-level architectural decisions that must be settled before Teacher Desk is built.

The major architecture is complete.

These decisions define the seams between components so implementation remains consistent.

This document is append-only.

---

# Guiding Principle

Architecture should become simpler as implementation approaches.

Every decision recorded here should reduce ambiguity rather than introduce new concepts.

---

# Decision 1 Ñ LessonSession Identity

## Decision

Every LessonSession has a surrogate identifier.

```text
LessonSessionID
```

Natural keys should not be used as the primary identifier.

## Rationale

Schedules change.

Sections may meet multiple times in one day.

Stable identifiers prevent orphaned or duplicate instructional records.

---

# Decision 2 Ñ Lesson Coverage

## Decision

A LessonSession may reference multiple curriculum lessons.

Replace a single lesson reference with an ordered collection.

```text
lessonRefs
```

Each reference includes:

- CurriculumLessonID
- Order
- Primary flag

One lesson is always designated as the primary lesson.

The Today workspace may continue displaying only the primary lesson.

## Rationale

Real instruction frequently:

- finishes one lesson
- begins another
- stretches a lesson across multiple meetings

The model must support classroom reality.

---

# Decision 3 Ñ Schedule Service

## Decision

All schedule resolution belongs to a shared domain service.

Working name:

```text
Schedule Service
```

Responsibilities include:

- instructional calendar
- meeting schedules
- special schedules
- holidays
- minimum days
- instructional week boundaries
- next meeting resolution

## Rule

No workspace computes schedule information independently.

Consumers include:

- Forecast
- Units
- Today
- Teacher Desk
- Monday Manager

---

# Decision 4 Ñ Enacted Truth

## Decision

Enacted instructional truth flows through one channel.

```text
LessonSession

?

Units Enacted Ledger

?

Forecast
```

LessonSession records instructional reality.

Units owns the enacted ledger.

Forecast interprets the ledger.

Forecast never reads LessonSessions directly.

---

# Decision 5 Ñ LessonSession State

## Decision

Instructional Segment state is persistent.

Recommended states:

```text
Pending

Current

Complete

Skipped

Bumped
```

The current segment is part of the LessonSession.

It is not temporary interface state.

---

# Decision 6 Ñ Carry Forward

## Decision

"Bump" moves unfinished instructional work to the section's next scheduled meeting.

Rules:

- next meeting resolved by Schedule Service
- destination LessonSession created if necessary
- provenance preserved
- origin segment marked Bumped
- software reveals conflicts but does not resolve them automatically

---

# Decision 7 Ñ Instructional Week

## Decision

InstructionalWeek is a derived view.

It is never authored.

The week is generated from LessonSessions and the Schedule Service.

Consumers include:

- Weekly Planning
- Monday Manager
- Weekly Print Views

No Week object will be created.

---

# Decision 8 Ñ Materials

## Decision

Materials are authored at the Instructional Segment level.

LessonSession materials are derived.

Author:

```text
InstructionalSegment.materials
```

Derive:

```text
LessonSession.materialChecklist
```

---

# Decision 9 Ñ Reflection

## Decision

Reflection is authored in the LessonSession.

Reflection is indexed by Curriculum Lesson.

When planning future LessonSessions covering the same curriculum lesson, prior reflections may be surfaced.

Reflection becomes instructional memory.

---

# Decision 10 Ñ Publications

## Decision

Publication is audience-aware.

Publishability is not a boolean.

Supported audiences may include:

- Students
- Parents
- Substitute
- Department
- Teacher

The initial implementation may expose only student publication.

Digital publications are live views.

Printed publications are snapshots.

---

# Decision 11 Ñ Deliverables

## Decision

Deliverables remain durable instructional objects.

They are authored once.

They may appear in many outputs.

Examples:

- Homework
- Exit Ticket
- Quiz
- Assessment
- Project Milestone

---

# Decision 12 Ñ AI Provenance

## Decision

Text-bearing instructional objects record authorship.

Suggested values:

```text
Teacher

AI

AI Edited
```

Teacher review remains authoritative.

---

# Decision 13 Ñ Workspace Handoffs

## Decision

Every workspace transition explicitly defines the context passed between workspaces.

Examples include:

Today ? Teacher Desk

Teacher Desk ? Units

Teacher Desk ? Monday Manager

Units ? Teacher Desk

No workspace should reconstruct context already known elsewhere.

---

# Decision 14 Ñ Segment Library

## Decision

Segment Library is acknowledged and intentionally deferred.

No reusable segment storage will be implemented until the object has been designed.

---

# Decision 15 Ñ Naming

## Decision

Project vocabulary is maintained separately.

See:

```text
NAMES.md
```

---

# Adopted Principles

The following principles are now part of the architecture.

> Focus moves. Layout doesn't.

> One LessonSession. Two workflows.

> Enacted truth flows uphill through one channel.

> Lesson Planner authors. Output channels publish.

---

# Implementation Readiness

Teacher Desk implementation should begin only after these decisions are reflected in the data model.

Minimum required support:

- LessonSessionID
- lessonRefs
- Schedule Service boundary
- Persistent segment state
- Enacted truth channel
- Derived InstructionalWeek
- Segment-level materials
- Audience-aware publication model