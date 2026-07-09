# Lesson Planner Ñ Interaction Philosophy

## Purpose of This Document

This document describes how Lesson Planner should feel to use.

It does not describe implementation.

It does not describe components.

It does not propose features.

It extends `DESIGN_PHILOSOPHY.md`, `LESSON_PLANNER.md`, and `LESSON_PLANNER_DECISIONS.md` into the one dimension those documents leave open: the felt experience of planning a lesson.

The architecture is settled.

What remains is discipline about how that architecture meets the teacher's hand and eye.

These principles should still be correct long after any particular screen has been redrawn.

---

## What This Surface Is

Lesson Planner is a thinking environment.

It is not a form.

It is not a document editor.

It is not a database with a friendly face.

Its job is to receive teaching thoughts and quietly arrange them into something teachable.

Teachers do not arrive with finished lessons.

They arrive with fragments Ñ a good question, a worry about pacing, an activity that worked last year, a thing a student always gets wrong.

A finished lesson is what those fragments become.

The environment exists to hold them while they become it.

If planning ever feels like data entry, the surface has failed at its only purpose.

---

## The Work It Supports

Teaching moves through a natural progression:

Think

Capture

Organize

Teach

Reflect

Harvest

Improve

This is the felt companion to the Session Item lifecycle already recorded in `LESSON_PLANNER_DECISIONS.md`.

The Session Item lifecycle describes what happens to the instructional object.

This progression describes what happens in the teacher's thinking.

The planner exists to support both without confusing one for the other.

The environment must not interrupt it.

Capture comes before structure.

A half-formed idea should be easy to set down before it is asked to declare its phase, its type, its duration, or its place in the arc.

Structure is something the planner offers afterward, quietly, once there is something to structure.

An environment that demands completeness at the moment of capture punishes the very thinking it exists to protect.

---

## The Planner Organizes Thinking

Planning is naturally non-linear.

Teachers rarely think in the order a lesson will ultimately be taught.

Ideas arrive out of sequence.

A question may appear before its activity.

A misconception may reshape the lesson after its opening has already been planned.

The planner exists to receive those thoughts without demanding immediate structure.

Its work is to quietly organize them into a coherent instructional sequence.

Organization is not something required before thinking.

It is something the environment offers after thinking has begun.

A teacher should never feel they are constructing a lesson to satisfy the software.

They should feel the software is helping reveal the lesson they were already building.

---

## The Instructional Action Is the Primary Object

The unit of a lesson is not a category.

It is an action Ñ a thing students do, or a thing the teacher does with them.

Everything else hangs from that action.

Learning targets explain why the action matters.

Teacher moves explain how it will be led.

Evidence explains how its effect will be seen.

None of these stand on their own.

They exist because an action exists.

Traditional planners invert this.

They begin with objectives and standards and treat the lesson as a form that must satisfy them.

Lesson Planner begins with the teaching and lets meaning accumulate around it.

This ordering is not cosmetic.

It is closer to how planning actually happens, and it is the reason this tool is different in kind, not only in appearance, from the planners it replaces.

Protect it.

Whenever a design decision would make a category more prominent than an action, it is moving in the wrong direction.

---

## The Collapsed Outline Is the Home State

Teachers will spend most of their planning time reading, not editing.

They will scan the shape of a lesson far more often than they will open any single part of it.

So the collapsed view is not a summary of the real interface.

It is the real interface.

It should read as an outline Ñ a sequence of instructional actions a teacher can take in at a glance Ñ not as a stack of separate objects to be managed one at a time.

An outline is something you read down.

A collection of cards is something you act upon.

The difference is felt before it is understood, and it decides whether the teacher experiences flow or friction.

Density in this view should come from instructional information.

The action. The phase. The type. The time.

It should never come from interface furniture.

A crowded outline should be crowded with teaching.

---

## Expansion Is Focus, Not Navigation

Opening a Session Item is opening a developing thought.

It is not going somewhere.

Expansion exists so a teacher can think more deeply about one action without losing the shape of the whole.

It deepens the current place; it does not relocate the teacher to a new one.

Because of this, expansion should reveal only what focused thinking needs, and it should read as the same object growing more considered Ñ not as a different kind of surface appearing.

An expanded item that feels like a form has broken the metaphor.

An expanded item that feels like a paragraph the teacher is still writing has kept it.

---

## Collections Serve the Action

Learning, teacher moves, evidence, and any collection like them are supports, not sections.

They belong to the action.

They should read as facets of one thought, arranged for the eye that is reading down a lesson, not as parallel fields waiting to be filled.

When a collection is empty, it should remain silent.

An action with no evidence yet attached should show no evidence Ñ not an announcement that evidence is absent.

The teacher should encounter a collection only when they have given it something to hold, or when they reach for it deliberately.

Collections that assert themselves before they contain anything turn a thinking surface back into a form.

---

## Silence Is a Feature

Absence is information.

An empty collection means the teacher has not needed it yet, and that is a complete and honest state.

The interface should not fill that silence with words about the silence.

It should not label what is not there.

