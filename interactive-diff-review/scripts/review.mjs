#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const assetDirectory = join(scriptDirectory, "..", "assets");

function git(repository, args, options = {}) {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding: options.encoding ?? "utf8",
    maxBuffer: 128 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function resolveCommit(repository, revision, label) {
  if (!revision || revision.startsWith("-")) throw new Error(`${label} revision is required`);
  try {
    return git(repository, ["rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`]).trim();
  } catch {
    throw new Error(`Invalid ${label} revision: ${revision}`);
  }
}

function normalizePath(path) {
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//, "");
  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized === ".git" ||
    normalized.startsWith(".git/") ||
    normalized.split("/").includes("..")
  ) {
    throw new Error(`Path must be repository-relative: ${path}`);
  }
  return normalized;
}

function objectExists(repository, commit, path) {
  try {
    git(repository, ["cat-file", "-e", `${commit}:${path}`]);
    return true;
  } catch {
    return false;
  }
}

function changedPaths(repository, baseCommit, candidateCommit, paths) {
  const pathspecs = paths.map((path) => `:(literal)${path}`);
  const output = git(
    repository,
    ["diff", "--no-ext-diff", "--no-renames", "--name-only", "-z", baseCommit, candidateCommit, "--", ...pathspecs],
    { encoding: "buffer" },
  );
  return output.toString("utf8").split("\0").filter(Boolean);
}

const LOCKFILES = new Set([
  "bun.lock",
  "bun.lockb",
  "cargo.lock",
  "composer.lock",
  "gemfile.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "poetry.lock",
  "uv.lock",
  "yarn.lock",
]);

function isDefaultProductPath(path) {
  const lower = path.toLowerCase();
  const parts = lower.split("/");
  const basename = parts.at(-1);
  if (
    LOCKFILES.has(basename) ||
    basename.endsWith(".lock") ||
    basename.endsWith(".lockb") ||
    /(?:^|[-.])lock\.(?:json|ya?ml)$/.test(basename) ||
    basename === "go.sum" ||
    basename === "package.resolved"
  ) return false;
  if (parts.some((part) => {
    const category = part.replace(/[^a-z0-9]+/g, "");
    return category === "evidence" || category === "evidences" || category === "golden" || category === "goldens";
  })) {
    return false;
  }
  return !basename.startsWith("evidence.") && !basename.startsWith("golden.") &&
    !basename.startsWith("goldens.") && !basename.endsWith(".golden") && !basename.includes(".golden.");
}

function parsePatchBlock(block, path) {
  const rows = [];
  const lines = block.split("\n");
  let additions = 0;
  let deletions = 0;
  let oldLine = 0;
  let newLine = 0;
  let inHunk = false;
  let removed = [];
  let added = [];

  function flushChanges() {
    const length = Math.max(removed.length, added.length);
    for (let index = 0; index < length; index += 1) {
      const old = removed[index] ?? null;
      const current = added[index] ?? null;
      rows.push({
        oldLine: old?.line ?? null,
        newLine: current?.line ?? null,
        oldText: old?.text ?? "",
        newText: current?.text ?? "",
        oldKind: old ? "remove" : "empty",
        newKind: current ? "add" : "empty",
      });
    }
    removed = [];
    added = [];
  }

  for (const line of lines) {
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      flushChanges();
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      inHunk = true;
      continue;
    }
    if (!inHunk) continue;
    if (line.startsWith("@@ ")) {
      flushChanges();
      continue;
    }
    if (line.startsWith("\\ No newline at end of file")) continue;
    if (line.startsWith("-")) {
      removed.push({ line: oldLine, text: line.slice(1) });
      oldLine += 1;
      deletions += 1;
      continue;
    }
    if (line.startsWith("+")) {
      added.push({ line: newLine, text: line.slice(1) });
      newLine += 1;
      additions += 1;
      continue;
    }
    if (line.startsWith(" ")) {
      flushChanges();
      rows.push({
        oldLine,
        newLine,
        oldText: line.slice(1),
        newText: line.slice(1),
        oldKind: "context",
        newKind: "context",
      });
      oldLine += 1;
      newLine += 1;
    }
  }
  flushChanges();
  return { path, additions, deletions, rows };
}

function stableFileAnchor(path) {
  return `file-${createHash("sha256").update(path).digest("hex").slice(0, 16)}`;
}

function parsePatch(patch, paths) {
  if (!patch) return [];
  const blocks = patch.split(/(?=^diff --git )/m).filter((block) => block.startsWith("diff --git "));
  if (blocks.length !== paths.length) {
    throw new Error(`Could not pair ${blocks.length} patch sections with ${paths.length} changed paths`);
  }
  return blocks.map((block, index) => ({ ...parsePatchBlock(block, paths[index]), anchor: stableFileAnchor(paths[index]) }));
}

export function collectReviewModel({ repo, base, candidate, paths = [] }) {
  const requestedRepository = resolve(repo ?? process.cwd());
  let repository;
  try {
    repository = git(requestedRepository, ["rev-parse", "--show-toplevel"]).trim();
  } catch {
    throw new Error(`Not a Git repository: ${requestedRepository}`);
  }
  const baseCommit = resolveCommit(repository, base, "base");
  const candidateCommit = resolveCommit(repository, candidate, "candidate");
  const normalizedPaths = paths.map(normalizePath);
  for (const path of normalizedPaths) {
    if (!objectExists(repository, baseCommit, path) && !objectExists(repository, candidateCommit, path)) {
      throw new Error(`Path does not exist at either revision: ${path}`);
    }
  }
  let selectedPaths = changedPaths(repository, baseCommit, candidateCommit, normalizedPaths);
  if (normalizedPaths.length === 0) selectedPaths = selectedPaths.filter(isDefaultProductPath);
  if (selectedPaths.length === 0) throw new Error("No changes matched the selected paths");
  const patch = git(repository, [
    "diff",
    "--no-ext-diff",
    "--no-renames",
    "--unified=3",
    baseCommit,
    candidateCommit,
    "--",
    ...selectedPaths.map((path) => `:(literal)${path}`),
  ]);
  return {
    repository,
    base,
    candidate,
    paths: selectedPaths,
    files: parsePatch(patch, selectedPaths),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function scriptJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export async function generateReviewHtml({ model, reviewPath, themePath }) {
  if (!themePath) throw new Error("The canonical html-theme/theme.css path is required");
  const [themeCss, reviewCss, clientJavaScript] = await Promise.all([
    readFile(themePath, "utf8"),
    readFile(join(assetDirectory, "review.css"), "utf8"),
    readFile(join(assetDirectory, "review-client.js"), "utf8"),
  ]);
  const browserModel = {
    ...model,
    files: model.files.map((file) => ({ ...file, anchor: file.anchor ?? stableFileAnchor(file.path) })),
  };
  const title = `Interactive diff review — ${model.repository} — ${model.base} → ${model.candidate} — ${model.paths.join(", ")}`;
  return `<!doctype html>
<html lang="en" data-theme="gray">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<title>${escapeHtml(title)}</title>
<style>
${themeCss}
${reviewCss}
</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-row">
    <div><div class="label">Targeted diff review</div><h1 class="title">${model.files.length} files · ${escapeHtml(model.base)} → ${escapeHtml(model.candidate)}</h1></div>
    <div class="save-status" id="save-status">Loading…</div>
  </div>
  <div class="meta">
    <span>Repository: ${escapeHtml(model.repository)}</span>
    <span>Paths: ${escapeHtml(model.paths.join(", "))}</span>
    <span class="artifact-path">JSON: ${escapeHtml(reviewPath)}</span>
  </div>
</header>
<div class="layout">
  <main class="main">
    <nav class="file-nav" id="file-nav" aria-label="Changed files"></nav>
    <div id="files"></div>
    <div class="selection-help">Highlight changed text to add a nearby comment. Every add, edit, and delete autosaves.</div>
  </main>
  <aside class="sidebar"><section><div class="label">Comments · <span id="comment-count">0</span></div><div id="comments"></div></section></aside>
</div>
<div class="composer" id="composer" role="dialog" aria-modal="false" aria-labelledby="composer-title">
  <div class="label" id="composer-title">Comment on selection</div>
  <blockquote id="selected-quote"></blockquote>
  <textarea id="comment-text" placeholder="What should the agent understand or change?"></textarea>
  <div class="actions"><button class="btn btn-outline" id="cancel" type="button">Cancel</button><button class="btn btn-primary" id="save-comment" type="button">Add comment</button></div>
</div>
<script>window.__INTERACTIVE_DIFF_REVIEW__=${scriptJson({ model: browserModel, reviewPath })};
${clientJavaScript}
</script>
</body>
</html>
`;
}

function sideLines(file, side) {
  return file.rows
    .map((row) => ({
      line: side === "old" ? row.oldLine : row.newLine,
      text: side === "old" ? row.oldText : row.newText,
    }))
    .filter((entry) => entry.line !== null);
}

function contentHash(lines, startIndex, endIndex) {
  const context = lines
    .slice(Math.max(0, startIndex - 1), Math.min(lines.length, endIndex + 2))
    .map((entry) => entry.text)
    .join("\n");
  return createHash("sha256").update(context).digest("hex");
}

function requireString(value, field) {
  if (typeof value !== "string") throw new Error(`Comment ${field} must be a string`);
  return value;
}

function minimalComment(comment) {
  if (!comment || typeof comment !== "object" || Array.isArray(comment)) throw new Error("Each comment must be an object");
  const startLine = Number(comment.startLine);
  const endLine = Number(comment.endLine);
  if (!Number.isInteger(startLine) || startLine < 1 || !Number.isInteger(endLine) || endLine < startLine) {
    throw new Error("Comment lines must be positive integers in ascending order");
  }
  if (comment.side !== "old" && comment.side !== "new") throw new Error("Comment side must be old or new");
  const minimal = {
    id: requireString(comment.id, "id"),
    file: requireString(comment.file, "file"),
    side: comment.side,
    startLine,
    endLine,
    selectedText: requireString(comment.selectedText, "selectedText"),
    prefix: requireString(comment.prefix, "prefix"),
    suffix: requireString(comment.suffix, "suffix"),
    contentHash: requireString(comment.contentHash, "contentHash"),
    comment: requireString(comment.comment, "comment"),
  };
  if (comment.stale === true) {
    minimal.stale = true;
    minimal.staleReason = typeof comment.staleReason === "string" ? comment.staleReason : "Could not reliably locate this anchor.";
  }
  return minimal;
}

function reconcileComment(comment, model) {
  const clean = minimalComment(comment);
  const file = model.files.find((item) => item.path === clean.file);
  if (!file) return { ...clean, stale: true, staleReason: "Could not reliably locate this file." };
  const lines = sideLines(file, clean.side);
  const exactStart = lines.findIndex((entry) => entry.line === clean.startLine);
  const exactEnd = lines.findIndex((entry) => entry.line === clean.endLine);
  if (exactStart >= 0 && exactEnd >= exactStart && contentHash(lines, exactStart, exactEnd) === clean.contentHash) {
    const { stale, staleReason, ...anchored } = clean;
    return anchored;
  }

  const needle = `${clean.prefix}${clean.selectedText}${clean.suffix}`;
  const candidates = [];
  for (let startIndex = 0; startIndex < lines.length; startIndex += 1) {
    for (let endIndex = startIndex; endIndex < Math.min(lines.length, startIndex + 50); endIndex += 1) {
      const span = lines.slice(startIndex, endIndex + 1).map((entry) => entry.text).join("\n");
      if (span !== needle) continue;
      candidates.push({
        startLine: lines[startIndex].line,
        endLine: lines[endIndex].line,
        contentHash: contentHash(lines, startIndex, endIndex),
      });
      break;
    }
  }
  const hashMatches = candidates.filter((candidate) => candidate.contentHash === clean.contentHash);
  const reliable = hashMatches.length === 1 ? hashMatches[0] : null;
  if (!reliable) return { ...clean, stale: true, staleReason: "Could not reliably locate this anchor." };
  const { stale, staleReason, ...anchored } = clean;
  return { ...anchored, ...reliable };
}

function reviewMetadata(model, createdAt, updatedAt = new Date().toISOString()) {
  return {
    repository: model.repository,
    base: model.base,
    candidate: model.candidate,
    paths: [...model.paths],
    createdAt,
    updatedAt,
  };
}

function reconcileState(input, model, now = new Date().toISOString()) {
  const createdAt = typeof input?.review?.createdAt === "string" ? input.review.createdAt : now;
  const comments = Array.isArray(input?.comments) ? input.comments.map((comment) => reconcileComment(comment, model)) : [];
  return { review: reviewMetadata(model, createdAt, now), comments };
}

async function atomicWriteJson(path, state) {
  const temporaryPath = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await rename(temporaryPath, path);
}

function send(response, status, type, body) {
  response.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

async function readRequestJson(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 1_000_000) throw new Error("Review state is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function startReviewServer({ html, reviewPath, model }) {
  let existing = null;
  try {
    existing = JSON.parse(await readFile(reviewPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let state = reconcileState(existing, model);
  await atomicWriteJson(reviewPath, state);

  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://127.0.0.1").pathname;
      if (request.method === "GET" && pathname === "/") {
        send(response, 200, "text/html; charset=utf-8", html);
        return;
      }
      if (request.method === "GET" && pathname === "/review.json") {
        send(response, 200, "application/json; charset=utf-8", `${JSON.stringify(state)}\n`);
        return;
      }
      if (request.method === "POST" && pathname === "/review.json") {
        const submitted = await readRequestJson(request);
        state = reconcileState({ review: state.review, comments: submitted?.comments }, model);
        await atomicWriteJson(reviewPath, state);
        send(response, 200, "application/json; charset=utf-8", `${JSON.stringify(state)}\n`);
        return;
      }
      send(response, 404, "text/plain; charset=utf-8", "Not found");
    } catch (error) {
      send(response, 400, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
    }
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/`;
  return {
    server,
    url,
    close: () => new Promise((resolveClose, rejectClose) => {
      if (!server.listening) {
        resolveClose();
        return;
      }
      server.close((error) => error ? rejectClose(error) : resolveClose());
    }),
  };
}

const HELP = `Usage:
  node review.mjs --repo <path> --base <revision> --candidate <revision> [options]

Options:
  --repo <path>          Git repository (defaults to the current directory)
  --base <revision>      Base commit, tag, or revision
  --candidate <revision> Candidate commit, tag, or revision
  --path <path>          Repository-relative target; repeat for multiple paths
  --theme <theme.css>    Canonical html-theme/theme.css to inline
  --output-dir <path>    Reuse or create a durable review directory
  --no-open              Print the URL without opening a browser
  --help                 Show this help
`;

function parseArguments(arguments_) {
  const options = { repo: process.cwd(), paths: [], open: true };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--help") return { help: true };
    if (argument === "--no-open") {
      options.open = false;
      continue;
    }
    const field = {
      "--repo": "repo",
      "--base": "base",
      "--candidate": "candidate",
      "--theme": "themePath",
      "--output-dir": "outputDirectory",
    }[argument];
    if (field) {
      const value = arguments_[index + 1];
      if (value === undefined) throw new Error(`${argument} requires a value`);
      options[field] = value;
      index += 1;
      continue;
    }
    if (argument === "--path") {
      const value = arguments_[index + 1];
      if (value === undefined) throw new Error("--path requires a value");
      options.paths.push(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.base) throw new Error("--base is required");
  if (!options.candidate) throw new Error("--candidate is required");
  options.themePath ??= join(scriptDirectory, "..", "..", "html-theme", "theme.css");
  return options;
}

function openBrowser(url) {
  let command;
  let arguments_;
  if (process.platform === "darwin") {
    command = "open";
    arguments_ = ["-n", url];
  } else if (process.platform === "win32") {
    command = "cmd";
    arguments_ = ["/c", "start", "", url];
  } else {
    command = "xdg-open";
    arguments_ = [url];
  }
  const child = spawn(command, arguments_, { detached: true, stdio: "ignore" });
  child.on("error", (error) => console.error(`Could not open the browser: ${error.message}`));
  child.unref();
}

async function runCli(arguments_) {
  const options = parseArguments(arguments_);
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }
  const model = collectReviewModel(options);
  const outputDirectory = options.outputDirectory
    ? resolve(options.outputDirectory)
    : await mkdtemp(join(tmpdir(), "interactive-diff-review-"));
  await mkdir(outputDirectory, { recursive: true });
  const reviewPath = join(outputDirectory, "review.json");
  const htmlPath = join(outputDirectory, "review.html");
  const html = await generateReviewHtml({ model, reviewPath, themePath: resolve(options.themePath) });
  await writeFile(htmlPath, html, { mode: 0o600 });
  const session = await startReviewServer({ html, reviewPath, model });
  process.stdout.write(`Interactive diff review\nURL: ${session.url}\nJSON: ${reviewPath}\nHTML: ${htmlPath}\nStop: Ctrl-C\n`);
  if (options.open) openBrowser(session.url);

  await new Promise((resolveRun, rejectRun) => {
    let closing = false;
    const stop = async () => {
      if (closing) return;
      closing = true;
      try {
        await session.close();
        resolveRun();
      } catch (error) {
        rejectRun(error);
      }
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    session.server.once("close", () => {
      if (!closing) resolveRun();
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`interactive-diff-review: ${error.message}\n`);
    process.exitCode = 1;
  });
}
