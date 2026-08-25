#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { marked } from "../vendor/marked/marked.esm.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const assetDirectory = join(scriptDirectory, "..", "assets");

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

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeRenderer() {
  const renderer = new marked.Renderer();
  renderer.html = ({ text }) => `<code class="raw-html">${escapeHtml(text)}</code>`;
  renderer.link = ({ href, tokens }) => `<span class="md-link" title="${escapeHtml(href)}">${renderer.parser.parseInline(tokens)}</span>`;
  renderer.image = ({ href, text }) => `<span class="image-alt" title="${escapeHtml(href)}">Image: ${escapeHtml(text)}</span>`;
  return renderer;
}

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|#39);/gi, (match, entity) => {
    if (entity.toLowerCase().startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#") && entity !== "#39") return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return named[entity.toLowerCase()] ?? match;
  });
}

function renderedText(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ""));
}

function tokenTitle(token) {
  return token?.text?.replace(/[*_`~]/g, "").trim() || "Document";
}

export function markdownModel(documentPath, markdown) {
  const tokens = marked.lexer(markdown, { gfm: true });
  const renderer = safeRenderer();
  const firstH1 = tokens.find((token) => token.type === "heading" && token.depth === 1);
  const title = tokenTitle(firstH1) || basename(documentPath);
  const html = marked.parser(tokens, { gfm: true, renderer });
  return {
    document: documentPath,
    title,
    sourceHash: hash(markdown),
    pages: [{ id: "document", index: 0, title, html, text: renderedText(html) }],
  };
}

function requireString(value, field) {
  if (typeof value !== "string") throw new Error(`Comment ${field} must be a string`);
  return value;
}

function minimalComment(comment) {
  if (!comment || typeof comment !== "object" || Array.isArray(comment)) throw new Error("Each comment must be an object");
  const startOffset = Number(comment.startOffset);
  const endOffset = Number(comment.endOffset);
  if (!Number.isInteger(startOffset) || startOffset < 0 || !Number.isInteger(endOffset) || endOffset <= startOffset) {
    throw new Error("Comment offsets must be integers in ascending order");
  }
  const clean = {
    id: requireString(comment.id, "id"),
    pageId: requireString(comment.pageId, "pageId"),
    section: requireString(comment.section, "section"),
    startOffset,
    endOffset,
    selectedText: requireString(comment.selectedText, "selectedText"),
    prefix: requireString(comment.prefix, "prefix"),
    suffix: requireString(comment.suffix, "suffix"),
    contentHash: requireString(comment.contentHash, "contentHash"),
    comment: requireString(comment.comment, "comment"),
  };
  if (comment.stale === true) {
    clean.stale = true;
    clean.staleReason = typeof comment.staleReason === "string" ? comment.staleReason : "Could not reliably locate this anchor.";
  }
  return clean;
}

function locateNeedle(pages, comment) {
  const needle = `${comment.prefix}${comment.selectedText}${comment.suffix}`;
  const candidates = [];
  for (const page of pages) {
    let from = 0;
    while (from <= page.text.length) {
      const index = page.text.indexOf(needle, from);
      if (index < 0) break;
      candidates.push({ page, startOffset: index + comment.prefix.length, endOffset: index + comment.prefix.length + comment.selectedText.length });
      from = index + 1;
    }
  }
  return candidates;
}

function reconcileComment(input, model) {
  const comment = minimalComment(input);
  const page = model.pages.find((candidate) => candidate.id === comment.pageId);
  const exactText = page?.text.slice(comment.startOffset, comment.endOffset);
  const exactContext = page?.text.slice(comment.startOffset - comment.prefix.length, comment.endOffset + comment.suffix.length);
  if (page && exactText === comment.selectedText && hash(exactContext) === comment.contentHash) {
    const { stale, staleReason, ...anchored } = comment;
    return { ...anchored, section: page.title };
  }
  const candidates = locateNeedle(model.pages, comment).filter((candidate) => {
    const context = candidate.page.text.slice(
      candidate.startOffset - comment.prefix.length,
      candidate.endOffset + comment.suffix.length,
    );
    return hash(context) === comment.contentHash;
  });
  if (candidates.length === 1) {
    const candidate = candidates[0];
    const { stale, staleReason, ...anchored } = comment;
    return {
      ...anchored,
      pageId: candidate.page.id,
      section: candidate.page.title,
      startOffset: candidate.startOffset,
      endOffset: candidate.endOffset,
    };
  }
  return { ...comment, stale: true, staleReason: "Could not reliably locate this anchor in the current Markdown." };
}

function reviewMetadata(model, createdAt, updatedAt = new Date().toISOString()) {
  return {
    document: model.document,
    title: model.title,
    sourceHash: model.sourceHash,
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

export async function generateReviewHtml({ model, reviewPath, themePath }) {
  const [themeCss, reviewCss, clientJavaScript] = await Promise.all([
    readFile(themePath, "utf8"),
    readFile(join(assetDirectory, "review.css"), "utf8"),
    readFile(join(assetDirectory, "review-client.js"), "utf8"),
  ]);
  const page = model.pages[0];
  return `<!doctype html>
<html lang="en" data-theme="gray">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<title>Interactive Markdown review — ${escapeHtml(model.title)}</title>
<style>
${themeCss}
${reviewCss}
</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-row">
    <div><div class="label">Interactive Markdown review</div><h1 class="title">${escapeHtml(model.title)}</h1></div>
    <div class="save-status" id="save-status">Loading…</div>
  </div>
  <div class="meta"><span>Document: ${escapeHtml(model.document)}</span><span class="artifact-path">JSON: ${escapeHtml(reviewPath)}</span></div>
</header>
<div class="layout">
  <main class="main">
    <article class="document" data-page="${escapeHtml(page.id)}"><div class="document-body">${page.html}</div></article>
    <div class="selection-help">Highlight any document text to add a nearby Comment. Every add, edit, and delete autosaves.</div>
  </main>
  <aside class="sidebar"><section><div class="label">Comments · <span id="comment-count">0</span></div><div id="comments"></div></section></aside>
</div>
<div class="composer" id="composer" role="dialog" aria-modal="false" aria-labelledby="composer-title">
  <div class="label" id="composer-title">Comment on selection</div>
  <blockquote id="selected-quote"></blockquote>
  <textarea id="comment-text" placeholder="What should the agent understand or change?"></textarea>
  <div class="actions"><button class="btn btn-outline" id="cancel" type="button">Cancel</button><button class="btn btn-primary" id="save-comment" type="button">Add Comment</button></div>
</div>
<script>window.__INTERACTIVE_MARKDOWN_REVIEW__=${scriptJson({
    model: { document: model.document, title: model.title, sourceHash: model.sourceHash, pages: model.pages.map(({ id, index, title, text }) => ({ id, index, title, text })) },
    reviewPath,
  })};
${clientJavaScript}
</script>
</body>
</html>
`;
}

export async function startReviewServer({ html, reviewPath, model, persistReviewState = atomicWriteJson }) {
  let existing = null;
  try {
    existing = JSON.parse(await readFile(reviewPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let state = reconcileState(existing, model);
  await persistReviewState(reviewPath, state);
  let mutationQueue = Promise.resolve();
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://127.0.0.1").pathname;
      if (request.method === "GET" && pathname === "/") return send(response, 200, "text/html; charset=utf-8", html);
      if (request.method === "GET" && pathname === "/review.json") return send(response, 200, "application/json; charset=utf-8", `${JSON.stringify(state)}\n`);
      if (request.method === "POST" && pathname === "/review.json") {
        const submitted = readRequestJson(request);
        const mutation = mutationQueue.then(async () => {
          const input = await submitted;
          const nextState = reconcileState({ review: state.review, comments: input?.comments }, model);
          await persistReviewState(reviewPath, nextState);
          state = nextState;
          return nextState;
        });
        mutationQueue = mutation.then(() => undefined, () => undefined);
        return send(response, 200, "application/json; charset=utf-8", `${JSON.stringify(await mutation)}\n`);
      }
      return send(response, 404, "text/plain; charset=utf-8", "Not found");
    } catch (error) {
      return send(response, 400, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
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
      if (!server.listening) return resolveClose();
      server.close((error) => error ? rejectClose(error) : resolveClose());
    }),
  };
}

const HELP = `Usage:
  node review.mjs --document <file.md> [options]

Options:
  --document <file.md>  Markdown document to review
  --theme <theme.css>   Canonical html-theme/theme.css to inline
  --output-dir <path>   Reuse or create a durable review directory
  --no-open             Print the URL without opening a browser
  --help                Show this help
`;

function parseArguments(arguments_) {
  const options = { open: true };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--help") return { help: true };
    if (argument === "--no-open") { options.open = false; continue; }
    const field = { "--document": "documentPath", "--theme": "themePath", "--output-dir": "outputDirectory" }[argument];
    if (!field) throw new Error(`Unknown argument: ${argument}`);
    const value = arguments_[index + 1];
    if (value === undefined) throw new Error(`${argument} requires a value`);
    options[field] = value;
    index += 1;
  }
  if (!options.documentPath) throw new Error("--document is required");
  options.themePath ??= join(scriptDirectory, "..", "..", "html-theme", "theme.css");
  return options;
}

function openBrowser(url) {
  let command;
  let arguments_;
  if (process.platform === "darwin") { command = "open"; arguments_ = ["-n", url]; }
  else if (process.platform === "win32") { command = "cmd"; arguments_ = ["/c", "start", "", url]; }
  else { command = "xdg-open"; arguments_ = [url]; }
  const child = spawn(command, arguments_, { detached: true, stdio: "ignore" });
  child.on("error", (error) => console.error(`Could not open the browser: ${error.message}`));
  child.unref();
}

async function runCli(arguments_) {
  const options = parseArguments(arguments_);
  if (options.help) return process.stdout.write(HELP);
  const documentPath = await realpath(resolve(options.documentPath));
  const info = await stat(documentPath);
  if (!info.isFile()) throw new Error(`Not a file: ${documentPath}`);
  if (!/\.md(?:own)?$/i.test(documentPath)) throw new Error(`Not a Markdown file: ${documentPath}`);
  const markdown = await readFile(documentPath, "utf8");
  const model = markdownModel(documentPath, markdown);
  const outputDirectory = options.outputDirectory ? resolve(options.outputDirectory) : await mkdtemp(join(tmpdir(), "interactive-markdown-review-"));
  await mkdir(outputDirectory, { recursive: true });
  const reviewPath = join(outputDirectory, "review.json");
  const htmlPath = join(outputDirectory, "review.html");
  const html = await generateReviewHtml({ model, reviewPath, themePath: resolve(options.themePath) });
  await writeFile(htmlPath, html, { mode: 0o600 });
  const session = await startReviewServer({ html, reviewPath, model });
  process.stdout.write(`Interactive Markdown review\nURL: ${session.url}\nJSON: ${reviewPath}\nHTML: ${htmlPath}\nStop: Ctrl-C\n`);
  if (options.open) openBrowser(session.url);
  await new Promise((resolveRun, rejectRun) => {
    let closing = false;
    const stop = async () => {
      if (closing) return;
      closing = true;
      try { await session.close(); resolveRun(); } catch (error) { rejectRun(error); }
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    session.server.once("close", () => { if (!closing) resolveRun(); });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runCli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`interactive-markdown-review: ${error.message}\n`);
    process.exitCode = 1;
  });
}
