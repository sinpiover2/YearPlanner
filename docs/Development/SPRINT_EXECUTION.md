# Sprint Execution

> "Every sprint should eliminate one reason Jeff would still open FileMaker."

---

# Purpose

This document governs day-to-day development.

The philosophy has been established.

The architecture has been established.

The mission has been established.

The remaining work is disciplined execution.

Every coding session should begin by reviewing this document.

---

# Daily Development Workflow

Each development session follows the same sequence.

```
Review

?

Select Gap

?

Design

?

Build

?

Verify

?

Update Documentation

?

Repeat
```

Never begin by asking:

> "What should we build today?"

Always begin by asking:

> "Which gap are we closing today?"

---

# Current Mission

Primary Objective:

> Replace FileMaker as Jeff's trusted daily teaching workspace before August 1.

Everything else is secondary.

---

# Daily Checklist

## 1. Review

Read:

- AUGUST_1_FLIGHT_PLAN.md
- AUGUST_1_GAP_ANALYSIS.md
- VERSION_1_SCOPE.md

Identify the highest priority open gap.

---

## 2. Choose One Gap

Only one major objective per session.

Example:

Improve lesson printing.

Not:

Improve printing, navigation, reflection, AI, and planning.

---

## 3. Design

Before writing code ask:

Does this solution:

- reduce anxiety?
- simplify the workflow?
- preserve teacher energy?
- support the Daily Cognitive Workflow?

If not, redesign.

---

## 4. Build

Implement only the selected improvement.

Avoid unrelated refactoring unless absolutely necessary.

Protect momentum.

---

## 5. Verify

Before considering the work complete:

- application builds successfully
- application runs correctly
- navigation remains intact
- no regressions introduced

---

## 6. Evaluate

Ask:

Would this make Jeff less likely to open FileMaker?

If the answer is uncertain:

The work is not finished.

---

## 7. Update

Update:

- Gap Analysis
- Build Log
- Sprint Notes

Only after verification.

---

# Session Rules

## Rule 1

One primary goal.

---

## Rule 2

One completed improvement is better than five partially finished improvements.

---

## Rule 3

Never interrupt a sprint for an interesting idea.

Record it.

Continue.

---

## Rule 4

Architecture supports execution.

Execution does not pause for architecture unless required.

---

## Rule 5

Every completed task should visibly improve the teacher's daily experience.

---

# Acceptance Tests

Every completed feature should satisfy at least one of these.

Can Jeff...

? Plan faster?

? Find information faster?

? Feel calmer?

? Print more easily?

? Teach with greater confidence?

? Navigate without hesitation?

? Leave FileMaker closed?

If none are checked:

The feature probably belongs after Version 1.

---

# Coding Priorities

Always work from highest value to lowest.

1. Remove FileMaker dependency.
2. Reduce teacher anxiety.
3. Improve workflow.
4. Improve usability.
5. Improve polish.
6. Add capability.

Never reverse this order.

---

# Version 1 Boundaries

Do not begin work on:

- AI reflection
- Insight Inbox
- Voice narration
- Pattern detection
- Teacher coaching
- Cross-year analytics

Unless they become necessary to complete the August mission.

---

# Scope Creep Filter

Whenever a new idea appears, ask:

Does this help Jeff teach before August 1?

If yes:

Evaluate normally.

If no:

Move it to the Version 2 backlog.

---

# Development Quality Checklist

Before committing code:

? Builds successfully

? Runs correctly

? No obvious regressions

? UI remains calm

? Navigation remains intuitive

? Existing workflow remains intact

? Documentation updated if necessary

Only then commit.

---

# Sprint Success

A sprint succeeds when:

- At least one meaningful gap is closed.
- The teacher workflow becomes simpler.
- FileMaker becomes less necessary.

Not when the largest amount of code is written.

---

# Classroom Test

Imagine tomorrow morning.

Would today's work make Jeff say:

> "I'm glad that's there."

If yes:

Success.

If not:

Continue improving.

---

# Daily Decision Filter

Whenever uncertainty exists, ask:

> Does this make the next teaching day calmer?

If yes:

Continue.

If no:

Stop and reconsider.

---

# End-of-Sprint Checklist

Before ending every sprint:

? Gap Analysis updated

? Flight Plan still valid

? Version 1 Scope respected

? Documentation complete

? Build passes

? Git clean

? Sprint handoff prepared

---

# Definition of Done

A development task is complete only when:

1. The code works.
2. The workflow is improved.
3. The user experience is simpler.
4. The documentation is updated.
5. Jeff is less likely to open FileMaker.

If any of these are missing, the task is not finished.

---

# Guiding Principle

The objective is not to build the most capable software.

The objective is to build software that quietly earns the teacher's trust, preserves cognitive energy, and makes excellent teaching easier every day.

Every sprint should move one step closer to that goal.