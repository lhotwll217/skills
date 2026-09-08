---
name: chain-of-context
description: Build or repair a Chain of Context for durable project work. Use when preserving project artifacts, recording project history or operating instructions, establishing or changing artifact organization, or auditing whether a cold-start agent can reconstruct what happened, find the source of truth, and know what to read next.
---

# Chain of Context

Chain of Context makes project-owned durable work navigable by stateless agents. The filesystem becomes onboarding: descriptive names, a bounded discovery path, and exact source identity let a cold-start agent pick up the work without a person re-explaining it.

## Route the work

For an explicit audit request, apply the cold-open test below to the requested scope.

For artifact placement, start at the nearest stable parent of the artifact. Read the applicable agent instructions, the shallow parent listing, and its README or index when present. Inspect only the artifact, its proposed home, and the direct discovery path needed to decide:

- **Healthy home:** an established local pattern makes the artifact's purpose, owner, lifecycle, canonical source, and next reading step clear. Follow the [routine placement branch](#routine-placement).
- **Misleading home:** existing names, placement, indexes, ownership, or source trail obscure those facts. Use the repair and audit procedure below.
- **No home:** no established pattern governs durable material, or several related artifacts need a new domain-owned folder. Use the new-chain procedure below.

Externally prescribed layouts remain authoritative. Preserve package, dependency, vendor, framework, SDK, tool, cache, profile, and package-managed configuration boundaries.

Before placing anything, identify:

1. the project domain that owns it;
2. whether it is current, dated, append-only, derived, or temporary;
3. its canonical source, copied exactly from an opened URL, ID, path, or version.

## Common rules

- Let domain language name folders and files. Prefix date-bound artifacts with `YYYY-MM-DD-` when the local convention does not already carry chronology.
- Keep one canonical source. Label snapshots, downloads, cleaned transcripts, and exports as derived views and link them to that source.
- Keep process metadata, session IDs, audit notes, and agent instructions outside canonical business data.
- Keep ownership boundaries visible when artifacts have different owners, lifecycles, or discovery paths.
- Add a README or index only when names and the parent listing cannot reveal what is current, where the source lives, or what to read next.

## Project history and session provenance

These rules apply to routine updates, repairs, and new scaffolds alike.

- When a session materially informs a durable artifact, record its stable session ID near the artifact when it helps a future agent find the original transcript. Include a message range or timestamp when useful; copy identities from the actual source rather than inventing them.

- When project state changes in a workspace that maintains a daily log, append a short dated entry linking the changed artifact and its source session or other authoritative record. Follow the existing logging convention; preserve earlier entries.

- Establish a daily log when the request or opened records establish a continuing sequence of project changes that needs a discoverable chronology and no existing surface serves that job. For a placement or discovery repair with no existing log, keep the breadcrumb in existing artifact context; the artifacts' continued use alone does not establish a chronology need. Use dated files and short linked entries rather than copies of outputs or transcripts.

- Update the canonical topic document when understanding changes. The document holds current understanding; the daily log records when it changed and where to read it.

## Persistence surfaces

Use only the surfaces the work needs:

| Surface | Job |
| --- | --- |
| `README.md` or index | Orient a folder when names and listing are insufficient |
| `AGENTS.md` | Govern agent behavior at the nearest applicable directory boundary |
| Daily log | Preserve dated, append-only pointers to changes, artifacts, and source sessions |
| Durable topic document | Preserve current refined understanding by subject |
| Source artifact | Preserve canonical or raw evidence with exact identity |
| Business data | Contain business data only |
| Agent memory | Preserve collaboration preferences outside project state and the repository |

README orients; AGENTS governs. When the request or opened artifacts establish recurring operating rules that existing context does not serve, use `AGENTS.md` as the canonical shared instruction source. When Claude Code needs the same directions at that scope, use a `CLAUDE.md` containing only `@AGENTS.md`. Point other hosts to the canonical file rather than copying directions.

