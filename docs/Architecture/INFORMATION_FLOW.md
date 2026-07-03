# Information Flow

Year Planner is designed so instructional information is authored once and reused many times.

This document defines how information moves through the system and how downstream outputs should behave.

---

# Core Principle

## Outputs Are Not Authors

Planning happens at the point where instructional work is created.

Downstream tools should not become duplicate planning systems.

They should consume existing instructional information and present it for a specific audience.

---

# Source of Truth

Each kind of information should have one owner.

| Information | Source of Truth |
|------------|-----------------|
| Pacing and projections | Forecast |
| Curriculum structure | Units |
| Unit purpose | Units |
| Current lesson selection | Today |
| Daily instructional plan | Lesson Planner |
| Agenda | Lesson Planner |
| Homework | Lesson Planner |
| Student deliverables | Lesson Planner |
| Materials | Lesson Planner |
| Teacher notes | Lesson Planner |
| Reflection | Lesson Planner |

---

# Output Channels

Output channels publish information created elsewhere.

Examples:

- Monday Manager
- Daily printouts
- Student weekly summaries
- Parent summaries
- Substitute plans
- LMS exports
- Future AI summaries

These outputs should not require duplicate entry.

---

# Monday Manager

Monday Manager is not a planning tool.

It is a beautifully formatted publication.

Its question is:

> What do students need to do this week?

Its job is to present student-facing work clearly.

It should derive its information from Lesson Planner rather than maintaining a separate planning workflow.

---

# Lesson Planner as Author

Lesson Planner is the source of truth for daily instructional work.

Some Lesson Planner information remains teacher-facing:

- agenda notes
- timing
- groups
- materials
- reminders
- reflections

Some Lesson Planner information can publish outward:

- homework
- classwork
- deliverables
- links
- due dates
- weekly student-facing summaries

The distinction between private teacher notes and publishable student-facing work should be explicit in the data model.

---

# Implications

- Teachers should not enter the same instructional information twice.
- Every instructional artifact should have a clear owner.
- Output channels should remain simple.
- Future integrations become easier because they consume a common instructional record.
- If a downstream tool needs editing fields, first ask whether that information should be authored upstream.

---

# Working Rule

Lesson Planner authors.

Output channels publish.
