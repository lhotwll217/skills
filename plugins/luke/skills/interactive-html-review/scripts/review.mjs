#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const assetDirectory = join(scriptDirectory, "..", "assets");

const STATIC_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".json": "application/json; charset=utf-8",
};

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
    .replaceAll(" ", "\\u2028")
    .replaceAll(" ", "\\u2029");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function htmlModel(documentPath, html) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1].trim() || basename(documentPath);
  return { document: documentPath, title, sourceHash: hash(html) };
}

function requireString(value, field, maximumLength = 20_000) {
  if (typeof value !== "string") throw new Error(`Comment ${field} must be a string`);
  if (value.length > maximumLength) throw new Error(`Comment ${field} is too long`);
  return value;
}

function minimalRect(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const rect = {};
  for (const key of ["x", "y", "w", "h"]) {
    const value = Number(input[key]);
    if (Number.isFinite(value)) rect[key] = Math.round(value);
  }
  return Object.keys(rect).length === 4 ? rect : null;
}

function minimalAttributes(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const attributes = {};
  for (const [name, value] of Object.entries(input).slice(0, 16)) {
    if (!/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(name)) throw new Error("Element fingerprint contains an invalid attribute name");
    attributes[name] = requireString(value, `element attribute ${name}`, 240);
  }
  return attributes;
}

function minimalLandmark(input, field) {
  if (input === null || input === undefined) return null;
  if (typeof input !== "object" || Array.isArray(input)) throw new Error(`Element ${field} landmark must be an object`);
  return {
    tag: requireString(input.tag, `${field} tag`, 80),
    attributes: minimalAttributes(input.attributes),
    text: requireString(input.text, `${field} text`, 240),
  };
}

function minimalFingerprint(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Element fingerprint must be an object");
  return {
    tag: requireString(input.tag, "element tag", 80),
    attributes: minimalAttributes(input.attributes),
    text: requireString(input.text, "element text", 240),
    parent: minimalLandmark(input.parent, "parent"),
    previous: minimalLandmark(input.previous, "previous sibling"),
    next: minimalLandmark(input.next, "next sibling"),
  };
}

const ELEMENT_SELECTOR_KINDS = new Set(["durable-attribute", "id", "semantic-attribute", "class", "tag", "structural"]);
const ELEMENT_STATUSES = new Set(["resolved", "relocated", "ambiguous", "missing", "unsupported-boundary"]);

function minimalElementAnchor(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Comment element must be an object");
  if (input.version !== 1) throw new Error("Unsupported element anchor version");
  if (!Array.isArray(input.route) || input.route.length === 0 || input.route.length > 15) throw new Error("Element route must contain 1 to 15 steps");
  const route = input.route.map((step, index) => {
    if (!step || typeof step !== "object" || Array.isArray(step)) throw new Error("Element route step must be an object");
    if (step.kind === "shadow-root") return { kind: "shadow-root" };
    if (step.kind !== "element") throw new Error("Unknown element route step");
    if (!Array.isArray(step.selectors) || step.selectors.length === 0 || step.selectors.length > 16) throw new Error("Element route segment must contain 1 to 16 selectors");
    const selectors = step.selectors.map((selector) => {
      if (!selector || typeof selector !== "object" || Array.isArray(selector)) throw new Error("Element selector must be an object");
      const kind = requireString(selector.kind, "element selector kind", 40);
      if (!ELEMENT_SELECTOR_KINDS.has(kind)) throw new Error("Unknown element selector kind");
      const count = Number(selector.count);
      if (!Number.isInteger(count) || count < 1) throw new Error("Element selector count must be a positive integer");
      return {
        value: requireString(selector.value, "element selector", 2_000),
        kind,
        positional: selector.positional === true,
        count,
      };
    });
    if (index > 0 && input.route[index - 1]?.kind === "element") throw new Error("Element route steps must cross an explicit boundary");
    return { kind: "element", selectors, fingerprint: minimalFingerprint(step.fingerprint) };
  });
  if (route[0].kind !== "element" || route.at(-1).kind !== "element") throw new Error("Element route must start and end with an element");
  for (let index = 1; index < route.length; index += 1) {
    if (route[index].kind === route[index - 1].kind) throw new Error("Element route steps must alternate");
  }
  const clean = {
    version: 1,
    label: requireString(input.label, "element label", 500),
    route,
  };
  const rect = minimalRect(input.rect);
  if (rect) clean.rect = rect;
  return clean;
}