When a needed surface lacks a healthy local example, or two organizations remain equally valid, consult [surface examples](EXAMPLES.md). Examples are shapes, not a mandatory schema.

## Routine placement

When placing an artifact in a healthy home:

1. Place the artifact using the established local name and copy/move convention.
2. Update required discovery links and apply the project-history and session-provenance rules above.
3. Verify the destination, content identity, and directly affected links. For a move, also verify updated inbound links and absence of the old path.
4. Report the exact destination and whether the source was copied, moved, or left in place.

**Complete when:** the artifact is in its established home, its canonical source remains identifiable, directly affected paths resolve, and the reported filesystem state matches the observed state. This is the complete workflow for a healthy routine placement.

## Repair and audit

### Cold-open test

Begin at the nearest stable parent and answer from the filesystem and its links:

1. What is this?
2. What happened or changed, and when?
3. Why does it matter?
4. What is the source of truth?
5. What should I read next?
6. Where is the originating session when auditability matters?

A healthy pattern answers the applicable questions through names, placement, links, and necessary front doors. A pattern is misleading when generic, process-stage, tool, or role labels hide the domain; ownership boundaries are wrong; an index duplicates rather than orients; a durable artifact lives in a temporary home; or a source is broken, invented, or ambiguous.

Tie every failed answer to a concrete gap before editing. The presence of a folder or README is evidence only when it passes this test.

## Minimal repair

- Repair the existing chain at its owning boundary rather than layering a second organization beside it.
- Rename for the durable subject or domain, not the process stage, time horizon, tool, or audience role.
- Move reusable material from temporary storage into its durable domain home.
- Preserve one canonical source and copy its exact identity from the opened source. Mark readable exports and snapshots as derived.
- Apply the shared persistence-surface and project-history rules above.
- Update every affected inbound and relative link. Verify created, moved, copied, renamed, and deleted paths separately, including absence of an old location when removal was intended.

Return to the stable parent and repeat the cold-open test using only the filesystem and links.

**Complete when:** all applicable cold-open answers are recoverable, every overview-to-source path resolves, the canonical source is unambiguous, and no misleading parallel or obsolete organization remains.

## New chain scaffolding

## Build the smallest three-layer chain

### 1. Descriptive folders and files

Name the subject and artifact type so a shallow listing provides the first orientation. Create a folder when a common pattern or multi-artifact discovery path is emerging; let one descriptive file orient itself when no grouping is needed. Preserve distinct ownership and lifecycle boundaries.

### 2. Progressive discovery

Organize the reading path as **overview → detail → source artifacts**. Add only the front door needed to identify purpose, current state, canonical source, and next reading step. Keep explanation and evidence together while they share an owner, lifecycle, and discovery path; split them when one diverges.

### 3. Linked source trail

Link durable notes to the artifact, transcript, issue, pull request, email, document, dataset, or canonical application record that supports them. Label local downloads, snapshots, cleaned transcripts, and Markdown exports as derived views. Apply the shared project-history and session-provenance rules above.

## Clean scaffold check

From the new folder's parent, verify:

- its name and shallow contents expose the domain and artifact roles;
- the front door exists only when it adds necessary orientation;
- the useful reading path reaches one unambiguous canonical source;
- every relative link resolves;
- operating and audit metadata sit outside canonical business data;
- no duplicate index, empty placeholder, generic catch-all, unexplained copy, or host-instruction duplicate was created.

**Complete when:** a cold-start agent can traverse from the parent listing through useful context to the canonical source without guessing, and the scaffold contains only artifacts required by that path.

## Final response

When you create or reorganize a folder structure, include a compact tree of the affected structure in your final response. Use observed paths and distinguish new, moved, and unchanged material where applicable; mark updates or removals when useful. Show only relevant structure and statuses supported by the filesystem and your changes. Routine single-file placement needs only the destination and copy/move status from its workflow.

## Maintaining this skill

When changing this skill or auditing fidelity to the original framework, read [origin and source lineage](ORIGIN.md) before editing. Runtime use does not require that maintainer reference.
