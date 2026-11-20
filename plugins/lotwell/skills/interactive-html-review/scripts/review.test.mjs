import assert from "node:assert/strict";
import test from "node:test";

import { mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateReviewHtml, htmlModel, minimalComment, reconcileState, startReviewServer } from "./review.mjs";

function elementAnchor() {
  return {
    version: 1,
    label: "<button#save> “Save”",
    rect: { x: 20, y: 30, w: 100, h: 40 },
    route: [{
      kind: "element",
      selectors: [
        { value: "#save", kind: "id", positional: false, count: 1 },
        { value: "html > body > button", kind: "structural", positional: true, count: 1 },
      ],
      fingerprint: {
        tag: "button",
        attributes: { id: "save" },
        text: "Save",
        parent: { tag: "body", attributes: {}, text: "Save" },
        previous: null,
        next: null,
      },
    }],
  };
}

function elementComment(overrides = {}) {
  return {
    id: "comment-1",
    pageId: "document",
    section: "Fixture",
    startOffset: 0,
    endOffset: 0,
    selectedText: "",
    prefix: "",
    suffix: "",
    contentHash: "",
    comment: "Make this more prominent.",
    element: elementAnchor(),
    elementStatus: "resolved",
    ...overrides,
  };
}

test("element comments accept zero text offsets and preserve the compound anchor", () => {
  const clean = minimalComment(elementComment());
  assert.equal(clean.element.label, "<button#save> “Save”");
  assert.equal(clean.element.route[0].selectors[0].value, "#save");
  assert.deepEqual(clean.element.route[0].fingerprint.attributes, { id: "save" });
  assert.equal(clean.elementStatus, "resolved");
});

test("zero-length comments still require a screenshot or element reference", () => {
  const comment = elementComment();
  delete comment.element;
  assert.throws(() => minimalComment(comment), /ascending order/);
});

test("source changes request element re-resolution without rewriting the captured anchor", () => {
  const previousModel = htmlModel("/tmp/fixture.html", "<title>Fixture</title><button id=save>Save</button>");
  const currentModel = htmlModel("/tmp/fixture.html", "<title>Fixture</title><main><button id=save>Save</button></main>");
  const originalAnchor = elementAnchor();
  const state = reconcileState({
    review: { ...previousModel, createdAt: "2026-09-03T00:00:00.000Z" },
    comments: [elementComment({ element: originalAnchor })],
  }, currentModel, "2026-09-03T01:00:00.000Z");
  assert.equal(state.comments[0].needsElementRelocation, true);
  assert.deepEqual(state.comments[0].element, originalAnchor);
  assert.equal(state.review.sourceHash, currentModel.sourceHash);
});

test("Shift still works as a hold beside the clickable modes, and the dock shows its shortcuts", async () => {
  const model = htmlModel("/tmp/fixture.html", "<title>Fixture</title><body>Hi</body>");
  const html = await generateReviewHtml({ model, documentHtml: "<html><body>Hi</body></html>", reviewPath: "/tmp/review.json" });
  assert.match(html, /event\.key === "Shift" && !event\.repeat/);
  assert.match(html, /event\.key === "Shift" && pickerActive && touchMode !== "element"\) stopElementPicker\(\)/);
  assert.match(html, /title="Element: hold ⇧ and click an element"/);
  assert.match(html, /title="Area: hold ⌘ and drag a box"/);
  assert.doesNotMatch(html, /Shift\+E|⇧E|aria-pressed/);
});

test("element routes fail closed when their boundary sequence is malformed", () => {
  const comment = elementComment();
  comment.element.route.push(elementAnchor().route[0]);
  assert.throws(() => minimalComment(comment), /explicit boundary|alternate/);
});

test("an artifact build carries the title only, never the local document path", async () => {
  const model = htmlModel("/Users/someone/private/fixture.html", "<title>Fixture</title><body>Hi</body>");
  const html = await generateReviewHtml({ model, documentHtml: "<html><body>Hi</body></html>", host: "artifact" });
  assert.match(html, /"host":"artifact"/);
  assert.match(html, /"title":"Fixture"/);
  assert.doesNotMatch(html, /\/Users\/someone|reviewPath|sourceHash/);
});

test("the local build keeps its review path and defaults to the local host", async () => {
  const model = htmlModel("/tmp/fixture.html", "<title>Fixture</title><body>Hi</body>");
  const html = await generateReviewHtml({ model, documentHtml: "<html><body>Hi</body></html>", reviewPath: "/tmp/review.json" });
  assert.match(html, /"host":"local"/);
  assert.match(html, /"reviewPath":"\/tmp\/review.json"/);
});

