---
name: current-system-audit
description: Audit the current implementation, dependency source, behavior, tests, and history before proposing work; produce an evidence-backed safe-to-build-on verdict and the smallest justified change. Use when a request may rest on stale premises, duplicate an existing mechanism, or extend an unsound local design.
---

# Current System Audit

Establish what the system already does and whether it is a sound basis for the requested change
before designing or implementing anything.

## Start with a prior

Before inspecting the system, answer:

> How likely is it that the current system is a sound basis for this change?

Rate it `sound`, `probably sound`, `unclear`, `probably unsound`, or `unsound`, with one sentence of
justification. `unclear` is legal only here, before the audit.

## Audit in this order

### 1. Observed behavior and provenance

Determine what the system actually does today. Inspect code, tests, runtime evidence, dependency
source, and Git history. Tickets, design docs, comments, and earlier assistant claims are premises to
verify, not facts.

Complete this section only when every load-bearing claim is `observed` or `source-backed`, and the
report states which commits, PRs, or earlier decisions produced the mechanism being built on.

### 2. Design-quality findings

Review the accumulated system as if it were one new change:

- Is any part more complex than the problem requires?
- Did locally sensible changes degrade the whole design?
- Is the system consistent around a healthy pattern?
- Do tests prove intended behavior, or merely preserve the implementation that happened to exist?

For each finding, name the concrete part, the smell, and the past change that introduced it. If the
design is sound, say so explicitly.

### 3. Reinvention check

For each major mechanism, inspect the closest maintained organization-local or external
implementation at a pinned revision. State what the local version does differently and whether that
divergence is justified or accidental. Filenames, README summaries, and remembered architecture do
not count as inspection.

If no counterpart is known, record exactly where and how you searched.

### 4. First-principles diagnosis

Trace each failure or smell through:

1. observed behavior;
2. the requirement it violates; and
3. the structural or code-level cause.

Classify the result as a `design defect` when the structure cannot satisfy the requirement even if
implemented correctly, or an `implementation defect` when the structure could satisfy it but this
code does not.

### 5. Fix-now decision

Choose the smallest honest disposition:

1. `fix first` — prerequisite refactor before new work;
2. `fix alongside` — repair the touched seam as part of the change;
3. `quarantine` — build knowingly without deepening the dependency;
4. `abandon basis` — redirect to a different seam or system; or
5. `not needed (basis sound)`.

State the cost and rejected alternatives. A `probably unsound` or `unsound` verdict blocks downstream
ticket generation until the owner decides the disposition.

## Output bundle

Honor an owner-supplied destination. Otherwise, use the repository's existing research root or
create `research/`, then write a named bundle:

```text
<research-root>/<YYYY-MM-DD>-<topic>-current-system-audit/
├── <topic>-current-system-audit.md
└── sources/        # only when external or captured evidence is needed for offline review
```

Link repository code and history at stable revisions instead of copying them. Put volatile runtime
evidence or external artifacts needed to reproduce the verdict in `sources/`, with provenance at the
top of each file. Never overwrite an earlier bundle.

Write `<topic>-current-system-audit.md` in this form:

```markdown
## Current System Audit

**Pre-grill rating:** <full scale, unclear allowed> — <one sentence>
**Closing rating:** <sound | probably sound | probably unsound | unsound> — <evidence-backed reason>
**Rating delta explained by:** <specific finding or no material delta>

### Observed behavior and provenance
### Design-quality findings
### Reinvention check
### First-principles diagnosis
### Fix-now decision
**Disposition:** <fix first | fix alongside | quarantine | abandon basis | not needed (basis sound)>
**Owner approval:** <owner-decided reference or pending owner decision>
```

The audit stays open until its closing rating commits to a direction. Prefer deleting invented work
over adding a second mechanism when current-system evidence shows the requested capability already
exists.
