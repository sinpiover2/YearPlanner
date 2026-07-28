# Handoff Protocol

## Purpose

The sprint handoff is not a summary of the sprint.

It is the onboarding document for the next session.

A successful handoff lets a brand-new session become productive in under a minute for basic orientation, with deeper context available on demand for anything that needs it.

The handoff is a project artifact. It deserves the same care, review, and continuous improvement as production code.

---

## Two Kinds of Knowledge

Year Planner now has two kinds of project knowledge, and a handoff must not mix them.

| Kind | Lives in | Test |
|---|---|---|
| Permanent | `docs/Development/PROJECT_CONTEXT.md` (and Architecture docs) | Still true five sprints from now |
| Sprint-specific | The current sprint's handoff (`docs/History/SPRINT_HANDOFF_X.X.md`) | True only until the next sprint changes it |

Mission, product vision, design principles, workspace philosophy, information architecture, the four-terminal workflow, coding philosophy — all permanent. They already live in PROJECT_CONTEXT.md.

**A sprint handoff must never restate them. Link to them instead.**

If you're about to write a sentence explaining *why* Forecast exists, *why* curriculum stays additive, or *what* the four terminal windows are for — stop. That belongs in PROJECT_CONTEXT.md. If it's already there and still accurate, just link it. If it's missing or wrong, fix PROJECT_CONTEXT.md, then link it.

A workflow discovery made *this* sprint (e.g. "ignore `.claude/` so local permissions don't pollute git") starts as sprint-specific. Once it's proven and becomes standing practice, it graduates into PROJECT_CONTEXT.md and drops out of future handoffs.

---

## The Two-Layer Handoff

Every sprint handoff has two layers.

### Layer 1 — 60-Second Startup

The top of the document. Everything a new session needs to start working, and nothing else:

- Sprint title and a one-paragraph status ("the project is healthy," "X is blocked on Y")
- Repository state: branch, clean/dirty, ahead/behind origin
- Recent commits (last 3–5, one line each)
- Current stopping point: what was true the moment the sprint ended
- First-hour plan: a concrete numbered sequence, not a reading list
- Links to permanent reference documents (PROJECT_CONTEXT.md, and any Architecture doc actually relevant this sprint)

A session that reads only this layer should be able to start working immediately.

### Layer 2 — Reference

Everything else. Read only as needed:

- Sprint accomplishments — what shipped and the reasoning behind it, not a changelog
- Remaining priorities — ranked, not a roadmap
- Known issues — bugs, limitations, deferred work, explicit non-goals, technical debt
- Anything else worth carrying forward (a short "Lessons Learned" is welcome when something genuinely surprised us — see Sprint 5.1's print-scale bug for the kind of thing worth keeping)

---

## Required Sections

Every sprint handoff must contain:

1. **Repository state** — branch, clean/dirty, commits ahead of origin. *(Layer 1)*
2. **Recent commits** — the last handful, one line each. *(Layer 1)*
3. **Sprint accomplishments** — what shipped this sprint and why. *(Layer 2)*
4. **Current stopping point** — what's true right now, without further reading. *(Layer 1)*
5. **First-hour plan** — a concrete sequence for the next session. *(Layer 1)*
6. **Remaining priorities** — ranked. *(Layer 2)*
7. **Known issues** — bugs, limitations, deferred work, non-goals. *(Layer 2)*
8. **Links to permanent reference documents** — PROJECT_CONTEXT.md at minimum. *(Layer 1)*

Nothing else is required. Add a section only if it would measurably help the next session start faster — and only after checking it isn't already permanent knowledge that belongs in PROJECT_CONTEXT.md instead.

---

## Before Writing: Review the Previous Handoff

Do not start a new handoff from a blank page, and do not start it by copying the last one forward unchanged.

Read the previous handoff as if you were the next session, and ask:

- What worked? What caused friction?
- What did we have to rediscover that should have been written down somewhere permanent?
- What in the previous handoff was actually permanent knowledge, copied forward again instead of moved to PROJECT_CONTEXT.md?
- What's now obsolete and should be dropped?
- How can startup get even faster than last time?

**Every new handoff must be a measurable improvement on the one before it** — shorter, clearer, better targeted, or with less duplication. If a section added no value last time, cut it this time.

---

## Writing Principles

- Optimize for startup friction, not completeness. Every section answers: "will this help the next session start faster?" If not, cut it.
- Explain decisions, not history — git already has history.
- Never restate what PROJECT_CONTEXT.md already says. Link it.
- Write for the next sprint, not for the record.

---

## End-of-Sprint Checklist

Before ending a sprint:

- [ ] `npm run build` passes
- [ ] `git status` clean
- [ ] Push complete
- [ ] Sprint handoff written and committed
- [ ] PROJECT_CONTEXT.md reviewed — updated only if permanent philosophy, architecture, or workflow actually changed
- [ ] HANDOFF_PROTOCOL.md reviewed for possible improvements

---

## Long-Term Principle

Every sprint should leave the onboarding process better than it found it.

A better handoff saves time for every future sprint. Invest in it accordingly.