It should not prompt for what has not been reached for.

Text is expensive.

Every word the software writes is a word the teacher must read and then dismiss.

The reward for a lesson that is going well is quiet.

The environment should be generous with that reward.

---

## Authored Content Outranks Interface Furniture

The teacher's words are the content.

Everything the software adds Ñ labels, controls, indicators, containers Ñ is furniture.

Furniture exists to serve the content and must never compete with it.

Two consequences follow, and both are permanent.

The teacher's authored thinking is never truncated to preserve the software's layout.

If something must yield to fit, it is the furniture, not the sentence the teacher wrote.

And the software's own labels never draw more attention than the teaching they annotate.

A label that is louder than the thought beneath it has reversed the only hierarchy that matters here.

---

## Chrome Appears Only When It Improves a Decision

Controls are summoned, not stationed.

The resting state of the outline should carry only what a teacher reads.

At rest, the software should resemble a lesson more than an editor.

Teachers should primarily see instructional thinking.

Editing tools should quietly appear when needed and disappear when they are no longer helping.

The means to reorder, remove, or restructure should arrive when the teacher turns toward a particular action, and recede when they turn away.

The test is simple.

If a control is present but is not improving the decision in front of the teacher right now, it is spending attention and returning nothing.

An interface at rest should look like a lesson, not like a set of tools for editing one.

---

## Editing Should Feel Like Writing

The boundary between reading a lesson and writing one should be as thin as the environment can make it.

A teacher should be able to move from taking in the outline to changing it without feeling that they have crossed into a different mode of the software.

Rearranging the sequence should feel like moving a thought, not like operating a record.

The planner should feel authored.

It should never feel operated.

When a teacher finishes, the feeling they should carry is that they wrote something Ñ an instructional outline that grew under their hands Ñ not that they completed something the software required of them.

---

## Revision Is Part of Thinking

Planning is iterative.

Teachers continually refine lessons as understanding grows.

Reordering an instructional action is not correcting an error.

Rewriting a learning target is not admitting failure.

Removing an activity is often evidence that planning has improved.

Lesson Planner should make revision feel natural rather than consequential.

Teachers should feel free to move, reshape, merge, divide, or replace instructional actions without hesitation.

The planner should reward refinement rather than completion.

---

## Authorship Belongs to the Teacher

The environment may organize.

It may arrange, suggest, and tidy.

It never authors.

This extends the principle already established in `DESIGN_PHILOSOPHY.md`: awareness before advice, and reality before interpretation.

Any help the planner offers should arrive as an offering the teacher can accept, revise, or ignore Ñ never as an accomplished fact the teacher must undo.

The teacher is the expert.

The planner holds the pen only long enough to hand it back.

---

## The Software Should Disappear

The measure of this surface is not how much a teacher does in it.

It is how little of it they notice while doing it.

When class begins, the planner should already be forgotten.

Its work was finished the moment the teacher stopped thinking about the software and started thinking about the lesson.

Everything above serves that single disappearance.

---

## What Success Feels Like

Success is not a fuller interface.

It is a lighter one.

A teacher using Lesson Planner well should feel that they are writing an instructional outline that gradually becomes teachable Ñ not filling out a plan, and not managing a set of objects.

They should reach the end of planning with more of their attention intact than they started with.

The lesson should become progressively clearer while the software becomes progressively less noticeable.

The application succeeds when teachers remember the lesson they planned rather than the interface they used to create it.

The best version of Lesson Planner is the one that gets out of the way so completely that, afterward, the teacher remembers the lesson they built and forgets the tool they built it in.

---

## Appendix Ñ Observations That Should Remain Implementation Decisions

The design review that informed this document surfaced several worthwhile observations that are *not* interaction philosophy. They are tactical choices that will change as the product matures, and enshrining them as architecture would freeze decisions that should stay flexible. They belong in the decisions log or the implementation work, not here.

**The expand affordance's exact form.** That depth should be discoverable without instruction is a principle. Whether that discoverability is carried by a disclosure indicator, a hover state, or some later mechanism is an implementation decision that should follow the platform and the moment.

**The reorder gesture.** That rearranging should feel like moving a thought is a principle. Whether it is done by dragging, by a handle, by a swipe, or by something not yet designed is tactical, and different contexts may answer it differently.

**How and where summoned controls appear.** That chrome should be summoned rather than stationed is a principle. The specific gesture that summons it, and the exact place it appears, are details that should remain free to improve.

**The geometry of an expanded item.** That collections serve the action, stay silent when empty, and never truncate authored content is architecture. Whether the supporting collections are arranged as a single stack, as columns, or otherwise is an implementation decision, so long as it honors those constraints.

**Typographic and labeling house style.** Sentence case, label restraint, and similar conventions are style-guide matters shared across the suite. They support these principles but are not themselves interaction architecture.

**Specific corrections noted during review** Ñ such as index numbering, the placement of connection status, and the separation of pedagogical phase from lifecycle stage in any selection control Ñ are decisions-log items and bug fixes. They should be recorded where decisions and corrections live, not elevated to philosophy.