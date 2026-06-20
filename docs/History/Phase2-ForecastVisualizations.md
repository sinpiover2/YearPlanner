# Phase 2 Ð Forecast Visualizations

## Purpose

Phase 2 adds visual support to the forecast system.

Visuals support decisions.

They do not replace interpretation.

The underlying question is:

> Am I OK?

Cards remain the interpretation layer.

Timeline provides orientation.

---

# Design Philosophy

Year Planner is a teacher decision-support tool, not a reporting dashboard.

Information order:

1. Reality
2. Consequence
3. Recommendation

Default emotional state:

Calm.

Most teachers are fine most of the time.

Cards remain the interpretation layer.

Visuals support understanding rather than replace it.

---

# Major Milestones

## Year Outlook

Implemented:

- Forecast Banner
- Year Outlook strip
- Buffer meter
- Remaining buffer visualization
- Buffer Exhausted state
- Banner improvements

Major insight:

Emphasize remaining capacity rather than consumed capacity.

---

## Timeline Foundations

Implemented:

- Unit timeline bars
- Month axis
- Optional buffer regions
- School break scaffolding
- Current position marker

Major insight:

The timeline behaves like a map.

---

## Drift Geometry

Implemented:

- Black position marker
- Expected pace line

Removed:

- Second position marker

Major insight:

Drift is geometric.

Teachers understand position better than numerical variance.

---

## Course Grouping

Implemented:

- Course grouping
- Synchronization summaries
- Period labels

Major insight:

Periods are landmarks.

Rows stay.

---

## Spacing Refinement

Implemented:

- Hierarchical spacing
- Course header refinement
- Tighter vertical rhythm

Major insight:

Structure carries meaning before text.

---

# Major Discoveries

## Drift Is Geometric

Teachers naturally think:

> Where am I?

not:

> What is my variance?

Position is more important than numbers.

---

## The Timeline Behaves Like a Map

Rows stay.

The year stays.

The teacher moves.

---

## One Dot and One Line Are Better Than Two Dots

Two dots feel like two objects.

One dot and one reference are easier to understand.

---

## Timeline = Orientation

The timeline answers:

> Where am I?

Cards answer:

- Should I care?
- What happens if nothing changes?
- Can I fix this?

The separation matters.

---

## Stability Is Kindness

Stable geometry reduces cognitive load.

Synchronization should change interpretation, not structure.

---

## Breaks Are Terrain

Breaks are part of the year itself.

They are not decorations.

---

# Forecast States

## On Track

Meaning:

No meaningful concern.

Color:

Green.

Recoverability:

No action needed.

---

## Monitoring

Meaning:

Using some buffer.

Color:

Amber.

Recoverability:

Recoverable within current buffer.

---

## Needs Attention

Meaning:

Significant buffer consumption.

Color:

Amber.

Recoverability:

Consider compressing upcoming optional lessons.

---

## Buffer Exhausted

Meaning:

Required content no longer fits.

Color:

Red.

Recoverability:

Buffer exhausted Ñ schedule adjustment required.

Red is reserved exclusively for Buffer Exhausted.

---

# Thresholds

```text
variance <= 0

OR

buffer used < 10%

? On Track

10Ð60%

? Monitoring

60Ð100%

? Needs Attention

buffer used > total buffer

? Buffer Exhausted
```

---

# Forecast Architecture

Forecast is section-aware.

DailyProgress rows are grouped by:

```text
CourseSectionID
```

Only active sections are forecasted.

Only sections with logged progress produce cards.

Unlogged sections are acknowledged by the banner.

Cards are sorted by urgency.

Cards remain the interpretation layer.

---

# Forecast Page Structure

```text
Banner

?

Year Outlook

?

Year Timeline

?

Forecast Cards
```

Timeline provides orientation.

Cards provide interpretation.

---

# Removed Ideas

Removed from the roadmap:

- Section compression
- Shared rows
- Dynamic collapsing

Reason:

Changing geometry increases cognitive load.

Synchronization should affect interpretation, not structure.

---

## Separate Break Row

Removed.

Reason:

Breaks are terrain, not decorations.

---

## Colored Position Markers

Removed.

Reason:

Markers provide orientation, not interpretation.

---

# Current Test Data

### M8-P1

No rows.

Tests unlogged sections.

---

### M8-P2

On Track.

---

### M8-P3

0.5 day behind.

On Track.

---

### IM1-P5

8 of 22 buffer days used.

Monitoring.

---

### IM1-P6

14 of 22 buffer days used.

Needs Attention.

---

# Outcome

Phase 2 transformed Forecast from a collection of cards into a navigable year map.

The most important discoveries were not visual.

They were conceptual.

Drift is geometric.

The timeline behaves like a map.

Rows stay.

The year stays.

The teacher moves.

Timeline = orientation.

Cards = interpretation.

The goal remains:

Compress an entire school year into something a teacher can understand in one or two seconds and think:

> I know where I am.

without having to think very hard.