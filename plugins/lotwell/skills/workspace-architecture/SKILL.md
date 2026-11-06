---
name: workspace-architecture
description: Organize project files for a new reader. Use when locating or saving work, planning a layout, updating decisions or instructions, or auditing a workspace.
---

# Workspace architecture

A new reader should be able to choose where to look from the parent listing, find the current work, and follow it to the evidence.

## Find or save work

For a lookup, link to the maintained answer. Put any requested summary in your reply.

Before writing, show where the work belongs. For a file with an established home, its destination is the plan. For a layout change, or when adding material beside an independently maintained repository or package, show the [layout plan](EXAMPLES.md#layout-plan) for every existing and incoming item. Before writing, revise it until `check_layout.py` returns `OK`. Start in the project that owns the deliverable, even when a neighboring repository already has a docs folder. For a plan-only request, stop after checking the plan.

Name folders for distinctions a reader needs to see, even if a category has one item. Keep repositories and packages intact. If the listing leaves the next step unclear, add a short index that points to the current work. A reader who knows the target can go straight there.

## Keep decisions and sources usable

- Update the document that owns a decision. If an index or instruction still presents the previous decision as current, update that too.
- Link findings to the original source. Identify who said what and cite a location the source actually has. If the source is a conversation, include the session ID or transcript link. When asked to preserve a source, keep the full original alongside any summary.
- Give a correction the scope supported by its source. Put standing directions in the nearest applicable `AGENTS.md`. Where the project uses `CLAUDE.md`, import the shared directions with `@AGENTS.md`.
- If the project keeps a daily log, append a dated link. Keep session references in the accompanying note or log so the dataset keeps its existing fields.

## Check the result

For a move, verify the destination, the vacated path, and anything that refers to the old location. For a copy, compare it with the original. On an audit, start with the parent listing and follow the route to the current work and its evidence. Report the first place a new reader would have to guess.

When an unfamiliar document needs a format, consult the [examples](EXAMPLES.md).
