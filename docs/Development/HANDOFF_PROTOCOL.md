.# Handoff Protocol

## Purpose

The sprint handoff is not a summary of the sprint.

It is the onboarding guide for the next development session.

A successful handoff allows a brand-new ChatGPT conversation to become productive within minutes, without rediscovering architecture, searching for documentation, or revisiting completed design decisions.

The handoff is a project artifact and should receive the same care, review, and continuous improvement as production code.

---

# Guiding Philosophy

## Optimize for startup friction.

The goal is not to write the longest or most complete document.

The goal is to minimize the amount of thinking required before productive work begins.

Every section should answer one question:

> "Will this help the next sprint start faster?"

If the answer is no, remove it.

---

## Explain decisions, not history.

Git records history.

The handoff explains:

- why decisions were made
- what should not be changed
- what remains unresolved
- how to continue without rethinking completed work

Avoid turning the handoff into a changelog.

---

## Every sprint improves the onboarding process.

The handoff itself is part of the project's architecture.

It should become easier to use every sprint.

If a workflow improvement saves future time, document it.

---

# Before Writing the Handoff

Do **not** begin writing immediately.

First review the project from the perspective of someone who has never seen today's work.

Review:

- previous sprint handoff
- architecture documents
- decision records
- roadmap
- sprint notes
- git history
- commits completed this sprint
- documentation created this sprint
- workflow improvements discovered this sprint

Then ask:

- What information did we have to rediscover?
- What slowed startup?
- What questions did we repeatedly answer?
- Which architectural decisions are now settled?
- What should the next sprint never have to search for?
- What workflow became easier?
- What workflow became harder?
- What belongs in permanent documentation instead of another handoff?

Only after answering these questions should writing begin.

---

# Required Sections

Every sprint handoff should contain the following sections.

---

## Sprint Title

Include:

Sprint number

Descriptive sprint title

---

## Sprint Objective

Describe the purpose of the sprint.

Do **not** list features.

Instead explain:

"What problem did this sprint solve?"

---

## Current State

Provide a concise snapshot.

Include:

Completed

Stable

In progress

Known limitations

Current focus

This section should answer:

> "What exists today?"

without requiring further reading.

---

## Read These First

Provide a prioritized reading order.

Only include documents that are genuinely required.

Do **not** overwhelm the next sprint with unnecessary reading.

The goal is confidence, not completeness.

---

## Architecture

Summarize architectural decisions.

Especially include:

- new boundaries
- abstractions
- design principles
- concepts that should not be revisited without good reason

Explain **why**.

---

## Workflow Improvements

Document workflow discoveries with the same care as software improvements.

Examples:

- terminal workflow
- documentation workflow
- git workflow
- testing workflow
- design workflow
- review workflow
- handoff workflow

Workflow improvements compound over time.

Treat them as project assets.

---

## Lessons Learned

Record observations worth carrying forward.

Especially:

things that surprised us

things that failed

things that looked good but weren't

unexpected simplifications

design discoveries

implementation discoveries

authoring discoveries

workflow discoveries

---

## Explicitly Out of Scope

Protect future work.

List:

- intentionally deferred work
- rejected ideas
- things intentionally left unchanged

This prevents accidental scope creep.

---

## Next Sprint

Describe only the immediate objective.

Avoid writing a roadmap.

The next sprint should know exactly what success looks like.

---

## First Hour Plan

Provide a concrete startup sequence.

Example:

1. Read architecture.
2. Read decisions.
3. Run the application.
4. Verify current behavior.
5. Build one real example.
6. Observe friction.
7. Improve one thing.

The next sprint should never wonder how to begin.

---

## Development Notes

Capture information likely to disappear.

Examples:

preferred implementation

UI behavior

important constraints

future considerations

edge cases

temporary compromises

known technical debt

---

## Terminal Workflow

Always include the standard workflow.

### 🔵 PROJECT

Project navigation

Editing assistance

Searching

Documentation

Never run npm or git.

---

### 🟩 DEV SERVER

Run:

```
npm run dev
```

Keep running throughout development.

---

### 🟨 BUILD

Run:

```
npm run build
```

Use frequently.

Build early.

Build often.

---

### 🔴 GIT

All git operations.

Only git commands belong here.

---

# Writing Principles

Prefer explanation over chronology.

Prefer principles over implementation details.

Prefer architecture over features.

Prefer clarity over completeness.

Write for the next sprint, not for history.

The handoff should teach.

---

# Review Cycle

The first draft is never the final handoff.

Every handoff should go through three passes.

---

## Pass 1

Write the document.

Capture everything important.

---

## Pass 2

Pretend you are beginning the next sprint.

Read the handoff from top to bottom.

Ask:

What is confusing?

What requires searching?

What questions remain unanswered?

Revise.

---

## Pass 3

Reduce startup friction.

Shorten.

Reorder.

Clarify.

Remove unnecessary information.

Improve document flow.

Only after this review should the handoff be committed.

---

# Quality Standard

A successful handoff allows a brand-new ChatGPT conversation to:

Understand the project in under ten minutes.

Locate every required document immediately.

Understand current architecture.

Understand current implementation.

Know what not to change.

Know what should happen next.

Begin productive development without orientation questions.

If it cannot do these things, improve the handoff.

---

# Continuous Improvement

Every sprint should begin by reviewing the previous handoff.

Ask:

What worked well?

What caused friction?

What was missing?

What information was unnecessary?

How can startup become even faster?

Carry successful ideas forward.

Remove weak ideas.

Improve the protocol whenever a better process is discovered.

The protocol is a living document.

---

# Final Review Checklist

Before committing the handoff:

☐ Reviewed previous handoff

☐ Reviewed architecture

☐ Reviewed decisions

☐ Reviewed sprint notes

☐ Reviewed git history

☐ Reviewed documentation created this sprint

☐ Reviewed workflow improvements

☐ Added permanent discoveries

☐ Removed obsolete information

☐ Reduced startup friction

☐ Verified document references

☐ Verified next sprint objective

☐ Read the document as a brand-new ChatGPT conversation

☐ Revised after that review

Only commit after this checklist is complete.

---

# Long-Term Principle

Every sprint should leave the onboarding process better than it found it.

Reducing development friction is a project improvement.

A better handoff saves time for every future sprint.

Invest in it accordingly.EOF
code docs/Development/HANDOFF_PROTOCOL.md
clear
clear
