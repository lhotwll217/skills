# Interactive diff-review prototype

> **THROWAWAY PROTOTYPE** for [issue #1](https://github.com/lhotwll217/skills/issues/1). This is not the skill implementation.

## Question

What is the lightest useful interaction for moving through a targeted multi-file diff, selecting changed text, and handing comments back to the agent?

The current direction keeps one file visible at a time, with previous/next controls and a compact file picker. The comment composer appears directly beside highlighted text. The sidebar shows comments—not raw persisted state—and clicking a comment returns to its file and line for editing.

## Run

```bash
node interactive-diff-review-prototype/server.mjs
```

The server binds to `127.0.0.1` on port `0`, prints the OS-assigned URL and JSON path, then opens the browser. Comments autosave to `.prototype-review.json` after every mutation.

Stop it with **Ctrl-C**. Delete `.prototype-review.json` to reset it.

## Review prompt

1. Move among all three targeted files with previous/next and the file picker.
2. Highlight text on either side of a diff.
3. Confirm the composer opens directly beside the selection and keeps it visibly highlighted.
4. Add, edit, and delete a comment.
5. Click a comment and confirm it returns to the anchored file and line, then opens for editing.
6. Refresh and confirm state survives.
7. Decide whether “I'm done; please look” feels sufficient without exposing the raw JSON state in the UI.
