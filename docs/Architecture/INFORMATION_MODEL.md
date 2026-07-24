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

# Domain 1 � Planned Curriculum

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

It is created when the teacher records what happened, not while instruction is occurring — teaching itself happens from paper, without required software interaction.

Lesson Planner is the canonical owner of the Enacted Curriculum. The Post-Class Debrief is the architectural entry point through which it is recorded; no other workspace independently authors it (see `POST_CLASS_DEBRIEF.md`, `ENACTMENT_MODEL.md`, "Canonical Entry Point").

Today consumes the Enacted Curriculum to display current status. It is not the canonical owner and does not author it.

---

## Session Enactment

Represents the recorded, after-class account of one Lesson Session for one section on one instructional date — the enacted counterpart to a planned meeting.

Examples:

- Math 8, Period 2, September 14 — debrief complete, minor interruption noted

Canonical Owner:

- Lesson Planner

Authored By:

- Teacher, through the Post-Class Debrief

Changes When:

- The teacher completes or revises a Post-Class Debrief

Consumed By:

- Today
- Forecast
- Lesson Planner

Full field-level detail lives in `ENACTMENT_MODEL.md`; it is not restated here.

---

## Placement Enactment

Represents the recorded outcome of one planned placement of instructional content within a Lesson Session.

Examples:

- reached
- partial
- skipped
- carried-forward

A `skipped` or `carried-forward` outcome may lead to a new placement in a future Lesson Session — the reconciled replacement for what earlier material called a "Section-Specific Instructional Adjustment." That adjustment is a planning consequence of an enacted outcome, not a separate stored object (see `ENACTMENT_MODEL.md`, "Carry-Forward").

Canonical Owner:

- Lesson Planner

Authored By:

- Teacher, through the Post-Class Debrief

Changes When:

- Instruction occurs and is recorded

Consumed By:

- Today
- Forecast
- Units (orientation only)
- Lesson Planner

Full status definitions live in `ENACTMENT_MODEL.md` and `TEACHING_EPISODE_MODEL.md`; they are not restated here.

---

## Session Note

Teacher observations that are primarily true about one class period — this section, this date. Non-portable; stays with the Session Enactment in which it was recorded.

Canonical Owner:

- Lesson Planner

Authored By:

- Teacher, through the Post-Class Debrief

Changes When:

- The teacher adds or edits a session-specific observation

Consumed By:

- Lesson Planner

See `ENACTMENT_MODEL.md`, "Session Notes," for full detail.

---

## Episode Note

Durable teaching knowledge about a piece of instructional content, captured through the Post-Class Debrief. Unlike Session Enactment and Placement Enactment, an Episode Note is not itself an enacted-truth record — it is stored with the reusable Teaching Episode it describes. It appears in this domain only because of when it is authored, not because Teaching Episode is part of the Enacted Curriculum.

Canonical Owner:

- Teaching Episode

Authored By:

- Teacher, through the Post-Class Debrief

Changes When:

- The teacher records or revises durable teaching knowledge

Consumed By:

- Lesson Planner

See `TEACHING_EPISODE_MODEL.md` and `ENACTMENT_MODEL.md`, "Notes Model," for full detail.

---

## Deprecated Terminology

Earlier material used different names for the concepts above. These are retained here only as a lookup, not as canonical terms.

| Old term | Read instead as |
|---|---|
| Instructional Event | No single replacement — read as whichever fits context: `Teaching Episode` (the reusable planned content), `Episode Placement` (that content scheduled within a Lesson Session), `Session Enactment` (the enacted record for the Lesson Session), or `Placement Enactment` (the enacted result for one Episode Placement) |
| Lesson Completion | Placement Enactment status (`reached` / `partial` / `skipped`) |
| Instructional Notes | Session Note (session-specific) or Episode Note (episode-specific), depending on content |
| Section-Specific Instructional Adjustment | a carry-forward, skip, split, or merge recorded through the Post-Class Debrief |

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

Session Enactments and Placement Enactments describe what happened.

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

- consumes Placement Enactment status solely to provide orientation within the planned curriculum.

Forecast

- consumes the Planned Curriculum.
- consumes the Enacted Curriculum.
- produces Interpretation.

Today

- consumes the Enacted Curriculum to display current status.
- does not author it.

Lesson Planner

- consumes the Planned Curriculum.
- owns and authors the Enacted Curriculum through the Post-Class Debrief (see `POST_CLASS_DEBRIEF.md`).
- consumes relevant instructional history when preparing future sessions.
- does not own curriculum structure.

Ownership never changes because information is shared.

---

# Ownership Principles

Information has one canonical owner.

Information may have many consumers.

Interpretation is never stored when it can be computed.

Subsystems own responsibilities�not data duplication.

Whenever uncertainty exists about where a feature belongs, determine:

1. Which information does it modify?
2. Which subsystem canonically owns that information?

The answer determines where the feature belongs.