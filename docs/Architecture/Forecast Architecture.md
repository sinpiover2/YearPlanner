# Forecast Architecture

## Purpose

Year Planner is a decision-support tool, not a reporting dashboard.

The teacher's underlying question is:

> Am I OK?

Most of the time the answer should be:

> Yes.

---

## Forecast Page Structure

Banner

?

Year Outlook

?

Year Timeline

?

Forecast Summary Cards

---

## Responsibilities

### Timeline

Orientation.

Answers:

- Where am I?

---

### Forecast Cards

Interpretation.

Answers:

- Should I care?
- What happens if nothing changes?
- What should I do?

---

## Card Pipeline

Forecast calculations

?

forecastCardUtils.js

?

Forecast summaries

?

ForecastSummaryCard

?

Rendered cards

---

## Severity Levels

1. Buffer Exhausted

2. Needs Attention

3. Monitoring

4. On Track

Cards are sorted by severity.

---

## Design Goal

Move from:

"Here is information."

toward:

"Here is whether you need to care."

The default emotional state should be calm.