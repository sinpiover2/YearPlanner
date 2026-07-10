# Lesson Planner Architecture

## Core distinction

The app distinguishes between a planned curriculum lesson and an enacted lesson session.

## Planned Curriculum Lesson

A planned curriculum lesson is a durable curriculum object.

It belongs to Units.

It may include:

- lesson title
- curriculum goals
- unit sequence
- planned days
- curriculum links
- teacher notes

It answers:

> Where is instruction supposed to go?

## Lesson Session

A Lesson Session is the actual class period the teacher plans, teaches, and reflects on.

It may begin from one or more Planned Curriculum Lessons, but once created it becomes an independent instructional outline.

Lesson Sessions own enactment.

Curriculum Lessons own intent.

Teachers should feel completely free to revise, reorder, replace, split, merge, or omit instructional actions while planning or teaching.

These revisions belong to the Lesson Session unless the teacher explicitly chooses to improve the curriculum.

It answers:

> What happens in class today?

## Lesson Session may include

- agenda / flow
- timed line items
- curriculum-linked activities
- non-curriculum line items
- student deliverables
- teacher moves
- materials and links
- checks for understanding
- assessment evidence
- adaptations
- section-specific changes
- after-class reflection

## Line Items

A Lesson Session is made of line items.

Each line item may be one of several types:

- warm-up
- launch
- activity
- discussion
- practice
- assessment
- exit ticket
- homework
- admin
- review
- intervention
- reflection
- student work time
- transition

Each line item may optionally connect to:

- a planned curriculum lesson
- one or more curriculum goals
- a student deliverable
- a material or link

## Student Deliverables

Deliverables belong to the Lesson Session.

A Deliverable is not simply a note.

It represents work assigned to students during that instructional session.

Examples include:

- handout
- assignment
- notebook work
- Desmos activity
- Amplify / Kiddom work
- exit ticket
- homework
- submitted product

A Deliverable may optionally include a due date.

Because Deliverables have their own instructional lifecycle, they should be treated as first-class instructional objects rather than ordinary notes.

## Ownership boundaries

Units owns planned curriculum.

Planning organizes instructional sessions.

Lesson Planner owns enacted instruction.

Forecast owns pacing and instructional risk.

Today launches the correct Lesson Session.

Changes made while planning belong to the Lesson Session by default.

Updating the Curriculum Lesson should always require an explicit, intentional action.

## Important principle

Lesson Planner is a trusted instructional notebook.

It should help teachers think, revise, and experiment safely.

Planning should feel effortless.

Experimentation should feel safe.

Teachers should never worry that improving today's lesson will accidentally modify the durable curriculum.

## Long-term implication

Reflection attaches to Lesson Sessions.

Curriculum improvement attaches to Curriculum Lessons.

A Lesson Session may eventually recommend improvements back to the curriculum, but those improvements should always be reviewed and intentionally accepted.

The system therefore preserves both:

- what was intended
- what was enacted
- how instruction evolved over time
