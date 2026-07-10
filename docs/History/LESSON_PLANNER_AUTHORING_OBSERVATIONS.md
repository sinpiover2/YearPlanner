# Lesson Planner Authoring Observations

This document records observed teacher behavior during authentic lesson planning.

These observations are research evidence.

They should not automatically become architecture or implementation requirements.

## Authoring sequence

The teacher commonly works in this order:

1. Create an instructional action.
2. Write what happens.
3. Create additional actions.
4. Review and reorder the lesson.
5. Revise action titles after writing notes.
6. Add or import Learning Targets.
7. Mark Deliverables.
8. Add Teacher Moves, Evidence, Materials, and Reflection as needed.

This supports the principle:

> Teachers first build the lesson. Then they enrich the lesson.

## Action creation

Instructional actions are often created in sequence.

They may also be inserted later after reviewing the whole lesson.

The system should therefore support both forward authoring and later insertion.

## Revision

The teacher expects to:

- move actions frequently
- add actions after reviewing
- revise titles after writing notes
- split actions
- merge actions
- replace actions
- remove actions

Revision is not an exception or correction.

It is the normal planning state.

## Collapse behavior

The teacher will usually collapse an action before authoring the next one.

Collapse represents a shift of attention rather than an attempt to hide information.

The completed thought should recede without disappearing.

## Learning Targets

When building a lesson manually, Learning Targets are generally added after the action title and instructional outline exist.

When importing a Planned Curriculum Lesson from Units, the teacher expects the Learning Targets to arrive with the lesson.

Imported Learning Targets become part of the Lesson Session and may be revised there without changing the Curriculum Lesson.

## Curriculum import

A Planned Curriculum Lesson imported from Units becomes an independent working copy inside the Lesson Session.

Session changes should be effortless.

Curriculum changes should require deliberate friction and explicit intent.

## Deliverables

The teacher often recognizes a Deliverable while authoring the instructional action.

A Deliverable may also be marked later or removed after reconsideration.

Deliverable status should therefore be easy to toggle without opening a separate workflow.

Due dates should be optional.

Useful due-date interactions may include:

- Next class
- a specific date
- blank by default

The correct default remains an open implementation question.

## Hierarchy

The teacher expects to indent or nest instructional actions.

This suggests that future Lesson Planner items may need hierarchical relationships rather than only a flat ordered list.

The exact depth, interaction, and data model remain open questions.

## Minimal formatting

The teacher expects a minimal set of text-emphasis tools:

- bold
- italic
- underline

Formatting should support instructional emphasis without turning Lesson Planner into a general-purpose document editor.

## Trust

The first major authoring failure occurred when work disappeared after navigating away.

Automatic local persistence removed that failure.

This supports the principle that trust precedes advanced capability.

Teachers should think about teaching, not saving.
