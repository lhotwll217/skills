import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { generateReviewHtml, startReviewServer } from "../scripts/review.mjs";

function hasAgentBrowser() {
  try {
    execFileSync("agent-browser", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function manyFileModel() {
  const files = Array.from({ length: 24 }, (_, index) => {
    const path = `packages/deeply-nested-workspace/src/feature-${index}/a-very-long-module-name-${index}.integration.test.ts`;
    const changed = (line) => line === 10 || line === 11;
    const name = (line) => line === 10 ? `value${index}` : `other${index}`;
    const rows = Array.from({ length: 30 }, (_, line) => ({
      oldLine: line + 1,
      newLine: line + 1,
      oldText: changed(line) ? `const ${name(line)} = previousImplementation();` : `context line ${line}`,
      newText: changed(line) ? `const ${name(line)} = replacementImplementation();` : `context line ${line}`,
      oldKind: changed(line) ? "remove" : "context",
      newKind: changed(line) ? "add" : "context",
    }));
    return { path, additions: 2, deletions: 2, rows };
  });
  return {
    repository: "/tmp/a/long/repository/path/that/should/stay/collapsed/by/default",
    base: "5c11d4467509de298b99df3d3d3e2455888e81b2",
    candidate: "49937bad557e45f6bbf7437f07f3d225da1ca2c7",
    paths: files.map((file) => file.path),
    files,
  };
}

const JUMP_EVERY_FILE = `(async () => {
  const select = document.querySelector("#file-select");
  const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const results = [];
  for (const option of [...select.options].reverse()) {
    select.value = option.value;
    select.dispatchEvent(new Event("change"));
    await frames();
    const heading = document.getElementById(option.value).querySelector(".file-head");
    const box = heading.getBoundingClientRect();
    const headerBottom = document.querySelector("#topbar").getBoundingClientRect().bottom;
    results.push({
      visible: box.top >= headerBottom - 0.5 && box.bottom <= innerHeight,
      current: select.value === option.value,
      focused: document.activeElement === heading,
    });
  }
  window.scrollTo(0, document.documentElement.scrollHeight);
  const headerBottom = document.querySelector("#topbar").getBoundingClientRect().bottom;
  return {
    options: select.options.length,
    visible: results.filter((result) => result.visible).length,
    current: results.filter((result) => result.current).length,
    focused: results.filter((result) => result.focused).length,
    overflow: document.documentElement.scrollWidth - innerWidth,
    pathsShown: document.querySelector(".meta-panel").checkVisibility(),
    totals: [...document.querySelectorAll("#diff-totals > span")].map((part) => {
      const box = part.getBoundingClientRect();
      const shown = part.checkVisibility() && box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= headerBottom;
      return [part.textContent, part.className, shown];
    }),
  };
})()`;

const LAYOUT = `(() => {
  const rows = [...document.querySelectorAll(".file-review:first-child .row")];
  const visibleOld = rows.filter((row) => row.querySelector(".code.old").checkVisibility());
  const code = (side) => document.querySelector(".file-review:first-child .code." + side).getBoundingClientRect();
  return {
    codeShare: visibleOld.length ? (code("old").width + code("new").width) / innerWidth : code("new").width / innerWidth,
    misaligned: visibleOld.filter((row) => {
      const old = row.querySelector(".code.old").getBoundingClientRect();
      const current = row.querySelector(".code.new").getBoundingClientRect();
      return old.top !== current.top || old.height !== current.height;
    }).length,
    contextRowsShowingBothSides: rows.filter((row) => row.classList.contains("context") &&
      row.querySelector(".code.old").checkVisibility()).length,
    contextRows: rows.filter((row) => row.classList.contains("context")).length,
  };
})()`;

const CANDIDATE_DRAG_POINTS = `(() => {
  const cells = [...document.querySelectorAll(".file-review:first-child .code.new.add")];
  cells[0].scrollIntoView({ block: "center" });
  const point = (cell, offset) => {
    const range = document.createRange();
    range.setStart(cell.firstChild, offset);
    range.setEnd(cell.firstChild, offset + 1);
    const box = range.getBoundingClientRect();
    return [Math.round(box.left + 1), Math.round(box.top + box.height / 2)];
  };
  return [...point(cells[0], 15), ...point(cells[1], 21)];
})()`;

test("file navigation, metadata, comments, and load failure work in a real browser", {
  skip: hasAgentBrowser() ? false : "agent-browser is not installed",
  timeout: 120_000,
}, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "interactive-diff-browser-"));
  const reviewPath = join(directory, "review.json");
  const htmlPath = join(directory, "review.html");
  const model = manyFileModel();
  const html = await generateReviewHtml({ model, reviewPath });
  await writeFile(htmlPath, html);
  const session = await startReviewServer({ html, reviewPath, model });
  const browserSession = `interactive-diff-review-${randomUUID()}`;
  const run = (args, input) => new Promise((resolveRun, rejectRun) => {
    const child = execFile(
      "agent-browser",
      ["--session", browserSession, "--profile", join(directory, "profile"), ...args],
      { encoding: "utf8", timeout: 30_000 },
      (error, stdout) => error ? rejectRun(error) : resolveRun(stdout.trim()),
    );
    child.stdin.end(input);
  });
  const browser = (...args) => run(args);
  const evaluate = async (script) => JSON.parse(await run(["eval", "--stdin"], script));
  const savedComments = async () => JSON.parse(await readFile(reviewPath, "utf8")).comments;
  t.after(async () => {
    await browser("close").catch(() => {});
    await session.close();
  });

  await browser("open", session.url);
  await browser("wait", "--text", "Saved");
  for (const [width, height] of [[1280, 577], [390, 844]]) {
    await browser("set", "viewport", String(width), String(height));
    assert.deepEqual(await evaluate(JUMP_EVERY_FILE), {
      options: 24,
      visible: 24,
      current: 24,
      focused: 24,
      overflow: 0,
      pathsShown: false,
      totals: [["+48 added", "positive", true], ["−48 deleted", "negative", true], ["24 files", "file-count", true]],
    }, `every jump at ${width}x${height} shows its heading below the header and names it in the picker`);
    const layout = await evaluate(LAYOUT);
    if (width === 1280) {
      assert.ok(layout.codeShare > 0.5, `split code columns use most of a ${width}px viewport (${layout.codeShare})`);
      assert.equal(layout.misaligned, 0, "base and candidate cells share each row");
      assert.equal(layout.contextRowsShowingBothSides, layout.contextRows);
    } else {
      assert.equal(layout.contextRowsShowingBothSides, 0, "narrow screens show unchanged lines once");
    }
  }

  await browser("set", "viewport", "1280", "800");
  await evaluate(`new Promise((resolve) => { scrollTo(0, 0); requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))); })`);
  await browser("click", "#next-file");
  assert.deepEqual(await evaluate(`({ index: document.querySelector("#file-select").selectedIndex, focused: document.activeElement.matches(".file-head") })`), { index: 1, focused: true });
  await browser("click", "#previous-file");
  assert.equal(await evaluate(`document.querySelector("#file-select").selectedIndex`), 0);
  assert.equal(await evaluate(`document.body.dataset.comments`), "closed", "an unused comments panel takes no width");

  await browser("focus", "summary");
  await browser("press", "Enter");
  assert.equal(await evaluate(`document.querySelector(".meta-panel").innerText.includes(${JSON.stringify(model.paths[23])})`), true);
  await browser("press", "Enter");

  const [fromX, fromY, toX, toY] = await evaluate(CANDIDATE_DRAG_POINTS);
  await browser("mouse", "move", String(fromX), String(fromY));
  await browser("mouse", "down");
  await browser("mouse", "move", String(toX), String(toY));
  await browser("mouse", "up");
  await browser("wait", "#composer.visible");
  await browser("fill", "#comment-text", "First note");
  await browser("click", "#save-comment");
  await browser("wait", "--text", "First note");
  assert.deepEqual((await savedComments()).map(({ file, side, startLine, endLine, selectedText, comment }) => ({ file, side, startLine, endLine, selectedText, comment })), [
    {
      file: model.files[0].path,
      side: "new",
      startLine: 11,
      endLine: 12,
      selectedText: "replacementImplementation();\nconst other0 = replac",
      comment: "First note",
    },
  ], "a real drag across rows selects only the candidate side");
  assert.deepEqual(await evaluate(`({
    panel: document.body.dataset.comments,
    badges: [...document.querySelectorAll(".badge")].map((badge) => badge.closest(".code").id.split("-").slice(-2).join(":")),
    location: document.querySelector(".comment-location").textContent,
  })`), { panel: "open", badges: ["new:11"], location: `${model.files[0].path}:11–12` });

  await browser("focus", ".comment");
  await browser("press", "Escape");
  assert.deepEqual(await evaluate(`({ panel: document.body.dataset.comments, focus: document.activeElement.id })`), { panel: "closed", focus: "comments-toggle" });
  await browser("press", "Enter");
  assert.equal(await evaluate(`document.body.dataset.comments`), "open");

  await browser("find", "role", "button", "click", "--name", "Edit");
  await browser("fill", "#comment-text", "Edited note");
  await browser("click", "#save-comment");
  await browser("wait", "--text", "Edited note");
  await browser("reload");
  await browser("wait", "--text", "Edited note");
  assert.deepEqual((await savedComments()).map((comment) => comment.comment), ["Edited note"]);

  await browser("find", "role", "button", "click", "--name", "Delete");
  await browser("wait", "--text", "No comments yet.");
  await browser("reload");
  await browser("wait", "--fn", `document.querySelector("#save-status").textContent === "Saved"`);
  assert.deepEqual(await evaluate(`({ count: document.querySelector("#comment-count").textContent, panel: document.body.dataset.comments, badges: document.querySelectorAll(".badge").length })`), { count: "0", panel: "closed", badges: 0 });
  assert.deepEqual(await savedComments(), []);

  await browser("open", pathToFileURL(htmlPath).href);
  await browser("wait", "--text", "Not connected");
  const failure = await evaluate(`({
    files: document.querySelectorAll(".file-review").length,
    message: document.querySelector(".load-error").textContent,
  })`);
  assert.equal(failure.files, 24);
  assert.match(failure.message, /could not load review\.json/);
  assert.match(failure.message, /127\.0\.0\.1 URL the launcher printed/);
  assert.ok(failure.message.includes(reviewPath));
});
