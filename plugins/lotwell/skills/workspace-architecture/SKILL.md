---
name: workspace-architecture
description: Organize project files for a cold reader. Use when saving or locating work, changing a layout, recording decisions, sources, or standing instructions, or auditing a workspace.
---

# Workspace architecture

Leave work a **cold reader** can use: an agent holding only the filesystem can tell what each item is, reach the current work and its source, and continue it.

## Steps

1. **Classify the request.** Lookup: answer with links to the maintained document and write nothing. Plan-only: stop after step 3. Audit: run step 5 alone. Change: every step.

2. **Inspect the project parent.** Start at the project the request names, otherwise the working project's parent. Read its instructions, listing, and index. Decide here who owns the deliverable: a repository or package inside the parent owns it only when the request or an opened source says so. Available storage or a docs folder alone establishes no ownership. Done when every immediate child has a named role and the deliverable has an owner.

3. **Plan before choosing a destination or filename.** The plan keeps two properties:
   - **Kind.** Name each folder at the basic level: its name predicts what it holds and what a reader can do with it, so its information scent picks the right branch without opening the others. Take names from the project's own work. Units of one kind share a folder, even a category of one. Repositories and packages move whole. Topic, role, owner, and lifecycle are separate facets: one shapes the tree, names and links carry the rest. An existing layout is an example of these properties, never a template.
   - **Route.** Overview → detail → source, each step visible and short. A reader who knows the target opens it directly, and names stay searchable.

   Saving into a mixed parent includes grouping its existing units by kind: put movable units of one kind under one folder, moving repositories and packages whole.

   For a file joining an established single-role home of the owner, state the destination in one line. For anything else, including a save into a parent entry file beside a repository or package, show one row per immediate child and incoming item:

   ```text
   current path or NEW | role | proposed path relative to the project parent
   ```

   Pipe the rows to `python3 <skill>/scripts/check_layout.py "<project parent>"`. A unit stays in place with `| fixed=file:line` citing the config, script, or build file that depends on its location. Material inside an independent unit takes `| owns=file:line` citing that ownership. List every reference to a path the plan moves. Revise a failing plan before any write. Done when the checker prints `OK` for the project parent and the plan keeps Kind and Route.

4. **Apply the plan** within the scope the request grants. What you write keeps two properties:
   - **Provenance.** Record attribution, derivation, and revision: who said it, what it came from, what it replaces. The speaker stays distinct from the agent who recorded it, and a hypothesis keeps its uncertainty. Source, index, and conclusion are separate, linked artifacts. Keep the full source beside the findings derived from it, cited at the location it actually has. A correction governs the scope its source gave it; one source's format binds only that source. An open question stays written where the next reader meets it.
   - **Current.** Practice truth maintenance: each subject has one maintained document holding its conclusions and their reasons. When a reason changes, update that document and every surface depending on it. Link to it instead of restating it.

   Done when every saved claim names its speaker and source, and every reference you listed points to the new path.

5. **Verify.** `check_layout.py` establishes paths and repository boundaries; a cold reader establishes meaning, including whether the names mean to them what they mean to you. Rerun the rows with `--delivered`. For a move, search for references to the old path. For a copy, diff it against the original. Then walk overview → detail → source from the parent listing as a cold reader. Done when you report both results and the first place a cold reader would guess, or that there is none.

## Mechanisms

| Mechanism | Use when |
| --- | --- |
| Category folder | Two or more kinds share a parent |
| `YYYY-MM-DD-` prefix | A date-bound artifact where the local convention carries no date |
| `README.md` or index | The cold reader cannot tell from names and listing what is current, its source, or what to read next |
| `AGENTS.md` | The owner's words establish a standing rule. Place it at the nearest applicable directory; a `CLAUDE.md` there contains only `@AGENTS.md`. |
| Topic document | Understanding of a subject will change and be reused |
| Daily log | The project already keeps one: append a dated link to the change and its source session |
| Source artifact | Findings derive from it, or the owner asks to keep it |
| Session ID and message range | A session materially informed the artifact. Copy the ID from the source. |
| Superseded label | Someone will ask what the earlier state was |
| Business data | Holds business data only. Session IDs and audit notes go in the accompanying note. |
