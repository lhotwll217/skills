# Interactive diff-review prototype

> **THROWAWAY PROTOTYPE** for [issue #1](https://github.com/lhotwll217/skills/issues/1). This is not the skill implementation.

## Question

What is the lightest useful interaction for selecting changed text, attaching a comment, and making the resulting JSON obvious to the owner and agent?

Three composer placements are available from the bottom switcher:

- Sidebar
- Popover beside the selection
- Below the diff

## Run

```bash
node interactive-diff-review-prototype/server.mjs
```

The server binds to `127.0.0.1` on port `0`, prints the OS-assigned URL and JSON path, then opens the browser. Comments autosave to `.prototype-review.json` after every mutation.

Stop it with **Ctrl-C**. Delete `.prototype-review.json` to reset it.

## Review prompt

1. Highlight text on either side of the diff.
2. Add, edit, resolve, reopen, and delete a comment.
3. Refresh and confirm state survives.
4. Switch among the three composer placements.
5. Decide whether the visible JSON path plus “I'm done; please look” feels sufficient without a Finish button.
