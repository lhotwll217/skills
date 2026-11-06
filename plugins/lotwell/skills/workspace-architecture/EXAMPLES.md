# Chain of Context surface examples

Consult these examples from `SKILL.md` when:

1. a README/index, agent-instruction file, daily log, durable topic document, or source package is needed but no healthy local example exists; or
2. two organizations still satisfy the three layers and cold-open test.

Every name, date, path, URL, and session identifier below is synthetic. These examples show minimal shapes, not a folder schema.

## One descriptive file is enough

```text
planning/
└── 2026-01-15-roadmap-note.md
```

The folder and filename expose the domain, date, and artifact type. A README would duplicate the listing rather than improve discovery.

## README or index: orient and point forward

```md
# Reporting automation

Automates the weekly reporting workflow from maintained source data.

## Current

- Status: validating the first scheduled run
- Source of truth: [reporting workflow issue](https://example.invalid/issues/42)

## Read next

- [Implementation note](planning/2026-01-15-implementation-note.md)
- [Source-data contract](sources/source-data-contract.md)
```

The front door states purpose, current state, canonical source, and next reading step. It does not repeat the linked documents.

## Folder-scoped instructions: AGENTS is canonical

```text
project/
├── AGENTS.md
└── data/
    ├── AGENTS.md
    ├── CLAUDE.md
    └── README.md
```

Root `AGENTS.md` carries broad project behavior:

```md
# Agent instructions

- Preserve raw evidence and link derived documents to it.
```

Nested `data/AGENTS.md` begins where the dataset-specific behavior becomes true:

```md
# Dataset instructions

When working in this directory or its descendants, read `README.md` first for purpose, current state, source of truth, and navigation.

- Treat `current-metrics.csv` as a local copy of spreadsheet `sheet-example-42`.
- Confirm source parity before editing the local copy.
- Keep session IDs and sync notes in this file or the daily log, not in the CSV.
```

The same-scope `data/CLAUDE.md` is an adapter, not a second source:

```md
@AGENTS.md
```

README orients the dataset, nested AGENTS governs work in its subtree, and CLAUDE imports the canonical directions without duplicating them.

## Daily log: a short dated index

Use one file per day when the project maintains a daily log:

```md
# 2026-01-15

- 14:25 — Saved the [quarterly-planning meeting package](../meetings/2026-01-15-quarterly-planning/README.md); canonical session `01example`, messages 12–24.
- 15:10 — Updated the [reporting-automation implementation note](../workstreams/reporting-automation/2026-01-15-implementation-note.md); source issue `#42`.
```

The entries say what changed, when, and where to continue. They link to the work and its provenance rather than copying summaries, transcripts, or analysis into the log.

## Durable topic document: update understanding by subject

```md
# Reporting source-data contract

Last updated: 2026-01-16

## Current understanding

The weekly report reads the maintained spreadsheet and treats the checked-in CSV as a reproducible snapshot, not the source of truth.

## Decision

Refresh the snapshot before validation runs; never write generated audit metadata into the CSV.

## Sources

- Maintained spreadsheet: `sheet-example-42`
- Decision session: `01example`, messages 31–38
```

Update this document when the understanding changes. Record dated activity in the daily log instead of turning the topic document into a chronology.

## Complete path: overview, detail, then source

```text
project-workspace/
├── README.md
├── daily-log/
│   └── 2026-01-15.md
└── meetings/
    └── 2026-01-15-quarterly-planning/
        ├── README.md
        ├── 2026-01-15-meeting-summary.md
        ├── 2026-01-15-cleaned-transcript.md
        └── sources/
            └── 2026-01-15-raw-transcript.txt
```

The cold-start path is:

1. `project-workspace/README.md` identifies current work.
2. The meeting README points to the summary as the useful overview.
3. The summary links to the cleaned transcript for readable detail.
4. The cleaned transcript identifies itself as derived and links to the raw transcript or canonical session record.
5. The daily log supplies the dated breadcrumb back to the meeting package.

## A meeting and its workstream have different lifecycles

```text
project-workspace/
├── meetings/
│   └── 2026-01-15-quarterly-planning/
│       ├── README.md
│       └── 2026-01-15-meeting-summary.md
└── workstreams/
    └── reporting-automation/
        ├── README.md
        └── research/
            └── 2026-01-16-market-notes.md
```

The meeting links to the workstream it produced. The workstream remains independent because it outlives the meeting and can receive evidence from later sources.

## Canonical session and readable export remain distinct

```text
research-project/
├── README.md
└── sessions/
    └── 2026-01-15-design-review-transcript.md
```

The nearest README identifies both roles:

```md
- Conversation source of truth: session `01example`, messages 12–24
- Readable export: `sessions/2026-01-15-design-review-transcript.md`
```

The Markdown transcript is a readable derived view. The stable session record remains canonical evidence, and the session metadata stays outside business data.

## Repository and workspace ownership remain separate

```text
product-repository/
├── src/
├── tests/
└── README.md

product-workspace/
└── planning/
    └── 2026-01-15-implementation-plan.md
```

Shipped implementation lives in the product repository. Internal planning that coordinates work without shipping belongs in the project workspace; each side links to the other when the relationship matters.

## Repair a misleading chain instead of inheriting it

```text
client-workspace/
└── kickoff-phase-docs/
    ├── service-agreement.md
    └── architecture-overview.md
```

becomes

```text
client-workspace/
└── project-documents/
    ├── service-agreement.md
    └── architecture-overview.md
```

The old folder named a process stage although its contents were full-project references. The repair uses the domain, updates every inbound link, and confirms that the old path is absent.
