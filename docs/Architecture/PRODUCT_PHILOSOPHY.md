# PRODUCT_PHILOSOPHY.md

## Purpose

This document describes the philosophy behind Year Planner.

Architecture documents explain how the system works.

Interaction documents explain how people interact with it.

This document explains why the product exists and what principles should guide every design decision.

Whenever implementation choices become unclear, this document should take precedence.

---

# The Product We Are Building

Year Planner is not a digital lesson plan.

It is not a digital planner.

It is not a document editor.

It is a cognitive tool that helps experienced teachers think more clearly while reducing unnecessary mental effort.

The software should amplify professional judgment rather than replace it.

---

# Teachers Are Not Managing Data

Teachers are continuously answering questions like:

- What happened last Tuesday?
- What should students understand today?
- What still needs to be taught?
- What needs to move to tomorrow?
- Which sections have diverged?
- What should students turn in?

These are questions about teaching.

The software exists to make those questions easier to answer.

The software should never require teachers to think like database administrators.

---

# Software Should Adapt To Teaching

Whenever there is tension between:

the software model

and

the lived experience of teaching,

the software changes.

Teaching does not.

The project is built by observing authentic teaching workflow and translating it into software.

Never invent workflow because it is easier to program.

---

# A Cognitive Jig

A woodworking jig does not build furniture.

It removes unnecessary effort so the craftsperson can focus attention where skill matters.

Year Planner should function the same way.

The software should:

- reduce memory burden
- reduce navigation
- reduce bookkeeping
- reduce repetitive decisions

while increasing the teacher's ability to think about instruction.

The software should never attempt to replace instructional judgment.

---

# Preserve Thinking

The goal is not efficiency.

The goal is preserving attention.

Every unnecessary click,

every unnecessary dialog,

every unnecessary choice,

consumes working memory that should remain available for teaching.

Whenever possible, the software should remove decisions rather than automate thinking.

---

# Arrange vs Compose

Teaching contains two fundamentally different activities.

Arrange

¥ deciding where instruction happens
¥ moving work between days
¥ coordinating sections
¥ pacing

Compose

¥ designing instruction
¥ writing questions
¥ planning explanations
¥ anticipating misconceptions

These are different cognitive modes.

They should occur in different workspaces.

Planning arranges.

Lesson Planner composes.

---

# Reference vs Authorship

Curriculum is reference material.

Teaching Episodes are authored work.

Reference should always support authorship.

It should never visually dominate it.

Whenever there is conflict, authored teaching comes first.

---

# Calm Software

Silence is a feature.

The interface should not constantly report success.

No unnecessary badges.

No unnecessary status.

No congratulatory messages.

No dashboards that exist simply because they can.

The interface should speak only when something requires attention.

---

# Build Around Reality

The software should model what actually happens.

Not what lesson plans look like.

Not what database tables look like.

Not what software usually does.

Reality first.

Software second.

---

# Teacher Wisdom Is The Permanent Artifact

Lessons change.

Curriculum changes.

Schedules change.

Software changes.

The teacher's accumulated instructional wisdom is the most valuable artifact in the system.

The product exists to help teachers build, organize, retrieve, and reuse that wisdom over many years.

Everything else is secondary.

---

# Final Principle

The software should help teachers spend less effort managing information and more effort thinking about students.

If a feature does not reduce cognitive effort or improve instructional thinking, it probably does not belong in Year Planner.