import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { generateReviewHtml } from "../scripts/review.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const stylesheetPath = join(here, "..", "assets", "review.css");
const clientPath = join(here, "..", "assets", "review-client.js");

const model = {
  repository: "/tmp/repo <unsafe>",
  base: "base<script>",
  candidate: "candidate&1",
  paths: ["src/<unsafe>.js", "src/second.js"],
  files: [
    {
      path: "src/<unsafe>.js",
      additions: 1,
      deletions: 1,
      rows: [
        {
          oldLine: 7,
          newLine: 7,
          oldText: "const oldValue = '</script><script>alert(1)</script>';",
          newText: "const newValue = '& safer';",
          oldKind: "remove",
          newKind: "add",
        },
      ],
    },
    { path: "src/second.js", additions: 2, deletions: 0, rows: [] },
  ],
};

test("generates a safely embedded standalone review with its own unbranded stylesheet", async () => {
  const stylesheet = await readFile(stylesheetPath, "utf8");

  const html = await generateReviewHtml({
    model,
    reviewPath: "/tmp/review<script>.json",
  });

  assert.match(html, /^<!doctype html>/);
  assert.ok(html.includes(stylesheet));
  assert.doesNotMatch(html, /Owner Operator|house theme|data-theme/i);
  assert.doesNotMatch(html, /<link[^>]+stylesheet|https?:\/\//);
  assert.doesNotMatch(html, /<\/script><script>alert\(1\)<\/script>/);
  assert.match(html, /\\u003c\/script\\u003e\\u003cscript\\u003ealert\(1\)\\u003c\/script\\u003e/);
  assert.match(html, /\/tmp\/repo &lt;unsafe&gt;/);
  assert.match(html, /base&lt;script&gt; → candidate&amp;1/);
});

test("headlines the selected diff's file count and aggregate line totals instead of revisions", async () => {
  const html = await generateReviewHtml({ model, reviewPath: "/tmp/review.json" });
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)[1];

  assert.equal(
    heading,
    '<span class="positive">+3 added</span> <span class="negative">−1 deleted</span> <span class="file-count">2 files</span>',
  );
  assert.match(html, /<dt>Base<\/dt><dd>base&lt;script&gt;<\/dd>/);
  assert.match(html, /<dt>Candidate<\/dt><dd>candidate&amp;1<\/dd>/);
});

test("adds no review workflow states", async () => {
  const html = await generateReviewHtml({ model, reviewPath: "/tmp/review.json" });

  assert.doesNotMatch(html, /Finish review|raw state|Resolve|Resolved|Open comment/i);
  assert.doesNotMatch(html, /comment\.side.*textContent|textContent.*comment\.side/);
});

test("comment navigation measures after instant scrolling and clamps the composer to every viewport edge", async () => {
  const client = await readFile(clientPath, "utf8");
  const positionStart = client.indexOf("function composerPosition(");
  const positionEnd = client.indexOf("\nfunction placeComposer(", positionStart);
  assert.notEqual(positionStart, -1);
  assert.notEqual(positionEnd, -1);
  const composerPosition = Function(`${client.slice(positionStart, positionEnd)}\nreturn composerPosition;`)();

  assert.deepEqual(
    composerPosition(
      { left: 900, right: 1000, top: -200, bottom: -180 },
      { width: 360, height: 300 },
      { width: 800, height: 600 },
    ),
    { left: 428, top: 12 },
  );
  assert.deepEqual(
    composerPosition(
      { left: -100, right: -100, top: 650, bottom: 670 },
      { width: 360, height: 300 },
      { width: 800, height: 600 },
    ),
    { left: 12, top: 288 },
  );
  assert.match(
    client,
    /scrollIntoView\(\{ behavior: "instant", block: "center" \}\);[\s\S]*requestAnimationFrame\(\(\) => placeComposer\(nearby\.getBoundingClientRect\(\)\)\);/,
  );
});
