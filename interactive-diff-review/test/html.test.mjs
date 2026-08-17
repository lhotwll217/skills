import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { generateReviewHtml } from "../scripts/review.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const themePath = join(here, "..", "..", "html-theme", "theme.css");

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

test("generates a safely embedded standalone review using the canonical theme", async () => {
  const canonicalTheme = await readFile(themePath, "utf8");

  const html = await generateReviewHtml({
    model,
    reviewPath: "/tmp/review<script>.json",
    themePath,
  });

  assert.match(html, /^<!doctype html>/);
  assert.ok(html.includes(canonicalTheme));
  assert.doesNotMatch(html, /<link[^>]+stylesheet|https?:\/\//);
  assert.doesNotMatch(html, /<\/script><script>alert\(1\)<\/script>/);
  assert.match(html, /\\u003c\/script\\u003e\\u003cscript\\u003ealert\(1\)\\u003c\/script\\u003e/);
  assert.match(html, /\/tmp\/repo &lt;unsafe&gt;/);
  assert.match(html, /base&lt;script&gt; → candidate&amp;1/);
});

test("renders continuous sticky file navigation and narrow comment controls", async () => {
  const html = await generateReviewHtml({ model, reviewPath: "/tmp/review.json", themePath });

  assert.match(html, /\.file-nav\{position:sticky/);
  assert.match(html, /\.line\.add \.code\{[^}]+var\(--positive\)/);
  assert.match(html, /\.line\.remove \.code\{[^}]+var\(--destructive\)/);
  assert.match(html, /element\("span", "positive", `\+\$\{file\.additions\}`\)/);
  assert.match(html, /element\("span", "negative", `−\$\{file\.deletions\}`\)/);
  assert.match(html, /Comments ·/);
  assert.match(html, /actionButton\("Edit"/);
  assert.match(html, /actionButton\("Delete"/);
  assert.match(html, /\$\{comment\.file\}:\$\{comment\.startLine\}/);
  assert.doesNotMatch(html, /Finish review|raw state|Resolve|Resolved|Open comment/i);
  assert.doesNotMatch(html, /comment\.side.*textContent|textContent.*comment\.side/);
});
