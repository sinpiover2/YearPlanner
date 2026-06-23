# Forecast Architecture

## Purpose

Year Planner is a teacher decision-support tool.

The purpose of the Forecast tab is not to display pacing data.

The purpose is to help teachers answer:

> Am I OK?

with as little mental effort as possible.

---

# Core Design Principle

Information is revealed in layers.

Teachers should not be required to interpret raw data before understanding whether action is needed.

The Forecast tab follows this disclosure model:

```text
Reassurance
? Orientation
? Explanation
? Investigation
```

Each layer answers a different question.

---

# Information Order

Within every layer, information should flow in this order:

```text
Reality
? Consequence
? Recommendation
```

The system should interpret information rather than merely display it.

---

# Forecast Page Structure

```text
Pacing Forecast

Forecast Banner

Year Outlook

Year Timeline

Forecast Cards
```

---

# Layer Responsibilities

## Reassurance

### Forecast Banner

Purpose:

Answer:

> Should I care?

Responsibilities:

- Communicate overall pacing status.
- Surface major concerns.
- Establish emotional tone.
- Reassure when no action is needed.
- Direct attention when action is needed.

The banner is the primary emotional layer.

---

## Orientation

### Year Outlook

Purpose:

Answer:

> Which sections deserve attention?

Responsibilities:

- Show all sections simultaneously.
- Surface pacing state.
- Communicate relative urgency.
- Provide rapid scanning.

The Outlook strip is intentionally compact.

Its purpose is navigation, not explanation.

---

## Explanation

### Year Timeline

Purpose:

Answer:

> Why?

Responsibilities:

- Show unit progression.
- Show expected pace.
- Show current pace.
- Show optional buffers.
- Show calendar context.
- Show break impacts.
- Provide year-scale orientation.

The timeline behaves like a map.

It provides context but does not make recommendations.

---

## Investigation

### Forecast Cards

Purpose:

Answer:

> What should I do?

Responsibilities:

- Interpret pacing conditions.
- Explain likely outcomes.
- Describe remaining flexibility.
- Provide recommendations.
- Support teacher decision making.

Cards are the primary interpretation layer.

---

# Timeline Philosophy

The timeline behaves like a map.

Rows stay.

The year stays.

The teacher moves.

Position is more important than numbers.

Drift is geometric.

Breaks are terrain, not decoration.

Stable structure reduces cognitive load.

---

# Layer Separation

```text
Banner
= Reassurance

Outlook
= Orientation

Timeline
= Explanation

Cards
= Investigation
```

Each layer has a distinct responsibility.

Redundant explanations should be removed.

---

# Forecast States

## On Track

Green.

Plan remains within available flexibility.

No action needed.

---

## Monitoring

Amber.

Some buffer is being consumed.

Current pacing remains recoverable.

---

## Needs Attention

Amber.

Significant buffer consumption.

Pacing should be watched carefully.

Future flexibility may need to be protected.

---

## Buffer Exhausted

Red.

Required content no longer fits within available flexibility.

Schedule adjustment or scope adjustment is likely required.

Red is reserved exclusively for Buffer Exhausted.

---

# Forecast Architecture

Forecasts are section-aware.

DailyProgress is grouped by:

```text
CourseSectionID
```

Forecast calculations are generated independently for each section.

Forecast recommendations currently use:

```text
variance
bufferRemaining
bufferUsed
optionalDaysRemaining
currentUnitOptionalDays
forecast state
```

Recommendations are generated from forecast data rather than directly from state labels.

---

# Visibility Rules

Severity governs default visibility, not existence.

All information remains discoverable.

Default visibility:

```text
Buffer Exhausted
Visible

Needs Attention
Visible

Monitoring
Visible

On Track
Collapsed into reassurance
```

Low-severity information is folded, not removed.

---

# Major Discoveries

- One dot and one line are better than two dots.
- Drift is geometric.
- The timeline behaves like a map.
- Stability is kindness.
- Severity governs visibility.
- The best designs disappear.