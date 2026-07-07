# PLANNING_DECISIONS.md

**Status:** Living Architecture Document

---

# Purpose

This document records the architectural decisions that define how the Planning workspace operates.

Unlike **PLANNING_WORKSPACE.md**, which specifies behavior and interaction, this document records the long-term decisions that guide implementation.

Each decision should answer four questions:

- Why was this decision necessary?
- What was decided?
- What are the consequences?
- Which other architectural decisions depend on it?

This document should change slowly.

Behavior evolves.

Architecture should remain stable.

---

# Decision Status

Each decision should carry one of the following states.

- **Accepted** Ñ part of the architecture
- **Proposed** Ñ under discussion
- **Superseded** Ñ replaced by a newer decision (never delete; preserve history)

---

# D1 Ñ Curriculum Links Are Durable References

## Context

Planning schedules curriculum.

It does not duplicate curriculum.

Lesson Sessions must remain connected to the curriculum they represent.

## Decision

A Lesson Session stores a durable reference to a curriculum lesson.

Curriculum remains the source of truth.

Planning never copies curriculum content into sessions.

## Consequences

- curriculum edits automatically appear in Planning
- Units remains curriculum owner
- future reflections can reconnect to the same curriculum lesson

## Impacts

- D6
- D9
- D10

**Status:** Accepted

---

# D2 Ñ Lesson Sessions Are Closed Objects

## Context

The Planning board is an arrangement workspace.

It should remain easy to scan.

Inline editing permanently increases visual complexity.

## Decision

Session Tiles are never edited inline.

Cards expose actions.

Composition occurs inside the Lesson Session sheet.

## Consequences

- stable visual layout
- lower cognitive load
- consistent editing experience
- simpler implementation

## Impacts

- D8

**Status:** Accepted

---

# D3 Ñ Planning Owns Instructional Time

## Context

Each workspace owns a distinct instructional responsibility.

Planning must remain focused on arranging instruction across time.

## Decision

Planning owns:

- instructional week
- session placement
- session sequencing
- lesson composition

Planning does not own:

- curriculum editing
- pacing calculations

## Consequences

Ownership remains clear.

Future features naturally belong somewhere.

## Impacts

- D4
- D5

**Status:** Accepted

---

# D4 Ñ Shared Pacing Engine

## Context

Planning occasionally needs pacing information.

Forecast owns pacing.

Duplicating pacing logic would eventually create conflicting answers.

## Decision

All pacing information originates from a shared pacing engine.

Planning consumes pacing information.

Planning never computes pacing locally.

## Consequences

- one source of truth
- consistent pacing throughout the application
- Forecast remains authoritative

## Impacts

- D6
- D12

**Status:** Accepted

---

# D5 Ñ Shared Calendar and Schedule Resolution

## Context

Instructional meetings depend upon:

- calendars
- holidays
- rotations
- block schedules
- instructional days

These concerns belong to the platform, not Planning.

## Decision

A shared calendar engine determines instructional meetings.

Planning requests instructional meetings.

Planning never calculates them independently.

## Consequences

Planning stays focused on instructional planning rather than calendar logic.

## Impacts

- D8
- D9

**Status:** Accepted

---

# D6 Ñ Unit Shelf Ownership

## Context

Different sections naturally drift over time.

An unplaced lesson may exist for one section but not another.

## Decision

Each section owns its own Unit Shelf queue.

The visible shelf is always scoped to a single section.

## Consequences

- queue counts remain accurate
- placement remains section-specific
- Planning accurately reflects real teaching

## Impacts

- D1
- D4

**Status:** Accepted

---

# D7 Ñ Session State Is Communicated Visually

## Context

The weekly board should communicate readiness quickly without becoming noisy.

## Decision

Session state is communicated through visual language.

The state dot is the primary representation.

State words are not displayed on cards.

States include:

- Draft
- Planned
- Prepared
- Completed

## Consequences

- quieter interface
- faster scanning
- stronger visual vocabulary

## Impacts

None

**Status:** Accepted

---

# D8 Ñ Lesson Composition Happens in a Sheet

## Context

Teachers spend most of their planning time composing lessons.

Leaving the weekly board interrupts workflow.

## Decision

Lesson composition opens in a right-side Lesson Session sheet.

The weekly Planning board remains visible.

The board never expands or rearranges.

## Consequences

- preserves spatial memory
- minimizes navigation
- keeps Planning as the primary workspace

## Impacts

- D2
- D5

**Status:** Accepted

---

# D9 Ñ Sibling Session Propagation

## Context

Teachers frequently teach the same lesson across multiple sections.

Rebuilding identical lessons wastes time.

## Decision

Planning may copy a Lesson Session to sibling sections.

Propagation creates independent Lesson Sessions.

Future edits do not synchronize automatically.

## Consequences

- faster weekly planning
- sections remain free to diverge naturally
- avoids synchronization complexity

## Impacts

- D1
- D5

**Status:** Proposed

---

# D10 Ñ Reflection Belongs to Curriculum History

## Context

Teaching should improve future planning.

Reflection loses most of its value if it remains attached only to a dated session.

## Decision

Reflection is attached to the durable curriculum relationship rather than only to a specific Lesson Session.

Future Lesson Sessions retrieve previous reflections automatically.

## Consequences

- instructional knowledge compounds over years
- lessons improve continuously
- historical teaching experience becomes searchable and reusable

## Impacts

- D1

**Status:** Proposed

---

# D11 Ñ Printing Is an Output

## Context

Printing prepares teachers for instruction.

It does not create instructional content.

## Decision

Planning owns:

- Print Lesson
- Print Day

Printing never edits instructional data.

## Consequences

Printing remains a one-way output channel.

## Impacts

None

**Status:** Accepted

---

# D12 Ñ Monday Manager Is an Export

## Context

Planning frequently shares instructional information with external systems.

Monday Manager remains independently owned.

## Decision

Planning exports information for Monday Manager.

Planning never edits Monday Manager directly.

## Consequences

- clear ownership
- reliable workflow
- loose coupling between systems

## Impacts

- D4

**Status:** Accepted

---

# Future Decisions

Potential future decisions include:

- Reflection capture workflow
- Cascade rescheduling
- Lesson version history
- AI-assisted lesson preparation
- Shared departmental lesson libraries
- Substitute teacher lesson packets
- Long-term instructional analytics

These should not be added until architectural decisions become necessary.

---

# Decision Process

Before implementing a feature that changes ownership or architecture:

1. Determine whether a new architectural decision is required.
2. Record the decision here.
3. Reach consensus.
4. Update related design documents if necessary.
5. Implement the feature.

Design documents describe behavior.

Decision documents describe ownership.

Implementation follows both.