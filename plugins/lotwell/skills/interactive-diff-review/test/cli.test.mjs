import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const executable = join(here, "..", "scripts", "review.mjs");

function git(repository, ...args) {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" }).trim();
}

function createRepository() {
  const repository = mkdtempSync(join(tmpdir(), "interactive-diff-cli-repo-"));
  git(repository, "init", "-q");
  git(repository, "config", "user.name", "Test User");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "example.txt"), "before\n");
  git(repository, "add", "example.txt");
  git(repository, "commit", "-qm", "base");
  const base = git(repository, "rev-parse", "HEAD");
  writeFileSync(join(repository, "example.txt"), "after\n");
  git(repository, "commit", "-qam", "candidate");
  return { repository, base, candidate: git(repository, "rev-parse", "HEAD") };
}

function runCli(arguments_) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [executable, ...arguments_], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let launched = false;
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (!launched && stdout.includes("Stop: Ctrl-C")) {
        launched = true;
        setTimeout(() => child.kill("SIGINT"), 20);
      }
    });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => resolveRun({ code, signal, stdout, stderr, launched }));
  });
}

test("CLI help documents the deterministic review inputs and output controls", () => {
  const output = execFileSync(process.execPath, [executable, "--help"], { encoding: "utf8" });

  assert.match(output, /--repo <path>/);
  assert.match(output, /--base <revision>/);
  assert.match(output, /--candidate <revision>/);
  assert.match(output, /--path <path>/);
  assert.match(output, /--theme <theme\.css>/);
  assert.match(output, /--output-dir <path>/);
  assert.match(output, /--no-open/);
});

test("CLI canonicalizes repository and output symlinks before writing review artifacts", async () => {
  const { repository, base, candidate } = createRepository();
  const links = mkdtempSync(join(tmpdir(), "interactive-diff-cli-links-"));
  const repositoryLink = join(links, "repository");
  const internalOutput = join(repository, "review-output");
  const internalOutputLink = join(links, "internal-output");
  const externalOutput = join(links, "external-output");
  const externalOutputLink = join(repository, "external-output-link");
  mkdirSync(internalOutput);
  mkdirSync(externalOutput);
  symlinkSync(repository, repositoryLink);
  symlinkSync(internalOutput, internalOutputLink);
  symlinkSync(externalOutput, externalOutputLink);
  const common = ["--repo", repositoryLink, "--base", base, "--candidate", candidate, "--no-open"];

  const rejected = await runCli([...common, "--output-dir", internalOutputLink]);
  assert.equal(rejected.launched, false);
  assert.equal(rejected.code, 1);
  assert.match(rejected.stderr, /output directory.*reviewed repository/i);
  assert.equal(existsSync(join(internalOutput, "review.json")), false);
  assert.equal(existsSync(join(internalOutput, "review.html")), false);

  const external = await runCli([...common, "--output-dir", externalOutputLink]);
  assert.equal(external.launched, true);
  assert.equal(external.code, 0);
  assert.equal(existsSync(join(externalOutput, "review.json")), true);
  assert.equal(existsSync(join(externalOutput, "review.html")), true);
  assert.equal(existsSync(join(repository, "review.json")), false);
  assert.equal(existsSync(join(repository, "review.html")), false);
});
