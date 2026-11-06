---
name: workspace-architecture
description: Organize project files for a cold reader. Use when saving or locating work, planning or changing a layout, recording decisions, sources, or standing instructions, or auditing a workspace.
---

# Workspace architecture

Arrange project work for a **cold reader**: an agent holding only the filesystem, who must find, trust, and continue it. Judge every folder, index, and note by whether it serves that reader. A category with one member earns its place when it names a distinction the reader needs.

## Properties

1. **Kind is visible.** From the parent listing alone, a cold reader predicts what each child holds and which one to open. Units sharing a role share a domain-named folder. A repository or package moves whole and keeps its Git state. Use the project's established names, and add a one-line parent description only where a name cannot carry the distinction.
2. **The route reaches evidence.** From an entry point the reader follows links to the current work, and from each finding to the location its source actually has: a file and section, a transcript and timestamp, a session ID. When asked to preserve a source, keep the full original beside any summary. A reader who knows the target opens it directly, so add an index only where the listing leaves the next step unclear.
3. **Authority and scope survive.** Each saved claim keeps who said it, whether it is evidence, synthesis, a decision, or an instruction, and how far it applies. A correction governs the thing it corrected. A standing instruction rests on the owner's words making it standing, and lives in the nearest applicable `AGENTS.md`; where the project uses `CLAUDE.md`, that file imports `@AGENTS.md`. A new kind of source joins the work under the rules already in place.
4. **One current authority.** Each subject or decision has one maintained document. When understanding changes, edit that document and, in the same pass, every index, README, or instruction still presenting the old state as current. Keep history where someone will ask about it, labelled as superseded. Point to an authority rather than writing a second account of it.

## Steps

1. **Inspect the owning project.** Start at the project the request names, otherwise the working project's parent, even when a neighbouring repository offers a docs folder. Read its instructions, listing, and index. Done when you can name the role of every immediate child and the existing home, if any, for the incoming work.
2. **Plan in proportion.**
   - A lookup: answer with links to the maintained authority, put any requested summary in the reply, and stop.
   - Placement into an established single-role home: state the file and its destination in one line.
   - Anything else (a new home, a layout change, material landing beside a repository or package): show one row per immediate child and incoming item.

     ```text
     current path or NEW | role | proposed path relative to the project parent
     ```

     Pipe the rows to `python3 <skill>/scripts/check_layout.py "<project parent>"`. Append `| fixed=file:line` when a config, script, or build file depends on a unit's present location, citing that dependency. Append `| owns=file:line` when an independent unit owns the material, citing that ownership. Open each cited line and confirm it says so.

   Done when the plan satisfies the four properties and any rows check `OK` at the project parent. For a plan-only request, deliver the plan here.
3. **Carry it out** within the authority the request gives. If the project keeps a daily log, append a dated link to the new work.
4. **Verify the result.** An audit starts and ends here, on what exists. Rerun any rows with `--delivered`. For a move, check the destination, the vacated path, and every reference to the old path. For a copy, compare it with the original. Then read the parent listing as a cold reader and walk the route to the evidence. Done when each property holds, or when you report the first place a cold reader would have to guess.
