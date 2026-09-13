import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { collectReviewModel } from "../scripts/review.mjs";

function git(repo, ...args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
}

function createRepository() {
  const repo = mkdtempSync(join(tmpdir(), "interactive-diff-git-"));
  git(repo, "init", "-q");
  git(repo, "config", "user.name", "Test User");
  git(repo, "config", "user.email", "test@example.com");
  writeFileSync(join(repo, "alpha.txt"), "one\ntwo\nthree\n");
  writeFileSync(join(repo, "beta.txt"), "leave\nold\n");
  mkdirSync(join(repo, "evidence"));
  mkdirSync(join(repo, "test", "goldens"), { recursive: true });
  mkdirSync(join(repo, "test", "__goldens__"), { recursive: true });
  writeFileSync(join(repo, "Pipfile.lock"), "{\"version\": 1}\n");
  writeFileSync(join(repo, "package-lock.json"), "{\"version\": 1}\n");
  writeFileSync(join(repo, "evidence.json"), "{\"result\": \"old\"}\n");
  writeFileSync(join(repo, "evidence", "run.json"), "{\"result\": \"old\"}\n");
  writeFileSync(join(repo, "test", "goldens", "view.html"), "old\n");
  writeFileSync(join(repo, "test", "__goldens__", "other.html"), "old\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "base");
  const base = git(repo, "rev-parse", "HEAD");

  writeFileSync(join(repo, "alpha.txt"), "one\nTWO\nthree\nfour\n");
  writeFileSync(join(repo, "beta.txt"), "leave\nnew\n");
  writeFileSync(join(repo, "Pipfile.lock"), "{\"version\": 2}\n");
  writeFileSync(join(repo, "package-lock.json"), "{\"version\": 2}\n");
  writeFileSync(join(repo, "evidence.json"), "{\"result\": \"new\"}\n");
  writeFileSync(join(repo, "evidence", "run.json"), "{\"result\": \"new\"}\n");
  writeFileSync(join(repo, "test", "goldens", "view.html"), "new\n");
  writeFileSync(join(repo, "test", "__goldens__", "other.html"), "new\n");
  git(repo, "add", ".");
  git(repo, "commit", "-qm", "candidate");
  const candidate = git(repo, "rev-parse", "HEAD");

  const externalDiff = join(repo, "external-diff-must-not-run");
  writeFileSync(externalDiff, "#!/bin/sh\nexit 93\n");
  chmodSync(externalDiff, 0o755);
  git(repo, "config", "diff.external", externalDiff);
  return { repo, base, candidate };
}

test("collects only an explicitly targeted real git diff without external drivers", () => {
  const { repo, base, candidate } = createRepository();

  const model = collectReviewModel({ repo, base, candidate, paths: ["alpha.txt"] });

  assert.equal(model.repository, realpathSync(repo));
  assert.equal(model.base, base);
  assert.equal(model.candidate, candidate);
  assert.deepEqual(model.paths, ["alpha.txt"]);
  assert.equal(model.files.length, 1);
  assert.equal(model.files[0].path, "alpha.txt");
  assert.deepEqual(
    { additions: model.files[0].additions, deletions: model.files[0].deletions },
    { additions: 2, deletions: 1 },
  );
  assert.ok(model.files[0].rows.some((row) => row.oldText === "two"));
  assert.ok(model.files[0].rows.some((row) => row.newText === "TWO"));
  assert.doesNotMatch(JSON.stringify(model), /beta\.txt|leave/);
});

test("defaults to product files while explicit paths can include generated artifacts", () => {
  const { repo, base, candidate } = createRepository();

  const productModel = collectReviewModel({ repo, base, candidate });
  assert.deepEqual(productModel.paths, ["alpha.txt", "beta.txt"]);

  const explicitModel = collectReviewModel({
    repo,
    base,
    candidate,
    paths: ["package-lock.json", "evidence/run.json", "test/goldens/view.html"],
  });
  assert.deepEqual(explicitModel.paths, [
    "evidence/run.json",
    "package-lock.json",
    "test/goldens/view.html",
  ]);
});

test("rejects invalid revisions and paths before rendering", () => {
  const { repo, base, candidate } = createRepository();

  assert.throws(
    () => collectReviewModel({ repo, base: "missing", candidate, paths: ["alpha.txt"] }),
    /Invalid base revision/,
  );
  assert.throws(
    () => collectReviewModel({ repo, base, candidate, paths: ["../outside.txt"] }),
    /repository-relative/,
  );
  assert.throws(
    () => collectReviewModel({ repo, base, candidate, paths: ["missing.txt"] }),
    /does not exist at either revision/,
  );
});
