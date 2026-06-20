# Year Planner

Teacher decision-support for curriculum pacing.

Year Planner is designed to help teachers answer one question:

> Am I OK?

It is not a reporting dashboard.

It is not a gradebook.

It is not an LMS.

Year Planner interprets information and helps teachers understand where they are, whether they should care, and what happens if nothing changes.

---

??? apps-script
??? archive
??? Claude Design
?ÊÊ ??? Design Philosophy.md
?ÊÊ ??? Forecast.jpg
?ÊÊ ??? Written Specifications for Forcast Tab.md
??? data
??? docs
?ÊÊ ??? Architecture
?ÊÊ ?ÊÊ ??? API_REFERENCE.md
?ÊÊ ?ÊÊ ??? ARCHITECTURE.md
?ÊÊ ?ÊÊ ??? DESIGN_PHILOSOPHY.md
?ÊÊ ?ÊÊ ??? Forecast Architecture.md
?ÊÊ ?ÊÊ ??? Guiding Principles.md
?ÊÊ ?ÊÊ ??? Sheet Structure.md
?ÊÊ ?ÊÊ ??? System Inventory.md
?ÊÊ ??? Color Scheme Reference.md
?ÊÊ ??? History
?ÊÊ ?ÊÊ ??? BUILD_LOG.md
?ÊÊ ?ÊÊ ??? Decisions.md
?ÊÊ ?ÊÊ ??? FORECAST_V1.md
?ÊÊ ?ÊÊ ??? Phase2-ForecastVisualizations.md
?ÊÊ ??? Reference
?ÊÊ ?ÊÊ ??? Component Inventory.md
?ÊÊ ?ÊÊ ??? Requirements.md
?ÊÊ ??? Releases
?ÊÊ ?ÊÊ ??? v0.9.md
?ÊÊ ??? Roadmap
?ÊÊ     ??? Project_Status.md
?ÊÊ     ??? roadmap.md
??? frontend
?ÊÊ ??? eslint.config.js
?ÊÊ ??? index.html
?ÊÊ ??? package-lock.json
?ÊÊ ??? package.json
?ÊÊ ??? public
?ÊÊ ?ÊÊ ??? favicon.svg
?ÊÊ ?ÊÊ ??? icons.svg
?ÊÊ ??? README.md
?ÊÊ ??? src
?ÊÊ ?ÊÊ ??? api.js
?ÊÊ ?ÊÊ ??? App.css
?ÊÊ ?ÊÊ ??? App.jsx
?ÊÊ ?ÊÊ ??? assets
?ÊÊ ?ÊÊ ?ÊÊ ??? hero.png
?ÊÊ ?ÊÊ ?ÊÊ ??? react.svg
?ÊÊ ?ÊÊ ?ÊÊ ??? vite.svg
?ÊÊ ?ÊÊ ??? index.css
?ÊÊ ?ÊÊ ??? main.jsx
?ÊÊ ??? vite.config.js
??? README.md
??? Repository Map.jpg

# Philosophy

Most teachers are fine most of the time.

The default emotional state is calm.

Information appears in this order:

1. Reality
2. Consequence
3. Recommendation

Timeline = orientation.

Cards = interpretation.

Compression is kindness.

Stability is kindness.

---

# Current Features

### Today

Daily instructional navigation.

Answers:

> Am I OK today?

---

### Units

Medium-term planning.

Answers:

> Am I OK in this unit?

---

### Forecast

Long-range pacing awareness.

Answers:

> Am I OK this year?

Includes:

- Year Outlook
- Year Timeline
- Forecast Cards
- Buffer calculations
- Section-aware forecasting

---

# Technology Stack

Frontend:

- React
- Vite

Backend:

- Google Apps Script

Data Store:

- Google Sheets

Hosting:

- Vercel

---

# Architecture

```text
React Frontend
        ?
Apps Script Endpoint
        ?
Google Sheets
```

Google Sheets stores facts.

The application provides interpretation.

---

# Repository Structure

```text
frontend/
apps-script/
docs/
data/
archive/
```

---

# Core Documents

- Design Philosophy.md
- Architecture.md
- Requirements.md
- Major Decisions.md
- Guiding Principles.md
- Color Scheme Reference.md

---

# Current Status

Phase 2 Ð Forecast Visualizations

Current sprint:

**Sprint 2.2c Ð Timeline Integration**

Visual design is converging.

Forecast logic is considered trustworthy.

---

# Long-Term Vision

The application ultimately consists of four layers:

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

The goal is to compress an entire school year into something a teacher can understand in one or two seconds and think:

> I know where I am.

without having to think very hard.

---

*"The best designs disappear."*