# Lesson Planner Decisions

## D1 — Outline first, time canvas later

Lesson Session Items will initially render as a flat editable outline.

The proportional time-canvas remains the approved long-term rendering once duration becomes reliable enough to carry visual weight.

## D2 — Core objects

The core architecture is:

- LessonSession
- SessionItem
- Deliverable

A LessonSession is the enacted class container.

A SessionItem is one ordered thing that happens during class.

A Deliverable is something students receive, complete, submit, or are assessed on.

## D3 — Session Item naming

Use "Session Item" in teacher-facing and architecture language.

Code may use `LessonSessionItem` where clarity requires it.

Avoid "Block" as the primary term because it is too generic.

## D4 — Phase and type are separate

Session Items separate instructional phase from operational type.

Phase answers:

> What part of the learning arc is this?

Initial phases:

- Warm-up
- Launch
- Explore
- Discuss
- Synthesize
- Practice
- Assess
- Reflect

Type answers:

> What kind of work is this operationally?

Initial types:

- Instruction
- Assessment
- Admin
- Transition
- Homework
- Intervention
- Extension

## D5 — Curriculum linking

A LessonSession may have a primary curriculum lesson.

A SessionItem may optionally link more precisely to:

- unit
- lesson
- one or more goals / I Can statements

Curriculum links are optional at the item level.

When present, item-level curriculum links become the strongest anchor for reflection and future reuse.

## D6 — Reflection anchoring

Reflection begins as enacted-session history.

It becomes durable curriculum history only when attached to a curriculum-linked SessionItem or explicitly promoted by the teacher.

Session-level reflection answers:

> What happened today?

Item-level reflection answers:

> What happened during this activity?

Curriculum reflection answers:

> What should be remembered for future teaching?

## D7 — Deliverables have durable identity

Deliverables should be first-class objects because they have their own lifecycle.

Students receive, complete, submit, or are assessed on deliverables.

Teachers may reuse, revise, grade, or retire them.

Deliverables are separate objects architecturally, but should feel inline while planning.

Minimal Deliverable fields:

- DeliverableID
- Title
- DeliverableType
- Description
- Link
- Graded
- VisibleToStudent
- ReuseStatus

## D8 — Student visibility

SessionItems and Deliverables should include `VisibleToStudent`.

Default guidance:

- instructional activities: visible
- student deliverables: visible
- admin: hidden
- transitions: hidden
- teacher-only notes: hidden

This supports the future Student View.

Student View should be built from the same instructional objects the teacher uses:

- Learning Targets: what am I learning?
- Today's Activities: what are we doing?
- Deliverables: what do I need to complete or submit?

## D9 — Session Items must move

SessionItems must support:

- reorder within a session
- duplicate
- copy
- move to another LessonSession

This reflects actual teaching, where activities often spill over or need to be carried forward.

A moved item should preserve origin history rather than becoming disconnected from its original plan.

## D10 — Session Items have a lifecycle

A SessionItem is not only created and completed.

It moves through an instructional lifecycle:

- Plan
- Prepare
- Teach
- Reflect
- Harvest
- Archive

Plan answers:

> What will happen?

Prepare answers:

> What do I need ready?

Teach answers:

> What is happening now?

Reflect answers:

> What happened?

Harvest answers:

> What should survive into future curriculum or routines?

Archive preserves the enacted record.

Reflection is temporary.

Harvest is permanent.

Reflection captures what happened.

Harvest decides what deserves to improve the durable curriculum, reusable teaching moves, deliverables, or future planning defaults.

Version 1 does not need a full Harvest workflow, but reflection data should be stored so that future "Promote to curriculum" or "Save as routine" actions remain possible.

## Proposed minimal object model

### LessonSession

- LessonSessionID
- Date
- CourseSectionID
- CourseID
- PrimaryUnitID
- PrimaryLessonID
- Title
- Status
- ReflectionNotes

### SessionItem

- SessionItemID
- LessonSessionID
- SortOrder
- Phase
- Type
- Title
- Description
- PlannedMinutes
- ActualMinutes
- LinkedUnitID
- LinkedLessonID
- LinkedGoalIDs
- VisibleToStudent
- TeacherNotes
- ReflectionNotes
- Completed
- OriginSessionID

### Deliverable

- DeliverableID
- Title
- DeliverableType
- Description
- Link
- Graded
- VisibleToStudent
- ReuseStatus

### SessionItemDeliverables

- SessionItemID
- DeliverableID
