# Chain of Context origin and source lineage

This is maintainer documentation for preserving Luke Otwell's original Chain of Context framework while evolving the agent skill. All operating rules are in [`SKILL.md`](SKILL.md); concrete examples remain in [`EXAMPLES.md`](EXAMPLES.md).

## Canonical sources

- Canonical gist: [`lhotwll217/04211c5ddf2e6986e32dd30c5e6e3671`](https://gist.github.com/lhotwll217/04211c5ddf2e6986e32dd30c5e6e3671)
- Original compact revision: `314bd23ff4fbb20daaf5ecfa9d92cd9b4e5c6ee8`, committed 2026-06-09 at 15:35:56Z
- Current expanded revision: `d5c4ded3f1315cc8713f626819c7245af528716f`, committed 2026-06-09 at 16:00:08Z

The current expansion supplies the stateless-agent framing, cold-open questions, three-layer model, persistence surfaces, date-first naming, templates, and rationale. The original compact revision contains operational rules that the expansion dropped. The skill deliberately merges both rather than treating the newest revision as complete.

## Framework that must survive skill edits

### Current expanded revision

1. The filesystem is onboarding and a memory scaffold for stateless agents.
2. A cold-start agent can use `ls`, grep, descriptive names, and links to reconstruct the work.
3. The environment answers what this is, when it happened, why it matters, the source of truth, and what to read next.
4. The three layers are descriptive folders and files, progressive discovery, and a linked source trail.
5. Date-bound files use an ISO date prefix.
6. README/index, folder-scoped agent instructions, daily log, durable topic documents, source artifacts, and memory have different jobs and are used contextually.
7. Daily logs are short dated pointers rather than copies of artifacts.
8. Durable topic documents are updated when understanding changes.
9. Memory holds collaboration preferences rather than project state.
10. The domain drives the architecture; generic example trees are not mandatory schemas.

### Original compact revision restored by the skill

1. Create folders when a common pattern is emerging.
2. Let domain language replace generic folders such as `reference/` or `insights/`.
3. Keep business data free of process metadata, session IDs, audit notes, and agent instructions.
4. Keep agent instructions close to the files they govern, using the host's applicable instruction filename.
5. Keep daily logs short: no full outputs, generated analysis, copied transcripts, or long explanations.
6. Record the stable session ID when it helps a future agent find the original transcript.
7. Include the originating session in the final cold-open audit when traceability matters.

## Folder-instruction interoperability decision

Primary-source research completed 2026-09-01 converged the cross-harness pattern without changing the source framework:

1. `README.md` remains folder orientation.
2. `AGENTS.md` is the canonical shared source for operating directions at the nearest directory boundary where they become true.
3. A same-scope `CLAUDE.md` containing only `@AGENTS.md` adapts those directions for Claude Code without creating a duplicate source.
4. Hosts that do not discover nested AGENTS files should point their loaded instruction surface to the canonical file rather than copy it.
5. Reusable conditional procedures remain model-invoked skills rather than folder instruction payloads.

## Maintenance rule

Before changing `SKILL.md` or `EXAMPLES.md`:

1. Open both pinned gist revisions, not only the current gist landing page.
2. Check every framework item above against the proposed text.
3. Keep all operating rules and procedures in `SKILL.md`, with task-scoped completion criteria.
4. Keep concrete shapes needed only when creating a persistence surface in `EXAMPLES.md`, behind its explicit trigger in `SKILL.md`.
5. Preserve source documentation here; do not make a runtime link carry behavior that the skill itself omits.
6. Validate the description against preservation, history/instructions, organization-change, and audit/repair prompts in a fresh model session.

A link without a branch that tells the agent when to follow it is not preservation; it is a dead context pointer. Exact revision identity plus an explicit maintenance trigger keeps the original framework auditable without making runtime success depend on an external fetch.