const SHOT_PATH_PATTERN = /^shots\/[0-9a-f-]{36}\.png$/;

export function minimalComment(comment) {
  if (!comment || typeof comment !== "object" || Array.isArray(comment)) throw new Error("Each comment must be an object");
  const hasScreenshot = typeof comment.screenshot === "string" && SHOT_PATH_PATTERN.test(comment.screenshot);
  const element = comment.element === undefined ? null : minimalElementAnchor(comment.element);
  const startOffset = Number(comment.startOffset);
  const endOffset = Number(comment.endOffset);
  if (!Number.isInteger(startOffset) || startOffset < 0 || !Number.isInteger(endOffset) || endOffset < startOffset || (endOffset === startOffset && !hasScreenshot && !element)) {
    throw new Error("Comment offsets must be integers in ascending order");
  }
  const clean = {
    id: requireString(comment.id, "id", 200),
    pageId: requireString(comment.pageId, "pageId", 200),
    section: requireString(comment.section, "section", 1_000),
    startOffset,
    endOffset,
    selectedText: requireString(comment.selectedText, "selectedText"),
    prefix: requireString(comment.prefix, "prefix", 1_000),
    suffix: requireString(comment.suffix, "suffix", 1_000),
    contentHash: requireString(comment.contentHash, "contentHash", 200),
    comment: requireString(comment.comment, "comment"),
  };
  if (hasScreenshot) {
    clean.screenshot = comment.screenshot;
    const rect = minimalRect(comment.rect);
    if (rect) clean.rect = rect;
  }
  if (element) {
    clean.element = element;
    if (ELEMENT_STATUSES.has(comment.elementStatus)) clean.elementStatus = comment.elementStatus;
    if (typeof comment.elementReason === "string") clean.elementReason = requireString(comment.elementReason, "element reason", 1_000);
  }
  if (comment.stale === true) {
    clean.stale = true;
    clean.staleReason = typeof comment.staleReason === "string" ? comment.staleReason : "Could not reliably locate this anchor.";
  }
  return clean;
}

function reviewMetadata(model, createdAt, updatedAt = new Date().toISOString()) {
  return { document: model.document, title: model.title, sourceHash: model.sourceHash, createdAt, updatedAt };
}

