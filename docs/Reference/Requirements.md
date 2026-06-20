# Requirements

Year Planner is a teacher decision-support tool.

Its purpose is to help teachers answer:

> Am I OK?

All features should support that goal.

---

# Architecture

Frontend:

- React
- Vite

Backend:

- Google Apps Script

Data Store:

- Google Sheets

Hosting:

- Vercel

Time Zone:

- America/Los_Angeles

---

# Core Requirements

The application must:

- Show reality before consequence.
- Show consequence before recommendation.
- Default to calm.
- Treat teachers as professionals.
- Reduce cognitive load.
- Support planning rather than reporting.

---

# Forecast Requirements

Forecasts must be section-aware.

DailyProgress rows are grouped by:

```text
CourseSectionID
```

Only active sections participate in forecasting.

Only sections with logged progress produce forecast cards.

Cards are sorted by urgency:

1. Buffer Exhausted
2. Needs Attention
3. Monitoring
4. On Track

---

# Forecast States

## On Track

Requirements:

- No action required.
- Green visual treatment.

---

## Monitoring

Requirements:

- Recoverable.
- Amber visual treatment.

---

## Needs Attention

Requirements:

- Significant buffer consumption.
- Amber visual treatment.

---

## Buffer Exhausted

Requirements:

- Required content no longer fits.
- Red visual treatment.

Red is reserved exclusively for this state.

---

# Timeline Requirements

The timeline exists to provide orientation.

The timeline answers:

> Where am I?

The timeline must show:

- Unit lengths.
- Month positions.
- Current position.
- Expected position.
- Optional buffers.
- Synchronization summaries.

The timeline must not provide recommendations.

---

# Structural Requirements

Rows stay.

Periods are landmarks.

Synchronization changes interpretation, not geometry.

Stable structure is preferred over dynamic structure.

Breaks are terrain, not decorations.

---

# Marker Requirements

Current position:

- Black dot.

Expected position:

- Thin vertical line.

Markers provide orientation, not interpretation.

Marker colors must not vary by state.

---

# Color Requirements

Semantic colors:

- Green ? On Track
- Amber ? Monitoring
- Amber ? Needs Attention
- Red ? Buffer Exhausted

Course identity colors must be independent of semantic colors.

Red is reserved for Buffer Exhausted.

---

# Progress Requirements

Progress representation uses:

- Light background = planned
- Dark fill = completed

Progress should be represented by area rather than icons whenever possible.

---

# Layout Requirements

Forecast page structure:

```text
Banner

?

Year Outlook

?

Year Timeline

?

Forecast Cards
```

Responsibilities:

- Banner ? context
- Outlook ? summary
- Timeline ? orientation
- Cards ? interpretation

---

# Today View Requirements

Question:

> Am I OK today?

Must show:

- Current lesson
- Next lesson
- Current unit
- Daily pacing

---

# Units View Requirements

Question:

> Am I OK in this unit?

Must show:

- Unit completion
- Unit pacing
- Lesson drift

---

# Future Scenario Requirements

Question:

> If I change something, will I still be OK?

Support:

- Lesson compression
- Lesson skipping
- Reordering
- Scenario comparison

---

# Non-Requirements

Year Planner is not:

- A gradebook
- An LMS
- A standards tracker
- A curriculum repository
- A reporting dashboard

Features that primarily support those purposes should be rejected.

---

# Success Criteria

The application should allow a teacher to understand an entire year in one or two seconds and answer:

> Am I OK?

without having to think very hard.

Teachers should be able to understand:

1. Where they are.
2. Whether they should care.
3. What happens if nothing changes.
4. Whether they can recover.

---

# Guiding Principle

The best designs disappear.

Timeline = orientation.

Cards = interpretation.

Drift is geometric.

Rows stay.

The year stays.

The teacher moves.

Stability is kindness.