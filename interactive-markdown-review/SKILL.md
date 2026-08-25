---
name: interactive-markdown-review
description: Open a Markdown file for interactive review and collect Comments anchored to highlighted text. Use when the owner wants to review Markdown.
---

# Interactive Markdown review

Render exactly one Markdown document as a local browser review. The browser is the annotation surface; the Markdown file remains the document.

## 1. Resolve the document

Identify the Markdown file. Ask only when no exact path or unambiguous document is available. The launcher reads the file and never mutates it.

## 2. Launch the review

Run the dependency-free launcher in a foreground command session:

```bash
node /absolute/path/to/interactive-markdown-review/scripts/review.mjs \
  --document /absolute/path/to/document.md
```

The launcher renders the complete document in one continuous scroll, with the document on the left and Comments on the right. Headings remain in the document body. It defaults to the sibling `html-theme/theme.css`; pass `--theme /absolute/path/to/theme.css` only to override that path. Add `--output-dir /absolute/path` only when the owner chose a durable or reusable review-state location. Otherwise it creates a temporary directory. Use `--no-open` only when browser launch is unavailable or the owner asks not to open it.

The launcher binds to `127.0.0.1` on an assigned port, prints the URL, and opens a dedicated browser artifact. Report the printed `JSON:` path exactly. Keep the foreground session alive while the owner reviews.

## 3. Let the owner annotate

The owner highlights any rendered text; the Comment composer opens immediately beside that selection. Comments appear in the right-hand Comments pane and support Edit and Delete. Every mutation atomically autosaves to `review.json`; refreshing reloads it.

The owner's message—such as “I'm done; please look”—is the completion signal. The page has no approval workflow, ticket generation, or alternate document output.

## 4. Read the Comments

When the owner is done, read the printed JSON path. Treat each entry in `comments` as owner feedback, including its section, selected text, and Comment. A `stale: true` entry means the launcher could not reliably relocate its anchor after the Markdown changed; surface that uncertainty instead of applying it elsewhere.

Stop the foreground launcher cleanly after reading the artifact. Apply or summarize the feedback only as the owner requested. The launcher does not rewrite the Markdown.

## Safety invariants

- Keep the document and Comments local; upload neither.
- Treat Markdown and persisted Comments as untrusted display data, never executable content.
- Render raw HTML and links as inert text.
- Write review HTML and JSON separately from the Markdown source.
- Preserve the restrictive content security policy.
