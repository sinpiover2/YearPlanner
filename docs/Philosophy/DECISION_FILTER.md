# Decision Filter

## Purpose

Every software project accumulates features.

Some improve the product.

Some slowly bury it.

This document exists to help distinguish between the two.

When making a design decision, the goal is not to ask:

> "Can we build this?"

Instead ask:

> "Should this exist?"

The following questions should be considered before introducing any new feature, interaction, workflow, or architectural decision.

---

# Start with teaching, never software.

The first conversation should always be about teaching.

Not interfaces.

Not databases.

Not React.

Ask:

"What actually happens in the classroom?"

"What problem is the teacher experiencing?"

Only after the teaching problem is understood should software be discussed.

If a feature cannot be explained without mentioning software, it probably does not yet solve a real teaching problem.

---

# Build cognitive jigs.

Year Planner exists to reduce unnecessary cognitive effort.

A feature should remove work from the teacher's mind.

Not create new work.

Good questions include:

• What no longer has to be remembered?

• What no longer has to be calculated?

• What no longer has to be reconstructed?

• What no longer competes for attention?

A feature that adds information without removing mental effort should be viewed skeptically.

---

# Preserve teacher judgment.

Teachers make instructional decisions.

Software should not.

The software should organize information.

Surface context.

Reveal patterns.

Reduce friction.

The teacher decides what to teach, when to teach it, and how to respond to students.

---

# One workspace. One mode of thinking.

Different kinds of thinking deserve different environments.

Preparing.

Arranging.

Composing.

Teaching.

Reflecting.

Do not force multiple modes into one workspace.

Whenever a workspace begins feeling complicated, ask whether two different kinds of thinking have accidentally been combined.

---

# Quiet software is good software.

The best interface is often the one that disappears.

The software should rarely announce itself.

Avoid:

• unnecessary badges

• unnecessary banners

• unnecessary warnings

• unnecessary confirmations

• unnecessary decoration

Silence is a feature.

Attention is precious.

---

# Prioritize authored thinking.

The teacher's thinking is the primary artifact.

Curriculum exists to support that thinking.

Reference material should always remain secondary to authored work.

Whenever the interface forces the teacher's ideas below the curriculum, the hierarchy is backwards.

---

# Make the common action effortless.

Optimize for what happens every day.

Not once a semester.

Ask:

"What will this feel like after 180 teaching days?"

Small friction repeated daily matters more than large friction encountered once.

---

# Favor direct manipulation over commands.

Whenever possible, allow teachers to move ideas rather than operate menus.

Dragging.

Reordering.

Grouping.

Splitting.

Arranging.

These feel like thinking.

Copying.

Pasting.

Opening dialogs.

Navigating between screens.

These feel like managing software.

Whenever practical, let teachers manipulate their work directly.

---

# Let teaching create knowledge.

Lesson plans are temporary.

Teaching wisdom is permanent.

The software should make it easy to preserve insights gained during instruction.

Reflection is not documentation.

Reflection is where experience becomes expertise.

---

# Ask what disappears.

Every feature should remove something.

A decision should eliminate:

• remembering

• searching

• repetitive typing

• repeated decisions

• context switching

• unnecessary navigation

If nothing disappears, question whether anything meaningful has been added.

---

# Prefer evolution over invention.

The best ideas usually emerge from repeated observation of teaching.

Avoid inventing workflows.

Instead:

Observe.

Teach.

Reflect.

Notice patterns.

Then build tools around those patterns.

---

# The woodworking test.

Imagine a master woodworker using a jig.

The jig never creates craftsmanship.

It removes unnecessary effort while preserving skill.

Every feature should aspire to the same role.

The software should never replace teaching.

It should make excellent teaching easier.

---

# The final question.

Before implementing any feature, ask one final question:

"If we removed this feature tomorrow, would teaching become harder...

or would only the software become smaller?"

If teaching would not become meaningfully harder, the feature probably does not belong.

---

## In one sentence

Year Planner should continuously remove unnecessary cognitive effort while preserving—and amplifying—the teacher's professional judgment.