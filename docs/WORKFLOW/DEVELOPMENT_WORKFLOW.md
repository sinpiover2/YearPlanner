# DEVELOPMENT_WORKFLOW

## Purpose

This document defines how Year Planner is developed.

It is not a coding standard or architecture document. Instead, it describes the development process that keeps the project organized, predictable, and focused on building the right product.

> We optimize for building the right product, not merely finishing the next feature.

The workflow itself is considered part of the project and should improve as we learn.

---

# Repository

Repository:

- Year Planner

Primary Branch:

- `main`

Technology:

- React + Vite
- Google Apps Script
- Google Sheets

Primary verification command:

```bash
npm run build
```

---

# Terminal Workflow

Development uses four dedicated terminal windows.

Each window has one responsibility.

## ?? DEV SERVER

Purpose:

Run the application.

Typical commands:

```bash
npm run dev
```

Never use this window for builds or Git.

---

## ?? BUILD

Purpose:

Verify production builds.

Typical commands:

```bash
npm run build
```

This window is only for build verification.

---

## ?? PROJECT

Purpose:

Inspect the project and implement changes.

Typical commands:

```bash
git status

grep

sed

cat

code
```

This is the working window.

---

## ?? GIT

Purpose:

Version control.

Typical commands:

```bash
git status

git add

git commit

git push

git log --oneline -5
```

This window should only be used for Git operations.

---

# Sprint Workflow

Every sprint follows the same sequence.

```
Plan

?

Implement

?

Verify

?

Design Review

?

Architecture Review

?

Documentation Review (if needed)

?

Commit

?

Push
```

---

# Definition of Done

A sprint is complete only when all of the following are true.

- Feature behaves correctly.
- Production build succeeds.
- User interface has been reviewed.
- Architecture has been reviewed.
- Documentation has been updated if necessary.
- Changes are committed.
- Changes are pushed to GitHub.

---

# Design Review

Every sprint ends with stepping back from the code and evaluating the experience.

Questions:

- Does this reduce cognitive load?
- Does this answer **"Am I OK?"** more quickly?
- Does anything attract unnecessary attention?
- Can anything be removed?
- Does the interface feel calmer?

The visual experience is as important as the technical implementation.

---

# Architecture Review

Every sprint ends with reviewing the design of the system.

Questions:

- Did we duplicate logic?
- Can anything be simplified?
- Is there a better abstraction?
- Can code be removed?
- Are the architecture documents still accurate?

The goal is continuous simplification.

---

# Coding Principles

The following principles guide implementation.

- Simplicity beats cleverness.
- Prefer removing code over adding code.
- Calm is a feature.
- Components should have one responsibility.
- Architecture should reflect the design philosophy.
- Information always flows:

```
Reality

?

Consequence

?

Recommendation
```

---

# Git Standards

Each commit represents one logical feature or improvement.

Commit messages should describe what changed.

Good examples:

```
Add forecast runway visualization

Improve timeline orientation

Remove Year Outlook strip
```

Avoid vague commit messages such as:

```
More fixes

Updates

Misc changes
```

---

# Technical Lead Workflow

At the beginning of every sprint:

- Verify workspace.
- Verify repository status.
- Define sprint goal.
- Define success criteria.

At the end of every sprint:

- Lead design review.
- Lead architecture review.
- Review documentation changes.
- Verify build.
- Review commit before pushing.

This keeps the development process consistent without relying on memory.

---

# Continuous Improvement

The workflow is part of the project.

Whenever we discover a better way to work:

1. Update this document.
2. Adopt the improvement.
3. Use it in future sprints.

---

# Periodic Architecture Review

Approximately every 5Ð10 sprints, schedule an Architecture Review Sprint.

No new features are added.

Instead, ask:

- What can be simplified?
- What can be removed?
- What have we learned?
- Is the documentation still accurate?
- If we started today, would we build it this way?

Long-term quality comes from regularly re-evaluating earlier decisions.

---

# Guiding Principle

Every feature should help teachers answer one question:

> **Am I OK?**

If a feature does not make that answer faster, clearer, or calmer, it should be reconsidered.