---
name: chain-of-context
description: Build or repair a Chain of Context for durable project work. Use when preserving project artifacts, recording project history or operating instructions, establishing or changing artifact organization, or auditing whether a cold-start agent can reconstruct what happened, find the source of truth, and know what to read next.
---

# Chain of Context

Chain of Context is an operating model for making projects navigable by stateless agents. The environment becomes onboarding: a cold-start agent can land in a project, scan the filesystem, follow names and links, and reconstruct the work without requiring a person to explain it again.

This file is self-contained for runtime use. Every invocation uses the cold-open test, three-layer model, persistence-surface rules, and verification procedure below.

## 1. Start with the cold open

Begin at the nearest stable parent of the material. Use `ls`, grep, the nearest README or index, applicable agent instructions, sibling names, and existing links to answer:

1. What is this?
2. What happened or changed, and when?
3. Why does it matter?
4. What is the source of truth?
5. What should I read next?
6. Where is the originating session when auditability matters?

Each answer that requires guessing is a gap in the chain. Do not automatically solve a gap with another folder or README.

Classify the existing organization:

- **Healthy chain:** the names, placement, discovery path, and source links answer the questions. Extend its local pattern.
- **Broken chain:** generic or misleading names, wrong ownership boundaries, redundant indexes, temporary homes, or unverifiable sources obstruct the answers. Repair the existing chain.
- **No chain:** durable material has no discoverable home or pattern. Build the smallest chain that answers the questions.

Preserve layouts owned by a package, dependency, vendor, framework, SDK, or tool. Chain of Context organizes project-owned context; it does not reorganize externally prescribed trees, caches, profiles, or package-managed configuration.

**Complete when:** every durable artifact in scope has a known owner, lifecycle, and source, and every failed cold-open answer is tied to a concrete gap.

## 2. Build the three layers

### Descriptive folders and files

Names carry the first layer of context.

- Name the subject and artifact type so their purpose is inferable before opening them.
- Let the project domain supply the words. Prefer `project-documents/` or `team-skill-usage/` over generic, process, tool, or role labels such as `references/`, `first-phase/`, or `role-pages/` when the domain has better language.
- Prefix date-bound artifacts with `YYYY-MM-DD-` so listings reveal chronology.
- Create a folder when a common pattern or multi-artifact discovery path is emerging. Let one descriptive file orient itself when no grouping is needed.
- Keep ownership boundaries visible. A meeting and the workstream it produced, a product repository and its cross-repository planning, or shipped documentation and internal orchestration material may need separate homes because their owners and lifecycles differ.

### Progressive discovery

Organize the reading path as **overview → detail → source artifacts**.

- Let a shallow listing provide the first orientation.
- Add a README or index only when names and listing cannot reveal what is current, where the source lives, or what to read next.
- Keep each layer focused on its job. No single file needs to explain everything; it should link to the next useful layer.
- Keep explanation and evidence together while they share an owner, lifecycle, and discovery path. Split them when any of those diverges.

### Linked source trail

Links preserve trust without duplicating the source.

- Maintain one canonical source and copy its exact URL, ID, path, or version from the opened source rather than memory.
- Link summaries and durable notes to the artifact, transcript, issue, pull request, email, document, or dataset that supports them.
- Label cleaned transcripts, downloads, snapshots, and Markdown exports as derived views and link them to the canonical source.
- When session content informs a durable artifact, record the stable session ID and, when useful, its message index, timestamp window, or canonical record path near the artifact.
- Keep process metadata, session IDs, audit notes, and agent instructions outside canonical business data.

**Complete when:** a cold-start agent can traverse from the parent listing through the useful context to the canonical source without guessing or encountering an unexplained duplicate.

## 3. Use each persistence surface for one job

Use only the surfaces the work needs. This table assigns responsibilities; it is not a required folder schema.

When creating one of these surfaces without a healthy local example, read [surface examples](EXAMPLES.md) before writing it. The same reference covers the branch where two organizations still satisfy the three layers and cold-open test.

| Surface | Job |
| --- | --- |
| `README.md` or index | Orient a folder: purpose, current state, source of truth, and next reading step |
| `AGENTS.md` | State operating rules and trigger pointers at the nearest directory boundary where they become true; root guidance stays broad and nested guidance becomes specific |
| Daily log | Preserve short, dated, append-only pointers to what changed and where it lives; link outputs and transcripts instead of copying them |
| Durable topic document | Preserve refined understanding by subject and update it when that understanding changes |
| Source artifact | Preserve canonical or raw evidence with its exact identity |
| Business data | Contain business data only, without process or agent metadata |
| Agent memory | Preserve collaboration preferences outside project state and outside the repository |

`README.md` and `AGENTS.md` are not interchangeable: README orients; AGENTS governs agent behavior for its directory and descendants. Use `AGENTS.md` as the canonical shared instruction source. When Claude Code must consume the same directions, add a same-scope `CLAUDE.md` containing only `@AGENTS.md`. If another host does not discover nested AGENTS files, point its loaded instruction surface to the canonical file rather than copying the directions.

Use the domain's existing healthy names for these jobs. A generic `research/`, `sources/`, or `outputs/` tree is an example, not an architecture to impose.

**Complete when:** each artifact has one discoverable home whose job matches its content, folder-scoped behavior begins at the nearest applicable `AGENTS.md`, and no meaning is duplicated across persistence surfaces or host adapters.

## 4. Make the chain durable and verify it

Apply the smallest change that closes the identified gaps.

- Move reusable material out of temporary storage into its descriptive domain home.
- Update every affected inbound and relative link.
- Distinguish artifacts that were created, moved, copied, renamed, and deleted.
- Confirm an old location is absent when removal was intended.
- Open every affected source link and relative link.
- Return to the parent directory and repeat the cold-open questions from step 1 using only the filesystem and its links.

If two layouts still satisfy the three layers and cold-open test, present one recommendation and the meaningful tradeoff rather than inventing a universal schema.

**Complete when:** all six cold-open answers are recoverable, the overview-to-source path resolves, the canonical source is identifiable, and the reported filesystem state matches the observed state.

## Maintaining this skill

When changing this skill or auditing its fidelity to the original framework, read [origin and source lineage](ORIGIN.md) before editing. Runtime use does not require that maintainer reference.
