---
name: interactive-implementation-review
description: Produce and run an evidence-backed Interactive Implementation Review before tickets or implementation. Use when the owner wants to turn grilling, current-system research, and prior art into one reviewable Markdown design document.
---

# Interactive Implementation Review

Produce one canonical Markdown review of the smallest justified change. The review preserves the
owner's grilling decisions and the full research that informed them; the Markdown is the deliverable.

## 1. Resolve the review workspace

Identify the source request, working repository, and a **review workspace** before creating artifacts.
Resolve its location in this order:

1. use the owner's explicit destination;
2. otherwise follow the repository's existing convention for design and research work; or
3. when no convention exists, ask the owner where this workstream should live.

The location is flexible; the internal shape is stable:

```text
<review-workspace>/
├── README.md
├── interactive-implementation-review.md
├── grilling/
│   └── README.md
└── research/
    ├── current-system-audit/
    │   └── <the Current System Audit skill's native output bundle>
    └── prior-art/
        └── <the Prior Art skill's native output bundle>
```

Create directories as their artifacts appear. `README.md` is the front door: name the source request
and repository, current phase, canonical review, research outputs, grilling session, relevant
`CONTEXT.md` and ADRs, unresolved work, and what to read next. Keep existing context and decision
records authoritative at their established paths; the workspace README links to them.

**Complete when:** the workspace location is resolved, its README identifies the source request and
repository, and every artifact that already exists is linked from the map at a resolving path.

## 2. Establish pre-grilling alignment

Before research, ask the owner one question at a time for:

1. the intended outcome and one concrete example;
2. any suspicion that the request compensates for a deeper design problem; and
3. their prior rating of the current basis using the Current System Audit scale.

Record these answers verbatim. Load and follow the model-invoked `grill-with-docs` skill for the
repository-backed interview and its glossary and ADR trail.

`grilling/README.md` indexes the grilling session and links the glossary changes, ADRs, prototypes,
and research that shaped the design. Existing records remain authoritative at their established
paths.

**Complete when:** all three owner inputs are recorded, `grill-with-docs` has mapped the initial
design-tree frontier, and `grilling/README.md` points to the active grilling context.

## 3. Delegate the evidence branches

**REQUIRED:** run each research branch in its own subagent so source collection remains outside the
parent reasoning context:

- the Current System Audit agent loads and follows the sibling
  [`current-system-audit`](../current-system-audit/SKILL.md) skill and writes its native bundle under
  `research/current-system-audit/`;
- the Prior Art agent loads and follows the sibling [`prior-art`](../prior-art/SKILL.md) skill and
  writes its native bundle under `research/prior-art/`.

Give each agent the source request, working repository, assigned output folder, pre-grilling answers,
and unresolved research questions. Each agent reads the applicable `AGENTS.md` files for its source
and destination, writes directly to its assigned folder, and returns a bounded decision-bearing
summary with exact artifact paths. Original artifacts carry evidence; summaries provide navigation.

Continue every grilling branch whose prerequisites are settled while research runs. Research settles
facts; the owner settles product and trade-off decisions.

**Complete when:** both native research reports satisfy their owning skill's completion criterion,
every cited local artifact resolves, and the workspace README links both reports and their source
bundles.

## 4. Close the grilling loop

Read the decision-bearing findings from both research artifacts. Add every newly exposed decision to
the design-tree frontier and continue `grill-with-docs`. Repeat evidence and questioning until the
frontier is empty. Update the workspace README whenever an artifact becomes canonical or is
superseded.

**Complete when:** the owner confirms shared understanding, every research-exposed decision is resolved
or explicitly open, and the grilling index links the resulting `CONTEXT.md`, ADRs, prototypes, and
research.

## 5. Build the canonical Markdown

Copy [`template.md`](template.md) to `interactive-implementation-review.md` after the grilling loop
closes. Fill it from the owner decisions, repository context, ADRs, approved prototype evidence, and
the original research artifacts.

Import the full decision-bearing depth of the Current System Audit and Prior Art reports into their
review sections, preserving their native headings, citation blocks, caveats, search coverage, and open
questions. Link each imported section to its complete research artifact and preserved sources. The
review is a self-contained decision record; the research bundles retain the deeper source trail.

The hidden reference under each numbered heading defines that section's job. Set a conditional section
to `Not applicable` with its evidence-backed reason. Put choices awaiting the owner in Unresolved
Questions. Set the document to `In review` after its preparation criterion is met.

**Complete when:** every template placeholder is replaced or marked `Not applicable` with a reason;
every decision-bearing claim carries an evidence status and a resolving source; the complete audit and
prior-art findings are present; every affected seam has a concrete before/after; and every unsettled
choice appears in Unresolved Questions.

## 6. Review interactively

Load and follow the sibling
[`interactive-markdown-review`](../interactive-markdown-review/SKILL.md) skill. Open the canonical
Markdown as one continuous document using the launcher's temporary review directory.

When the owner finishes a pass, read its Comments JSON and revise the canonical Markdown. Discuss any
Comment whose resolution needs an owner decision. Open each revised pass as a fresh review, so the
current document receives a fresh Comment set. Comment state is temporary review input; the canonical
Markdown carries the accepted result.

**Complete when:** the owner says the review is complete and their final decision is recorded in the
Approval section; then return control to them.
