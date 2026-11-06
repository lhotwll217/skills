---
name: workspace-architecture
description: Build, repair, or extend a workspace architecture for durable project work. Use when placing or preserving project artifacts, recording project history or operating instructions, persisting a decision, correction, or finding with its authority and scope, propagating a revision across discovery surfaces, establishing or changing artifact organization, or auditing whether a cold-start agent can reconstruct what happened, find the source of truth, interpret statements at their supported scope, and know what to read next.
---

# Workspace Architecture

Workspace architecture makes project-owned durable work continuable by stateless agents. The filesystem becomes onboarding. Judge every structure against one outcome: a cold-start agent recognizes what kind of material it faces, reaches the right detail without reading everything, interprets each statement at its supported authority and scope, and continues the work after understanding changes. A category earns its place by the distinction it communicates, even when it holds one item; structure that serves no part of that outcome is ceremony to omit.

## Route the work

For an explicit audit request, apply the cold-open test below to the requested scope.

For a revision — a correction, a superseding decision, or changed understanding — follow [Revision and current state](#revision-and-current-state).

For artifact placement, start at the nearest stable parent of the artifact. Read the applicable agent instructions, the shallow parent listing, and its README or index when present. Inspect only the artifact, its proposed home, and the direct discovery path needed to decide:

- **Healthy home:** an established local pattern makes the artifact's purpose, owner, lifecycle, canonical source, and next reading step clear. Follow the [routine placement branch](#routine-placement).
- **Misleading home:** existing names, placement, indexes, ownership, or source trail obscure those facts. Use the repair and audit procedure below.
- **No home:** no established pattern governs durable material, or several related artifacts need a new domain-owned folder. Use the new-chain procedure below.

Externally prescribed layouts remain authoritative. Preserve package, dependency, vendor, framework, SDK, tool, cache, profile, and package-managed configuration boundaries.

Before placing anything, identify:

1. the project domain that owns it;
2. whether it is current, dated, append-only, derived, or temporary;
3. its canonical source, copied exactly from an opened URL, ID, path, or version;
4. its role — evidence, synthesis, decision, or instruction — and whose authority it carries.

## Common rules

- Let domain language name folders and files. Prefix date-bound artifacts with `YYYY-MM-DD-` when the local convention does not already carry chronology.
- Make kind and scope recognizable from the parent surface: a name, a short parent description, or an index entry lets an agent choose a destination before opening its contents.
- Keep one canonical source. Label snapshots, downloads, cleaned transcripts, and exports as derived views and link them to that source. Navigation views — indexes, cross-references, alternate groupings — orient; they point at the authoritative copy rather than duplicating it.
- Keep process metadata, session IDs, audit notes, and agent instructions outside canonical business data.
- Keep ownership boundaries visible when artifacts have different owners, lifecycles, or discovery paths.
- Add a README or index only when names and the parent listing cannot reveal what is current, where the source lives, or what to read next.

## Meaning and authority

When persisting a consequential statement — a decision, correction, instruction, or finding — preserve what affects later use: who established it, when, at what scope, and with what certainty and status. Keep evidence, synthesis, decisions, and instructions distinguishable wherever confusing them would change action.

Persist each statement at the scope its source supports, with that source named beside it:

- A recurring rule or operating instruction requires the owner's words or recurring evidence and extends only as far as they state: an approved decision about the work at hand governs that work, and the sources, layout, and format the workspace holds today enter standing instructions as description, leaving room for kinds the source did not rule out.
- A local correction governs the corrected artifact; it becomes wider governance only when its source says so.
- An agent hypothesis stays labeled as hypothesis until the owner or evidence confirms it.

## Revision and current state

Each subject or decision has one maintained authority; every other surface links to it. When understanding changes:

1. Update the maintained document for the subject.
2. Update every discovery surface that still presents the old state as current — indexes, READMEs, parent descriptions, instructions — at the owning boundary in the same pass.
3. Retain history when it serves a real need, labeled with its relationship to current understanding.
4. When a known uncertainty or status changes how a document should be used, record that status where the next reader encounters the document.

The maintained document holds current understanding; the daily log records when it changed and where to read it.

## Project history and session provenance

These rules apply to routine updates, repairs, and new scaffolds alike.

- When a session materially informs a durable artifact, record its stable session ID near the artifact when it helps a future agent find the original transcript. Include a message range or timestamp when useful; copy identities from the actual source rather than inventing them.

- When project state changes in a workspace that maintains a daily log, append a short dated entry linking the changed artifact and its source session or other authoritative record. Follow the existing logging convention; preserve earlier entries.

- Establish a daily log when the request or opened records establish a continuing sequence of project changes that needs a discoverable chronology and no existing surface serves that job. For a placement or discovery repair with no existing log, keep the breadcrumb in existing artifact context; the artifacts' continued use alone does not establish a chronology need. Use dated files and short linked entries rather than copies of outputs or transcripts.

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

README orients; AGENTS governs. When the request or opened artifacts establish recurring operating rules that existing context does not serve, use `AGENTS.md` as the canonical shared instruction source — the meaning-and-authority rules above decide whether a rule is supported at all. When Claude Code needs the same directions at that scope, use a `CLAUDE.md` containing only `@AGENTS.md`. Point other hosts to the canonical file rather than copying directions.

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
5. Who established each operating statement, and at what scope does it still apply?
6. What should I read next?
7. Where is the originating session when auditability matters?

A healthy pattern answers the applicable questions through names, placement, links, and necessary front doors. A pattern is misleading when generic, process-stage, tool, or role labels hide the domain; ownership boundaries are wrong; an index duplicates rather than orients; a durable artifact lives in a temporary home; a statement carries more authority or wider scope than its source supports; a superseded view still presents as current; or a source is broken, invented, or ambiguous.

Tie every failed answer to a concrete gap before editing. The presence of a folder or README is evidence only when it passes this test.

### Minimal repair

- Repair the existing chain at its owning boundary rather than layering a second organization beside it.
- Rename for the durable subject or domain, not the process stage, time horizon, tool, or audience role.
- Move reusable material from temporary storage into its durable domain home.
- Restore an over-promoted statement to the scope its source supports, keeping the supported part of the rule.
- Apply the common, meaning-and-authority, revision, persistence-surface, and project-history rules above.
- Update every affected inbound and relative link. Verify created, moved, copied, renamed, and deleted paths separately, including absence of an old location when removal was intended.

Return to the stable parent and repeat the cold-open test using only the filesystem and links.

**Complete when:** all applicable cold-open answers are recoverable, every overview-to-source path resolves, the canonical source is unambiguous, each persisted statement carries its supported authority and scope, and no misleading parallel or obsolete organization remains.

## New chain scaffolding

### 1. Descriptive folders and files

Name the subject and artifact type so a shallow listing provides the first orientation. Create a folder when a common pattern or multi-artifact discovery path is emerging; let one descriptive file orient itself when no grouping is needed. Preserve distinct ownership and lifecycle boundaries.

### 2. Progressive discovery

Organize the reading path as **overview → detail → source artifacts**, and keep direct access open: an agent with an exact known target opens it without walking the ladder. Add only the front door needed to identify purpose, current state, canonical source, and next reading step. Keep explanation and evidence together while they share an owner, lifecycle, and discovery path; split them when one diverges.

### 3. Linked source trail

Link durable notes to the artifact, transcript, issue, pull request, email, document, dataset, or canonical application record that supports them. Apply the common, meaning-and-authority, and project-history rules above.

### Clean scaffold check

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
