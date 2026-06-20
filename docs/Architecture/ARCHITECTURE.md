# Architecture

Year Planner is a teacher decision-support tool.

The purpose of the architecture is to separate orientation from interpretation.

Teachers should be able to answer:

> Am I OK?

with as little mental effort as possible.

---

# Information Order

Information always flows in this order:

1. Reality
2. Consequence
3. Recommendation

The interface should interpret information rather than merely display it.

---

# Forecast Page Structure

The Forecast page consists of four layers.

```
Banner

?

Year Outlook

?

Year Timeline

?

Forecast Cards
```

---

# Responsibilities

## Forecast Banner

Purpose:

Provide overall context.

Responsibilities:

- Acknowledge unlogged sections.
- Communicate overall state.
- Establish emotional tone.

---

## Year Outlook

Purpose:

Provide high-level pacing summaries.

Responsibilities:

- Show runway consumption.
- Summarize section status.
- Surface Buffer Exhausted situations.

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

The timeline answers:

> Where am I?

The timeline does not provide recommendations.

---

## Forecast Cards

Purpose:

Provide interpretation.

Cards answer:

- Should I care?
- What happens if nothing changes?
- Can I fix this?

Cards remain the interpretation layer.

---

# Timeline Philosophy

The timeline behaves like a map.

Rows stay.

The year stays.

The teacher moves.

Position is more important than numbers.

Drift is geometric.

---

# Layer Separation

Timeline = orientation.

Cards = interpretation.

Visuals support decisions.

Cards make decisions understandable.

---

# Forecast States

## On Track

Green.

No action needed.

---

## Monitoring

Amber.

Using some buffer.

Recoverable.

---

## Needs Attention

Amber.

Significant buffer consumption.

Optional lesson compression may be worth considering.

---

## Buffer Exhausted

Red.

Schedule adjustment required.

Red is reserved for true problems.

---

# Forecast Architecture

Forecasts are section-aware.

DailyProgress rows are grouped by CourseSectionID.

Only active sections are forecasted.

Only sections with logged progress produce cards.

Cards are sorted by urgency:

1. Buffer Exhausted
2. Needs Attention
3. Monitoring
4. On Track

---

# Timeline Principles

Rows stay.

Periods are landmarks.

Synchronization changes interpretation, not geometry.

Stable structure reduces cognitive load.

Breaks are terrain, not decorations.

---

# Major Discoveries

One dot and one line are better than two dots.

Drift is geometric.

The timeline behaves like a map.

Stability is kindness.

The best designs disappear.