# Year Planner Ñ Color Scheme Reference

This document defines the canonical color system for Year Planner.

Colors convey either:

- Meaning (status)
- Identity (course)

Those responsibilities must remain separate.

---

# Semantic Status Colors

## On Track

Foreground:

```text
#10b981
```

Background:

```text
#d1fae5
```

Text:

```text
#065f46
```

Meaning:

No action needed.

---

## Monitoring

Foreground:

```text
#f59e0b
```

Background:

```text
#fef3c7
```

Text:

```text
#92400e
```

Meaning:

Using some buffer.

Recoverable.

---

## Needs Attention

Foreground:

```text
#d97706
```

Background:

```text
#fef3c7
```

Text:

```text
#92400e
```

Meaning:

Significant buffer consumption.

Teacher should consider changing something.

---

## Buffer Exhausted

Foreground:

```text
#dc2626
```

Background:

```text
#fef2f2
```

Text:

```text
#7f1d1d
```

Meaning:

Required content no longer fits.

Schedule adjustment required.

---

# Hard Rule

Red is reserved.

No other feature should use red.

If something appears to need red, it probably needs amber.

---

# Course Identity Colors

Course colors convey identity, not meaning.

---

# Math 8

Blue family.

Primary:

```text
#2563eb
```

Buffer tint:

```text
#eff6ff
```

Pattern:

Light background + dark fill.

---

# Integrated Math 1

Green family.

Primary:

```text
#059669
```

Buffer tint:

```text
#ecfdf5
```

Pattern:

Light background + dark fill.

---

# Future Courses

Third course:

Violet

```text
#7c3aed
```

---

Fourth course:

Teal

```text
#0891b2
```

---

Fifth course:

Indigo

```text
#4f46e5
```

---

# Neutral Colors

App background:

```text
#f3f4f6
```

Cards:

```text
#ffffff
```

Main panel:

```text
#f9fafb
```

Border:

```text
#e5e7eb
```

Primary text:

```text
#111827
```

Secondary text:

```text
#374151
```

Muted text:

```text
#6b7280
```

Labels:

```text
#9ca3af
```

---

# Progress Pattern

Planned:

Light background.

Completed:

Dark fill.

Area communicates progress.

Icons communicate events.

---

# Break Pattern

Use diagonal stripes:

```css
repeating-linear-gradient(
  45deg,
  #f8fafc,
  #f8fafc 2px,
  #e2e8f0 2px,
  #e2e8f0 4px
)
```

Breaks are terrain.

Not warnings.

---

# Marker Pattern

Current position:

Black dot.

Expected position:

Thin vertical line.

Markers provide orientation, not interpretation.

Marker colors do not vary by status.

---

# Guiding Principle

Identity and meaning are different.

Course colors communicate identity.

Status colors communicate meaning.

Confusing the two creates false alarms.