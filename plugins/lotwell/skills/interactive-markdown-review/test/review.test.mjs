import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { generateReviewHtml, markdownModel } from "../scripts/review.mjs";

const markdown = `# Review me

Opening copy.

## First section

First body.

## Second section

Second body.
`;

test("renders every Markdown heading in one continuous document", () => {
  const model = markdownModel("/tmp/review.md", markdown);

  assert.equal(model.pages.length, 1);
  assert.equal(model.pages[0].id, "document");
  assert.match(model.pages[0].html, /<h1>Review me<\/h1>/);
  assert.match(model.pages[0].html, /<h2>First section<\/h2>/);
  assert.match(model.pages[0].html, /<h2>Second section<\/h2>/);
  assert.ok(model.pages[0].html.indexOf("First section") < model.pages[0].html.indexOf("Second section"));
});

test("review HTML has one document surface and no section navigation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "interactive-markdown-review-test-"));
  const themePath = join(directory, "theme.css");
  await writeFile(themePath, ":root{--background:#000;--border:#333}");
  const html = await generateReviewHtml({
    model: markdownModel("/tmp/review.md", markdown),
    reviewPath: join(directory, "review.json"),
    themePath,
  });

  assert.match(html, /<article class="document" data-page="document">/);
  assert.doesNotMatch(html, /page-nav|page-link|previous-page|next-page/);
  assert.match(html, /<aside class="sidebar">/);
});
