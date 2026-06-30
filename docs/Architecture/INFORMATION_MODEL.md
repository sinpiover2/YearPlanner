# Information Model

## Purpose

The Information Model defines the enduring information architecture of Year Planner.

It answers:

- What information exists?
- What does each piece of information represent?
- Who owns it?
- Who authors it?
- When does it change?
- Which subsystems use it?

This document describes the instructional model of the application.

It intentionally does **not** describe implementation details such as databases, APIs, React components, or storage.

---

# Design Philosophy

Teaching consists of three distinct kinds of information.

1. The teacher's instructional intentions.
2. What actually happened during instruction.
3. The meaning derived from comparing the two.

Year Planner therefore organizes information into three domains:

- Planned Curriculum
- Enacted Curriculum
- Interpretation

Every piece of information belongs to exactly one domain.

Subsystems may consume information across domains.

They do not share ownership.

---

# Domain 1 — Planned Curriculum

The Planned Curriculum represents instructional intent.

It exists before instruction begins.

It changes only when the teacher intentionally revises the curriculum.

The Units subsystem is the canonical owner of the Planned Curriculum.

---

## Course

Represents a complete course of study.

Examples:

- Math 8
- Integrated Math 1

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is revised

Consumed By:

- Forecast
- Units
- Today
- Lesson Planner

---

## Unit

Represents a coherent body of learning within a course.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is reorganized

Consumed By:

- Forecast
- Units
- Today
- Lesson Planner

---

## Unit Purpose

Explains why the unit exists.

Teacher-facing.

Represents the educational rationale.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Teacher intentionally revises the curriculum

Consumed By:

- Units

---

## Learning Destination

Describes the enduring understanding students should possess by the conclusion of the unit.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is revised

Consumed By:

- Units

---

## Learning Progression

Describes the conceptual development throughout the unit.

Represents the learning journey rather than the lesson sequence.

It is an authored curriculum artifact.

It is not derived from lesson order.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Teacher intentionally revises the curriculum

Consumed By:

- Units

---

## Lesson

Represents a planned instructional experience.

Lessons exist independently of calendar dates.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Teacher revises the curriculum

Consumed By:

- Units
- Today
- Lesson Planner

---

## Planned Time

Represents the instructional time the curriculum was designed to require.

Examples:

- Required Days
- Built-in Instructional Flexibility

This information describes the curriculum.

It does not describe classroom reality.

Canonical Owner:

- Units

Authored By:

- Teacher
- Curriculum provider

Changes When:

- Curriculum is revised

Consumed By:

- Units
- Forecast

---

# Domain 2 — Enacted Curriculum

The Enacted Curriculum represents classroom reality.

It is created as instruction occurs.

The Today subsystem is the canonical owner of the Enacted Curriculum.

---

## Instructional Event

Represents a single instructional day for a specific section.

Examples:

- Math 8 Period 2
- September 14

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Instruction occurs

Consumed By:

- Today
- Forecast

---

## Lesson Completion

Represents progress through the planned curriculum.

Examples:

- completed
- partially completed
- not completed

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Instruction occurs

Consumed By:

- Today
- Forecast
- Units (orientation only)

---

## Instructional Notes

Teacher observations recorded during or after instruction.

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Teacher edits notes

Consumed By:

- Today

---

## Section-Specific Instructional Adjustment

Represents a temporary modification made for one section.

Examples:

- additional practice day
- continuation day
- skipped activity
- modified pacing for one class

These adjustments modify instruction for a specific section.

They do not modify the planned curriculum.

Canonical Owner:

- Today

Authored By:

- Teacher

Changes When:

- Teacher modifies instruction for one section

Consumed By:

- Today
- Forecast

---

# Domain 3 — Interpretation

Interpretation represents understanding derived from comparing the planned curriculum with the enacted curriculum.

Interpretation is computed.

It is not authored.

Forecast is the canonical owner of Interpretation.

---

## Pacing Status

Examples:

- On Track
- Monitoring
- Needs Attention
- Buffer Exhausted

Canonical Owner:

- Forecast

Generated From:

- Planned Curriculum
- Enacted Curriculum

Consumed By:

- Forecast

---

## Forecast

Represents projected instructional progress.

Examples:

- projected completion
- recoverability
- instructional runway

Canonical Owner:

- Forecast

Generated From:

- Planned Curriculum
- Enacted Curriculum

Consumed By:

- Forecast

---

## Recommendations

Represents suggested responses to projected pacing.

Examples:

- continue current pace
- reduce optional instruction
- recover buffer

Canonical Owner:

- Forecast

Generated From:

- Forecast rules

Consumed By:

- Forecast

---

# Curriculum Revision

Curriculum revision is distinct from instructional recording.

Instructional events describe what happened.

Curriculum revisions intentionally modify the planned curriculum.

Examples include:

- adding a lesson
- splitting a lesson
- reordering lessons
- revising planned instructional time

Curriculum revisions may be initiated from multiple subsystems.

However, every curriculum revision modifies the Planned Curriculum owned by Units.

---

# Information Dependencies

Subsystems may consume information owned by other subsystems.

Examples include:

Units

- consumes Lesson Completion solely to provide orientation within the planned curriculum.

Forecast

- consumes the Planned Curriculum.
- consumes the Enacted Curriculum.
- produces Interpretation.

Lesson Planner

- consumes the Planned Curriculum.
- consumes relevant instructional history when appropriate.
- does not own curriculum structure.

Ownership never changes because information is shared.

---

# Ownership Principles

Information has one canonical owner.

Information may have many consumers.

Interpretation is never stored when it can be computed.

Subsystems own responsibilities—not data duplication.

Whenever uncertainty exists about where a feature belongs, determine:

1. Which information does it modify?
2. Which subsystem canonically owns that information?

The answer determines where the feature belongs.