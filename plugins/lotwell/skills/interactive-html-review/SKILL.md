---
name: lotwell-interactive-html-review
description: Review a rendered HTML page on desktop or phone. Anchor comments to text, elements, or screenshots.
---

# Interactive HTML review

Render exactly one local HTML document as itself — its own styles and sibling assets — with a floating annotation overlay. The browser is the annotation surface; the HTML file remains the document.

## 1. Resolve the document

Identify the HTML file. Ask only when no exact path or unambiguous document is available. The launcher reads the file and its sibling assets and never mutates them. Review only HTML the owner authored or trusts: the page's own scripts run in the review.

## 2. Launch the review

Run the local review by default. For a phone retry, reuse the owner's existing protected Cloudflare link and review state. Verify the forwarded page loads and shows the saved comments. For a claude.ai artifact, follow [ARTIFACT.md](ARTIFACT.md).

Use the launcher arguments below. On macOS, launch through `launchctl` as described immediately after the command; elsewhere, use a persistent foreground command session:

```bash
node /absolute/path/to/interactive-html-review/scripts/review.mjs \
  --document /absolute/path/to/page.html
```

On macOS, use the built-in supervisor directly so the review survives the tool call. Resolve Node's absolute executable path and the launcher's **real path** first (a symlinked launcher can silently exit). Choose a fresh UUID for each review and substitute literal paths and the same UUID into this command:

```bash
/bin/launchctl submit -l com.owner-operator.review.html.UUID \
  -o /tmp/oo-review-html-UUID.stdout.log \
  -e /tmp/oo-review-html-UUID.stderr.log \
  -- /absolute/path/to/node /real/path/to/interactive-html-review/scripts/review.mjs LAUNCHER_ARGUMENTS
```

Replace `LAUNCHER_ARGUMENTS` with the arguments above, quoting paths with spaces. Invoke this directly, not through `nohup`, `env`, or `bash -c`: those wrappers force fresh confirmation in OO's permission gate. Do not change permission settings or broaden a rule to make a launch pass; the owner's existing allow rule is specific to the installed Node and launcher paths.

Read the stdout log for the printed URL and `JSON:` path; check stderr on failure. In a **subsequent tool call**, verify the URL responds and `/bin/launchctl list com.owner-operator.review.html.UUID` reports a live PID before reporting success. Record the exact job label with the artifact paths. Use a separate UUID for concurrent reviews; never replace another review job. After reading the owner's Comments, stop only this job with `/bin/launchctl remove com.owner-operator.review.html.UUID`; retain the review artifacts.


The launcher serves sibling assets and intercepts page links during review. Use `--output-dir` to resume a review or save it in a chosen directory. Use `--no-open` for a phone-only retry.

The launcher binds to `127.0.0.1` on an assigned port, prints the URL, and opens the browser. Report the printed `JSON:` path exactly. Keep the supervised job (or non-macOS foreground session) alive while the owner reviews.

## 3. Let the owner annotate

On a phone, tap a passage in **Element**, then **Comment**. For an exact quote, choose **Text**, select the words, and tap **Comment** in the dock. For a screenshot, choose **Area** and drag once. Write the note and tap **Add Comment**.

On desktop, highlight text, hold ⇧ and click an element, or ⌘-drag a screenshot. With ⇧ held, ↑ picks the parent and ↓ steps back. For the first screenshot, share **This Tab**.

Comments appear in the toolbar panel and support Edit and Delete. Every mutation atomically autosaves to `review.json`; refreshing reloads it. The owner's message — such as "I'm done; please look" — is the completion signal. The page has no approval workflow or alternate document output.

## 4. Read the Comments

When the owner is done, read the printed JSON path. Treat each entry in `comments` as owner feedback, including its reference and Comment:

- `selectedText` carries a text reference; `stale: true` means it could not be reliably relocated.
- `screenshot` carries an image path relative to the output directory; `rect` gives its page coordinates. Read the image.
- `element` carries the captured label, compound DOM route, and fingerprint. `elementStatus` is `resolved`, `relocated`, `ambiguous`, `missing`, or `unsupported-boundary`; act on the first two and surface the others as uncertainty instead of guessing.

Stop the launcher cleanly after reading the artifact. Apply or summarize the feedback only as the owner requested.

To reload after the document changes, relaunch with the same `--output-dir`: anchors that still verify keep their place, uniquely relocatable ones move, and the rest fail closed. Exact element picking supports light DOM and open Shadow DOM; an iframe, closed shadow host, or canvas is selected only as its accessible outer element, with screenshots covering inaccessible internals.

## Safety invariants

- A local review keeps the document, Comments, and screenshots on this machine. An artifact review publishes all three to claude.ai and runs only at the owner's request.
- Serve only the document's own directory, read-only, to the loopback interface.
- Treat persisted Comments as untrusted display data, never executable content.
- Write review HTML and JSON separately from the document source.
