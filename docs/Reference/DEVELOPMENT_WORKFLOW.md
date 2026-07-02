# Development Workflow

This document defines the standard development workflow for the Year Planner project.

The goal is to reduce mistakes, keep development sessions consistent, and minimize unnecessary context switching.

---

# Terminal Windows

Always assume three Terminal windows are open.

## ?? GIT

Purpose:

- git status
- git diff
- git add
- git commit
- git push
- git pull
- git branch
- git log

Never use this window for:

- npm run dev
- npm run build
- npm install
- grep
- sed
- find

This window should always remain inside the project root.

---

## ?? DEV SERVER

Purpose:

- npm run dev
- npm run build
- npm install
- npm test

Normally located inside:

```
frontend/
```

This window is dedicated to building and running the application.

Avoid Git commands here unless specifically requested.

---

## ?? SCRATCH

Purpose:

Temporary shell work.

Examples:

- grep
- sed
- cat
- find
- ls
- pwd
- tree
- python
- temporary scripts
- file inspection

Use this window whenever searching code or preparing edits.

Do not perform Git commits here.

---

# Before Giving Terminal Commands

Before asking Jeff to run any command:

1. State the terminal window.

Example:

?? SCRATCH

Run:

```bash
grep -n "lesson-row.current-row" frontend/src/App.css
```

Never assume the correct window.

Always explicitly identify it.

---

# Editing Workflow

Before modifying code:

1. Locate the code.

Use grep or sed.

Example:

```bash
grep -n "lesson-row.current-row" frontend/src/App.css
```

or

```bash
sed -n '410,435p' frontend/src/App.css
```

Only after confirming the exact location should edits be given.

---

# Editing Rules

Always:

- Make one change at a time.
- Wait for confirmation before continuing.
- Verify the current code before asking for replacements.
- Reference selectors or component names exactly.
- Use grep or sed when uncertain.
- Prefer precise edits over large replacements.

Never:

- Assume code still matches an earlier version.
- Tell Jeff to replace text without first locating it.
- Combine unrelated edits into one step.
- Skip verification.

---

# CSS Workflow

When modifying CSS:

1. Identify the selector.
2. Locate it with grep.
3. Display the surrounding block with sed.
4. Give the exact replacement.
5. Verify with npm run build.

---

# React Workflow

When modifying JSX:

1. Locate the component.
2. Display the surrounding JSX.
3. Change only the necessary block.
4. Build.
5. Verify visually.

---

# Build Workflow

After completing a logical feature:

?? DEV SERVER

```bash
npm run build
```

Fix all build errors before proceeding.

---

# Git Workflow

After the feature is complete:

?? GIT

```bash
git status
git diff
```

Review changes before committing.

Then:

```bash
git add ...
git commit -m "Meaningful commit message"
git push
```

Finally verify:

```bash
git status
```

Expected result:

```
nothing to commit, working tree clean
```

---

# Communication Style

During development:

- Give one step at a time.
- Wait for confirmation before moving on.
- Never skip ahead.
- Always specify which terminal window to use.
- Prefer accuracy over speed.
- Treat each build as a checkpoint.
- Treat each commit as a completed milestone.

---

# Design Philosophy

The Year Planner is not merely software.

It is a decision-support tool for teachers.

Every implementation decision should reinforce:

- clarity
- calmness
- hierarchy
- confidence
- low cognitive load

Code quality and interface quality are equally important.

Design is considered complete only when both are achieved.