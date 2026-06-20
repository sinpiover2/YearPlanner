# Project Status

## Current Status

**June 2026**

---

# Current Phase

**Phase 2 Ð Forecast Visualizations**

---

# Current Sprint

**Sprint 2.2c Ð Timeline Integration**

---

# Overall Status

Forecast logic is considered trustworthy.

Visual design is converging.

The project is transitioning from experimentation toward the timeline's final form.

---

# Current Focus

Improve the Year Timeline while preserving forecast cards as the interpretation layer.

Primary goals:

- Remove separate break row.
- Integrate school breaks directly into tracks.
- Tighten vertical spacing.
- Add dark progress fill inside units.
- Move toward squared track geometry.
- Soften unit boundaries.
- Preserve stable period rows.

---

# Major Components

## Forecast Banner

Provides overall context and acknowledges unlogged sections.

---

## Year Outlook

Provides high-level pacing summaries.

Includes:

- Buffer meter
- Remaining runway
- Buffer Exhausted state

---

## Year Timeline

Provides orientation.

Shows:

- Unit lengths
- Month axis
- Course grouping
- Section synchronization summaries
- Current position marker
- Expected pace marker
- Optional buffers

Timeline answers:

> Where am I?

---

## Forecast Cards

Provide interpretation.

Cards answer:

- Should I care?
- What happens if nothing changes?
- Can I fix this?

Cards remain the interpretation layer.

---

# Forecast Status States

### On Track

Green.

No action needed.

---

### Monitoring

Amber.

Using some buffer.

Recoverable.

---

### Needs Attention

Amber.

Significant buffer consumption.

Consider compressing optional lessons.

---

### Buffer Exhausted

Red.

Schedule adjustment required.

Red is reserved for true problems.

---

# Major Discoveries

### Drift is geometric.

Teachers understand position better than numerical variance.

---

### The timeline behaves like a map.

Rows stay.

The year stays.

The teacher moves.

---

### Timeline = orientation.

Cards = interpretation.

---

### One dot and one line are better than two dots.

---

### Stability is kindness.

---

# Completed

## Forecast Foundations

? Forecast engine

? Buffer model

? Section-aware pacing

? Threshold calibration

? Banner messaging

? Empty states

? Forecast card ordering

? Forecast card refinement

---

## Year Outlook

? Year Outlook strip

? Buffer meter

? Remaining-buffer visualization

? Buffer Exhausted state

---

## Timeline Foundations

? Unit timeline bars

? Month axis

? Buffer regions

? School break scaffolding

? Course grouping

? Synchronization summaries

? Current position marker

? Expected pace marker

? Hierarchical spacing refinement

---

# Removed From The Roadmap

- Section compression
- Shared rows
- Dynamic collapsing
- Colored position markers
- Separate break row

---

# Current Architecture

Forecast page structure:

Banner

?

Year Outlook

?

Year Timeline

?

Forecast Cards

Cards remain the interpretation layer.

Timeline provides orientation.

---

# Guiding Philosophy

Year Planner is a teacher decision-support tool.

The organizing question is:

> Am I OK?

Information order:

1. Reality
2. Consequence
3. Recommendation

Default emotional state:

Calm.

Most teachers are fine most of the time.

Build depth before breadth.