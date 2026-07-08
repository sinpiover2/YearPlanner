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

It may reference one or more planned curriculum lessons, but it is not identical to them.

It may also include items that are not tied to the planned curriculum.

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

Lesson Session owns the student-facing deliverables for that class.

Examples:

- handout
- notebook entry
- Desmos activity
- Kiddom / Amplify task
- assignment
- exit ticket
- homework
- submitted product

## Ownership boundaries

Units owns planned curriculum.

Planning organizes the week and selects the active lesson context.

Lesson Planner owns the enacted session.

Forecast owns pacing and instructional risk.

Today launches the correct session for the current day.

## Important principle

Lesson Planner should not simply edit the planned curriculum lesson.

It should help the teacher build and teach the actual class session.

The UI may say "Lesson Planner," but the architecture should treat this as Session Planning.

## Long-term implication

Reflection should attach to enacted Lesson Sessions while also being able to improve the durable curriculum over time.

This allows the app to preserve both:

- what was supposed to happen
- what actually happened
