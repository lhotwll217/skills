---
name: interactive-diff-review
description: Open a deterministic, interactive side-by-side review for an explicitly targeted Git diff and persist the owner's anchored Comments to JSON. Use when the user asks to see, inspect, or comment on a product diff, selected files, or a base-to-candidate change without unrelated generated artifacts.
---

# Interactive diff review

Render only the requested Git change, keep every selected file in one continuous review page, and return the owner's Comments through a local JSON artifact. The owner's message—such as “I'm done; please look”—is the completion signal.

## 1. Resolve the review target

Identify:

- the repository (default: current repository);
- the base revision;
- the candidate revision;
- zero or more repository-relative paths.

Ask for a missing base or candidate. Preserve explicit paths exactly. With no paths, the launcher selects changed product files and omits lockfiles, evidence, and generated goldens. Include those artifacts only when the owner explicitly targets them.

The launcher validates the repository, resolves both revisions to commits, verifies every requested path at either revision, and generates the authoritative patch with `git diff --no-ext-diff`. It never writes to the reviewed repository.

## 2. Load the canonical HTML theme (optional)

The launcher defaults to the sibling [`theme.css`](../html-theme/theme.css), so this step is optional. To review or adjust theming, load the model-invoked sibling [`html-theme`](../html-theme/SKILL.md) skill and pass its canonical `theme.css` path to the launcher. Whichever stylesheet is used, it is inlined at generation time so the resulting review HTML is standalone; do not copy, fork, or substitute the palette in this skill.

## 3. Launch the review

Run the dependency-free Node launcher in a foreground command session:

```bash
node /absolute/path/to/interactive-diff-review/scripts/review.mjs \
  --repo /absolute/path/to/repository \
  --base BASE_REVISION \
  --candidate CANDIDATE_REVISION \
  --theme /absolute/path/to/html-theme/theme.css \
  --path path/to/first-file \
  --path path/to/second-file
```

Omit `--theme` to use the default sibling `theme.css`. Omit `--path` for the filtered product-file default. Repeat it for every explicit file or directory. Add `--output-dir /absolute/path` only when the owner explicitly chose a durable or reusable location; otherwise the launcher creates a temporary review directory outside the repository. Use `--no-open` only when browser launch is unavailable or the owner asks not to open it.

The launcher binds to `127.0.0.1` on OS-assigned port `0`, prints the assigned URL, and opens it as a dedicated browser artifact. Report the printed `JSON:` filesystem path to the owner exactly. Keep the foreground session alive while they review.

## 4. Let the owner annotate

The page stacks all files and hunks in one scroll beneath sticky file anchor links. The owner can highlight changed text on either side, add a nearby Comment, then Edit or Delete it. Every mutation atomically autosaves the minimal review schema to `review.json`; refreshing the page reloads it.

Internal anchors retain old/new side and structural selectors, while visible labels use `file:line`. Added lines and `+N` stay green; deleted lines and `−N` stay red. The page intentionally has no workflow states, Finish button, or raw-state panel.

## 5. Read the result and stop cleanly

When the owner says they are done, read the printed JSON path. Treat each entry in `comments` as owner feedback, including its file, line range, selected text, and Comment. A `stale: true` entry means the launcher could not reliably relocate that anchor; surface the uncertainty instead of silently applying it elsewhere.

After reading the artifact, send Ctrl-C to the foreground launcher session and wait for its clean shutdown. Generate Markdown from the JSON only when useful; JSON remains the persistence source of truth.

To reload after the candidate changes, launch again with the new candidate and the same explicit `--output-dir`. Exact anchors are retained, uniquely moved anchors are relocated by their text/context selectors, and unreliable anchors are marked stale.

## Safety invariants

- Keep source and Comments local; upload neither.
- Treat diff text and persisted Comments as untrusted display data, never executable content.
- Preserve standalone HTML and its restrictive content security policy.
- Never add authentication, URL tokens, review workflow, repository mutation, or broad generated-file inclusion without a new owner requirement.
