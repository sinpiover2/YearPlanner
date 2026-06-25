# Component Inventory

This document describes the major user-facing components of Year Planner.

Its purpose is to preserve responsibilities rather than implementation details.

---

# Forecast View

## Forecast Banner

Purpose:

Provide overall context.

Responsibilities:

- Acknowledge unlogged sections.
- Communicate overall status.
- Establish emotional tone.

Question answered:

> Am I OK?

---

## Year Outlook

Purpose:

Provide summary.

Responsibilities:

- Show runway consumption.
- Surface Buffer Exhausted situations.
- Provide high-level pacing awareness.

Question answered:

> Am I OK?

---

## Year Timeline

Purpose:

Provide orientation.

Responsibilities:

- Show unit lengths.
- Show month positions.
- Show current position.
- Show expected position.
- Show optional buffers.
- Show synchronization summaries.
- Show school breaks.

Question answered:

> Where am I?

Timeline = orientation.

---

## Forecast Cards

Purpose:

Provide interpretation.

Responsibilities:

- Explain significance.
- Explain consequences.
- Suggest actions.

Questions answered:

- Should I care?
- What happens if nothing changes?
- Can I fix this?

Cards = interpretation.

---

# Today View

Purpose:

Support daily teaching.

Question answered:

> Am I OK today?

Responsibilities:

- Show current lesson.
- Show next lesson.
- Show current unit.
- Show lesson sequence.
- Support progress logging.

---

# Units View

Purpose:

Support medium-term planning.

Question answered:

> Am I OK in this unit?

Responsibilities:

- Show unit structure.
- Show lesson sequence.
- Show unit progress.
- Show pacing.

---

# Sidebar

Purpose:

Provide navigation.

Responsibilities:

- Course selection.
- Unit navigation.
- High-level statistics.

---

# Data Layer

## api.js

Purpose:

Communication with Apps Script.

Responsibilities:

- Load data.
- Save progress.
- Create lessons.
- Update lessons.
- Delete lessons.
- Reorder lessons.

---

# Styling Layer

## App.css

Purpose:

Visual system.

Responsibilities:

- Layout.
- Typography.
- Color system.
- Timeline appearance.
- Responsive behavior.

---

# Main Application

## App.jsx

Purpose:

Coordinate all views.

Responsibilities:

- State management.
- Forecast calculations.
- View selection.
- Rendering.

---

# Architectural Principle

Components should have a single responsibility.

Orientation and interpretation should remain separate.

Timeline = orientation.

Cards = interpretation.

The best components disappear.