export function reconcileState(input, model, now = new Date().toISOString()) {
  const createdAt = typeof input?.review?.createdAt === "string" ? input.review.createdAt : now;
  const previousHash = input?.review?.sourceHash;
  const comments = Array.isArray(input?.comments) ? input.comments.map((comment) => {
    const clean = minimalComment(comment);
    if (previousHash && previousHash !== model.sourceHash) {
      if (!clean.stale && clean.selectedText) clean.needsRelocation = true;
      if (clean.element) clean.needsElementRelocation = true;
    }
    return clean;
  }) : [];
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

async function readRequestBody(request, limit, label) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > limit) throw new Error(`${label} is too large`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readRequestJson(request) {
  return JSON.parse((await readRequestBody(request, 1_000_000, "Review state")).toString("utf8"));
}

export async function generateReviewHtml({ model, documentHtml, reviewPath }) {
  const [overlayCss, clientJavaScript] = await Promise.all([
    readFile(join(assetDirectory, "review.css"), "utf8"),
    readFile(join(assetDirectory, "review-client.js"), "utf8"),
  ]);
  const bootstrap = `
<style id="__hr_style">
${overlayCss}
</style>
<script id="__hr_script">window.__INTERACTIVE_HTML_REVIEW__=${scriptJson({
    model,
    reviewPath,
  })};
${clientJavaScript}
</script>`;
  if (/<\/body>/i.test(documentHtml)) return documentHtml.replace(/<\/body>/i, `${bootstrap}\n</body>`);
  return `${documentHtml}\n${bootstrap}\n`;
}

function staticFilePath(documentDirectory, pathname) {
  const decoded = decodeURIComponent(pathname).replaceAll("\\", "/");
  if (decoded.includes("\0") || decoded.split("/").includes("..")) return null;
  const candidate = normalize(join(documentDirectory, decoded));
  if (candidate !== documentDirectory && !candidate.startsWith(documentDirectory + sep)) return null;
  return candidate;
}

export async function startReviewServer({ html, reviewPath, model, documentDirectory, persistReviewState = atomicWriteJson }) {
  const shotsDirectory = join(dirname(reviewPath), "shots");
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
          const nextState = {
            review: reviewMetadata(model, state.review.createdAt),
            comments: Array.isArray(input?.comments) ? input.comments.map(minimalComment) : [],
          };
          await persistReviewState(reviewPath, nextState);
          state = nextState;
          return nextState;
        });
        mutationQueue = mutation.then(() => undefined, () => undefined);
        return send(response, 200, "application/json; charset=utf-8", `${JSON.stringify(await mutation)}\n`);
      }
      if (request.method === "POST" && pathname === "/shots") {
        const body = await readRequestBody(request, 8_000_000, "Screenshot");
        if (body.length === 0) throw new Error("Empty screenshot");
        const shotName = `${randomUUID()}.png`;
        await mkdir(shotsDirectory, { recursive: true });
        await writeFile(join(shotsDirectory, shotName), body, { mode: 0o600 });
        return send(response, 200, "application/json; charset=utf-8", `${JSON.stringify({ path: `shots/${shotName}` })}\n`);
      }
      if (request.method === "GET" && /^\/shots\/[0-9a-f-]{36}\.png$/.test(pathname)) {
        try {
          return send(response, 200, "image/png", await readFile(join(shotsDirectory, basename(pathname))));
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
      if (request.method === "GET") {
        const filePath = staticFilePath(documentDirectory, pathname);
        const type = filePath ? STATIC_TYPES[extname(filePath).toLowerCase()] : undefined;
        if (filePath && type) {
          try {
            return send(response, 200, type, await readFile(filePath));
          } catch (error) {
            if (error.code !== "ENOENT" && error.code !== "EISDIR") throw error;
          }
        }
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
  node review.mjs --document <file.html> [options]

Options:
  --document <file.html>  HTML document to review; sibling assets are served read-only
  --output-dir <path>     Reuse or create a durable review directory
  --no-open               Print the URL without opening a browser
  --help                  Show this help
`;

function parseArguments(arguments_) {
  const options = { open: true };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--help") return { help: true };
    if (argument === "--no-open") { options.open = false; continue; }
    const field = { "--document": "documentPath", "--output-dir": "outputDirectory" }[argument];
    if (!field) throw new Error(`Unknown argument: ${argument}`);
    const value = arguments_[index + 1];
    if (value === undefined) throw new Error(`${argument} requires a value`);
    options[field] = value;
    index += 1;
  }
  if (!options.documentPath) throw new Error("--document is required");
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
  if (!/\.html?$/i.test(documentPath)) throw new Error(`Not an HTML file: ${documentPath}`);
  const documentHtml = await readFile(documentPath, "utf8");
  const model = htmlModel(documentPath, documentHtml);
  const outputDirectory = options.outputDirectory ? resolve(options.outputDirectory) : await mkdtemp(join(tmpdir(), "interactive-html-review-"));
  await mkdir(outputDirectory, { recursive: true });
  const reviewPath = join(outputDirectory, "review.json");
  const htmlPath = join(outputDirectory, "review.html");
  const html = await generateReviewHtml({ model, documentHtml, reviewPath });
  await writeFile(htmlPath, html, { mode: 0o600 });
  const session = await startReviewServer({ html, reviewPath, model, documentDirectory: dirname(documentPath) });
  process.stdout.write(`Interactive HTML review\nURL: ${session.url}\nJSON: ${reviewPath}\nHTML: ${htmlPath}\nStop: Ctrl-C\n`);
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
    process.stderr.write(`interactive-html-review: ${error.message}\n`);
    process.exitCode = 1;
  });
}
