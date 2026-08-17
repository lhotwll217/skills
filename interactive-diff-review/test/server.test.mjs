import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { startReviewServer } from "../scripts/review.mjs";

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function reviewModel() {
  return {
    repository: "/tmp/example-repo",
    base: "base-2",
    candidate: "candidate-2",
    paths: ["src/a.js"],
    files: [
      {
        path: "src/a.js",
        additions: 1,
        deletions: 1,
        rows: [
          { oldLine: 19, newLine: 19, oldText: "before", newText: "before", oldKind: "context", newKind: "context" },
          { oldLine: 20, newLine: 20, oldText: "const x = old();", newText: "const x = target();", oldKind: "remove", newKind: "add" },
          { oldLine: 21, newLine: 21, oldText: "after", newText: "after", oldKind: "context", newKind: "context" },
        ],
      },
    ],
  };
}

function movedComment() {
  return {
    id: "comment-moved",
    file: "src/a.js",
    side: "new",
    startLine: 10,
    endLine: 10,
    selectedText: "target()",
    prefix: "const x = ",
    suffix: ";",
    contentHash: hash("before\nconst x = target();\nafter"),
    comment: "Keep this direct.",
  };
}

function staleComment() {
  return {
    id: "comment-stale",
    file: "src/a.js",
    side: "new",
    startLine: 30,
    endLine: 30,
    selectedText: "target()",
    prefix: "const x = ",
    suffix: ";",
    contentHash: hash("different nearby context"),
    comment: "This similar text has lost its context.",
  };
}

test("reload relocates a uniquely moved comment and flags an unreliable anchor stale", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "interactive-diff-state-"));
  const reviewPath = join(directory, "review.json");
  await writeFile(reviewPath, `${JSON.stringify({
    review: {
      repository: "/tmp/example-repo",
      base: "base-1",
      candidate: "candidate-1",
      paths: ["src/a.js"],
      createdAt: "2026-08-17T10:00:00.000Z",
      updatedAt: "2026-08-17T10:00:00.000Z",
    },
    comments: [movedComment(), staleComment()],
  })}\n`);

  const session = await startReviewServer({ html: "<!doctype html><p>review</p>", reviewPath, model: reviewModel() });
  t.after(() => session.close());

  assert.equal(session.server.address().address, "127.0.0.1");
  assert.ok(session.server.address().port > 0);
  const response = await fetch(`${session.url}review.json`);
  const state = await response.json();
  const moved = state.comments.find((comment) => comment.id === "comment-moved");
  const stale = state.comments.find((comment) => comment.id === "comment-stale");
  assert.deepEqual(
    { startLine: moved.startLine, endLine: moved.endLine, stale: moved.stale },
    { startLine: 20, endLine: 20, stale: undefined },
  );
  assert.equal(stale.stale, true);
  assert.match(stale.staleReason, /reliably locate/i);
  assert.equal(state.review.candidate, "candidate-2");
  assert.equal(state.review.createdAt, "2026-08-17T10:00:00.000Z");
});

test("POST atomically autosaves only the minimal review schema and survives restart", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "interactive-diff-persist-"));
  const reviewPath = join(directory, "review.json");
  const model = reviewModel();
  let session = await startReviewServer({ html: "<!doctype html><p>review</p>", reviewPath, model });
  t.after(async () => session.close());

  const comment = {
    id: "comment-1",
    file: "src/a.js",
    side: "new",
    startLine: 20,
    endLine: 20,
    selectedText: "target()",
    prefix: "const x = ",
    suffix: ";",
    contentHash: hash("before\nconst x = target();\nafter"),
    comment: "Escape <script>alert(1)</script> safely.",
    workflow: "open",
  };
  const response = await fetch(`${session.url}review.json`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ review: { repository: "/tampered" }, comments: [comment], rawState: true }),
  });
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.review.repository, model.repository);
  assert.deepEqual(Object.keys(saved).sort(), ["comments", "review"]);
  assert.deepEqual(Object.keys(saved.comments[0]).sort(), [
    "comment",
    "contentHash",
    "endLine",
    "file",
    "id",
    "prefix",
    "selectedText",
    "side",
    "startLine",
    "suffix",
  ]);

  const diskState = JSON.parse(await readFile(reviewPath, "utf8"));
  assert.deepEqual(diskState, saved);
  assert.deepEqual((await readdir(directory)).sort(), ["review.json"]);

  await session.close();
  session = await startReviewServer({ html: "<!doctype html><p>review</p>", reviewPath, model });
  const reloaded = await (await fetch(`${session.url}review.json`)).json();
  assert.equal(reloaded.comments[0].comment, comment.comment);
});
