#!/usr/bin/env node
// THROWAWAY PROTOTYPE for https://github.com/lhotwll217/skills/issues/1
import http from "node:http";
import { readFile, writeFile, rename, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(here, "review.html");
const reviewPath = join(here, ".prototype-review.json");

const initialState = {
  review: {
    repository: "/example/acme-catalog",
    base: "34018237",
    candidate: "d33665cc",
    paths: ["src/catalog.ts"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  comments: [],
};

try {
  await access(reviewPath);
} catch {
  await writeFile(reviewPath, `${JSON.stringify(initialState, null, 2)}\n`);
}

function send(response, status, type, body) {
  response.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    if (request.method === "GET" && pathname === "/") {
      const html = (await readFile(htmlPath, "utf8")).replace(
        "__REVIEW_PATH_JSON__",
        JSON.stringify(reviewPath),
      );
      send(response, 200, "text/html; charset=utf-8", html);
      return;
    }

    if (request.method === "GET" && pathname === "/review.json") {
      send(response, 200, "application/json; charset=utf-8", await readFile(reviewPath));
      return;
    }

    if (request.method === "POST" && pathname === "/review.json") {
      let body = "";
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 1_000_000) throw new Error("Review state is too large");
      }
      const state = JSON.parse(body);
      state.review.updatedAt = new Date().toISOString();
      const temporaryPath = `${reviewPath}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`);
      await rename(temporaryPath, reviewPath);
      send(response, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true }));
      return;
    }

    send(response, 404, "text/plain; charset=utf-8", "Not found");
  } catch (error) {
    send(response, 500, "application/json; charset=utf-8", JSON.stringify({ error: error.message }));
  }
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/?variant=sidebar`;
  console.log(`\nInteractive diff-review prototype\n${url}\nJSON: ${reviewPath}\nStop: Ctrl-C\n`);
  spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
