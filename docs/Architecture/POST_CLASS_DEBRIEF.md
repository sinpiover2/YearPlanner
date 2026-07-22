# POST_CLASS_DEBRIEF.md

# Post-Class Debrief

**Status:** Draft Design Principle

**Purpose:** Define the teacher workflow immediately after a class period and establish the information architecture that supports recording what actually happened.

**Related Documents**

- DESIGN_PHILOSOPHY.md
- WORKSPACE_PRINCIPLES.md
- LESSON_PLANNER.md
- LESSON_SESSION.md
- LESSON_PLANNER_INFORMATION_MODEL.md
- TEACHING_EPISODE_MODEL.md
- FORECAST.md
- UNITS.md

---

# Purpose

The Post-Class Debrief captures the reality of instruction while it is still fresh.

It is **not** lesson planning.

It is **not** teaching.

It is the short period immediately after instruction when the teacher records what actually happened so future planning is based on reality rather than memory.

The software should minimize friction during this process while preserving accurate historical information.

---

# The Whitewater Model

Year Planner is organized around the natural rhythm of teaching.

## 1. Expedition

Days or weeks before instruction.

Purpose:

- build curriculum
- create lessons
- estimate pacing
- forecast the year
- prepare materials

Primary workspaces:

- Forecast
- Units
- Planning

---

## 2. Put-In

The minutes before class begins.

Purpose:

- review today's lesson
- mentally rehearse
- print lesson
- gather materials

Primary workspace:

- Lesson Planner

Output:

Printed lesson plan.

---

## 3. Rapids

The class period itself.

This is where teaching happens.

The teacher teaches from paper.

The software intentionally disappears.

The printed lesson becomes the teaching interface.

Small handwritten marks are expected.

Examples:

- draw a line where class stopped
- circle an episode
- write "great discussion"
- note "fire drill"
- draw an arrow to tomorrow
- underline something to improve

These marks exist to support memory, not documentation.

---

## 4. Campfire

Immediately after class.

Purpose:

Transform paper observations into durable digital knowledge.

This is the Post-Class Debrief.

---

# Fundamental Principle

The teacher records experience.

The software derives metrics.

The teacher should never be asked to compute information that the software can infer.

Examples:

Teacher records:

- where instruction stopped
- what students struggled with
- what should change next year
- unusual events
- what needs to happen tomorrow

Software derives:

- instructional days completed
- lesson completion percentage
- pacing variance
- forecast updates
- carried work
- historical analytics

---

# Primary Questions

The Post-Class Debrief answers four questions.

## 1. Where did we get?

Not:

"What fraction of a day did I teach?"

Instead:

- Where did class stop?
- Which activities were completed?
- What remains?

---

## 2. What should I remember?

Examples:

- students loved this activity
- discussion was weak
- manipulatives helped
- use graph paper next year

These become durable instructional knowledge.

---

## 3. What happened today?

Examples:

- fire drill
- shortened schedule
- projector failed
- substitute teacher
- assembly

These belong only to this session.

---

## 4. What does tomorrow need to know?

Examples:

- continue here
- skip activity
- finish warm-up
- review homework first

This informs future planning.

---

# Information Architecture

The Post-Class Debrief records only information the teacher actually knows.

It does not ask the teacher to translate experience into database values.

---

## Session Information

Lives with the Lesson Session.

Examples:

- class interrupted
- shortened period
- session notes
- recording time

Session information never travels to another lesson.

---

## Episode Information

Lives with the Teaching Episode.

Examples:

- better discussion prompt
- reorder examples
- needs manipulatives
- too much cognitive load

Episode information becomes part of future teaching.

---

## Enacted Progress

Lives with the Episode Placement.

Examples:

- reached
- partially completed
- not reached

This represents historical truth for one section on one date.

---

## Derived Information

Never entered directly.

Computed automatically.

Examples:

- instructional days
- pacing
- completion
- forecast changes
- historical reports

---

# The Paper Copy

The printed lesson is the primary teaching interface.

This is intentional.

Teachers should never feel required to interact with software while actively teaching.

Instead, the paper serves as temporary working memory.

Typical paper annotations:

- stopping point
- arrows
- circles
- quick notes
- reminders
- check marks

The Post-Class Debrief exists largely to transfer these observations into durable form.

---

# Design Principles

## Reflection, not administration

The interaction should feel like remembering.

Not filling out a form.

---

## Capture only what matters

Most class periods require very little recording.

Normal days should be extremely fast.

Exceptional days naturally require more detail.

---

## Derive everything possible

Never ask the teacher for:

- pacing calculations
- percentages
- instructional day fractions
- statistics

The computer can compute these.

---

## Preserve calm

The interface should remain visually quiet.

Reflection should never feel like paperwork.

---

## Support imperfect memory

Teachers often record information several minutes—or even hours—after class.

The interface should work with approximate memory rather than demanding unnecessary precision.

---

## Separate reality from planning

Recording what happened and deciding what to do next are different cognitive activities.

The software should distinguish between:

"I taught this."

and

"I want to teach this tomorrow."

---

# Relationship to Other Workspaces

## Lesson Planner

Produces the printed lesson.

Hosts the Post-Class Debrief.

---

## Planning

Consumes the results.

Planning should begin from recorded reality rather than remembered reality.

---

## Units

Displays enacted curriculum progress.

Units should visualize recorded history rather than become a second place to enter it.

There must be only one source of enacted truth.

---

## Forecast

Consumes derived progress.

Forecast should never require direct teacher input.

It observes.

It does not collect.

---

# Success Criteria

The Post-Class Debrief is successful when:

- teachers naturally complete it after class
- recording takes less than one minute on most days
- future planning starts from accurate history
- Forecast becomes more trustworthy
- durable teaching knowledge accumulates year after year
- the software never interrupts instruction

---

# Non-Goals

The Post-Class Debrief is not intended to:

- evaluate teaching
- score lessons
- require extensive data entry
- replace the paper lesson
- encourage computer interaction during class
- become another planning workspace

---

# Guiding Principle

The teacher teaches.

The paper remembers for the next few minutes.

The Post-Class Debrief remembers for the next few years.

The software exists not to tell the teacher how to teach, but to faithfully preserve what happened so tomorrow's planning begins with truth instead of memory.