test("touch modes are a radio group, so the desktop Shift gesture stays a hold", async () => {
  const model = htmlModel("/tmp/fixture.html", "<title>Fixture</title><body>Hi</body>");
  const html = await generateReviewHtml({ model, documentHtml: "<html><body>Hi</body></html>", reviewPath: "/tmp/review.json" });
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /role="radio" data-mode="text" aria-checked="true"/);
});

test("a link to a sibling page opens it in the same review with its own Comments", async () => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "hr-site-")));
  const output = await mkdtemp(join(tmpdir(), "hr-out-"));
  const documentPath = join(directory, "index.html");
  const documentHtml = '<title>Home</title><body><a href="other.html">Other</a></body>';
  await writeFile(documentPath, documentHtml);
  await writeFile(join(directory, "other.html"), "<title>Other</title><body>Other page</body>");
  const model = htmlModel(documentPath, documentHtml);
  const reviewPath = join(output, "review.json");
  const html = await generateReviewHtml({ model, documentHtml, reviewPath });
  const session = await startReviewServer({ html, reviewPath, model, documentDirectory: directory, documentPath });
  try {
    const other = await (await fetch(`${session.url}other.html`)).text();
    assert.match(other, /Other page/);
    assert.match(other, /"doc":"other.html"/);
    assert.match(other, /__hr_script/);
    const home = await (await fetch(`${session.url}index.html`)).text();
    assert.doesNotMatch(home, /"doc":/);
    assert.equal((await fetch(`${session.url}missing.html`)).status, 404);

    const comment = elementComment({ comment: "Fix this." });
    const saved = await (await fetch(`${session.url}review.json?doc=other.html`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ comments: [comment] }),
    })).json();
    assert.equal(saved.comments.length, 1);
    assert.equal(saved.review.title, "Other");
    assert.equal(JSON.parse(await readFile(reviewPath, "utf8")).comments.length, 0);
    const linkedPath = other.match(/"reviewPath":"([^"]+)"/)[1];
    assert.match(linkedPath, /pages\/other\.html-[0-9a-f]{8}\/review\.json$/);
    assert.equal(JSON.parse(await readFile(linkedPath, "utf8")).comments[0].comment, "Fix this.");
  } finally {
    await session.close();
  }
});

test("a reload serves the page as it is on disk now, and re-anchors its Comments", async () => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "hr-edit-")));
  const output = await mkdtemp(join(tmpdir(), "hr-edit-out-"));
  const documentPath = join(directory, "index.html");
  const documentHtml = '<title>Home</title><body><a href="other.html">Other</a> Old home</body>';
  await writeFile(documentPath, documentHtml);
  await writeFile(join(directory, "other.html"), "<title>Other</title><body>Old other</body>");
  const model = htmlModel(documentPath, documentHtml);
  const reviewPath = join(output, "review.json");
  const html = await generateReviewHtml({ model, documentHtml, reviewPath });
  const session = await startReviewServer({ html, reviewPath, model, documentDirectory: directory, documentPath });
  try {
    assert.match(await (await fetch(session.url)).text(), /Old home/);
    assert.match(await (await fetch(`${session.url}other.html`)).text(), /Old other/);
    await fetch(`${session.url}review.json?doc=other.html`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ comments: [elementComment({ comment: "Fix this." })] }),
    });

    await writeFile(documentPath, '<title>Home</title><body><a href="other.html">Other</a> New home</body>');
    await writeFile(join(directory, "other.html"), "<title>Other</title><main><body>New other</body></main>");

    const home = await (await fetch(session.url)).text();
    assert.match(home, /New home/);
    assert.doesNotMatch(home, /Old home/);
    assert.match(await (await fetch(`${session.url}index.html`)).text(), /New home/);
    const other = await (await fetch(`${session.url}other.html`)).text();
    assert.match(other, /New other/);
    assert.match(other, /__hr_script/);
    const state = await (await fetch(`${session.url}review.json?doc=other.html`)).json();
    assert.equal(state.comments[0].comment, "Fix this.");
    assert.equal(state.comments[0].needsElementRelocation, true);
    assert.equal(state.review.sourceHash, htmlModel(join(directory, "other.html"), "<title>Other</title><main><body>New other</body></main>").sourceHash);
  } finally {
    await session.close();
  }
});

test("the client lets same-review links navigate and opens links that leave in a new tab", async () => {
  const client = await readFile(new URL("../assets/review-client.js", import.meta.url), "utf8");
  assert.match(client, /staysInReview\(anchor\)\) return;/);
  assert.match(client, /window\.open\(anchor\.href, "_blank", "noopener"\)/);
  assert.doesNotMatch(client, /Link intercepted|Link leaves the review/);
});
