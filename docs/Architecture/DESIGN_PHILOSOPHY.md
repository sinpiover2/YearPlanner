---

# Year Planner Ñ Design Philosophy

## What This Product Is

Year Planner is a teacher decision-support tool, not a reporting dashboard.

The distinction matters. A dashboard displays information and asks the teacher to interpret it. A decision-support tool interprets the information and asks the teacher to act Ñ or confirms that no action is needed.

Most of the time, no action is needed. The design should say so clearly.

The best version of Year Planner is the one the teacher forgets is thereÑuntil it has something important to say.

Teacher attention is the scarcest resource in the system. Every feature must justify spending it.

Year Planner does not compete with teaching. It exists so teachers can think less about pacing and more about students.

---

## The Underlying Question

Teachers using Year Planner are asking one question, even when they do not articulate it:

**Am I OK?**

Every feature, every label, every card, and every color choice should help answer that question. If an element of the interface does not help answer it, the element probably does not belong.

The four supporting questions Ñ Where am I? Should I care? What happens if nothing changes? Can I fix this? Ñ are the mechanism for answering "Am I OK?" They are design tools, not UI labels. Teachers should feel them answered, not see them listed.

---

## The Default State Is Calm

Most pacing variance is normal. Most sections recover on their own. Most years proceed close to plan.

The interface should reflect this reality.

A system that defaults to alert trains teachers to ignore it. A system that defaults to calm earns trust Ñ and the rare warning lands with the weight it deserves.

The emotional progression of Year Planner is:

**On Track** Ñ You're fine.

**Monitoring** Ñ You're still fine. Keep an eye on this.

**Needs Attention** Ñ Something should probably change.

There is no panic state. Even the rare Buffer Exhausted condition should communicate clarity rather than anxiety.

---

## Show Reality First

Every piece of information follows the same order:

1. Show the reality Ñ the actual number, the current position, the variance.
2. Show the consequence Ñ what happens if this continues unchanged.
3. Show the recommendation Ñ what, if anything, to do about it.

Never lead with a warning. Lead with the fact.

**Not this:**

> ?? Pacing issue detected Ñ P2 is behind schedule.

**This:**

> Math 8 P2 is 0.5 days behind. Future units begin 0.5 days later. 13.5 of 14 buffer days remain. No action needed.

Same information. Different experience.

---

## The Three States

| State | Meaning | Visual signal |
|---|---|---|
| On Track | Variance is zero or negative. No forecast shift. | Green |
| Monitoring | Variance is positive but within buffer. Sections may differ from each other but no action is required. | Amber |
| Needs Attention | Variance is consuming a meaningful portion of buffer. Teacher should consider adjusting. | Amber |
| Buffer Exhausted | Variance exceeds total optional days. Schedule adjustment required. | Red |

**Red is reserved for one situation only:** when variance exceeds total optional days and the schedule can no longer absorb the difference without affecting required content. Every other state uses green or amber. Teachers spend their days inside systems that cry wolf in red. Year Planner should feel different.

---

## The Recoverability Messages

When variance exists, the system always tells the teacher whether recovery is possible. These four messages are the complete set. Do not add others without reconsidering all four together.

- **No action needed.** Ñ Buffer is barely touched.
- **Recoverable within current buffer.** Ñ Buffer is partially consumed but sufficient.
- **Consider compressing upcoming optional lessons.** Ñ Buffer is significantly consumed.
- **Buffer exhausted Ñ schedule adjustment required.** Ñ Variance exceeds total optional days.

The final message names the situation and implies the need for change. It does not prescribe what the change should be. Teachers know their classrooms. The system's job is clarity, not pedagogy.

---

## Buffer Is the Primary Pacing Metric

Variance tells a teacher how far off they are. Buffer tells them whether it matters.

A teacher who is 0.5 days behind with 13.5 of 14 buffer days remaining is fine. A teacher who is 4.5 days behind with 9.5 of 14 buffer days remaining has a real decision to make. The numbers are different but the variance-only view makes them look similar. Always show buffer alongside variance.

Display format:

**13.5 of 14 buffer days remaining.**

The denominator matters. Do not reduce this to a percentage.

---

## The Empty State

On day one, before any progress is logged, Year Planner should feel peaceful. The planned year is visible. Unit bars are drawn. No warnings exist because no data exists.

The message is simple:

*Nothing to report yet. Check back after logging your first lessons.*

This is the first impression teachers have of the system. It should teach them that Year Planner is a place that gives them useful information when it exists and honest silence when it does not.

---

## The Organizing Principle Across All Tabs

Every tab in Year Planner answers the same underlying question at a different time scale.

**Today tab** Ñ Am I OK today?

**Units tab** Ñ Am I OK in this unit?

**Forecast tab** Ñ Am I OK this year?

**What If? (future)** Ñ If I change something, will I still be OK?

Teachers learn this grammar once. They apply it everywhere. The consistency of tone across all four tabs is what makes Year Planner feel like a single trusted tool rather than a collection of features.

---

## The Timeline Is a Map

The timeline behaves like a map.

Teachers think in position before they think in numbers.

The year stays.

Rows stay.

The teacher moves.

Periods are landmarks.

Synchronization changes interpretation, not geometry.

Stable structure reduces cognitive load.

Drift is geometric.

The distance between "where I am" and "where I expected to be" matters more than the numerical variance itself.

The timeline exists to answer:

> Where am I?

It does not exist to answer:

> Should I care?

That is the responsibility of the cards.

**Timeline = orientation.**

**Cards = interpretation.**

The separation matters.

---

## Stability Is Kindness

Compression is kindness.

But changing the structure of the interface can create confusion instead of reducing it.

Stable geometry helps teachers build trust and familiarity.

Rows should remain visible.

Breaks are terrain, not decorations.

Synchronization changes interpretation, not structure.

The best designs disappear.

---

## The Test for Every Future Feature

Before adding any feature, label, badge, alert, chart, or color to Year Planner, ask:

1. Does this help answer one of the four questions?
2. Does it show reality before consequence before recommendation?
3. Does it default to calm?
4. Does it treat the teacher as a professional making their own decisions?

If the answer to any of these is no, the feature probably belongs somewhere else Ñ or does not belong at all.

## Timeline vs. Cards

The timeline answers:

Where am I?

The cards answer:

Should I care?
What happens if nothing changes?
What should I do?

The timeline is context.

The cards are interpretation.

The timeline should not become the decision layer.

---

*This document is not documentation. It is the constitution of the project. Every feature, color, chart, and interaction should pass through it before being added.*