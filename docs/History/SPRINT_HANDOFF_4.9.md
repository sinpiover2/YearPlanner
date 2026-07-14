# Sprint 4.9 Ñ Planning 2.0: Arrange vs Compose

---

# READ FIRST

Before writing code, read these documents in this order.

1. docs/Architecture/PRODUCT_PHILOSOPHY.md
2. docs/Architecture/COGNITIVE_JIGS.md
3. docs/Architecture/DECISION_FILTER.md
4. docs/Architecture/WORKSPACE_PRINCIPLES.md
5. docs/Architecture/LESSON_PLANNER_INTERACTION.md
6. docs/Architecture/LESSON_PLANNER_INFORMATION_MODEL.md

These documents now define the product more than the current implementation.

Software should conform to these principles, not the other way around.

---

# Repository State

Branch:

main

Latest commits:

31589bd  Copy lesson plans between sections

9171a68  Attach curriculum lessons to teaching episodes

4548678  Persist lesson planner drafts by session

Planning ? Lesson Planner navigation is complete.

Lesson Sessions persist independently.

Curriculum can be attached per Teaching Episode.

Lesson plans can be copied between sections.

Individual Teaching Episodes can be copied and pasted between Lesson Sessions.

All builds pass.

---

# Current Terminal Workflow

Always use four terminals.

?? DEV

Run:

npm run dev

Leave running.

---

?? BUILD

Every feature ends with:

npm run build

Do not continue until it passes.

---

?? PROJECT

Development work.

Editing.

Navigation.

Searching.

---

?? GIT

Only source control.

git status

git add

git commit

git push

Keep git isolated.

---

# What We Learned This Sprint

The biggest discovery was not technical.

It was methodological.

Whenever we discussed software first, progress slowed.

Whenever we discussed actual teaching, breakthroughs happened quickly.

The workflow should therefore be:

Observe teaching.

?

Understand teacher thinking.

?

Translate into software.

Never reverse that order.

The assistant's job is translating.

The teacher's job is describing lived experience.

---

# Important Product Philosophy

Year Planner is NOT

¥ a lesson plan editor

¥ a planner

¥ a document manager

It IS

a cognitive tool that reduces unnecessary thinking so teachers can spend more attention on instruction.

The woodworking analogy became central this sprint.

A jig does not build furniture.

It removes unnecessary effort so craftsmanship can happen.

Year Planner should become a cognitive jig for teaching.

---

# Major Architectural Discovery

Arrange and Compose are different cognitive activities.

Planning

=

Arrange

¥ move work

¥ coordinate sections

¥ pace

¥ bump

¥ schedule

Lesson Planner

=

Compose

¥ think

¥ write

¥ revise

¥ organize instructional ideas

Movement should eventually leave Lesson Planner.

Writing should remain in Lesson Planner.

This appears to be the biggest architectural direction change since introducing the Application Shell.

Do not begin implementing it immediately.

Design it first.

---

# Teaching Discoveries

These questions produced the clearest answers.

"What happened last Tuesday?"

"We finished Lesson 1.2 and started Lesson 1.3."

"What are you changing?"

"I'm changing Lesson 1.2."

Teaching wisdom generally accumulates separately from lesson plans.

Reflection usually happens after school.

Future AI voice notes may become an important capture mechanism.

Lesson plans help organize thinking.

They are not the permanent artifact.

Teaching wisdom is.

---

# New Architecture Documents

Added this sprint:

PRODUCT_PHILOSOPHY.md

COGNITIVE_JIGS.md

DECISION_FILTER.md

These now become part of the permanent architectural foundation.

---

# Claude Review

Claude reviewed the Lesson Planner interaction model.

The most important insight:

The interface currently behaves like documents copied between documents.

The product should instead model

Teaching Episodes

placed into

Section ? Day

placements.

The distinction between placement and copying appears fundamental.

No implementation has been started.

This is still architecture.

---

# Goal For Sprint 4.9

Do NOT immediately implement Planning 2.0.

First answer:

"What does arranging instruction actually look like?"

through teaching conversations.

Then design:

Planning 2.0

using

Arrange

vs

Compose.

Expect mockups before code.

---

# Conversation Workflow

One important process improvement emerged.

The user becomes overwhelmed by large abstract question lists.

Do NOT ask many architectural questions at once.

Instead:

Ask one concrete teaching question.

Receive answer.

Translate into software.

Repeat.

This process produced significantly better architectural decisions.

---

# Response Workflow

Whenever discussion becomes philosophical, continue naturally.

Whenever there is work for the user to perform, always finish responses with:

### Next Action (Jeff)

...

If there is no action:

### Next Action (Jeff)

None.

This reduces working-memory load and fits the Cognitive Jigs philosophy.

---

# First Hour Plan

1.

Read the philosophy documents.

2.

Review Claude's Arrange vs Compose critique.

3.

Do NOT code.

4.

Interview the teacher.

Continue extracting authentic teaching workflow.

5.

Only after understanding the workflow,

begin sketching Planning 2.0.

Design first.

Implementation second.

---

# Success Metric

Success is NOT

adding more features.

Success is reaching a point where experienced teachers say:

"This feels like how I actually think."

If that happens,

implementation will become much easier.