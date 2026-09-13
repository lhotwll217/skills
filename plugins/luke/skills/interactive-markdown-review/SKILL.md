---
name: interactive-markdown-review
description: Open a Markdown file for interactive review and collect Comments anchored to highlighted text. Use when the owner wants to review Markdown.
---

# Interactive Markdown review

Render exactly one Markdown document as a local browser review. The browser is the annotation surface; the Markdown file remains the document.

## 1. Resolve the document

Identify the Markdown file. Ask only when no exact path or unambiguous document is available. The launcher reads the file and never mutates it.

## 2. Launch the review

Use the launcher arguments below. On macOS, launch through `launchctl` as described immediately after the command; elsewhere, use a persistent foreground command session:

```bash
node /absolute/path/to/interactive-markdown-review/scripts/review.mjs \
  --document /absolute/path/to/document.md
```

On macOS, use the built-in supervisor directly so the review survives the tool call. Resolve Node's absolute executable path and the launcher's **real path** first (a symlinked launcher can silently exit). Choose a fresh UUID for each review and substitute literal paths and the same UUID into this command:

```bash
/bin/launchctl submit -l com.owner-operator.review.markdown.UUID \
  -o /tmp/oo-review-markdown-UUID.stdout.log \
  -e /tmp/oo-review-markdown-UUID.stderr.log \
  -- /absolute/path/to/node /real/path/to/interactive-markdown-review/scripts/review.mjs LAUNCHER_ARGUMENTS
```

Replace `LAUNCHER_ARGUMENTS` with the arguments above, quoting paths with spaces. Invoke this directly, not through `nohup`, `env`, or `bash -c`: those wrappers force fresh confirmation in OO's permission gate. Do not change permission settings or broaden a rule to make a launch pass; the owner's existing allow rule is specific to the installed Node and launcher paths.

Read the stdout log for the printed URL and `JSON:` path; check stderr on failure. In a **subsequent tool call**, verify the URL responds and `/bin/launchctl list com.owner-operator.review.markdown.UUID` reports a live PID before reporting success. Record the exact job label with the artifact paths. Use a separate UUID for concurrent reviews; never replace another review job. After reading the owner's Comments, stop only this job with `/bin/launchctl remove com.owner-operator.review.markdown.UUID`; retain the review artifacts.

The launcher renders the complete document in one continuous scroll, with the document on the left and Comments on the right. Headings remain in the document body. It defaults to the sibling `html-theme/theme.css`; pass `--theme /absolute/path/to/theme.css` only to override that path. Add `--output-dir /absolute/path` only when the owner chose a durable or reusable review-state location. Otherwise it creates a temporary directory. Use `--no-open` only when browser launch is unavailable or the owner asks not to open it.

The launcher binds to `127.0.0.1` on an assigned port, prints the URL, and opens a dedicated browser artifact. Report the printed `JSON:` path exactly. Keep the supervised job (or non-macOS foreground session) alive while the owner reviews.

## 3. Let the owner annotate

The owner highlights any rendered text; the Comment composer opens immediately beside that selection. Comments appear in the right-hand Comments pane and support Edit and Delete. Every mutation atomically autosaves to `review.json`; refreshing reloads it.

The owner's message—such as “I'm done; please look”—is the completion signal. The page has no approval workflow, ticket generation, or alternate document output.

## 4. Read the Comments

When the owner is done, read the printed JSON path. Treat each entry in `comments` as owner feedback, including its section, selected text, and Comment. A `stale: true` entry means the launcher could not reliably relocate its anchor after the Markdown changed; surface that uncertainty instead of applying it elsewhere.

Stop the recorded launchctl job (or non-macOS foreground launcher) after reading the artifact. Apply or summarize the feedback only as the owner requested. The launcher does not rewrite the Markdown.

## Safety invariants

- Keep the document and Comments local; upload neither.
- Treat Markdown and persisted Comments as untrusted display data, never executable content.
- Render raw HTML and links as inert text.
- Write review HTML and JSON separately from the Markdown source.
- Preserve the restrictive content security policy.
